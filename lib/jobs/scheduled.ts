import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import { formatUsd, isPaidPlan, priceFor, standingOf } from "@/lib/plans";
import { emails } from "@/lib/email/templates";
import { sendOnce } from "@/lib/email/mailer";
import { renewPlan } from "@/lib/billing/service";
import { deleteOrphanedAssets } from "@/lib/assets/repository";
import { pruneRateLimits } from "@/lib/security/rate-limit";
import { syncGitHub } from "@/lib/autoupdate/github-sync";
import { advanceOrders, remindRenewals } from "@/lib/domains/service";
import { runDueInvestigations } from "@/lib/investigator/run";
import { pruneViews } from "@/lib/analytics/track";

/**
 * Everything that happens on a schedule. Run hourly (see docker-compose's
 * `cron` service, or any scheduler calling POST /api/cron with CRON_SECRET).
 * Every step is idempotent, so running twice or late is harmless.
 */

const LOCK = 72_901_338;
const day = (date: Date) => date.toISOString().slice(0, 10);

interface Row { id: string; name: string | null; email: string | null; plan: string; plan_interval: string; plan_expires_at: Date | null; auto_renew: boolean; emails_opt_out: boolean; created_at: Date }

async function lifecycleEmails(): Promise<number> {
  let sent = 0;
  const users = await db.query<Row>(
    `SELECT id, name, email, plan, plan_interval, plan_expires_at, auto_renew, emails_opt_out, created_at FROM app_users
     WHERE email IS NOT NULL AND (created_at > NOW() - INTERVAL '3 days' OR (plan = 'pro' AND plan_expires_at < NOW() + INTERVAL '15 days' AND plan_expires_at > NOW() - INTERVAL '15 days'))`,
  );
  for (const user of users.rows) {
    const to = user.email!;
    const send = async (key: string, kind: string, mail: { subject: string; text: string; html: string }) => { if (await sendOnce(key, user.id, kind, { to, ...mail })) sent += 1; };
    if (user.created_at > new Date(Date.now() - 3 * 86_400_000)) await send(`welcome:${user.id}`, "welcome", emails.welcome(user.name));
    if (user.emails_opt_out || !isPaidPlan(user.plan) || !user.plan_expires_at) continue;
    const { standing, daysLeft, plan, interval } = standingOf(user);
    const period = day(user.plan_expires_at);
    // Monthly payers aren't emailed every month; yearly payers hear two weeks ahead.
    if (standing === "active" && plan.id === "pro" && interval === "year" && daysLeft <= 14) await send(`renewal-soon:${user.id}:${period}`, "renewal-soon", emails.renewalSoon(user.name, plan.name, formatUsd(priceFor("pro", interval)), user.plan_expires_at, user.auto_renew, interval));
    if (standing === "grace" && daysLeft <= 3) await send(`pro-ending:${user.id}:${period}`, "pro-ending", emails.proEnding(user.name, daysLeft));
  }
  return sent;
}

async function renewals(): Promise<Record<string, number>> {
  const due = await db.query<{ id: string }>("SELECT id FROM app_users WHERE plan = 'pro' AND auto_renew AND stripe_payment_method IS NOT NULL AND plan_expires_at BETWEEN NOW() - INTERVAL '7 days' AND NOW() + INTERVAL '3 days'");
  const counts: Record<string, number> = { renewed: 0, failed: 0, skipped: 0 };
  for (const row of due.rows) counts[await renewPlan(row.id)]! += 1;
  return counts;
}

async function autoUpdates(): Promise<{ github: number; digests: number }> {
  const result = { github: 0, digests: 0 };
  // GitHub: weekly for plans with auto-sync, a batch per run to stay within GitHub's limits.
  const github = await db.query<{ id: string; github_username: string; plan: string; plan_expires_at: Date | null }>(
    `SELECT id, github_username, plan, plan_expires_at FROM app_users WHERE auto_update AND github_username IS NOT NULL
     AND (last_synced_at IS NULL OR last_synced_at < NOW() - INTERVAL '7 days') ORDER BY last_synced_at NULLS FIRST LIMIT 25`,
  );
  for (const row of github.rows) {
    const standing = standingOf(row);
    if (!standing.plan.autoSync) continue;
    try { result.github += await syncGitHub(row.id, row.github_username); } catch (error) { console.error("GitHub sync failed", row.id, (error as Error).message); }
  }
  // News about the owner comes from the Investigator now, on the schedule they chose.
  // One digest a week for anyone with new suggestions.
  const week = `${new Date().getUTCFullYear()}-${Math.ceil((Date.now() - Date.UTC(new Date().getUTCFullYear(), 0, 1)) / (7 * 86_400_000))}`;
  const pending = await db.query<{ id: string; name: string | null; email: string; count: string }>(
    `SELECT u.id, u.name, u.email, COUNT(*) AS count FROM profile_suggestions s JOIN app_users u ON u.id = s.owner_id
     WHERE s.status = 'pending' AND s.created_at > NOW() - INTERVAL '7 days' AND u.email IS NOT NULL AND NOT u.emails_opt_out GROUP BY u.id`,
  );
  for (const row of pending.rows) if (await sendOnce(`suggestions:${row.id}:${week}`, row.id, "suggestions", { to: row.email, ...emails.suggestions(row.name, Number(row.count)) })) result.digests += 1;
  return result;
}

async function domainOrders(): Promise<number> {
  const owners = await db.query<{ owner_id: string }>("SELECT DISTINCT owner_id FROM domain_orders WHERE status IN ('paid', 'registering', 'configuring')");
  for (const row of owners.rows) await advanceOrders(row.owner_id).catch((error) => console.error("Domain order step failed", row.owner_id, error));
  return owners.rowCount ?? 0;
}

/** Runs every job once. Returns a summary for logs. A second run started meanwhile exits immediately. */
export async function runScheduledJobs(): Promise<Record<string, unknown>> {
  await ensureSchema();
  const client = await db.connect();
  try {
    const locked = await client.query<{ ok: boolean }>("SELECT pg_try_advisory_lock($1) AS ok", [LOCK]);
    if (!locked.rows[0]?.ok) return { skipped: "another run is in progress" };
    const summary: Record<string, unknown> = {};
    const step = async (name: string, job: () => Promise<unknown>) => {
      try { summary[name] = await job(); } catch (error) { console.error(`Scheduled job ${name} failed`, error); summary[name] = { error: (error as Error).message }; }
    };
    await step("renewals", renewals);
    await step("emails", lifecycleEmails);
    await step("autoUpdates", autoUpdates);
    await step("domainOrders", domainOrders);
    await step("domainRenewals", remindRenewals);
    await step("investigator", () => runDueInvestigations());
    await step("orphanedImages", deleteOrphanedAssets);
    await step("rateLimits", pruneRateLimits);
    await step("oldVisits", pruneViews);
    return summary;
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [LOCK]).catch(() => undefined);
    client.release();
  }
}

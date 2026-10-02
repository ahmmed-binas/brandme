import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import { GRACE_DAYS, PLANS, formatUsd, isPaidPlan, standingOf } from "@/lib/plans";
import { emails } from "@/lib/email/templates";
import { sendOnce } from "@/lib/email/mailer";
import { renewPlan } from "@/lib/billing/service";
import { grantCredits } from "@/lib/billing/credits";
import { deleteOrphanedAssets } from "@/lib/assets/repository";
import { syncGitHub } from "@/lib/autoupdate/github-sync";
import { runResearch } from "@/lib/autoupdate/research";
import { openAi, platformAiConfigured, settleAi, sumUsage } from "@/lib/ai/metering";
import { advanceOrders, remindRenewals } from "@/lib/domains/service";
import { standardContentSchema } from "@/lib/portfolio/schema";
import { getUserById } from "@/utils/user-account";

/**
 * Everything that happens on a schedule. Run hourly (see docker-compose's
 * `cron` service, or any scheduler calling POST /api/cron with CRON_SECRET).
 * Every step is idempotent, so running twice or late is harmless.
 */

const LOCK = 72_901_338;
const day = (date: Date) => date.toISOString().slice(0, 10);

interface Row { id: string; name: string | null; email: string | null; plan: string; trial_ends_at: Date; plan_expires_at: Date | null; auto_renew: boolean; emails_opt_out: boolean; created_at: Date }

async function lifecycleEmails(): Promise<number> {
  let sent = 0;
  const users = await db.query<Row>(
    `SELECT id, name, email, plan, trial_ends_at, plan_expires_at, auto_renew, emails_opt_out, created_at FROM app_users
     WHERE email IS NOT NULL AND (created_at > NOW() - INTERVAL '3 days' OR trial_ends_at > NOW() - INTERVAL '30 days' OR plan_expires_at < NOW() + INTERVAL '15 days')`,
  );
  for (const user of users.rows) {
    const to = user.email!;
    const send = async (key: string, kind: string, mail: { subject: string; text: string; html: string }) => { if (await sendOnce(key, user.id, kind, { to, ...mail })) sent += 1; };
    if (user.created_at > new Date(Date.now() - 3 * 86_400_000)) await send(`welcome:${user.id}`, "welcome", emails.welcome(user.name));
    if (user.emails_opt_out) continue;
    const { standing, daysLeft, endsAt, plan } = standingOf(user);
    const period = day(endsAt);
    if (standing === "trial" && daysLeft <= 3) await send(`trial-soon:${user.id}:${period}`, "trial-soon", emails.trialEndingSoon(user.name, daysLeft));
    if (standing === "active" && daysLeft <= 14 && isPaidPlan(user.plan)) await send(`renewal-soon:${user.id}:${period}`, "renewal-soon", emails.renewalSoon(user.name, plan.name, formatUsd(PLANS[user.plan].yearlyCents), endsAt, user.auto_renew));
    if (standing === "grace") {
      const graceEnds = new Date(endsAt.getTime() + GRACE_DAYS * 86_400_000);
      if (user.plan === "trial") await send(`trial-ended:${user.id}:${period}`, "trial-ended", emails.trialEnded(user.name, graceEnds));
      if (daysLeft <= 3) await send(`grace-ending:${user.id}:${period}`, "grace-ending", emails.graceEnding(user.name, daysLeft));
    }
    if (standing === "paused") await send(`paused:${user.id}:${period}`, "paused", emails.paused(user.name));
  }
  return sent;
}

async function renewals(): Promise<Record<string, number>> {
  const due = await db.query<{ id: string }>("SELECT id FROM app_users WHERE plan IN ('basic', 'pro', 'premium') AND auto_renew AND stripe_payment_method IS NOT NULL AND plan_expires_at BETWEEN NOW() - INTERVAL '7 days' AND NOW() + INTERVAL '3 days'");
  const counts: Record<string, number> = { renewed: 0, failed: 0, skipped: 0 };
  for (const row of due.rows) counts[await renewPlan(row.id)]! += 1;
  return counts;
}

async function monthlyCredits(): Promise<number> {
  const month = new Date().toISOString().slice(0, 7);
  const users = await db.query<{ id: string; plan: string }>("SELECT id, plan FROM app_users WHERE plan IN ('pro', 'premium') AND plan_expires_at > NOW()");
  let granted = 0;
  for (const user of users.rows) {
    const credits = PLANS[user.plan as "pro" | "premium"].monthlyCredits;
    if (credits && (await grantCredits(user.id, credits, `${PLANS[user.plan as "pro"].name} monthly credits`, `monthly:${user.id}:${month}`)) !== null) granted += 1;
  }
  return granted;
}

async function autoUpdates(): Promise<{ github: number; research: number; digests: number }> {
  const result = { github: 0, research: 0, digests: 0 };
  // GitHub: weekly for plans with auto-sync, a batch per run to stay within GitHub's limits.
  const github = await db.query<{ id: string; github_username: string; plan: string; trial_ends_at: Date; plan_expires_at: Date | null }>(
    `SELECT id, github_username, plan, trial_ends_at, plan_expires_at FROM app_users WHERE auto_update AND github_username IS NOT NULL
     AND (last_synced_at IS NULL OR last_synced_at < NOW() - INTERVAL '7 days') ORDER BY last_synced_at NULLS FIRST LIMIT 25`,
  );
  for (const row of github.rows) {
    const standing = standingOf(row);
    if (!standing.plan.autoSync || standing.standing === "paused") continue;
    try { result.github += await syncGitHub(row.id, row.github_username); } catch (error) { console.error("GitHub sync failed", row.id, (error as Error).message); }
  }
  // Research: on the plan's schedule, paid with the plan's monthly credits (or the owner's key).
  const research = await db.query<{ id: string; plan: string; last_research_at: Date | null }>(
    "SELECT id, plan, last_research_at FROM app_users WHERE auto_update AND plan IN ('pro', 'premium') AND plan_expires_at > NOW() ORDER BY last_research_at NULLS FIRST LIMIT 5",
  );
  for (const row of research.rows) {
    const every = PLANS[row.plan as "pro" | "premium"].researchEveryDays;
    if (!every || (row.last_research_at && row.last_research_at.getTime() > Date.now() - every * 86_400_000)) continue;
    const user = await getUserById(row.id);
    if (!user || (!user.hasOwnKey && !platformAiConfigured())) continue;
    const draft = await db.query<{ content: unknown }>("SELECT content FROM portfolios WHERE owner_id = $1 ORDER BY updated_at DESC LIMIT 1", [row.id]);
    const content = standardContentSchema.safeParse(draft.rows[0]?.content);
    if (!content.success || !content.data.name) continue;
    const gate = await openAi(user);
    if (!gate.ok) continue; // Out of credits or over budget: try again next time.
    try {
      const outcome = await runResearch(gate.access.client, row.id, content.data);
      await settleAi(gate.access, outcome.usage.length ? sumUsage(outcome.usage) : null, "Scheduled career research");
      if (outcome.ok) result.research += outcome.added;
    } catch (error) { console.error("Research failed", row.id, (error as Error).message); }
  }
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
    await step("monthlyCredits", monthlyCredits);
    await step("autoUpdates", autoUpdates);
    await step("domainOrders", domainOrders);
    await step("domainRenewals", remindRenewals);
    await step("orphanedImages", deleteOrphanedAssets);
    return summary;
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [LOCK]).catch(() => undefined);
    client.release();
  }
}

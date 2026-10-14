import { isInternalEmail } from "@/lib/accounts/internal";
import { brand } from "@/lib/brand";
import { escape, renderEmail } from "@/lib/email/layout";
import { sendMail, supportInbox } from "@/lib/email/mailer";
import { rateLimit } from "@/lib/security/rate-limit";
import { siteUrl } from "@/lib/site";
import { db } from "@/utils/db";
import { databaseConfigured, ensureSchema } from "@/utils/db-schema";

/**
 * Instant emails to the owner for moments that matter: a new lead, a new
 * sign-up, or errors piling up. The one exception to "email only every two
 * days" (the owner asked for it). Sent by the server itself, no AI involved.
 *
 * At most ALERTS_PER_DAY a day so the inbox never floods; anything beyond that
 * still shows in the two-day report. An alert never breaks the page that
 * triggered it: every failure is logged and swallowed.
 */

const ALERTS_PER_DAY = 5;
/** Server errors in one hour that count as "piling up", and the quiet time between two such alerts. */
const ERROR_SPIKE = 5;
const ERROR_ALERT_GAP_SECONDS = 3 * 3600;

export async function alertOwner(subject: string, lines: string[], link?: { label: string; url: string }) {
  try {
    const to = supportInbox();
    if (!to || !databaseConfigured()) return;
    if (!(await rateLimit("owner-alert", ALERTS_PER_DAY, 86_400))) return;
    const body = [
      ...lines.map((line) => `<p style="margin:0 0 12px">${escape(line)}</p>`),
      link
        ? `<p style="margin:20px 0 0"><a href="${escape(link.url)}" style="display:inline-block;background:#15140f;color:#f4f0e8;text-decoration:none;padding:11px 18px;border-radius:999px;font-size:14px">${escape(link.label)}</a></p>`
        : "",
    ].join("\n");
    await sendMail({
      to,
      subject: `[${brand.name}] ${subject}`,
      text: [...lines, link ? `${link.label}: ${link.url}` : ""].filter(Boolean).join("\n\n"),
      html: renderEmail({
        preheader: lines[0] ?? subject,
        body,
        footer: `An instant alert from ${brand.name} (at most ${ALERTS_PER_DAY} a day).`,
      }),
    });
  } catch (error) {
    console.error("Owner alert not sent", (error as Error).message);
  }
}

/** A new account: the start of a customer. */
export async function alertNewSignUp(name: string | null, email: string | null, method: string) {
  if (isInternalEmail(email)) return;
  await alertOwner(
    `New sign-up: ${name || email || "a new customer"}`,
    [
      `${name || "Someone"}${email ? ` (${email})` : ""} just created a ${brand.name} account with ${method}.`,
      "A short, friendly welcome from you makes them far more likely to publish a site.",
    ],
    email ? { label: "Say hello", url: `mailto:${email}` } : undefined,
  );
}

/**
 * Records a server error (no secrets or personal data: method, path and the
 * error's first line), and alerts the owner when they pile up.
 */
export async function recordServerError(method: string, path: string, message: string) {
  try {
    if (!databaseConfigured()) return;
    await ensureSchema();
    await db.query("INSERT INTO app_errors (method, path, message) VALUES ($1, $2, $3)", [
      method.slice(0, 10),
      path.slice(0, 300),
      message.split("\n")[0]!.slice(0, 300),
    ]);
    const recent = await db.query<{ n: string }>(
      "SELECT COUNT(*) AS n FROM app_errors WHERE at > NOW() - INTERVAL '1 hour'",
    );
    if (Number(recent.rows[0]?.n ?? 0) < ERROR_SPIKE) return;
    if (!(await rateLimit("error-spike-alert", 1, ERROR_ALERT_GAP_SECONDS))) return;
    await alertOwner(
      "Errors are piling up",
      [
        `${recent.rows[0]!.n} server errors in the last hour. The latest: ${method} ${path}: ${message.split("\n")[0]!.slice(0, 160)}`,
        "Ahmed Agent fixes errors at the next run. If something important is broken, message Ahmed Agent in Claude now.",
      ],
      { label: "Open kitefolio.com", url: siteUrl },
    );
  } catch {
    // Recording an error must never cause another one.
  }
}

/** The most frequent recent server errors, for the agent's report. */
export async function recentErrors(
  hours = 48,
): Promise<Array<{ path: string; message: string; count: number }>> {
  await ensureSchema();
  const rows = await db.query<{ path: string; message: string; n: string }>(
    `SELECT path, message, COUNT(*) AS n FROM app_errors WHERE at > NOW() - make_interval(hours => $1)
     GROUP BY path, message ORDER BY n DESC LIMIT 10`,
    [hours],
  );
  return rows.rows.map((row) => ({ path: row.path, message: row.message, count: Number(row.n) }));
}

/** Keeps a month of errors. */
export async function pruneErrors(): Promise<number> {
  await ensureSchema();
  return (await db.query("DELETE FROM app_errors WHERE at < NOW() - INTERVAL '30 days'")).rowCount ?? 0;
}

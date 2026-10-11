import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import { brand } from "@/lib/brand";
import { siteUrl } from "@/lib/site";
import { sendOnce, supportInbox } from "@/lib/email/mailer";

/**
 * The owner's daily email: what happened on the site in the last 24 hours.
 * Sent once a day by the hourly job (lib/jobs/scheduled.ts) to SMTP_TO, after
 * 9:00 in Dubai. The same numbers are served to the owner's agent at
 * GET /api/agent/report, so it can suggest what to do next.
 */

/** Dubai is UTC+4 all year (no daylight saving). */
const DUBAI_OFFSET_HOURS = 4;
const SEND_AFTER_HOUR = 9;

export interface DailyReport {
  /** The Dubai date the report is for, e.g. "2026-10-12". */
  date: string;
  visitors: number;
  pageViews: number;
  /** Visitors in the 24 hours before that, to show the trend. */
  visitorsBefore: number;
  topPages: Array<{ path: string; views: number }>;
  topReferrers: Array<{ referrer: string; visits: number }>;
  newAccounts: number;
  totalAccounts: number;
  portfoliosPublished: number;
  voicesMade: number;
  voiceClips: number;
  /** When the voice engine on the owner's PC last asked for work; null if never. */
  voiceEngineSeenAt: string | null;
}

const count = async (sql: string): Promise<number> =>
  Number((await db.query<{ n: string }>(sql)).rows[0]?.n ?? 0);

export async function loadDailyReport(): Promise<DailyReport> {
  await ensureSchema();
  const topPages = await db.query<{ path: string; views: string }>(
    `SELECT path, COUNT(*) AS views FROM page_views
     WHERE at > NOW() - INTERVAL '24 hours' AND kind = 'site'
     GROUP BY path ORDER BY views DESC LIMIT 8`,
  );
  const topReferrers = await db.query<{ referrer: string; visits: string }>(
    `SELECT referrer, COUNT(DISTINCT visitor) AS visits FROM page_views
     WHERE at > NOW() - INTERVAL '24 hours' AND referrer IS NOT NULL AND referrer <> ''
     GROUP BY referrer ORDER BY visits DESC LIMIT 5`,
  );
  const engine = await db.query<{ seen_at: Date }>("SELECT MAX(seen_at) AS seen_at FROM tool_workers");
  return {
    date: dubaiDate(),
    visitors: await count(
      "SELECT COUNT(DISTINCT visitor) AS n FROM page_views WHERE at > NOW() - INTERVAL '24 hours'",
    ),
    pageViews: await count("SELECT COUNT(*) AS n FROM page_views WHERE at > NOW() - INTERVAL '24 hours'"),
    visitorsBefore: await count(
      `SELECT COUNT(DISTINCT visitor) AS n FROM page_views
       WHERE at BETWEEN NOW() - INTERVAL '48 hours' AND NOW() - INTERVAL '24 hours'`,
    ),
    topPages: topPages.rows.map((row) => ({ path: row.path, views: Number(row.views) })),
    topReferrers: topReferrers.rows.map((row) => ({ referrer: row.referrer, visits: Number(row.visits) })),
    newAccounts: await count(
      "SELECT COUNT(*) AS n FROM app_users WHERE created_at > NOW() - INTERVAL '24 hours'",
    ),
    totalAccounts: await count("SELECT COUNT(*) AS n FROM app_users"),
    portfoliosPublished: await count(
      "SELECT COUNT(*) AS n FROM portfolios WHERE published_at > NOW() - INTERVAL '24 hours'",
    ),
    voicesMade: await count(
      "SELECT COUNT(*) AS n FROM voice_profiles WHERE status = 'ready' AND updated_at > NOW() - INTERVAL '24 hours'",
    ),
    voiceClips: await count(
      "SELECT COUNT(*) AS n FROM voice_clips WHERE status = 'done' AND finished_at > NOW() - INTERVAL '24 hours'",
    ),
    voiceEngineSeenAt: engine.rows[0]?.seen_at?.toISOString() ?? null,
  };
}

/** The report as a plain-text email. */
export function reportEmail(report: DailyReport): { subject: string; text: string } {
  const change = report.visitors - report.visitorsBefore;
  const trend =
    change === 0
      ? "same as the day before"
      : `${change > 0 ? "up" : "down"} ${Math.abs(change)} on the day before`;
  const list = (rows: string[]) =>
    rows.length ? rows.map((row) => `  • ${row}`).join("\n") : "  • none yet";
  const engine = report.voiceEngineSeenAt
    ? `last seen ${new Date(report.voiceEngineSeenAt).toUTCString()}`
    : "never connected";
  const text = [
    `${brand.name}, the last 24 hours (${report.date})`,
    "",
    `Visitors: ${report.visitors} (${trend})`,
    `Page views: ${report.pageViews}`,
    `New accounts: ${report.newAccounts} (total ${report.totalAccounts})`,
    `Portfolios published: ${report.portfoliosPublished}`,
    `Voice tool: ${report.voicesMade} voices made, ${report.voiceClips} clips (engine ${engine})`,
    "",
    "Most visited pages:",
    list(report.topPages.map((page) => `${page.path} (${page.views})`)),
    "",
    "Where visitors came from:",
    list(report.topReferrers.map((source) => `${source.referrer} (${source.visits})`)),
    "",
    `Visitor activity: ${siteUrl} → your console → Activity`,
    "",
    "— Ahmed Agent",
  ].join("\n");
  return {
    subject: `${brand.name} daily: ${report.visitors} visitors, ${report.newAccounts} new accounts`,
    text,
  };
}

function dubaiDate(at = new Date()): string {
  return new Date(at.getTime() + DUBAI_OFFSET_HOURS * 3_600_000).toISOString().slice(0, 10);
}

/** Run by the hourly job: sends today's report once, after 9:00 Dubai time. Returns true if sent. */
export async function sendDailyReport(): Promise<boolean> {
  const to = supportInbox();
  if (!to) return false;
  const dubaiHour = (new Date().getUTCHours() + DUBAI_OFFSET_HOURS) % 24;
  if (dubaiHour < SEND_AFTER_HOUR) return false;
  const report = await loadDailyReport();
  return sendOnce(`owner-report:${report.date}`, null, "owner-report", { to, ...reportEmail(report) });
}

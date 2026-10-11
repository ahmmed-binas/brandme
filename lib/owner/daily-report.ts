import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import { brand } from "@/lib/brand";
import { siteUrl } from "@/lib/site";
import { escape, renderEmail } from "@/lib/email/layout";
import { sendOnce, supportInbox } from "@/lib/email/mailer";
import { countLeads, leadPages, type LeadCounts } from "@/lib/analytics/leads";

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
  /** People who reached out: last 24 hours, and since launch (the month's main goal). */
  leads: LeadCounts;
  leadsAllTime: LeadCounts;
  leadPages: Array<{ page: string; leads: number }>;
  /** Portfolios live right now (published at least once). */
  publishedTotal: number;
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
    leads: await countLeads(24),
    leadsAllTime: await countLeads(null),
    leadPages: await leadPages(24),
    publishedTotal: await count("SELECT COUNT(*) AS n FROM portfolios WHERE published_at IS NOT NULL"),
  };
}

/**
 * The month's goal: Ahmed Agent's first month running Fuccura (set 11 October 2026).
 * The owner judges it mainly on leads. Change the numbers here.
 */
const GOAL = { deadline: "11 November 2026", leads: 25, accounts: 100, published: 15 };

/** Progress towards GOAL: [label, done so far, target]. */
function scorecard(report: DailyReport): Array<[string, number, number]> {
  return [
    ["Leads", report.leadsAllTime.total, GOAL.leads],
    ["Accounts", report.totalAccounts, GOAL.accounts],
    ["Websites published", report.publishedTotal, GOAL.published],
  ];
}

/** The report as an email: plain text, plus the branded HTML version. */
export function reportEmail(report: DailyReport): { subject: string; text: string; html: string } {
  const change = report.visitors - report.visitorsBefore;
  const trend =
    change === 0
      ? "same as the day before"
      : `${change > 0 ? "up" : "down"} ${Math.abs(change)} on the day before`;
  const list = (rows: string[]) =>
    rows.length ? rows.map((row) => `  • ${row}`).join("\n") : "  • none yet";
  const engine = report.voiceEngineSeenAt
    ? `last seen ${new Date(report.voiceEngineSeenAt).toLocaleString("en-GB", { timeZone: "Asia/Dubai", dateStyle: "medium", timeStyle: "short" })} Dubai time`
    : "never connected";
  const { leads } = report;
  const leadNote = `${leads.whatsapp} WhatsApp · ${leads.email} email · ${leads.contact} form · ${leads.calls} calls`;
  const text = [
    `${brand.name}, the last 24 hours (${report.date})`,
    "",
    `Leads: ${leads.total} (${leadNote})`,
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
    `Goal by ${GOAL.deadline}:`,
    ...scorecard(report).map(([label, done, target]) => `  • ${label}: ${done} of ${target}`),
    "",
    `Visitor activity: ${siteUrl} → your console → Activity`,
    "",
    "— Ahmed Agent",
  ].join("\n");
  return {
    subject: `${brand.name} daily: ${leads.total} leads, ${report.visitors} visitors, ${report.newAccounts} new accounts`,
    text,
    html: reportHtml(report, trend, engine),
  };
}

/** The same report as a branded email: number tiles, then the top pages and sources. */
function reportHtml(report: DailyReport, trend: string, engine: string): string {
  const tile = (value: number, label: string, note?: string) =>
    `<td width="50%" style="padding:6px"><div style="background:#f4f0e8;border-radius:12px;padding:14px 16px">
<div style="font-family:Georgia,serif;font-size:30px;line-height:1.1">${value}</div>
<div style="font-size:13px;color:#15140f;margin-top:4px">${escape(label)}</div>
<div style="font-size:12px;color:#6b665a;margin-top:2px">${note ? escape(note) : "&nbsp;"}</div></div></td>`; // Every tile has a note line, so they line up.
  const rows = (items: Array<[string, number]>) =>
    items.length
      ? items
          .map(
            ([name, count]) =>
              `<tr><td style="padding:7px 0;border-bottom:1px solid #e3ddd0;font-size:14px">${escape(name)}</td><td align="right" style="padding:7px 0;border-bottom:1px solid #e3ddd0;font-size:14px;color:#6b665a">${count}</td></tr>`,
          )
          .join("")
      : `<tr><td style="padding:7px 0;font-size:14px;color:#6b665a">None yet</td></tr>`;
  // A labelled progress bar (email-safe: two table cells, no CSS gradients).
  const progress = (label: string, done: number, target: number) => {
    const percent = Math.min(100, Math.round((done / target) * 100));
    return `<p style="margin:10px 0 4px;font-size:14px">${escape(label)} <span style="color:#6b665a">${done} of ${target}</span></p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="height:8px"><tr>
<td width="${Math.max(percent, 1)}%" style="background:#10b981;height:8px;border-radius:4px 0 0 4px;font-size:0;line-height:0">&nbsp;</td>
<td style="background:#e3ddd0;height:8px;border-radius:0 4px 4px 0;font-size:0;line-height:0">&nbsp;</td></tr></table>`;
  };
  const heading = (text: string) =>
    `<p style="margin:26px 0 6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b665a;font-weight:600">${escape(text)}</p>`;
  const body = `<p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b665a;font-weight:600">Daily report · ${escape(report.date)}</p>
<p style="margin:0 0 18px;font-family:Georgia,serif;font-size:24px;line-height:1.25">The last 24 hours on ${escape(brand.name)}</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 -6px">
<tr>${tile(report.leads.total, "Leads", `${report.leads.whatsapp} WhatsApp · ${report.leads.contact + report.leads.email} email · ${report.leads.calls} calls`)}${tile(report.visitors, "Visitors", trend)}</tr>
<tr>${tile(report.newAccounts, "New accounts", `${report.totalAccounts} in total`)}${tile(report.portfoliosPublished, "Portfolios published")}</tr>
<tr>${tile(report.voiceClips, "Voice clips made", `${report.voicesMade} new voices`)}${tile(report.pageViews, "Page views")}</tr>
</table>
${heading(`Goal by ${GOAL.deadline}`)}
${scorecard(report)
  .map(([label, done, target]) => progress(label, done, target))
  .join("")}
${report.leadPages.length ? `${heading("Pages that brought leads")}<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows(report.leadPages.map((page) => [page.page, page.leads]))}</table>` : ""}
${heading("Most visited pages")}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows(report.topPages.map((page) => [page.path, page.views]))}</table>
${heading("Where visitors came from")}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows(report.topReferrers.map((source) => [source.referrer, source.visits]))}</table>
<p style="margin:22px 0 0;font-size:13px;color:#6b665a">Voice engine: ${escape(engine)}.</p>
<p style="margin:18px 0 0;color:#6b665a">— Ahmed Agent</p>`;
  return renderEmail({
    preheader: `${report.visitors} visitors (${trend}), ${report.newAccounts} new accounts, ${report.voiceClips} voice clips.`,
    body,
    footer: `Your daily ${brand.name} report, sent after 9:00 Dubai time.`,
  });
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

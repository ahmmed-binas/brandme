import { db } from "@/utils/db";
import { databaseConfigured, ensureSchema } from "@/utils/db-schema";
import { BOT, visitorId } from "@/lib/analytics/track";
import { alertOwner } from "@/lib/owner/alerts";

/**
 * Leads: people who reached out to Fuccura. Counted in the owner's daily
 * report and the agent's scorecard.
 *   whatsapp – clicked one of Fuccura's own WhatsApp buttons (VisitBeacon notices it)
 *   email    – clicked Fuccura's own email address
 *   contact  – sent the contact form (name, email and subject kept for follow-up)
 * Booked calls are counted from call_bookings, where they already live.
 */

export type LeadKind = "whatsapp" | "email" | "contact";
export const isLeadKind = (value: unknown): value is LeadKind =>
  value === "whatsapp" || value === "email" || value === "contact";

export interface LeadInput {
  kind: LeadKind;
  page: string;
  ip: string;
  userAgent: string;
  userId?: string | null;
  name?: string | null;
  email?: string | null;
  note?: string | null;
}

/** Records one lead. Bots aren't counted, and one visitor's repeat clicks within an hour count once. */
export async function recordLead(input: LeadInput): Promise<boolean> {
  if (!databaseConfigured()) return false;
  const ua = input.userAgent.slice(0, 400);
  if (!ua || BOT.test(ua)) return false;
  const page = ((input.page.split("?")[0] ?? "/") || "/").slice(0, 300);
  const visitor = visitorId(input.ip, ua);
  await ensureSchema();
  if (input.kind !== "contact") {
    const repeat = await db.query(
      "SELECT 1 FROM leads WHERE visitor = $1 AND kind = $2 AND at > NOW() - INTERVAL '1 hour' LIMIT 1",
      [visitor, input.kind],
    );
    if (repeat.rowCount) return false;
  }
  await db.query(
    `INSERT INTO leads (kind, page, visitor, user_id, name, email, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.kind,
      page,
      visitor,
      input.userId ?? null,
      input.name?.slice(0, 120) ?? null,
      input.email?.slice(0, 254) ?? null,
      input.note?.slice(0, 180) ?? null,
    ],
  );
  await alertForLead(input, page);
  return true;
}

/** Tells the owner straight away (lib/owner/alerts.ts caps these at a few a day). */
async function alertForLead(input: LeadInput, page: string) {
  if (input.kind === "contact")
    return alertOwner(
      `New lead: ${input.name ?? "someone"} sent a message`,
      [
        `${input.name ?? "Someone"} (${input.email ?? "no email"}) wrote from ${page}.`,
        `Subject: ${input.note ?? "(none)"}`,
        "The full message is in your inbox. Replying within the hour wins most deals.",
      ],
      input.email ? { label: `Reply to ${input.name ?? "them"}`, url: `mailto:${input.email}` } : undefined,
    );
  return alertOwner(
    input.kind === "whatsapp" ? "Someone tapped WhatsApp" : "Someone tapped your email address",
    [
      `A visitor on ${page} just tapped ${input.kind === "whatsapp" ? "the WhatsApp button" : "your email address"}.`,
      input.kind === "whatsapp"
        ? "If a message arrives, reply quickly, then tell Ahmed Agent how it went."
        : "Watch your inbox, and tell Ahmed Agent how it went.",
    ],
  );
}

export interface LeadCounts {
  whatsapp: number;
  email: number;
  contact: number;
  calls: number;
  total: number;
}

/** Leads in the last `hours` hours (or all time when `hours` is null). */
export async function countLeads(hours: number | null): Promise<LeadCounts> {
  await ensureSchema();
  const since = hours === null ? "-infinity" : new Date(Date.now() - hours * 3_600_000).toISOString();
  const rows = await db.query<{ kind: LeadKind; n: string }>(
    "SELECT kind, COUNT(*) AS n FROM leads WHERE at > $1 GROUP BY kind",
    [since],
  );
  const calls = await db.query<{ n: string }>(
    "SELECT COUNT(*) AS n FROM call_bookings WHERE created_at > $1",
    [since],
  );
  const of = (kind: LeadKind) => Number(rows.rows.find((row) => row.kind === kind)?.n ?? 0);
  const counts = {
    whatsapp: of("whatsapp"),
    email: of("email"),
    contact: of("contact"),
    calls: Number(calls.rows[0]?.n ?? 0),
  };
  return { ...counts, total: counts.whatsapp + counts.email + counts.contact + counts.calls };
}

/** Which pages leads came from in the last `hours` hours, most first. */
export async function leadPages(hours: number): Promise<Array<{ page: string; leads: number }>> {
  await ensureSchema();
  const rows = await db.query<{ page: string; n: string }>(
    `SELECT page, COUNT(*) AS n FROM leads WHERE at > NOW() - make_interval(hours => $1)
     GROUP BY page ORDER BY n DESC LIMIT 5`,
    [hours],
  );
  return rows.rows.map((row) => ({ page: row.page, leads: Number(row.n) }));
}

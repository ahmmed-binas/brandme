import { db } from "@/utils/db";
import { databaseConfigured, ensureSchema } from "@/utils/db-schema";

export { INTERNAL_COOKIE, hasInternalCookie, internalCookieHeader } from "./internal-cookie";

/**
 * Internal accounts: the owner's and the team's own. They're never counted as
 * users, visitors, leads or sign-ups, so the numbers show real people only
 * (owner's request, October 2026).
 *
 * An account is internal when it's the superadmin, or its email is listed in
 * INTERNAL_EMAILS (comma-separated, e.g. the owner's Gmail). A browser that has
 * been signed in to an internal account gets the INTERNAL_COOKIE, so its visits
 * aren't counted afterwards either, even when signed out.
 */

const internalEmails = () =>
  (process.env.INTERNAL_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export const isInternalEmail = (email: string | null | undefined) =>
  Boolean(email) && internalEmails().includes(email!.toLowerCase());

/**
 * Hourly: marks accounts in INTERNAL_EMAILS as internal, and removes internal
 * accounts' visits and leads from the stats. Returns what it changed.
 */
export async function syncInternalAccounts(): Promise<{
  marked: number;
  visitsRemoved: number;
  leadsRemoved: number;
}> {
  if (!databaseConfigured()) return { marked: 0, visitsRemoved: 0, leadsRemoved: 0 };
  await ensureSchema();
  const emails = internalEmails();
  // The superadmin is always internal; an empty INTERNAL_EMAILS just adds nobody.
  const update = await db.query(
    "UPDATE app_users SET internal = true WHERE NOT internal AND (is_superadmin OR lower(email) = ANY($1))",
    [emails],
  );
  const marked = update.rowCount ?? 0;
  const internal = "SELECT id FROM app_users WHERE internal";
  const visitsRemoved =
    (await db.query(`DELETE FROM page_views WHERE user_id IN (${internal})`)).rowCount ?? 0;
  const leadsRemoved = (await db.query(`DELETE FROM leads WHERE user_id IN (${internal})`)).rowCount ?? 0;
  return { marked, visitsRemoved, leadsRemoved };
}

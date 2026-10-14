import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";

/**
 * The numbers on the console's sidebar tabs: what's new since the superadmin
 * last opened each tab. Opening a tab clears its number.
 *
 *   Dashboard  server errors (critical, shown in red)
 *   Activity   real visitors (not the owner or team when signed in)
 *   Users      new real sign-ups
 *   Feedback   new star ratings and editor answers from real people
 *
 * The first time, “since” is the last 24 hours.
 */

export type BadgeTab = "Dashboard" | "Activity" | "Users" | "Feedback";
export type Badges = Partial<Record<BadgeTab, number>>;

/** Tabs whose number means something is wrong, not just new. */
export const CRITICAL_TABS: BadgeTab[] = ["Dashboard"];

const FIRST_LOOK = "NOW() - INTERVAL '24 hours'";

/** “Since the last visit to this tab” as SQL, for user $1. */
const since = (tab: BadgeTab) =>
  `COALESCE((SELECT seen_at FROM console_seen WHERE user_id = $1 AND tab = '${tab}'), ${FIRST_LOOK})`;

/** Not the superadmin, not owner/team accounts. */
const REAL_ACCOUNT = "NOT u.is_superadmin AND NOT u.internal";

export async function loadBadges(userId: string): Promise<Badges> {
  try {
    await ensureSchema();
    const result = await db.query<{
      errors: number;
      visitors: number;
      users: number;
      ratings: number;
      answers: number;
    }>(
      `SELECT
         (SELECT COUNT(*) FROM app_errors WHERE at > ${since("Dashboard")})::int AS errors,
         (SELECT COUNT(DISTINCT v.visitor) FROM page_views v
            LEFT JOIN app_users u ON u.id = v.user_id
            WHERE v.at > ${since("Activity")} AND (v.user_id IS NULL OR (${REAL_ACCOUNT})))::int AS visitors,
         (SELECT COUNT(*) FROM app_users u
            WHERE u.created_at > ${since("Users")} AND ${REAL_ACCOUNT})::int AS users,
         (SELECT COUNT(*) FROM template_ratings r JOIN app_users u ON u.id = r.user_id
            WHERE r.updated_at > ${since("Feedback")} AND ${REAL_ACCOUNT})::int AS ratings,
         (SELECT COUNT(*) FROM template_feedback f JOIN app_users u ON u.id = f.user_id
            WHERE f.at > ${since("Feedback")} AND NOT f.skipped AND ${REAL_ACCOUNT})::int AS answers`,
      [userId],
    );
    const row = result.rows[0];
    if (!row) return {};
    return {
      Dashboard: row.errors,
      Activity: row.visitors,
      Users: row.users,
      Feedback: row.ratings + row.answers,
    };
  } catch (error) {
    console.error("Console badges unavailable", (error as Error).message);
    return {}; // The console never breaks over its badges.
  }
}

/** The superadmin opened this tab: its number starts again from zero. */
export async function markSeen(userId: string, tab: string): Promise<void> {
  try {
    await db.query(
      `INSERT INTO console_seen (user_id, tab, seen_at) VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, tab) DO UPDATE SET seen_at = NOW()`,
      [userId, tab],
    );
  } catch (error) {
    console.error("Console seen not saved", (error as Error).message);
  }
}

export interface RecentError {
  at: Date;
  method: string;
  path: string;
  message: string;
}

/** Server errors in the last 24 hours, newest first, for the dashboard's critical panel. */
export async function recentErrors(limit = 20): Promise<RecentError[]> {
  try {
    await ensureSchema();
    const result = await db.query<RecentError>(
      `SELECT at, method, path, message FROM app_errors
       WHERE at > NOW() - INTERVAL '24 hours' ORDER BY at DESC LIMIT $1`,
      [limit],
    );
    return result.rows;
  } catch {
    return [];
  }
}

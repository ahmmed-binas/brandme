import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";

/**
 * Visitor journeys for the console's Activity page: every visit, as the pages
 * that visitor opened in order. A visitor is the daily-changing code from
 * lib/analytics/track.ts, so one journey covers one person on one day.
 */

export const ACTIVITY_RANGES = { "1h": "1 hour", today: "24 hours", "7d": "7 days" } as const;
export type ActivityRange = keyof typeof ACTIVITY_RANGES;
export const isActivityRange = (value: unknown): value is ActivityRange =>
  typeof value === "string" && value in ACTIVITY_RANGES;

/** A visitor is "live" when they opened a page in the last few minutes. */
export const LIVE_MINUTES = 5;

export interface JourneyStep {
  path: string;
  at: string;
}

export interface Journey {
  visitor: string;
  firstAt: string;
  lastAt: string;
  views: number;
  device: string;
  timeZone: string | null;
  referrer: string | null;
  steps: JourneyStep[];
  user: { id: string; name: string | null; email: string | null } | null;
}

export interface ActivitySummary {
  liveNow: number;
  visitorsToday: number;
  signedInToday: number;
  viewsToday: number;
}

interface JourneyRow {
  visitor: string;
  first_at: Date;
  last_at: Date;
  views: number;
  device: string;
  time_zone: string | null;
  referrer: string | null;
  steps: JourneyStep[];
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
}

/** The most recent journeys, newest activity first. */
export async function loadJourneys(
  range: ActivityRange,
  signedInOnly: boolean,
  limit = 100,
): Promise<Journey[]> {
  await ensureSchema();
  const rows = await db.query<JourneyRow>(
    `SELECT v.visitor, v.first_at, v.last_at, v.views, v.device, v.time_zone, v.referrer, v.steps, v.user_id,
            u.name AS user_name, u.email AS user_email
     FROM (
       SELECT visitor,
              MIN(at) AS first_at,
              MAX(at) AS last_at,
              COUNT(*)::int AS views,
              (ARRAY_AGG(device ORDER BY at))[1] AS device,
              (ARRAY_AGG(time_zone ORDER BY at) FILTER (WHERE time_zone IS NOT NULL))[1] AS time_zone,
              (ARRAY_AGG(referrer ORDER BY at) FILTER (WHERE referrer IS NOT NULL))[1] AS referrer,
              (ARRAY_AGG(user_id ORDER BY at DESC) FILTER (WHERE user_id IS NOT NULL))[1] AS user_id,
              JSON_AGG(JSON_BUILD_OBJECT('path', path, 'at', at) ORDER BY at) AS steps
       FROM page_views
       WHERE at >= NOW() - $1::interval
       GROUP BY visitor
     ) v
     LEFT JOIN app_users u ON u.id = v.user_id
     WHERE ($2::boolean IS FALSE OR v.user_id IS NOT NULL)
     ORDER BY v.last_at DESC
     LIMIT $3`,
    [ACTIVITY_RANGES[range], signedInOnly, limit],
  );
  return rows.rows.map((row) => ({
    visitor: row.visitor,
    firstAt: row.first_at.toISOString(),
    lastAt: row.last_at.toISOString(),
    views: row.views,
    device: row.device,
    timeZone: row.time_zone,
    referrer: row.referrer,
    steps: row.steps.slice(0, 60),
    user: row.user_id ? { id: row.user_id, name: row.user_name, email: row.user_email } : null,
  }));
}

/** The numbers at the top of the Activity page. */
export async function loadActivitySummary(): Promise<ActivitySummary> {
  await ensureSchema();
  const result = await db.query<{ live: number; visitors: number; signed_in: number; views: number }>(
    `SELECT
       COUNT(DISTINCT visitor) FILTER (WHERE at >= NOW() - INTERVAL '${LIVE_MINUTES} minutes')::int AS live,
       COUNT(DISTINCT visitor)::int AS visitors,
       COUNT(DISTINCT user_id)::int AS signed_in,
       COUNT(*)::int AS views
     FROM page_views
     WHERE at >= NOW() - INTERVAL '24 hours'`,
  );
  const row = result.rows[0];
  return {
    liveNow: row?.live ?? 0,
    visitorsToday: row?.visitors ?? 0,
    signedInToday: row?.signed_in ?? 0,
    viewsToday: row?.views ?? 0,
  };
}

/** "Asia/Dubai" → "Dubai"; "America/Argentina/Salta" → "Salta". */
export const placeFromTimeZone = (timeZone: string | null) =>
  timeZone ? (timeZone.split("/").at(-1) ?? timeZone).replace(/_/g, " ") : null;

import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";

/**
 * A rate limit stored in the database, so it holds across restarts and across
 * several app servers (unlike the in-memory one for sign-in in lib/accounts).
 * Fixed windows: at most `limit` actions per key per `windowSeconds`.
 * Returns true when the action may go ahead (and counts it).
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  await ensureSchema();
  const result = await db.query<{ count: number }>(
    `INSERT INTO rate_limits (key, window_start, count) VALUES ($1, to_timestamp(floor(extract(epoch FROM NOW()) / $2) * $2), 1)
     ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
     RETURNING count`,
    [key.slice(0, 200), windowSeconds],
  );
  return (result.rows[0]?.count ?? 0) <= limit;
}

/** Old windows are useless; the hourly job clears anything older than a day. */
export async function pruneRateLimits(): Promise<number> {
  await ensureSchema();
  return (await db.query("DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 day'")).rowCount ?? 0;
}

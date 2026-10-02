import { db } from "@/utils/db";
import { databaseConfigured, ensureSchema } from "@/utils/db-schema";

/** Star ratings people give templates. A template nobody has rated shows “No ratings yet”. */
export interface RatingSummary { average: number | null; count: number }

export const NO_RATINGS: RatingSummary = { average: null, count: 0 };

/** Every template's average and count, keyed by template id. Templates without ratings are absent. */
export async function ratingSummaries(): Promise<Record<string, RatingSummary>> {
  if (!databaseConfigured()) return {};
  try {
    await ensureSchema();
    const result = await db.query<{ template_id: string; average: string; count: string }>("SELECT template_id, avg(stars) AS average, count(*) AS count FROM template_ratings GROUP BY template_id");
    return Object.fromEntries(result.rows.map((row) => [row.template_id, { average: Math.round(Number(row.average) * 10) / 10, count: Number(row.count) }]));
  } catch (error) {
    console.error("Template ratings unavailable", error);
    return {};
  }
}

export async function ratingSummary(templateId: string): Promise<RatingSummary> {
  return (await ratingSummaries())[templateId] ?? NO_RATINGS;
}

export async function userRating(userId: string, templateId: string): Promise<number | null> {
  if (!databaseConfigured()) return null;
  await ensureSchema();
  const result = await db.query<{ stars: number }>("SELECT stars FROM template_ratings WHERE user_id = $1 AND template_id = $2", [userId, templateId]);
  return result.rows[0]?.stars ?? null;
}

/** Sets or changes a person's rating; null removes it. */
export async function rateTemplate(userId: string, templateId: string, stars: number | null): Promise<void> {
  await ensureSchema();
  if (stars === null) {
    await db.query("DELETE FROM template_ratings WHERE user_id = $1 AND template_id = $2", [userId, templateId]);
    return;
  }
  await db.query(
    `INSERT INTO template_ratings (user_id, template_id, stars) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, template_id) DO UPDATE SET stars = EXCLUDED.stars, updated_at = NOW()`,
    [userId, templateId, stars],
  );
}

/** Downloads of each free template, keyed by template id. */
export async function downloadCounts(): Promise<Record<string, number>> {
  if (!databaseConfigured()) return {};
  try {
    await ensureSchema();
    const result = await db.query<{ template_id: string; count: number }>("SELECT template_id, count FROM template_downloads");
    return Object.fromEntries(result.rows.map((row) => [row.template_id, row.count]));
  } catch {
    return {};
  }
}

export async function countDownload(templateId: string): Promise<void> {
  if (!databaseConfigured()) return;
  await ensureSchema();
  await db.query("INSERT INTO template_downloads (template_id, count) VALUES ($1, 1) ON CONFLICT (template_id) DO UPDATE SET count = template_downloads.count + 1, updated_at = NOW()", [templateId]);
}

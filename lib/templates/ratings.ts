import { db } from "@/utils/db";
import { databaseConfigured, ensureSchema } from "@/utils/db-schema";

/** Star ratings people give templates. A template nobody has rated shows “No ratings yet”. */
export interface RatingSummary {
  average: number | null;
  count: number;
}

export const NO_RATINGS: RatingSummary = { average: null, count: 0 };

/** Every template's average and count, keyed by template id. Templates without ratings are absent. */
export async function ratingSummaries(): Promise<Record<string, RatingSummary>> {
  if (!databaseConfigured()) return {};
  try {
    await ensureSchema();
    const result = await db.query<{ template_id: string; average: string; count: string }>(
      "SELECT template_id, avg(stars) AS average, count(*) AS count FROM template_ratings GROUP BY template_id",
    );
    return Object.fromEntries(
      result.rows.map((row) => [
        row.template_id,
        { average: Math.round(Number(row.average) * 10) / 10, count: Number(row.count) },
      ]),
    );
  } catch (error) {
    console.error("Template ratings unavailable", error);
    return {};
  }
}

export async function ratingSummary(templateId: string): Promise<RatingSummary> {
  return (await ratingSummaries())[templateId] ?? NO_RATINGS;
}

export interface MyRating {
  stars: number | null;
  comment: string | null;
  public: boolean;
}

export async function userRating(userId: string, templateId: string): Promise<MyRating> {
  if (!databaseConfigured()) return { stars: null, comment: null, public: false };
  await ensureSchema();
  const result = await db.query<{ stars: number; comment: string | null; public: boolean }>(
    "SELECT stars, comment, public FROM template_ratings WHERE user_id = $1 AND template_id = $2",
    [userId, templateId],
  );
  const row = result.rows[0];
  return { stars: row?.stars ?? null, comment: row?.comment ?? null, public: row?.public ?? false };
}

/**
 * Sets or changes a person's rating; null removes it. A comment and the
 * “show it publicly” choice are optional: when `note` is left out, an
 * existing comment stays as it was (changing the stars doesn't wipe it).
 */
export async function rateTemplate(
  userId: string,
  templateId: string,
  stars: number | null,
  note?: { comment: string | null; public: boolean },
): Promise<void> {
  await ensureSchema();
  if (stars === null) {
    await db.query("DELETE FROM template_ratings WHERE user_id = $1 AND template_id = $2", [
      userId,
      templateId,
    ]);
    return;
  }
  if (!note) {
    await db.query(
      `INSERT INTO template_ratings (user_id, template_id, stars) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, template_id) DO UPDATE SET stars = EXCLUDED.stars, updated_at = NOW()`,
      [userId, templateId, stars],
    );
    return;
  }
  await db.query(
    `INSERT INTO template_ratings (user_id, template_id, stars, comment, public) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, template_id) DO UPDATE SET
       stars = EXCLUDED.stars, comment = EXCLUDED.comment, public = EXCLUDED.public, updated_at = NOW()`,
    [userId, templateId, stars, note.comment, note.public],
  );
}

export interface PublicReview {
  stars: number;
  comment: string;
  at: Date;
  /** Null unless the person agreed to show their name and photo. */
  name: string | null;
  image: string | null;
}

/**
 * Comments shown under a page (template, agent or blog post): only ones with
 * text that the owner hasn't hidden. Name and photo only when the person
 * ticked “show my name and photo”; otherwise the review is anonymous.
 */
export async function publicReviews(templateId: string, limit = 12): Promise<PublicReview[]> {
  if (!databaseConfigured()) return [];
  try {
    await ensureSchema();
    const result = await db.query<{
      stars: number;
      comment: string;
      updated_at: Date;
      public: boolean;
      name: string | null;
      image: string | null;
    }>(
      `SELECT r.stars, r.comment, r.updated_at, r.public, u.name, u.image
       FROM template_ratings r JOIN app_users u ON u.id = r.user_id
       WHERE r.template_id = $1 AND NOT r.hidden AND coalesce(trim(r.comment), '') <> ''
       ORDER BY r.updated_at DESC LIMIT $2`,
      [templateId, limit],
    );
    return result.rows.map((row) => ({
      stars: row.stars,
      comment: row.comment,
      at: row.updated_at,
      name: row.public ? row.name?.trim() || null : null,
      image: row.public ? row.image : null,
    }));
  } catch {
    return []; // A page never breaks over its reviews.
  }
}

export interface RatingRow {
  userId: string;
  key: string;
  stars: number;
  comment: string | null;
  public: boolean;
  hidden: boolean;
  at: Date;
  name: string | null;
  email: string | null;
  internal: boolean;
}

/** For the console: every star rating on the site (templates, agents, blog posts), newest first. */
export async function allRatings(limit = 200): Promise<RatingRow[]> {
  if (!databaseConfigured()) return [];
  await ensureSchema();
  const result = await db.query<{
    user_id: string;
    template_id: string;
    stars: number;
    comment: string | null;
    public: boolean;
    hidden: boolean;
    updated_at: Date;
    name: string | null;
    email: string | null;
    internal: boolean;
  }>(
    `SELECT r.user_id, r.template_id, r.stars, r.comment, r.public, r.hidden, r.updated_at,
            u.name, u.email, u.internal
     FROM template_ratings r JOIN app_users u ON u.id = r.user_id
     ORDER BY r.updated_at DESC LIMIT $1`,
    [limit],
  );
  return result.rows.map((row) => ({
    userId: row.user_id,
    key: row.template_id,
    stars: row.stars,
    comment: row.comment,
    public: row.public,
    hidden: row.hidden,
    at: row.updated_at,
    name: row.name,
    email: row.email,
    internal: row.internal,
  }));
}

/** The owner takes a comment off the page (or puts it back). */
export async function setRatingHidden(userId: string, key: string, hidden: boolean): Promise<boolean> {
  await ensureSchema();
  const result = await db.query(
    "UPDATE template_ratings SET hidden = $3 WHERE user_id = $1 AND template_id = $2",
    [userId, key, hidden],
  );
  return (result.rowCount ?? 0) > 0;
}

/** Downloads of each free template, keyed by template id. */
export async function downloadCounts(): Promise<Record<string, number>> {
  if (!databaseConfigured()) return {};
  try {
    await ensureSchema();
    const result = await db.query<{ template_id: string; count: number }>(
      "SELECT template_id, count FROM template_downloads",
    );
    return Object.fromEntries(result.rows.map((row) => [row.template_id, row.count]));
  } catch {
    return {};
  }
}

export async function countDownload(templateId: string): Promise<void> {
  if (!databaseConfigured()) return;
  await ensureSchema();
  await db.query(
    "INSERT INTO template_downloads (template_id, count) VALUES ($1, 1) ON CONFLICT (template_id) DO UPDATE SET count = template_downloads.count + 1, updated_at = NOW()",
    [templateId],
  );
}

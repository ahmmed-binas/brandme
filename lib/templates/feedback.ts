import { db } from "@/utils/db";
import { databaseConfigured, ensureSchema } from "@/utils/db-schema";
import { rateTemplate } from "./ratings";
import { FEEDBACK_TAGS } from "./feedback-tags";

export { FEEDBACK_TAGS, tagLabel } from "./feedback-tags";

/**
 * The rating pop-up in the editor (components/editor/studio/RatePrompt.tsx).
 * Each signed-in person is asked once per template; they rate it (stars, quick
 * tags, a short note) or skip. Both are kept so the console can show how many
 * people answer. Stars also count as the template's public rating.
 */

const TAG_IDS = new Set<string>(FEEDBACK_TAGS.map((tag) => tag.id));

export interface FeedbackInput {
  stars: number | null;
  tags: string[];
  comment: string | null;
  skipped: boolean;
  secondsEditing: number | null;
  /** They agreed to show the note with their name and photo on the site. */
  shareOk: boolean;
}

/** Cleans what the browser sent; returns an error message when it can't be used. */
export function parseFeedback(body: unknown): FeedbackInput | string {
  const value = (body ?? {}) as Record<string, unknown>;
  const skipped = value.skipped === true;
  const stars = value.stars ?? null;
  if (stars !== null && !(Number.isInteger(stars) && (stars as number) >= 1 && (stars as number) <= 5))
    return "Choose between 1 and 5 stars.";
  if (!skipped && stars === null) return "Choose a rating, or skip.";
  const tags = Array.isArray(value.tags)
    ? [...new Set(value.tags.filter((tag): tag is string => typeof tag === "string" && TAG_IDS.has(tag)))]
    : [];
  const comment =
    typeof value.comment === "string" && value.comment.trim() ? value.comment.trim().slice(0, 600) : null;
  const seconds = Number(value.secondsEditing);
  return {
    stars: skipped ? null : (stars as number),
    tags: skipped ? [] : tags,
    comment: skipped ? null : comment,
    skipped,
    secondsEditing: Number.isFinite(seconds) && seconds >= 0 ? Math.min(Math.round(seconds), 86_400) : null,
    shareOk: !skipped && comment !== null && value.shareOk === true,
  };
}

/**
 * True when it's fine to ask this person about this template. Kept gentle so it
 * never nags: not if they already answered or skipped this template, not more
 * than once a day, and never again once they've skipped twice.
 */
export async function feedbackDue(userId: string, templateId: string): Promise<boolean> {
  if (!databaseConfigured()) return false;
  await ensureSchema();
  const result = await db.query<{ this_one: boolean; recent: boolean; skips: string }>(
    `SELECT
       bool_or(template_id = $2) AS this_one,
       bool_or(at > NOW() - INTERVAL '1 day') AS recent,
       count(*) FILTER (WHERE skipped) AS skips
     FROM template_feedback WHERE user_id = $1`,
    [userId, templateId],
  );
  const row = result.rows[0];
  if (!row) return true;
  return !row.this_one && !row.recent && Number(row.skips) < 2;
}

export async function saveFeedback(userId: string, templateId: string, input: FeedbackInput): Promise<void> {
  await ensureSchema();
  await db.query(
    `INSERT INTO template_feedback (user_id, template_id, stars, tags, comment, skipped, seconds_editing, share_ok)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (user_id, template_id) DO UPDATE SET
       stars = EXCLUDED.stars, tags = EXCLUDED.tags, comment = EXCLUDED.comment,
       skipped = EXCLUDED.skipped, seconds_editing = EXCLUDED.seconds_editing,
       share_ok = EXCLUDED.share_ok, featured = false, at = NOW()`,
    [
      userId,
      templateId,
      input.stars,
      input.tags,
      input.comment,
      input.skipped,
      input.secondsEditing,
      input.shareOk,
    ],
  );
  if (input.stars) await rateTemplate(userId, templateId, input.stars);
}

export interface FeedbackRow {
  at: Date;
  templateId: string;
  stars: number | null;
  tags: string[];
  comment: string | null;
  skipped: boolean;
  secondsEditing: number | null;
  userId: string;
  name: string | null;
  email: string | null;
  internal: boolean;
  shareOk: boolean;
  featured: boolean;
}

export interface TemplateFeedbackSummary {
  templateId: string;
  answered: number;
  skipped: number;
  average: number | null;
}

/** For the console: the latest answers, and per template how many rated or skipped. */
export async function feedbackOverview(limit = 100): Promise<{
  recent: FeedbackRow[];
  byTemplate: TemplateFeedbackSummary[];
  tagCounts: Array<{ tag: string; count: number }>;
}> {
  if (!databaseConfigured()) return { recent: [], byTemplate: [], tagCounts: [] };
  await ensureSchema();
  const [recent, byTemplate, tags] = await Promise.all([
    db.query<{
      at: Date;
      template_id: string;
      stars: number | null;
      tags: string[];
      comment: string | null;
      skipped: boolean;
      seconds_editing: number | null;
      user_id: string;
      name: string | null;
      email: string | null;
      internal: boolean;
      share_ok: boolean;
      featured: boolean;
    }>(
      `SELECT f.at, f.template_id, f.stars, f.tags, f.comment, f.skipped, f.seconds_editing,
              f.user_id, u.name, u.email, u.internal, f.share_ok, f.featured
       FROM template_feedback f JOIN app_users u ON u.id = f.user_id
       ORDER BY f.at DESC LIMIT $1`,
      [limit],
    ),
    // Real people only: the owner's and team's own answers would skew the numbers.
    db.query<{ template_id: string; answered: string; skipped: string; average: string | null }>(
      `SELECT f.template_id,
              count(*) FILTER (WHERE NOT f.skipped) AS answered,
              count(*) FILTER (WHERE f.skipped) AS skipped,
              avg(f.stars) AS average
       FROM template_feedback f JOIN app_users u ON u.id = f.user_id
       WHERE NOT u.internal
       GROUP BY f.template_id ORDER BY count(*) DESC`,
    ),
    db.query<{ tag: string; count: string }>(
      `SELECT tag, count(*) AS count
       FROM template_feedback f JOIN app_users u ON u.id = f.user_id, unnest(f.tags) AS tag
       WHERE NOT u.internal
       GROUP BY tag ORDER BY count(*) DESC`,
    ),
  ]);
  return {
    recent: recent.rows.map((row) => ({
      at: row.at,
      templateId: row.template_id,
      stars: row.stars,
      tags: row.tags,
      comment: row.comment,
      skipped: row.skipped,
      secondsEditing: row.seconds_editing,
      userId: row.user_id,
      name: row.name,
      email: row.email,
      internal: row.internal,
      shareOk: row.share_ok,
      featured: row.featured,
    })),
    byTemplate: byTemplate.rows.map((row) => ({
      templateId: row.template_id,
      answered: Number(row.answered),
      skipped: Number(row.skipped),
      average: row.average === null ? null : Math.round(Number(row.average) * 10) / 10,
    })),
    tagCounts: tags.rows.map((row) => ({ tag: row.tag, count: Number(row.count) })),
  };
}

/** The owner puts an answer on the home page, or takes it off. Only shared answers can go on. */
export async function setFeatured(userId: string, templateId: string, featured: boolean): Promise<boolean> {
  await ensureSchema();
  const result = await db.query(
    `UPDATE template_feedback SET featured = $3
     WHERE user_id = $1 AND template_id = $2 AND share_ok AND comment IS NOT NULL AND NOT skipped`,
    [userId, templateId, featured],
  );
  return (result.rowCount ?? 0) > 0;
}

export interface PublicFeedback {
  name: string;
  image: string | null;
  stars: number;
  comment: string;
  templateId: string;
  at: Date;
}

/**
 * Answers for the home page: only those the person agreed to share AND the owner
 * chose. Name and photo come from their account (Google, for most people).
 */
export async function featuredFeedback(limit = 9): Promise<PublicFeedback[]> {
  if (!databaseConfigured()) return [];
  try {
    await ensureSchema();
    const result = await db.query<{
      name: string | null;
      image: string | null;
      stars: number;
      comment: string;
      template_id: string;
      at: Date;
    }>(
      `SELECT u.name, u.image, f.stars, f.comment, f.template_id, f.at
       FROM template_feedback f JOIN app_users u ON u.id = f.user_id
       WHERE f.featured AND f.share_ok AND f.comment IS NOT NULL AND NOT f.skipped AND f.stars IS NOT NULL
       ORDER BY f.at DESC LIMIT $1`,
      [limit],
    );
    return result.rows.map((row) => ({
      name: row.name?.trim() || "A Fuccura user",
      image: row.image,
      stars: row.stars,
      comment: row.comment,
      templateId: row.template_id,
      at: row.at,
    }));
  } catch {
    return []; // The home page never breaks over this.
  }
}

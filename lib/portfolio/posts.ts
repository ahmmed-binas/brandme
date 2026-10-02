import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import type { TemplateId } from "@/lib/templates/types";
import { plainText, readingMinutes, safeUrl, slugify } from "@/lib/content/markdown";

/**
 * Blog posts on a customer's portfolio. Posts belong to one portfolio (owner +
 * template) and appear at /p/<slug>/blog, or /blog on the owner's domain,
 * while that portfolio is published. Unlike the portfolio itself, a post goes
 * live the moment its owner publishes it; it has no separate draft snapshot.
 */
export interface PortfolioPost {
  id: string;
  slug: string;
  title: string;
  /** What the owner wrote as a summary; may be empty. */
  excerpt: string;
  /** The summary shown to visitors: the excerpt, or the opening of the post. */
  summary: string;
  body: string;
  cover: string | null;
  publishedAt: string | null;
  updatedAt: string;
  readMinutes: number;
}

export const MAX_POSTS = 300;
const MAX_BODY = 60_000;

interface Row { id: string; slug: string; title: string; excerpt: string; body: string; cover: string | null; published_at: Date | null; updated_at: Date }
const COLUMNS = "id, slug, title, excerpt, body, cover, published_at, updated_at";

const toPost = (row: Row): PortfolioPost => ({
  id: row.id, slug: row.slug, title: row.title, excerpt: row.excerpt, summary: row.excerpt || summarise(row.body), body: row.body, cover: row.cover,
  publishedAt: row.published_at?.toISOString() ?? null, updatedAt: row.updated_at.toISOString(), readMinutes: readingMinutes(row.body),
});

const summarise = (body: string) => { const text = plainText(body); return text.length > 180 ? `${text.slice(0, 177).replace(/\s+\S*$/, "")}…` : text; };

export class PostError extends Error {}

export async function listPosts(ownerId: string, templateId: TemplateId, { drafts = false, limit = MAX_POSTS } = {}): Promise<PortfolioPost[]> {
  await ensureSchema();
  const result = await db.query<Row>(
    `SELECT ${COLUMNS} FROM portfolio_posts WHERE owner_id = $1 AND template_id = $2 ${drafts ? "" : "AND published_at IS NOT NULL"}
     ORDER BY published_at DESC NULLS FIRST, updated_at DESC LIMIT $3`,
    [ownerId, templateId, limit],
  );
  return result.rows.map(toPost);
}

export async function getPost(ownerId: string, templateId: TemplateId, slug: string): Promise<PortfolioPost | null> {
  await ensureSchema();
  const result = await db.query<Row>(`SELECT ${COLUMNS} FROM portfolio_posts WHERE owner_id = $1 AND template_id = $2 AND slug = $3 AND published_at IS NOT NULL`, [ownerId, templateId, slug]);
  return result.rows[0] ? toPost(result.rows[0]) : null;
}

export interface PostInput { title?: unknown; slug?: unknown; excerpt?: unknown; body?: unknown; cover?: unknown; publish?: unknown }

function clean(input: PostInput, current?: PortfolioPost) {
  const text = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
  const title = text(input.title, current?.title).trim().slice(0, 160);
  const body = text(input.body, current?.body).slice(0, MAX_BODY);
  const slug = slugify(text(input.slug, current?.slug ?? "") || title) || "post";
  const excerpt = text(input.excerpt, current?.excerpt).trim().slice(0, 300);
  const rawCover = input.cover === null ? "" : text(input.cover, current?.cover ?? "").trim();
  const cover = rawCover ? safeUrl(rawCover) : null;
  const publish = typeof input.publish === "boolean" ? input.publish : current?.publishedAt != null;
  if (publish && !title) throw new PostError("Give the post a title before publishing.");
  if (publish && plainText(body).length < 20) throw new PostError("Write a little more before publishing.");
  return { title: title || "Untitled post", body, slug, excerpt, cover, publish };
}

/** Finds a free slug on this portfolio: “my-post”, then “my-post-2”… */
async function freeSlug(ownerId: string, templateId: TemplateId, wanted: string, exceptId?: string): Promise<string> {
  const taken = new Set((await db.query<{ slug: string }>("SELECT slug FROM portfolio_posts WHERE owner_id = $1 AND template_id = $2 AND slug LIKE $3 AND id IS DISTINCT FROM $4", [ownerId, templateId, `${wanted}%`, exceptId ?? null])).rows.map((row) => row.slug));
  if (!taken.has(wanted)) return wanted;
  for (let n = 2; ; n++) if (!taken.has(`${wanted}-${n}`)) return `${wanted}-${n}`;
}

export async function createPost(ownerId: string, templateId: TemplateId, input: PostInput): Promise<PortfolioPost> {
  await ensureSchema();
  const count = Number((await db.query<{ count: string }>("SELECT count(*) FROM portfolio_posts WHERE owner_id = $1 AND template_id = $2", [ownerId, templateId])).rows[0]!.count);
  if (count >= MAX_POSTS) throw new PostError(`A portfolio can have up to ${MAX_POSTS} posts.`);
  const values = clean(input);
  const slug = await freeSlug(ownerId, templateId, values.slug);
  const result = await db.query<Row>(
    `INSERT INTO portfolio_posts (owner_id, template_id, slug, title, excerpt, body, cover, published_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING ${COLUMNS}`,
    [ownerId, templateId, slug, values.title, values.excerpt, values.body, values.cover, values.publish ? new Date() : null],
  );
  return toPost(result.rows[0]!);
}

export async function updatePost(ownerId: string, templateId: TemplateId, id: string, input: PostInput): Promise<PortfolioPost | null> {
  await ensureSchema();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const row = (await db.query<Row>(`SELECT ${COLUMNS} FROM portfolio_posts WHERE id = $1 AND owner_id = $2 AND template_id = $3`, [id, ownerId, templateId])).rows[0];
  if (!row) return null;
  const current = toPost(row);
  const values = clean(input, current);
  // Published addresses stay put unless the owner changes them on purpose, so shared links keep working.
  const wanted = typeof input.slug === "string" ? values.slug : current.publishedAt ? current.slug : slugify(values.title) || current.slug;
  const slug = wanted === current.slug ? wanted : await freeSlug(ownerId, templateId, wanted, id);
  const result = await db.query<Row>(
    `UPDATE portfolio_posts SET slug = $2, title = $3, excerpt = $4, body = $5, cover = $6,
       published_at = CASE WHEN $7 THEN COALESCE(published_at, NOW()) ELSE NULL END, updated_at = NOW()
     WHERE id = $1 RETURNING ${COLUMNS}`,
    [id, slug, values.title, values.excerpt, values.body, values.cover, values.publish],
  );
  return toPost(result.rows[0]!);
}

export async function deletePost(ownerId: string, templateId: TemplateId, id: string): Promise<boolean> {
  await ensureSchema();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
  return Boolean((await db.query("DELETE FROM portfolio_posts WHERE id = $1 AND owner_id = $2 AND template_id = $3", [id, ownerId, templateId])).rowCount);
}

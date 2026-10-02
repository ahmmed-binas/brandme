import { db } from "@/utils/db";
import { databaseConfigured, ensureSchema } from "@/utils/db-schema";
import { BUILT_IN_ARTICLES } from "./articles";
import { plainText, readingMinutes, slugify } from "./markdown";

/**
 * The site's Journal at /blog. Posts come from two places: articles that ship
 * with the code (lib/content/articles.ts) and posts admins write at
 * /admin/journal, stored in journal_posts. A database row with the same slug
 * as a built-in article replaces it, so admins can edit or hide those too.
 */
export interface JournalPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  body: string;
  /** ISO date; null for a draft or a hidden article. */
  publishedAt: string | null;
  updatedAt: string | null;
  readMinutes: number;
  /** "built-in" ships with the site; "edited" is a built-in article changed by an admin; "written" exists only in the database. */
  origin: "built-in" | "edited" | "written";
}

export const POSTS_PER_PAGE = 9;
export const JOURNAL_CATEGORIES = ["Portfolio strategy", "Writing", "Case studies", "Design", "Career", "Getting online", "Workflow", "News"] as const;

interface Row { slug: string; title: string; description: string; category: string; body: string; published_at: Date | null; updated_at: Date }

const builtInSlugs = new Set(BUILT_IN_ARTICLES.map((article) => article.slug));

function fromRow(row: Row): JournalPost {
  return {
    slug: row.slug, title: row.title, description: row.description || plainText(row.body).slice(0, 160), category: row.category, body: row.body,
    publishedAt: row.published_at?.toISOString() ?? null, updatedAt: row.updated_at.toISOString(), readMinutes: readingMinutes(row.body),
    origin: builtInSlugs.has(row.slug) ? "edited" : "written",
  };
}

async function storedPosts(): Promise<Row[]> {
  if (!databaseConfigured()) return [];
  try {
    await ensureSchema();
    return (await db.query<Row>("SELECT slug, title, description, category, body, published_at, updated_at FROM journal_posts")).rows;
  } catch (error) {
    console.error("Journal posts unavailable; showing built-in articles only", error);
    return [];
  }
}

/** Every post, newest first. Drafts and hidden articles are included only when asked. */
export async function listJournal({ drafts = false } = {}): Promise<JournalPost[]> {
  const stored = await storedPosts();
  const bySlug = new Map<string, JournalPost>(BUILT_IN_ARTICLES.map((article) => [article.slug, {
    ...article, publishedAt: new Date(`${article.publishedAt}T09:00:00Z`).toISOString(), updatedAt: null, readMinutes: readingMinutes(article.body), origin: "built-in" as const,
  }]));
  for (const row of stored) bySlug.set(row.slug, fromRow(row));
  const now = Date.now();
  return [...bySlug.values()]
    .filter((post) => drafts || (post.publishedAt !== null && Date.parse(post.publishedAt) <= now))
    .sort((a, b) => (b.publishedAt ? Date.parse(b.publishedAt) : Infinity) - (a.publishedAt ? Date.parse(a.publishedAt) : Infinity));
}

export async function getJournalPost(slug: string, { drafts = false } = {}): Promise<JournalPost | null> {
  return (await listJournal({ drafts })).find((post) => post.slug === slug) ?? null;
}

export interface JournalInput { title: string; description: string; category: string; body: string; slug?: string; publish: boolean }

export class JournalError extends Error {}

/** Creates or updates a post. `originalSlug` is the post being edited, if any; the slug may change. */
export async function saveJournalPost(input: JournalInput, authorId: string, originalSlug?: string): Promise<JournalPost> {
  const title = input.title.trim().slice(0, 160);
  if (!title) throw new JournalError("Give the post a title.");
  const slug = slugify(input.slug?.trim() || title);
  if (!slug) throw new JournalError("The address needs at least one letter or number.");
  const body = input.body.slice(0, 100_000);
  if (input.publish && plainText(body).length < 40) throw new JournalError("Write a little more before publishing.");
  await ensureSchema();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    if (slug !== originalSlug) {
      if (originalSlug && builtInSlugs.has(originalSlug)) throw new JournalError("Articles that ship with the site keep their address.");
      if (builtInSlugs.has(slug) || (await client.query("SELECT 1 FROM journal_posts WHERE slug = $1", [slug])).rowCount) throw new JournalError("Another post already uses that address.");
      if (originalSlug) await client.query("DELETE FROM journal_posts WHERE slug = $1", [originalSlug]);
    }
    const existing = (await client.query<{ published_at: Date | null }>("SELECT published_at FROM journal_posts WHERE slug = $1", [slug])).rows[0];
    const builtIn = BUILT_IN_ARTICLES.find((article) => article.slug === slug);
    const firstPublished = existing?.published_at ?? (builtIn ? new Date(`${builtIn.publishedAt}T09:00:00Z`) : null);
    const publishedAt = input.publish ? firstPublished ?? new Date() : null;
    const result = await client.query<Row>(
      `INSERT INTO journal_posts (slug, title, description, category, body, author_id, published_at) VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category, body = EXCLUDED.body, published_at = EXCLUDED.published_at, updated_at = NOW()
       RETURNING slug, title, description, category, body, published_at, updated_at`,
      [slug, title, input.description.trim().slice(0, 300), input.category.trim().slice(0, 40) || "News", body, authorId, publishedAt],
    );
    await client.query("COMMIT");
    return fromRow(result.rows[0]!);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/** Deletes a written post. For a built-in article this removes the edit and restores the original. */
export async function deleteJournalPost(slug: string): Promise<void> {
  await ensureSchema();
  await db.query("DELETE FROM journal_posts WHERE slug = $1", [slug]);
}

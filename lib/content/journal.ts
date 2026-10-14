import { db } from "@/utils/db";
import { databaseConfigured, ensureSchema } from "@/utils/db-schema";
import { BUILT_IN_ARTICLES } from "./articles";
import { plainText, readingMinutes, safeUrl, slugify } from "./markdown";
import { cleanMedia, MediaError, readMedia, type PostMedia } from "./media";

/**
 * The site's Journal at /blog. Posts come from two places: articles that ship
 * with the code (lib/content/articles.ts) and posts admins write at
 * /admin/journal, stored in journal_posts. A database row with the same slug
 * as a built-in article replaces it, so admins can edit or hide those too.
 *
 * Members can also write: /blog/write sends a post with submitJournalPost. It
 * waits as a draft (submittedAt set, publishedAt empty) until an admin
 * publishes it in /admin/journal, and is credited to its writer.
 */
export interface JournalPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  body: string;
  /** A picture for lists and sharing. */
  cover: string | null;
  /** The media block at the top of the article. */
  media: PostMedia | null;
  /** ISO date; null for a draft or a hidden article. */
  publishedAt: string | null;
  updatedAt: string | null;
  readMinutes: number;
  /** "built-in" ships with the site; "edited" is a built-in article changed by an admin; "written" exists only in the database. */
  origin: "built-in" | "edited" | "written";
  /** When a member sent it from /blog/write; null for posts written by admins. */
  submittedAt: string | null;
  /** The member who wrote it, credited on the post (with their live portfolio, if any). */
  author: { name: string; url: string | null } | null;
}

export const POSTS_PER_PAGE = 9;
export const JOURNAL_CATEGORIES = [
  "Portfolio strategy",
  "Writing",
  "Case studies",
  "Design",
  "Career",
  "Getting online",
  "Workflow",
  "News",
] as const;

interface Row {
  slug: string;
  title: string;
  description: string;
  category: string;
  body: string;
  cover: string | null;
  media: unknown;
  published_at: Date | null;
  updated_at: Date;
  submitted_at: Date | null;
  author_name: string | null;
  portfolio_slug: string | null;
}

const builtInSlugs = new Set(BUILT_IN_ARTICLES.map((article) => article.slug));

function fromRow(row: Row): JournalPost {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description || plainText(row.body).slice(0, 160),
    category: row.category,
    body: row.body,
    cover: row.cover,
    media: readMedia(row.media),
    publishedAt: row.published_at?.toISOString() ?? null,
    updatedAt: row.updated_at.toISOString(),
    readMinutes: readingMinutes(row.body),
    origin: builtInSlugs.has(row.slug) ? "edited" : "written",
    submittedAt: row.submitted_at?.toISOString() ?? null,
    author: row.submitted_at
      ? {
          name: row.author_name?.trim() || "A Fuccura member",
          url: row.portfolio_slug ? `/p/${row.portfolio_slug}` : null,
        }
      : null,
  };
}

/** Every column fromRow needs, with the writer's name and their newest live portfolio. */
const POST_COLUMNS = `j.slug, j.title, j.description, j.category, j.body, j.cover, j.media, j.published_at,
  j.updated_at, j.submitted_at, u.name AS author_name,
  (SELECT p.slug FROM portfolios p WHERE p.owner_id = j.author_id AND p.published_at IS NOT NULL
   ORDER BY p.published_at DESC LIMIT 1) AS portfolio_slug`;

async function storedPosts(): Promise<Row[]> {
  if (!databaseConfigured()) return [];
  try {
    await ensureSchema();
    return (
      await db.query<Row>(
        `SELECT ${POST_COLUMNS} FROM journal_posts j LEFT JOIN app_users u ON u.id = j.author_id`,
      )
    ).rows;
  } catch (error) {
    console.error("Journal posts unavailable; showing built-in articles only", error);
    return [];
  }
}

/** Every post, newest first. Drafts and hidden articles are included only when asked. */
export async function listJournal({ drafts = false } = {}): Promise<JournalPost[]> {
  const stored = await storedPosts();
  const bySlug = new Map<string, JournalPost>(
    BUILT_IN_ARTICLES.map((article) => [
      article.slug,
      {
        ...article,
        // Covers drawn by scripts/marketing/blog-covers.mjs (public/blog-covers).
        cover: `/blog-covers/${article.slug}.webp`,
        media: null,
        publishedAt: new Date(`${article.publishedAt}T09:00:00Z`).toISOString(),
        updatedAt: null,
        readMinutes: readingMinutes(article.body),
        origin: "built-in" as const,
        submittedAt: null,
        author: null,
      },
    ]),
  );
  for (const row of stored) bySlug.set(row.slug, fromRow(row));
  const now = Date.now();
  return [...bySlug.values()]
    .filter((post) => drafts || (post.publishedAt !== null && Date.parse(post.publishedAt) <= now))
    .sort(
      (a, b) =>
        (b.publishedAt ? Date.parse(b.publishedAt) : Infinity) -
        (a.publishedAt ? Date.parse(a.publishedAt) : Infinity),
    );
}

export async function getJournalPost(slug: string, { drafts = false } = {}): Promise<JournalPost | null> {
  return (await listJournal({ drafts })).find((post) => post.slug === slug) ?? null;
}

export interface JournalInput {
  title: string;
  description: string;
  category: string;
  body: string;
  slug?: string;
  cover?: string | null;
  media?: unknown;
  publish: boolean;
}

export class JournalError extends Error {}

/** Creates or updates a post. `originalSlug` is the post being edited, if any; the slug may change. */
export async function saveJournalPost(
  input: JournalInput,
  authorId: string,
  originalSlug?: string,
): Promise<JournalPost> {
  const title = input.title.trim().slice(0, 160);
  if (!title) throw new JournalError("Give the post a title.");
  const slug = slugify(input.slug?.trim() || title);
  if (!slug) throw new JournalError("The address needs at least one letter or number.");
  const body = input.body.slice(0, 100_000);
  if (input.publish && plainText(body).length < 40)
    throw new JournalError("Write a little more before publishing.");
  const cover = input.cover ? safeUrl(input.cover) : null;
  let media: PostMedia | null;
  try {
    media = cleanMedia(input.media);
  } catch (error) {
    if (error instanceof MediaError) throw new JournalError(error.message);
    throw error;
  }
  await ensureSchema();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    if (slug !== originalSlug) {
      if (originalSlug && builtInSlugs.has(originalSlug))
        throw new JournalError("Articles that ship with the site keep their address.");
      if (
        builtInSlugs.has(slug) ||
        (await client.query("SELECT 1 FROM journal_posts WHERE slug = $1", [slug])).rowCount
      )
        throw new JournalError("Another post already uses that address.");
      if (originalSlug) await client.query("DELETE FROM journal_posts WHERE slug = $1", [originalSlug]);
    }
    const existing = (
      await client.query<{ published_at: Date | null }>(
        "SELECT published_at FROM journal_posts WHERE slug = $1",
        [slug],
      )
    ).rows[0];
    const builtIn = BUILT_IN_ARTICLES.find((article) => article.slug === slug);
    const firstPublished =
      existing?.published_at ?? (builtIn ? new Date(`${builtIn.publishedAt}T09:00:00Z`) : null);
    const publishedAt = input.publish ? (firstPublished ?? new Date()) : null;
    const result = await client.query<{ slug: string }>(
      `INSERT INTO journal_posts (slug, title, description, category, body, author_id, published_at, cover, media) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category, body = EXCLUDED.body, published_at = EXCLUDED.published_at, cover = EXCLUDED.cover, media = EXCLUDED.media, updated_at = NOW()
       RETURNING slug`,
      [
        slug,
        title,
        input.description.trim().slice(0, 300),
        input.category.trim().slice(0, 40) || "News",
        body,
        authorId,
        publishedAt,
        cover,
        media ? JSON.stringify(media) : null,
      ],
    );
    await client.query("COMMIT");
    return (await getJournalPost(result.rows[0]!.slug, { drafts: true }))!;
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

/** Pending posts a member may have waiting at once, and the shortest post accepted. */
const MAX_PENDING = 3;
const MIN_WORDS_CHARS = 300;

/**
 * A member sends a post for the Journal. It's saved as a draft for an admin to
 * review; nothing is public until an admin publishes it.
 */
export async function submitJournalPost(
  input: { title: string; description: string; category: string; body: string },
  authorId: string,
): Promise<JournalPost> {
  const title = input.title.trim().slice(0, 160);
  if (title.length < 8) throw new JournalError("Give your post a title of at least a few words.");
  const body = input.body.slice(0, 60_000);
  if (plainText(body).length < MIN_WORDS_CHARS)
    throw new JournalError("Write a little more: at least a few paragraphs (300 characters).");
  const category = (JOURNAL_CATEGORIES as readonly string[]).includes(input.category)
    ? input.category
    : "Career";
  await ensureSchema();
  const pending = await db.query<{ n: string }>(
    "SELECT COUNT(*) AS n FROM journal_posts WHERE author_id = $1 AND submitted_at IS NOT NULL AND published_at IS NULL",
    [authorId],
  );
  if (Number(pending.rows[0]?.n ?? 0) >= MAX_PENDING)
    throw new JournalError(
      `You have ${MAX_PENDING} posts waiting for review already. We’ll look at those first.`,
    );

  // A free address: the title as a slug, with -2, -3… if it's taken.
  const base = slugify(title) || "post";
  let slug = base;
  for (
    let n = 2;
    builtInSlugs.has(slug) ||
    (await db.query("SELECT 1 FROM journal_posts WHERE slug = $1", [slug])).rowCount;
    n++
  )
    slug = `${base}-${n}`;

  await db.query(
    `INSERT INTO journal_posts (slug, title, description, category, body, author_id, published_at, submitted_at)
     VALUES ($1, $2, $3, $4, $5, $6, NULL, NOW())`,
    [slug, title, input.description.trim().slice(0, 300), category, body, authorId],
  );
  return (await getJournalPost(slug, { drafts: true }))!;
}

/** A member's own submissions, newest first, with whether each is live yet. */
export async function mySubmissions(authorId: string): Promise<JournalPost[]> {
  if (!databaseConfigured()) return [];
  await ensureSchema();
  const rows = await db.query<Row>(
    `SELECT ${POST_COLUMNS} FROM journal_posts j LEFT JOIN app_users u ON u.id = j.author_id
     WHERE j.author_id = $1 AND j.submitted_at IS NOT NULL ORDER BY j.submitted_at DESC`,
    [authorId],
  );
  return rows.rows.map(fromRow);
}

/** How many member posts are waiting for review (for the owner's report). */
export async function pendingSubmissions(): Promise<number> {
  await ensureSchema();
  const result = await db.query<{ n: string }>(
    "SELECT COUNT(*) AS n FROM journal_posts WHERE submitted_at IS NOT NULL AND published_at IS NULL",
  );
  return Number(result.rows[0]?.n ?? 0);
}

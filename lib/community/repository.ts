import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import { MAX_IMAGE_DATA_URL_LENGTH } from "@/lib/portfolio/schema";
import { judgeComment, judgePost, LIMITS, safeHttpsLink, type PostKind, type Verdict } from "./rules";

/** Server-only data access for the community board. Visibility rules live here, not in pages. */

export interface Viewer { id: string; isModerator: boolean }
export type Status = "published" | "pending" | "refused" | "removed";

export interface PostSummary {
  id: string; kind: PostKind; title: string; excerpt: string; rating: number | null; link: string | null;
  status: Status; moderationNote: string | null; votes: number; commentCount: number; createdAt: string;
  author: { id: string; name: string; image: string | null }; viewerVoted: boolean; coverImageId: string | null;
}
export interface Comment { id: string; body: string; status: Status; moderationNote: string | null; createdAt: string; author: { id: string; name: string; image: string | null } }
export interface PostDetail extends PostSummary { body: string; imageIds: string[]; comments: Comment[] }

const displayName = (name: string | null, email: string | null) => name?.trim() || email?.split("@")[0] || "Member";

interface PostRow {
  id: string; kind: PostKind; title: string; body: string; rating: number | null; link: string | null; status: Status; moderation_note: string | null;
  votes: number; comment_count: number; created_at: Date; author_id: string; author_name: string | null; author_email: string | null; author_image: string | null;
  viewer_voted: boolean; cover_image_id: string | null;
}

const POST_SELECT = `
  SELECT p.id, p.kind, p.title, p.body, p.rating, p.link, p.status, p.moderation_note, p.votes, p.comment_count, p.created_at,
         u.id AS author_id, u.name AS author_name, u.email AS author_email, u.image AS author_image,
         EXISTS (SELECT 1 FROM community_votes v WHERE v.post_id = p.id AND v.user_id = $1) AS viewer_voted,
         (SELECT i.id FROM community_images i WHERE i.post_id = p.id ORDER BY i.position LIMIT 1) AS cover_image_id
  FROM community_posts p JOIN app_users u ON u.id = p.author_id`;

const toSummary = (row: PostRow): PostSummary => ({
  id: row.id, kind: row.kind, title: row.title, excerpt: row.body.length > 280 ? `${row.body.slice(0, 277).trimEnd()}…` : row.body,
  rating: row.rating, link: row.link, status: row.status, moderationNote: row.moderation_note, votes: row.votes, commentCount: row.comment_count,
  createdAt: row.created_at.toISOString(), author: { id: row.author_id, name: displayName(row.author_name, row.author_email), image: row.author_image },
  viewerVoted: row.viewer_voted, coverImageId: row.cover_image_id,
});

export async function listPosts({ kind, sort, limit, offset, viewerId }: { kind?: PostKind; sort: "top" | "new"; limit: number; offset: number; viewerId?: string | null }): Promise<{ posts: PostSummary[]; total: number }> {
  await ensureSchema();
  const order = sort === "top" ? "p.votes DESC, p.comment_count DESC, p.created_at DESC" : "p.created_at DESC";
  const params: unknown[] = [viewerId ?? null, limit, offset];
  const kindFilter = kind ? `AND p.kind = $${params.push(kind)}` : "";
  const [rows, count] = await Promise.all([
    db.query<PostRow>(`${POST_SELECT} WHERE p.status = 'published' ${kindFilter} ORDER BY ${order} LIMIT $2 OFFSET $3`, params),
    db.query<{ total: string }>(`SELECT count(*) AS total FROM community_posts p WHERE p.status = 'published' ${kind ? "AND p.kind = $1" : ""}`, kind ? [kind] : []),
  ]);
  return { posts: rows.rows.map(toSummary), total: Number(count.rows[0].total) };
}

/** Review stats for the board header. */
export async function reviewStats(): Promise<{ count: number; average: number | null }> {
  await ensureSchema();
  const result = await db.query<{ count: string; average: string | null }>("SELECT count(*) AS count, avg(rating) AS average FROM community_posts WHERE kind = 'review' AND status = 'published'");
  return { count: Number(result.rows[0].count), average: result.rows[0].average ? Number(result.rows[0].average) : null };
}

/** A post the viewer may see: published, or their own, or any for moderators. */
export async function getPost(id: string, viewer: Viewer | null): Promise<PostDetail | null> {
  await ensureSchema();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const row = (await db.query<PostRow>(`${POST_SELECT} WHERE p.id = $2`, [viewer?.id ?? null, id])).rows[0];
  if (!row) return null;
  const canSee = row.status === "published" || viewer?.isModerator || viewer?.id === row.author_id;
  if (!canSee) return null;
  const [images, comments] = await Promise.all([
    db.query<{ id: string }>("SELECT id FROM community_images WHERE post_id = $1 ORDER BY position", [id]),
    db.query<{ id: string; body: string; status: Status; moderation_note: string | null; created_at: Date; author_id: string; author_name: string | null; author_email: string | null; author_image: string | null }>(
      `SELECT c.id, c.body, c.status, c.moderation_note, c.created_at, u.id AS author_id, u.name AS author_name, u.email AS author_email, u.image AS author_image
       FROM community_comments c JOIN app_users u ON u.id = c.author_id
       WHERE c.post_id = $1 AND (c.status = 'published' OR c.author_id = $2 OR $3)
       ORDER BY c.created_at`,
      [id, viewer?.id ?? null, viewer?.isModerator ?? false],
    ),
  ]);
  return {
    ...toSummary(row),
    body: row.body,
    imageIds: images.rows.map((image) => image.id),
    comments: comments.rows.map((comment) => ({ id: comment.id, body: comment.body, status: comment.status, moderationNote: comment.moderation_note, createdAt: comment.created_at.toISOString(), author: { id: comment.author_id, name: displayName(comment.author_name, comment.author_email), image: comment.author_image } })),
  };
}

async function authorHistory(userId: string) {
  const result = await db.query<{ last_hour: string; last_day: string; has_published: boolean; has_live_review: boolean }>(
    `SELECT count(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') AS last_hour,
            count(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 day') AS last_day,
            bool_or(status = 'published') IS TRUE AS has_published,
            bool_or(kind = 'review' AND status IN ('published', 'pending')) IS TRUE AS has_live_review
     FROM community_posts WHERE author_id = $1`,
    [userId],
  );
  const recent = await db.query<{ body: string }>(`SELECT body FROM community_posts WHERE author_id = $1 AND created_at > NOW() - make_interval(days => $2) AND status <> 'removed'`, [userId, LIMITS.duplicateWindowDays]);
  const row = result.rows[0];
  return { postsLastHour: Number(row.last_hour), postsLastDay: Number(row.last_day), hasPublished: row.has_published, hasLiveReview: row.has_live_review, recentBodies: recent.rows.map((item) => item.body) };
}

const IMAGE_DATA_URL = /^data:(image\/(?:png|jpeg|webp|gif));base64,([a-z0-9+/=]+)$/i;

/** Decodes browser-compressed images; anything that isn't a small PNG/JPEG/WebP/GIF is rejected. */
export function decodeImages(images: unknown): Array<{ mime: string; data: Buffer }> | null {
  if (images === undefined || images === null) return [];
  if (!Array.isArray(images) || images.length > LIMITS.images.max) return null;
  const decoded: Array<{ mime: string; data: Buffer }> = [];
  for (const image of images) {
    if (typeof image !== "string" || image.length > MAX_IMAGE_DATA_URL_LENGTH) return null;
    const match = image.match(IMAGE_DATA_URL);
    if (!match) return null;
    decoded.push({ mime: match[1].toLowerCase(), data: Buffer.from(match[2], "base64") });
  }
  return decoded;
}

export type CreateResult = { ok: true; post: PostDetail; verdict: Exclude<Verdict, { outcome: "refuse" }> } | { ok: false; status: number; code: string; error: string };

export async function createPost(viewer: Viewer, input: { kind: PostKind; title: string; body: string; rating?: number | null; link?: string | null }, images: Array<{ mime: string; data: Buffer }>): Promise<CreateResult> {
  await ensureSchema();
  const verdict = judgePost({ ...input, imageCount: images.length }, await authorHistory(viewer.id));
  if (verdict.outcome === "refuse") return { ok: false, status: verdict.code === "rate_limited" ? 429 : 422, code: verdict.code, error: verdict.message };
  const client = await db.connect();
  let id: string;
  try {
    await client.query("BEGIN");
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO community_posts (author_id, kind, title, body, rating, link, status, moderation_note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [viewer.id, input.kind, input.title.trim(), input.body.trim(), input.kind === "review" ? input.rating : null, safeHttpsLink(input.link), verdict.outcome === "hold" ? "pending" : "published", verdict.outcome === "hold" ? verdict.reason : null],
    );
    id = inserted.rows[0].id;
    for (const [position, image] of images.entries()) await client.query("INSERT INTO community_images (post_id, position, mime, data) VALUES ($1, $2, $3, $4)", [id, position, image.mime, image.data]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    // The one-review-per-person index can also catch a race between two tabs.
    if ((error as { code?: string }).code === "23505") return { ok: false, status: 422, code: "already_reviewed", error: "You’ve already reviewed Formora. Edit your existing review instead." };
    throw error;
  } finally {
    client.release();
  }
  return { ok: true, post: (await getPost(id, viewer))!, verdict };
}

/** Authors can edit and resubmit their own posts (not ones a moderator removed). The edit is judged again. */
export async function updatePost(viewer: Viewer, id: string, input: { title: string; body: string; rating?: number | null; link?: string | null }): Promise<CreateResult> {
  await ensureSchema();
  const current = (await db.query<{ author_id: string; kind: PostKind; status: Status; image_count: string }>(
    "SELECT author_id, kind, status, (SELECT count(*) FROM community_images WHERE post_id = $1) AS image_count FROM community_posts WHERE id = $1", [id],
  )).rows[0];
  if (!current || current.author_id !== viewer.id) return { ok: false, status: 404, code: "not_found", error: "Post not found." };
  if (current.status === "removed") return { ok: false, status: 403, code: "removed", error: "A moderator removed this post, so it can’t be edited." };
  const history = await authorHistory(viewer.id);
  const verdict = judgePost({ kind: current.kind, ...input, imageCount: Number(current.image_count) }, history, { editing: true });
  if (verdict.outcome === "refuse") return { ok: false, status: 422, code: verdict.code, error: verdict.message };
  // Designs that weren't live yet go back to a moderator; anything the rules would hold goes back too.
  // Otherwise the edit is published (this is how a refused suggestion is fixed and resubmitted).
  const status: Status = verdict.outcome === "hold" || (current.kind === "design" && current.status !== "published") ? "pending" : "published";
  await db.query(
    `UPDATE community_posts SET title = $2, body = $3, rating = $4, link = $5, status = $6, moderation_note = $7, updated_at = NOW() WHERE id = $1`,
    [id, input.title.trim(), input.body.trim(), current.kind === "review" ? input.rating : null, safeHttpsLink(input.link), status, verdict.outcome === "hold" ? verdict.reason : null],
  );
  return { ok: true, post: (await getPost(id, viewer))!, verdict };
}

export async function deletePost(viewer: Viewer, id: string): Promise<boolean> {
  await ensureSchema();
  const result = await db.query("DELETE FROM community_posts WHERE id = $1 AND (author_id = $2 OR $3)", [id, viewer.id, viewer.isModerator]);
  return Boolean(result.rowCount);
}

/** Toggles an upvote. Only published posts, and not your own. */
export async function toggleVote(viewer: Viewer, id: string): Promise<{ ok: true; voted: boolean; votes: number } | { ok: false; status: number; error: string }> {
  await ensureSchema();
  const post = (await db.query<{ author_id: string; status: Status }>("SELECT author_id, status FROM community_posts WHERE id = $1", [id])).rows[0];
  if (!post || post.status !== "published") return { ok: false, status: 404, error: "Post not found." };
  if (post.author_id === viewer.id) return { ok: false, status: 422, error: "You can’t vote for your own post." };
  const removed = await db.query("DELETE FROM community_votes WHERE post_id = $1 AND user_id = $2", [id, viewer.id]);
  if (!removed.rowCount) await db.query("INSERT INTO community_votes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [id, viewer.id]);
  const votes = await db.query<{ votes: number }>("UPDATE community_posts SET votes = (SELECT count(*) FROM community_votes WHERE post_id = $1) WHERE id = $1 RETURNING votes", [id]);
  return { ok: true, voted: !removed.rowCount, votes: votes.rows[0].votes };
}

export async function addComment(viewer: Viewer, postId: string, text: string): Promise<{ ok: true; comment: Comment } | { ok: false; status: number; code: string; error: string }> {
  await ensureSchema();
  const post = (await db.query<{ status: Status }>("SELECT status FROM community_posts WHERE id = $1", [postId])).rows[0];
  if (!post || post.status !== "published") return { ok: false, status: 404, code: "not_found", error: "You can only comment on published posts." };
  const history = await db.query<{ last_hour: string }>("SELECT count(*) AS last_hour FROM community_comments WHERE author_id = $1 AND created_at > NOW() - INTERVAL '1 hour'", [viewer.id]);
  const recent = await db.query<{ body: string }>("SELECT body FROM community_comments WHERE author_id = $1 AND post_id = $2 AND status <> 'removed'", [viewer.id, postId]);
  const verdict = judgeComment(text, { commentsLastHour: Number(history.rows[0].last_hour), recentBodies: recent.rows.map((row) => row.body) });
  if (verdict.outcome === "refuse") return { ok: false, status: verdict.code === "rate_limited" ? 429 : 422, code: verdict.code, error: verdict.message };
  const inserted = await db.query<{ id: string; created_at: Date }>("INSERT INTO community_comments (post_id, author_id, body, status) VALUES ($1, $2, $3, 'published') RETURNING id, created_at", [postId, viewer.id, text.trim()]);
  await db.query("UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = $1", [postId]);
  const author = (await db.query<{ name: string | null; email: string | null; image: string | null }>("SELECT name, email, image FROM app_users WHERE id = $1", [viewer.id])).rows[0];
  return { ok: true, comment: { id: inserted.rows[0].id, body: text.trim(), status: "published", moderationNote: null, createdAt: inserted.rows[0].created_at.toISOString(), author: { id: viewer.id, name: displayName(author.name, author.email), image: author.image } } };
}

export async function deleteComment(viewer: Viewer, id: string): Promise<boolean> {
  await ensureSchema();
  const result = await db.query<{ post_id: string; status: Status }>("DELETE FROM community_comments WHERE id = $1 AND (author_id = $2 OR $3) RETURNING post_id, status", [id, viewer.id, viewer.isModerator]);
  const row = result.rows[0];
  if (row?.status === "published") await db.query("UPDATE community_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = $1", [row.post_id]);
  return Boolean(row);
}

// ---------------------------------------------------------------------------
// Moderation
// ---------------------------------------------------------------------------

export type ModerationAction = "approve" | "refuse" | "remove";

/**
 * approve: pending/refused/removed → published.
 * refuse:  pending → refused (never shown; author sees the reason and can edit and resubmit).
 * remove:  published → removed (taken down; author sees the reason).
 * Refusing and removing require a reason the author will read.
 */
export async function moderatePost(moderatorId: string, id: string, action: ModerationAction, note: string | null): Promise<{ ok: true; status: Status } | { ok: false; status: number; error: string }> {
  await ensureSchema();
  const reason = note?.trim() || null;
  if (action !== "approve" && (!reason || reason.length < 5)) return { ok: false, status: 422, error: "Write a short reason. The author will see it." };
  const transitions: Record<ModerationAction, { from: Status[]; to: Status }> = {
    approve: { from: ["pending", "refused", "removed"], to: "published" },
    refuse: { from: ["pending"], to: "refused" },
    remove: { from: ["published"], to: "removed" },
  };
  const { from, to } = transitions[action];
  const result = await db.query(
    "UPDATE community_posts SET status = $2, moderation_note = $3, moderated_by = $4, moderated_at = NOW() WHERE id = $1 AND status = ANY($5) RETURNING id",
    [id, to, action === "approve" ? null : reason, moderatorId, from],
  );
  if (!result.rowCount) return { ok: false, status: 409, error: "That post has already been moderated or changed. Refresh to see its current state." };
  return { ok: true, status: to };
}

export async function moderateComment(id: string, action: "remove" | "approve", note: string | null): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  await ensureSchema();
  const reason = note?.trim() || null;
  if (action === "remove" && (!reason || reason.length < 5)) return { ok: false, status: 422, error: "Write a short reason. The author will see it." };
  const result = await db.query<{ post_id: string }>(
    "UPDATE community_comments SET status = $2, moderation_note = $3, moderated_at = NOW() WHERE id = $1 AND status = $4 RETURNING post_id",
    [id, action === "remove" ? "removed" : "published", action === "remove" ? reason : null, action === "remove" ? "published" : "removed"],
  );
  const row = result.rows[0];
  if (!row) return { ok: false, status: 409, error: "That comment has already been moderated." };
  await db.query("UPDATE community_posts SET comment_count = (SELECT count(*) FROM community_comments WHERE post_id = $1 AND status = 'published') WHERE id = $1", [row.post_id]);
  return { ok: true };
}

/** Posts waiting for a moderator, oldest first, plus recently refused or removed ones. */
export async function moderationQueue(moderatorId: string): Promise<{ pending: PostSummary[]; recent: PostSummary[] }> {
  await ensureSchema();
  const [pending, recent] = await Promise.all([
    db.query<PostRow>(`${POST_SELECT} WHERE p.status = 'pending' ORDER BY p.created_at`, [moderatorId]),
    db.query<PostRow>(`${POST_SELECT} WHERE p.status IN ('refused', 'removed') ORDER BY p.moderated_at DESC NULLS LAST LIMIT 20`, [moderatorId]),
  ]);
  return { pending: pending.rows.map(toSummary), recent: recent.rows.map(toSummary) };
}

/** The viewer's own posts that aren't public, with the moderator's note: what was held, refused or removed, and why. */
export async function myUnpublished(viewer: Viewer): Promise<Array<PostSummary & { body: string }>> {
  await ensureSchema();
  const rows = await db.query<PostRow>(`${POST_SELECT} WHERE p.author_id = $1 AND p.status <> 'published' ORDER BY p.updated_at DESC LIMIT 20`, [viewer.id]);
  // The full body is included so "Edit" starts from the complete text, not the excerpt.
  return rows.rows.map((row) => ({ ...toSummary(row), body: row.body }));
}

/** An image is served if its post is visible to the viewer. */
export async function getImage(id: string, viewer: Viewer | null): Promise<{ mime: string; data: Buffer; isPublic: boolean } | null> {
  await ensureSchema();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const row = (await db.query<{ mime: string; data: Buffer; status: Status; author_id: string }>(
    "SELECT i.mime, i.data, p.status, p.author_id FROM community_images i JOIN community_posts p ON p.id = i.post_id WHERE i.id = $1", [id],
  )).rows[0];
  if (!row) return null;
  const isPublic = row.status === "published";
  if (!isPublic && !viewer?.isModerator && viewer?.id !== row.author_id) return null;
  return { mime: row.mime, data: row.data, isPublic };
}

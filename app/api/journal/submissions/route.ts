import { jsonError, readJson, route } from "@/lib/api/http";
import { JournalError, mySubmissions, submitJournalPost } from "@/lib/content/journal";
import { alertOwner } from "@/lib/owner/alerts";
import { rateLimit } from "@/lib/security/rate-limit";
import { siteUrl } from "@/lib/site";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

export const dynamic = "force-dynamic";

/** Posts a member can send a day (spam guard; the pending limit lives in journal.ts). */
const SUBMISSIONS_PER_DAY = 3;

/** The signed-in member's own submissions and whether each is live. */
export const GET = route(async () => {
  if (!databaseConfigured()) return jsonError(503, "Writing needs the database.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to write for the Journal.");
  return Response.json({ posts: await mySubmissions(user.id) });
});

/** Sends a post for review. Body: { title, description, category, body }. */
export const POST = route(async (request: Request) => {
  if (!databaseConfigured()) return jsonError(503, "Writing needs the database.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to write for the Journal.");
  const body = await readJson(request, 200_000);
  if (body instanceof Response) return body;
  const input = (body ?? {}) as Record<string, unknown>;
  const text = (key: string) => (typeof input[key] === "string" ? (input[key] as string) : "");
  if (!(await rateLimit(`journal-submit:${user.id}`, SUBMISSIONS_PER_DAY, 86_400)))
    return jsonError(429, "That’s plenty for today. Send the next one tomorrow.");
  try {
    const post = await submitJournalPost(
      {
        title: text("title"),
        description: text("description"),
        category: text("category"),
        body: text("body"),
      },
      user.id,
    );
    await alertOwner(
      `New Journal post to review: ${post.title}`,
      [
        `${user.name || user.email || "A member"} sent “${post.title}” (${post.category}) for the Journal.`,
        "It stays private until you publish it. Open the Journal editor, read it, then Publish or Delete.",
      ],
      { label: "Review it", url: `${siteUrl}/admin/journal` },
    );
    return Response.json({ post, posts: await mySubmissions(user.id) }, { status: 201 });
  } catch (error) {
    if (error instanceof JournalError) return jsonError(422, error.message);
    throw error;
  }
});

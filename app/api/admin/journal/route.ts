import { revalidatePath } from "next/cache";
import { jsonError, readJson, route } from "@/lib/api/http";
import { deleteJournalPost, JournalError, listJournal, saveJournalPost } from "@/lib/content/journal";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

async function admin() {
  if (!databaseConfigured()) return jsonError(503, "The Journal editor needs the database.");
  const user = await getCurrentUser();
  return user && user.isAdmin ? user : jsonError(404, "Not found.");
}

const refresh = (slug?: string) => { revalidatePath("/blog"); if (slug) revalidatePath(`/blog/${slug}`); revalidatePath("/sitemap.xml"); };

/** Every post, drafts included. Admins only. */
export const GET = route(async () => {
  const user = await admin();
  if (user instanceof Response) return user;
  return Response.json({ posts: await listJournal({ drafts: true }) });
});

/** Save a post. Send `originalSlug` when editing an existing one. */
export const POST = route(async (request: Request) => {
  const user = await admin();
  if (user instanceof Response) return user;
  const body = await readJson(request, 220_000);
  if (body instanceof Response) return body;
  const input = (body ?? {}) as Record<string, unknown>;
  const text = (key: string) => (typeof input[key] === "string" ? (input[key] as string) : "");
  try {
    const post = await saveJournalPost({ title: text("title"), description: text("description"), category: text("category"), body: text("body"), slug: text("slug"), publish: input.publish === true }, user.id, text("originalSlug") || undefined);
    refresh(post.slug);
    if (text("originalSlug") && text("originalSlug") !== post.slug) refresh(text("originalSlug"));
    return Response.json({ post });
  } catch (error) {
    if (error instanceof JournalError) return jsonError(422, error.message);
    throw error;
  }
});

/** Delete a post (or, for a built-in article, discard the edit and restore the original). */
export const DELETE = route(async (request: Request) => {
  const user = await admin();
  if (user instanceof Response) return user;
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!slug) return jsonError(422, "Which post?");
  await deleteJournalPost(slug);
  refresh(slug);
  return Response.json({ ok: true });
});

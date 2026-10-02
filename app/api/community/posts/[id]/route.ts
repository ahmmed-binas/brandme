import { revalidatePath } from "next/cache";
import { jsonError, readJson, route } from "@/lib/api/http";
import { refusal, requireViewer } from "@/lib/community/http";
import { deletePost, updatePost } from "@/lib/community/repository";

type Context = { params: Promise<{ id: string }> };

/** Edit and resubmit your own post. The edit is checked against the rules again. */
export const PATCH = route(async (request: Request, { params }: Context) => {
  const viewer = await requireViewer();
  if (viewer instanceof Response) return viewer;
  const { id } = await params;
  const body = await readJson(request, 20_000);
  if (body instanceof Response) return body;
  const { title, body: text, rating, link } = (body ?? {}) as Record<string, unknown>;
  const result = await updatePost(viewer, id, { title: String(title ?? ""), body: String(text ?? ""), rating: typeof rating === "number" ? rating : null, link: typeof link === "string" ? link : null });
  if (!result.ok) return refusal(result.status, result.code, result.error);
  revalidatePath("/community");
  revalidatePath(`/community/${id}`);
  return Response.json({ post: result.post, held: result.verdict.outcome === "hold" ? result.verdict.reason : null });
});

/** Authors delete their own posts; moderators can delete any. */
export const DELETE = route(async (_request: Request, { params }: Context) => {
  const viewer = await requireViewer();
  if (viewer instanceof Response) return viewer;
  const { id } = await params;
  if (!(await deletePost(viewer, id))) return jsonError(404, "Post not found.");
  revalidatePath("/community");
  return Response.json({ deleted: true });
});

import { jsonError, readJson, requireOwner, route } from "@/lib/api/http";
import { BLOG_UPGRADE, deletePost, PostError, updatePost, type PostInput } from "@/lib/portfolio/posts";

type Context = { params: Promise<{ templateId: string; postId: string }> };

/** Updates a post. Only the fields sent change; `publish` true/false publishes or unpublishes it. */
export const PATCH = route(async (request: Request, { params }: Context) => {
  const owner = await requireOwner(params);
  if (owner instanceof Response) return owner;
  if (!owner.user.plan.blog) return jsonError(402, BLOG_UPGRADE);
  const body = await readJson(request, 80_000);
  if (body instanceof Response) return body;
  try {
    const post = await updatePost(owner.user.id, owner.templateId, (await params).postId, (body ?? {}) as PostInput);
    return post ? Response.json({ post }) : jsonError(404, "That post no longer exists.");
  } catch (error) {
    if (error instanceof PostError) return jsonError(422, error.message);
    throw error;
  }
});

export const DELETE = route(async (_request: Request, { params }: Context) => {
  const owner = await requireOwner(params);
  if (owner instanceof Response) return owner;
  return await deletePost(owner.user.id, owner.templateId, (await params).postId) ? Response.json({ ok: true }) : jsonError(404, "That post no longer exists.");
});

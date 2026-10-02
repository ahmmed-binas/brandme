import { jsonError, readJson, requireOwner, route } from "@/lib/api/http";
import { createPost, listPosts, PostError, type PostInput } from "@/lib/portfolio/posts";

type Context = { params: Promise<{ templateId: string }> };

/** The owner's posts for this portfolio, drafts included. */
export const GET = route(async (_request: Request, { params }: Context) => {
  const owner = await requireOwner(params);
  if (owner instanceof Response) return owner;
  return Response.json({ posts: await listPosts(owner.user.id, owner.templateId, { drafts: true }) });
});

/** Starts a new post (a draft unless `publish: true`). */
export const POST = route(async (request: Request, { params }: Context) => {
  const owner = await requireOwner(params);
  if (owner instanceof Response) return owner;
  const body = await readJson(request, 80_000);
  if (body instanceof Response) return body;
  try {
    return Response.json({ post: await createPost(owner.user.id, owner.templateId, (body ?? {}) as PostInput) }, { status: 201 });
  } catch (error) {
    if (error instanceof PostError) return jsonError(422, error.message);
    throw error;
  }
});

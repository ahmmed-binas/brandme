import { jsonError, readJson, route } from "@/lib/api/http";
import { addAgentComment, deleteAgentComment, listAgentComments } from "@/lib/agents/comments";
import { getViewer } from "@/lib/community/viewer";
import { LIMITS } from "@/lib/community/rules";
import { databaseConfigured } from "@/utils/db-schema";

/** GET: comments on Inspector Iqbal's page, newest first, and who is asking. */
export const GET = route(async () => {
  if (!databaseConfigured()) return Response.json({ comments: [], viewer: null });
  const viewer = await getViewer();
  return Response.json({ comments: await listAgentComments("investigator"), viewer: viewer ? { id: viewer.id, isModerator: viewer.isModerator } : null });
});

/** POST { body }: adds a comment, after the community spam rules. */
export const POST = route(async (request: Request) => {
  if (!databaseConfigured()) return jsonError(503, "Comments need the database.");
  const viewer = await getViewer();
  if (!viewer) return jsonError(401, "Sign in to comment.");
  const body = await readJson(request, LIMITS.comment.max * 4 + 200);
  if (body instanceof Response) return body;
  const text = (body as { body?: unknown } | null)?.body;
  if (typeof text !== "string") return jsonError(422, "Write a comment first.");
  const result = await addAgentComment(viewer, "investigator", text);
  return result.ok ? Response.json({ comment: result.comment }) : jsonError(result.status, result.error);
});

/** DELETE ?id=: removes your own comment (moderators can remove any). */
export const DELETE = route(async (request: Request) => {
  if (!databaseConfigured()) return jsonError(503, "Comments need the database.");
  const viewer = await getViewer();
  if (!viewer) return jsonError(401, "Sign in first.");
  const id = new URL(request.url).searchParams.get("id") ?? "";
  return (await deleteAgentComment(viewer, id)) ? Response.json({ deleted: true }) : jsonError(404, "That comment can’t be removed.");
});

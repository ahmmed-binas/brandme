import { jsonError, route } from "@/lib/api/http";
import { requireViewer } from "@/lib/community/http";
import { deleteComment } from "@/lib/community/repository";

/** Authors delete their own comments; moderators can delete any. */
export const DELETE = route(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const viewer = await requireViewer();
  if (viewer instanceof Response) return viewer;
  if (!(await deleteComment(viewer, (await params).id))) return jsonError(404, "Comment not found.");
  return Response.json({ deleted: true });
});

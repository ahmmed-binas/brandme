import { jsonError, route } from "@/lib/api/http";
import { requireViewer } from "@/lib/community/http";
import { toggleVote } from "@/lib/community/repository";

/** Toggle an upvote on a published post. */
export const POST = route(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const viewer = await requireViewer();
  if (viewer instanceof Response) return viewer;
  const result = await toggleVote(viewer, (await params).id);
  if (!result.ok) return jsonError(result.status, result.error);
  return Response.json({ voted: result.voted, votes: result.votes });
});

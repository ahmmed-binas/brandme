import { revalidatePath } from "next/cache";
import { jsonError, readJson, route } from "@/lib/api/http";
import { requireViewer } from "@/lib/community/http";
import { moderatePost, type ModerationAction } from "@/lib/community/repository";

/** Moderators approve, refuse (with a reason) or remove (with a reason) a post. */
export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const viewer = await requireViewer({ moderator: true });
  if (viewer instanceof Response) return viewer;
  const { id } = await params;
  const body = await readJson(request, 4_000);
  if (body instanceof Response) return body;
  const { action, note } = (body ?? {}) as { action?: unknown; note?: unknown };
  if (action !== "approve" && action !== "refuse" && action !== "remove") return jsonError(422, "Unknown action.");
  const result = await moderatePost(viewer.id, id, action as ModerationAction, typeof note === "string" ? note : null);
  if (!result.ok) return jsonError(result.status, result.error);
  revalidatePath("/community");
  revalidatePath(`/community/${id}`);
  return Response.json({ status: result.status });
});

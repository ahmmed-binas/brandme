import { jsonError, readJson, route } from "@/lib/api/http";
import { requireViewer } from "@/lib/community/http";
import { moderateComment } from "@/lib/community/repository";

/** Moderators remove (with a reason) or restore a comment. */
export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const viewer = await requireViewer({ moderator: true });
  if (viewer instanceof Response) return viewer;
  const body = await readJson(request, 4_000);
  if (body instanceof Response) return body;
  const { action, note } = (body ?? {}) as { action?: unknown; note?: unknown };
  if (action !== "remove" && action !== "approve") return jsonError(422, "Unknown action.");
  const result = await moderateComment((await params).id, action, typeof note === "string" ? note : null);
  if (!result.ok) return jsonError(result.status, result.error);
  return Response.json({ ok: true });
});

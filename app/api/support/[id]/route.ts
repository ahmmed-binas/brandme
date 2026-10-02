import { jsonError, readJson, route } from "@/lib/api/http";
import { requireViewer } from "@/lib/community/http";
import { addMessage, setTicketStatus } from "@/lib/support/repository";
import { getCurrentUser } from "@/utils/user-account";

const UUID = /^[0-9a-f-]{36}$/;

/** Adds a reply ({ message }) or changes status ({ status: "open" | "closed" }). */
export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const viewer = await requireViewer();
  if (viewer instanceof Response) return viewer;
  const { id } = await params;
  if (!UUID.test(id)) return jsonError(404, "That request wasn’t found.");
  const body = await readJson(request, 30_000);
  if (body instanceof Response) return body;
  const { message, status } = (body ?? {}) as { message?: unknown; status?: unknown };
  if (status === "open" || status === "closed") {
    if (!(await setTicketStatus(id, { id: viewer.id, isStaff: viewer.isModerator }, status))) return jsonError(404, "That request wasn’t found.");
    return Response.json({ ok: true });
  }
  const user = await getCurrentUser();
  const result = await addMessage(id, { id: viewer.id, name: user?.name ?? null, email: user?.email ?? null, isStaff: viewer.isModerator }, String(message ?? ""));
  if (!result.ok) return jsonError(result.status, result.error);
  return Response.json({ ok: true });
});

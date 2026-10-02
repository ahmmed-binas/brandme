import { jsonError, readJson, route } from "@/lib/api/http";
import { requireViewer } from "@/lib/community/http";
import { createTicket } from "@/lib/support/repository";
import { getCurrentUser } from "@/utils/user-account";

/** Opens a private support request. */
export const POST = route(async (request: Request) => {
  const viewer = await requireViewer();
  if (viewer instanceof Response) return viewer;
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to contact support.");
  const body = await readJson(request, 30_000);
  if (body instanceof Response) return body;
  const { subject, category, message } = (body ?? {}) as Record<string, unknown>;
  const result = await createTicket({ id: user.id, name: user.name, email: user.email }, { subject: String(subject ?? ""), category: String(category ?? ""), body: String(message ?? "") });
  if (!result.ok) return jsonError(result.status, result.error);
  return Response.json({ id: result.id }, { status: 201 });
});

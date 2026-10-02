import { jsonError, readJson, route } from "@/lib/api/http";
import { decideSuggestion } from "@/lib/autoupdate/suggestions";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

const UUID = /^[0-9a-f-]{36}$/;

/** Marks a suggestion as applied (the editor already merged it) or dismissed. */
export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  if (!databaseConfigured()) return jsonError(503, "Auto-updates are not configured on this server.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to manage suggestions.");
  const { id } = await params;
  if (!UUID.test(id)) return jsonError(404, "Suggestion not found.");
  const body = await readJson(request, 200);
  if (body instanceof Response) return body;
  const action = (body as { action?: unknown } | null)?.action;
  if (action !== "applied" && action !== "dismissed") return jsonError(422, "Choose apply or dismiss.");
  if (!(await decideSuggestion(user.id, id, action))) return jsonError(404, "That suggestion was already handled.");
  return Response.json({ ok: true });
});

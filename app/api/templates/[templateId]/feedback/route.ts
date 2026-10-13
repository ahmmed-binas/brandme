import { jsonError, readJson, route } from "@/lib/api/http";
import { getTemplate } from "@/lib/templates/catalog";
import { feedbackDue, parseFeedback, saveFeedback } from "@/lib/templates/feedback";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

type Context = { params: Promise<{ templateId: string }> };

/**
 * The editor's rating pop-up.
 * GET: { due } — true when the signed-in person hasn't rated or skipped this template.
 * POST: { stars, tags, comment, secondsEditing } or { skipped: true }.
 */
const handler = route(async (request: Request, { params }: Context) => {
  const template = getTemplate((await params).templateId);
  if (!template) return jsonError(404, "Unknown template.");
  if (!databaseConfigured()) return Response.json({ due: false });
  const user = await getCurrentUser();
  if (!user)
    return request.method === "GET" ? Response.json({ due: false }) : jsonError(401, "Sign in first.");

  if (request.method === "GET") return Response.json({ due: await feedbackDue(user.id, template.id) });

  const body = await readJson(request, 2_000);
  if (body instanceof Response) return body;
  const input = parseFeedback(body);
  if (typeof input === "string") return jsonError(422, input);
  await saveFeedback(user.id, template.id, input);
  return Response.json({ saved: true });
});
export { handler as GET, handler as POST };

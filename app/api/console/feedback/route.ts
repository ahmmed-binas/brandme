import { jsonError, readJson, route } from "@/lib/api/http";
import { setFeatured } from "@/lib/templates/feedback";
import { getCurrentUser } from "@/utils/user-account";

/** Superadmin only: put a shared rating note on the home page, or take it off. */
export const POST = route(async (request: Request) => {
  const user = await getCurrentUser();
  if (!user?.isSuperadmin) return jsonError(404, "Not found.");
  const body = await readJson(request, 500);
  if (body instanceof Response) return body;
  const { userId, templateId, featured } = (body ?? {}) as Record<string, unknown>;
  if (typeof userId !== "string" || typeof templateId !== "string" || typeof featured !== "boolean")
    return jsonError(422, "Send userId, templateId and featured.");
  const changed = await setFeatured(userId, templateId, featured);
  return changed
    ? Response.json({ featured })
    : jsonError(409, "Only notes people agreed to share can go on.");
});

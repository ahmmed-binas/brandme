import { jsonError, readJson, route } from "@/lib/api/http";
import { setRatingHidden } from "@/lib/templates/ratings";
import { getCurrentUser } from "@/utils/user-account";

/** Superadmin only: take a rating's comment off its page, or put it back. */
export const POST = route(async (request: Request) => {
  const user = await getCurrentUser();
  if (!user?.isSuperadmin) return jsonError(404, "Not found.");
  const body = await readJson(request, 500);
  if (body instanceof Response) return body;
  const { userId, key, hidden } = (body ?? {}) as Record<string, unknown>;
  if (typeof userId !== "string" || typeof key !== "string" || typeof hidden !== "boolean")
    return jsonError(422, "Send userId, key and hidden.");
  return (await setRatingHidden(userId, key, hidden))
    ? Response.json({ hidden })
    : jsonError(404, "That rating no longer exists.");
});

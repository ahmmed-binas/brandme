import { jsonError, readJson, route } from "@/lib/api/http";
import { revalidatePath } from "next/cache";
import { SITE_RATING_KEY, setRatingHidden, setRatingOnHome } from "@/lib/templates/ratings";
import { getCurrentUser } from "@/utils/user-account";

/**
 * Superadmin only. Send { userId, key } and either:
 * - hidden: true/false to take a comment off its page or put it back, or
 * - onHome: true/false to show a review of Kitefolio on the home page.
 */
export const POST = route(async (request: Request) => {
  const user = await getCurrentUser();
  if (!user?.isSuperadmin) return jsonError(404, "Not found.");
  const body = await readJson(request, 500);
  if (body instanceof Response) return body;
  const { userId, key, hidden, onHome } = (body ?? {}) as Record<string, unknown>;
  if (typeof userId !== "string" || typeof key !== "string") return jsonError(422, "Send userId and key.");
  if (typeof onHome === "boolean") {
    if (key !== SITE_RATING_KEY) return jsonError(422, "Only reviews of Kitefolio go on the home page.");
    if (!(await setRatingOnHome(userId, key, onHome)))
      return jsonError(409, "Only reviews with a comment can go on the home page.");
    revalidatePath("/");
    return Response.json({ onHome });
  }
  if (typeof hidden !== "boolean") return jsonError(422, "Send hidden or onHome.");
  if (!(await setRatingHidden(userId, key, hidden))) return jsonError(404, "That rating no longer exists.");
  // Reviews of Kitefolio show on the cached home page.
  if (key === SITE_RATING_KEY) revalidatePath("/");
  return Response.json({ hidden });
});

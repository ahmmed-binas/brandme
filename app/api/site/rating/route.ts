import { revalidatePath } from "next/cache";
import { route } from "@/lib/api/http";
import { SITE_RATING_KEY } from "@/lib/templates/ratings";
import { ratingResponse } from "@/lib/templates/rating-route";

/**
 * Ratings of Kitefolio itself, from the home page's reviews section.
 * GET: the average, count and your own rating. POST: rate 1–5 stars, with an
 * optional comment and “show my name and photo” choice (see rating-route.ts).
 */
const handler = route(async (request: Request) => {
  const response = await ratingResponse(request, SITE_RATING_KEY);
  // The home page is cached for a few minutes; show a new review straight away.
  if (request.method === "POST" && response.ok) revalidatePath("/");
  return response;
});
export { handler as GET, handler as POST };

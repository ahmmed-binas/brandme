import { route } from "@/lib/api/http";
import { ratingResponse } from "@/lib/templates/rating-route";

/** GET: Inspector Iqbal's average, count and your own rating. POST: rate him 1–5 stars, or `stars: null` to remove. */
const handler = route(async (request: Request) => ratingResponse(request, "agent:investigator"));
export { handler as GET, handler as POST };

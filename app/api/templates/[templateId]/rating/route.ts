import { jsonError, route } from "@/lib/api/http";
import { getTemplate } from "@/lib/templates/catalog";
import { ratingResponse } from "@/lib/templates/rating-route";

type Context = { params: Promise<{ templateId: string }> };

/** GET: the template's average, count and your own rating. POST: rate it 1–5 stars, or `stars: null` to remove. */
const handler = route(async (request: Request, { params }: Context) => {
  const template = getTemplate((await params).templateId);
  return template ? ratingResponse(request, template.id) : jsonError(404, "Unknown template.");
});
export { handler as GET, handler as POST };

import { jsonError, route } from "@/lib/api/http";
import { getJournalPost } from "@/lib/content/journal";
import { ratingResponse } from "@/lib/templates/rating-route";

/** Star ratings for a published Journal post (same system as templates). */
const handler = route(async (request: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const post = await getJournalPost((await params).slug);
  return post ? ratingResponse(request, `journal:${post.slug}`) : jsonError(404, "Unknown post.");
});
export { handler as GET, handler as POST };

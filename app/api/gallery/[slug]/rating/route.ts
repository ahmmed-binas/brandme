import { jsonError, route } from "@/lib/api/http";
import { getSubmission } from "@/lib/gallery/submissions";
import { ratingResponse } from "@/lib/templates/rating-route";

/** Ratings for an approved community template (same system as the studio's templates). */
const handler = route(async (request: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const submission = await getSubmission({ slug: (await params).slug });
  return submission?.status === "approved" ? ratingResponse(request, `community:${submission.slug}`) : jsonError(404, "Unknown template.");
});
export { handler as GET, handler as POST };

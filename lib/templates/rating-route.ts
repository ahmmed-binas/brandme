import { jsonError, readJson } from "@/lib/api/http";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";
import { rateTemplate, ratingSummary, userRating } from "./ratings";

const MAX_COMMENT = 500;

/**
 * Shared by template, agent, blog and community-template rating routes.
 * GET: the summary, plus your own rating, comment and “show publicly” choice.
 * POST: { stars: 1–5 | null, comment?, public? }. Sending a comment (even an
 * empty one) saves the comment and the public choice; leaving it out only
 * changes the stars.
 */
export async function ratingResponse(request: Request, key: string): Promise<Response> {
  if (request.method === "GET") {
    const user = databaseConfigured() ? await getCurrentUser() : null;
    const mine = user ? await userRating(user.id, key) : null;
    return Response.json({
      ...(await ratingSummary(key)),
      mine: mine?.stars ?? null,
      comment: mine?.comment ?? null,
      public: mine?.public ?? false,
      signedIn: Boolean(user),
    });
  }
  if (!databaseConfigured()) return jsonError(503, "Ratings need the database.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to rate.");
  const body = await readJson(request, 2_000);
  if (body instanceof Response) return body;
  const value = (body ?? {}) as { stars?: unknown; comment?: unknown; public?: unknown };
  const stars = value.stars;
  if (stars !== null && !(Number.isInteger(stars) && (stars as number) >= 1 && (stars as number) <= 5))
    return jsonError(422, "Choose between 1 and 5 stars.");
  let note: { comment: string | null; public: boolean } | undefined;
  if (typeof value.comment === "string") {
    const comment = value.comment.trim();
    if (comment.length > MAX_COMMENT) return jsonError(422, `Keep it under ${MAX_COMMENT} characters.`);
    note = { comment: comment || null, public: value.public === true };
  }
  await rateTemplate(user.id, key, stars as number | null, note);
  return Response.json({
    ...(await ratingSummary(key)),
    mine: stars,
    comment: note?.comment ?? null,
    public: note?.public ?? false,
    signedIn: true,
  });
}

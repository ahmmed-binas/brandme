import { jsonError, readJson } from "@/lib/api/http";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";
import { rateTemplate, ratingSummary, userRating } from "./ratings";

/** Shared by template and community-template rating routes: GET the summary, POST 1–5 stars or null. */
export async function ratingResponse(request: Request, key: string): Promise<Response> {
  if (request.method === "GET") {
    const user = databaseConfigured() ? await getCurrentUser() : null;
    return Response.json({ ...(await ratingSummary(key)), mine: user ? await userRating(user.id, key) : null, signedIn: Boolean(user) });
  }
  if (!databaseConfigured()) return jsonError(503, "Ratings need the database.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to rate templates.");
  const body = await readJson(request, 200);
  if (body instanceof Response) return body;
  const stars = (body as { stars?: unknown } | null)?.stars;
  if (stars !== null && !(Number.isInteger(stars) && (stars as number) >= 1 && (stars as number) <= 5)) return jsonError(422, "Choose between 1 and 5 stars.");
  await rateTemplate(user.id, key, stars as number | null);
  return Response.json({ ...(await ratingSummary(key)), mine: stars, signedIn: true });
}

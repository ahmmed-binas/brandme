import { jsonError, readJson, route } from "@/lib/api/http";
import { getTemplate } from "@/lib/templates/catalog";
import { rateTemplate, ratingSummary, userRating } from "@/lib/templates/ratings";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

type Context = { params: Promise<{ templateId: string }> };

/** The template's average, count, and the signed-in person's own rating. */
export const GET = route(async (_request: Request, { params }: Context) => {
  const template = getTemplate((await params).templateId);
  if (!template) return jsonError(404, "Unknown template.");
  const user = databaseConfigured() ? await getCurrentUser() : null;
  return Response.json({ ...(await ratingSummary(template.id)), mine: user ? await userRating(user.id, template.id) : null, signedIn: Boolean(user) });
});

/** Rate a template 1–5 stars, or send `stars: null` to remove your rating. */
export const POST = route(async (request: Request, { params }: Context) => {
  if (!databaseConfigured()) return jsonError(503, "Ratings need the database.");
  const template = getTemplate((await params).templateId);
  if (!template) return jsonError(404, "Unknown template.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to rate templates.");
  const body = await readJson(request, 200);
  if (body instanceof Response) return body;
  const stars = (body as { stars?: unknown } | null)?.stars;
  if (stars !== null && !(Number.isInteger(stars) && (stars as number) >= 1 && (stars as number) <= 5)) return jsonError(422, "Choose between 1 and 5 stars.");
  await rateTemplate(user.id, template.id, stars as number | null);
  return Response.json({ ...(await ratingSummary(template.id)), mine: stars, signedIn: true });
});

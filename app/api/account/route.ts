import { revalidatePath } from "next/cache";
import { jsonError, readJson, route } from "@/lib/api/http";
import { listDrafts } from "@/lib/portfolio/repository";
import { db } from "@/utils/db";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

/**
 * Permanently deletes the signed-in user's account: profile, portfolios
 * (published pages go offline), custom-domain connections, AI usage and
 * community posts. Body must be { confirm: "DELETE" }.
 */
export const DELETE = route(async (request: Request) => {
  if (!databaseConfigured()) return jsonError(503, "Accounts are not configured on this server.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to delete your account.");
  const body = await readJson(request, 200);
  if (body instanceof Response) return body;
  if ((body as { confirm?: unknown } | null)?.confirm !== "DELETE") return jsonError(422, "Type DELETE to confirm.");
  const slugs = (await listDrafts(user.id)).map((draft) => draft.slug).filter((slug): slug is string => Boolean(slug));
  // Every table that references the user cascades from app_users.
  await db.query("DELETE FROM app_users WHERE id = $1", [user.id]);
  for (const slug of slugs) revalidatePath(`/p/${slug}`);
  return Response.json({ deleted: true });
});

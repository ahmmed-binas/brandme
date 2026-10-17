import { revalidatePath } from "next/cache";
import { jsonError, readJson, route } from "@/lib/api/http";
import { getTemplate } from "@/lib/templates/catalog";
import { cleanBadges, saveOverride } from "@/lib/templates/overrides";
import { getCurrentUser } from "@/utils/user-account";

/**
 * Superadmin only: a template's labels and Pro switch (Console > Catalog).
 * Send { templateId, badges: string[], proOnly: true | false | null }, where
 * null means "as in the catalogue". Cards everywhere update straight away.
 */
export const POST = route(async (request: Request) => {
  const user = await getCurrentUser();
  if (!user?.isSuperadmin) return jsonError(404, "Not found.");
  const body = await readJson(request, 2_000);
  if (body instanceof Response) return body;
  const { templateId, badges, proOnly } = (body ?? {}) as Record<string, unknown>;
  if (typeof templateId !== "string" || !getTemplate(templateId)) return jsonError(422, "Unknown template.");
  if (proOnly !== null && typeof proOnly !== "boolean")
    return jsonError(422, "proOnly must be true, false or null.");
  const clean = cleanBadges(badges);
  await saveOverride(templateId, { badges: clean, proOnly });
  revalidatePath("/", "layout");
  return Response.json({ badges: clean, proOnly });
});

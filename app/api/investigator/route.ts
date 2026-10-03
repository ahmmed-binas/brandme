import { jsonError, readJson, route } from "@/lib/api/http";
import { accessFor, getSettings, saveSettings, SettingsError, FREQUENCIES, FREQUENCY_LABEL } from "@/lib/investigator/settings";
import { LINK_KINDS } from "@/lib/investigator/links";
import { recentRuns } from "@/lib/investigator/run";
import { getTemplate } from "@/lib/templates/catalog";
import { db } from "@/utils/db";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

/** Settings, what the plan allows, the owner's portfolios and recent checks. */
export const GET = route(async () => {
  if (!databaseConfigured()) return jsonError(503, "The Investigator needs the database.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in first.");
  const portfolios = (await db.query<{ template_id: string; name: string | null }>("SELECT template_id, content->>'name' AS name FROM portfolios WHERE owner_id = $1 ORDER BY updated_at DESC", [user.id])).rows
    .map((row) => ({ templateId: row.template_id, label: `${getTemplate(row.template_id)?.name ?? row.template_id}${row.name ? ` · ${row.name}` : ""}` }));
  return Response.json({
    settings: await getSettings(user.id), access: await accessFor(user), runs: await recentRuns(user.id),
    portfolios, kinds: LINK_KINDS, frequencies: FREQUENCIES.map((id) => ({ id, label: FREQUENCY_LABEL[id] })),
  });
});

/** Save links, frequency, mode and on/off, within what the plan allows. */
export const PUT = route(async (request: Request) => {
  if (!databaseConfigured()) return jsonError(503, "The Investigator needs the database.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in first.");
  const body = await readJson(request, 20_000);
  if (body instanceof Response) return body;
  try {
    return Response.json({ settings: await saveSettings(user, (body ?? {}) as Record<string, unknown>) });
  } catch (error) {
    if (error instanceof SettingsError) return jsonError(422, error.message);
    throw error;
  }
});

import { jsonError, readJson, route } from "@/lib/api/http";
import { pendingSuggestions } from "@/lib/autoupdate/suggestions";
import { GITHUB_USERNAME } from "@/lib/import/github";
import { db } from "@/utils/db";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

/** Pending suggestions and auto-update settings for the signed-in owner. */
export const GET = route(async () => {
  if (!databaseConfigured()) return jsonError(503, "Auto-updates are not configured on this server.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to see suggestions.");
  const settings = await db.query<{ github_username: string | null; auto_update: boolean; last_synced_at: Date | null; last_research_at: Date | null }>("SELECT github_username, auto_update, last_synced_at, last_research_at FROM app_users WHERE id = $1", [user.id]);
  const row = settings.rows[0]!;
  return Response.json({
    suggestions: await pendingSuggestions(user.id),
    settings: { githubUsername: row.github_username, autoUpdate: row.auto_update, lastSyncedAt: row.last_synced_at?.toISOString() ?? null, lastResearchAt: row.last_research_at?.toISOString() ?? null },
    features: { autoSync: user.plan.autoSync, researchEveryDays: null, planName: user.plan.name },
  });
});

/** Saves auto-update settings: the GitHub account to watch and whether scheduled checks run. */
export const PUT = route(async (request: Request) => {
  if (!databaseConfigured()) return jsonError(503, "Auto-updates are not configured on this server.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to change settings.");
  const body = await readJson(request, 1_000);
  if (body instanceof Response) return body;
  const { githubUsername, autoUpdate } = (body ?? {}) as { githubUsername?: unknown; autoUpdate?: unknown };
  if (githubUsername !== undefined) {
    const name = String(githubUsername ?? "").trim().replace(/^@/, "").replace(/^https?:\/\/github\.com\//i, "").replace(/\/.*$/, "");
    if (name && !GITHUB_USERNAME.test(name)) return jsonError(422, "That isn’t a valid GitHub username.");
    await db.query("UPDATE app_users SET github_username = $2 WHERE id = $1", [user.id, name || null]);
  }
  if (typeof autoUpdate === "boolean") await db.query("UPDATE app_users SET auto_update = $2 WHERE id = $1", [user.id, autoUpdate]);
  return Response.json({ saved: true });
});

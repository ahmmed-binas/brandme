import { db } from "@/utils/db";
import { importFromGitHub } from "@/lib/import/github";
import { addSuggestions, fingerprint, knownTitles, type NewSuggestion } from "./suggestions";

/**
 * Weekly GitHub check for Pro and Premium (and on demand): new public
 * repositories that aren't on the portfolio yet become suggestions. Uses only
 * public data and no AI, so it costs nothing to run.
 */
export async function syncGitHub(ownerId: string, username: string): Promise<number> {
  const profile = await importFromGitHub(username);
  const known = await knownTitles(ownerId);
  const normalise = (title?: string) => (title ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const items: NewSuggestion[] = (profile.projects ?? []).filter((project) => project.title && !known.has(normalise(project.title))).slice(0, 4).map((project) => ({
    source: "github",
    title: `Add “${project.title}” from GitHub`,
    detail: project.description || null,
    sourceUrl: project.github ?? null,
    fingerprint: fingerprint("github", username, project.title ?? ""),
    payload: { kind: "add_project", project: { ...project, year: String(new Date().getFullYear()), category: "Open source" } },
  }));
  const added = await addSuggestions(ownerId, items);
  await db.query("UPDATE app_users SET last_synced_at = NOW() WHERE id = $1", [ownerId]);
  return added;
}

import { jsonError, readJson, route } from "@/lib/api/http";
import { openAi, releaseRequest, settleAi, sumUsage } from "@/lib/ai/metering";
import { syncGitHub } from "@/lib/autoupdate/github-sync";
import { runResearch } from "@/lib/autoupdate/research";
import { GitHubImportError } from "@/lib/import/github";
import { getDraft } from "@/lib/portfolio/repository";
import { standardContentSchema } from "@/lib/portfolio/schema";
import { isTemplateId } from "@/lib/templates/catalog";
import { db } from "@/utils/db";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

/** Runs a GitHub check or a research pass now. Research is paid like any AI request. */
export const POST = route(async (request: Request) => {
  if (!databaseConfigured()) return jsonError(503, "Auto-updates are not configured on this server.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to check for updates.");
  const body = await readJson(request, 500);
  if (body instanceof Response) return body;
  const { kind, templateId } = (body ?? {}) as { kind?: unknown; templateId?: unknown };
  const row = (await db.query<{ github_username: string | null; last_synced_at: Date | null; last_research_at: Date | null }>("SELECT github_username, last_synced_at, last_research_at FROM app_users WHERE id = $1", [user.id])).rows[0]!;

  if (kind === "github") {
    if (!row.github_username) return jsonError(422, "Add your GitHub username first.");
    if (row.last_synced_at && Date.now() - row.last_synced_at.getTime() < 10 * 60_000) return jsonError(429, "Checked a few minutes ago. Try again shortly.");
    try { return Response.json({ added: await syncGitHub(user.id, row.github_username) }); }
    catch (error) { if (error instanceof GitHubImportError) return jsonError(error.status, error.message); throw error; }
  }

  if (kind === "research") {
    if (typeof templateId !== "string" || !isTemplateId(templateId)) return jsonError(404, "Unknown template.");
    if (row.last_research_at && Date.now() - row.last_research_at.getTime() < 12 * 3600_000) return jsonError(429, "The last search was recent. New results usually take a while to appear; try again tomorrow.");
    const draft = await getDraft(user.id, templateId);
    const content = standardContentSchema.safeParse(draft?.content);
    if (!content.success) return jsonError(422, "Save your portfolio first so we know who to look for.");
    const gate = await openAi(user);
    if (!gate.ok) return jsonError(gate.status, gate.error);
    try {
      const result = await runResearch(gate.access.client, user.id, content.data);
      const bill = await settleAi(gate.access, result.usage.length ? sumUsage(result.usage) : null, "Career research");
      if (!result.ok) return jsonError(502, result.error);
      return Response.json({ added: result.added, charged: bill.charged, credits: bill.balance });
    } catch (error) {
      await releaseRequest(user.id);
      throw error;
    }
  }
  return jsonError(422, "Choose what to check: github or research.");
});

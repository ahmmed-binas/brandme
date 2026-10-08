import { jsonError, route } from "@/lib/api/http";
import { GitHubImportError, importFromGitHub } from "@/lib/import/github";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { databaseConfigured } from "@/utils/db-schema";

/** Public GitHub profile → portfolio content. Runs server-side so a GITHUB_TOKEN can raise the rate limit. */
export const GET = route(async (request: Request) => {
  const username = new URL(request.url).searchParams.get("username")?.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\/.*$/, "") ?? "";
  if (!username) return jsonError(422, "Enter a GitHub username.");
  // Public, and it spends our GitHub allowance: 30 imports an hour per visitor.
  if (databaseConfigured() && !(await rateLimit(`github-import:${clientIp(request)}`, 30, 3600))) return jsonError(429, "That’s a lot of imports. Please try again in an hour.");
  try {
    return Response.json({ profile: await importFromGitHub(username) });
  } catch (error) {
    if (error instanceof GitHubImportError) return jsonError(error.status, error.message);
    console.error("GitHub import failed", error);
    return jsonError(502, "GitHub could not be reached. Try again shortly.");
  }
});

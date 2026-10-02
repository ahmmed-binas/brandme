import { jsonError } from "@/lib/api/http";
import { GitHubImportError, importFromGitHub } from "@/lib/import/github";

/** Public GitHub profile → portfolio content. Runs server-side so a GITHUB_TOKEN can raise the rate limit. */
export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username")?.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\/.*$/, "") ?? "";
  if (!username) return jsonError(422, "Enter a GitHub username.");
  try {
    return Response.json({ profile: await importFromGitHub(username) });
  } catch (error) {
    if (error instanceof GitHubImportError) return jsonError(error.status, error.message);
    console.error("GitHub import failed", error);
    return jsonError(502, "GitHub could not be reached. Try again shortly.");
  }
}

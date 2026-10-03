import type { ImportedProfile } from "./profile";

/**
 * Builds a profile from a public GitHub account: name, bio, links, the
 * languages someone actually uses, and their strongest original repositories.
 * Only public data is read; no GitHub login is needed.
 */

const API = process.env.GITHUB_API_URL ?? "https://api.github.com";
export const GITHUB_USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const MAX_PROJECTS = 6;

interface GitHubUser { login: string; name: string | null; bio: string | null; blog: string | null; location: string | null; email: string | null; html_url: string; twitter_username: string | null }
interface GitHubRepo { name: string; description: string | null; html_url: string; homepage: string | null; language: string | null; topics?: string[]; stargazers_count: number; fork: boolean; archived: boolean; pushed_at: string }

export class GitHubImportError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function github<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 404) throw new GitHubImportError("No GitHub account has that username.", 404);
  if (response.status === 403 || response.status === 429) throw new GitHubImportError("GitHub is limiting requests right now. Try again in a few minutes.", 503);
  if (!response.ok) throw new GitHubImportError("GitHub could not be reached. Try again shortly.", 502);
  return response.json() as Promise<T>;
}

const humanise = (name: string) => name.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

/** Ranks repositories by stars, with a bonus for recent activity, so stale forks of tutorials don't lead. */
function score(repo: GitHubRepo): number {
  const monthsSincePush = (Date.now() - Date.parse(repo.pushed_at)) / (30 * 24 * 3600 * 1000);
  return repo.stargazers_count * 3 + (repo.description ? 2 : 0) + (repo.homepage ? 1 : 0) + Math.max(0, 12 - monthsSincePush) / 4;
}

export async function importFromGitHub(username: string): Promise<ImportedProfile> {
  if (!GITHUB_USERNAME.test(username)) throw new GitHubImportError("That isn’t a valid GitHub username.", 422);
  const [user, repos] = await Promise.all([
    github<GitHubUser>(`/users/${encodeURIComponent(username)}`),
    github<GitHubRepo[]>(`/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed&type=owner`),
  ]);
  const original = repos.filter((repo) => !repo.fork && !repo.archived && repo.name.toLowerCase() !== user.login.toLowerCase());

  const languageCounts = new Map<string, number>();
  for (const repo of original) if (repo.language) languageCounts.set(repo.language, (languageCounts.get(repo.language) ?? 0) + 1);
  const languages = [...languageCounts.entries()].sort((a, b) => b[1] - a[1]).map(([language]) => language);
  const topics = [...new Set(original.flatMap((repo) => repo.topics ?? []))].slice(0, 10);

  const website = user.blog?.trim() ? (/^https?:\/\//i.test(user.blog) ? user.blog.trim() : `https://${user.blog.trim()}`) : undefined;
  return {
    name: user.name ?? undefined,
    tagline: user.bio ?? undefined,
    location: user.location ?? undefined,
    email: user.email ?? undefined,
    github: user.html_url,
    linkedin: website && /linkedin\.com/i.test(website) ? website : undefined,
    links: [
      ...(website && !/linkedin\.com/i.test(website) ? [{ label: "Website", url: website }] : []),
      ...(user.twitter_username ? [{ label: "X", url: `https://x.com/${user.twitter_username}` }] : []),
    ],
    skills: [...languages, ...topics.map(humanise)].slice(0, 20),
    projects: original.sort((a, b) => score(b) - score(a)).slice(0, MAX_PROJECTS).map((repo) => ({
      title: humanise(repo.name),
      description: repo.description ?? "",
      technologies: [repo.language, ...(repo.topics ?? []).slice(0, 4).map(humanise)].filter((item): item is string => Boolean(item)),
      github: repo.html_url,
      live_url: repo.homepage?.trim() || undefined,
    })),
  };
}

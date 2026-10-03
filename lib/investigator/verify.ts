import type { Finding } from "@/lib/autoupdate/research";
import { readPage, type PageRead } from "./reader";

/**
 * Double-checks what the AI found before anything reaches the owner's site.
 * Each finding cites a page; we read that page ourselves and look for the
 * person and the claim on it.
 *
 * - The page mentions them and the claim: confirmed, kept as is.
 * - The page mentions them but not the claim, or can't be read (e.g. it needs
 *   a login): kept, but never "high", so it always waits for the owner.
 * - The page can be read and doesn't mention them at all: dropped, it's
 *   probably someone else with the same name.
 * - Older than about two years: dropped as old news.
 */

const MAX_CHECKS = 8;
const fold = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const WORDS_TO_SKIP = new Set(["the", "and", "for", "with", "from", "talk", "about", "new", "role", "post", "your", "their", "this", "that", "into", "on", "at", "of", "in", "to", "a", "an"]);

export type Verdict = "confirmed" | "unconfirmed" | "unreadable" | "someone_else" | "old";

/** Does the page mention this person? Full name, or first and last name both present. */
export function mentionsPerson(page: Pick<PageRead, "title" | "description" | "text" | "people">, name: string): boolean {
  const haystack = fold([page.title, page.description, page.text, ...page.people.map((person) => person.name ?? "")].join(" "));
  const parts = fold(name).split(" ").filter((part) => part.length > 1);
  if (!parts.length) return false;
  if (haystack.includes(parts.join(" "))) return true;
  const [first, last] = [parts[0]!, parts[parts.length - 1]!];
  const words = new Set(haystack.split(" "));
  return parts.length > 1 && words.has(first) && words.has(last);
}

/** Does the page support the claim? The organisation, or most of the title's meaningful words. */
export function mentionsClaim(page: Pick<PageRead, "title" | "description" | "text" | "people">, finding: Pick<Finding, "title" | "organisation">): boolean {
  const haystack = ` ${fold([page.title, page.description, page.text, ...page.people.flatMap((person) => [person.jobTitle ?? "", person.worksFor ?? ""])].join(" "))} `;
  const organisation = fold(finding.organisation ?? "");
  if (organisation.length > 2 && haystack.includes(` ${organisation} `)) return true;
  const words = fold(finding.title).split(" ").filter((word) => word.length > 2 && !WORDS_TO_SKIP.has(word));
  if (!words.length) return false;
  return words.filter((word) => haystack.includes(` ${word} `)).length / words.length >= 0.6;
}

export interface Checked { finding: Finding; verdict: Verdict }

/** Reads each cited page once (cached by URL) and returns a verdict per finding. */
export async function verifyFindings(findings: Finding[], name: string, cache = new Map<string, Promise<PageRead>>(), now = new Date()): Promise<Checked[]> {
  const oldest = now.getFullYear() - 2;
  let checks = 0;
  const results: Checked[] = [];
  for (const finding of findings) {
    const year = Number(finding.year?.match(/(19|20)\d{2}/)?.[0] ?? 0);
    if (year && year < oldest) { results.push({ finding, verdict: "old" }); continue; }
    const url = finding.source_url?.trim();
    if (!url) { results.push({ finding, verdict: "unreadable" }); continue; }
    const key = url.replace(/#.*$/, "").replace(/\/+$/, "");
    if (!cache.has(key)) {
      if (checks >= MAX_CHECKS) { results.push({ finding, verdict: "unreadable" }); continue; }
      checks += 1;
      cache.set(key, readPage(url));
    }
    const page = await cache.get(key)!;
    if (!page.ok || page.text.length < 40) { results.push({ finding, verdict: "unreadable" }); continue; }
    if (!mentionsPerson(page, name)) { results.push({ finding, verdict: "someone_else" }); continue; }
    results.push({ finding, verdict: mentionsClaim(page, finding) ? "confirmed" : "unconfirmed" });
  }
  return results;
}

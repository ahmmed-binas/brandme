/**
 * The profiles a customer can ask the Investigator to watch: always their
 * own, always public pages. Each kind says how it's read:
 *
 * - "api":  an official public API (GitHub), no AI needed.
 * - "feed": a public RSS/Atom feed (blogs, Medium, Substack, YouTube channels).
 * - "page": Claude reads the public page itself (web fetch) and searches around it.
 *
 * LinkedIn, Instagram, Facebook and X show little or nothing to visitors who
 * aren't logged in. We never log in as the customer; those links still help
 * the search find the right person, and the report says honestly what was readable.
 */

export type LinkKind = "website" | "linkedin" | "instagram" | "x" | "facebook" | "tiktok" | "github" | "youtube" | "medium" | "substack" | "behance" | "dribbble" | "orcid" | "scholar" | "feed" | "other";

export interface InvestigatorLink { kind: LinkKind; value: string }

export interface LinkKindInfo { id: LinkKind; label: string; placeholder: string; method: "api" | "feed" | "page"; limited?: boolean }

export const LINK_KINDS: LinkKindInfo[] = [
  { id: "website", label: "Your website or company page", placeholder: "https://…", method: "page" },
  { id: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/your-name", method: "page", limited: true },
  { id: "instagram", label: "Instagram", placeholder: "@username", method: "page", limited: true },
  { id: "x", label: "X (Twitter)", placeholder: "@username", method: "page", limited: true },
  { id: "facebook", label: "Facebook page", placeholder: "facebook.com/your-page", method: "page", limited: true },
  { id: "tiktok", label: "TikTok", placeholder: "@username", method: "page", limited: true },
  { id: "github", label: "GitHub", placeholder: "username", method: "api" },
  { id: "youtube", label: "YouTube channel", placeholder: "youtube.com/channel/UC… or @handle", method: "feed" },
  { id: "medium", label: "Medium", placeholder: "@username", method: "feed" },
  { id: "substack", label: "Substack", placeholder: "yourname.substack.com", method: "feed" },
  { id: "behance", label: "Behance", placeholder: "behance.net/username", method: "page" },
  { id: "dribbble", label: "Dribbble", placeholder: "dribbble.com/username", method: "page" },
  { id: "orcid", label: "ORCID (researchers)", placeholder: "0000-0000-0000-0000", method: "page" },
  { id: "scholar", label: "Google Scholar", placeholder: "scholar.google.com/citations?user=…", method: "page" },
  { id: "feed", label: "Blog or news feed (RSS)", placeholder: "https://yourblog.com/feed", method: "feed" },
  { id: "other", label: "Other public page", placeholder: "https://…", method: "page" },
];

export const MAX_LINKS = 12;
export const kindInfo = (kind: LinkKind) => LINK_KINDS.find((item) => item.id === kind)!;

const handle = (value: string) => value.trim().replace(/^@/, "").replace(/\/+$/, "");
const withHttps = (value: string) => (/^https?:\/\//i.test(value) ? value : `https://${value}`);

/** The public URL for a link, from whatever the customer typed (a URL, a handle or a username). */
export function linkUrl(link: InvestigatorLink): string | null {
  const value = link.value.trim();
  if (!value) return null;
  const looksLikeUrl = /^https?:\/\//i.test(value) || /^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(value);
  let url: string;
  switch (link.kind) {
    case "linkedin": url = looksLikeUrl ? withHttps(value) : `https://www.linkedin.com/in/${handle(value)}`; break;
    case "instagram": url = looksLikeUrl ? withHttps(value) : `https://www.instagram.com/${handle(value)}/`; break;
    case "x": url = looksLikeUrl ? withHttps(value) : `https://x.com/${handle(value)}`; break;
    case "tiktok": url = looksLikeUrl ? withHttps(value) : `https://www.tiktok.com/@${handle(value)}`; break;
    case "github": url = looksLikeUrl ? withHttps(value) : `https://github.com/${handle(value)}`; break;
    case "youtube": url = looksLikeUrl ? withHttps(value) : `https://www.youtube.com/@${handle(value)}`; break;
    case "medium": url = looksLikeUrl ? withHttps(value) : `https://medium.com/@${handle(value)}`; break;
    case "substack": url = looksLikeUrl ? withHttps(value) : `https://${handle(value)}.substack.com`; break;
    case "behance": url = looksLikeUrl ? withHttps(value) : `https://www.behance.net/${handle(value)}`; break;
    case "dribbble": url = looksLikeUrl ? withHttps(value) : `https://dribbble.com/${handle(value)}`; break;
    case "orcid": url = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(value) ? `https://orcid.org/${value}` : withHttps(value); break;
    default: url = withHttps(value);
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

/** The RSS/Atom feed behind a link, when there is a predictable one. */
export function feedUrl(link: InvestigatorLink): string | null {
  const url = linkUrl(link);
  if (!url) return null;
  const parsed = new URL(url);
  switch (link.kind) {
    case "feed": return url;
    case "medium": {
      const user = parsed.pathname.split("/").find((part) => part.startsWith("@"));
      return user ? `https://medium.com/feed/${user}` : parsed.hostname.endsWith(".medium.com") ? `https://${parsed.hostname}/feed` : null;
    }
    case "substack": return `https://${parsed.hostname}/feed`;
    case "youtube": {
      const channel = parsed.pathname.match(/\/channel\/(UC[\w-]{20,})/)?.[1];
      return channel ? `https://www.youtube.com/feeds/videos.xml?channel_id=${channel}` : null; // @handles are read as pages instead
    }
    default: return null;
  }
}

export function githubUser(link: InvestigatorLink): string | null {
  if (link.kind !== "github") return null;
  const url = linkUrl(link);
  const user = url ? new URL(url).pathname.split("/").filter(Boolean)[0] : null;
  return user && /^[a-z\d](?:[a-z\d-]{0,38})$/i.test(user) ? user : null;
}

/** Cleans what the browser sent: known kinds only, trimmed, de-duplicated, at most MAX_LINKS. */
export function cleanLinks(raw: unknown): InvestigatorLink[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: InvestigatorLink[] = [];
  for (const item of raw) {
    const kind = (item as { kind?: unknown })?.kind;
    const value = String((item as { value?: unknown })?.value ?? "").trim().slice(0, 300);
    if (!LINK_KINDS.some((info) => info.id === kind) || !value) continue;
    const link = { kind: kind as LinkKind, value };
    const url = linkUrl(link);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(link);
    if (out.length >= MAX_LINKS) break;
  }
  return out;
}

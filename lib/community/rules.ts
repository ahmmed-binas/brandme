/**
 * Community posting rules. Pure functions so every refusal is predictable and
 * testable. A post is either refused outright (nothing is stored and the
 * author keeps their text), held for a moderator, or published.
 */

export const POST_KINDS = ["suggestion", "review", "design"] as const;
export type PostKind = (typeof POST_KINDS)[number];
export const isPostKind = (value: unknown): value is PostKind => POST_KINDS.includes(value as PostKind);

export const KIND_LABELS: Record<PostKind, { singular: string; plural: string }> = {
  suggestion: { singular: "Suggestion", plural: "Suggestions" },
  review: { singular: "Review", plural: "Reviews" },
  design: { singular: "Design", plural: "Designs" },
};

export const LIMITS = {
  title: { min: 6, max: 120 },
  body: { min: 20, max: 5000 },
  comment: { min: 2, max: 2000 },
  images: { min: 1, max: 3 },
  linksInText: 3,
  postsPerHour: 5,
  postsPerDay: 20,
  commentsPerHour: 20,
  duplicateWindowDays: 7,
} as const;

/** Terms that are never acceptable here (spam). Extend with COMMUNITY_BLOCKED_TERMS="term one,term two". */
const DEFAULT_BLOCKED = ["viagra", "cialis", "casino", "betting tips", "forex signals", "crypto giveaway", "airdrop", "escort", "onlyfans", "porn", "payday loan", "loan approval", "seo backlinks", "buy followers"];

export type Verdict =
  | { outcome: "refuse"; code: RefusalCode; message: string }
  | { outcome: "hold"; reason: string }
  | { outcome: "publish" };

export type RefusalCode = "too_short" | "too_long" | "blocked_term" | "shouting" | "too_many_links" | "bad_link" | "missing_rating" | "missing_images" | "duplicate" | "rate_limited" | "already_reviewed" | "invalid";

const refuse = (code: RefusalCode, message: string): Verdict => ({ outcome: "refuse", code, message });

const URL_PATTERN = /\bhttps?:\/\/[^\s<>()]+|\bwww\.[^\s<>()]+/gi;
export const countLinks = (text: string) => text.match(URL_PATTERN)?.length ?? 0;

/** Lower-cased, whitespace-collapsed, punctuation-free text for duplicate checks. */
export const normaliseForDuplicates = (text: string) => text.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

function blockedTerms(): string[] {
  const extra = (process.env.COMMUNITY_BLOCKED_TERMS ?? "").split(",").map((term) => term.trim().toLowerCase()).filter(Boolean);
  return [...DEFAULT_BLOCKED, ...extra];
}

export function findBlockedTerm(text: string): string | null {
  const haystack = ` ${normaliseForDuplicates(text)} `;
  return blockedTerms().find((term) => haystack.includes(` ${normaliseForDuplicates(term)} `)) ?? null;
}

/** More than 70% capitals across a reasonably long text. */
export function isShouting(text: string): boolean {
  const letters = text.replace(/[^\p{L}]/gu, "");
  if (letters.length < 40) return false;
  return letters.replace(/[^\p{Lu}]/gu, "").length / letters.length > 0.7;
}

/** Only plain https links (Figma, Dribbble, a live site…) are accepted as a design's link. */
export function safeHttpsLink(value: string | undefined | null): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && url.hostname.includes(".") ? url.toString() : null;
  } catch {
    return null;
  }
}

export interface PostDraft { kind: PostKind; title: string; body: string; rating?: number | null; link?: string | null; imageCount: number }
export interface AuthorHistory { postsLastHour: number; postsLastDay: number; hasPublished: boolean; hasLiveReview: boolean; recentBodies: string[] }

/** Decides what happens to a new (or edited) post. Order matters: cheapest, clearest refusals first. */
export function judgePost(draft: PostDraft, history: AuthorHistory, { editing = false }: { editing?: boolean } = {}): Verdict {
  const title = draft.title.trim();
  const body = draft.body.trim();
  if (title.length < LIMITS.title.min) return refuse("too_short", `Give your ${KIND_LABELS[draft.kind].singular.toLowerCase()} a title of at least ${LIMITS.title.min} characters.`);
  if (title.length > LIMITS.title.max) return refuse("too_long", `Keep the title under ${LIMITS.title.max} characters.`);
  if (body.length < LIMITS.body.min) return refuse("too_short", `Write at least ${LIMITS.body.min} characters so others understand what you mean.`);
  if (body.length > LIMITS.body.max) return refuse("too_long", `Keep it under ${LIMITS.body.max.toLocaleString("en")} characters.`);
  if (draft.kind === "review" && !(Number.isInteger(draft.rating) && draft.rating! >= 1 && draft.rating! <= 5)) return refuse("missing_rating", "Choose a rating from 1 to 5 stars.");
  if (draft.kind === "design" && (draft.imageCount < LIMITS.images.min || draft.imageCount > LIMITS.images.max)) return refuse("missing_images", `Add between ${LIMITS.images.min} and ${LIMITS.images.max} images of your design.`);
  if (draft.link && !safeHttpsLink(draft.link)) return refuse("bad_link", "Links must be full https:// addresses.");

  const term = findBlockedTerm(`${title} ${body}`);
  if (term) return refuse("blocked_term", "This looks like spam, so it can’t be posted. If that’s a mistake, rephrase and try again.");
  if (isShouting(`${title} ${body}`)) return refuse("shouting", "Please don’t write in capitals. It reads as shouting.");
  const links = countLinks(body);
  if (links > LIMITS.linksInText) return refuse("too_many_links", `Use at most ${LIMITS.linksInText} links.`);

  if (!editing) {
    if (history.postsLastHour >= LIMITS.postsPerHour || history.postsLastDay >= LIMITS.postsPerDay) return refuse("rate_limited", "You’re posting faster than we allow. Please wait a little and try again.");
    if (draft.kind === "review" && history.hasLiveReview) return refuse("already_reviewed", "You’ve already reviewed Formora. Edit your existing review instead.");
    const normalised = normaliseForDuplicates(body);
    if (history.recentBodies.some((previous) => normaliseForDuplicates(previous) === normalised)) return refuse("duplicate", "You’ve already posted this. Duplicates are refused to keep the board readable.");
  }

  if (draft.kind === "design") return { outcome: "hold", reason: "Design submissions are reviewed by a moderator before they appear." };
  if (!history.hasPublished && links > 0) return { outcome: "hold", reason: "Posts with links from new members are checked by a moderator first." };
  return { outcome: "publish" };
}

export interface CommentHistory { commentsLastHour: number; recentBodies: string[] }

export function judgeComment(text: string, history: CommentHistory): Verdict {
  const body = text.trim();
  if (body.length < LIMITS.comment.min) return refuse("too_short", "Write a little more.");
  if (body.length > LIMITS.comment.max) return refuse("too_long", `Keep comments under ${LIMITS.comment.max.toLocaleString("en")} characters.`);
  if (findBlockedTerm(body)) return refuse("blocked_term", "This looks like spam, so it can’t be posted.");
  if (isShouting(body)) return refuse("shouting", "Please don’t write in capitals. It reads as shouting.");
  if (countLinks(body) > 2) return refuse("too_many_links", "Use at most 2 links in a comment.");
  if (history.commentsLastHour >= LIMITS.commentsPerHour) return refuse("rate_limited", "You’re commenting faster than we allow. Please wait a little.");
  if (history.recentBodies.some((previous) => normaliseForDuplicates(previous) === normaliseForDuplicates(body))) return refuse("duplicate", "You’ve already posted this comment.");
  return { outcome: "publish" };
}

/** Who may moderate: emails listed in ADMIN_EMAILS (comma-separated). */
export function isModeratorEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());
}

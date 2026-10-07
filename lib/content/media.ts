import { safeUrl } from "./markdown";

/**
 * The media block at the top of a blog post (customers' blogs and the Journal):
 * an image, a YouTube or Vimeo video, or the writer's own HTML and CSS.
 *
 * Custom HTML is shown in an iframe with `sandbox="allow-scripts"` and no
 * `allow-same-origin`, so it runs in a separate, opaque origin: it can't read
 * the site's cookies or pages, change the page around it, submit forms or open
 * the top window. It's the writer's own content on their own post.
 */
export type PostMedia =
  | { type: "image"; src: string; alt: string }
  | { type: "video"; provider: "youtube" | "vimeo"; id: string; title: string }
  | { type: "html"; html: string; height: number };

export const MAX_MEDIA_HTML = 20_000;
export const MEDIA_HEIGHT = { min: 120, max: 1200, default: 420 };

/** The video behind a YouTube or Vimeo link, or null. */
export function parseVideoUrl(raw: string): { provider: "youtube" | "vimeo"; id: string } | null {
  let url: URL;
  try { url = new URL(raw.trim()); } catch { return null; }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^www\.|^m\./, "");
  const id = (value: string | null | undefined, pattern: RegExp) => (value && pattern.test(value) ? value : null);
  if (host === "youtu.be") { const v = id(url.pathname.slice(1).split("/")[0], /^[\w-]{11}$/); return v ? { provider: "youtube", id: v } : null; }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = id(url.searchParams.get("v"), /^[\w-]{11}$/) ?? id(url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1], /^[\w-]{11}$/);
    return v ? { provider: "youtube", id: v } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") { const v = id(url.pathname.match(/(?:^|\/)(\d{6,12})(?:\/|$)/)?.[1], /^\d{6,12}$/); return v ? { provider: "vimeo", id: v } : null; }
  return null;
}

export const videoEmbedUrl = (media: Extract<PostMedia, { type: "video" }>) =>
  media.provider === "youtube" ? `https://www.youtube-nocookie.com/embed/${media.id}` : `https://player.vimeo.com/video/${media.id}?dnt=1`;

export class MediaError extends Error {}

/** Checks what the editor sent. Returns null for "no media"; throws MediaError for something unusable. */
export function cleanMedia(raw: unknown): PostMedia | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw !== "object") throw new MediaError("That media block isn’t valid.");
  const input = raw as Record<string, unknown>;
  const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
  if (input.type === "image") {
    const src = safeUrl(text(input.src, 2000));
    if (!src) return null;
    return { type: "image", src, alt: text(input.alt, 300) };
  }
  if (input.type === "video") {
    const video = typeof input.url === "string" ? parseVideoUrl(input.url)
      : (input.provider === "youtube" && typeof input.id === "string" && /^[\w-]{11}$/.test(input.id)) || (input.provider === "vimeo" && typeof input.id === "string" && /^\d{6,12}$/.test(input.id)) ? { provider: input.provider as "youtube" | "vimeo", id: input.id as string } : null;
    if (!video) throw new MediaError("Paste a YouTube or Vimeo link, like https://www.youtube.com/watch?v=… or https://vimeo.com/123456789.");
    return { type: "video", ...video, title: text(input.title, 200) };
  }
  if (input.type === "html") {
    const html = typeof input.html === "string" ? input.html : "";
    if (!html.trim()) return null;
    if (html.length > MAX_MEDIA_HTML) throw new MediaError(`Keep custom HTML under ${MAX_MEDIA_HTML.toLocaleString("en")} characters.`);
    const height = Math.round(Number(input.height) || MEDIA_HEIGHT.default);
    return { type: "html", html, height: Math.min(MEDIA_HEIGHT.max, Math.max(MEDIA_HEIGHT.min, height)) };
  }
  throw new MediaError("Choose an image, a video or custom HTML.");
}

/** Reads a stored value without throwing (old or hand-edited rows become "no media"). */
export function readMedia(raw: unknown): PostMedia | null {
  try { return cleanMedia(raw); } catch { return null; }
}

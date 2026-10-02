import { z } from "zod";
import type { TemplateId } from "@/lib/templates/types";

/**
 * The validation contract shared by the editor (browser) and the API (server).
 * Content is data only: anything that could execute (script URLs, unknown
 * keys, oversized blobs) is stripped or rejected before it is saved or shown.
 */

export const COLOR_THEMES = ["midnight", "classic", "dark", "light"] as const;
export type ColorTheme = (typeof COLOR_THEMES)[number];
export const isColorTheme = (value: unknown): value is ColorTheme => COLOR_THEMES.includes(value as ColorTheme);

/** Upper bound for a whole saved portfolio, images included. */
export const MAX_CONTENT_BYTES = 4_500_000;
/** Upper bound for one uploaded image after browser-side compression. */
export const MAX_IMAGE_DATA_URL_LENGTH = 1_200_000;

const UNSAFE_URL = /^\s*(javascript|vbscript|data|file):/i;
const SAFE_IMAGE_DATA_URL = /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i;

/** Links must be http(s), mailto, tel, or a same-page anchor; anything else becomes empty. */
export function safeLink(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || UNSAFE_URL.test(trimmed)) return "";
  return trimmed;
}

/** Images may be https URLs, site-relative paths, or small base64 bitmaps. SVG data is refused. */
export function safeImage(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:")) return SAFE_IMAGE_DATA_URL.test(trimmed) && trimmed.length <= MAX_IMAGE_DATA_URL_LENGTH ? trimmed : "";
  return UNSAFE_URL.test(trimmed) ? "" : trimmed;
}

const text = (max: number) => z.string().max(max).optional();
const link = z.string().max(2000).transform(safeLink).optional();
const list = (maxItems: number, maxLength: number) => z.array(z.string().max(maxLength)).max(maxItems).optional();

export const standardProjectSchema = z.object({
  title: text(200),
  description: text(4000),
  technologies: list(30, 60),
  github: link,
  live_url: link,
  image: z.string().max(MAX_IMAGE_DATA_URL_LENGTH + 100).transform(safeImage).optional(),
});

export const standardExperienceSchema = z.object({
  job_title: text(200),
  company: text(200),
  location: text(200),
  start_date: text(60),
  end_date: text(60),
  description: text(4000),
  technologies: list(30, 60),
  website: link,
});

/** Content shape used by every "standard" template (Midnight, Kinetic, …). */
export const standardContentSchema = z.object({
  name: text(120),
  professional_title: text(200),
  tagline: text(600),
  summary: list(10, 4000),
  github: link,
  linkedin: link,
  instagram: link,
  email: text(320),
  skills: list(40, 60),
  projects: z.array(standardProjectSchema).max(30).optional(),
  experience: z.array(standardExperienceSchema).max(30).optional(),
});

export type StandardContent = z.infer<typeof standardContentSchema>;

const EDITORIAL_ARRAY_KEYS = ["experience", "projects", "education", "certifications", "engineeringApproach", "services", "testimonials"] as const;
const EDITORIAL_OBJECT_KEYS = ["personal", "about", "skills", "openSource", "social", "snapshot"] as const;
export const EDITORIAL_SKILL_CATEGORIES = ["frontend", "backend", "database", "devops", "ai", "tools"] as const;

/** Structural check for the Editorial Developer template's richer content model. */
export function isEditorialShape(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  return EDITORIAL_ARRAY_KEYS.every((key) => Array.isArray(data[key]))
    && EDITORIAL_OBJECT_KEYS.every((key) => Boolean(data[key]) && typeof data[key] === "object" && !Array.isArray(data[key]))
    && EDITORIAL_SKILL_CATEGORIES.every((category) => Array.isArray((data.skills as Record<string, unknown>)[category]));
}

const IMAGE_KEY = /(avatar|image|photo|logo|thumbnail)$/i;
const MAX_DEPTH = 8;

/**
 * Walks free-form content and neutralises anything executable. Used for
 * template models that are too rich to describe field by field.
 */
export function sanitizeDeep(value: unknown, key = "", depth = 0): unknown {
  if (depth > MAX_DEPTH) return null;
  if (typeof value === "string") return IMAGE_KEY.test(key) ? safeImage(value) : UNSAFE_URL.test(value) ? "" : value.slice(0, 10_000);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitizeDeep(item, key, depth + 1));
  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [childKey, child] of Object.entries(value as Record<string, unknown>).slice(0, 200)) {
      if (childKey === "__proto__" || childKey === "constructor" || childKey === "prototype") continue;
      output[childKey] = sanitizeDeep(child, childKey, depth + 1);
    }
    return output;
  }
  return null;
}

export type ContentValidation = { ok: true; content: Record<string, unknown> } | { ok: false; error: string };

/** Validates and cleans content for a template. The only gate content passes through before saving. */
export function validateContent(templateId: TemplateId, content: unknown): ContentValidation {
  if (JSON.stringify(content ?? null).length > MAX_CONTENT_BYTES) return { ok: false, error: "This portfolio is too large. Use fewer or smaller images." };
  if (templateId === "editorial-developer") {
    if (!isEditorialShape(content)) return { ok: false, error: "Required template sections are missing." };
    return { ok: true, content: sanitizeDeep(content) as Record<string, unknown> };
  }
  const parsed = standardContentSchema.safeParse(content);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Some portfolio content is invalid." };
  return { ok: true, content: parsed.data };
}

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;
const RESERVED_SLUGS = new Set(["admin", "api", "app", "account", "login", "logout", "editor", "templates", "templatechooser", "pricing", "blog", "tools", "help", "support", "settings", "formora", "www", "mail", "about", "contact", "terms", "privacy"]);

export function normaliseSlug(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

export function slugError(slug: string): string | null {
  if (!SLUG_PATTERN.test(slug)) return "Use 3–40 lowercase letters, numbers, or hyphens.";
  if (RESERVED_SLUGS.has(slug)) return "That address is reserved. Try another.";
  return null;
}

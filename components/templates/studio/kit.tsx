"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { SectionKey, StandardContent } from "@/lib/portfolio/schema";
import type { TemplateDefinition } from "@/lib/templates/types";
import "./studio.css";

/**
 * Shared building blocks for the studio collection. Every studio template
 * receives the same content model; this kit turns the owner's design choices
 * (palette, fonts, accent, hidden sections, section titles) into CSS variables
 * and helpers, so each template only has to describe its own layout.
 *
 * Layout rule for templates: size with container queries (@3xl:, cqw units),
 * never viewport breakpoints or position: fixed, so the same design renders
 * correctly in the editor, the phone preview, and the live site.
 */

export interface StudioProps {
  content: StandardContent;
  template: TemplateDefinition;
  /** True inside the editor: empty slots show gentle prompts and clicks open the matching field. */
  embedded?: boolean;
}

export type Studio = ReturnType<typeof useStudio>;

const filled = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(filled);
  if (value && typeof value === "object") return Object.values(value).some(filled);
  return typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
};

const SECTION_FIELDS: Record<SectionKey, (keyof StandardContent)[]> = {
  about: ["summary"], projects: ["projects"], experience: ["experience"], skills: ["skills"], education: ["education"],
  services: ["services"], testimonials: ["testimonials"], highlights: ["highlights"], gallery: ["gallery"], stats: ["stats"],
  contact: ["email", "links", "github", "linkedin", "instagram", "website"],
};

export function useStudio(content: StandardContent, template: TemplateDefinition, embedded = false) {
  const design = content.design ?? {};
  const palette = template.palettes?.find((item) => item.id === design.palette) ?? template.palettes?.[0];
  const font = template.fonts?.find((item) => item.id === design.font) ?? template.fonts?.[0];
  const hidden = new Set(design.hidden ?? []);
  const accent = design.accent || palette?.accent || "#2338e0";
  const style = {
    "--t-bg": palette?.bg, "--t-fg": palette?.fg, "--t-accent": accent, "--t-muted": palette?.muted, "--t-surface": palette?.surface,
    "--t-display": font?.display, "--t-text": font?.text, "--t-mono": font?.mono ?? "ui-monospace, SFMono-Regular, Menlo, monospace",
  } as CSSProperties;
  /** A section shows when the template has it, the owner hasn't hidden it, and it has content (or we're editing). */
  const has = (section: SectionKey) => Boolean(template.sections?.includes(section)) && !hidden.has(section) && (embedded || SECTION_FIELDS[section].some((key) => filled(content[key])));
  const label = (section: SectionKey, fallback: string) => design.labels?.[section]?.trim() || fallback;
  return { c: content, style, has, label, embedded, palette, accent, font };
}

/** Marks an element as click-to-edit. The editor focuses the field with the same path. */
export const ed = (path: string) => ({ "data-edit": path });

/** The template's root: applies palette and font variables and makes the template a size container. */
export function StudioRoot({ studio, className = "", children }: { studio: Studio; className?: string; children: ReactNode }) {
  return <div style={studio.style} className={`studio-root @container relative isolate min-h-full overflow-x-clip bg-[var(--t-bg)] font-[family-name:var(--t-text)] text-[var(--t-fg)] antialiased ${studio.embedded ? "studio-editing" : ""} ${className}`}>{children}</div>;
}

/** An image, or a quiet tonal block when there's none, so layouts never collapse. */
export function Picture({ src, alt, className = "", prompt = "Add an image", embedded, edit }: { src?: string; alt: string; className?: string; prompt?: string; embedded?: boolean; edit?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- user content from many origins; sized by the template
    return <img src={src} alt={alt} loading="lazy" decoding="async" className={`block object-cover ${className}`} {...(edit ? ed(edit) : {})} />;
  }
  return <div role="img" aria-label={alt} className={`relative overflow-hidden bg-[color-mix(in_oklab,var(--t-fg)_7%,var(--t-bg))] ${className}`} {...(edit ? ed(edit) : {})}>
    <div className="absolute inset-0 opacity-[0.18] [background-image:repeating-linear-gradient(135deg,currentColor_0_1px,transparent_1px_9px)]" />
    {embedded && <span className="absolute inset-x-0 bottom-2 text-center text-[11px] tracking-wide opacity-60">{prompt}</span>}
  </div>;
}

/** Reveals children once as they scroll into view. Off for reduced motion, and in static captures. */
export function Reveal({ children, className = "", delay = 0, as: Tag = "div" }: { children: ReactNode; className?: string; delay?: number; as?: "div" | "li" | "section" | "article" | "span" }) {
  const ref = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<"idle" | "hidden" | "shown">("idle");
  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.static !== undefined) return;
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight) return;
    const frame = requestAnimationFrame(() => setState("hidden"));
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setState("shown"); observer.disconnect(); } }, { rootMargin: "0px 0px -8% 0px" });
    observer.observe(node);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, []);
  const motion = state === "hidden" ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100";
  return <Tag ref={ref as never} style={{ transitionDelay: state === "shown" ? `${delay}ms` : undefined }} className={`transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(.2,.7,.1,1)] ${motion} ${className}`}>{children}</Tag>;
}

export const initials = (name?: string) => (name ?? "").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]!.toUpperCase()).join("");
export const firstName = (name?: string) => (name ?? "").split(/\s+/)[0] ?? "";
export const lastName = (name?: string) => (name ?? "").split(/\s+/).slice(1).join(" ");
export const hostname = (url?: string) => { try { return url ? new URL(url).hostname.replace(/^www\./, "") : ""; } catch { return url ?? ""; } };
export const span = (start?: string, end?: string) => [start, end].filter((part) => part?.trim()).join(" – ");
export const pad = (value: number, size = 2) => String(value).padStart(size, "0");
export const roman = (value: number) => {
  const table: Array<[number, string]> = [[10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]];
  let rest = value; let output = "";
  for (const [amount, numeral] of table) while (rest >= amount) { output += numeral; rest -= amount; }
  return output;
};

/** Every way to reach the owner, in a stable order. */
export function contactLinks(content: StandardContent): Array<{ label: string; url: string }> {
  const links: Array<{ label: string; url: string }> = [];
  if (content.email) links.push({ label: "Email", url: `mailto:${content.email}` });
  if (content.website) links.push({ label: hostname(content.website) || "Website", url: content.website });
  if (content.github) links.push({ label: "GitHub", url: content.github });
  if (content.linkedin) links.push({ label: "LinkedIn", url: content.linkedin });
  if (content.instagram) links.push({ label: "Instagram", url: content.instagram });
  for (const link of content.links ?? []) if (link.url && link.label) links.push({ label: link.label, url: link.url });
  return links;
}

/** External links open safely in a new tab; mail and phone links don't. */
export const external = (url: string) => (/^(mailto|tel):/.test(url) || url.startsWith("#") ? {} : { target: "_blank", rel: "noopener noreferrer" });

/** The paragraph list as given, without empty entries. */
export const paragraphs = (content: StandardContent) => (content.summary ?? []).map((text, index) => ({ text, index })).filter((item) => item.text.trim());

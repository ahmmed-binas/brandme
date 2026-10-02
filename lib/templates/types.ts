import type { SectionKey } from "@/lib/portfolio/schema";

/** Template ids are validated against the catalog at runtime (see isTemplateId). */
export type TemplateId = string;

export const PROFESSIONS = [
  { id: "developer", label: "Software & engineering" },
  { id: "design", label: "Product & brand design" },
  { id: "art", label: "Art & illustration" },
  { id: "photo", label: "Photography" },
  { id: "writing", label: "Writing & journalism" },
  { id: "architecture", label: "Architecture & interiors" },
  { id: "academic", label: "Research & academia" },
  { id: "data", label: "Data & AI" },
  { id: "marketing", label: "Marketing & growth" },
  { id: "consulting", label: "Consulting & freelance" },
  { id: "music", label: "Music & audio" },
  { id: "film", label: "Film & motion" },
  { id: "leadership", label: "Founders & executives" },
  { id: "student", label: "Students & graduates" },
  { id: "wellness", label: "Health, wellness & coaching" },
] as const;
export type ProfessionId = (typeof PROFESSIONS)[number]["id"];

export const STYLES = ["Minimal", "Editorial", "Bold", "Technical", "Artsy", "Classic", "Playful"] as const;
export type StyleTag = (typeof STYLES)[number];

/** A named colour scheme. Templates read these as CSS variables (--t-bg, --t-fg, …). */
export interface Palette {
  id: string;
  name: string;
  bg: string;
  fg: string;
  accent: string;
  muted: string;
  surface: string;
}

/** A designed font pairing. Values are CSS font-family stacks the template's stylesheet loads. */
export interface FontPairing {
  id: string;
  name: string;
  display: string;
  text: string;
  mono?: string;
}

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  /** Legacy grouping used by older screens. */
  category: "Developer" | "Creative" | "Professional";
  author: string;
  createdAt: string;
  style: "Editorial" | "Minimal" | "Modern" | "Classic";
  idealFor: string[];
  tags: string[];
  editor: "standard" | "dedicated";
  /** Whether the template responds to the old four-colour theme picker (Midnight only). */
  colorThemes: boolean;
  /** Studio templates share the universal content model and the design controls below. */
  collection?: "original" | "studio";
  professions?: ProfessionId[];
  styles?: StyleTag[];
  mood?: "light" | "dark";
  /** Sections the template renders, in its own order. The editor only shows these. */
  sections?: SectionKey[];
  palettes?: Palette[];
  fonts?: FontPairing[];
  /** Which sample persona fills the preview. */
  persona?: string;
}

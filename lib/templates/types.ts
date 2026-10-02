import type { SectionKey } from "@/lib/portfolio/schema";

/** Template ids are validated against the catalog at runtime (see isTemplateId). */
export type TemplateId = string;

/** Fields group professions so the gallery filter stays short. */
export const FIELDS = [
  { id: "tech", label: "Tech" },
  { id: "creative", label: "Creative" },
  { id: "business", label: "Business" },
  { id: "care", label: "Health & care" },
  { id: "services", label: "Trades & hospitality" },
  { id: "learning", label: "Education" },
  { id: "public", label: "Public sector" },
] as const;
export type FieldId = (typeof FIELDS)[number]["id"];

export const PROFESSIONS = [
  { id: "developer", label: "Software & engineering", field: "tech" },
  { id: "data", label: "Data & AI", field: "tech" },
  { id: "product", label: "Product management", field: "tech" },
  { id: "engineering", label: "Civil, mechanical & electrical engineering", field: "tech" },
  { id: "design", label: "Product & brand design", field: "creative" },
  { id: "art", label: "Art & illustration", field: "creative" },
  { id: "photo", label: "Photography", field: "creative" },
  { id: "writing", label: "Writing & journalism", field: "creative" },
  { id: "architecture", label: "Architecture & interiors", field: "creative" },
  { id: "music", label: "Music & audio", field: "creative" },
  { id: "film", label: "Film & motion", field: "creative" },
  { id: "marketing", label: "Marketing & growth", field: "business" },
  { id: "sales", label: "Sales & business development", field: "business" },
  { id: "consulting", label: "Consulting & freelance", field: "business" },
  { id: "leadership", label: "Founders & executives", field: "business" },
  { id: "management", label: "Managers & operations", field: "business" },
  { id: "admin", label: "Office & admin", field: "business" },
  { id: "finance", label: "Finance & accounting", field: "business" },
  { id: "legal", label: "Law & legal", field: "business" },
  { id: "realestate", label: "Real estate", field: "business" },
  { id: "hr", label: "HR & recruiting", field: "business" },
  { id: "language", label: "Translation & languages", field: "business" },
  { id: "healthcare", label: "Medicine & healthcare", field: "care" },
  { id: "wellness", label: "Wellness, fitness & coaching", field: "care" },
  { id: "beauty", label: "Hair, beauty & styling", field: "care" },
  { id: "trades", label: "Trades & construction", field: "services" },
  { id: "food", label: "Chefs & hospitality", field: "services" },
  { id: "events", label: "Events & weddings", field: "services" },
  { id: "education", label: "Teaching & tutoring", field: "learning" },
  { id: "academic", label: "Research & academia", field: "learning" },
  { id: "student", label: "Students & graduates", field: "learning" },
  { id: "nonprofit", label: "Nonprofit & public service", field: "public" },
] as const satisfies ReadonlyArray<{ id: string; label: string; field: FieldId }>;
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

import { brand } from "@/lib/brand";
import { availableTemplates } from "@/lib/templates/approval";
import { DESIGN_STORIES } from "@/lib/templates/stories";
import { downloadCounts, ratingSummaries, type RatingSummary } from "@/lib/templates/ratings";
import { PROFESSIONS } from "@/lib/templates/types";
import { databaseConfigured } from "@/utils/db-schema";
import { ROLE_SUMMARIES } from "@/lib/templates/roles";
import { getSubmission, listSubmissions, type SubmissionSummary } from "./submissions";

/**
 * Everything in the gallery: the studio's own designs (in code, free to
 * download) and approved community templates (in the database). Both get the
 * same tile, the same article page, ratings and a free download.
 */
export interface GalleryItem {
  slug: string;
  kind: "original" | "community";
  /** Key used for ratings and download counts. */
  key: string;
  title: string;
  summary: string;
  designer: { name: string; username: string | null };
  tags: string[];
  /** Extra words people might search for: job titles that suit it. Not shown. */
  keywords: string;
  /** Video sources, best first (WebM, then MP4 for Safari). Empty when there's no clip. */
  clips: { src: string; type: string }[];
  poster: string;
  download: string;
  rating: RatingSummary;
  downloads: number;
  motion: boolean;
  createdAt: string;
  /** Originals only: opens in the editor, so it can be customised without code. */
  editable: boolean;
}

export interface GalleryArticle extends GalleryItem {
  idea: string;
  process: string;
  inspiration: string;
  audience: string;
  license: string;
  liveUrl: string | null;
  preview: string | null;
  palettes: { name: string; colours: string[] }[];
  fonts: string[];
  sections: string[];
}

const NONE: RatingSummary = { average: null, count: 0 };
const professionLabel = (id: string) => PROFESSIONS.find((item) => item.id === id)?.label ?? id;

function fromSubmission(submission: SubmissionSummary, ratings: Record<string, RatingSummary>, downloads: Record<string, number>): GalleryItem {
  const key = `community:${submission.slug}`;
  return {
    slug: submission.slug, kind: "community", key, title: submission.title, summary: submission.summary,
    designer: { name: submission.owner.name ?? submission.owner.username ?? "A designer", username: submission.owner.username },
    tags: submission.tags, keywords: submission.audience.slice(0, 600), clips: submission.hasClip ? [{ src: `/api/gallery/submissions/${submission.id}/clip`, type: submission.clipMime ?? "video/mp4" }] : [], poster: `/api/gallery/submissions/${submission.id}/cover`,
    download: `/api/gallery/submissions/${submission.id}/zip`, rating: ratings[key] ?? NONE, downloads: downloads[key] ?? 0,
    motion: submission.tags.includes("motion") || submission.tags.includes("animated"), createdAt: submission.reviewedAt ?? submission.createdAt, editable: false,
  };
}

export async function galleryItems(): Promise<GalleryItem[]> {
  const [templates, ratings, downloads, community] = await Promise.all([
    availableTemplates(), ratingSummaries(), downloadCounts(),
    databaseConfigured() ? listSubmissions({ status: "approved" }).catch(() => []) : Promise.resolve([]),
  ]);
  const originals: GalleryItem[] = templates.filter((template) => template.collection === "studio").map((template) => ({
    slug: template.id, kind: "original", key: template.id, title: template.name, summary: template.description,
    designer: { name: `${brand.name} Studio`, username: null },
    tags: [...(template.styles ?? []), ...(template.professions ?? []).map(professionLabel)].map((tag) => tag.toLowerCase()),
    keywords: [...template.idealFor, ...ROLE_SUMMARIES.filter((role) => role.templates.includes(template.id) || template.professions?.includes(role.profession)).flatMap((role) => [role.label, role.plural, ...role.aliases])].join(" "),
    clips: [{ src: `/gallery/${template.id}.webm`, type: "video/webm" }, { src: `/gallery/${template.id}.mp4`, type: "video/mp4" }], poster: `/gallery/${template.id}.webp`, download: `/api/templates/${template.id}/download`,
    rating: ratings[template.id] ?? NONE, downloads: downloads[template.id] ?? 0, motion: Boolean(template.styles?.includes("Motion")),
    createdAt: template.createdAt, editable: true,
  }));
  return [...community.map((submission) => fromSubmission(submission, ratings, downloads)), ...originals];
}

export async function galleryArticle(slug: string): Promise<GalleryArticle | null> {
  const items = await galleryItems();
  const item = items.find((entry) => entry.slug === slug);
  if (!item) return null;
  if (item.kind === "community") {
    const submission = await getSubmission({ slug });
    if (!submission || submission.status !== "approved") return null;
    return { ...item, idea: submission.idea, process: submission.process, inspiration: submission.inspiration, audience: submission.audience, license: submission.license, liveUrl: submission.liveUrl, preview: submission.liveUrl, palettes: [], fonts: [], sections: [] };
  }
  const template = (await availableTemplates()).find((entry) => entry.id === slug)!;
  const story = DESIGN_STORIES[slug];
  return {
    ...item,
    idea: template.description,
    process: `Drawn and built by the ${brand.name} studio as a React component, then tested in the editor, on phones and with reduced motion. Every section reads from one shared content model, so the same words fill any design.`,
    inspiration: story?.inspiredBy ?? "",
    audience: `${template.idealFor.join(", ")}.`,
    license: "MIT",
    liveUrl: null,
    preview: `/templates/${slug}?sample=1&demo=true`,
    palettes: (template.palettes ?? []).map((palette) => ({ name: palette.name, colours: [palette.bg, palette.surface, palette.fg, palette.accent] })),
    fonts: (template.fonts ?? []).map((font) => font.name),
    sections: template.sections ?? [],
  };
}

export const noticeFor = (slug: string) => DESIGN_STORIES[slug]?.notice ?? null;

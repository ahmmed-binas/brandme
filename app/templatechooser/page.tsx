import type { Metadata } from "next";
import Link from "next/link";
import Gallery, { type GalleryTemplate } from "@/components/templates/Gallery";
import { availableTemplates } from "@/lib/templates/approval";
import { getCurrentUser } from "@/utils/user-account";
import { ROLE_SUMMARIES } from "@/lib/templates/roles";
import { ratingSummaries } from "@/lib/templates/ratings";
import { notFound } from "next/navigation";
import { pagedMetadata, pageNumber } from "@/lib/seo/paging";

/** Templates per page; keep in step with the Gallery component. */
const PAGE_SIZE = 18;
const FILTERS = ["for", "field", "style", "mood", "q", "role"] as const;

/**
 * The designs shown first, before any filter: the most striking ones, mixing
 * real estate, 3D and other jobs so the first screen doesn't look like one
 * niche. (Visitors left after the first row was three similar developer
 * designs, October 2026.) Change the order here; unknown or unapproved ids
 * are skipped.
 */
const FEATURED = [
  "mirage",
  "campaign",
  "monolith",
  "lookbook",
  "studio-desk",
  "dune",
  "riso",
  "tide",
  "keynote",
];
const featuredRank = (id: string) => {
  const at = FEATURED.indexOf(id);
  return at < 0 ? FEATURED.length : at;
};

// Depends on who is signed in; never pre-render at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  return pagedMetadata({
    base: "/templatechooser",
    title: "Portfolio templates for every kind of work",
    description:
      "Original portfolio templates for 150+ job titles: doctors, nurses, lawyers, salespeople, managers, teachers, tradespeople, developers, designers, photographers and more. Find yours and preview it with sample content for your role.",
    page: pageNumber(params.page),
    filtered: FILTERS.some((key) => params[key]),
  });
}

export default async function TemplateChooser({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const viewer = await getCurrentUser().catch(() => null);
  const moderator = Boolean(viewer?.isAdmin);
  // The featured designs first, then the rest of the professional collection;
  // the three original templates follow.
  const ratings = await ratingSummaries();
  const templates: GalleryTemplate[] = (await availableTemplates(moderator))
    .sort(
      (a, b) =>
        featuredRank(a.id) - featuredRank(b.id) ||
        Number(a.collection !== "studio") - Number(b.collection !== "studio"),
    )
    .map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      idealFor: template.idealFor,
      professions: template.professions ?? [],
      styles: template.styles ?? [],
      mood: template.mood ?? "light",
      palettes: (template.palettes ?? []).map((palette) => palette.accent),
      status: template.review.status,
      threeD: template.threeD,
      proOnly: template.proOnly,
      badges: template.badges,
      rating: ratings[template.id],
    }));
  const page = pageNumber(params.page);
  if (!FILTERS.some((key) => params[key]) && page > Math.max(1, Math.ceil(templates.length / PAGE_SIZE)))
    notFound();

  return (
    <div className="mx-auto max-w-[1320px] px-5 pb-24 pt-8 sm:px-8 sm:pt-14 lg:pt-20">
      <header className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
            {templates.length} templates
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.8rem,6.4vw,5.2rem)] font-[400] leading-[0.95] tracking-[-0.03em] text-ink [font-variation-settings:'opsz'_48]">
            Made for your kind of work. <em className="font-[300] text-signal">Not everyone’s.</em>
          </h1>
        </div>
        <div>
          <p className="max-w-[34rem] text-[0.98rem] leading-[1.6] text-ink-soft sm:text-[1.08rem] sm:leading-[1.7]">
            A photographer needs a contact sheet, not a skills bar. A researcher needs a references list. Each
            design here was drawn for a profession, then made yours with colours, type and the sections you
            choose.
          </p>
          <p className="mt-4 hidden text-[0.95rem] text-ink-soft sm:block">
            Would rather have the code?{" "}
            <Link href="/gallery" className="text-ink underline underline-offset-4">
              Download templates free
            </Link>
            , including ones made by the community.
          </p>
          <p className="mt-2 hidden text-[0.95rem] text-ink-soft sm:block">
            Designed one yourself?{" "}
            <Link href="/gallery/submit" className="text-ink underline underline-offset-4">
              Send us your template
            </Link>{" "}
            and we’ll review it for the gallery, with your name on it.
          </p>
        </div>
      </header>
      {moderator && (
        <p className="mt-8 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[0.92rem] text-amber-950">
          You’re seeing every template because you’re an admin. Customers only see the ones you’ve approved.{" "}
          <Link href="/templates/review" className="font-medium underline">
            Review templates →
          </Link>
        </p>
      )}
      <Gallery
        templates={templates}
        roles={ROLE_SUMMARIES}
        moderator={moderator}
        initial={{
          profession: params.for,
          field: params.field,
          style: params.style,
          mood: params.mood,
          q: params.q,
          role: params.role,
          page,
        }}
      />
      <p className="mt-20 border-t border-rule pt-8 text-[0.98rem] text-ink-soft">
        Designed a template of your own?{" "}
        <Link href="/community?kind=design" className="text-ink underline underline-offset-4">
          Submit it to the community.
        </Link>
      </p>
    </div>
  );
}

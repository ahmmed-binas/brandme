import type { Metadata } from "next";
import Link from "next/link";
import Gallery, { type GalleryTemplate } from "@/components/templates/Gallery";
import { availableTemplates } from "@/lib/templates/approval";
import { isModeratorEmail } from "@/lib/community/rules";
import { getCurrentUser } from "@/utils/user-account";
import { ROLE_SUMMARIES } from "@/lib/templates/roles";
import { ratingSummaries } from "@/lib/templates/ratings";

export const metadata: Metadata = {
  title: "Portfolio templates for every kind of work",
  description: "Original portfolio templates for 150+ job titles: doctors, nurses, lawyers, salespeople, managers, teachers, tradespeople, developers, designers, photographers and more. Find yours and preview it with sample content for your role.",
  alternates: { canonical: "/templatechooser" },
};

export default async function TemplateChooser({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const viewer = await getCurrentUser().catch(() => null);
  const moderator = isModeratorEmail(viewer?.email);
  // The professional collection first; the three original templates follow.
  const ratings = await ratingSummaries();
  const templates: GalleryTemplate[] = (await availableTemplates(moderator)).sort((a, b) => Number(a.collection !== "studio") - Number(b.collection !== "studio")).map((template) => ({
    id: template.id, name: template.name, description: template.description, idealFor: template.idealFor,
    professions: template.professions ?? [], styles: template.styles ?? [], mood: template.mood ?? "light",
    palettes: (template.palettes ?? []).map((palette) => palette.accent), status: template.review.status, rating: ratings[template.id],
  }));

  return <div className="mx-auto max-w-[1320px] px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
    <header className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">{templates.length} templates</p>
        <h1 className="mt-4 font-display text-[clamp(2.8rem,6.4vw,5.2rem)] font-[400] leading-[0.95] tracking-[-0.03em] text-ink [font-variation-settings:'opsz'_48]">Made for your kind of work. <em className="font-[300] text-signal">Not everyone’s.</em></h1>
      </div>
      <p className="max-w-[34rem] text-[1.08rem] leading-[1.7] text-ink-soft">A photographer needs a contact sheet, not a skills bar. A researcher needs a references list. Each design here was drawn for a profession, then made yours with colours, type and the sections you choose.</p>
    </header>
    {moderator && <p className="mt-8 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[0.92rem] text-amber-950">You’re seeing every template because you’re an admin. Customers only see the ones you’ve approved. <Link href="/templates/review" className="font-medium underline">Review templates →</Link></p>}
    <Gallery templates={templates} roles={ROLE_SUMMARIES} moderator={moderator} initial={{ profession: params.for, field: params.field, style: params.style, mood: params.mood, q: params.q, role: params.role }} />
    <p className="mt-20 border-t border-rule pt-8 text-[0.98rem] text-ink-soft">Designed a template of your own? <Link href="/community?kind=design" className="text-ink underline underline-offset-4">Submit it to the community.</Link></p>
  </div>;
}

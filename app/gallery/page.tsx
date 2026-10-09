import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import { galleryItems } from "@/lib/gallery/items";
import { brand } from "@/lib/brand";
import { notFound } from "next/navigation";
import { pagedMetadata, pageNumber } from "@/lib/seo/paging";

/** Tiles per page; keep in step with GalleryGrid. */
const GALLERY_PAGE_SIZE = 12;

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; page?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  return pagedMetadata({ base: "/gallery", title: "Free portfolio website templates", description: `Beautiful portfolio and personal website templates, free to download and use. Made by the ${brand.name} studio and the community, for lawyers, doctors, designers, developers, chefs, teachers and more.`, page: pageNumber(params.page), filtered: Boolean(params.q) });
}

/** The gallery: every free template, studio originals and community designs, as moving tiles. */
export default async function GalleryPage({ searchParams }: Props) {
  const params = await searchParams;
  const items = await galleryItems();
  const page = pageNumber(params.page);
  // A page past the end is a real “not found”, not an empty page.
  if (!params.q && page > Math.max(1, Math.ceil(items.length / GALLERY_PAGE_SIZE))) notFound();
  const community = items.filter((item) => item.kind === "community").length;
  return <div className="mx-auto max-w-[1320px] px-5 pb-28 pt-14 sm:px-8 lg:pt-20">
    <header className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-end">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Gallery · {items.length} free templates</p>
        <h1 className="mt-4 font-display text-[clamp(3rem,7.2vw,6rem)] font-[400] leading-[0.92] tracking-[-0.035em] text-ink [font-variation-settings:'opsz'_72]">Beautiful websites, <em className="font-[300] text-signal">free to take.</em></h1>
      </div>
      <div>
        <p className="max-w-[34rem] text-[1.08rem] leading-[1.7] text-ink-soft">Download any design and make it yours: the code is free and open. Rather not touch code? Open it in the {brand.name} editor, click to change the words and photos, and publish on your own domain.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/gallery/submit" className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.95rem] font-medium text-paper transition-colors hover:bg-signal hover:text-signal-ink">Share your template <ArrowRight size={15} /></Link>
          <Link href="/pricing" className="inline-flex items-center rounded-full border border-rule px-5 py-2.5 text-[0.95rem] text-ink hover:border-ink">How customising works</Link>
        </div>
      </div>
    </header>
    <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule text-[0.92rem] sm:grid-cols-3" aria-label="How the gallery works">
      <li className="bg-card p-5"><b className="block font-display text-[1.25rem] font-normal text-ink">Free, open code</b><span className="text-ink-soft">Every template downloads as a ready-to-run project with setup steps.</span></li>
      <li className="bg-card p-5"><b className="block font-display text-[1.25rem] font-normal text-ink">No code? No problem</b><span className="text-ink-soft">Customise studio designs in the editor and we host them for you.</span></li>
      <li className="bg-card p-5"><b className="block font-display text-[1.25rem] font-normal text-ink">Made by people</b><span className="text-ink-soft">{community ? `${community} community ${community === 1 ? "design" : "designs"} and counting.` : "Designers can submit their own; each one is reviewed by hand."}</span></li>
    </ul>
    <GalleryGrid items={items} initialQuery={params.q ?? ""} initialPage={page} />
  </div>;
}

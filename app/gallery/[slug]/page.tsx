import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { ClipPlayer, DownloadButton } from "@/components/gallery/DownloadPanel";
import PreviewFrame from "@/components/templates/PreviewFrame";
import { RateTemplate } from "@/components/templates/Rating";
import { galleryArticle, galleryItems, noticeFor } from "@/lib/gallery/items";
import { LICENSES } from "@/lib/gallery/submissions";
import { brand } from "@/lib/brand";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };
const load = cache((slug: string) => galleryArticle(slug));
const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await load((await params).slug);
  if (!item) return { title: "Template not found", robots: { index: false } };
  const title = `${item.title}: free ${item.kind === "original" ? "portfolio" : "website"} template`;
  return { title, description: item.summary, alternates: { canonical: `/gallery/${item.slug}` }, openGraph: { title, description: item.summary, type: "article", images: [item.poster], url: `/gallery/${item.slug}` } };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="border-t border-rule pt-8">
    <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">{title}</h2>
    <div className="mt-4 space-y-4 whitespace-pre-line text-[1.12rem] leading-[1.75] text-ink">{children}</div>
  </section>;
}

/** A design's page in the gallery: the story behind it, the free download and setup, and customising without code. */
export default async function GalleryArticlePage({ params }: Props) {
  const item = await load((await params).slug);
  if (!item) notFound();
  const notice = item.kind === "original" ? noticeFor(item.slug) : null;
  const more = (await galleryItems()).filter((entry) => entry.slug !== item.slug && (entry.motion === item.motion || entry.kind === item.kind)).slice(0, 3);
  const license = LICENSES[item.license as keyof typeof LICENSES] ?? item.license;
  const schema = {
    "@context": "https://schema.org", "@type": "CreativeWork", name: item.title, description: item.summary, url: `${siteUrl}/gallery/${item.slug}`,
    image: item.poster.startsWith("/") ? `${siteUrl}${item.poster}` : item.poster, license: `https://spdx.org/licenses/${item.license}.html`, isAccessibleForFree: true,
    author: item.designer.username ? { "@type": "Person", name: item.designer.name, alternateName: `@${item.designer.username}` } : { "@type": "Organization", name: item.designer.name },
    ...(item.rating.count && item.rating.average !== null ? { aggregateRating: { "@type": "AggregateRating", ratingValue: item.rating.average, ratingCount: item.rating.count, bestRating: 5 } } : {}),
  };
  const ratingEndpoint = item.kind === "original" ? `/api/templates/${item.slug}/rating` : `/api/gallery/${item.slug}/rating`;

  return <article className="pb-28">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <div className="mx-auto max-w-[1240px] px-5 pt-10 sm:px-8 lg:pt-14">
      <Link href="/gallery" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft hover:text-ink"><ArrowLeft size={13} /> Gallery</Link>

      <header className="mt-8 grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">{item.kind === "original" ? `${brand.name} Studio original` : "Community template"} · Free · {license}</p>
          <h1 className="mt-4 font-display text-[clamp(3.2rem,8vw,6.6rem)] font-[400] leading-[0.9] tracking-[-0.04em] text-ink [font-variation-settings:'opsz'_72]">{item.title}</h1>
          <p className="mt-6 max-w-[40rem] text-[1.25rem] leading-[1.55] text-ink-soft">{item.summary}</p>
        </div>
        <div className="space-y-5 lg:pb-2">
          <p className="text-[0.98rem] text-ink-soft">Designed by <span className="text-ink">{item.designer.username ? `${item.designer.name} (@${item.designer.username})` : item.designer.name}</span><br />Added {date(item.createdAt)} · {item.downloads.toLocaleString("en")} {item.downloads === 1 ? "download" : "downloads"}</p>
          <div className="flex flex-wrap items-center gap-3">
            <DownloadButton href={item.download} />
            {item.editable && <Link href={`/editor/${item.slug}`} className="inline-flex items-center gap-2 rounded-full border border-ink px-5 py-3 text-[0.98rem] text-ink hover:bg-ink hover:text-paper">Customise without code <ArrowRight size={16} /></Link>}
            {!item.editable && item.liveUrl && <a href={item.liveUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 rounded-full border border-rule px-5 py-3 text-[0.98rem] hover:border-ink">Live demo <ArrowUpRight size={15} /></a>}
          </div>
          <RateTemplate templateId={item.slug} initial={item.rating} endpoint={ratingEndpoint} returnTo={`/gallery/${item.slug}`} />
        </div>
      </header>

      <figure className="mx-auto mt-14 max-w-[720px] overflow-hidden rounded-[1.6rem] border border-rule bg-ink/5 shadow-[0_50px_120px_-60px_rgba(0,0,0,.6)]">
        <div className="flex items-center gap-1.5 border-b border-rule bg-card px-4 py-3" aria-hidden><span className="size-2.5 rounded-full bg-ink/15" /><span className="size-2.5 rounded-full bg-ink/15" /><span className="size-2.5 rounded-full bg-ink/15" /><span className="ml-3 truncate font-mono text-[11px] text-ink-faint">{item.kind === "original" ? `${item.slug}.yourname.com` : item.title.toLowerCase().replace(/\s+/g, "")}</span></div>
        <div className="aspect-square w-full"><ClipPlayer clips={item.clips} poster={item.poster} title={item.title} /></div>
      </figure>
    </div>

    <div className="mx-auto mt-20 grid max-w-[1240px] gap-14 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="max-w-[44rem] space-y-12">
        <Section title="The idea"><p className="font-display text-[1.6rem] leading-[1.35]">{item.idea}</p></Section>
        {item.inspiration && <Section title="Inspired by"><p>{item.inspiration}</p></Section>}
        {notice && <Section title="What to notice"><p>{notice}</p></Section>}
        <Section title="How it was made"><p>{item.process}</p></Section>
        <Section title="Who it’s for"><p>{item.audience}</p></Section>
      </div>
      <aside className="h-fit space-y-6 rounded-2xl border border-rule bg-card p-6 text-[0.94rem] lg:sticky lg:top-24">
        <dl className="space-y-4">
          <div><dt className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-soft">Designer</dt><dd className="mt-1 text-ink">{item.designer.name}{item.designer.username && <span className="text-ink-soft"> @{item.designer.username}</span>}</dd></div>
          <div><dt className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-soft">Licence</dt><dd className="mt-1 text-ink">{license}: free for personal and client work</dd></div>
          {item.fonts.length > 0 && <div><dt className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-soft">Type</dt><dd className="mt-1 text-ink">{item.fonts.join(" · ")}</dd></div>}
          {item.palettes.length > 0 && <div><dt className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-soft">Colours</dt><dd className="mt-2 space-y-2">{item.palettes.map((palette) => <span key={palette.name} className="flex items-center gap-3"><span className="flex overflow-hidden rounded border border-black/10">{palette.colours.map((colour, index) => <span key={index} className="h-5 w-4" style={{ background: colour }} />)}</span><span className="text-ink-soft">{palette.name}</span></span>)}</dd></div>}
          {item.sections.length > 0 && <div><dt className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-soft">Sections</dt><dd className="mt-1 capitalize text-ink">{item.sections.join(", ")}</dd></div>}
          {item.tags.length > 0 && <div><dt className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-soft">Tags</dt><dd className="mt-2 flex flex-wrap gap-1.5">{item.tags.slice(0, 10).map((tag) => <Link key={tag} href={`/gallery?q=${encodeURIComponent(tag)}`} className="rounded-full border border-rule px-2.5 py-0.5 text-[0.82rem] text-ink-soft hover:border-ink hover:text-ink">{tag}</Link>)}</dd></div>}
        </dl>
      </aside>
    </div>

    {item.preview && item.kind === "original" && <section className="mx-auto mt-24 max-w-[1240px] px-5 sm:px-8" aria-labelledby="try">
      <h2 id="try" className="font-display text-[clamp(2rem,4vw,3rem)] leading-none tracking-[-0.02em] text-ink">Scroll through it</h2>
      <p className="mt-3 text-ink-soft">The real template, running live with sample content.</p>
      <div className="mt-8 h-[78vh] overflow-hidden rounded-2xl border border-rule"><PreviewFrame src={item.preview} title={`${item.title} live preview`} /></div>
    </section>}

    <section id="setup" className="mx-auto mt-24 max-w-[1240px] scroll-mt-24 px-5 sm:px-8" aria-labelledby="start">
      <h2 id="start" className="font-display text-[clamp(2rem,4vw,3rem)] leading-none tracking-[-0.02em] text-ink">Two ways to use it</h2>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-rule bg-card p-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">Free · you edit the code</p>
          <h3 className="mt-2 font-display text-[1.8rem] leading-tight text-ink">Download and set it up</h3>
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-[0.98rem] leading-relaxed text-ink">
            <li>Install <a href="https://nodejs.org" target="_blank" rel="noreferrer" className="underline">Node.js</a> (the LTS version) if you don’t have it.</li>
            <li>Unzip the download and open the folder in a terminal.</li>
            {item.kind === "original" ? <>
              <li>Run <code className="rounded bg-ink/5 px-1.5">npm install</code>, then <code className="rounded bg-ink/5 px-1.5">npm run dev</code>. It opens in your browser.</li>
              <li>Put your own words in <code className="rounded bg-ink/5 px-1.5">src/content.json</code> and your photos in <code className="rounded bg-ink/5 px-1.5">public/</code>. Colours and fonts are in the README.</li>
              <li>Run <code className="rounded bg-ink/5 px-1.5">npm run build</code> and upload the <code className="rounded bg-ink/5 px-1.5">dist</code> folder to any static host (Netlify, Cloudflare Pages, GitHub Pages).</li>
            </> : <>
              <li>Read the README in the folder. Most templates start with <code className="rounded bg-ink/5 px-1.5">npm install</code> then <code className="rounded bg-ink/5 px-1.5">npm run dev</code>; plain HTML ones open straight from <code className="rounded bg-ink/5 px-1.5">index.html</code>.</li>
              <li>Change the content, then upload it to any static host (Netlify, Cloudflare Pages, GitHub Pages).</li>
            </>}
          </ol>
          <div className="mt-6"><DownloadButton href={item.download} label="Download the ZIP" /></div>
        </div>
        <div className="rounded-2xl bg-ink p-7 text-paper">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/60">No code · free to start</p>
          <h3 className="mt-2 font-display text-[1.8rem] leading-tight">Let {brand.name} handle it</h3>
          <ul className="mt-5 space-y-2.5 text-[0.98rem] text-paper/85">{["Click any text or photo to change it, no code at all", "A free address, or your own domain with Pro", "Hosting, speed and security looked after", "A blog, and the Investigator to keep it up to date", "Switch to another design any time, keeping your words"].map((line) => <li key={line} className="flex gap-2.5"><Check size={17} className="mt-0.5 shrink-0 text-signal" />{line}</li>)}</ul>
          <div className="mt-7 flex flex-wrap gap-3">
            {item.editable ? <Link href={`/editor/${item.slug}`} className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-3 text-[0.98rem] font-medium text-ink hover:bg-signal hover:text-signal-ink">Customise {item.title} <ArrowRight size={16} /></Link>
              : <Link href="/templatechooser" className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-3 text-[0.98rem] font-medium text-ink hover:bg-signal hover:text-signal-ink">See designs you can customise <ArrowRight size={16} /></Link>}
            <Link href="/pricing" className="inline-flex items-center rounded-full border border-paper/30 px-5 py-3 text-[0.98rem] hover:border-paper">Pricing</Link>
          </div>
        </div>
      </div>
    </section>

    {more.length > 0 && <section className="mx-auto mt-24 max-w-[1240px] px-5 sm:px-8" aria-labelledby="more">
      <h2 id="more" className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">More from the gallery</h2>
      <ul className="mt-6 grid gap-6 sm:grid-cols-3">{more.map((entry) => <li key={entry.key}><Link href={`/gallery/${entry.slug}`} className="group block">
        {/* eslint-disable-next-line @next/next/no-img-element -- poster frame */}
        <img src={entry.poster} alt="" loading="lazy" className="aspect-square w-full rounded-2xl object-cover object-top transition-transform duration-700 group-hover:scale-[1.02]" />
        <span className="mt-3 block font-display text-[1.4rem] leading-none text-ink">{entry.title}</span>
        <span className="mt-1 block text-[0.88rem] text-ink-soft">by {entry.designer.username ? `@${entry.designer.username}` : entry.designer.name}</span>
      </Link></li>)}</ul>
    </section>}
  </article>;
}

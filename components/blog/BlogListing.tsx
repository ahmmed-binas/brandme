import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowLeft, Rss } from "lucide-react";
import { listJournal, POSTS_PER_PAGE, type JournalPost } from "@/lib/content/journal";
import { NO_RATINGS, ratingSummaries } from "@/lib/templates/ratings";
import { CardStars } from "./CardStars";

const pageUrl = (page: number) => (page === 1 ? "/blog" : `/blog/page/${page}`);
export const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "Draft");

function Meta({ post }: { post: JournalPost }) {
  return <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">{post.category} · {formatDate(post.publishedAt)} · {post.readMinutes} min read</p>;
}

/** The Journal index: the newest post large, then the rest in a grid. */
export default async function BlogListing({ page }: { page: number }) {
  const [posts, ratings] = await Promise.all([listJournal(), ratingSummaries()]);
  const rating = (slug: string) => ratings[`journal:${slug}`] ?? NO_RATINGS;
  const pages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  if (page > pages) notFound();
  const shown = posts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);
  const [lead, ...rest] = page === 1 ? shown : [undefined, ...shown];

  return <div className="mx-auto max-w-[1180px] px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
    <header className="flex flex-wrap items-end justify-between gap-6 border-b border-rule pb-10">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Journal{page > 1 ? ` · page ${page}` : ""}</p>
        <h1 className="mt-4 font-display text-[clamp(2.8rem,6.4vw,5rem)] font-[400] leading-[0.95] tracking-[-0.03em] text-ink [font-variation-settings:'opsz'_48]">Better portfolios, <em className="font-[300] text-signal">one idea at a time.</em></h1>
        <p className="mt-5 max-w-[36rem] text-[1.08rem] leading-[1.7] text-ink-soft">Practical advice on showing your work, whatever your work is: writing, case studies, design and getting online.</p>
      </div>
      <a href="/blog/rss.xml" className="inline-flex items-center gap-2 text-[0.92rem] text-ink-soft hover:text-ink"><Rss size={15} /> RSS feed</a>
    </header>

    {posts.length === 0 && <p className="mt-16 text-center text-ink-soft">No posts yet.</p>}

    {lead && <article className="group mt-12 grid gap-6 border-b border-rule pb-12 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
      <div>
        <Meta post={lead} />
        <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.02] tracking-[-0.02em] text-ink"><Link href={`/blog/${lead.slug}`} className="hover:text-signal">{lead.title}</Link></h2>
      </div>
      <div className="lg:pt-8">
        {lead.cover && <Link href={`/blog/${lead.slug}`} className="mb-5 block overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element -- an uploaded cover */}
        <img src={lead.cover} alt="" className="aspect-[16/10] w-full object-cover" /></Link>}
        <p className="text-[1.08rem] leading-[1.7] text-ink-soft">{lead.description}</p>
        <Link href={`/blog/${lead.slug}`} className="mt-5 inline-flex items-center gap-2 text-[0.95rem] font-medium text-ink underline decoration-rule underline-offset-[5px] hover:decoration-ink">Read the article <ArrowRight size={15} /></Link>
        <div className="mt-6"><CardStars slug={lead.slug} initial={rating(lead.slug)} /></div>
      </div>
    </article>}

    {rest.length > 0 && <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{rest.map((post, index) => post && <li key={post.slug} className="group relative flex flex-col rounded-2xl border border-rule bg-[color-mix(in_oklab,var(--ink)_2%,transparent)] p-6 transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-ink hover:shadow-[0_24px_50px_-30px_rgba(0,0,0,.45)]">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full border border-rule px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-soft transition-colors group-hover:border-ink group-hover:text-ink">{post.category}</span>
        <span aria-hidden className="font-display text-[1.6rem] leading-none text-ink-faint transition-colors group-hover:text-signal">{String((page - 1) * POSTS_PER_PAGE + index + (page === 1 ? 2 : 0)).padStart(2, "0")}</span>
      </div>
      {post.cover && <Link href={`/blog/${post.slug}`} className="mt-5 block overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- an uploaded cover */}
        <img src={post.cover} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /></Link>}
      <h2 className="mt-5 font-display text-[1.55rem] leading-[1.1] tracking-[-0.015em] text-ink"><Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 after:rounded-2xl after:content-['']">{post.title}</Link></h2>
      <p className="mt-3 flex-1 text-[0.97rem] leading-relaxed text-ink-soft">{post.description}</p>
      <div className="relative z-10 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
        <CardStars slug={post.slug} initial={rating(post.slug)} />
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">{post.readMinutes} min <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" /></span>
      </div>
    </li>)}</ul>}

    {pages > 1 && <nav className="mt-16 flex items-center justify-between border-t border-rule pt-6 text-[0.92rem]" aria-label="Journal pages">
      <span>{page > 1 && <Link href={pageUrl(page - 1)} className="inline-flex items-center gap-2 text-ink hover:text-signal"><ArrowLeft size={15} /> Newer</Link>}</span>
      <span className="text-ink-soft">Page {page} of {pages}</span>
      <span>{page < pages && <Link href={pageUrl(page + 1)} className="inline-flex items-center gap-2 text-ink hover:text-signal">Older <ArrowRight size={15} /></Link>}</span>
    </nav>}
  </div>;
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowLeft, Rss } from "lucide-react";
import { listJournal, POSTS_PER_PAGE, type JournalPost } from "@/lib/content/journal";

const pageUrl = (page: number) => (page === 1 ? "/blog" : `/blog/page/${page}`);
export const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "Draft");

function Meta({ post }: { post: JournalPost }) {
  return <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">{post.category} · {formatDate(post.publishedAt)} · {post.readMinutes} min read</p>;
}

/** The Journal index: the newest post large, then the rest in a grid. */
export default async function BlogListing({ page }: { page: number }) {
  const posts = await listJournal();
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
        <p className="text-[1.08rem] leading-[1.7] text-ink-soft">{lead.description}</p>
        <Link href={`/blog/${lead.slug}`} className="mt-5 inline-flex items-center gap-2 text-[0.95rem] font-medium text-ink underline decoration-rule underline-offset-[5px] hover:decoration-ink">Read the article <ArrowRight size={15} /></Link>
      </div>
    </article>}

    {rest.length > 0 && <ul className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">{rest.map((post) => post && <li key={post.slug} className="flex flex-col border-t border-ink pt-5">
      <Meta post={post} />
      <h2 className="mt-3 font-display text-[1.6rem] leading-[1.1] tracking-[-0.015em] text-ink"><Link href={`/blog/${post.slug}`} className="hover:text-signal">{post.title}</Link></h2>
      <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-soft">{post.description}</p>
    </li>)}</ul>}

    {pages > 1 && <nav className="mt-16 flex items-center justify-between border-t border-rule pt-6 text-[0.92rem]" aria-label="Journal pages">
      <span>{page > 1 && <Link href={pageUrl(page - 1)} className="inline-flex items-center gap-2 text-ink hover:text-signal"><ArrowLeft size={15} /> Newer</Link>}</span>
      <span className="text-ink-soft">Page {page} of {pages}</span>
      <span>{page < pages && <Link href={pageUrl(page + 1)} className="inline-flex items-center gap-2 text-ink hover:text-signal">Older <ArrowRight size={15} /></Link>}</span>
    </nav>}
  </div>;
}

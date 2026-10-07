import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { formatDate } from "@/components/blog/BlogListing";
import { getJournalPost, listJournal } from "@/lib/content/journal";
import { Markdown } from "@/lib/content/markdown";
import { PostMediaView } from "@/components/blog/PostMediaView";
import { brand } from "@/lib/brand";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };
const load = cache((slug: string) => getJournalPost(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await load((await params).slug);
  if (!post) return { title: "Article not found", robots: { index: false } };
  return {
    title: post.title, description: post.description, alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { ...(post.cover ? { images: [post.cover] } : {}), title: post.title, description: post.description, type: "article", publishedTime: post.publishedAt ?? undefined, modifiedTime: post.updatedAt ?? undefined, url: `/blog/${post.slug}` },
  };
}

export default async function ArticlePage({ params }: Props) {
  const post = await load((await params).slug);
  if (!post) notFound();
  const others = (await listJournal()).filter((item) => item.slug !== post.slug);
  const related = [...others.filter((item) => item.category === post.category), ...others.filter((item) => item.category !== post.category)].slice(0, 3);
  const schema = {
    "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.description,
    datePublished: post.publishedAt, dateModified: post.updatedAt ?? post.publishedAt, mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
    author: { "@type": "Organization", name: brand.name, url: siteUrl }, publisher: { "@type": "Organization", name: brand.name, url: siteUrl },
  };

  return <article className="mx-auto max-w-[1180px] px-5 pb-24 pt-10 sm:px-8 lg:pt-14">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <Link href="/blog" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft hover:text-ink"><ArrowLeft size={13} /> Journal</Link>
    <header className="mx-auto mt-10 max-w-[44rem]">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">{post.category} · {formatDate(post.publishedAt)} · {post.readMinutes} min read</p>
      <h1 className="mt-5 font-display text-[clamp(2.4rem,5.4vw,4rem)] font-[400] leading-[1.0] tracking-[-0.03em] text-ink [font-variation-settings:'opsz'_48]">{post.title}</h1>
      <p className="mt-6 text-[1.2rem] leading-[1.6] text-ink-soft">{post.description}</p>
    </header>
    {post.media ? <PostMediaView media={post.media} className="mx-auto mt-12 max-w-[56rem]" /> : post.cover && <>
        {/* eslint-disable-next-line @next/next/no-img-element -- an uploaded cover */}
        <img src={post.cover} alt="" className="mx-auto mt-12 w-full max-w-[56rem] rounded-lg object-cover" /></>}
    <Markdown source={post.body} className="post-body mx-auto mt-12 max-w-[44rem] border-t border-rule pt-10 text-ink [--post-display:var(--font-display)] [&_a]:text-signal [&_h2]:font-display [&_h3]:font-display" />

    <aside className="mx-auto mt-16 max-w-[44rem] rounded-xl border border-rule bg-card p-7">
      <p className="font-display text-[1.6rem] leading-tight text-ink">Make a portfolio that fits your work.</p>
      <p className="mt-2 text-ink-soft">Designs drawn for 150+ job titles, sample content written for yours, and your own domain.</p>
      <Link href="/templatechooser" className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.92rem] font-medium text-paper hover:bg-signal hover:text-signal-ink">Browse templates <ArrowRight size={15} /></Link>
    </aside>

    {related.length > 0 && <section className="mt-20 border-t border-rule pt-10" aria-labelledby="more">
      <h2 id="more" className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">Keep reading</h2>
      <ul className="mt-6 grid gap-10 md:grid-cols-3">{related.map((item) => <li key={item.slug}>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">{item.category}</p>
        <h3 className="mt-2 font-display text-[1.4rem] leading-[1.15] text-ink"><Link href={`/blog/${item.slug}`} className="hover:text-signal">{item.title}</Link></h3>
      </li>)}</ul>
    </section>}
  </article>;
}

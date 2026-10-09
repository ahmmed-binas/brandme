"use client";

import type { CSSProperties, ReactNode } from "react";
import { getTemplate } from "@/lib/templates/catalog";
import type { StandardContent } from "@/lib/portfolio/schema";
import { Markdown } from "@/lib/content/markdown";
import type { PostMedia } from "@/lib/content/media";
import { PostMediaView } from "@/components/blog/PostMediaView";

/**
 * A portfolio's blog, dressed in the colours and type the owner chose for
 * their portfolio, so /blog feels like part of the same site.
 */
export interface PublicPost { slug: string; title: string; summary: string; body?: string; cover: string | null; media?: PostMedia | null; publishedAt: string | null; readMinutes: number }

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "");

function useLook(templateId: string, content: StandardContent) {
  const template = getTemplate(templateId);
  const design = content.design ?? {};
  const palette = template?.palettes?.find((item) => item.id === design.palette) ?? template?.palettes?.[0];
  const font = template?.fonts?.find((item) => item.id === design.font) ?? template?.fonts?.[0];
  return {
    "--b-bg": palette?.bg ?? "#f7f5f0", "--b-fg": palette?.fg ?? "#16150f", "--b-muted": palette?.muted ?? "#6b675c",
    "--b-accent": design.accent || palette?.accent || "#2338e0",
    "--post-display": font?.display ?? "Georgia, serif", "--post-accent": design.accent || palette?.accent || "#2338e0",
    fontFamily: font?.text ?? "system-ui, sans-serif",
  } as CSSProperties;
}

function Shell({ templateId, content, home, children }: { templateId: string; content: StandardContent; home: string; children: ReactNode }) {
  const style = useLook(templateId, content);
  return <div style={style} className="min-h-dvh bg-[var(--b-bg)] text-[var(--b-fg)] antialiased">
    <header className="mx-auto flex max-w-[60rem] items-center justify-between gap-4 px-5 py-6 sm:px-8">
      <a href={home || "/"} className="text-[1.15rem] leading-tight" style={{ fontFamily: "var(--post-display)" }}>{content.name || "Home"}</a>
      <nav className="flex gap-6 text-[0.92rem]"><a href={home || "/"} className="opacity-70 hover:opacity-100">Home</a><a href={`${home}/blog`} className="hover:opacity-80">Blog</a></nav>
    </header>
    <div className="mx-auto max-w-[60rem] px-5 pb-24 sm:px-8">{children}</div>
    <footer className="border-t border-[color-mix(in_oklab,var(--b-fg)_15%,transparent)]">
      <div className="mx-auto flex max-w-[60rem] flex-wrap justify-between gap-4 px-5 py-8 text-[0.9rem] text-[var(--b-muted)] sm:px-8">
        <span>© {new Date().getFullYear()} {content.name}</span>
        {content.email && <a href={`mailto:${content.email}`} className="hover:text-[var(--b-fg)]">{content.email}</a>}
      </div>
    </footer>
  </div>;
}

export function PortfolioBlogIndex({ templateId, content, home, posts, page = 1, pages = 1 }: { templateId: string; content: StandardContent; home: string; posts: PublicPost[]; page?: number; pages?: number }) {
  const pageHref = (n: number) => `${home}/blog${n > 1 ? `?page=${n}` : ""}`;
  return <Shell templateId={templateId} content={content} home={home}>
    <h1 className="pt-10 text-[clamp(2.6rem,7vw,4.6rem)] leading-[0.98] tracking-[-0.02em]" style={{ fontFamily: "var(--post-display)" }}>Blog</h1>
    {content.professional_title && <p className="mt-3 text-[1.05rem] text-[var(--b-muted)]">Writing by {content.name}, {content.professional_title.charAt(0).toLowerCase() + content.professional_title.slice(1)}.</p>}
    {posts.length === 0 ? <p className="mt-16 text-[var(--b-muted)]">No posts yet.</p>
      : <ul className="mt-12">{posts.map((post) => <li key={post.slug} className="border-t border-[color-mix(in_oklab,var(--b-fg)_15%,transparent)] py-8">
        <a href={`${home}/blog/${post.slug}`} className="group grid gap-5 sm:grid-cols-[1fr_12rem] sm:items-start">
          <span>
            <span className="block text-[0.8rem] uppercase tracking-[0.14em] text-[var(--b-muted)]">{date(post.publishedAt)} · {post.readMinutes} min read</span>
            <span className="mt-2 block text-[1.7rem] leading-[1.15] group-hover:text-[var(--b-accent)]" style={{ fontFamily: "var(--post-display)" }}>{post.title}</span>
            <span className="mt-2 block leading-relaxed text-[var(--b-muted)]">{post.summary}</span>
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element -- owners' images */}
          {post.cover && <img src={post.cover} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-md object-cover" />}
        </a>
      </li>)}</ul>}
    {pages > 1 && <nav aria-label="Blog pages" className="mt-6 flex items-center justify-between border-t border-[color-mix(in_oklab,var(--b-fg)_15%,transparent)] pt-6 text-[0.95rem]">
      <span>{page > 1 && <a href={pageHref(page - 1)} className="hover:text-[var(--b-accent)]">← Newer posts</a>}</span>
      <span className="text-[var(--b-muted)]">Page {page} of {pages}</span>
      <span>{page < pages && <a href={pageHref(page + 1)} className="hover:text-[var(--b-accent)]">Older posts →</a>}</span>
    </nav>}
  </Shell>;
}

export function PortfolioBlogPost({ templateId, content, home, post, more }: { templateId: string; content: StandardContent; home: string; post: PublicPost; more: PublicPost[] }) {
  return <Shell templateId={templateId} content={content} home={home}>
    <article className="mx-auto max-w-[42rem] pt-8">
      <a href={`${home}/blog`} className="text-[0.9rem] text-[var(--b-muted)] hover:text-[var(--b-fg)]">← All posts</a>
      <p className="mt-10 text-[0.8rem] uppercase tracking-[0.14em] text-[var(--b-muted)]">{date(post.publishedAt)} · {post.readMinutes} min read</p>
      <h1 className="mt-3 text-[clamp(2.2rem,6vw,3.6rem)] leading-[1.02] tracking-[-0.02em]" style={{ fontFamily: "var(--post-display)" }}>{post.title}</h1>
      {/* eslint-disable-next-line @next/next/no-img-element -- owners' images */}
      {post.media ? <PostMediaView media={post.media} className="mt-10" /> : post.cover && <img src={post.cover} alt="" className="mt-10 w-full rounded-lg object-cover" />}
      <Markdown source={post.body ?? ""} className="post-body mt-10 [&_a]:text-[var(--b-accent)]" />
      <p className="mt-14 border-t border-[color-mix(in_oklab,var(--b-fg)_15%,transparent)] pt-6 text-[0.95rem] text-[var(--b-muted)]">Written by <a href={home || "/"} className="text-[var(--b-fg)] underline underline-offset-4">{content.name}</a>{content.professional_title ? `, ${content.professional_title.charAt(0).toLowerCase() + content.professional_title.slice(1)}` : ""}.</p>
    </article>
    {more.length > 0 && <section className="mx-auto mt-16 max-w-[42rem]"><h2 className="text-[0.8rem] uppercase tracking-[0.14em] text-[var(--b-muted)]">More writing</h2>
      <ul className="mt-4">{more.map((item) => <li key={item.slug} className="border-t border-[color-mix(in_oklab,var(--b-fg)_15%,transparent)] py-4"><a href={`${home}/blog/${item.slug}`} className="text-[1.2rem] hover:text-[var(--b-accent)]" style={{ fontFamily: "var(--post-display)" }}>{item.title}</a></li>)}</ul>
    </section>}
  </Shell>;
}

/** “Writing”: the newest posts, shown under the portfolio when its owner has published some. */
export function PortfolioWriting({ templateId, content, home, posts }: { templateId: string; content: StandardContent; home: string; posts: PublicPost[] }) {
  const style = useLook(templateId, content);
  if (!posts.length) return null;
  return <section style={style} aria-labelledby="writing" className="bg-[var(--b-bg)] text-[var(--b-fg)]">
    <div className="mx-auto max-w-[72rem] border-t border-[color-mix(in_oklab,var(--b-fg)_15%,transparent)] px-5 py-16 sm:px-8">
      <div className="flex items-baseline justify-between gap-4"><h2 id="writing" className="text-[clamp(1.8rem,4vw,2.6rem)] leading-none" style={{ fontFamily: "var(--post-display)" }}>Writing</h2><a href={`${home}/blog`} className="text-[0.92rem] underline underline-offset-4">All posts →</a></div>
      <ul className="mt-8 grid gap-8 md:grid-cols-3">{posts.slice(0, 3).map((post) => <li key={post.slug}><a href={`${home}/blog/${post.slug}`} className="group block">
        <span className="block text-[0.78rem] uppercase tracking-[0.14em] text-[var(--b-muted)]">{date(post.publishedAt)}</span>
        <span className="mt-2 block text-[1.35rem] leading-[1.2] group-hover:text-[var(--b-accent)]" style={{ fontFamily: "var(--post-display)" }}>{post.title}</span>
        <span className="mt-2 block text-[0.95rem] leading-relaxed text-[var(--b-muted)]">{post.summary}</span>
      </a></li>)}</ul>
    </div>
  </section>;
}

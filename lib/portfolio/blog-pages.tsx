import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortfolioBlogIndex, PortfolioBlogPost } from "@/components/templates/PortfolioBlog";
import type { StandardContent } from "./schema";
import { sitePost, sitePosts, type Site } from "./site";

/** Shared by /p/<slug>/blog and the custom-domain /blog, so both behave the same. */
const ownerName = (site: Site) => (site.portfolio.content as StandardContent).name || site.portfolio.ownerName || "Blog";
const base = (site: Site) => (site.canonical.startsWith("https://") ? { metadataBase: new URL(site.canonical) } : {});

export async function blogIndexMetadata(site: Site | null): Promise<Metadata> {
  if (!site || site.portfolio.resting || !site.portfolio.hasBlog) return { title: "Blog not found", robots: { index: false } };
  const name = ownerName(site);
  const url = `${site.canonical.replace(/\/$/, "")}/blog`;
  return { ...base(site), title: { absolute: `Blog — ${name}` }, description: `Writing by ${name}.`, alternates: { canonical: url }, openGraph: { type: "website", title: `Blog — ${name}`, url } };
}

/** Posts per page on a customer's blog index. */
const POSTS_PER_PAGE = 10;
export const pageParam = (value: string | string[] | undefined) => Math.max(1, Math.min(100, Number(Array.isArray(value) ? value[0] : value) || 1));

export async function BlogIndex({ site, page = 1 }: { site: Site | null; page?: number }) {
  if (!site || site.portfolio.resting || !site.portfolio.hasBlog) notFound();
  const posts = await sitePosts(site);
  const pages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  if (page > pages) notFound();
  return <PortfolioBlogIndex templateId={site.portfolio.templateId} content={site.portfolio.content as StandardContent} home={site.home} posts={posts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)} page={page} pages={pages} />;
}

export async function blogPostMetadata(site: Site | null, slug: string): Promise<Metadata> {
  const post = site ? await sitePost(site, slug) : null;
  if (!site || !post) return { title: "Post not found", robots: { index: false } };
  const url = `${site.canonical.replace(/\/$/, "")}/blog/${post.slug}`;
  const name = ownerName(site);
  return {
    ...base(site), title: { absolute: `${post.title} — ${name}` }, description: post.summary.slice(0, 160), alternates: { canonical: url },
    openGraph: { type: "article", title: post.title, description: post.summary.slice(0, 160), url, publishedTime: post.publishedAt ?? undefined, authors: [name], ...(post.cover ? { images: [post.cover] } : {}) },
  };
}

export async function BlogPost({ site, slug }: { site: Site | null; slug: string }) {
  const post = site ? await sitePost(site, slug) : null;
  if (!site || !post) notFound();
  const more = (await sitePosts(site, 4)).filter((item) => item.slug !== post.slug).slice(0, 3);
  const schema = { "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.summary, datePublished: post.publishedAt, author: { "@type": "Person", name: ownerName(site) }, ...(post.cover ? { image: post.cover } : {}) };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <PortfolioBlogPost templateId={site.portfolio.templateId} content={site.portfolio.content as StandardContent} home={site.home} post={post} more={more} />
  </>;
}

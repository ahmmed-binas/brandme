import { cache } from "react";
import { isValidDomain } from "@/lib/domains/names";
import { portfolioForHost } from "@/lib/domains/service";
import { databaseConfigured } from "@/utils/db-schema";
import { getPost, listPosts, type PortfolioPost } from "./posts";
import { getPublished, getPublishedFor, type PublishedPortfolio } from "./repository";
import { SLUG_PATTERN } from "./schema";
import type { PublicPost } from "@/components/templates/PortfolioBlog";

/**
 * A published portfolio as a small website: its home page and its blog,
 * reached either at /p/<slug> on our domain or at the owner's own domain.
 * `home` is the path prefix links use; `origin` is the canonical address.
 */
export interface Site { portfolio: PublishedPortfolio; home: string; canonical: string }

export const sitePathFor = cache(async (slug: string): Promise<Site | null> => {
  if (!databaseConfigured() || !SLUG_PATTERN.test(slug)) return null;
  const portfolio = await getPublished(slug);
  return portfolio ? { portfolio, home: `/p/${slug}`, canonical: `/p/${slug}` } : null;
});

export const siteForHost = cache(async (rawHost: string): Promise<Site | null> => {
  const host = decodeURIComponent(rawHost).toLowerCase();
  if (!databaseConfigured() || !isValidDomain(host)) return null;
  const owner = await portfolioForHost(host);
  const portfolio = owner ? await getPublishedFor(owner.ownerId, owner.templateId) : null;
  return portfolio ? { portfolio, home: "", canonical: `https://${host}` } : null;
});

export const toPublic = (post: PortfolioPost, withBody = false): PublicPost => ({
  slug: post.slug, title: post.title, summary: post.summary, cover: post.cover, publishedAt: post.publishedAt, readMinutes: post.readMinutes, ...(withBody ? { body: post.body, media: post.media } : {}),
});

/** Published posts for a live (not resting) site, newest first. */
export async function sitePosts(site: Site, limit?: number): Promise<PublicPost[]> {
  if (site.portfolio.resting || !site.portfolio.hasBlog) return [];
  return (await listPosts(site.portfolio.ownerId, site.portfolio.templateId, { limit })).map((post) => toPublic(post));
}

export const sitePost = cache(async (site: Site, slug: string): Promise<PublicPost | null> => {
  if (site.portfolio.resting || !site.portfolio.hasBlog || !/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const post = await getPost(site.portfolio.ownerId, site.portfolio.templateId, slug);
  return post ? toPublic(post, true) : null;
});

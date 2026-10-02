import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import PublishedPortfolioView from "@/components/templates/PublishedPortfolioView";
import { getPublished } from "@/lib/portfolio/repository";
import { SLUG_PATTERN } from "@/lib/portfolio/schema";
import { databaseConfigured } from "@/utils/db-schema";
import { sitePathFor, sitePosts } from "@/lib/portfolio/site";

const load = cache(async (slug: string) => {
  if (!databaseConfigured() || !SLUG_PATTERN.test(slug)) return null;
  return getPublished(slug);
});

function describe(content: Record<string, unknown>): { name?: string; title?: string; summary?: string } {
  const personal = content.personal as { name?: string; title?: string; positioning?: string } | undefined;
  if (personal) return { name: personal.name, title: personal.title, summary: personal.positioning };
  const summary = Array.isArray(content.summary) ? String(content.summary[0] ?? "") : undefined;
  return { name: content.name as string | undefined, title: content.professional_title as string | undefined, summary: (content.tagline as string | undefined) || summary };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const portfolio = await load(slug);
  if (!portfolio) return { title: "Portfolio not found", robots: { index: false } };
  if (portfolio.resting) return { title: portfolio.ownerName ?? "Portfolio", robots: { index: false } };
  const { name, title, summary } = describe(portfolio.content);
  const heading = [name, title].filter(Boolean).join(" — ") || "Portfolio";
  return {
    title: { absolute: heading },
    description: summary?.slice(0, 160),
    alternates: { canonical: `/p/${slug}` },
    openGraph: { type: "profile", title: heading, description: summary?.slice(0, 160), url: `/p/${slug}` },
  };
}

export default async function PublishedPortfolioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const portfolio = await load(slug);
  const site = await sitePathFor(slug);
  if (!portfolio || !site) notFound();
  return <PublishedPortfolioView templateId={portfolio.templateId} content={portfolio.content} theme={portfolio.theme} showsBranding={portfolio.showsBranding} resting={portfolio.resting} ownerName={portfolio.ownerName} posts={await sitePosts(site, 3)} home={site.home} />;
}

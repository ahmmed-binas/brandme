import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import PublishedPortfolioView from "@/components/templates/PublishedPortfolioView";
import { getPublished } from "@/lib/portfolio/repository";
import { SLUG_PATTERN } from "@/lib/portfolio/schema";
import { databaseConfigured } from "@/utils/db-schema";
import { sitePathFor, sitePosts } from "@/lib/portfolio/site";
import {
  describePortfolio,
  jsonLd,
  portfolioDescription,
  portfolioSchema,
  portfolioTitle,
} from "@/lib/portfolio/seo";
import { siteUrl } from "@/lib/site";

const load = cache(async (slug: string) => {
  if (!databaseConfigured() || !SLUG_PATTERN.test(slug)) return null;
  return getPublished(slug);
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const portfolio = await load(slug);
  if (!portfolio) return { title: "Portfolio not found", robots: { index: false } };
  if (portfolio.resting) return { title: portfolio.ownerName ?? "Portfolio", robots: { index: false } };
  const person = describePortfolio(portfolio.content);
  const heading = portfolioTitle(person);
  const description = portfolioDescription(person);
  const canonical = (await sitePathFor(slug))?.canonical ?? `/p/${slug}`;
  return {
    title: { absolute: heading },
    description,
    // The owner's own domain, when they have one, is the address to index.
    alternates: { canonical: canonical },
    openGraph: { type: "profile", title: heading, description, url: canonical },
  };
}

export default async function PublishedPortfolioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const portfolio = await load(slug);
  const site = await sitePathFor(slug);
  if (!portfolio || !site) notFound();
  const url = site.canonical.startsWith("/") ? `${siteUrl}${site.canonical}` : site.canonical;
  const schema = portfolioSchema(describePortfolio(portfolio.content), url);
  return (
    <>
      {!portfolio.resting && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      )}
      <PublishedPortfolioView
        templateId={portfolio.templateId}
        content={portfolio.content}
        theme={portfolio.theme}
        showsBranding={portfolio.showsBranding}
        resting={portfolio.resting}
        ownerName={portfolio.ownerName}
        posts={await sitePosts(site, 3)}
        home={site.home}
      />
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import PublishedPortfolioView from "@/components/templates/PublishedPortfolioView";
import { isValidDomain } from "@/lib/domains/names";
import { portfolioForHost } from "@/lib/domains/service";
import { getPublishedFor } from "@/lib/portfolio/repository";
import { databaseConfigured } from "@/utils/db-schema";
import { siteForHost, sitePosts } from "@/lib/portfolio/site";
import {
  describePortfolio,
  jsonLd,
  portfolioDescription,
  portfolioSchema,
  portfolioTitle,
} from "@/lib/portfolio/seo";

/** A published portfolio served on its owner's custom domain (reached via the rewrite in proxy.ts). */
const load = cache(async (rawHost: string) => {
  const host = decodeURIComponent(rawHost).toLowerCase();
  if (!databaseConfigured() || !isValidDomain(host)) return null;
  const owner = await portfolioForHost(host);
  return owner ? getPublishedFor(owner.ownerId, owner.templateId) : null;
});

export async function generateMetadata({ params }: { params: Promise<{ host: string }> }): Promise<Metadata> {
  const { host } = await params;
  const portfolio = await load(host);
  if (!portfolio) return { title: "Portfolio not found", robots: { index: false } };
  if (portfolio.resting) return { title: portfolio.ownerName ?? "Portfolio", robots: { index: false } };
  const person = describePortfolio(portfolio.content);
  const heading = portfolioTitle(person);
  const description = portfolioDescription(person);
  const url = `https://${decodeURIComponent(host)}`;
  return {
    metadataBase: new URL(url),
    title: { absolute: heading },
    description,
    alternates: { canonical: url },
    openGraph: { type: "profile", title: heading, description, url },
  };
}

export default async function CustomDomainPage({ params }: { params: Promise<{ host: string }> }) {
  const { host } = await params;
  const portfolio = await load(host);
  const site = await siteForHost(host);
  if (!portfolio || !site) notFound();
  const schema = portfolioSchema(describePortfolio(portfolio.content), site.canonical);
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

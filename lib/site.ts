import { brand } from "@/lib/brand";
import { aed, type Prices } from "@/lib/offers";

/** The public origin used for canonical URLs, sitemaps and social cards. Set APP_URL in production. */
export const siteUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Says what Kitefolio is, who it's for and what it costs, so search and AI answers can quote it. */
export const siteDescriptionFor = (prices: Pick<Prices, "proMonth">) =>
  `${brand.name} builds personal websites and portfolios for professionals and UAE real estate agents. Pick a design made for your job and publish free; Pro adds your own domain from ${aed(prices.proMonth)} a month.`;

/**
 * The site-wide default (layout and WebSite schema). No price in it, so it
 * never goes stale when prices change; the home page uses siteDescriptionFor.
 */
export const siteDescription = `${brand.name} builds personal websites and portfolios for professionals and UAE real estate agents. Pick a design made for your job and publish free; Pro adds your own domain.`;

export const organizationJsonLd = {
  "@type": "Organization",
  name: brand.name,
  url: siteUrl,
  logo: `${siteUrl}/icon.svg`,
  // The contact page, not an address: the owner doesn't want a personal email in search results.
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    url: `${siteUrl}/contact`,
    availableLanguage: ["English"],
  },
};

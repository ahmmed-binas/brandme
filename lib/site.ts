import { brand } from "@/lib/brand";
import { aed, PRICES } from "@/lib/offers";

/** The public origin used for canonical URLs, sitemaps and social cards. Set APP_URL in production. */
export const siteUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Says what Fuccura is, who it's for and what it costs, so search and AI answers can quote it. */
export const siteDescription = `${brand.name} builds personal websites and portfolios for professionals and UAE real estate agents. Pick a design made for your job and publish free; Pro adds your own domain from ${aed(PRICES.proMonth)} a month.`;

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

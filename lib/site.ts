import { brand } from "@/lib/brand";

/** The public origin used for canonical URLs, sitemaps and social cards. Set APP_URL in production. */
export const siteUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const siteDescription = "Turn your CV, GitHub or LinkedIn into a well-designed portfolio and publish it at your own domain. Free to publish; you only pay if you want a domain.";

export const organizationJsonLd = {
  "@type": "Organization",
  name: brand.name,
  url: siteUrl,
  email: brand.contactEmail,
};

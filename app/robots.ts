import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * robots.txt for the main site. Customers' own domains get their own
 * (app/sites/[host]/robots.txt).
 *
 * Private and functional pages are kept out of search (sign-in, accounts, the
 * editor, admin, the API). The secret console address is deliberately not
 * listed: robots.txt is public, and naming it would reveal it.
 *
 * AI search and assistant crawlers are named and welcomed on purpose: being
 * read and quoted by ChatGPT, Claude, Perplexity and Google's AI answers is
 * part of what customers' portfolios are for. They get the same rules.
 */
const PRIVATE = [
  "/api/", "/editor/", "/account", "/login", "/signup", "/forgot-password", "/reset-password",
  "/admin", "/console", "/templates/review", "/community/moderation", "/gallery/submit", "/sites/",
];

const AI_CRAWLERS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

// Checks fuccura.com's health in Google Search Console for Ahmed Agent's runs:
// the sitemaps Google has (errors, warnings, pages submitted) and whether the
// key pages are indexed (URL Inspection, read-only).
//
//   node scripts/agent/search-console-health.mjs
//   node scripts/agent/search-console-health.mjs /pricing /for/nurse   other pages
//
// Sign-in and key file: see gsc.mjs.
import { accessToken, call, PROPERTIES, readKey } from "./gsc.mjs";

const SITE = "https://fuccura.com";
const KEY_PAGES = [
  "/",
  "/for",
  "/for/real-estate-agent",
  "/pricing",
  "/tools",
  "/tools/voice",
  "/tools/uae-mortgage-calculator",
  "/templatechooser",
  "/gallery",
  "/about",
];
const pages = process.argv.length > 2 ? process.argv.slice(2) : KEY_PAGES;
const API = "https://www.googleapis.com/webmasters/v3/sites";

async function sitemaps(token, property) {
  const body = await call(token, `${API}/${encodeURIComponent(property)}/sitemaps`);
  return (body.sitemap ?? []).map((sitemap) => ({
    path: sitemap.path,
    lastDownloaded: sitemap.lastDownloaded,
    errors: Number(sitemap.errors ?? 0),
    warnings: Number(sitemap.warnings ?? 0),
    submitted: sitemap.contents?.map((part) => `${part.type}: ${part.submitted}`).join(", "),
  }));
}

/** Google's verdict on one page: indexed or not, and why. */
async function inspect(token, property, path) {
  const body = await call(token, "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    inspectionUrl: `${SITE}${path}`,
    siteUrl: property,
  });
  const index = body.inspectionResult?.indexStatusResult ?? {};
  return {
    page: path,
    verdict: index.verdict,
    coverage: index.coverageState,
    lastCrawl: index.lastCrawlTime,
    googleCanonical: index.googleCanonical,
    yourCanonical: index.userCanonical,
  };
}

const token = await accessToken(await readKey());
let lastError;
for (const property of PROPERTIES) {
  try {
    const report = { property, sitemaps: await sitemaps(token, property), pages: [] };
    for (const path of pages) report.pages.push(await inspect(token, property, path));
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  } catch (error) {
    lastError = error;
  }
}
console.error(`Couldn't read Search Console (${lastError?.message}).`);
process.exit(1);

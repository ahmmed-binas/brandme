// Reads kitefolio.com's Bing Webmaster Tools data for Ahmed Agent's runs.
// Bing also feeds ChatGPT search and Copilot, so it matters for AI answers too.
//
//   node scripts/agent/bing.mjs                  report: traffic, top queries and pages, crawl issues
//   node scripts/agent/bing.mjs submit /a /b     ask Bing to crawl these pages now (daily quota)
//   node scripts/agent/bing.mjs sitemap          register the sitemap with Bing and show its status
//   node scripts/agent/bing.mjs sites            sites on the account and whether they're verified
//   node scripts/agent/bing.mjs url / /for/nurse what Bing knows about these pages
//
// The API key is NOT in the repo: C:\Users\binas\.fuccura\bing-key.txt (or set
// BING_KEY_FILE). Create it at bing.com/webmasters > Settings > API access.
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const KEY_FILE = process.env.BING_KEY_FILE || join(homedir(), ".fuccura", "bing-key.txt");
const SITE = "https://kitefolio.com/";
const API = "https://ssl.bing.com/webmaster/api.svc/json";

const key = (await readFile(KEY_FILE, "utf8")).trim();

/** Calls one Bing Webmaster API method; POST when a body is given. Never prints the key. */
async function call(method, params = {}, body) {
  // A param set to undefined is left out (e.g. GetUserSites takes no siteUrl).
  const values = Object.entries({ siteUrl: SITE, ...params, apikey: key }).filter(
    ([, value]) => value !== undefined,
  );
  const query = new URLSearchParams(values);
  const response = await fetch(`${API}/${method}?${query}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} failed (${response.status}): ${text.slice(0, 200)}`);
  return text ? JSON.parse(text).d : null;
}

/** Bing sends dates as "/Date(1760400000000-0700)/". */
const day = (value) => {
  const ms = Number(String(value).match(/\d+/)?.[0]);
  return Number.isFinite(ms) ? new Date(ms).toISOString().slice(0, 10) : value;
};

/** Adds up rows (one per day or week) by their Query or Page. */
function totals(rows, keyName) {
  const byKey = new Map();
  for (const row of rows ?? []) {
    const entry = byKey.get(row.Query) ?? { [keyName]: row.Query, clicks: 0, impressions: 0 };
    entry.clicks += row.Clicks;
    entry.impressions += row.Impressions;
    byKey.set(row.Query, entry);
  }
  return [...byKey.values()].sort((a, b) => b.impressions - a.impressions).slice(0, 25);
}

async function report() {
  const [traffic, queries, pages, issues, quota] = await Promise.all([
    call("GetRankAndTrafficStats"),
    call("GetQueryStats"),
    call("GetPageStats"),
    call("GetCrawlIssues"),
    call("GetUrlSubmissionQuota"),
  ]);
  const recent = (traffic ?? []).slice(-28);
  console.log(
    JSON.stringify(
      {
        site: SITE,
        last28Days: {
          clicks: recent.reduce((sum, row) => sum + row.Clicks, 0),
          impressions: recent.reduce((sum, row) => sum + row.Impressions, 0),
          days: recent.map((row) => ({
            day: day(row.Date),
            clicks: row.Clicks,
            impressions: row.Impressions,
          })),
        },
        // GetPageStats puts the page address in the "Query" field.
        queries: totals(queries, "query"),
        pages: totals(pages, "page"),
        crawlIssues: (issues ?? []).map((issue) => ({
          url: issue.Url,
          issue: issue.Issues,
          code: issue.HttpCode,
        })),
        submissionQuota: quota && { daily: quota.DailyQuota, monthly: quota.MonthlyQuota },
      },
      null,
      2,
    ),
  );
}

async function submit(paths) {
  const urlList = paths.map((path) => new URL(path, SITE).toString());
  await call("SubmitUrlBatch", {}, { siteUrl: SITE, urlList });
  console.log(`Submitted ${urlList.length} page(s) to Bing:\n${urlList.join("\n")}`);
}

/** Registers the sitemap with Bing (safe to repeat), then lists the sitemaps Bing has. */
async function sitemap() {
  await call("SubmitFeed", {}, { siteUrl: SITE, feedUrl: `${SITE}sitemap.xml` });
  const feeds = await call("GetFeeds");
  console.log(
    JSON.stringify(
      (feeds ?? []).map((feed) => ({
        url: feed.Url,
        status: feed.Status,
        urls: feed.UrlCount,
        submitted: feed.Submitted && day(feed.Submitted),
        lastCrawled: feed.LastCrawled && day(feed.LastCrawled),
      })),
      null,
      2,
    ),
  );
}

/** The sites on this Bing account and whether each is verified. */
async function sites() {
  const list = await call("GetUserSites", { siteUrl: undefined });
  console.log(
    JSON.stringify(
      (list ?? []).map((site) => ({ url: site.Url, verified: site.IsVerified })),
      null,
      2,
    ),
  );
}

/** What Bing knows about one page: crawled or not, when, and its HTTP status. */
async function inspect(paths) {
  for (const path of paths) {
    const url = new URL(path, SITE).toString();
    const info = await call("GetUrlInfo", { url });
    console.log(
      JSON.stringify({
        url,
        httpStatus: info?.HttpStatus,
        lastCrawled: info?.LastCrawledDate && day(info.LastCrawledDate),
        discovered: info?.DiscoveryDate && day(info.DiscoveryDate),
        documentSize: info?.DocumentSize,
      }),
    );
  }
}

try {
  const [command, ...rest] = process.argv.slice(2);
  if (command === "submit") await submit(rest);
  else if (command === "sites") await sites();
  else if (command === "sitemap") await sitemap();
  else if (command === "url") await inspect(rest);
  else await report();
} catch (error) {
  console.error(`Couldn't read Bing Webmaster Tools: ${error.message}`);
  process.exit(1);
}

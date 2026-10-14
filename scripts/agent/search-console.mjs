// Reads kitefolio.com's Google Search Console data for Ahmed Agent's runs.
//
//   node scripts/agent/search-console.mjs            last 28 days
//   node scripts/agent/search-console.mjs 7          last 7 days
//
// Prints totals, top queries and top pages as JSON. Sign-in and key file: see
// gsc.mjs. For sitemaps and indexing, run search-console-health.mjs.
import { accessToken, call, PROPERTIES, readKey } from "./gsc.mjs";

const days = Number(process.argv[2] ?? 28);

async function query(token, property, dimensions, rowLimit) {
  // Include fresh (still-updating) data, like the Search Console dashboard does.
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const body = await call(
    token,
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
    {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      dimensions,
      rowLimit,
      dataState: "all",
    },
  );
  return body.rows ?? [];
}

const round = (row) => ({
  keys: row.keys,
  clicks: row.clicks,
  impressions: row.impressions,
  ctr: Math.round(row.ctr * 1000) / 10,
  position: Math.round(row.position * 10) / 10,
});

const key = await readKey();
const token = await accessToken(key);
let lastError;
for (const property of PROPERTIES) {
  try {
    const totals = await query(token, property, [], 1);
    const queries = await query(token, property, ["query"], 25);
    const pages = await query(token, property, ["page"], 25);
    console.log(
      JSON.stringify(
        {
          property,
          days,
          totals: totals[0] ? round({ ...totals[0], keys: [] }) : null,
          queries: queries.map(round),
          pages: pages.map(round),
        },
        null,
        2,
      ),
    );
    process.exit(0);
  } catch (error) {
    lastError = error;
  }
}
console.error(
  `Couldn't read Search Console (${lastError?.message}). Check the API is enabled and ${key.client_email} is added as a user.`,
);
process.exit(1);

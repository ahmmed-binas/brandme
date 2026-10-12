// Reads fuccura.com's Google Search Console data for Ahmed Agent's runs.
//
//   node scripts/agent/search-console.mjs            last 28 days
//   node scripts/agent/search-console.mjs 7          last 7 days
//
// Uses a Google service account (read-only "Restricted" user in Search Console).
// The key file is NOT in the repo: C:\Users\binas\.fuccura\gsc-key.json (or set
// GSC_KEY_FILE). Prints totals, top queries and top pages as JSON.
import { createSign } from "node:crypto";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const KEY_FILE = process.env.GSC_KEY_FILE || join(homedir(), ".fuccura", "gsc-key.json");
// A Domain property (verified by DNS) or a URL-prefix property; the first that answers is used.
const PROPERTIES = ["sc-domain:fuccura.com", "https://fuccura.com/"];
const days = Number(process.argv[2] ?? 28);

const base64url = (value) => Buffer.from(value).toString("base64url");

/** An access token from the service account key (signed JWT, OAuth 2.0). */
async function accessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(key.private_key, "base64url");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`Google sign-in failed: ${body.error_description ?? body.error}`);
  return body.access_token;
}

async function query(token, property, dimensions, rowLimit) {
  // Include fresh (still-updating) data, like the Search Console dashboard does.
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        dimensions,
        rowLimit,
        dataState: "all",
      }),
    },
  );
  const body = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(body.error?.message ?? response.statusText), { status: response.status });
  return body.rows ?? [];
}

const round = (row) => ({
  keys: row.keys,
  clicks: row.clicks,
  impressions: row.impressions,
  ctr: Math.round(row.ctr * 1000) / 10,
  position: Math.round(row.position * 10) / 10,
});

const key = JSON.parse(await readFile(KEY_FILE, "utf8"));
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

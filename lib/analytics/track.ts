import { createHash } from "node:crypto";
import { db } from "@/utils/db";
import { databaseConfigured, ensureSchema } from "@/utils/db-schema";
import { consoleBase } from "@/lib/console/path";

/**
 * Visitor counts and journeys for the superadmin console, without cookies.
 *
 * No IP address or cookie is stored. A visitor is a hash of (IP, browser,
 * today's date, a secret), so the same person counts once per day and can't be
 * followed from one day to the next. Visitors who are signed in are linked to
 * their account (user_id), so the owner can see what customers do. The browser's
 * time zone gives a rough location. Bots and the admin pages aren't counted. Rows older than 400 days are
 * deleted by the hourly job.
 */

export const BOT =
  /bot|crawl|spider|slurp|bing|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|curl|wget|python|node-fetch|axios|go-http|headless|lighthouse|pingdom|uptime|monitor/i;
const SKIP = ["/api", "/admin", "/console", "/_next", "/__not-found"];

const appHost = (() => {
  try {
    return new URL(process.env.APP_URL ?? "http://localhost:3000").hostname.toLowerCase();
  } catch {
    return "localhost";
  }
})();
const isAppHost = (host: string) =>
  host === appHost || host === `www.${appHost}` || !host.includes(".") || /^[\d.]+$/.test(host);

function device(ua: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|kindle|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return "tablet";
  return /mobi|iphone|android/i.test(ua) ? "mobile" : "desktop";
}

export function visitorId(ip: string, ua: string, now = new Date()): string {
  const day = now.toISOString().slice(0, 10);
  const salt = createHash("sha256")
    .update(`${process.env.AUTH_SECRET ?? "formora"}:${day}`)
    .digest("hex");
  return createHash("sha256").update(`${salt}:${ip}:${ua}`).digest("hex").slice(0, 24);
}

const recent = new Map<string, number[]>();
function tooMany(key: string): boolean {
  const now = Date.now();
  const times = (recent.get(key) ?? []).filter((time) => now - time < 60_000);
  times.push(now);
  recent.set(key, times);
  if (recent.size > 20_000) recent.clear();
  return times.length > 60;
}

export interface ViewInput {
  host: string;
  path: string;
  referrer?: string | null;
  ip: string;
  userAgent: string;
  /** The signed-in visitor's account, if any. */
  userId?: string | null;
  /** The browser's time zone, e.g. "Asia/Dubai". */
  timeZone?: string | null;
}

/** Keeps only well-formed time zone names like "Asia/Dubai" or "America/Argentina/Salta". */
const cleanTimeZone = (value?: string | null) =>
  value && /^[A-Za-z_]+(\/[A-Za-z0-9_+-]+){0,2}$/.test(value) ? value.slice(0, 64) : null;

/** Records one page view. Returns false when it isn't counted (bot, admin page, too many). */
export async function recordView(input: ViewInput): Promise<boolean> {
  if (!databaseConfigured()) return false;
  const ua = input.userAgent.slice(0, 400);
  if (!ua || BOT.test(ua)) return false;
  const host = input.host.toLowerCase().replace(/:\d+$/, "").slice(0, 253);
  const path = (input.path.split("?")[0] ?? "/").slice(0, 300) || "/";
  if (!path.startsWith("/")) return false;
  const base = consoleBase();
  if (
    SKIP.some((skip) => path === skip || path.startsWith(`${skip}/`)) ||
    path === base ||
    path.startsWith(`${base}/`)
  )
    return false;
  const visitor = visitorId(input.ip, ua);
  if (tooMany(visitor)) return false;

  const onApp = isAppHost(host);
  const portfolioSlug = onApp ? (path.match(/^\/p\/([^/]+)/)?.[1] ?? null) : host;
  const kind = portfolioSlug ? "portfolio" : "site";
  let referrer: string | null = null;
  try {
    const from = input.referrer ? new URL(input.referrer).hostname.toLowerCase() : null;
    if (from && from !== host && !isAppHost(from)) referrer = from.replace(/^www\./, "").slice(0, 253);
  } catch {
    referrer = null;
  }

  await ensureSchema();
  await db.query(
    `INSERT INTO page_views (host, path, kind, portfolio_slug, referrer, visitor, device, user_id, time_zone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      host,
      path,
      kind,
      portfolioSlug ? decodeURIComponent(portfolioSlug).slice(0, 253) : null,
      referrer,
      visitor,
      device(ua),
      input.userId ?? null,
      cleanTimeZone(input.timeZone),
    ],
  );
  return true;
}

/** Keeps a little over a year of visits. */
export async function pruneViews(): Promise<number> {
  if (!databaseConfigured()) return 0;
  await ensureSchema();
  return (await db.query("DELETE FROM page_views WHERE at < NOW() - INTERVAL '400 days'")).rowCount ?? 0;
}

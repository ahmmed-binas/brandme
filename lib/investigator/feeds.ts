import { lookup } from "node:dns/promises";
import { lookup as lookupCallback, type LookupAddress } from "node:dns";
import http from "node:http";
import https from "node:https";
import { isIP, type LookupFunction } from "node:net";

/**
 * Fetches a public RSS/Atom feed the customer gave us. Because the address
 * comes from a customer, it must never reach our own network: private,
 * loopback and link-local addresses are refused (set
 * INVESTIGATOR_ALLOW_PRIVATE_FETCH=true only in tests), redirects are
 * followed by hand and re-checked, and responses are size- and time-limited.
 * The address is checked again at the moment of connecting, so a domain can't
 * pass the check with a public address and then connect to a private one
 * (DNS rebinding).
 */

export interface FeedItem { title: string; link: string; date: Date | null; summary: string }

const MAX_BYTES = 1_500_000;

function privateAddress(ip: string): boolean {
  if (ip.includes(":")) {
    const lower = ip.toLowerCase();
    // IPv4 written as IPv6 (::ffff:169.254.169.254) is checked as IPv4.
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
    if (mapped) return privateAddress(mapped);
    return lower === "::1" || lower === "::" || lower.startsWith("::ffff:") || lower.startsWith("64:ff9b:") || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb") || lower.startsWith("ff");
  }
  const [a, b] = ip.split(".").map(Number) as [number, number];
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

export async function assertPublic(url: URL): Promise<void> {
  if (process.env.INVESTIGATOR_ALLOW_PRIVATE_FETCH === "true") return;
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Only web addresses can be read.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((entry) => entry.address);
  if (!addresses.length || addresses.some(privateAddress)) throw new Error("That address isn’t public.");
}

/** DNS lookup used when connecting: refuses private addresses at the last moment. */
const publicOnlyLookup: LookupFunction = (hostname, options, callback) => {
  lookupCallback(hostname, { ...options, all: true }, (error, addresses: LookupAddress[]) => {
    if (error) return callback(error, "", 4);
    if (process.env.INVESTIGATOR_ALLOW_PRIVATE_FETCH !== "true" && (!addresses.length || addresses.some((entry) => privateAddress(entry.address)))) return callback(new Error("That address isn’t public."), "", 4);
    if (options.all) return (callback as unknown as (error: null, addresses: LookupAddress[]) => void)(null, addresses);
    callback(null, addresses[0]!.address, addresses[0]!.family);
  });
};

/** One GET with the connection-time address check, a time limit and a size limit. */
function getOnce(url: URL): Promise<{ status: number; location: string | null; body: string }> {
  return new Promise((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http;
    const request = client.get(url, { lookup: publicOnlyLookup, timeout: 12_000, headers: { "User-Agent": "FormoraInvestigator/1.0 (reads public feeds the profile owner asked us to watch)", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5" } }, (response) => {
      const status = response.statusCode ?? 0;
      if (status >= 300 && status < 400) { response.resume(); return resolve({ status, location: response.headers.location ?? null, body: "" }); }
      if (Number(response.headers["content-length"] ?? 0) > MAX_BYTES) { response.destroy(); return reject(new Error("The feed is too large.")); }
      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > MAX_BYTES) { response.destroy(); reject(new Error("The feed is too large.")); return; }
        chunks.push(chunk);
      });
      response.on("end", () => resolve({ status, location: null, body: Buffer.concat(chunks).toString("utf8") }));
      response.on("error", reject);
    });
    request.on("timeout", () => request.destroy(new Error("The address took too long to answer.")));
    request.on("error", reject);
  });
}

export async function safeFetchText(raw: string): Promise<string> {
  let url = new URL(raw);
  for (let hop = 0; hop < 4; hop++) {
    await assertPublic(url);
    const response = await getOnce(url);
    if (response.status >= 300 && response.status < 400 && response.location) { url = new URL(response.location, url); continue; }
    if (response.status < 200 || response.status >= 300) throw new Error(`The address answered ${response.status}.`);
    return response.body;
  }
  throw new Error("Too many redirects.");
}

const decode = (value: string) => value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;|&apos;/g, "'").replace(/\s+/g, " ").trim();
const tag = (block: string, name: string) => block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"))?.[1];

/** A small, forgiving RSS 2.0 / Atom reader: titles, links, dates and a short summary, newest first. */
export function parseFeed(xml: string): FeedItem[] {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? [];
  return blocks.slice(0, 30).map((block) => {
    const atomLink = block.match(/<link[^>]*href="([^"]+)"[^>]*\/?>/i)?.[1];
    const link = decode(tag(block, "link") ?? "") || atomLink || "";
    const when = tag(block, "pubDate") ?? tag(block, "published") ?? tag(block, "updated") ?? tag(block, "dc:date");
    const date = when ? new Date(decode(when)) : null;
    return {
      title: decode(tag(block, "title") ?? "").slice(0, 200),
      link: /^https?:\/\//.test(link) ? link : "",
      date: date && !Number.isNaN(date.getTime()) ? date : null,
      summary: decode(tag(block, "description") ?? tag(block, "summary") ?? tag(block, "media:description") ?? "").slice(0, 300),
    };
  }).filter((item) => item.title && item.link).sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
}

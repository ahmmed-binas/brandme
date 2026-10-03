import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Fetches a public RSS/Atom feed the customer gave us. Because the address
 * comes from a customer, it must never reach our own network: private,
 * loopback and link-local addresses are refused (set
 * INVESTIGATOR_ALLOW_PRIVATE_FETCH=true only in tests), redirects are
 * followed by hand and re-checked, and responses are size- and time-limited.
 */

export interface FeedItem { title: string; link: string; date: Date | null; summary: string }

const MAX_BYTES = 1_500_000;

function privateAddress(ip: string): boolean {
  if (ip.includes(":")) {
    const lower = ip.toLowerCase();
    return lower === "::1" || lower === "::" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80") || lower.startsWith("::ffff:127.") || lower.startsWith("::ffff:10.") || lower.startsWith("::ffff:192.168.");
  }
  const [a, b] = ip.split(".").map(Number) as [number, number];
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

async function assertPublic(url: URL): Promise<void> {
  if (process.env.INVESTIGATOR_ALLOW_PRIVATE_FETCH === "true") return;
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Only web addresses can be read.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((entry) => entry.address);
  if (!addresses.length || addresses.some(privateAddress)) throw new Error("That address isn’t public.");
}

export async function safeFetchText(raw: string): Promise<string> {
  let url = new URL(raw);
  for (let hop = 0; hop < 4; hop++) {
    await assertPublic(url);
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(12_000), headers: { "User-Agent": "FormoraInvestigator/1.0 (reads public feeds the profile owner asked us to watch)", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5" } });
    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) { url = new URL(response.headers.get("location")!, url); continue; }
    if (!response.ok) throw new Error(`The feed answered ${response.status}.`);
    if (Number(response.headers.get("content-length") ?? 0) > MAX_BYTES) throw new Error("The feed is too large.");
    const reader = response.body?.getReader();
    if (!reader) return "";
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BYTES) { await reader.cancel(); throw new Error("The feed is too large."); }
      chunks.push(value);
    }
    return new TextDecoder().decode(Buffer.concat(chunks));
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

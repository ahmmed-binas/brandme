import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { assertPublic, safeFetchText } from "./feeds";

/**
 * Reads one public web page the account owner gave us (their website, a
 * portfolio, a profile) and returns what a person would see on it.
 *
 * With OBSCURA_URL set (a headless browser, github.com/h4ckf0r0day/obscura,
 * reached over the Chrome DevTools Protocol), the page's JavaScript runs, so
 * sites that build their content in the browser (most portfolio builders,
 * Linktree-style pages, Behance) can be read. Without it, the raw HTML is
 * fetched. Either way: public addresses only, no logins, no cookies kept, no
 * "stealth" tricks to get past a site that blocks automated visitors.
 */

export interface PageRead {
  ok: boolean;
  url: string;
  via: "browser" | "fetch";
  title: string;
  description: string;
  /** Visible text, whitespace-collapsed, at most 20,000 characters. */
  text: string;
  /** schema.org Person data the page declares about someone. */
  people: { name?: string; jobTitle?: string; worksFor?: string; sameAs?: string[] }[];
  error?: string;
}

const MAX_TEXT = 20_000;
const NAV_TIMEOUT = 20_000;

const empty = (url: string, via: PageRead["via"], error: string): PageRead => ({ ok: false, url, via, title: "", description: "", text: "", people: [], error });

const decode = (value: string) => value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
const squash = (value: string) => value.replace(/\s+/g, " ").trim();

/** schema.org Person objects anywhere in a JSON-LD document. */
export function peopleFromJsonLd(blocks: string[]): PageRead["people"] {
  const people: PageRead["people"] = [];
  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(visit); return; }
    const item = node as Record<string, unknown>;
    const type = item["@type"];
    if (type === "Person" || (Array.isArray(type) && type.includes("Person"))) {
      const works = item.worksFor as Record<string, unknown> | Record<string, unknown>[] | string | undefined;
      const employer = typeof works === "string" ? works : Array.isArray(works) ? works.map((w) => w?.name).filter(Boolean).join(", ") : (works?.name as string | undefined);
      people.push({
        name: typeof item.name === "string" ? item.name : undefined,
        jobTitle: typeof item.jobTitle === "string" ? item.jobTitle : Array.isArray(item.jobTitle) ? item.jobTitle.join(", ") : undefined,
        worksFor: employer || undefined,
        sameAs: Array.isArray(item.sameAs) ? item.sameAs.filter((link): link is string => typeof link === "string").slice(0, 12) : typeof item.sameAs === "string" ? [item.sameAs] : undefined,
      });
    }
    for (const value of Object.values(item)) if (value && typeof value === "object") visit(value);
  };
  for (const block of blocks) { try { visit(JSON.parse(block)); } catch { /* ignore broken JSON-LD */ } }
  return people.slice(0, 5);
}

/** Pulls title, description, JSON-LD and visible text out of raw HTML. */
export function readHtml(html: string, url: string, via: PageRead["via"] = "fetch"): PageRead {
  const meta = (name: string) => html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"))?.[1]
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, "i"))?.[1];
  const jsonLd = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]!);
  const text = squash(decode(html
    .replace(/<head[\s\S]*?<\/head>/i, " ")
    .replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|h[1-6]|li|section|article|header|footer|br|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")));
  return {
    ok: true, url, via,
    title: squash(decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || meta("og:title") || "")).slice(0, 300),
    description: squash(decode(meta("description") ?? meta("og:description") ?? "")).slice(0, 600),
    text: text.slice(0, MAX_TEXT),
    people: peopleFromJsonLd(jsonLd),
  };
}

/**
 * Obscura (like Chrome) refuses DevTools connections whose Host header is a
 * name other than "localhost", to stop DNS-rebinding attacks. Inside Docker the
 * service is "obscura", so we look the name up and connect by IP address.
 */
async function byAddress(endpoint: string): Promise<string> {
  const url = new URL(endpoint);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) || host === "localhost") return endpoint;
  const { address, family } = await lookup(host);
  url.hostname = family === 6 ? `[${address}]` : address;
  return url.toString();
}

/** A minimal DevTools Protocol client over Node's built-in WebSocket. */
async function withBrowser<T>(endpoint: string, work: (send: (method: string, params?: object, sessionId?: string) => Promise<Record<string, unknown>>, events: EventTarget) => Promise<T>): Promise<T> {
  const socket = new WebSocket(await byAddress(endpoint));
  const events = new EventTarget();
  const pending = new Map<number, { resolve: (value: Record<string, unknown>) => void; reject: (error: Error) => void }>();
  let next = 1;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("The page reader didn’t answer.")), 5_000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("The page reader isn’t reachable.")); }, { once: true });
  });
  socket.addEventListener("message", (event) => {
    let message: { id?: number; result?: Record<string, unknown>; error?: { message?: string }; method?: string; params?: unknown; sessionId?: string };
    try { message = JSON.parse(String(event.data)); } catch { return; }
    if (message.id && pending.has(message.id)) {
      const waiter = pending.get(message.id)!;
      pending.delete(message.id);
      if (message.error) waiter.reject(new Error(message.error.message ?? "DevTools error")); else waiter.resolve(message.result ?? {});
    } else if (message.method) {
      events.dispatchEvent(new CustomEvent(message.method, { detail: message }));
    }
  });
  const send = (method: string, params: object = {}, sessionId?: string) => new Promise<Record<string, unknown>>((resolve, reject) => {
    const id = next++;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  try {
    return await work(send, events);
  } finally {
    for (const waiter of pending.values()) waiter.reject(new Error("closed"));
    socket.close();
  }
}

const IN_PAGE = `(() => {
  const meta = (n) => document.querySelector('meta[name="' + n + '"],meta[property="' + n + '"]')?.getAttribute('content') || '';
  const body = document.body ? document.body.cloneNode(true) : null;
  if (body) body.querySelectorAll('script,style,noscript,template,svg,iframe').forEach((node) => node.remove());
  // Some engines lack innerText layout; a space after every element keeps words apart.
  if (body) body.querySelectorAll('*').forEach((node) => node.appendChild(document.createTextNode(' ')));
  return JSON.stringify({
    title: document.title || meta('og:title') || '',
    description: meta('description') || meta('og:description') || '',
    text: body ? (body.innerText || body.textContent || '') : '',
    jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent || ''),
  });
})()`;

async function readWithBrowser(endpoint: string, url: string): Promise<PageRead> {
  return withBrowser(endpoint, async (send, events) => {
    const { targetId } = await send("Target.createTarget", { url: "about:blank" }) as { targetId: string };
    try {
      const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true }) as { sessionId: string };
      await send("Page.enable", {}, sessionId).catch(() => undefined);
      await send("Network.enable", {}, sessionId).catch(() => undefined);
      // The main document's HTTP status, and its load (not the blank tab's).
      let status = 0;
      events.addEventListener("Network.responseReceived", (event) => {
        const params = (event as CustomEvent).detail?.params as { type?: string; response?: { status?: number } } | undefined;
        if (params?.type === "Document" && !status) status = params.response?.status ?? 0;
      });
      const loaded = new Promise<void>((resolve) => {
        const onLoad = () => { if (status) { events.removeEventListener("Page.loadEventFired", onLoad); resolve(); } };
        events.addEventListener("Page.loadEventFired", onLoad);
        setTimeout(resolve, NAV_TIMEOUT);
      });
      const navigation = await send("Page.navigate", { url }, sessionId) as { errorText?: string };
      if (navigation.errorText) return empty(url, "browser", navigation.errorText);
      await loaded;
      if (status >= 400) return empty(url, "browser", `The page answered ${status}.`);
      await new Promise((resolve) => setTimeout(resolve, 800)); // let client-side rendering settle
      const evaluated = await send("Runtime.evaluate", { expression: IN_PAGE, returnByValue: true }, sessionId) as { result?: { value?: string } };
      const page = JSON.parse(evaluated.result?.value ?? "{}") as { title?: string; description?: string; text?: string; jsonLd?: string[] };
      return {
        ok: true, url, via: "browser" as const,
        title: squash(page.title ?? "").slice(0, 300),
        description: squash(page.description ?? "").slice(0, 600),
        text: squash(page.text ?? "").slice(0, MAX_TEXT),
        people: peopleFromJsonLd(page.jsonLd ?? []),
      };
    } finally {
      await send("Target.closeTarget", { targetId }).catch(() => undefined);
    }
  });
}

/** Reads a public page: in the headless browser when configured, else by plain fetch. Never throws. */
export async function readPage(raw: string): Promise<PageRead> {
  let url: URL;
  try { url = new URL(raw); } catch { return empty(raw, "fetch", "Not a web address."); }
  if (url.protocol !== "https:" && url.protocol !== "http:") return empty(raw, "fetch", "Only web addresses can be read.");
  try { await assertPublic(url); } catch (error) { return empty(raw, "fetch", (error as Error).message); }
  const endpoint = process.env.OBSCURA_URL?.trim();
  if (endpoint) {
    try {
      const page = await Promise.race([readWithBrowser(endpoint, url.toString()), new Promise<never>((_, reject) => setTimeout(() => reject(new Error("The page took too long to load.")), NAV_TIMEOUT + 8_000))]);
      if (page.ok && (page.text.length > 40 || page.title)) return page;
    } catch (error) {
      console.warn("Headless read failed, falling back to fetch", (error as Error).message);
    }
  }
  try {
    return readHtml(await safeFetchText(url.toString()), url.toString(), "fetch");
  } catch (error) {
    return empty(url.toString(), "fetch", (error as Error).message);
  }
}

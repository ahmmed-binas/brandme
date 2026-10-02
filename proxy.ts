import { NextResponse, type NextRequest } from "next/server";

/**
 * Serves custom domains. A request for any host that isn't the app's own is
 * rewritten to /sites/<host>, which looks the domain up and renders that
 * person's published portfolio. Proxy stays fast: no database work here.
 *
 * The app's own hosts come from APP_HOSTS (comma-separated) or APP_URL.
 * Without either, custom-domain routing is off.
 *
 * Run the server with HOSTNAME unset or 0.0.0.0 (the Docker default). Binding to a
 * specific address such as 127.0.0.1 makes Next.js treat this rewrite as external.
 */
const configuredHosts = new Set(
  [...(process.env.APP_HOSTS ?? "").split(","), safeHost(process.env.APP_URL), safeHost(process.env.AUTH_URL)]
    .map((host) => host?.trim().toLowerCase())
    .filter((host): host is string => Boolean(host)),
);

function safeHost(url?: string) {
  try { return url ? new URL(url).hostname : undefined; } catch { return undefined; }
}

function isAppHost(host: string) {
  // Hosts without a dot ("localhost", or "app" when Caddy calls the app over the Docker
  // network) and raw IP addresses are always the app itself, never a customer domain.
  return configuredHosts.has(host) || configuredHosts.has(host.replace(/^www\./, "")) || !host.includes(".") || /^[\d.]+$/.test(host) || host.startsWith("[");
}

export function proxy(request: NextRequest) {
  // The Host header is what the visitor typed; nextUrl may reflect the server's own address.
  const host = (request.headers.get("host") ?? request.nextUrl.host).toLowerCase().replace(/:\d+$/, "");
  if (!configuredHosts.size || isAppHost(host)) return NextResponse.next();
  // Clone nextUrl rather than building from request.url: behind a TLS proxy the public
  // URL is https://<domain>, and a rewrite to a different origin is treated as external.
  const url = request.nextUrl.clone();
  // "/" is the portfolio, "/blog/…" its blog, plus its own sitemap and robots.txt. Anything else 404s.
  const path = request.nextUrl.pathname.replace(/\/+$/, "");
  url.pathname = `/sites/${encodeURIComponent(host)}${path}`;
  url.search = "";
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next.js internals and static files (anything with an extension) so templates' assets still load.
  // sitemap.xml and robots.txt are included so each custom domain gets its own.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)", "/sitemap.xml", "/robots.txt"],
};

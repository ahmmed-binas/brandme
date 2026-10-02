import { NextResponse, type NextRequest } from "next/server";

/**
 * Serves custom domains. A request for any host that isn't the app's own is
 * rewritten to /sites/<host>, which looks the domain up and renders that
 * person's published portfolio. Proxy stays fast: no database work here.
 *
 * The app's own hosts come from APP_HOSTS (comma-separated) or APP_URL.
 * Without either, custom-domain routing is off.
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
  return configuredHosts.has(host) || configuredHosts.has(host.replace(/^www\./, "")) || host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app");
}

export function proxy(request: NextRequest) {
  // The Host header is what the visitor typed; nextUrl may reflect the server's own address.
  const host = (request.headers.get("host") ?? request.nextUrl.host).toLowerCase().replace(/:\d+$/, "");
  if (!configuredHosts.size || isAppHost(host)) return NextResponse.next();
  return NextResponse.rewrite(new URL(`/sites/${encodeURIComponent(host)}`, request.url));
}

export const config = {
  // Skip Next.js internals and static files (anything with an extension) so templates' assets still load.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};

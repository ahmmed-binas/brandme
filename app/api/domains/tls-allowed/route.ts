import { isValidDomain, normaliseDomain } from "@/lib/domains/names";
import { tlsAllowed } from "@/lib/domains/service";
import { databaseConfigured } from "@/utils/db-schema";

export const dynamic = "force-dynamic";

/**
 * Caddy's on-demand TLS "ask" endpoint: GET ?domain=<host> answers 200 only for
 * verified, published custom domains, so certificates are never requested for
 * names that aren't ours to serve. Called by Caddy over the private network.
 */
export async function GET(request: Request) {
  const domain = normaliseDomain(new URL(request.url).searchParams.get("domain") ?? "");
  if (!databaseConfigured() || !isValidDomain(domain)) return new Response(null, { status: 404 });
  try {
    return new Response(null, { status: (await tlsAllowed(domain)) ? 200 : 404 });
  } catch (error) {
    console.error("[tls] check failed", domain, error);
    return new Response(null, { status: 503 });
  }
}

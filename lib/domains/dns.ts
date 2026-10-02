import { Resolver } from "node:dns/promises";
import { apexOf, isApex } from "./names";

/**
 * Checks a customer's DNS from this server's point of view.
 *
 * Public resolvers are used by default (not the server's local cache) so a
 * fix the customer just made is seen within the record's TTL. Override with
 * DNS_RESOLVERS="ip[:port],ip[:port]".
 */

export const serverDomainsConfigured = () => Boolean(process.env.SERVER_IPV4);

function resolver(): Resolver {
  const instance = new Resolver({ timeout: 4_000, tries: 2 });
  instance.setServers((process.env.DNS_RESOLVERS ?? "1.1.1.1,8.8.8.8").split(",").map((server) => server.trim()).filter(Boolean));
  return instance;
}

/** The host customers point subdomains at with a CNAME. Defaults to the app's own host. */
export function cnameTarget(): string {
  if (process.env.SITES_CNAME_TARGET) return process.env.SITES_CNAME_TARGET;
  try { return new URL(process.env.APP_URL ?? "").hostname; } catch { return ""; }
}

export const verificationHost = (domain: string) => `_formora.${apexOf(domain)}`;
export const verificationValue = (token: string) => `formora-verify=${token}`;

export interface DnsRecord { type: string; name: string; value: string; purpose: string }

/**
 * The records a customer adds at their DNS provider, with full host names.
 * (Providers that append the domain automatically need only the part before it.)
 */
export function recordsFor(domain: string, token: string | null): DnsRecord[] {
  const ip = process.env.SERVER_IPV4!;
  const host = apexOf(domain);
  const records: DnsRecord[] = [];
  if (token) records.push({ type: "TXT", name: verificationHost(host), value: verificationValue(token), purpose: "Proves you own the domain" });
  if (isApex(host)) {
    records.push({ type: "A", name: host, value: ip, purpose: "Points your domain at your portfolio (often written as @)" });
    records.push({ type: "A", name: `www.${host}`, value: ip, purpose: "Makes the www address work too" });
  } else {
    records.push({ type: "CNAME", name: host, value: cnameTarget(), purpose: "Points this address at your portfolio" });
  }
  return records;
}

const NOT_FOUND = new Set(["ENOTFOUND", "ENODATA", "ESERVFAIL", "ENONAME", "ETIMEOUT", "ECONNREFUSED"]);
const quietly = async <T,>(task: () => Promise<T>, fallback: T): Promise<T> => {
  try { return await task(); } catch (error) { if (NOT_FOUND.has((error as { code?: string }).code ?? "")) return fallback; throw error; }
};

export interface DnsCheck { ownershipVerified: boolean; pointsHere: boolean; foundAddresses: string[] }

/** Whether the TXT token is present and the domain resolves to this server (CNAME chains are followed). */
export async function checkDomain(domain: string, token: string | null): Promise<DnsCheck> {
  const dns = resolver();
  const [txt, addresses] = await Promise.all([
    token ? quietly(() => dns.resolveTxt(verificationHost(domain)), [] as string[][]) : Promise.resolve([] as string[][]),
    quietly(() => dns.resolve4(domain), [] as string[]),
  ]);
  return {
    ownershipVerified: !token || txt.some((chunks) => chunks.join("") === verificationValue(token)),
    pointsHere: addresses.includes(process.env.SERVER_IPV4!),
    foundAddresses: addresses,
  };
}

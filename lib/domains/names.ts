/**
 * Domain name rules shared by the browser and the server. No network access.
 */

const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;
const TLD = /^[a-z]{2,24}$/;

/** Lower-cases and strips protocol, path, port and a trailing dot: "https://Ada.dev/x" → "ada.dev". */
export function normaliseDomain(input: string): string {
  return input.trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/[/?#].*$/, "").replace(/:\d+$/, "").replace(/\.$/, "");
}

/** A registrable-looking hostname: at least two labels, letters-only TLD, no IP addresses. */
export function isValidDomain(domain: string): boolean {
  if (domain.length > 253) return false;
  const labels = domain.split(".");
  return labels.length >= 2 && labels.slice(0, -1).every((label) => LABEL.test(label)) && TLD.test(labels.at(-1)!);
}

/** The bare domain without "www.", which is how domains are stored. */
export const apexOf = (domain: string) => domain.replace(/^www\./, "");

/** Whether the domain is the root of a name ("ada.dev") rather than a subdomain ("me.ada.dev"). Assumes single-label TLDs. */
export const isApex = (domain: string) => apexOf(domain).split(".").length === 2;

/** The TLDs offered in suggestions, in order of how professional they read. */
export const SUGGESTED_TLDS = ["com", "dev", "me", "io", "co", "site"];

/** Domain ideas from a person's name: "Ada Lovelace" → adalovelace.com, ada-lovelace.dev, lovelace.dev … */
export function suggestDomains(name: string, query?: string): string[] {
  const cleanedQuery = query ? normaliseDomain(query) : "";
  if (cleanedQuery.includes(".") && isValidDomain(cleanedQuery)) {
    const [label] = cleanedQuery.split(".");
    return [...new Set([cleanedQuery, ...SUGGESTED_TLDS.map((tld) => `${label}.${tld}`)])].slice(0, 8);
  }
  const words = (cleanedQuery || name).normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (!words.length) return [];
  const joined = words.join("").slice(0, 40);
  const hyphenated = words.join("-").slice(0, 40);
  const candidates = [
    `${joined}.com`, `${joined}.dev`, `${joined}.me`,
    words.length > 1 ? `${hyphenated}.com` : `${joined}.io`,
    `${joined}.io`, `${joined}.co`,
    words.length > 1 ? `${words.at(-1)}.dev` : `${joined}.site`,
    `${joined}.site`,
  ];
  return [...new Set(candidates)].filter(isValidDomain).slice(0, 8);
}

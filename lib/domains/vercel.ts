/**
 * Vercel API client for domains: the registrar (search, price, buy) and
 * attaching domains to this project so Vercel serves them with HTTPS.
 *
 * Requires VERCEL_API_TOKEN and VERCEL_PROJECT_ID (and VERCEL_TEAM_ID when the
 * project belongs to a team). Responses are parsed defensively because only
 * the fields used here are relied on.
 */

const API = process.env.VERCEL_API_URL ?? "https://api.vercel.com";

export const vercelConfigured = () => Boolean(process.env.VERCEL_API_TOKEN && process.env.VERCEL_PROJECT_ID);

export class VercelError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) { super(message); }
}

async function vercel<T>(method: string, path: string, body?: unknown): Promise<T> {
  const url = new URL(`${API}${path}`);
  if (process.env.VERCEL_TEAM_ID) url.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);
  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = (data as { error?: { code?: string; message?: string } }).error;
    throw new VercelError(error?.message ?? `Vercel request failed (${response.status}).`, response.status, error?.code);
  }
  return data as T;
}

const project = () => encodeURIComponent(process.env.VERCEL_PROJECT_ID!);
const enc = encodeURIComponent;

// ---------------------------------------------------------------------------
// Registrar
// ---------------------------------------------------------------------------

/** Availability for several domains at once. Domains missing from the answer are treated as unavailable. */
export async function checkAvailability(domains: string[]): Promise<Map<string, boolean>> {
  const data = await vercel<unknown>("POST", "/v1/registrar/domains/availability", { domains });
  const entries = (Array.isArray(data) ? data : (data as { results?: unknown[]; domains?: unknown[] }).results ?? (data as { domains?: unknown[] }).domains ?? []) as Array<{ domain?: string; name?: string; available?: boolean }>;
  return new Map(entries.map((entry) => [String(entry.domain ?? entry.name ?? "").toLowerCase(), entry.available === true]));
}

export interface RegistrarPrice { years: number; purchasePrice: number; renewalPrice: number }

/** Price in USD for one year. Returns null when the TLD isn't sold. */
export async function getPrice(domain: string): Promise<RegistrarPrice | null> {
  try {
    const data = await vercel<Partial<RegistrarPrice>>("GET", `/v1/registrar/domains/${enc(domain)}/price?years=1`);
    const purchasePrice = Number(data.purchasePrice);
    if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) return null;
    return { years: Number(data.years) || 1, purchasePrice, renewalPrice: Number(data.renewalPrice) || purchasePrice };
  } catch (error) {
    if (error instanceof VercelError && error.status < 500) return null;
    throw error;
  }
}

/** ICANN registrant details. The customer is the legal owner of the domain, not Formora. */
export interface RegistrantContact {
  firstName: string; lastName: string; email: string; phone: string;
  address1: string; city: string; state: string; zip: string; country: string;
  companyName?: string;
}

/**
 * Buys a domain for one year. `expectedPrice` must equal the current registrar
 * price, so a price change between checkout and purchase fails instead of
 * silently costing more. Registration is asynchronous; poll getOrder.
 */
export async function buyDomain(domain: string, expectedPrice: number, contact: RegistrantContact): Promise<{ orderId: string }> {
  const data = await vercel<{ orderId?: string }>("POST", `/v1/registrar/domains/${enc(domain)}/buy`, {
    autoRenew: false, // Renewals are billed to the customer separately, so Formora never renews unpaid domains.
    years: 1,
    expectedPrice,
    contactInformation: contact,
  });
  if (!data.orderId) throw new VercelError("The registrar did not return an order.", 502);
  return { orderId: data.orderId };
}

export type OrderState = "pending" | "completed" | "failed";

export async function getOrder(orderId: string): Promise<{ state: OrderState; error?: string }> {
  const data = await vercel<{ status?: string; error?: unknown; domains?: Array<{ status?: string; error?: unknown }> }>("GET", `/v1/registrar/orders/${enc(orderId)}`);
  const statuses = [data.status, ...(data.domains ?? []).map((item) => item.status)].map((value) => String(value ?? "").toLowerCase());
  const errorText = [data.error, ...(data.domains ?? []).map((item) => item.error)].find(Boolean);
  if (statuses.some((value) => ["failed", "error", "canceled", "cancelled", "refunded"].includes(value))) return { state: "failed", error: errorText ? String(typeof errorText === "object" ? JSON.stringify(errorText) : errorText) : undefined };
  if (statuses.some((value) => ["completed", "complete", "succeeded", "success", "registered", "active"].includes(value))) return { state: "completed" };
  return { state: "pending" };
}

// ---------------------------------------------------------------------------
// Project domains
// ---------------------------------------------------------------------------

export interface VerificationRecord { type: string; domain: string; value: string; reason?: string }
export interface ProjectDomain { name: string; verified: boolean; verification: VerificationRecord[] }

const toProjectDomain = (data: Partial<ProjectDomain> & { name?: string }): ProjectDomain => ({ name: String(data.name ?? ""), verified: data.verified === true, verification: Array.isArray(data.verification) ? data.verification : [] });

/** Adds the domain to this project. Adding one that is already on this project is not an error. */
export async function addProjectDomain(domain: string): Promise<ProjectDomain> {
  try {
    return toProjectDomain(await vercel("POST", `/v10/projects/${project()}/domains`, { name: domain }));
  } catch (error) {
    if (error instanceof VercelError && error.status === 409) {
      const existing = await getProjectDomain(domain).catch(() => null);
      if (existing) return existing;
      throw new VercelError("This domain is already connected to another Vercel project. Remove it there first.", 409, error.code);
    }
    throw error;
  }
}

export async function getProjectDomain(domain: string): Promise<ProjectDomain> {
  return toProjectDomain(await vercel("GET", `/v9/projects/${project()}/domains/${enc(domain)}`));
}

export async function verifyProjectDomain(domain: string): Promise<ProjectDomain> {
  try {
    return toProjectDomain(await vercel("POST", `/v9/projects/${project()}/domains/${enc(domain)}/verify`));
  } catch (error) {
    // Not yet verifiable is a normal state while DNS propagates.
    if (error instanceof VercelError && error.status < 500) return getProjectDomain(domain);
    throw error;
  }
}

export async function removeProjectDomain(domain: string): Promise<void> {
  try {
    await vercel("DELETE", `/v9/projects/${project()}/domains/${enc(domain)}`);
  } catch (error) {
    if (!(error instanceof VercelError && error.status === 404)) throw error;
  }
}

/** Whether DNS for the domain points at Vercel. */
export async function isMisconfigured(domain: string): Promise<boolean> {
  const data = await vercel<{ misconfigured?: boolean }>("GET", `/v6/domains/${enc(domain)}/config`);
  return data.misconfigured !== false;
}

/** The DNS records a user adds at their registrar to point a domain at Vercel. */
export function dnsRecordsFor(domain: string, apex: boolean, verification: VerificationRecord[]) {
  const pointing = apex
    ? { type: "A", name: "@", value: "76.76.21.21" }
    : { type: "CNAME", name: domain.split(".").slice(0, -2).join("."), value: "cname.vercel-dns.com" };
  const ownership = verification.map((record) => ({ type: record.type, name: record.domain.replace(new RegExp(`\\.?${domain.replace(/\./g, "\\.")}$`), "") || "@", value: record.value }));
  return [pointing, ...ownership];
}

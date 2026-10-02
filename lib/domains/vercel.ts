/**
 * Vercel API client used only as a domain registrar: search, price, buy, and
 * set DNS records on bought domains. Portfolios are served by our own server,
 * not Vercel, so no Vercel project or hosting is involved.
 *
 * Requires VERCEL_API_TOKEN (and VERCEL_TEAM_ID when the token is for a team).
 * Responses are parsed defensively; only the fields used here are relied on.
 */

const API = process.env.VERCEL_API_URL ?? "https://api.vercel.com";

export const registrarConfigured = () => Boolean(process.env.VERCEL_API_TOKEN);

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
// DNS for bought domains (they use Vercel's nameservers)
// ---------------------------------------------------------------------------

/**
 * Points a bought domain (and its www) at our server. An existing identical
 * record is not an error, so this is safe to retry.
 */
export async function pointDomainAtServer(domain: string, ipv4: string): Promise<void> {
  for (const name of ["", "www"]) {
    try {
      await vercel("POST", `/v2/domains/${enc(domain)}/records`, { name, type: "A", value: ipv4, ttl: 60 });
    } catch (error) {
      if (!(error instanceof VercelError && error.status === 409)) throw error;
    }
  }
}

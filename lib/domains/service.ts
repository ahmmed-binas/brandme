import { cardFeeCents } from "@/lib/plans";
import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import type { CurrentUser } from "@/utils/user-account";
import type { TemplateId } from "@/lib/templates/types";
import { stripe } from "@/lib/payments/stripe";
import { randomBytes } from "node:crypto";
import { apexOf } from "./names";
import { checkDomain, recordsFor, type DnsRecord } from "./dns";
import * as vercel from "./vercel";
import { emails } from "@/lib/email/templates";
import { sendMail, sendOnce, supportInbox } from "@/lib/email/mailer";
import { getUserById } from "@/utils/user-account";

/**
 * Custom-domain business rules.
 *
 * - A portfolio (one owner + template) can have one custom domain.
 * - Bought domains: the customer pays first (Stripe). Only then does Formora
 *   buy the domain, with the customer as the legal registrant. If registration
 *   fails, the payment is refunded automatically.
 * - Buying or connecting a domain needs Pro. Domains already set up keep
 *   working if Pro ends, and can always be renewed: the customer owns them.
 * - A domain shows the portfolio only while the portfolio is published, and
 *   only after it is verified: it resolves to this server and, for connected
 *   domains, carries the owner's TXT token (so nobody can claim a domain they
 *   don't control). HTTPS certificates are issued by Caddy only for verified
 *   domains (see tlsAllowed).
 */

/**
 * Customer price for one year: the registrar's price plus Stripe's card fee, so
 * domains are sold at cost. DOMAIN_MARKUP_PERCENT and DOMAIN_SERVICE_FEE_CENTS
 * (both 0 unless set) can add a margin later.
 */
export function customerPriceCents(registrarPrice: number): number {
  const markup = Number(process.env.DOMAIN_MARKUP_PERCENT ?? 0) / 100;
  const fee = Number(process.env.DOMAIN_SERVICE_FEE_CENTS ?? 0);
  const before = Math.ceil(registrarPrice * 100 * (1 + markup) + fee);
  return before + cardFeeCents(before);
}

export type DomainStatus = "active" | "pending_dns" | "registering" | "failed";

export interface DomainView {
  domain: string;
  source: "connected" | "purchased";
  status: DomainStatus;
  /** DNS records to add at the registrar (connected domains that aren't live yet). */
  records: DnsRecord[];
  message?: string;
}

export interface OrderView { id: string; domain: string; status: string; chargedCents: number; error: string | null; createdAt: string }

interface DomainRow { domain: string; source: "connected" | "purchased"; verified_at: Date | null; verification_token: string }

async function domainRow(ownerId: string, templateId: TemplateId): Promise<DomainRow | null> {
  const result = await db.query<DomainRow>("SELECT domain, source, verified_at, verification_token FROM custom_domains WHERE owner_id = $1 AND template_id = $2", [ownerId, templateId]);
  return result.rows[0] ?? null;
}

export async function portfolioExists(ownerId: string, templateId: TemplateId): Promise<boolean> {
  await ensureSchema();
  return Boolean((await db.query("SELECT 1 FROM portfolios WHERE owner_id = $1 AND template_id = $2", [ownerId, templateId])).rowCount);
}

async function registrationPending(domain: string): Promise<boolean> {
  const result = await db.query("SELECT 1 FROM domain_orders WHERE domain = $1 AND status IN ('purchasing', 'registering')", [domain]);
  return Boolean(result.rowCount);
}

/**
 * Checks a domain's DNS and records when it first goes live. A verified domain
 * that later stops pointing here is shown as needing attention but keeps
 * serving, so a brief DNS hiccup doesn't take a portfolio offline.
 */
async function describeDomain(row: DomainRow): Promise<DomainView> {
  const base = { domain: row.domain, source: row.source };
  if (row.source === "purchased" && await registrationPending(row.domain)) return { ...base, status: "registering", records: [], message: "Your domain is being registered. This usually takes a few minutes." };
  const token = row.source === "connected" ? row.verification_token : null;
  const check = await checkDomain(row.domain, token);
  await db.query("UPDATE custom_domains SET checked_at = NOW() WHERE domain = $1", [row.domain]);
  if (check.ownershipVerified && check.pointsHere) {
    if (!row.verified_at) await db.query("UPDATE custom_domains SET verified_at = NOW() WHERE domain = $1", [row.domain]);
    return { ...base, status: "active", records: [], message: "HTTPS is set up automatically on the first visit." };
  }
  if (row.source === "purchased") return { ...base, status: "pending_dns", records: [], message: "Your domain is registered and its settings are spreading across the internet. This usually takes a few minutes, occasionally up to an hour." };
  const missing = [
    !check.ownershipVerified && "the TXT record",
    !check.pointsHere && (check.foundAddresses.length ? `the address record (it currently points to ${check.foundAddresses.join(", ")})` : "the address record"),
  ].filter(Boolean).join(" and ");
  return { ...base, status: "pending_dns", records: recordsFor(row.domain, token), message: `Waiting for ${missing}. Changes usually apply within an hour, sometimes up to 48 hours.` };
}

/** The portfolio's domain (with live status) and its recent purchase orders. Also advances any orders in progress. */
export async function domainOverview(user: CurrentUser, templateId: TemplateId): Promise<{ domain: DomainView | null; orders: OrderView[] }> {
  await ensureSchema();
  await advanceOrders(user.id);
  const row = await domainRow(user.id, templateId);
  const orders = await db.query<{ id: string; domain: string; status: string; charged_cents: number; error: string | null; created_at: Date }>(
    "SELECT id, domain, status, charged_cents, error, created_at FROM domain_orders WHERE owner_id = $1 AND template_id = $2 AND status <> 'awaiting_payment' ORDER BY created_at DESC LIMIT 5",
    [user.id, templateId],
  );
  return {
    domain: row ? await describeDomain(row) : null,
    orders: orders.rows.map((order) => ({ id: order.id, domain: order.domain, status: order.status, chargedCents: order.charged_cents, error: order.error, createdAt: order.created_at.toISOString() })),
  };
}

export class DomainError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function assertDomainFree(domain: string, ownerId: string, templateId: TemplateId) {
  const existing = await db.query<{ owner_id: string; template_id: string }>("SELECT owner_id, template_id FROM custom_domains WHERE domain = $1", [domain]);
  const row = existing.rows[0];
  if (row && (row.owner_id !== ownerId || row.template_id !== templateId)) throw new DomainError("That domain is already connected to another portfolio.", 409);
  const current = await domainRow(ownerId, templateId);
  if (current && current.domain !== domain) throw new DomainError(`This portfolio already uses ${current.domain}. Remove it first.`, 409);
}

/** Connects a domain the user already owns. */
export async function connectDomain(user: CurrentUser, templateId: TemplateId, domain: string): Promise<DomainView> {
  if (!user.plan.ownDomain) throw new DomainError("Your own domain comes with Pro.", 402);
  if (!(await portfolioExists(user.id, templateId))) throw new DomainError("Save your portfolio before adding a domain.", 404);
  await assertDomainFree(domain, user.id, templateId);
  await db.query(
    "INSERT INTO custom_domains (domain, owner_id, template_id, source, verification_token) VALUES ($1, $2, $3, 'connected', $4) ON CONFLICT (domain) DO NOTHING",
    [domain, user.id, templateId, randomBytes(12).toString("hex")],
  );
  return describeDomain((await domainRow(user.id, templateId))!);
}

/** Disconnects a domain. A bought domain stays registered to the customer; it simply stops showing the portfolio. */
export async function removeDomain(user: CurrentUser, templateId: TemplateId): Promise<void> {
  await ensureSchema();
  const row = await domainRow(user.id, templateId);
  if (!row) return;
  await db.query("DELETE FROM custom_domains WHERE domain = $1 AND owner_id = $2", [row.domain, user.id]);
}

// ---------------------------------------------------------------------------
// Buying
// ---------------------------------------------------------------------------

export interface DomainOffer { domain: string; available: boolean; priceCents: number | null; renewalCents: number | null }

/** Availability and customer prices for a list of candidate domains. */
export async function priceDomains(domains: string[]): Promise<DomainOffer[]> {
  const availability = await vercel.checkAvailability(domains);
  return Promise.all(domains.map(async (domain) => {
    if (!availability.get(domain)) return { domain, available: false, priceCents: null, renewalCents: null };
    const price = await vercel.getPrice(domain).catch(() => null);
    return price
      ? { domain, available: true, priceCents: customerPriceCents(price.purchasePrice), renewalCents: customerPriceCents(price.renewalPrice) }
      : { domain, available: false, priceCents: null, renewalCents: null };
  }));
}

/**
 * Starts a purchase: re-checks availability and price on the server (never
 * trusting a price from the browser), records the order, and returns a Stripe
 * Checkout URL.
 */
export async function startPurchase(user: CurrentUser, templateId: TemplateId, domain: string, contact: vercel.RegistrantContact, origin: string): Promise<string> {
  if (!user.plan.ownDomain) throw new DomainError("Your own domain comes with Pro.", 402);
  if (!(await portfolioExists(user.id, templateId))) throw new DomainError("Save your portfolio before buying a domain.", 404);
  await assertDomainFree(domain, user.id, templateId);
  const [offer] = await priceDomains([domain]);
  if (!offer.available || offer.priceCents === null) throw new DomainError("That domain isn’t available any more. Try another.", 409);
  const price = (await vercel.getPrice(domain))!;
  const order = await db.query<{ id: string }>(
    `INSERT INTO domain_orders (owner_id, template_id, domain, registrar_price, charged_cents, contact) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [user.id, templateId, domain, price.purchasePrice, offer.priceCents, JSON.stringify(contact)],
  );
  const orderId = order.rows[0].id;
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: contact.email,
    client_reference_id: orderId,
    metadata: { orderId, domain },
    line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: offer.priceCents, product_data: { name: `${domain} — 1 year`, description: "Domain registration at the registrar’s price plus the card fee, connected to your portfolio with HTTPS." } } }],
    success_url: `${origin}/editor/${templateId}?domainOrder=${orderId}`,
    cancel_url: `${origin}/editor/${templateId}?domainOrder=cancelled`,
  });
  await db.query("UPDATE domain_orders SET stripe_session_id = $2, updated_at = NOW() WHERE id = $1", [orderId, session.id]);
  if (!session.url) throw new DomainError("Payment could not be started.", 502);
  return session.url;
}

async function refund(orderId: string, paymentIntent: string | null, reason: string) {
  if (paymentIntent) {
    try { await stripe().refunds.create({ payment_intent: paymentIntent }); }
    catch (error) {
      console.error("Domain refund failed — refund manually", orderId, error);
      await db.query("UPDATE domain_orders SET status = 'refund_failed', error = $2, contact = NULL, updated_at = NOW() WHERE id = $1", [orderId, reason]);
      return;
    }
  }
  await db.query("UPDATE domain_orders SET status = 'refunded', error = $2, contact = NULL, updated_at = NOW() WHERE id = $1", [orderId, reason]);
}

/**
 * Called by the Stripe webhook once payment succeeds. Idempotent: Stripe may
 * deliver the same event more than once, but only one delivery moves the order
 * out of 'awaiting_payment', so the domain is bought at most once.
 */
export async function fulfilPaidOrder(orderId: string, paymentIntent: string | null): Promise<void> {
  await ensureSchema();
  const claimed = await db.query<{ owner_id: string; template_id: TemplateId; domain: string; registrar_price: string; contact: vercel.RegistrantContact; renewal_of: string | null }>(
    `UPDATE domain_orders SET status = 'purchasing', stripe_payment_intent = $2, updated_at = NOW()
     WHERE id = $1 AND status = 'awaiting_payment' RETURNING owner_id, template_id, domain, registrar_price, contact, renewal_of`,
    [orderId, paymentIntent],
  );
  const order = claimed.rows[0];
  if (!order) return;
  if (order.renewal_of) return fulfilRenewal(orderId, order.renewal_of, order.domain, Number(order.registrar_price));
  // Reserve the domain for this portfolio before spending money on it.
  const reserved = await db.query(
    "INSERT INTO custom_domains (domain, owner_id, template_id, source, verification_token) VALUES ($1, $2, $3, 'purchased', $4) ON CONFLICT DO NOTHING",
    [order.domain, order.owner_id, order.template_id, randomBytes(12).toString("hex")],
  );
  if (!reserved.rowCount) {
    await refund(orderId, paymentIntent, `${order.domain} is already connected to a portfolio, so your payment has been refunded.`);
    return;
  }
  try {
    const current = await vercel.getPrice(order.domain);
    if (!current || current.purchasePrice > Number(order.registrar_price)) throw new Error("The registrar price changed after checkout.");
    const { orderId: registrarOrderId } = await vercel.buyDomain(order.domain, current.purchasePrice, order.contact);
    // Registrant details are only needed for the purchase call; don't keep them.
    await db.query("UPDATE domain_orders SET status = 'registering', registrar_order_id = $2, contact = NULL, updated_at = NOW() WHERE id = $1", [orderId, registrarOrderId]);
  } catch (error) {
    console.error("Domain purchase failed", orderId, error);
    await db.query("DELETE FROM custom_domains WHERE domain = $1 AND owner_id = $2 AND source = 'purchased'", [order.domain, order.owner_id]);
    await refund(orderId, paymentIntent, `We couldn’t register ${order.domain}, so your payment has been refunded. ${(error as Error).message}`);
    return;
  }
  await advanceOrders(order.owner_id);
}

/** Moves registering orders forward: attach finished registrations, refund failed ones. */
export async function advanceOrders(ownerId: string): Promise<void> {
  const pending = await db.query<{ id: string; domain: string; registrar_order_id: string; stripe_payment_intent: string | null }>(
    "SELECT id, domain, registrar_order_id, stripe_payment_intent FROM domain_orders WHERE owner_id = $1 AND status = 'registering'",
    [ownerId],
  );
  for (const order of pending.rows) {
    const state = await vercel.getOrder(order.registrar_order_id).catch(() => ({ state: "pending" as const, error: undefined }));
    if (state.state === "completed") {
      try {
        await vercel.pointDomainAtServer(order.domain, process.env.SERVER_IPV4!);
        await db.query("UPDATE domain_orders SET status = 'completed', expires_at = COALESCE(expires_at, NOW() + INTERVAL '1 year'), updated_at = NOW() WHERE id = $1", [order.id]);
      } catch (error) {
        console.error("Pointing purchased domain at the server failed; will retry", order.domain, error);
      }
    } else if (state.state === "failed") {
      await db.query("DELETE FROM custom_domains WHERE domain = $1 AND owner_id = $2 AND source = 'purchased'", [order.domain, ownerId]);
      await refund(order.id, order.stripe_payment_intent, `Registration of ${order.domain} failed, so your payment has been refunded.${state.error ? ` (${state.error})` : ""}`);
    }
  }
}

/** Finds the portfolio behind a verified custom domain ("www." is accepted). */
export async function portfolioForHost(host: string): Promise<{ ownerId: string; templateId: TemplateId } | null> {
  await ensureSchema();
  const result = await db.query<{ owner_id: string; template_id: TemplateId }>(
    "SELECT owner_id, template_id FROM custom_domains WHERE (domain = $1 OR domain = $2) AND verified_at IS NOT NULL LIMIT 1",
    [host, apexOf(host)],
  );
  const row = result.rows[0];
  return row ? { ownerId: row.owner_id, templateId: row.template_id } : null;
}

/**
 * Whether Caddy may request an HTTPS certificate for this host: only verified
 * domains whose portfolio is published. Anything else is refused, so strangers
 * can't make the server request certificates for arbitrary names.
 */
export async function tlsAllowed(host: string): Promise<boolean> {
  await ensureSchema();
  const result = await db.query(
    `SELECT 1 FROM custom_domains d JOIN portfolios p ON p.owner_id = d.owner_id AND p.template_id = d.template_id
     WHERE (d.domain = $1 OR d.domain = $2) AND d.verified_at IS NOT NULL AND p.published_at IS NOT NULL LIMIT 1`,
    [host, apexOf(host)],
  );
  return Boolean(result.rowCount);
}

// ---------------------------------------------------------------------------
// Renewals. Bought domains are registered for a year with auto-renew off, so
// nobody is charged without agreeing. From 30 days before expiry the owner is
// reminded (cron) and renews from /account/domains; payment then renews the
// domain at the registrar. If the registrar refuses, the payment is kept and
// the site owner is emailed to renew by hand, so the customer never loses the
// domain over an API problem.
// ---------------------------------------------------------------------------

export interface OwnedDomain { orderId: string; domain: string; expiresAt: string; daysLeft: number; renewalCents: number | null; renewing: boolean; manual: boolean }

/** The latest completed registration per bought domain, with its expiry and renewal price. */
async function latestRegistrations(where: string, params: unknown[]) {
  return (await db.query<{ id: string; owner_id: string; domain: string; expires_at: Date; reminded_at: Date | null }>(
    `SELECT DISTINCT ON (domain) id, owner_id, domain, expires_at, reminded_at FROM domain_orders
     WHERE status = 'completed' AND expires_at IS NOT NULL AND ${where} ORDER BY domain, expires_at DESC`,
    params,
  )).rows;
}

async function renewalInProgress(domain: string): Promise<{ renewing: boolean; manual: boolean }> {
  const row = (await db.query<{ status: string }>("SELECT status FROM domain_orders WHERE domain = $1 AND renewal_of IS NOT NULL AND status IN ('purchasing', 'renewal_manual') ORDER BY created_at DESC LIMIT 1", [domain])).rows[0];
  return { renewing: row?.status === "purchasing", manual: row?.status === "renewal_manual" };
}

async function renewalPrice(domain: string): Promise<number | null> {
  const price = await vercel.getPrice(domain).catch(() => null);
  return price ? price.renewalPrice : null;
}

export async function ownedDomains(user: CurrentUser): Promise<OwnedDomain[]> {
  await ensureSchema();
  const rows = await latestRegistrations("owner_id = $1", [user.id]);
  return Promise.all(rows.map(async (row) => {
    const registrar = vercel.registrarConfigured() ? await renewalPrice(row.domain) : null;
    return {
      orderId: row.id, domain: row.domain, expiresAt: row.expires_at.toISOString(), daysLeft: Math.ceil((row.expires_at.getTime() - Date.now()) / 86_400_000),
      renewalCents: registrar === null ? null : customerPriceCents(registrar),
      ...(await renewalInProgress(row.domain)),
    };
  }));
}

/** Starts a renewal for one of the owner's domains. Returns a Stripe Checkout URL. */
export async function startRenewal(user: CurrentUser, orderId: string, origin: string): Promise<string> {
  await ensureSchema();
  const [current] = await latestRegistrations("owner_id = $1 AND id = $2", [user.id, orderId]);
  if (!current) throw new DomainError("We couldn’t find that domain on your account.", 404);
  if ((await renewalInProgress(current.domain)).renewing) throw new DomainError("This domain is already being renewed.", 409);
  if (current.expires_at.getTime() - Date.now() > 90 * 86_400_000) throw new DomainError("You can renew from 90 days before the domain expires.", 409);
  const registrar = await renewalPrice(current.domain);
  if (registrar === null) throw new DomainError("We couldn’t get a renewal price for this domain. Please try again shortly.", 502);
  const cents = customerPriceCents(registrar);
  const order = await db.query<{ id: string }>(
    `INSERT INTO domain_orders (owner_id, template_id, domain, registrar_price, charged_cents, renewal_of)
     SELECT owner_id, template_id, domain, $2, $3, id FROM domain_orders WHERE id = $1 RETURNING id`,
    [current.id, registrar, cents],
  );
  const renewalId = order.rows[0]!.id;
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: user.email ?? undefined,
    client_reference_id: renewalId,
    metadata: { orderId: renewalId, domain: current.domain, renewal: "1" },
    line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: cents, product_data: { name: `${current.domain} — renewal, 1 year`, description: "Keeps your domain registered and connected to your portfolio." } } }],
    success_url: `${origin}/account/domains?renewed=${renewalId}`,
    cancel_url: `${origin}/account/domains`,
  });
  await db.query("UPDATE domain_orders SET stripe_session_id = $2, updated_at = NOW() WHERE id = $1", [renewalId, session.id]);
  if (!session.url) throw new DomainError("Payment could not be started.", 502);
  return session.url;
}

async function fulfilRenewal(orderId: string, previousId: string, domain: string, registrarPrice: number): Promise<void> {
  const previous = (await db.query<{ expires_at: Date; owner_id: string }>("SELECT expires_at, owner_id FROM domain_orders WHERE id = $1", [previousId])).rows[0];
  const from = previous && previous.expires_at > new Date() ? previous.expires_at : new Date();
  const expires = new Date(from.getTime() + 365 * 86_400_000);
  try {
    const current = await vercel.getPrice(domain);
    await vercel.renewDomain(domain, current?.renewalPrice ?? registrarPrice);
    await db.query("UPDATE domain_orders SET status = 'completed', expires_at = $2, updated_at = NOW() WHERE id = $1", [orderId, expires]);
    const owner = previous ? await db.query<{ email: string | null; name: string | null }>("SELECT email, name FROM app_users WHERE id = $1", [previous.owner_id]) : null;
    const person = owner?.rows[0];
    if (person?.email) await sendOnce(`domain-renewed:${orderId}`, previous!.owner_id, "domain-renewed", { to: person.email, ...emails.domainRenewed(person.name, domain, expires) }).catch(() => undefined);
  } catch (error) {
    console.error("Domain renewal at the registrar failed; renew it by hand", domain, error);
    await db.query("UPDATE domain_orders SET status = 'renewal_manual', error = $2, updated_at = NOW() WHERE id = $1", [orderId, (error as Error).message.slice(0, 500)]);
    const inbox = supportInbox();
    if (inbox) await sendMail({ to: inbox, subject: `Renew ${domain} by hand`, text: `A customer paid to renew ${domain} (order ${orderId}), but the registrar refused the renewal: ${(error as Error).message}\n\nRenew it for one year in your Vercel dashboard (Domains), then run in the database:\nUPDATE domain_orders SET status = 'completed', expires_at = '${expires.toISOString()}' WHERE id = '${orderId}';` }).catch(() => undefined);
  }
}

/** Cron: reminds owners from 30 days before expiry, at most once a week, until they renew. */
export async function remindRenewals(): Promise<number> {
  if (!vercel.registrarConfigured()) return 0;
  const due = await latestRegistrations("expires_at < NOW() + INTERVAL '30 days' AND expires_at > NOW() - INTERVAL '30 days' AND (reminded_at IS NULL OR reminded_at < NOW() - INTERVAL '7 days')", []);
  let sent = 0;
  for (const row of due) {
    const state = await renewalInProgress(row.domain);
    if (state.renewing || state.manual) continue;
    const user = await getUserById(row.owner_id);
    if (!user?.email) continue;
    const registrar = await renewalPrice(row.domain);
    if (registrar === null) continue;
    const week = new Date().toISOString().slice(0, 10);
    if (await sendOnce(`domain-renewal:${row.id}:${week}`, user.id, "domain-renewal", { to: user.email, ...emails.domainRenewalDue(user.name, row.domain, row.expires_at, `$${(customerPriceCents(registrar) / 100).toFixed(2)}`) })) sent += 1;
    await db.query("UPDATE domain_orders SET reminded_at = NOW() WHERE id = $1", [row.id]);
  }
  return sent;
}

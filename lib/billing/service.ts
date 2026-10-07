import type Stripe from "stripe";
import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import { stripe } from "@/lib/payments/stripe";
import { INTERVAL_LABEL, PLANS, cardFeeCents, formatUsd, isInterval, isPaidPlan, priceFor, type BillingInterval } from "@/lib/plans";
import { creditPack, grantCredits } from "./credits";
import { emails } from "@/lib/email/templates";
import { sendOnce } from "@/lib/email/mailer";
import type { CurrentUser } from "@/utils/user-account";

/**
 * Selling plans and credits through Stripe Checkout (one-off payments).
 *
 * Pro is paid for a year or a month at a time. The card is saved for renewal,
 * and a scheduled job renews for one more period shortly before expiry (owners
 * can switch that off). Paying again while Pro is still running adds the new
 * period on top, so nobody pays twice. Credits are sold at cost, with Stripe's
 * card fee shown as its own line.
 */

export class BillingError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

const DAY = 86_400_000;

async function customerFor(user: CurrentUser): Promise<string> {
  const row = await db.query<{ stripe_customer_id: string | null }>("SELECT stripe_customer_id FROM app_users WHERE id = $1", [user.id]);
  const existing = row.rows[0]?.stripe_customer_id;
  if (existing) return existing;
  const customer = await stripe().customers.create({ email: user.email ?? undefined, name: user.name ?? undefined, metadata: { userId: user.id } });
  await db.query("UPDATE app_users SET stripe_customer_id = $2 WHERE id = $1 AND stripe_customer_id IS NULL", [user.id, customer.id]);
  return (await db.query<{ stripe_customer_id: string }>("SELECT stripe_customer_id FROM app_users WHERE id = $1", [user.id])).rows[0]!.stripe_customer_id;
}

export async function startPlanCheckout(user: CurrentUser, plan: unknown, interval: unknown, origin: string): Promise<string> {
  await ensureSchema();
  if (!isPaidPlan(plan)) throw new BillingError("Choose Pro.", 422);
  if (!isInterval(interval)) throw new BillingError("Choose to pay monthly or yearly.", 422);
  const amount = priceFor(plan, interval);
  const months = interval === "year" ? 12 : 1;
  const order = await db.query<{ id: string }>("INSERT INTO billing_orders (owner_id, kind, plan, term_months, amount_cents) VALUES ($1, 'plan', $2, $3, $4) RETURNING id", [user.id, plan, months, amount]);
  const orderId = order.rows[0]!.id;
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer: await customerFor(user),
    client_reference_id: orderId,
    metadata: { billingOrderId: orderId, kind: "plan" },
    // Keeps the card on file so the plan can renew without the owner coming back.
    payment_intent_data: { setup_future_usage: "off_session", metadata: { billingOrderId: orderId } },
    line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: amount, product_data: { name: `${PLANS[plan].name} plan, 1 ${INTERVAL_LABEL[interval]}`, description: `${PLANS[plan].summary} Renews each ${INTERVAL_LABEL[interval]} until you switch it off. Refundable within 14 days, minus Stripe’s card fee.` } } }],
    success_url: `${origin}/account?paid=plan`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
  });
  await db.query("UPDATE billing_orders SET stripe_session_id = $2 WHERE id = $1", [orderId, session.id]);
  if (!session.url) throw new BillingError("Payment could not be started. Please try again.", 502);
  return session.url;
}

export async function startCreditsCheckout(user: CurrentUser, packId: unknown, origin: string): Promise<string> {
  await ensureSchema();
  const pack = creditPack(packId);
  if (!pack) throw new BillingError("Choose a credit pack.", 422);
  const fee = cardFeeCents(pack.cents);
  const order = await db.query<{ id: string }>("INSERT INTO billing_orders (owner_id, kind, credits, amount_cents) VALUES ($1, 'credits', $2, $3) RETURNING id", [user.id, pack.credits, pack.cents + fee]);
  const orderId = order.rows[0]!.id;
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer: await customerFor(user),
    client_reference_id: orderId,
    metadata: { billingOrderId: orderId, kind: "credits" },
    line_items: [
      { quantity: 1, price_data: { currency: "usd", unit_amount: pack.cents, product_data: { name: `${pack.label} for the AI assistant`, description: "Sold at what the AI costs us plus 5%. Credits never expire. Unused credits can be refunded, minus Stripe’s card fee." } } },
      { quantity: 1, price_data: { currency: "usd", unit_amount: fee, product_data: { name: "Card fee", description: "Stripe’s fee for taking the payment, passed on at cost." } } },
    ],
    success_url: `${origin}/account?paid=credits#ai`,
    cancel_url: `${origin}/account?checkout=cancelled#ai`,
  });
  await db.query("UPDATE billing_orders SET stripe_session_id = $2 WHERE id = $1", [orderId, session.id]);
  if (!session.url) throw new BillingError("Payment could not be started. Please try again.", 502);
  return session.url;
}

/** When a new period ends: it starts today, or when the current Pro period ends if that is later. */
export function newExpiry(current: { plan: string; plan_expires_at: Date | null }, months: number, now = new Date()): Date {
  const start = isPaidPlan(current.plan) && current.plan_expires_at && current.plan_expires_at.getTime() > now.getTime() ? current.plan_expires_at.getTime() : now.getTime();
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + months);
  return end;
}

const termLabel = (months: number) => (months === 12 ? "1 year" : months === 1 ? "1 month" : `${months} months`);

/** Applies a paid order exactly once (the webhook can arrive more than once). */
export async function fulfilBillingOrder(orderId: string, paymentIntent: string | null): Promise<void> {
  await ensureSchema();
  const claimed = await db.query<{ owner_id: string; kind: string; plan: string | null; term_months: number | null; credits: number | null; amount_cents: number }>(
    "UPDATE billing_orders SET status = 'paid', paid_at = NOW(), stripe_payment_intent = $2 WHERE id = $1 AND status = 'awaiting_payment' RETURNING owner_id, kind, plan, term_months, credits, amount_cents",
    [orderId, paymentIntent],
  );
  const order = claimed.rows[0];
  if (!order) return;
  const user = (await db.query<{ name: string | null; email: string | null; plan: string; plan_expires_at: Date | null }>("SELECT name, email, plan, plan_expires_at FROM app_users WHERE id = $1", [order.owner_id])).rows[0];
  if (!user) return;

  if (order.kind === "plan" && isPaidPlan(order.plan) && order.term_months) {
    const until = newExpiry(user, order.term_months);
    const interval: BillingInterval = order.term_months === 1 ? "month" : "year";
    let paymentMethod: string | null = null;
    if (paymentIntent) {
      try { const intent = await stripe().paymentIntents.retrieve(paymentIntent); paymentMethod = typeof intent.payment_method === "string" ? intent.payment_method : intent.payment_method?.id ?? null; }
      catch (error) { console.error("Could not read payment method for renewal", error); }
    }
    await db.query("UPDATE app_users SET plan = $2, plan_expires_at = $3, plan_interval = $5, auto_renew = TRUE, stripe_payment_method = COALESCE($4, stripe_payment_method) WHERE id = $1", [order.owner_id, order.plan, until, paymentMethod, interval]);
    if (user.email) await sendOnce(`receipt:${orderId}`, order.owner_id, "receipt", { to: user.email, ...emails.receipt(user.name, `${PLANS[order.plan].name} plan, ${termLabel(order.term_months)}`, formatUsd(order.amount_cents), until) });
  }
  if (order.kind === "credits" && order.credits) {
    await grantCredits(order.owner_id, order.credits, "Credits purchased", `order:${orderId}`);
    if (user.email) await sendOnce(`receipt:${orderId}`, order.owner_id, "receipt", { to: user.email, ...emails.receipt(user.name, `${order.credits.toLocaleString("en")} AI credits`, formatUsd(order.amount_cents)) });
  }
}

/** Charges the saved card for one more period (a year or a month). Called by the scheduled job shortly before expiry. */
export async function renewPlan(ownerId: string): Promise<"renewed" | "failed" | "skipped"> {
  const row = (await db.query<{ plan: string; plan_interval: string; plan_expires_at: Date | null; auto_renew: boolean; stripe_customer_id: string | null; stripe_payment_method: string | null; name: string | null; email: string | null }>(
    "SELECT plan, plan_interval, plan_expires_at, auto_renew, stripe_customer_id, stripe_payment_method, name, email FROM app_users WHERE id = $1", [ownerId])).rows[0];
  if (!row || !isPaidPlan(row.plan) || !row.auto_renew || !row.stripe_customer_id || !row.stripe_payment_method || !row.plan_expires_at) return "skipped";
  const interval: BillingInterval = row.plan_interval === "month" ? "month" : "year";
  const months = interval === "year" ? 12 : 1;
  const amount = priceFor(row.plan, interval);
  const expiryKey = row.plan_expires_at.toISOString().slice(0, 10);
  // For renewals stripe_session_id holds a per-period key, so one expiry date can only be renewed once.
  const order = await db.query<{ id: string }>(
    `INSERT INTO billing_orders (owner_id, kind, plan, term_months, amount_cents, stripe_session_id) VALUES ($1, 'renewal', $2, $5, $3, $4)
     ON CONFLICT (stripe_session_id) DO NOTHING RETURNING id`,
    [ownerId, row.plan, amount, `renewal:${ownerId}:${expiryKey}`, months],
  );
  if (!order.rowCount) return "skipped";
  const orderId = order.rows[0]!.id;
  let intent: Stripe.PaymentIntent;
  try {
    intent = await stripe().paymentIntents.create({ amount, currency: "usd", customer: row.stripe_customer_id, payment_method: row.stripe_payment_method, off_session: true, confirm: true,
      description: `${PLANS[row.plan].name} plan renewal, ${termLabel(months)}`, metadata: { billingOrderId: orderId } }, { idempotencyKey: `renewal:${ownerId}:${expiryKey}` });
  } catch (error) {
    await db.query("UPDATE billing_orders SET status = 'failed', error = $2 WHERE id = $1", [orderId, (error as Error).message.slice(0, 500)]);
    if (row.email) await sendOnce(`renewal-failed:${ownerId}:${expiryKey}`, ownerId, "renewal-failed", { to: row.email, ...emails.renewalFailed(row.name, PLANS[row.plan].name) });
    return "failed";
  }
  if (intent.status !== "succeeded") {
    await db.query("UPDATE billing_orders SET status = 'failed', error = $2 WHERE id = $1", [orderId, `Payment ${intent.status}`]);
    return "failed";
  }
  const until = new Date(row.plan_expires_at);
  until.setUTCMonth(until.getUTCMonth() + months);
  await db.query("UPDATE billing_orders SET status = 'paid', paid_at = NOW(), stripe_payment_intent = $2 WHERE id = $1", [orderId, intent.id]);
  await db.query("UPDATE app_users SET plan_expires_at = $2 WHERE id = $1", [ownerId, until]);
  if (row.email) await sendOnce(`receipt:${orderId}`, ownerId, "receipt", { to: row.email, ...emails.receipt(row.name, `${PLANS[row.plan].name} plan renewal`, formatUsd(amount), until) });
  return "renewed";
}

export const daysUntil = (date: Date, now = new Date()) => Math.ceil((date.getTime() - now.getTime()) / DAY);

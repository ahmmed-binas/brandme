import type Stripe from "stripe";
import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import { stripe } from "@/lib/payments/stripe";
import { PLANS, formatUsd, isPaidPlan, priceFor, type PaidPlanId } from "@/lib/plans";
import { creditPack, grantCredits } from "./credits";
import { emails } from "@/lib/email/templates";
import { sendOnce } from "@/lib/email/mailer";
import type { CurrentUser } from "@/utils/user-account";

/**
 * Selling plans and credits through Stripe Checkout (one-off payments).
 *
 * Plans are prepaid for 1–5 years. The card is saved for renewal, and a
 * scheduled job renews for one more year shortly before expiry (owners can
 * switch that off). Switching plan mid-term converts the unused time on the
 * old plan into time on the new one, so nobody pays twice.
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

export async function startPlanCheckout(user: CurrentUser, plan: unknown, years: unknown, origin: string): Promise<string> {
  await ensureSchema();
  if (!isPaidPlan(plan)) throw new BillingError("Choose Basic, Pro or Premium.", 422);
  const term = Number(years);
  if (!PLANS[plan].terms.includes(term)) throw new BillingError(`The ${PLANS[plan].name} plan can be paid for ${PLANS[plan].terms.join(", ")} year${PLANS[plan].terms.length > 1 ? "s" : ""} at a time.`, 422);
  const amount = priceFor(plan, term);
  const order = await db.query<{ id: string }>("INSERT INTO billing_orders (owner_id, kind, plan, term_years, amount_cents) VALUES ($1, 'plan', $2, $3, $4) RETURNING id", [user.id, plan, term, amount]);
  const orderId = order.rows[0]!.id;
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer: await customerFor(user),
    client_reference_id: orderId,
    metadata: { billingOrderId: orderId, kind: "plan" },
    // Keeps the card on file so the plan can renew without the owner coming back.
    payment_intent_data: { setup_future_usage: "off_session", metadata: { billingOrderId: orderId } },
    line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: amount, product_data: { name: `${PLANS[plan].name} plan, ${term} year${term > 1 ? "s" : ""}`, description: PLANS[plan].summary } } }],
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
  const order = await db.query<{ id: string }>("INSERT INTO billing_orders (owner_id, kind, credits, amount_cents) VALUES ($1, 'credits', $2, $3) RETURNING id", [user.id, pack.credits, pack.cents]);
  const orderId = order.rows[0]!.id;
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer: await customerFor(user),
    client_reference_id: orderId,
    metadata: { billingOrderId: orderId, kind: "credits" },
    line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: pack.cents, product_data: { name: `${pack.label} for the AI assistant`, description: "Credits never expire. Used for AI writing help, imports and career research." } } }],
    success_url: `${origin}/account?paid=credits#ai`,
    cancel_url: `${origin}/account?checkout=cancelled#ai`,
  });
  await db.query("UPDATE billing_orders SET stripe_session_id = $2 WHERE id = $1", [orderId, session.id]);
  if (!session.url) throw new BillingError("Payment could not be started. Please try again.", 502);
  return session.url;
}

/** When a new plan starts: today, plus any unused value of the current plan converted at the new plan's rate. */
export function newExpiry(current: { plan: string; plan_expires_at: Date | null }, plan: PaidPlanId, years: number, now = new Date()): Date {
  let start = now.getTime();
  if (isPaidPlan(current.plan) && current.plan_expires_at && current.plan_expires_at.getTime() > start) {
    const remaining = current.plan_expires_at.getTime() - start;
    start += current.plan === plan ? remaining : Math.round((remaining * PLANS[current.plan].yearlyCents) / PLANS[plan].yearlyCents);
  }
  const end = new Date(start);
  end.setUTCFullYear(end.getUTCFullYear() + years);
  return end;
}

/** Applies a paid order exactly once (the webhook can arrive more than once). */
export async function fulfilBillingOrder(orderId: string, paymentIntent: string | null): Promise<void> {
  await ensureSchema();
  const claimed = await db.query<{ owner_id: string; kind: string; plan: string | null; term_years: number | null; credits: number | null; amount_cents: number }>(
    "UPDATE billing_orders SET status = 'paid', paid_at = NOW(), stripe_payment_intent = $2 WHERE id = $1 AND status = 'awaiting_payment' RETURNING owner_id, kind, plan, term_years, credits, amount_cents",
    [orderId, paymentIntent],
  );
  const order = claimed.rows[0];
  if (!order) return;
  const user = (await db.query<{ name: string | null; email: string | null; plan: string; plan_expires_at: Date | null }>("SELECT name, email, plan, plan_expires_at FROM app_users WHERE id = $1", [order.owner_id])).rows[0];
  if (!user) return;

  if (order.kind === "plan" && isPaidPlan(order.plan) && order.term_years) {
    const until = newExpiry(user, order.plan, order.term_years);
    let paymentMethod: string | null = null;
    if (paymentIntent) {
      try { const intent = await stripe().paymentIntents.retrieve(paymentIntent); paymentMethod = typeof intent.payment_method === "string" ? intent.payment_method : intent.payment_method?.id ?? null; }
      catch (error) { console.error("Could not read payment method for renewal", error); }
    }
    await db.query("UPDATE app_users SET plan = $2, plan_expires_at = $3, auto_renew = TRUE, stripe_payment_method = COALESCE($4, stripe_payment_method) WHERE id = $1", [order.owner_id, order.plan, until, paymentMethod]);
    if (user.email) await sendOnce(`receipt:${orderId}`, order.owner_id, "receipt", { to: user.email, ...emails.receipt(user.name, `${PLANS[order.plan].name} plan, ${order.term_years} year${order.term_years > 1 ? "s" : ""}`, formatUsd(order.amount_cents), until) });
  }
  if (order.kind === "credits" && order.credits) {
    await grantCredits(order.owner_id, order.credits, "Credits purchased", `order:${orderId}`);
    if (user.email) await sendOnce(`receipt:${orderId}`, order.owner_id, "receipt", { to: user.email, ...emails.receipt(user.name, `${order.credits.toLocaleString("en")} AI credits`, formatUsd(order.amount_cents)) });
  }
}

/** Charges the saved card for one more year. Called by the scheduled job a few days before expiry. */
export async function renewPlan(ownerId: string): Promise<"renewed" | "failed" | "skipped"> {
  const row = (await db.query<{ plan: string; plan_expires_at: Date | null; auto_renew: boolean; stripe_customer_id: string | null; stripe_payment_method: string | null; name: string | null; email: string | null }>(
    "SELECT plan, plan_expires_at, auto_renew, stripe_customer_id, stripe_payment_method, name, email FROM app_users WHERE id = $1", [ownerId])).rows[0];
  if (!row || !isPaidPlan(row.plan) || !row.auto_renew || !row.stripe_customer_id || !row.stripe_payment_method || !row.plan_expires_at) return "skipped";
  const amount = PLANS[row.plan].yearlyCents;
  const expiryKey = row.plan_expires_at.toISOString().slice(0, 10);
  // For renewals stripe_session_id holds a per-period key, so one expiry date can only be renewed once.
  const order = await db.query<{ id: string }>(
    `INSERT INTO billing_orders (owner_id, kind, plan, term_years, amount_cents, stripe_session_id) VALUES ($1, 'renewal', $2, 1, $3, $4)
     ON CONFLICT (stripe_session_id) DO NOTHING RETURNING id`,
    [ownerId, row.plan, amount, `renewal:${ownerId}:${expiryKey}`],
  );
  if (!order.rowCount) return "skipped";
  const orderId = order.rows[0]!.id;
  let intent: Stripe.PaymentIntent;
  try {
    intent = await stripe().paymentIntents.create({ amount, currency: "usd", customer: row.stripe_customer_id, payment_method: row.stripe_payment_method, off_session: true, confirm: true,
      description: `${PLANS[row.plan].name} plan renewal, 1 year`, metadata: { billingOrderId: orderId } }, { idempotencyKey: `renewal:${ownerId}:${expiryKey}` });
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
  until.setUTCFullYear(until.getUTCFullYear() + 1);
  await db.query("UPDATE billing_orders SET status = 'paid', paid_at = NOW(), stripe_payment_intent = $2 WHERE id = $1", [orderId, intent.id]);
  await db.query("UPDATE app_users SET plan_expires_at = $2 WHERE id = $1", [ownerId, until]);
  if (row.email) await sendOnce(`receipt:${orderId}`, ownerId, "receipt", { to: row.email, ...emails.receipt(row.name, `${PLANS[row.plan].name} plan renewal`, formatUsd(amount), until) });
  return "renewed";
}

export const daysUntil = (date: Date, now = new Date()) => Math.ceil((date.getTime() - now.getTime()) / DAY);

import { route } from "@/lib/api/http";
import type Stripe from "stripe";
import { fulfilPaidOrder } from "@/lib/domains/service";
import { fulfilBillingOrder } from "@/lib/billing/service";
import { stripe, stripeConfigured } from "@/lib/payments/stripe";

/**
 * Stripe webhook. Configure it in the Stripe dashboard to send
 * `checkout.session.completed` and `checkout.session.async_payment_succeeded`
 * to /api/webhooks/stripe. The signature is verified before anything runs.
 */
export const POST = route(async (request: Request) => {
  if (!stripeConfigured()) return new Response("Payments are not configured.", { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature.", { status: 400 });
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("Invalid signature.", { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
    if (session.payment_status === "paid") {
      // Domain purchases and plan/credit purchases carry different metadata.
      if (session.metadata?.orderId) await fulfilPaidOrder(session.metadata.orderId, paymentIntent);
      if (session.metadata?.billingOrderId) await fulfilBillingOrder(session.metadata.billingOrderId, paymentIntent);
    }
  }
  return Response.json({ received: true });
});

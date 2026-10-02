import type Stripe from "stripe";
import { fulfilPaidOrder } from "@/lib/domains/service";
import { stripe, stripeConfigured } from "@/lib/payments/stripe";

/**
 * Stripe webhook. Configure it in the Stripe dashboard to send
 * `checkout.session.completed` and `checkout.session.async_payment_succeeded`
 * to /api/webhooks/stripe. The signature is verified before anything runs.
 */
export async function POST(request: Request) {
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
    const orderId = session.metadata?.orderId;
    if (orderId && session.payment_status === "paid") {
      const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
      await fulfilPaidOrder(orderId, paymentIntent);
    }
  }
  return Response.json({ received: true });
}

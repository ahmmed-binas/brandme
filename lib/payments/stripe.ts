import Stripe from "stripe";

/** Stripe is only constructed when configured, so the app runs without payments in development. */
export const stripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);

let client: Stripe | undefined;
export function stripe(): Stripe {
  // STRIPE_API_URL points the SDK at stripe-mock or another test server; leave unset in production.
  const testServer = process.env.STRIPE_API_URL ? new URL(process.env.STRIPE_API_URL) : null;
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY!, testServer ? { host: testServer.hostname, port: Number(testServer.port), protocol: testServer.protocol.replace(":", "") as "http" | "https" } : undefined);
  return client;
}

/** The public origin used for Stripe return URLs. */
export function appOrigin(request: Request): string {
  return process.env.APP_URL?.replace(/\/$/, "") ?? new URL(request.url).origin;
}

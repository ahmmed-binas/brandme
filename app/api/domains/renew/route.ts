import { jsonError, readJson, route } from "@/lib/api/http";
import { DomainError, startRenewal } from "@/lib/domains/service";
import { registrarConfigured } from "@/lib/domains/vercel";
import { stripeConfigured } from "@/lib/payments/stripe";
import { siteUrl } from "@/lib/site";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

/** Starts renewing one of the signed-in owner's bought domains. Returns { url } to send them to. */
export const POST = route(async (request: Request) => {
  if (!databaseConfigured() || !registrarConfigured() || !stripeConfigured()) return jsonError(503, "Domain renewals aren’t set up on this server.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to renew your domain.");
  const body = await readJson(request, 500);
  if (body instanceof Response) return body;
  const orderId = (body as { orderId?: unknown } | null)?.orderId;
  if (typeof orderId !== "string" || !/^[0-9a-f-]{36}$/i.test(orderId)) return jsonError(422, "Which domain?");
  try {
    return Response.json({ url: await startRenewal(user, orderId, siteUrl) });
  } catch (error) {
    if (error instanceof DomainError) return jsonError(error.status, error.message);
    throw error;
  }
});

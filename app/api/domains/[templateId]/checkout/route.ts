import { jsonError, readJson, requireOwner } from "@/lib/api/http";
import { contactSchema } from "@/lib/domains/contact";
import { domainErrorResponse } from "@/lib/domains/http";
import { isValidDomain, normaliseDomain } from "@/lib/domains/names";
import { startPurchase } from "@/lib/domains/service";
import { vercelConfigured } from "@/lib/domains/vercel";
import { appOrigin, stripeConfigured } from "@/lib/payments/stripe";

/** Starts buying a domain: validates registrant details, re-prices on the server, and returns a Stripe Checkout URL. */
export async function POST(request: Request, { params }: { params: Promise<{ templateId: string }> }) {
  const owner = await requireOwner(params);
  if (owner instanceof Response) return owner;
  if (!vercelConfigured() || !stripeConfigured()) return jsonError(503, "Buying domains isn’t set up on this server yet.");
  const body = await readJson(request, 5_000);
  if (body instanceof Response) return body;
  const { domain: rawDomain, contact } = (body ?? {}) as { domain?: unknown; contact?: unknown };
  const domain = normaliseDomain(String(rawDomain ?? ""));
  if (!isValidDomain(domain)) return jsonError(422, "Choose a domain to buy.");
  const parsed = contactSchema.safeParse(contact);
  if (!parsed.success) return jsonError(422, parsed.error.issues[0]?.message ?? "Check your contact details.");
  try {
    return Response.json({ url: await startPurchase(owner.user, owner.templateId, domain, parsed.data, appOrigin(request)) });
  } catch (error) {
    return domainErrorResponse(error);
  }
}

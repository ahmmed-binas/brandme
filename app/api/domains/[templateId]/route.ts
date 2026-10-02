import { jsonError, readJson, requireOwner, route } from "@/lib/api/http";
import { domainErrorResponse } from "@/lib/domains/http";
import { isValidDomain, normaliseDomain } from "@/lib/domains/names";
import { connectDomain, domainOverview, removeDomain } from "@/lib/domains/service";
import { serverDomainsConfigured } from "@/lib/domains/dns";
import { registrarConfigured } from "@/lib/domains/vercel";
import { stripeConfigured } from "@/lib/payments/stripe";

type Context = { params: Promise<{ templateId: string }> };

/** The portfolio's custom domain, its live status, recent purchases, and what this account can do. */
export const GET = route(async (_request: Request, { params }: Context) => {
  const owner = await requireOwner(params);
  if (owner instanceof Response) return owner;
  const capabilities = { canBuy: serverDomainsConfigured() && registrarConfigured() && stripeConfigured(), canConnect: serverDomainsConfigured() && owner.user.plan.connectOwnDomain, planName: owner.user.plan.name };
  if (!serverDomainsConfigured()) return Response.json({ domain: null, orders: [], capabilities });
  try {
    return Response.json({ ...(await domainOverview(owner.user, owner.templateId)), capabilities });
  } catch (error) {
    return domainErrorResponse(error);
  }
});

/** Connect a domain the user already owns. */
export const POST = route(async (request: Request, { params }: Context) => {
  const owner = await requireOwner(params);
  if (owner instanceof Response) return owner;
  if (!serverDomainsConfigured()) return jsonError(503, "Custom domains aren’t set up on this server yet.");
  const body = await readJson(request, 1_000);
  if (body instanceof Response) return body;
  const domain = normaliseDomain(String((body as { domain?: unknown } | null)?.domain ?? ""));
  if (!isValidDomain(domain)) return jsonError(422, "Enter a domain like yourname.com or portfolio.yourname.com.");
  try {
    return Response.json({ domain: await connectDomain(owner.user, owner.templateId, domain) });
  } catch (error) {
    return domainErrorResponse(error);
  }
});

/** Disconnect the portfolio's domain. */
export const DELETE = route(async (_request: Request, { params }: Context) => {
  const owner = await requireOwner(params);
  if (owner instanceof Response) return owner;
  if (!serverDomainsConfigured()) return jsonError(503, "Custom domains aren’t set up on this server yet.");
  try {
    await removeDomain(owner.user, owner.templateId);
    return Response.json({ domain: null });
  } catch (error) {
    return domainErrorResponse(error);
  }
});

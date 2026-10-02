import { jsonError, readJson, requireOwner } from "@/lib/api/http";
import { domainErrorResponse } from "@/lib/domains/http";
import { suggestDomains } from "@/lib/domains/names";
import { priceDomains } from "@/lib/domains/service";
import { vercelConfigured } from "@/lib/domains/vercel";

/** Domain ideas from a search term (or the person's name), with availability and the customer's price. */
export async function POST(request: Request, { params }: { params: Promise<{ templateId: string }> }) {
  const owner = await requireOwner(params);
  if (owner instanceof Response) return owner;
  if (!vercelConfigured()) return jsonError(503, "Domain search isn’t set up on this server yet.");
  const body = await readJson(request, 1_000);
  if (body instanceof Response) return body;
  const { query, name } = (body ?? {}) as { query?: unknown; name?: unknown };
  const candidates = suggestDomains(String(name ?? "").slice(0, 80), typeof query === "string" ? query.slice(0, 80) : undefined);
  if (!candidates.length) return jsonError(422, "Type a name or domain to search for.");
  try {
    return Response.json({ offers: await priceDomains(candidates) });
  } catch (error) {
    return domainErrorResponse(error);
  }
}

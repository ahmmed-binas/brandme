import { isTemplateId } from "@/lib/templates/catalog";
import type { TemplateId } from "@/lib/templates/types";
import { databaseConfigured } from "@/utils/db-schema";
import { isDatabaseUnavailable } from "@/utils/db";
import { getCurrentUser, type CurrentUser } from "@/utils/user-account";

export const jsonError = (status: number, error: string) => Response.json({ error }, { status });

/** Reads a JSON body without trusting its size or shape. */
export async function readJson(request: Request, maxBytes: number): Promise<unknown | Response> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBytes) return jsonError(413, "This request is too large.");
  const raw = await request.text();
  if (raw.length > maxBytes) return jsonError(413, "This request is too large.");
  try {
    return JSON.parse(raw);
  } catch {
    return jsonError(400, "The request body must be JSON.");
  }
}

/** Common guard for owner-only portfolio routes. */
export async function requireOwner(params: Promise<{ templateId: string }>): Promise<{ user: CurrentUser; templateId: TemplateId } | Response> {
  if (!databaseConfigured()) return jsonError(503, "Account saving is not configured on this server.");
  const { templateId } = await params;
  if (!isTemplateId(templateId)) return jsonError(404, "Unknown template.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to save and publish portfolios.");
  return { user, templateId };
}

type Handler<C> = (request: Request, context: C) => Promise<Response>;

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Refuses changes sent by another website's page (cross-site request forgery).
 * Sign-in cookies are already SameSite=Lax; this is the second lock. Browsers
 * mark every request with Sec-Fetch-Site and Origin; server-to-server callers
 * (Stripe, Cal.com, the cron job) send neither and are let through to their own
 * signature or secret checks.
 */
function crossSite(request: Request): Response | null {
  if (!UNSAFE.has(request.method)) return null;
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site") return jsonError(403, "This request came from another website, so it was refused.");
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return null;
  let originHost: string;
  try { originHost = new URL(origin).host.toLowerCase(); } catch { return jsonError(403, "This request came from another website, so it was refused."); }
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0]!.trim().toLowerCase();
  return host && originHost !== host ? jsonError(403, "This request came from another website, so it was refused.") : null;
}

/**
 * Wraps a route handler so failures become clear JSON errors: a database
 * outage is a 503 the editor can explain, and anything unexpected is logged
 * and returned as a generic 500 without leaking internals.
 */
export function route<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (request, context) => {
    const refused = crossSite(request);
    if (refused) return refused;
    try {
      return await handler(request, context);
    } catch (error) {
      if (isDatabaseUnavailable(error)) {
        console.error(`[api] database unavailable on ${request.method} ${new URL(request.url).pathname}`);
        return jsonError(503, "We can’t reach our database right now. Your changes are still saved on this device; try again in a minute.");
      }
      console.error(`[api] ${request.method} ${new URL(request.url).pathname} failed`, error);
      return jsonError(500, "Something went wrong on our side. Please try again.");
    }
  };
}

import { isTemplateId } from "@/lib/templates/catalog";
import type { TemplateId } from "@/lib/templates/types";
import { databaseConfigured } from "@/utils/db-schema";
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

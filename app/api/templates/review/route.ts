import { jsonError, readJson, route } from "@/lib/api/http";
import { setTemplateReview, templateReviews, reviewOf } from "@/lib/templates/approval";
import { getTemplate, templateCatalog } from "@/lib/templates/catalog";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

const STATUSES = ["approved", "changes", "rejected"] as const;

/** Approve, request changes on, or reject a template. Admins only. */
export const POST = route(async (request: Request) => {
  if (!databaseConfigured()) return jsonError(503, "Reviews need the database.");
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) return jsonError(404, "Not found.");
  const body = await readJson(request, 2_000);
  if (body instanceof Response) return body;
  const { templateId, status, note, bulk } = (body ?? {}) as { templateId?: unknown; status?: unknown; note?: unknown; bulk?: unknown };
  if (bulk === "approve-pending") {
    const reviews = await templateReviews();
    const pending = templateCatalog.filter((template) => template.collection === "studio" && reviewOf(reviews, template).status === "pending");
    for (const template of pending) await setTemplateReview(template.id, "approved", null, user.id);
    return Response.json({ approved: pending.length });
  }
  const template = typeof templateId === "string" ? getTemplate(templateId) : undefined;
  if (!template || template.collection !== "studio") return jsonError(404, "Unknown template.");
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) return jsonError(422, "Choose approve, changes or reject.");
  const text = typeof note === "string" ? note.trim().slice(0, 1000) : "";
  if (status === "changes" && !text) return jsonError(422, "Say what should change.");
  await setTemplateReview(template.id, status as (typeof STATUSES)[number], text || null, user.id);
  return Response.json({ ok: true });
});

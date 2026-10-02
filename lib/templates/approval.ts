import { db } from "@/utils/db";
import { databaseConfigured, ensureSchema } from "@/utils/db-schema";
import { templateCatalog } from "./catalog";
import type { TemplateDefinition } from "./types";

/**
 * Templates go live only after the owner approves them on /templates/review.
 * The three original templates are always available. Set
 * TEMPLATES_REQUIRE_APPROVAL=false to show every template without review.
 */
export type ReviewStatus = "approved" | "changes" | "rejected" | "pending";
export interface TemplateReview { status: ReviewStatus; note: string | null; reviewedAt: string | null }

export const approvalRequired = () => process.env.TEMPLATES_REQUIRE_APPROVAL !== "false";

export async function templateReviews(): Promise<Map<string, TemplateReview>> {
  const reviews = new Map<string, TemplateReview>();
  if (!databaseConfigured()) return reviews;
  try {
    await ensureSchema();
    const result = await db.query<{ template_id: string; status: ReviewStatus; note: string | null; reviewed_at: Date }>("SELECT template_id, status, note, reviewed_at FROM template_reviews");
    for (const row of result.rows) reviews.set(row.template_id, { status: row.status, note: row.note, reviewedAt: row.reviewed_at.toISOString() });
  } catch (error) {
    console.error("Template reviews unavailable", error);
  }
  return reviews;
}

export const reviewOf = (reviews: Map<string, TemplateReview>, template: TemplateDefinition): TemplateReview =>
  template.collection === "studio" ? reviews.get(template.id) ?? { status: "pending", note: null, reviewedAt: null } : { status: "approved", note: null, reviewedAt: null };

/** Templates a visitor may see and use. Moderators see everything so they can review it. */
export async function availableTemplates(moderator = false): Promise<Array<TemplateDefinition & { review: TemplateReview }>> {
  const reviews = await templateReviews();
  return templateCatalog
    .map((template) => ({ ...template, review: reviewOf(reviews, template) }))
    .filter((template) => moderator || !approvalRequired() || template.review.status === "approved");
}

export async function isTemplateAvailable(template: TemplateDefinition, moderator = false): Promise<boolean> {
  if (moderator || !approvalRequired() || template.collection !== "studio") return true;
  return reviewOf(await templateReviews(), template).status === "approved";
}

export async function setTemplateReview(templateId: string, status: Exclude<ReviewStatus, "pending">, note: string | null, reviewerId: string) {
  await ensureSchema();
  await db.query(
    `INSERT INTO template_reviews (template_id, status, note, reviewed_by) VALUES ($1, $2, $3, $4)
     ON CONFLICT (template_id) DO UPDATE SET status = EXCLUDED.status, note = EXCLUDED.note, reviewed_by = EXCLUDED.reviewed_by, reviewed_at = NOW()`,
    [templateId, status, note, reviewerId],
  );
}

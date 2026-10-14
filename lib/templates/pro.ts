import type { PlanLimits } from "@/lib/plans";
import { getTemplate } from "./catalog";
import { PRO_TEMPLATE_MESSAGE } from "./pro-message";

/**
 * 3D Pro templates (`proOnly` in the catalogue): anyone can open them in the
 * editor and try everything, but only paid plans (and admins) can save and
 * publish them. The owner's decision, 14 October 2026.
 */

type Viewer = { isAdmin: boolean; plan: PlanLimits };

/** Whether this person may save or publish this template. */
export function canUseTemplate(templateId: string, viewer: Viewer | null): boolean {
  if (!getTemplate(templateId)?.proOnly) return true;
  return Boolean(viewer && (viewer.isAdmin || viewer.plan.id !== "basic"));
}

/** The refusal the save and publish routes send for a Pro template on a free plan. */
export function proTemplateRefusal() {
  return Response.json({ error: PRO_TEMPLATE_MESSAGE, upgrade: true }, { status: 402 });
}

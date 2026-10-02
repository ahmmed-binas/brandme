/**
 * Plan limits live in one place so pricing changes never require hunting
 * through route handlers. Server code enforces these; the UI only explains them.
 */
export type PlanId = "free" | "pro";

export interface PlanLimits {
  name: string;
  /** Portfolios that can be live at /p/<address> at the same time. */
  publishedPortfolios: number;
  /** AI content edits per user per UTC day. */
  aiEditsPerDay: number;
  /** Whether the "Made with Formora" badge is shown on published pages. */
  showsBranding: boolean;
}

export const PLANS: Record<PlanId, PlanLimits> = {
  free: { name: "Free", publishedPortfolios: 1, aiEditsPerDay: 10, showsBranding: true },
  pro: { name: "Pro", publishedPortfolios: 10, aiEditsPerDay: 200, showsBranding: false },
};

export function planFor(value: string | null | undefined): PlanLimits {
  return value === "pro" ? PLANS.pro : PLANS.free;
}

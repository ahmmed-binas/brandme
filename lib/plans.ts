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
  /**
   * Whether a domain the user already owns can be connected. Domains bought
   * through Formora are always connected, on any plan; the purchase pays for it.
   */
  connectOwnDomain: boolean;
}

export const PLANS: Record<PlanId, PlanLimits> = {
  // An AI edit costs roughly $0.03–0.06 in model usage (see docs/BUSINESS_PLAN.md), so the
  // free allowance is sized to show the value without making heavy free users expensive.
  free: { name: "Free", publishedPortfolios: 1, aiEditsPerDay: 3, showsBranding: true, connectOwnDomain: false },
  pro: { name: "Pro", publishedPortfolios: 10, aiEditsPerDay: 50, showsBranding: false, connectOwnDomain: true },
};

export function planFor(value: string | null | undefined): PlanLimits {
  return value === "pro" ? PLANS.pro : PLANS.free;
}

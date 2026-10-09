/**
 * Plans, prices and what each one allows. Server code enforces these; the UI
 * only explains them. Change prices here: checkout, the pricing page and the
 * account page all read from this file.
 *
 * The model (free-first launch, see docs/plans/free-first-launch-plan.md):
 * - Basic is free for ever: every template, one live portfolio, a blog and the
 *   Investigator. Nothing is ever paused.
 * - Pro is paid yearly or monthly: up to three live portfolios, the owner's own
 *   domain and no branding. When Pro ends there are 14 days of grace, then the
 *   account is back on Basic (extra portfolios rest; nothing is deleted).
 * - AI is paid separately at cost (credits or the owner's own API key) and
 *   costs the same on every plan, so no plan can run at a loss because of AI.
 */
export type PlanId = "basic" | "pro";
export type PaidPlanId = "pro";
export type BillingInterval = "year" | "month";

export interface PlanLimits {
  id: PlanId;
  name: string;
  summary: string;
  /** Price in US cents per billing interval on offer; empty for a free plan. */
  prices: Partial<Record<BillingInterval, number>>;
  /** Portfolios (sets of content) an owner can keep. Basic keeps one: switching design moves it. */
  portfolios: number;
  /** Portfolios that can be live at the same time. */
  publishedPortfolios: number;
  /** Cap on AI requests per day, whatever pays for them, so nobody can hammer the service. */
  aiEditsPerDay: number;
  /** Whether a small "Made with Formora" link shows on published pages. */
  showsBranding: boolean;
  /** Whether the owner can buy or connect a domain of their own. */
  ownDomain: boolean;
  /** Total image storage. */
  storageMb: number;
  /** A blog on the portfolio (/blog, and on the owner's own domain). */
  blog: boolean;
  /** Weekly GitHub sync into the portfolio. */
  autoSync: boolean;
}

export const GRACE_DAYS = 14;
/** Credits every new account starts with, enough to try the AI assistant and an import or two. */
export const WELCOME_CREDITS = 60;

export const PLANS: Record<PlanId, PlanLimits> = {
  basic: {
    id: "basic", name: "Basic", summary: "Your portfolio online with a blog, free for as long as you like.", prices: {},
    portfolios: 1, publishedPortfolios: 1, aiEditsPerDay: 30, showsBranding: true, ownDomain: false,
    storageMb: 100, blog: true, autoSync: true,
  },
  pro: {
    id: "pro", name: "Pro", summary: "Up to three sites, on your own domain, without our name on them.", prices: { year: 6000, month: 600 },
    portfolios: 3, publishedPortfolios: 3, aiEditsPerDay: 80, showsBranding: false, ownDomain: true,
    storageMb: 1000, blog: true, autoSync: true,
  },
};

export const isPaidPlan = (value: unknown): value is PaidPlanId => value === "pro";
export const isInterval = (value: unknown): value is BillingInterval => value === "year" || value === "month";

/** Old plan names (trial, premium) map onto today's plans. */
export function planFor(value: string | null | undefined): PlanLimits {
  return value === "pro" || value === "premium" ? PLANS.pro : PLANS.basic;
}

export function priceFor(plan: PaidPlanId, interval: BillingInterval): number {
  return PLANS[plan].prices[interval]!;
}

export const INTERVAL_LABEL: Record<BillingInterval, string> = { year: "year", month: "month" };

export const formatUsd = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;

/**
 * Stripe's standard card fee (2.9% + 30¢), shown to the customer as its own line
 * when they buy credits or a domain, so the item itself is sold at cost.
 * Stripe keeps this fee when a payment is refunded.
 */
export const cardFeeCents = (amountCents: number) => Math.ceil(amountCents * 0.029 + 30);

/**
 * Where an account stands today:
 * - active: everything in the plan works (Basic is always active).
 * - grace: Pro ended in the last 14 days; it keeps working while we remind them.
 */
export type Standing = "active" | "grace";

export interface AccountStanding {
  standing: Standing;
  plan: PlanLimits;
  interval: BillingInterval;
  /** When the paid period ends; null on Basic. */
  endsAt: Date | null;
  /** Days left in the paid period, or in the grace period when in grace. */
  daysLeft: number;
}

const DAY = 86_400_000;

export function standingOf(row: { plan: string; plan_expires_at: Date | string | null; plan_interval?: string | null }, now = new Date()): AccountStanding {
  const interval: BillingInterval = row.plan_interval === "month" ? "month" : "year";
  const plan = planFor(row.plan);
  if (plan.id === "basic" || !row.plan_expires_at) return { standing: "active", plan: PLANS.basic, interval, endsAt: null, daysLeft: 0 };
  const endsAt = new Date(row.plan_expires_at);
  const remaining = endsAt.getTime() - now.getTime();
  if (remaining > 0) return { standing: "active", plan, interval, endsAt, daysLeft: Math.ceil(remaining / DAY) };
  const graceLeft = remaining + GRACE_DAYS * DAY;
  if (graceLeft > 0) return { standing: "grace", plan, interval, endsAt, daysLeft: Math.ceil(graceLeft / DAY) };
  return { standing: "active", plan: PLANS.basic, interval, endsAt: null, daysLeft: 0 };
}

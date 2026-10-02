/**
 * Plans, prices and what each one allows. Server code enforces these; the UI
 * only explains them. Change prices here: checkout, the pricing page and the
 * account page all read from this file.
 *
 * The model (see docs/BUSINESS_PLAN.md):
 * - Everyone starts with a 14-day trial with Pro features.
 * - After it ends there are 14 days of grace: the site stays up, the owner sees
 *   a friendly banner and gets a few emails. After that the site rests (it is
 *   never deleted) until they choose a plan.
 * - Plans are paid yearly and upfront, optionally for several years at a
 *   discount. Hosting is what's sold; AI is paid separately (credits or the
 *   owner's own API key), so no plan can run at a loss because of AI.
 */
export type PlanId = "trial" | "basic" | "pro" | "premium";
export type PaidPlanId = Exclude<PlanId, "trial">;

export interface PlanLimits {
  id: PlanId;
  name: string;
  summary: string;
  /** Price per year in US cents. */
  yearlyCents: number;
  /** Prepaid terms on offer, in years. */
  terms: number[];
  /** Portfolios that can be live at the same time. */
  publishedPortfolios: number;
  /** Cap on AI requests per day, whatever pays for them, so nobody can hammer the service. */
  aiEditsPerDay: number;
  /** Whether a small "Made with Formora" link shows on published pages. */
  showsBranding: boolean;
  /** Whether a domain the owner already has can be connected. */
  connectOwnDomain: boolean;
  /** Premium: one domain registration (up to INCLUDED_DOMAIN_MAX_CENTS a year) is on us. */
  includedDomain: boolean;
  /** Total image storage. */
  storageMb: number;
  /** Weekly GitHub sync into the portfolio. */
  autoSync: boolean;
  /** How often the research agent looks for news about the owner; null when not included. */
  researchEveryDays: number | null;
  /** AI credits added every month at no charge. */
  monthlyCredits: number;
  prioritySupport: boolean;
}

export const TRIAL_DAYS = 14;
export const GRACE_DAYS = 14;
/** Credits every new account starts with, enough to try the AI assistant and an import or two. */
export const WELCOME_CREDITS = 60;
export const INCLUDED_DOMAIN_MAX_CENTS = 2000;
/** Discount for paying several years upfront. */
export const TERM_DISCOUNT: Record<number, number> = { 1: 0, 2: 0.1, 5: 0.25 };

export const PLANS: Record<PlanId, PlanLimits> = {
  trial: {
    id: "trial", name: "Free trial", summary: "Everything in Pro for 14 days.", yearlyCents: 0, terms: [],
    publishedPortfolios: 1, aiEditsPerDay: 25, showsBranding: true, connectOwnDomain: true, includedDomain: false,
    storageMb: 100, autoSync: true, researchEveryDays: null, monthlyCredits: 0, prioritySupport: false,
  },
  basic: {
    id: "basic", name: "Basic", summary: "Your portfolio online, on your own domain, kept fast and safe.", yearlyCents: 1000, terms: [1, 2],
    publishedPortfolios: 1, aiEditsPerDay: 30, showsBranding: true, connectOwnDomain: true, includedDomain: false,
    storageMb: 200, autoSync: false, researchEveryDays: null, monthlyCredits: 0, prioritySupport: false,
  },
  pro: {
    id: "pro", name: "Pro", summary: "A portfolio that keeps itself up to date.", yearlyCents: 2400, terms: [1, 2, 5],
    publishedPortfolios: 3, aiEditsPerDay: 80, showsBranding: false, connectOwnDomain: true, includedDomain: false,
    storageMb: 1000, autoSync: true, researchEveryDays: 90, monthlyCredits: 100, prioritySupport: false,
  },
  premium: {
    id: "premium", name: "Premium", summary: "A domain included, monthly check-ins on your career, and priority help.", yearlyCents: 4900, terms: [1, 2, 5],
    publishedPortfolios: 10, aiEditsPerDay: 200, showsBranding: false, connectOwnDomain: true, includedDomain: true,
    storageMb: 5000, autoSync: true, researchEveryDays: 30, monthlyCredits: 300, prioritySupport: true,
  },
};

export const PAID_PLANS: PaidPlanId[] = ["basic", "pro", "premium"];
export const isPaidPlan = (value: unknown): value is PaidPlanId => PAID_PLANS.includes(value as PaidPlanId);

export function planFor(value: string | null | undefined): PlanLimits {
  if (value === "basic" || value === "pro" || value === "premium") return PLANS[value];
  return PLANS.trial;
}

/** Total price in cents for a plan paid upfront for `years`. The yearly rate is rounded to whole dollars so prices read cleanly. */
export function priceFor(plan: PaidPlanId, years: number): number {
  const discount = TERM_DISCOUNT[years] ?? 0;
  return Math.round((PLANS[plan].yearlyCents * (1 - discount)) / 100) * 100 * years;
}

export const formatUsd = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;

/**
 * Where an account stands today:
 * - trial / active: everything in the plan works.
 * - grace: the trial or plan ended in the last 14 days; the site stays live and we remind them.
 * - paused: the site rests (visitors see a holding page); editing still works and nothing is deleted.
 */
export type Standing = "trial" | "active" | "grace" | "paused";

export interface AccountStanding {
  standing: Standing;
  plan: PlanLimits;
  /** When the current period (trial or paid term) ends. */
  endsAt: Date;
  /** Days left in the current period, or in the grace period when in grace. */
  daysLeft: number;
}

const DAY = 86_400_000;

export function standingOf(row: { plan: string; trial_ends_at: Date | string; plan_expires_at: Date | string | null }, now = new Date()): AccountStanding {
  const plan = planFor(row.plan);
  const endsAt = new Date(plan.id === "trial" ? row.trial_ends_at : row.plan_expires_at ?? row.trial_ends_at);
  const remaining = endsAt.getTime() - now.getTime();
  if (remaining > 0) return { standing: plan.id === "trial" ? "trial" : "active", plan, endsAt, daysLeft: Math.ceil(remaining / DAY) };
  const graceLeft = remaining + GRACE_DAYS * DAY;
  if (graceLeft > 0) return { standing: "grace", plan, endsAt, daysLeft: Math.ceil(graceLeft / DAY) };
  return { standing: "paused", plan, endsAt, daysLeft: 0 };
}

/** Whether visitors should see the portfolio. Paused accounts show a holding page instead. */
export const isLive = (standing: Standing) => standing !== "paused";

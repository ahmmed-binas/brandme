import type { InvestigatorLink } from "./links";

/** Schedules and what the settings page shows. No server code here, so the browser can import it. */
export const FREQUENCIES = ["daily", "weekly", "monthly", "six_months", "yearly", "custom"] as const;
export type Frequency = (typeof FREQUENCIES)[number];
export type Mode = "ask" | "auto";

export const FREQUENCY_LABEL: Record<Frequency, string> = { daily: "Every day", weekly: "Every week", monthly: "Every month", six_months: "Every 6 months", yearly: "Once a year", custom: "Every … days" };
const FREQUENCY_DAYS: Record<Exclude<Frequency, "custom">, number> = { daily: 1, weekly: 7, monthly: 30, six_months: 182, yearly: 365 };
export const CUSTOM_DAYS_MIN = 1;
export const CUSTOM_DAYS_MAX = 365;
/** What one check's AI step usually costs, in credits (1 credit = 1 US cent). An estimate until real checks are measured. */
export const CHECK_CREDITS_ESTIMATE = { low: 20, high: 60 };

export const scheduleDays = (frequency: Frequency, customDays: number | null) => (frequency === "custom" ? customDays ?? 30 : FREQUENCY_DAYS[frequency]);
export const scheduleLabel = (frequency: Frequency, customDays: number | null) => (frequency === "custom" ? `Every ${customDays ?? 30} day${customDays === 1 ? "" : "s"}` : FREQUENCY_LABEL[frequency]);

export interface InvestigatorAccess {
  scheduled: boolean;
  frequencies: Frequency[];
  /** The account's first check is free (we pay for its AI step). */
  freeCheckAvailable: boolean;
  /** Who pays for the AI step of the next check. "none": only GitHub and feeds will be read. */
  paysWith: "free" | "own-key" | "credits" | "none";
  credits: number;
  planName: string;
  reason: string | null;
}

export interface InvestigatorSettings { enabled: boolean; frequency: Frequency; customDays: number | null; mode: Mode; links: InvestigatorLink[]; templateId: string | null; nextRunAt: string | null; lastRunAt: string | null }

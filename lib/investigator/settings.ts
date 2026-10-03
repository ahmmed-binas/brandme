import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import type { CurrentUser } from "@/utils/user-account";
import { cleanLinks, type InvestigatorLink } from "./links";

/**
 * Who gets the Investigator and how often (decided by the owner):
 * - Pro: monthly, every six months or yearly.
 * - Premium: also weekly and daily.
 * - Free trial: one check, run by hand, so people can see what it does.
 * - Basic: not included (upgrade prompt).
 * Every check that uses AI is paid from the plan's monthly credits or the
 * customer's own key, and capped by AI_DAILY_BUDGET_USD.
 */
export const FREQUENCIES = ["daily", "weekly", "monthly", "six_months", "yearly"] as const;
export type Frequency = (typeof FREQUENCIES)[number];
export type Mode = "ask" | "auto";

export const FREQUENCY_LABEL: Record<Frequency, string> = { daily: "Every day", weekly: "Every week", monthly: "Every month", six_months: "Every 6 months", yearly: "Once a year" };
const FREQUENCY_DAYS: Record<Frequency, number> = { daily: 1, weekly: 7, monthly: 30, six_months: 182, yearly: 365 };

export interface InvestigatorAccess { scheduled: boolean; frequencies: Frequency[]; trialRunAvailable: boolean; planName: string; reason: string | null }

export async function accessFor(user: CurrentUser): Promise<InvestigatorAccess> {
  const plan = user.plan.id;
  const active = user.standing.standing === "active" || user.standing.standing === "trial";
  if (plan === "premium" && active) return { scheduled: true, frequencies: [...FREQUENCIES], trialRunAvailable: false, planName: user.plan.name, reason: null };
  if (plan === "pro" && active) return { scheduled: true, frequencies: ["monthly", "six_months", "yearly"], trialRunAvailable: false, planName: user.plan.name, reason: null };
  if (plan === "trial" && user.standing.standing === "trial") {
    await ensureSchema();
    const used = await db.query("SELECT 1 FROM investigator_runs WHERE owner_id = $1 AND status <> 'failed' LIMIT 1", [user.id]);
    return { scheduled: false, frequencies: [], trialRunAvailable: !used.rowCount, planName: user.plan.name, reason: used.rowCount ? "Your free check is used. Choose Pro or Premium to keep the Investigator working for you." : null };
  }
  return { scheduled: false, frequencies: [], trialRunAvailable: false, planName: user.plan.name, reason: `The Investigator is included in Pro and Premium${plan === "basic" ? "; you’re on Basic" : ""}.` };
}

export interface InvestigatorSettings { enabled: boolean; frequency: Frequency; mode: Mode; links: InvestigatorLink[]; templateId: string | null; nextRunAt: string | null; lastRunAt: string | null }

const DEFAULTS: InvestigatorSettings = { enabled: false, frequency: "monthly", mode: "ask", links: [], templateId: null, nextRunAt: null, lastRunAt: null };

export async function getSettings(ownerId: string): Promise<InvestigatorSettings> {
  await ensureSchema();
  const row = (await db.query<{ enabled: boolean; frequency: Frequency; mode: Mode; links: InvestigatorLink[]; template_id: string | null; next_run_at: Date | null; last_run_at: Date | null }>(
    "SELECT enabled, frequency, mode, links, template_id, next_run_at, last_run_at FROM investigator_settings WHERE owner_id = $1", [ownerId],
  )).rows[0];
  return row ? { enabled: row.enabled, frequency: row.frequency, mode: row.mode, links: row.links, templateId: row.template_id, nextRunAt: row.next_run_at?.toISOString() ?? null, lastRunAt: row.last_run_at?.toISOString() ?? null } : DEFAULTS;
}

export const nextRun = (frequency: Frequency, from = new Date()) => new Date(from.getTime() + FREQUENCY_DAYS[frequency] * 86_400_000);

export class SettingsError extends Error {}

/** Saves settings within what the plan allows. Turning it on schedules the first check soon. */
export async function saveSettings(user: CurrentUser, input: { enabled?: unknown; frequency?: unknown; mode?: unknown; links?: unknown; templateId?: unknown; ownProfiles?: unknown }): Promise<InvestigatorSettings> {
  const access = await accessFor(user);
  const current = await getSettings(user.id);
  const links = input.links === undefined ? current.links : cleanLinks(input.links);
  const frequency = (FREQUENCIES as readonly string[]).includes(String(input.frequency)) ? input.frequency as Frequency : current.frequency;
  const mode: Mode = input.mode === "auto" ? "auto" : input.mode === "ask" ? "ask" : current.mode;
  const enabled = input.enabled === undefined ? current.enabled : input.enabled === true;
  const templateId = typeof input.templateId === "string" && /^[a-z0-9-]{2,40}$/.test(input.templateId) ? input.templateId : current.templateId;
  if (links.length && input.links !== undefined && input.ownProfiles !== true) throw new SettingsError("Please confirm these are your own profiles.");
  if (enabled && !access.scheduled) throw new SettingsError(access.reason ?? "Scheduled checks aren’t included in your plan.");
  if (enabled && !access.frequencies.includes(frequency)) throw new SettingsError(`${FREQUENCY_LABEL[frequency]} isn’t included in ${access.planName}. Choose ${access.frequencies.map((item) => FREQUENCY_LABEL[item].toLowerCase()).join(", ")}.`);
  if (enabled && !links.length) throw new SettingsError("Add at least one of your profiles first.");
  // A new schedule (or turning it on) runs within the hour; otherwise the date stays.
  const schedule = enabled && (!current.enabled || current.frequency !== frequency || !current.nextRunAt) ? (current.lastRunAt ? nextRun(frequency, new Date(current.lastRunAt)) : new Date()) : current.nextRunAt ? new Date(current.nextRunAt) : null;
  await ensureSchema();
  await db.query(
    `INSERT INTO investigator_settings (owner_id, enabled, frequency, mode, links, template_id, next_run_at) VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (owner_id) DO UPDATE SET enabled = EXCLUDED.enabled, frequency = EXCLUDED.frequency, mode = EXCLUDED.mode, links = EXCLUDED.links, template_id = EXCLUDED.template_id, next_run_at = EXCLUDED.next_run_at, failures = CASE WHEN EXCLUDED.enabled THEN 0 ELSE investigator_settings.failures END, updated_at = NOW()`,
    [user.id, enabled, frequency, mode, JSON.stringify(links), templateId, enabled ? schedule : null],
  );
  return getSettings(user.id);
}

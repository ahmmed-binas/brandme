import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import type { CurrentUser } from "@/utils/user-account";
import { cleanLinks, type InvestigatorLink } from "./links";
import { MIN_CREDITS_TO_START, platformAiConfigured } from "@/lib/ai/metering";
import { CUSTOM_DAYS_MAX, CUSTOM_DAYS_MIN, FREQUENCIES, scheduleDays, type Frequency, type InvestigatorAccess, type InvestigatorSettings, type Mode } from "./schedule";

export { CHECK_CREDITS_ESTIMATE, CUSTOM_DAYS_MAX, CUSTOM_DAYS_MIN, FREQUENCIES, FREQUENCY_LABEL, scheduleDays, scheduleLabel, type Frequency, type InvestigatorAccess, type InvestigatorSettings, type Mode } from "./schedule";

/**
 * The Investigator is on every plan, on whatever schedule the customer picks
 * (including every N days), because every check that uses AI is paid by them:
 * from credits sold at cost or with their own Claude key. GitHub and feeds are
 * read for free. Every account gets its first check free, paid by us, so
 * people can see what it does. Platform AI is capped by AI_DAILY_BUDGET_USD.
 */
export async function accessFor(user: CurrentUser): Promise<InvestigatorAccess> {
  await ensureSchema();
  const used = await db.query("SELECT 1 FROM investigator_runs WHERE owner_id = $1 AND status <> 'failed' LIMIT 1", [user.id]);
  const freeCheckAvailable = !used.rowCount;
  const paysWith = user.hasOwnKey ? "own-key" : freeCheckAvailable && platformAiConfigured() ? "free" : user.credits >= MIN_CREDITS_TO_START && platformAiConfigured() ? "credits" : "none";
  return { scheduled: true, frequencies: [...FREQUENCIES], freeCheckAvailable, paysWith, credits: user.credits, planName: user.plan.name, reason: null };
}


const DEFAULTS: InvestigatorSettings = { enabled: false, frequency: "monthly", customDays: null, mode: "ask", links: [], templateId: null, nextRunAt: null, lastRunAt: null };

export async function getSettings(ownerId: string): Promise<InvestigatorSettings> {
  await ensureSchema();
  const row = (await db.query<{ enabled: boolean; frequency: Frequency; custom_days: number | null; mode: Mode; links: InvestigatorLink[]; template_id: string | null; next_run_at: Date | null; last_run_at: Date | null }>(
    "SELECT enabled, frequency, custom_days, mode, links, template_id, next_run_at, last_run_at FROM investigator_settings WHERE owner_id = $1", [ownerId],
  )).rows[0];
  return row ? { enabled: row.enabled, frequency: row.frequency, customDays: row.custom_days, mode: row.mode, links: row.links, templateId: row.template_id, nextRunAt: row.next_run_at?.toISOString() ?? null, lastRunAt: row.last_run_at?.toISOString() ?? null } : DEFAULTS;
}

export const nextRun = (frequency: Frequency, customDays: number | null, from = new Date()) => new Date(from.getTime() + scheduleDays(frequency, customDays) * 86_400_000);

export class SettingsError extends Error {}

/** Saves settings within what the plan allows. Turning it on schedules the first check soon. */
export async function saveSettings(user: CurrentUser, input: { enabled?: unknown; frequency?: unknown; customDays?: unknown; mode?: unknown; links?: unknown; templateId?: unknown; ownProfiles?: unknown }): Promise<InvestigatorSettings> {
  const access = await accessFor(user);
  const current = await getSettings(user.id);
  const links = input.links === undefined ? current.links : cleanLinks(input.links);
  const frequency = (FREQUENCIES as readonly string[]).includes(String(input.frequency)) ? input.frequency as Frequency : current.frequency;
  const requestedDays = input.customDays === undefined || input.customDays === null ? current.customDays : Number(input.customDays);
  if (frequency === "custom" && (requestedDays === null || !Number.isInteger(requestedDays) || requestedDays < CUSTOM_DAYS_MIN || requestedDays > CUSTOM_DAYS_MAX)) throw new SettingsError(`Choose a number of days between ${CUSTOM_DAYS_MIN} and ${CUSTOM_DAYS_MAX}.`);
  const customDays = frequency === "custom" ? requestedDays : null;
  const mode: Mode = input.mode === "auto" ? "auto" : input.mode === "ask" ? "ask" : current.mode;
  const enabled = input.enabled === undefined ? current.enabled : input.enabled === true;
  const templateId = typeof input.templateId === "string" && /^[a-z0-9-]{2,40}$/.test(input.templateId) ? input.templateId : current.templateId;
  if (links.length && input.links !== undefined && input.ownProfiles !== true) throw new SettingsError("Please confirm these are your own profiles.");
  if (enabled && !access.scheduled) throw new SettingsError(access.reason ?? "Scheduled checks aren’t included in your plan.");
  if (enabled && !links.length) throw new SettingsError("Add at least one of your profiles first.");
  // A new schedule (or turning it on) runs within the hour; otherwise the date stays.
  const changed = current.frequency !== frequency || current.customDays !== customDays;
  const schedule = enabled && (!current.enabled || changed || !current.nextRunAt) ? (current.lastRunAt ? nextRun(frequency, customDays, new Date(current.lastRunAt)) : new Date()) : current.nextRunAt ? new Date(current.nextRunAt) : null;
  await ensureSchema();
  await db.query(
    `INSERT INTO investigator_settings (owner_id, enabled, frequency, mode, links, template_id, next_run_at, custom_days) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (owner_id) DO UPDATE SET enabled = EXCLUDED.enabled, frequency = EXCLUDED.frequency, custom_days = EXCLUDED.custom_days, mode = EXCLUDED.mode, links = EXCLUDED.links, template_id = EXCLUDED.template_id, next_run_at = EXCLUDED.next_run_at, failures = CASE WHEN EXCLUDED.enabled THEN 0 ELSE investigator_settings.failures END, updated_at = NOW()`,
    [user.id, enabled, frequency, mode, JSON.stringify(links), templateId, enabled ? schedule : null, customDays],
  );
  return getSettings(user.id);
}

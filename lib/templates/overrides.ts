import "server-only";
import { cache } from "react";
import { db } from "@/utils/db";
import { databaseConfigured, ensureSchema } from "@/utils/db-schema";

/**
 * What the superadmin changes per template in Console > Catalog: labels shown
 * on its card ("Most popular", "New"…) and whether it's Pro-only. Stored in
 * template_overrides; a template without a row is as in the catalogue.
 */

/** Labels offered as tick-boxes in the console. Any other short label can be typed in. */
export const PRESET_BADGES = ["Most popular", "New", "Staff pick", "3D", "Pro"] as const;

export interface TemplateOverride {
  badges: string[];
  /** Null: as in the catalogue. */
  proOnly: boolean | null;
}

/** Up to 4 labels of 1–20 characters, in order, without duplicates (ignoring case). */
export function cleanBadges(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const labels: string[] = [];
  for (const item of input) {
    if (typeof item !== "string") continue;
    const label = item.replace(/\s+/g, " ").trim().slice(0, 20);
    if (label && !labels.some((existing) => existing.toLowerCase() === label.toLowerCase()))
      labels.push(label);
    if (labels.length === 4) break;
  }
  return labels;
}

export const templateOverrides = cache(async (): Promise<Map<string, TemplateOverride>> => {
  const overrides = new Map<string, TemplateOverride>();
  if (!databaseConfigured()) return overrides;
  try {
    await ensureSchema();
    const result = await db.query<{ template_id: string; badges: string[]; pro_only: boolean | null }>(
      "SELECT template_id, badges, pro_only FROM template_overrides",
    );
    for (const row of result.rows)
      overrides.set(row.template_id, { badges: row.badges ?? [], proOnly: row.pro_only });
  } catch (error) {
    console.error("Template overrides unavailable", (error as Error).message);
  }
  return overrides;
});

export async function saveOverride(templateId: string, override: TemplateOverride): Promise<void> {
  await ensureSchema();
  await db.query(
    `INSERT INTO template_overrides (template_id, badges, pro_only, updated_at) VALUES ($1, $2, $3, NOW())
     ON CONFLICT (template_id) DO UPDATE SET badges = EXCLUDED.badges, pro_only = EXCLUDED.pro_only, updated_at = NOW()`,
    [templateId, cleanBadges(override.badges), override.proOnly],
  );
}

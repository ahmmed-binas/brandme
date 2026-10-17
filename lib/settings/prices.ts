import "server-only";
import { cache } from "react";
import { DEFAULT_PRICES, type Prices } from "@/lib/offers";
import { db } from "@/utils/db";
import { databaseConfigured, ensureSchema } from "@/utils/db-schema";

/**
 * The live plan prices. The superadmin changes them in Console > Catalog; they
 * are stored in site_settings under "prices" and fall back to DEFAULT_PRICES
 * (lib/offers.ts) for anything not set, or when the database can't be read.
 *
 * Online checkout isn't live yet (paid plans start on WhatsApp). When it is,
 * the Stripe prices in lib/plans.ts must be changed to match.
 */

const KEY = "prices";

/** Each price, with the range the console accepts. */
export const PRICE_FIELDS: Array<{
  key: keyof Prices;
  label: string;
  min: number;
  max: number;
  unit: string;
}> = [
  { key: "proMonth", label: "Pro, monthly", min: 1, max: 10_000, unit: "AED a month" },
  { key: "proYear", label: "Pro, yearly", min: 1, max: 100_000, unit: "AED a year" },
  { key: "agentMonth", label: "Agent, monthly", min: 1, max: 10_000, unit: "AED a month" },
  { key: "doneForYou", label: "Done for you", min: 1, max: 100_000, unit: "AED once" },
  { key: "foundingYear", label: "Founding members, yearly", min: 1, max: 100_000, unit: "AED a year" },
  { key: "foundingSpots", label: "Founding member places", min: 0, max: 10_000, unit: "customers" },
  { key: "freeDomainUpTo", label: "Free domain on yearly Pro, up to", min: 0, max: 10_000, unit: "AED" },
  { key: "agentEditsPerMonth", label: "Changes done for Agent customers", min: 0, max: 100, unit: "a month" },
];

/** Keeps only known, whole numbers inside their ranges. */
export function cleanPrices(input: unknown): Partial<Prices> {
  const value = (input ?? {}) as Record<string, unknown>;
  const clean: Partial<Prices> = {};
  for (const field of PRICE_FIELDS) {
    const number = Number(value[field.key]);
    if (Number.isInteger(number) && number >= field.min && number <= field.max) clean[field.key] = number;
  }
  return clean;
}

/** The prices to show right now (once per request). */
export const getPrices = cache(async (): Promise<Prices> => {
  if (!databaseConfigured()) return DEFAULT_PRICES;
  try {
    await ensureSchema();
    const result = await db.query<{ value: unknown }>("SELECT value FROM site_settings WHERE key = $1", [
      KEY,
    ]);
    return { ...DEFAULT_PRICES, ...cleanPrices(result.rows[0]?.value) };
  } catch (error) {
    console.error("Prices unavailable, using defaults", (error as Error).message);
    return DEFAULT_PRICES;
  }
});

/** Saves the superadmin's prices. Returns what was stored. */
export async function savePrices(input: unknown, userId: string): Promise<Prices> {
  const prices = { ...DEFAULT_PRICES, ...cleanPrices(input) };
  await ensureSchema();
  await db.query(
    `INSERT INTO site_settings (key, value, updated_at, updated_by) VALUES ($1, $2, NOW(), $3)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW(), updated_by = EXCLUDED.updated_by`,
    [KEY, JSON.stringify(prices), userId],
  );
  return prices;
}

import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";

/**
 * AI credits. One credit is worth one US cent of retail value. Credits are
 * charged from the real token usage of each request with a margin, so AI can
 * never cost more than it brings in. Every change is written to a ledger;
 * a `reference` makes grants idempotent (a webhook delivered twice adds once).
 */

export const CREDIT_PACKS = [
  { id: "starter", credits: 500, cents: 500, label: "500 credits" },
  { id: "plus", credits: 1200, cents: 1000, label: "1,200 credits" },
  { id: "studio", credits: 3000, cents: 2000, label: "3,000 credits" },
] as const;
export type CreditPackId = (typeof CREDIT_PACKS)[number]["id"];
export const creditPack = (id: unknown) => CREDIT_PACKS.find((pack) => pack.id === id);

/** Adds credits once per reference. Returns the new balance, or null if this reference was already granted. */
export async function grantCredits(ownerId: string, credits: number, reason: string, reference: string): Promise<number | null> {
  await ensureSchema();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const balance = await client.query<{ credits: number }>("UPDATE app_users SET credits = credits + $2 WHERE id = $1 RETURNING credits", [ownerId, credits]);
    const after = balance.rows[0]?.credits;
    if (after === undefined) { await client.query("ROLLBACK"); return null; }
    const logged = await client.query("INSERT INTO credit_ledger (owner_id, delta, balance_after, reason, reference) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (reference) DO NOTHING", [ownerId, credits, after, reason, reference]);
    if (!logged.rowCount) { await client.query("ROLLBACK"); return null; }
    await client.query("COMMIT");
    return after;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

/** Takes up to `credits` from the balance (never below zero). Returns what was charged and the new balance. */
export async function chargeCredits(ownerId: string, credits: number, reason: string): Promise<{ charged: number; balance: number }> {
  await ensureSchema();
  const result = await db.query<{ charged: number; balance: number }>(
    `WITH current AS (SELECT credits FROM app_users WHERE id = $1 FOR UPDATE),
     updated AS (UPDATE app_users SET credits = credits - LEAST(credits, $2) WHERE id = $1 RETURNING credits)
     SELECT (SELECT credits FROM current) - updated.credits AS charged, updated.credits AS balance FROM updated`,
    [ownerId, credits],
  );
  const row = result.rows[0] ?? { charged: 0, balance: 0 };
  if (row.charged > 0) await db.query("INSERT INTO credit_ledger (owner_id, delta, balance_after, reason) VALUES ($1, $2, $3, $4)", [ownerId, -row.charged, row.balance, reason]);
  return row;
}

export async function creditHistory(ownerId: string, limit = 20) {
  await ensureSchema();
  const result = await db.query<{ delta: number; balance_after: number; reason: string; created_at: Date }>("SELECT delta, balance_after, reason, created_at FROM credit_ledger WHERE owner_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2", [ownerId, limit]);
  return result.rows.map((row) => ({ delta: row.delta, balance: row.balance_after, reason: row.reason, at: row.created_at.toISOString() }));
}

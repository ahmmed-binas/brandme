import { createHash } from "node:crypto";
import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import type { Suggestion, SuggestionPayload } from "./apply";

export const fingerprint = (...parts: string[]) => createHash("sha256").update(parts.map((part) => part.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()).join("|")).digest("hex").slice(0, 32);

export interface NewSuggestion { source: "github" | "research" | "investigator"; title: string; detail?: string | null; sourceUrl?: string | null; payload: SuggestionPayload; fingerprint: string }

/** Stores suggestions, skipping any the owner has already seen (applied, dismissed or pending). */
export async function addSuggestions(ownerId: string, items: NewSuggestion[]): Promise<number> {
  await ensureSchema();
  let added = 0;
  for (const item of items) {
    const result = await db.query(
      `INSERT INTO profile_suggestions (owner_id, source, kind, title, detail, payload, source_url, fingerprint) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (owner_id, fingerprint) DO NOTHING`,
      [ownerId, item.source, item.payload.kind, item.title.slice(0, 300), item.detail?.slice(0, 600) ?? null, JSON.stringify(item.payload), item.sourceUrl ?? null, item.fingerprint],
    );
    added += result.rowCount ?? 0;
  }
  return added;
}

export async function pendingSuggestions(ownerId: string): Promise<Suggestion[]> {
  await ensureSchema();
  const result = await db.query<{ id: string; source: "github" | "research" | "investigator"; title: string; detail: string | null; source_url: string | null; payload: SuggestionPayload; created_at: Date }>(
    "SELECT id, source, title, detail, source_url, payload, created_at FROM profile_suggestions WHERE owner_id = $1 AND status = 'pending' ORDER BY created_at DESC LIMIT 50",
    [ownerId],
  );
  return result.rows.map((row) => ({ id: row.id, source: row.source, title: row.title, detail: row.detail, sourceUrl: row.source_url, payload: row.payload, createdAt: row.created_at.toISOString() }));
}

export async function decideSuggestion(ownerId: string, id: string, status: "applied" | "dismissed"): Promise<boolean> {
  await ensureSchema();
  const result = await db.query("UPDATE profile_suggestions SET status = $3, decided_at = NOW() WHERE id = $1 AND owner_id = $2 AND status = 'pending'", [id, ownerId, status]);
  return Boolean(result.rowCount);
}

/** Everything already on the owner's portfolios, so we don't suggest what's there. */
export async function knownTitles(ownerId: string): Promise<Set<string>> {
  const result = await db.query<{ title: string }>(
    `SELECT DISTINCT lower(item->>'title') AS title FROM portfolios p, LATERAL jsonb_array_elements(COALESCE(p.content->'projects', '[]'::jsonb) || COALESCE(p.content->'highlights', '[]'::jsonb)) item WHERE p.owner_id = $1 AND item ? 'title'`,
    [ownerId],
  );
  return new Set(result.rows.map((row) => row.title?.replace(/[^a-z0-9]+/g, " ").trim()).filter(Boolean));
}

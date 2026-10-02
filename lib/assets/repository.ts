import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import type { CurrentUser } from "@/utils/user-account";

/**
 * Images uploaded in the editor. The browser downsizes and re-encodes them
 * (which also strips location metadata); the server checks the bytes really
 * are an image, enforces the plan's storage, and serves them by URL so saved
 * portfolios stay small and fast to autosave.
 */

export const MAX_ASSET_BYTES = 2_500_000;
const UPLOADS_PER_HOUR = 120;

const SIGNATURES: Array<{ mime: string; ext: string; test: (b: Buffer) => boolean }> = [
  { mime: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", ext: "png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: "image/webp", ext: "webp", test: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP" },
  { mime: "image/gif", ext: "gif", test: (b) => b.subarray(0, 4).toString("ascii") === "GIF8" },
];

export const sniffImage = (bytes: Buffer) => SIGNATURES.find((signature) => signature.test(bytes)) ?? null;
export const assetUrl = (id: string, ext: string) => `/media/${id}.${ext}`;

export type SaveAssetResult = { ok: true; url: string } | { ok: false; status: 413 | 415 | 429 | 507; error: string };

export async function saveAsset(user: CurrentUser, bytes: Buffer): Promise<SaveAssetResult> {
  await ensureSchema();
  const kind = sniffImage(bytes);
  if (!kind) return { ok: false, status: 415, error: "That file isn’t a PNG, JPEG, WebP or GIF image." };
  if (bytes.length > MAX_ASSET_BYTES) return { ok: false, status: 413, error: "That image is too large. Try a smaller one." };
  const usage = await db.query<{ used: string; recent: string }>(
    "SELECT COALESCE(SUM(size), 0) AS used, COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') AS recent FROM portfolio_assets WHERE owner_id = $1",
    [user.id],
  );
  if (Number(usage.rows[0]?.recent ?? 0) >= UPLOADS_PER_HOUR) return { ok: false, status: 429, error: "That’s a lot of uploads in a short time. Please wait a little." };
  if (Number(usage.rows[0]?.used ?? 0) + bytes.length > user.plan.storageMb * 1_000_000) return { ok: false, status: 507, error: `You’ve used the ${user.plan.storageMb} MB of image storage in your plan. Remove unused images or upgrade.` };
  const result = await db.query<{ id: string }>("INSERT INTO portfolio_assets (owner_id, mime, size, data) VALUES ($1, $2, $3, $4) RETURNING id", [user.id, kind.mime, bytes.length, bytes]);
  return { ok: true, url: assetUrl(result.rows[0]!.id, kind.ext) };
}

export async function getAsset(id: string): Promise<{ mime: string; data: Buffer } | null> {
  await ensureSchema();
  const result = await db.query<{ mime: string; data: Buffer }>("SELECT mime, data FROM portfolio_assets WHERE id = $1", [id]);
  return result.rows[0] ?? null;
}

/** Deletes uploads older than a week that no draft or published portfolio refers to. */
export async function deleteOrphanedAssets(): Promise<number> {
  await ensureSchema();
  const result = await db.query(
    `DELETE FROM portfolio_assets a WHERE a.created_at < NOW() - INTERVAL '7 days'
     AND NOT EXISTS (SELECT 1 FROM portfolios p WHERE p.owner_id = a.owner_id
       AND (p.content::text LIKE '%' || a.id::text || '%' OR COALESCE(p.published_content::text, '') LIKE '%' || a.id::text || '%'))`,
  );
  return result.rowCount ?? 0;
}

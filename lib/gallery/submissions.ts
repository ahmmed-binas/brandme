import { unzipSync } from "fflate";
import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import { slugify } from "@/lib/content/markdown";
import { templateCatalog } from "@/lib/templates/catalog";
import type { CurrentUser } from "@/utils/user-account";

/**
 * Templates people submit to the gallery.
 *
 * A submission is a story (the idea, how it was made or prompted, the
 * inspiration, who it suits), a cover image, an optional short clip and the
 * project as a ZIP. Uploads are checked here before they're stored; nothing is
 * public until an admin approves it at /admin/gallery.
 */

export const LICENSES = { MIT: "MIT", "Apache-2.0": "Apache 2.0", "CC-BY-4.0": "Creative Commons BY 4.0" } as const;
export type License = keyof typeof LICENSES;
export type SubmissionStatus = "pending" | "approved" | "changes" | "rejected";

const LIMITS = {
  zipBytes: 20 * 1024 * 1024,
  unzippedBytes: 120 * 1024 * 1024,
  files: 3000,
  coverBytes: 4 * 1024 * 1024,
  clipBytes: 12 * 1024 * 1024,
  pendingPerPerson: 3,
};
const BLOCKED = /\.(exe|dll|bat|cmd|com|scr|msi|msp|ps1|psm1|vbs|vbe|wsf|jar|apk|app|dmg|pkg|deb|rpm|so|dylib|bin|sh|bash|zsh|lnk|reg)$/i;

export class SubmissionError extends Error {
  constructor(message: string, readonly field?: string) { super(message); }
}

export interface ZipReport { files: number; bytes: number; entry: string; list: string[] }

/** Opens the ZIP without trusting it: size limits before unpacking, safe paths, no programs, a real website inside. */
export function checkZip(data: Uint8Array): ZipReport {
  if (data.length > LIMITS.zipBytes) throw new SubmissionError("The ZIP is over 20 MB. Leave out node_modules, build folders and large videos.", "zip");
  if (data[0] !== 0x50 || data[1] !== 0x4b) throw new SubmissionError("That file isn’t a ZIP.", "zip");
  let files = 0;
  let bytes = 0;
  const names: string[] = [];
  try {
    unzipSync(data, {
      filter: (file) => {
        const name = file.name.replace(/\\/g, "/");
        if (name.endsWith("/")) return false;
        files += 1;
        bytes += file.originalSize;
        if (files > LIMITS.files) throw new SubmissionError(`The ZIP has more than ${LIMITS.files} files. Leave out node_modules and build folders.`, "zip");
        if (bytes > LIMITS.unzippedBytes) throw new SubmissionError("Unpacked, the ZIP is over 120 MB. Leave out node_modules and large media.", "zip");
        if (name.startsWith("/") || name.split("/").includes("..") || /^[a-z]:/i.test(name)) throw new SubmissionError("The ZIP contains unsafe file paths.", "zip");
        if (name.split("/").includes("node_modules")) throw new SubmissionError("Please remove the node_modules folder before zipping; people install it themselves.", "zip");
        if (BLOCKED.test(name)) throw new SubmissionError(`Programs and scripts aren’t allowed in templates (${name.split("/").pop()}).`, "zip");
        if (!name.startsWith("__MACOSX/") && !name.endsWith(".DS_Store")) names.push(name);
        return false; // Only the directory is read; nothing is decompressed here.
      },
    });
  } catch (error) {
    if (error instanceof SubmissionError) throw error;
    throw new SubmissionError("That ZIP couldn’t be opened. Try zipping the folder again.", "zip");
  }
  const depth = (name: string) => name.split("/").length;
  const entry = names.filter((name) => /(^|\/)(index\.html|package\.json)$/i.test(name) && depth(name) <= 3).sort((a, b) => depth(a) - depth(b))[0];
  if (!entry) throw new SubmissionError("We couldn’t find an index.html or package.json in the ZIP. Zip the project folder itself.", "zip");
  return { files, bytes, entry, list: names.slice(0, 400) };
}

const startsWith = (data: Uint8Array, bytes: number[], offset = 0) => bytes.every((byte, index) => data[offset + index] === byte);

export function checkCover(data: Uint8Array, mime: string): string {
  if (!data.length) throw new SubmissionError("Add a cover image.", "cover");
  if (data.length > LIMITS.coverBytes) throw new SubmissionError("The cover image is over 4 MB.", "cover");
  const real = startsWith(data, [0x89, 0x50, 0x4e, 0x47]) ? "image/png" : startsWith(data, [0xff, 0xd8, 0xff]) ? "image/jpeg" : startsWith(data, [0x52, 0x49, 0x46, 0x46]) && startsWith(data, [0x57, 0x45, 0x42, 0x50], 8) ? "image/webp" : null;
  if (!real) throw new SubmissionError("Use a PNG, JPG or WebP image for the cover.", "cover");
  void mime;
  return real;
}

export function checkClip(data: Uint8Array): string {
  if (data.length > LIMITS.clipBytes) throw new SubmissionError("The clip is over 12 MB. Keep it to about 10 seconds.", "clip");
  if (startsWith(data, [0x66, 0x74, 0x79, 0x70], 4)) return "video/mp4";
  if (startsWith(data, [0x1a, 0x45, 0xdf, 0xa3])) return "video/webm";
  throw new SubmissionError("Use an MP4 or WebM file for the clip.", "clip");
}

export interface SubmissionText { title: string; summary: string; idea: string; process: string; inspiration: string; audience: string; tags: string[]; license: License; liveUrl: string | null }

export function checkText(raw: Record<string, string>): SubmissionText {
  const text = (key: string, min: number, max: number, label: string) => {
    const value = (raw[key] ?? "").trim();
    if (value.length < min) throw new SubmissionError(`${label} needs at least ${min} characters.`, key);
    if (value.length > max) throw new SubmissionError(`${label} is over ${max} characters.`, key);
    return value;
  };
  const license = (raw.license ?? "MIT") as License;
  if (!(license in LICENSES)) throw new SubmissionError("Choose a licence.", "license");
  const liveUrl = (raw.liveUrl ?? "").trim();
  if (liveUrl && !/^https:\/\/[^\s]+$/i.test(liveUrl)) throw new SubmissionError("The live demo link must start with https://", "liveUrl");
  return {
    title: text("title", 3, 60, "The name"),
    summary: text("summary", 20, 200, "The one-line description"),
    idea: text("idea", 40, 4000, "The idea"),
    process: text("process", 40, 4000, "How you made it"),
    inspiration: text("inspiration", 20, 4000, "The inspiration"),
    audience: text("audience", 20, 2000, "Who it’s for"),
    tags: (raw.tags ?? "").split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean).slice(0, 8).map((tag) => tag.slice(0, 24)),
    license,
    liveUrl: liveUrl || null,
  };
}

const RESERVED_SLUGS = new Set([...templateCatalog.map((template) => template.id), "submit", "mine"]);

async function freeSlug(title: string, exceptId?: string): Promise<string> {
  const base = slugify(title).slice(0, 50) || "template";
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    if (RESERVED_SLUGS.has(slug)) continue;
    const taken = await db.query("SELECT 1 FROM gallery_submissions WHERE slug = $1 AND id IS DISTINCT FROM $2", [slug, exceptId ?? null]);
    if (!taken.rowCount) return slug;
  }
}

export function canSubmit(user: CurrentUser): string | null {
  if (!user.emailVerified) return "Confirm your email address first (see your account page).";
  if (!user.username) return "Choose a username first; it’s shown as the designer’s name.";
  return null;
}

export interface Upload { text: SubmissionText; cover: { data: Uint8Array; mime: string } | null; clip: { data: Uint8Array; mime: string } | null; zip: Uint8Array | null; removeClip?: boolean }

export async function createSubmission(user: CurrentUser, upload: Upload): Promise<{ id: string; slug: string }> {
  await ensureSchema();
  const blocked = canSubmit(user);
  if (blocked) throw new SubmissionError(blocked);
  const pending = await db.query("SELECT 1 FROM gallery_submissions WHERE owner_id = $1 AND status = 'pending'", [user.id]);
  if ((pending.rowCount ?? 0) >= LIMITS.pendingPerPerson) throw new SubmissionError(`You have ${LIMITS.pendingPerPerson} submissions waiting for review. Please wait for those first.`);
  if (!upload.cover) throw new SubmissionError("Add a cover image.", "cover");
  if (!upload.zip) throw new SubmissionError("Add the template as a ZIP file.", "zip");
  const report = checkZip(upload.zip);
  const coverMime = checkCover(upload.cover.data, upload.cover.mime);
  const clipMime = upload.clip ? checkClip(upload.clip.data) : null;
  const slug = await freeSlug(upload.text.title);
  const { text } = upload;
  const result = await db.query<{ id: string }>(
    `INSERT INTO gallery_submissions (owner_id, slug, title, summary, idea, process, inspiration, audience, tags, license, live_url, cover, cover_mime, clip, clip_mime, zip, zip_files)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING id`,
    [user.id, slug, text.title, text.summary, text.idea, text.process, text.inspiration, text.audience, text.tags, text.license, text.liveUrl,
      Buffer.from(upload.cover.data), coverMime, upload.clip ? Buffer.from(upload.clip.data) : null, clipMime, Buffer.from(upload.zip), JSON.stringify(report)],
  );
  return { id: result.rows[0]!.id, slug };
}

/** The owner edits a submission that is waiting or needs changes; it goes back into the review queue. */
export async function updateSubmission(user: CurrentUser, id: string, upload: Upload): Promise<{ slug: string } | null> {
  await ensureSchema();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const row = (await db.query<{ status: SubmissionStatus }>("SELECT status FROM gallery_submissions WHERE id = $1 AND owner_id = $2", [id, user.id])).rows[0];
  if (!row) return null;
  if (row.status === "approved" || row.status === "rejected") throw new SubmissionError(row.status === "approved" ? "Approved templates can’t be changed here; submit a new version instead." : "This submission was declined. You’re welcome to submit a new one.");
  const report = upload.zip ? checkZip(upload.zip) : null;
  const coverMime = upload.cover ? checkCover(upload.cover.data, upload.cover.mime) : null;
  const clipMime = upload.clip ? checkClip(upload.clip.data) : null;
  const slug = await freeSlug(upload.text.title, id);
  const { text } = upload;
  await db.query(
    `UPDATE gallery_submissions SET slug = $2, title = $3, summary = $4, idea = $5, process = $6, inspiration = $7, audience = $8, tags = $9, license = $10, live_url = $11,
       cover = COALESCE($12, cover), cover_mime = COALESCE($13, cover_mime),
       clip = CASE WHEN $18 THEN NULL ELSE COALESCE($14, clip) END, clip_mime = CASE WHEN $18 THEN NULL ELSE COALESCE($15, clip_mime) END,
       zip = COALESCE($16, zip), zip_files = COALESCE($17, zip_files), status = 'pending', updated_at = NOW()
     WHERE id = $1`,
    [id, slug, text.title, text.summary, text.idea, text.process, text.inspiration, text.audience, text.tags, text.license, text.liveUrl,
      upload.cover ? Buffer.from(upload.cover.data) : null, coverMime, upload.clip ? Buffer.from(upload.clip.data) : null, clipMime,
      upload.zip ? Buffer.from(upload.zip) : null, report ? JSON.stringify(report) : null, upload.removeClip === true],
  );
  return { slug };
}

export interface SubmissionSummary {
  id: string; slug: string; title: string; summary: string; idea: string; process: string; inspiration: string; audience: string;
  tags: string[]; license: License; liveUrl: string | null; hasClip: boolean; clipMime: string | null; zip: ZipReport; zipBytes: number;
  status: SubmissionStatus; reviewNote: string | null; createdAt: string; updatedAt: string; reviewedAt: string | null;
  owner: { id: string; username: string | null; name: string | null; email: string | null };
}

const SUMMARY = `s.id, s.slug, s.title, s.summary, s.idea, s.process, s.inspiration, s.audience, s.tags, s.license, s.live_url, s.clip IS NOT NULL AS has_clip, s.clip_mime, s.zip_files, octet_length(s.zip) AS zip_bytes,
  s.status, s.review_note, s.created_at, s.updated_at, s.reviewed_at, u.id AS owner_id, u.username, u.name, u.email`;
interface SummaryRow { id: string; slug: string; title: string; summary: string; idea: string; process: string; inspiration: string; audience: string; tags: string[]; license: License; live_url: string | null; has_clip: boolean; clip_mime: string | null; zip_files: ZipReport; zip_bytes: number; status: SubmissionStatus; review_note: string | null; created_at: Date; updated_at: Date; reviewed_at: Date | null; owner_id: string; username: string | null; name: string | null; email: string | null }

const toSummary = (row: SummaryRow): SubmissionSummary => ({
  id: row.id, slug: row.slug, title: row.title, summary: row.summary, idea: row.idea, process: row.process, inspiration: row.inspiration, audience: row.audience,
  tags: row.tags, license: row.license, liveUrl: row.live_url, hasClip: row.has_clip, clipMime: row.clip_mime, zip: row.zip_files, zipBytes: Number(row.zip_bytes),
  status: row.status, reviewNote: row.review_note, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(), reviewedAt: row.reviewed_at?.toISOString() ?? null,
  owner: { id: row.owner_id, username: row.username, name: row.name, email: row.email },
});

export async function listSubmissions(filter: { ownerId?: string; status?: SubmissionStatus }): Promise<SubmissionSummary[]> {
  await ensureSchema();
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.ownerId) { params.push(filter.ownerId); where.push(`s.owner_id = $${params.length}`); }
  if (filter.status) { params.push(filter.status); where.push(`s.status = $${params.length}`); }
  const result = await db.query<SummaryRow>(`SELECT ${SUMMARY} FROM gallery_submissions s JOIN app_users u ON u.id = s.owner_id ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY s.created_at DESC LIMIT 500`, params);
  return result.rows.map(toSummary);
}

export async function getSubmission(by: { id?: string; slug?: string }): Promise<SubmissionSummary | null> {
  await ensureSchema();
  if (by.id && !/^[0-9a-f-]{36}$/i.test(by.id)) return null;
  const result = await db.query<SummaryRow>(`SELECT ${SUMMARY} FROM gallery_submissions s JOIN app_users u ON u.id = s.owner_id WHERE ${by.id ? "s.id = $1" : "s.slug = $1"}`, [by.id ?? by.slug]);
  return result.rows[0] ? toSummary(result.rows[0]) : null;
}

export async function submissionFile(id: string, kind: "cover" | "clip" | "zip"): Promise<{ data: Buffer; mime: string } | null> {
  await ensureSchema();
  const column = kind === "zip" ? "zip, 'application/zip' AS mime" : `${kind}, ${kind}_mime AS mime`;
  const row = (await db.query<Record<string, Buffer | string | null>>(`SELECT ${column} FROM gallery_submissions WHERE id = $1`, [id])).rows[0];
  const data = row?.[kind] as Buffer | null | undefined;
  return data ? { data, mime: String(row!.mime) } : null;
}

export async function reviewSubmission(id: string, status: Exclude<SubmissionStatus, "pending">, note: string | null, reviewerId: string): Promise<SubmissionSummary | null> {
  await ensureSchema();
  await db.query("UPDATE gallery_submissions SET status = $2, review_note = $3, reviewed_by = $4, reviewed_at = NOW(), updated_at = NOW() WHERE id = $1", [id, status, note, reviewerId]);
  return getSubmission({ id });
}

export async function deleteSubmission(id: string, ownerId: string): Promise<boolean> {
  await ensureSchema();
  return Boolean((await db.query("DELETE FROM gallery_submissions WHERE id = $1 AND owner_id = $2 AND status <> 'approved'", [id, ownerId])).rowCount);
}

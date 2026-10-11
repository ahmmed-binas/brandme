import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import {
  CLIP_DAYS,
  CONSENT_SENTENCE,
  VOICE_STYLES,
  isVoiceStyle,
  type ClipStatus,
  type VoiceState,
  type VoiceStatus,
  type VoiceStyle,
} from "@/lib/tools/voice-config";

/**
 * The free voice tool (/tools/voice): someone uploads a video or recording of
 * themselves, reads a consent sentence into their microphone, and gets a copy
 * of their voice that reads any text aloud.
 *
 * The website only stores and queues. The speaking is done by a worker, a
 * computer with a graphics card running workers/voice/worker.py (Chatterbox,
 * MIT licence). It asks /api/tools/worker/* for jobs and sends the audio back.
 * When no worker has asked for a while, the page says the engine is offline.
 */

export * from "@/lib/tools/voice-config";

/** A worker that asked for work within this many seconds counts as online. */
const ONLINE_SECONDS = 90;
/** A job a worker took but never finished is offered again after this long. */
const STUCK_MINUTES = 10;

/** True when the bytes look like a WAV file (the browser converts every upload to WAV). */
export function isWav(bytes: Buffer): boolean {
  return (
    bytes.length > 44 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WAVE"
  );
}

/** Text as it will be read: no control characters, single spaces. */
export function cleanClipText(text: string): string {
  return text
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function engineOnline(): Promise<boolean> {
  await ensureSchema();
  const result = await db.query<{ online: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM tool_workers WHERE seen_at > NOW() - make_interval(secs => $1)
     ) AS online`,
    [ONLINE_SECONDS],
  );
  return Boolean(result.rows[0]?.online);
}

/** Everything the voice page shows for one account. */
export async function voiceState(userId: string): Promise<VoiceState> {
  await ensureSchema();
  const voice = await db.query<{ status: VoiceStatus; error: string | null; created_at: Date }>(
    "SELECT status, error, created_at FROM voice_profiles WHERE user_id = $1",
    [userId],
  );
  const clips = await db.query<{
    id: string;
    text: string;
    style: VoiceStyle;
    status: ClipStatus;
    error: string | null;
    created_at: Date;
    ahead: string;
  }>(
    `SELECT c.id, c.text, c.style, c.status, c.error, c.created_at,
       (SELECT COUNT(*) FROM voice_clips q
         WHERE q.status = 'queued' AND q.created_at < c.created_at) AS ahead
     FROM voice_clips c
     WHERE c.user_id = $1
     ORDER BY c.created_at DESC
     LIMIT 20`,
    [userId],
  );
  const row = voice.rows[0];
  return {
    engineOnline: await engineOnline(),
    voice: row ? { status: row.status, error: row.error, createdAt: row.created_at.toISOString() } : null,
    clips: clips.rows.map((clip) => ({
      id: clip.id,
      text: clip.text,
      style: isVoiceStyle(clip.style) ? clip.style : "natural",
      status: clip.status,
      error: clip.error,
      createdAt: clip.created_at.toISOString(),
      ahead: clip.status === "queued" ? Number(clip.ahead) : 0,
    })),
  };
}

/** Starts (or restarts) making a voice. Replaces any earlier voice and its clips. */
export async function saveVoice(userId: string, source: Buffer, consent: Buffer): Promise<void> {
  await ensureSchema();
  await db.query("DELETE FROM voice_profiles WHERE user_id = $1", [userId]);
  await db.query(
    `INSERT INTO voice_profiles (user_id, source_audio, consent_audio, consented_at)
     VALUES ($1, $2, $3, NOW())`,
    [userId, source, consent],
  );
}

/** Deletes the voice, its sample and every clip made with it. */
export async function deleteVoice(userId: string): Promise<void> {
  await ensureSchema();
  await db.query("DELETE FROM voice_profiles WHERE user_id = $1", [userId]);
}

/** Queues text to be read in the account's voice. Returns an error message when it can't. */
export async function queueClip(
  userId: string,
  text: string,
  style: VoiceStyle,
): Promise<{ id: string } | { error: string }> {
  await ensureSchema();
  const voice = await db.query<{ id: string; status: VoiceStatus }>(
    "SELECT id, status FROM voice_profiles WHERE user_id = $1",
    [userId],
  );
  const profile = voice.rows[0];
  if (!profile || profile.status !== "ready") return { error: "Your voice isn’t ready yet." };
  const result = await db.query<{ id: string }>(
    "INSERT INTO voice_clips (user_id, profile_id, text, style) VALUES ($1, $2, $3, $4) RETURNING id",
    [userId, profile.id, text, style],
  );
  return { id: result.rows[0]!.id };
}

/** A finished clip's audio, only for the account that made it. */
export async function clipAudio(
  userId: string,
  clipId: string,
): Promise<{ audio: Buffer; type: string } | null> {
  await ensureSchema();
  const result = await db.query<{ audio: Buffer; audio_type: string | null }>(
    "SELECT audio, audio_type FROM voice_clips WHERE id = $1 AND user_id = $2 AND status = 'done'",
    [clipId, userId],
  );
  const row = result.rows[0];
  return row?.audio ? { audio: row.audio, type: row.audio_type ?? "audio/wav" } : null;
}

// ---------------------------------------------------------------------------
// The worker's side
// ---------------------------------------------------------------------------

export type WorkerJob =
  | { type: "voice"; id: string; consentSentence: string }
  | {
      type: "clip";
      id: string;
      voiceId: string;
      text: string;
      settings: (typeof VOICE_STYLES)[VoiceStyle]["settings"];
    };

/** Notes that a worker is online. */
export async function workerSeen(name: string): Promise<void> {
  await ensureSchema();
  await db.query(
    `INSERT INTO tool_workers (name, seen_at) VALUES ($1, NOW())
     ON CONFLICT (name) DO UPDATE SET seen_at = NOW()`,
    [name.slice(0, 60)],
  );
}

const claimable = `(status = 'queued' OR (status = 'working' AND claimed_at < NOW() - INTERVAL '${STUCK_MINUTES} minutes'))`;

/** Hands the next job to a worker: new voices first (they're quick), then clips, oldest first. */
export async function claimJob(): Promise<WorkerJob | null> {
  await ensureSchema();
  const voice = await db.query<{ id: string }>(
    `UPDATE voice_profiles SET status = 'working', claimed_at = NOW(), updated_at = NOW()
     WHERE id = (
       SELECT id FROM voice_profiles WHERE ${claimable}
       ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED
     )
     RETURNING id`,
  );
  if (voice.rows[0]) return { type: "voice", id: voice.rows[0].id, consentSentence: CONSENT_SENTENCE };

  const clip = await db.query<{ id: string; profile_id: string; text: string; style: string }>(
    `UPDATE voice_clips SET status = 'working', claimed_at = NOW()
     WHERE id = (
       SELECT id FROM voice_clips WHERE ${claimable}
       ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED
     )
     RETURNING id, profile_id, text, style`,
  );
  const row = clip.rows[0];
  if (!row) return null;
  const style = isVoiceStyle(row.style) ? row.style : "natural";
  return {
    type: "clip",
    id: row.id,
    voiceId: row.profile_id,
    text: row.text,
    settings: VOICE_STYLES[style].settings,
  };
}

export type VoicePart = "source" | "consent" | "sample";

/** The audio a worker needs: a voice's upload and consent (to make it), or its sample (to speak). */
export async function voiceAudio(voiceId: string, part: VoicePart): Promise<Buffer | null> {
  await ensureSchema();
  const column = { source: "source_audio", consent: "consent_audio", sample: "sample_audio" }[part];
  const result = await db.query<{ audio: Buffer | null }>(
    `SELECT ${column} AS audio FROM voice_profiles WHERE id = $1`,
    [voiceId],
  );
  return result.rows[0]?.audio ?? null;
}

/**
 * Saves a worker's result for a voice. Either way the upload and the consent
 * recording are deleted now: they were only needed to make the voice.
 */
export async function finishVoice(
  voiceId: string,
  result: { sample: Buffer; similarity: number } | { error: string; similarity?: number },
): Promise<void> {
  await ensureSchema();
  const ok = "sample" in result;
  await db.query(
    `UPDATE voice_profiles SET
       status = $2, sample_audio = $3, similarity = $4, error = $5,
       source_audio = NULL, consent_audio = NULL, updated_at = NOW()
     WHERE id = $1`,
    [
      voiceId,
      ok ? "ready" : "failed",
      ok ? result.sample : null,
      result.similarity ?? null,
      ok ? null : result.error.slice(0, 300),
    ],
  );
}

export async function finishClip(
  clipId: string,
  result: { audio: Buffer; type: string } | { error: string },
): Promise<void> {
  await ensureSchema();
  const ok = "audio" in result;
  await db.query(
    `UPDATE voice_clips SET status = $2, audio = $3, audio_type = $4, error = $5, finished_at = NOW()
     WHERE id = $1`,
    [
      clipId,
      ok ? "done" : "failed",
      ok ? result.audio : null,
      ok ? result.type : null,
      ok ? null : result.error.slice(0, 300),
    ],
  );
}

/** Hourly clean-up: clips older than CLIP_DAYS. */
export async function pruneVoiceClips(): Promise<number> {
  await ensureSchema();
  const result = await db.query(
    `DELETE FROM voice_clips WHERE created_at < NOW() - make_interval(days => $1)`,
    [CLIP_DAYS],
  );
  return result.rowCount ?? 0;
}

import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import {
  VOICE_PLANS,
  VOICE_STYLES,
  isBuiltinVoice,
  isVoiceStyle,
  type BuiltinVoiceId,
  type ClipVoice,
  type ClipStatus,
  type VoicePlan,
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

/** Pro (while it's active or in its grace period) gets the Pro limits; everyone else Free. */
export const voicePlanOf = (user: { plan: { id: string } }): VoicePlan =>
  user.plan.id === "pro" ? "pro" : "free";

/** Clips asked for in the last 24 hours (failed ones don't count: those were our fault). */
export async function clipsToday(userId: string): Promise<number> {
  await ensureSchema();
  const result = await db.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM voice_clips
     WHERE user_id = $1 AND status <> 'failed' AND created_at > NOW() - INTERVAL '24 hours'`,
    [userId],
  );
  return Number(result.rows[0]?.count ?? 0);
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
export async function voiceState(userId: string, plan: VoicePlan): Promise<VoiceState> {
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
    builtin_voice: string | null;
  }>(
    `SELECT c.id, c.text, c.style, c.status, c.error, c.created_at, c.builtin_voice,
       (SELECT COUNT(*) FROM voice_clips q
         WHERE q.status = 'queued'
           AND (q.priority > c.priority OR (q.priority = c.priority AND q.created_at < c.created_at))) AS ahead
     FROM voice_clips c
     WHERE c.user_id = $1
     ORDER BY c.created_at DESC
     LIMIT 20`,
    [userId],
  );
  const row = voice.rows[0];
  return {
    engineOnline: await engineOnline(),
    plan,
    clipsToday: await clipsToday(userId),
    voice: row ? { status: row.status, error: row.error, createdAt: row.created_at.toISOString() } : null,
    clips: clips.rows.map((clip) => ({
      id: clip.id,
      voice: isBuiltinVoice(clip.builtin_voice) ? clip.builtin_voice : "mine",
      text: clip.text,
      style: isVoiceStyle(clip.style) ? clip.style : "natural",
      status: clip.status,
      error: clip.error,
      createdAt: clip.created_at.toISOString(),
      ahead: clip.status === "queued" ? Number(clip.ahead) : 0,
    })),
  };
}

/**
 * Starts (or restarts) making a voice. Replaces any earlier voice and its clips.
 * The person confirms with a tick box that it's their own voice; the old spoken
 * consent line was dropped at the owner's request (October 2026), so consent is optional.
 */
export async function saveVoice(
  userId: string,
  source: Buffer,
  consent: Buffer | null = null,
): Promise<void> {
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

/**
 * Queues text to be read in the account's own voice ("mine") or a built-in one.
 * Returns an error message when it can't.
 */
export async function queueClip(
  userId: string,
  text: string,
  style: VoiceStyle,
  plan: VoicePlan,
  voice: ClipVoice = "mine",
): Promise<{ id: string } | { error: string }> {
  await ensureSchema();
  let profileId: string | null = null;
  if (voice === "mine") {
    const own = await db.query<{ id: string; status: VoiceStatus }>(
      "SELECT id, status FROM voice_profiles WHERE user_id = $1",
      [userId],
    );
    const profile = own.rows[0];
    if (!profile || profile.status !== "ready")
      return { error: "Your voice isn’t ready yet. Pick a built-in voice, or make yours first." };
    profileId = profile.id;
  }
  const { priority, keepDays } = VOICE_PLANS[plan];
  const result = await db.query<{ id: string }>(
    `INSERT INTO voice_clips (user_id, profile_id, builtin_voice, text, style, priority, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW() + make_interval(days => $7))
     RETURNING id`,
    [userId, profileId, voice === "mine" ? null : voice, text, style, priority, keepDays],
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
  | { type: "voice"; id: string }
  | {
      type: "clip";
      id: string;
      /** The person's own voice to read in, or null when builtinVoice is set. */
      voiceId: string | null;
      /** A built-in voice (the worker has its reference clip locally). */
      builtinVoice: BuiltinVoiceId | null;
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

/** Hands the next job to a worker: new voices first (they're quick), then clips, Pro first, oldest first. */
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
  if (voice.rows[0]) return { type: "voice", id: voice.rows[0].id };

  const clip = await db.query<{
    id: string;
    profile_id: string | null;
    builtin_voice: string | null;
    text: string;
    style: string;
  }>(
    `UPDATE voice_clips SET status = 'working', claimed_at = NOW()
     WHERE id = (
       SELECT id FROM voice_clips WHERE ${claimable}
       ORDER BY priority DESC, created_at LIMIT 1 FOR UPDATE SKIP LOCKED
     )
     RETURNING id, profile_id, builtin_voice, text, style`,
  );
  const row = clip.rows[0];
  if (!row) return null;
  const style = isVoiceStyle(row.style) ? row.style : "natural";
  return {
    type: "clip",
    id: row.id,
    voiceId: row.profile_id,
    builtinVoice: isBuiltinVoice(row.builtin_voice) ? row.builtin_voice : null,
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
  result: { sample: Buffer; similarity?: number } | { error: string; similarity?: number },
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

/** Hourly clean-up: clips past their plan's keeping time. */
export async function pruneVoiceClips(): Promise<number> {
  await ensureSchema();
  const result = await db.query(`DELETE FROM voice_clips WHERE expires_at < NOW()`);
  return result.rowCount ?? 0;
}

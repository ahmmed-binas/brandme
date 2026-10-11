import { jsonError, route } from "@/lib/api/http";
import { finishClip, finishVoice, isWav } from "@/lib/tools/voice";
import { workerAllowed } from "@/lib/tools/worker-auth";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;
const MAX_AUDIO_BYTES = 8_000_000;

/**
 * A worker reports a finished job. A form with:
 *   type        – "voice" or "clip"
 *   id          – the job's id
 *   error       – what went wrong, shown to the customer (instead of audio)
 *   audio       – the result: the voice's sample (WAV) or the clip (MP3 or WAV)
 *   similarity  – voices only: how alike the upload and the consent recording sound (0–1)
 */
export const POST = route(async (request: Request) => {
  if (!workerAllowed(request)) return jsonError(404, "Not found.");
  const form = await request.formData();
  const type = form.get("type");
  const id = String(form.get("id") ?? "");
  if ((type !== "voice" && type !== "clip") || !UUID.test(id)) return jsonError(400, "Unknown job.");

  const error = String(form.get("error") ?? "");
  const file = form.get("audio");
  const audio = file && typeof file !== "string" ? Buffer.from(await file.arrayBuffer()) : null;
  if (audio && audio.length > MAX_AUDIO_BYTES) return jsonError(413, "That audio is too large.");
  const similarity = Number(form.get("similarity") ?? Number.NaN);
  const score = Number.isFinite(similarity) ? similarity : undefined;

  if (type === "voice") {
    if (error) await finishVoice(id, { error, similarity: score });
    else if (audio && isWav(audio) && score !== undefined)
      await finishVoice(id, { sample: audio, similarity: score });
    else return jsonError(422, "Send a WAV sample and a similarity, or an error.");
  } else {
    if (error) await finishClip(id, { error });
    else if (audio) await finishClip(id, { audio, type: isWav(audio) ? "audio/wav" : "audio/mpeg" });
    else return jsonError(422, "Send the audio or an error.");
  }
  return Response.json({ ok: true });
});

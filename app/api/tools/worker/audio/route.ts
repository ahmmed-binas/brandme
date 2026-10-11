import { jsonError, route } from "@/lib/api/http";
import { voiceAudio, type VoicePart } from "@/lib/tools/voice";
import { workerAllowed } from "@/lib/tools/worker-auth";

export const dynamic = "force-dynamic";

const PARTS = new Set<string>(["source", "consent", "sample"]);
const UUID = /^[0-9a-f-]{36}$/i;

/** A voice's audio for the worker: ?voice=<id>&part=source|consent|sample (WAV). */
export const GET = route(async (request: Request) => {
  if (!workerAllowed(request)) return jsonError(404, "Not found.");
  const params = new URL(request.url).searchParams;
  const voiceId = params.get("voice") ?? "";
  const part = params.get("part") ?? "";
  if (!UUID.test(voiceId) || !PARTS.has(part))
    return jsonError(400, "Ask for ?voice=<id>&part=source|consent|sample");
  const audio = await voiceAudio(voiceId, part as VoicePart);
  if (!audio) return jsonError(404, "Not found.");
  return new Response(new Uint8Array(audio), { headers: { "Content-Type": "audio/wav" } });
});

import { jsonError, readJson, route } from "@/lib/api/http";
import { rateLimit } from "@/lib/security/rate-limit";
import {
  CLIPS_PER_DAY,
  MAX_CLIP_CHARS,
  cleanClipText,
  isVoiceStyle,
  queueClip,
  voiceState,
} from "@/lib/tools/voice";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

/** Queues text to be read aloud in the account's voice. Body: { text, style }. */
export const POST = route(async (request: Request) => {
  if (!databaseConfigured()) return jsonError(503, "The voice tool isn’t set up on this server.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to use your voice.");

  const body = await readJson(request, 4_000);
  if (body instanceof Response) return body;
  const { text: raw, style } = body as { text?: unknown; style?: unknown };
  const text = typeof raw === "string" ? cleanClipText(raw) : "";
  if (!text) return jsonError(422, "Type something for your voice to say.");
  if (text.length > MAX_CLIP_CHARS)
    return jsonError(422, `Keep it under ${MAX_CLIP_CHARS} characters, and split longer text into parts.`);
  if (!(await rateLimit(`voice-clip:${user.id}`, CLIPS_PER_DAY, 86_400)))
    return jsonError(429, `That’s ${CLIPS_PER_DAY} clips today, the daily limit. More tomorrow.`);

  const queued = await queueClip(user.id, text, isVoiceStyle(style) ? style : "natural");
  if ("error" in queued) return jsonError(409, queued.error);
  return Response.json(await voiceState(user.id), { status: 201 });
});

import { jsonError, readJson, route } from "@/lib/api/http";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import {
  FREE_CLIPS_PER_IP,
  VOICE_PLANS,
  cleanClipText,
  clipsToday,
  isVoiceStyle,
  queueClip,
  voicePlanOf,
  voiceState,
} from "@/lib/tools/voice";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

/** Queues text to be read aloud in the account's voice. Body: { text, style }. */
export const POST = route(async (request: Request) => {
  if (!databaseConfigured()) return jsonError(503, "The voice tool isn’t set up on this server.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to use your voice.");
  const plan = voicePlanOf(user);
  const limits = VOICE_PLANS[plan];

  const body = await readJson(request, 8_000);
  if (body instanceof Response) return body;
  const { text: raw, style } = body as { text?: unknown; style?: unknown };
  const text = typeof raw === "string" ? cleanClipText(raw) : "";
  if (!text) return jsonError(422, "Type something for your voice to say.");
  if (text.length > limits.maxChars)
    return jsonError(
      422,
      plan === "pro"
        ? `Keep it under ${limits.maxChars} characters, and split longer text into parts.`
        : `Free clips are up to ${limits.maxChars} characters. Pro reads up to ${VOICE_PLANS.pro.maxChars}.`,
    );

  if ((await clipsToday(user.id)) >= limits.clipsPerDay)
    return jsonError(
      429,
      plan === "pro"
        ? `That’s ${limits.clipsPerDay} clips today, the daily limit. More tomorrow.`
        : `That’s your ${limits.clipsPerDay} free clips for today. More tomorrow, or go Pro for ${VOICE_PLANS.pro.clipsPerDay} a day.`,
    );
  // Free accounts also share a limit per internet connection, so new accounts can't get round it.
  if (plan === "free" && !(await rateLimit(`voice-clip-ip:${clientIp(request)}`, FREE_CLIPS_PER_IP, 86_400)))
    return jsonError(429, "Too many free clips from this connection today. Please try again tomorrow.");

  const queued = await queueClip(user.id, text, isVoiceStyle(style) ? style : "natural", plan);
  if ("error" in queued) return jsonError(409, queued.error);
  return Response.json(await voiceState(user.id, plan), { status: 201 });
});

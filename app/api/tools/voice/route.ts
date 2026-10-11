import { jsonError, route } from "@/lib/api/http";
import { rateLimit } from "@/lib/security/rate-limit";
import {
  MAX_CONSENT_BYTES,
  MAX_SOURCE_BYTES,
  VOICE_PLANS,
  deleteVoice,
  isWav,
  saveVoice,
  voicePlanOf,
  voiceState,
} from "@/lib/tools/voice";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

export const dynamic = "force-dynamic";

const notSetUp = () => jsonError(503, "The voice tool isn’t set up on this server.");
const signInFirst = () => jsonError(401, "Sign in to make your voice.");

/** The account's voice, its recent clips, and whether the engine is online. */
export const GET = route(async () => {
  if (!databaseConfigured()) return notSetUp();
  const user = await getCurrentUser();
  if (!user) return signInFirst();
  return Response.json(await voiceState(user.id, voicePlanOf(user)));
});

/**
 * Starts making a voice. A form with:
 *   source  – the sound of the uploaded video or recording, as WAV (made in the browser)
 *   consent – the consent sentence read into the microphone, as WAV
 *   agree   – "yes": the person confirmed it is their own voice
 */
export const POST = route(async (request: Request) => {
  if (!databaseConfigured()) return notSetUp();
  const user = await getCurrentUser();
  if (!user) return signInFirst();
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_SOURCE_BYTES + MAX_CONSENT_BYTES + 100_000)
    return jsonError(413, "That recording is too long. Two minutes is plenty.");
  const { voicesPerDay } = VOICE_PLANS[voicePlanOf(user)];
  if (!(await rateLimit(`voice-make:${user.id}`, voicesPerDay, 86_400)))
    return jsonError(429, `You can make your voice ${voicesPerDay} times a day. Try again tomorrow.`);

  const form = await request.formData();
  if (form.get("agree") !== "yes") return jsonError(422, "Please confirm that this is your own voice.");
  const source = await fileBytes(form.get("source"));
  const consent = await fileBytes(form.get("consent"));
  if (!source || !isWav(source) || source.length > MAX_SOURCE_BYTES)
    return jsonError(422, "We couldn’t read the sound of your video. Try another file.");
  if (!consent || !isWav(consent) || consent.length > MAX_CONSENT_BYTES)
    return jsonError(422, "Please record the consent sentence first.");

  await saveVoice(user.id, source, consent);
  return Response.json(await voiceState(user.id, voicePlanOf(user)), { status: 201 });
});

/** Deletes the voice and every clip made with it. */
export const DELETE = route(async () => {
  if (!databaseConfigured()) return notSetUp();
  const user = await getCurrentUser();
  if (!user) return signInFirst();
  await deleteVoice(user.id);
  return Response.json(await voiceState(user.id, voicePlanOf(user)));
});

async function fileBytes(value: FormDataEntryValue | null): Promise<Buffer | null> {
  if (!value || typeof value === "string") return null;
  return Buffer.from(await value.arrayBuffer());
}

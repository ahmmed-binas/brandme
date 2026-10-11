import { jsonError, route } from "@/lib/api/http";
import { clipAudio } from "@/lib/tools/voice";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

const UUID = /^[0-9a-f-]{36}$/i;

/** A finished clip's audio, for the account that made it. ?download=1 saves it as a file. */
export const GET = route(async (request: Request, context: { params: Promise<{ clipId: string }> }) => {
  if (!databaseConfigured()) return jsonError(404, "Not found.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to hear your clips.");
  const { clipId } = await context.params;
  if (!UUID.test(clipId)) return jsonError(404, "Not found.");
  const clip = await clipAudio(user.id, clipId);
  if (!clip) return jsonError(404, "Not found.");

  const extension = clip.type === "audio/mpeg" ? "mp3" : "wav";
  const download = new URL(request.url).searchParams.has("download");
  const filename = `my-voice-${clipId.slice(0, 8)}.${extension}`;
  return new Response(new Uint8Array(clip.audio), {
    headers: {
      "Content-Type": clip.type,
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
    },
  });
});

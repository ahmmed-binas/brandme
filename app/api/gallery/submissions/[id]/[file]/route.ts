import { jsonError, route } from "@/lib/api/http";
import { getSubmission, submissionFile } from "@/lib/gallery/submissions";
import { countDownload } from "@/lib/templates/ratings";
import { getCurrentUser } from "@/utils/user-account";

/**
 * A submission's cover, clip or ZIP. Public once approved; before that only
 * its owner and admins can see it. ZIP downloads of approved templates are counted.
 */
export const GET = route(async (_request: Request, { params }: { params: Promise<{ id: string; file: string }> }) => {
  const { id, file } = await params;
  if (file !== "cover" && file !== "clip" && file !== "zip") return jsonError(404, "Not found.");
  const submission = await getSubmission({ id });
  if (!submission) return jsonError(404, "Not found.");
  if (submission.status !== "approved") {
    const user = await getCurrentUser();
    if (!user || (user.id !== submission.owner.id && !user.isAdmin)) return jsonError(404, "Not found.");
  }
  const stored = await submissionFile(id, file);
  if (!stored) return jsonError(404, "Not found.");
  if (file === "zip" && submission.status === "approved") await countDownload(`community:${submission.slug}`).catch(() => undefined);
  return new Response(new Uint8Array(stored.data), {
    headers: {
      "Content-Type": stored.mime,
      "Content-Length": String(stored.data.length),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": submission.status === "approved" && file !== "zip" ? "public, max-age=86400" : "private, no-store",
      ...(file === "zip" ? { "Content-Disposition": `attachment; filename="${submission.slug}-template.zip"` } : {}),
    },
  });
});

import { jsonError, readJson, route } from "@/lib/api/http";
import { isModeratorEmail } from "@/lib/community/rules";
import { reviewSubmission } from "@/lib/gallery/submissions";
import { sendMail } from "@/lib/email/mailer";
import { siteUrl } from "@/lib/site";
import { brand } from "@/lib/brand";
import { getCurrentUser } from "@/utils/user-account";

const STATUSES = ["approved", "changes", "rejected"] as const;

/** Approve, ask for changes on, or decline a gallery submission. The designer is emailed. */
export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  if (!user || !isModeratorEmail(user.email)) return jsonError(404, "Not found.");
  const body = await readJson(request, 4_000);
  if (body instanceof Response) return body;
  const { status, note } = (body ?? {}) as { status?: unknown; note?: unknown };
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) return jsonError(422, "Choose approve, changes or decline.");
  const text = typeof note === "string" ? note.trim().slice(0, 2000) : "";
  if (status !== "approved" && !text) return jsonError(422, "Tell the designer why, so they can improve it.");
  const submission = await reviewSubmission((await params).id, status as (typeof STATUSES)[number], text || null, user.id);
  if (!submission) return jsonError(404, "Not found.");
  if (submission.owner.email) {
    const lines = {
      approved: [`Good news: “${submission.title}” is now live in the ${brand.name} gallery.`, `${siteUrl}/gallery/${submission.slug}`, text ? `A note from us: ${text}` : ""],
      changes: [`Thanks for submitting “${submission.title}”. It’s nearly there; we’d like a few changes before it goes into the gallery:`, text, `Update it here: ${siteUrl}/gallery/submit`],
      rejected: [`Thanks for submitting “${submission.title}”. We’ve decided not to add it to the gallery this time:`, text, "You’re welcome to submit something new."],
    }[status as (typeof STATUSES)[number]];
    await sendMail({ to: submission.owner.email, subject: status === "approved" ? `“${submission.title}” is in the gallery` : `About your template “${submission.title}”`, text: [`Hi ${submission.owner.name ?? submission.owner.username ?? "there"},`, ...lines.filter(Boolean), `— ${brand.name}`].join("\n\n") }).catch((error) => console.error("Review email failed", error));
  }
  return Response.json({ ok: true, status: submission.status });
});

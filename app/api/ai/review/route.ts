import { jsonError, readJson, route } from "@/lib/api/http";
import { openAi, releaseRequest, settleAi, sumUsage } from "@/lib/ai/metering";
import { MAX_REVIEW_CHARS, reviewPost } from "@/lib/ai/post-reviewer";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

/** Rowan reviews a blog post draft. Paid like every AI request: credits or the owner's own key. */
export const POST = route(async (request: Request) => {
  if (!databaseConfigured()) return jsonError(503, "Reviews aren’t switched on for this site yet.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to ask for a review.");
  const body = await readJson(request, MAX_REVIEW_CHARS + 5_000);
  if (body instanceof Response) return body;
  const { title, body: text, excerpt } = (body ?? {}) as { title?: unknown; body?: unknown; excerpt?: unknown };
  if (typeof text !== "string") return jsonError(422, "Nothing to review yet.");

  const gate = await openAi(user);
  if (!gate.ok) return jsonError(gate.status, gate.error);
  try {
    const result = await reviewPost(gate.access.client, { title: typeof title === "string" ? title.slice(0, 300) : "", body: text, excerpt: typeof excerpt === "string" ? excerpt.slice(0, 500) : "" });
    const bill = await settleAi(gate.access, result.usage ? sumUsage(result.usage) : null, "Post review (Rowan)");
    if (!result.ok) {
      if (!result.usage) await releaseRequest(user.id);
      return jsonError(result.status, result.error);
    }
    return Response.json({ review: result.review, charged: bill.charged, credits: bill.balance });
  } catch (error) {
    await releaseRequest(user.id);
    throw error;
  }
});

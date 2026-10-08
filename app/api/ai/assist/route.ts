import { jsonError, readJson, route } from "@/lib/api/http";
import { assistWithContent } from "@/lib/ai/portfolio-assistant";
import { openAi, platformAiConfigured, releaseRequest, settleAi, sumUsage } from "@/lib/ai/metering";
import { MAX_CONTENT_BYTES, validateContent } from "@/lib/portfolio/schema";
import { isTemplateId } from "@/lib/templates/catalog";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

/** Whether the assistant can run for this visitor, and how it would be paid for. */
export const GET = route(async () => {
  if (!databaseConfigured()) return Response.json({ available: false });
  const user = await getCurrentUser().catch(() => null);
  return Response.json({
    available: platformAiConfigured() || Boolean(user?.hasOwnKey),
    credits: user?.credits ?? null,
    ownKey: user?.hasOwnKey ?? false,
  });
});

/** Rewrites portfolio copy from a plain-language request. Paid with credits or the user's own key. */
export const POST = route(async (request: Request) => {
  if (!databaseConfigured()) return jsonError(503, "The AI assistant is not configured on this server.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to use the AI assistant.");

  const body = await readJson(request, MAX_CONTENT_BYTES + 10_000);
  if (body instanceof Response) return body;
  const { templateId, content, instruction } = (body ?? {}) as { templateId?: unknown; content?: unknown; instruction?: unknown };
  if (typeof templateId !== "string" || !isTemplateId(templateId)) return jsonError(404, "Unknown template.");
  if (typeof instruction !== "string" || !instruction.trim()) return jsonError(422, "Tell the assistant what to change.");
  if (instruction.length > 1000) return jsonError(422, "Keep requests under 1,000 characters.");
  const validation = validateContent(templateId, content);
  if (!validation.ok) return jsonError(422, validation.error);

  const gate = await openAi(user);
  if (!gate.ok) return jsonError(gate.status, gate.error);
  try {
    const result = await assistWithContent(gate.access.client, validation.content, instruction.trim());
    const bill = await settleAi(gate.access, result.usage ? sumUsage(result.usage) : null, "AI edit");
    if (!result.ok) {
      if (!result.usage) await releaseRequest(user.id);
      return jsonError(result.status, result.error);
    }
    // Re-validate: the assistant's output passes the same gate as anything a user types.
    const checked = validateContent(templateId, result.content);
    if (!checked.ok) return jsonError(502, "The assistant produced content that could not be used. Please try again.");
    return Response.json({ content: checked.content, reply: result.reply, changed: result.changed, charged: bill.charged, credits: bill.balance });
  } catch (error) {
    await releaseRequest(user.id);
    throw error;
  }
});

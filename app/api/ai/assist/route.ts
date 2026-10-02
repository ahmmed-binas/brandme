import { jsonError, readJson } from "@/lib/api/http";
import { assistantConfigured, assistWithContent } from "@/lib/ai/portfolio-assistant";
import { consumeAiEdit, refundAiEdit } from "@/lib/portfolio/repository";
import { MAX_CONTENT_BYTES, validateContent } from "@/lib/portfolio/schema";
import { isTemplateId } from "@/lib/templates/catalog";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

/** Whether the AI assistant is available, so the editor can offer it or fall back to quick actions. */
export async function GET() {
  return Response.json({ available: assistantConfigured() && databaseConfigured() });
}

/** Rewrites portfolio copy from a plain-language request. Signed-in users only, metered per plan. */
export async function POST(request: Request) {
  if (!assistantConfigured() || !databaseConfigured()) return jsonError(503, "The AI assistant is not configured on this server.");
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

  const usage = await consumeAiEdit(user);
  if (!usage.allowed) return jsonError(429, `You've used today's ${user.plan.aiEditsPerDay} AI edits on the ${user.plan.name} plan. They reset at midnight UTC.`);

  try {
    const result = await assistWithContent(validation.content, instruction.trim());
    if (!result.ok) {
      await refundAiEdit(user.id);
      return jsonError(result.status, result.error);
    }
    // Re-validate: the assistant's output passes the same gate as anything a user types.
    const checked = validateContent(templateId, result.content);
    if (!checked.ok) {
      await refundAiEdit(user.id);
      return jsonError(502, "The assistant produced content that could not be used. Please try again.");
    }
    if (!result.changed) await refundAiEdit(user.id);
    return Response.json({ content: checked.content, reply: result.reply, changed: result.changed, remaining: result.changed ? usage.remaining : usage.remaining + 1 });
  } catch (error) {
    await refundAiEdit(user.id);
    throw error;
  }
}

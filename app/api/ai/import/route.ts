import { jsonError, readJson } from "@/lib/api/http";
import { assistantConfigured, extractProfile } from "@/lib/ai/portfolio-assistant";
import { compactProfile } from "@/lib/import/profile";
import { consumeAiEdit, refundAiEdit } from "@/lib/portfolio/repository";
import { standardContentSchema } from "@/lib/portfolio/schema";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

const MAX_TEXT = 40_000;

/** Free text (CV, LinkedIn About, bio) → structured portfolio content. Counts as one AI edit. */
export async function POST(request: Request) {
  if (!assistantConfigured() || !databaseConfigured()) return jsonError(503, "The AI assistant is not configured on this server.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to import with AI.");
  const body = await readJson(request, MAX_TEXT * 4 + 1_000);
  if (body instanceof Response) return body;
  const text = String((body as { text?: unknown } | null)?.text ?? "").trim();
  if (text.length < 40) return jsonError(422, "Paste a bit more text — at least a few sentences about yourself.");
  if (text.length > MAX_TEXT) return jsonError(422, "That text is too long. Paste up to about 6,000 words.");

  const usage = await consumeAiEdit(user);
  if (!usage.allowed) return jsonError(429, `You've used today's ${user.plan.aiEditsPerDay} AI edits on the ${user.plan.name} plan. They reset at midnight UTC.`);
  try {
    const result = await extractProfile(text);
    if (!result.ok) { await refundAiEdit(user.id); return jsonError(result.status, result.error); }
    // Same gate as anything a user types: drops unknown fields and unsafe links.
    const { location, ...content } = result.profile;
    const parsed = standardContentSchema.safeParse(content);
    if (!parsed.success) { await refundAiEdit(user.id); return jsonError(502, "The assistant returned content that could not be used. Please try again."); }
    return Response.json({ profile: compactProfile({ ...parsed.data, location: typeof location === "string" ? location : undefined }), remaining: usage.remaining });
  } catch (error) {
    await refundAiEdit(user.id);
    throw error;
  }
}

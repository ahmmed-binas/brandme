import { jsonError, readJson, route } from "@/lib/api/http";
import { extractProfile } from "@/lib/ai/portfolio-assistant";
import { openAi, releaseRequest, settleAi, sumUsage } from "@/lib/ai/metering";
import { compactProfile } from "@/lib/import/profile";
import { groundProfile } from "@/lib/import/grounding";
import { standardContentSchema } from "@/lib/portfolio/schema";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

const MAX_TEXT = 40_000;

/** Free text (CV, LinkedIn About, bio) → structured portfolio content. Paid with credits or the user's own key. */
export const POST = route(async (request: Request) => {
  if (!databaseConfigured()) return jsonError(503, "The AI assistant is not configured on this server.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to import with AI.");
  const body = await readJson(request, MAX_TEXT * 4 + 1_000);
  if (body instanceof Response) return body;
  const text = String((body as { text?: unknown } | null)?.text ?? "").trim();
  if (text.length < 40) return jsonError(422, "Paste a bit more text — at least a few sentences about yourself.");
  if (text.length > MAX_TEXT) return jsonError(422, "That text is too long. Paste up to about 6,000 words.");

  const gate = await openAi(user);
  if (!gate.ok) return jsonError(gate.status, gate.error);
  try {
    const result = await extractProfile(gate.access.client, text);
    const bill = await settleAi(gate.access, result.usage ? sumUsage(result.usage) : null, "AI import");
    if (!result.ok) {
      if (!result.usage) await releaseRequest(user.id);
      return jsonError(result.status, result.error);
    }
    // Same gate as anything a user types: drops unknown fields and unsafe links.
    const { location, ...content } = result.profile;
    const parsed = standardContentSchema.safeParse(content);
    if (!parsed.success) return jsonError(502, "The assistant returned content that could not be used. Please try again.");
    // Anything the text doesn't actually contain (a link, an employer, a year…) is dropped.
    const { profile, removed } = groundProfile({ ...parsed.data, location: typeof location === "string" ? location : undefined }, text);
    if (removed.length) console.info(`AI import: dropped ${removed.length} unsupported item(s)`);
    return Response.json({ profile: compactProfile(profile), removed: removed.length, charged: bill.charged, credits: bill.balance });
  } catch (error) {
    await releaseRequest(user.id);
    throw error;
  }
});

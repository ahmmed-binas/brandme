import { jsonError, readJson, route } from "@/lib/api/http";
import { keyHint, verifyKey, type AiProviderId } from "@/lib/ai/provider";
import { encryptSecret } from "@/lib/security/secrets";
import { rateLimit } from "@/lib/security/rate-limit";
import { db } from "@/utils/db";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

/**
 * Saves the owner's own AI key: Claude (Anthropic) or OpenAI. AI requests then
 * run on their account with that company instead of using credits. The key is
 * checked with the provider first, encrypted at rest (AES-256-GCM), and never
 * sent back to the browser; only a short hint like “sk-proj…a1b2” is shown.
 */
export const PUT = route(async (request: Request) => {
  if (!databaseConfigured()) return jsonError(503, "Accounts are not configured on this server.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in first.");
  // Each attempt calls the provider; stop anyone using this to test stolen keys.
  if (!(await rateLimit(`ai-key:${user.id}`, 10, 3600))) return jsonError(429, "Too many attempts. Please wait an hour and try again.");
  const body = await readJson(request, 1_000);
  if (body instanceof Response) return body;
  const input = (body ?? {}) as { key?: unknown; provider?: unknown };
  const provider: AiProviderId = input.provider === "openai" ? "openai" : "anthropic";
  const key = String(input.key ?? "").trim();
  const check = await verifyKey(provider, key);
  if (!check.ok) return jsonError(422, check.error);
  await db.query(
    "UPDATE app_users SET ai_key_enc = $2, ai_key_hint = $3, ai_key_provider = $4, ai_key_model = $5, ai_key_saved_at = NOW() WHERE id = $1",
    [user.id, encryptSecret(key), keyHint(key), provider, check.model],
  );
  return Response.json({ saved: true, provider, hint: keyHint(key), model: check.model });
});

export const DELETE = route(async () => {
  if (!databaseConfigured()) return jsonError(503, "Accounts are not configured on this server.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in first.");
  await db.query("UPDATE app_users SET ai_key_enc = NULL, ai_key_hint = NULL, ai_key_model = NULL, ai_key_saved_at = NULL, ai_key_provider = 'anthropic' WHERE id = $1", [user.id]);
  return Response.json({ removed: true });
});

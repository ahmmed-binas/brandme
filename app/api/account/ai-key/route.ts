import { jsonError, readJson, route } from "@/lib/api/http";
import { verifyAnthropicKey } from "@/lib/ai/metering";
import { encryptSecret, secretHint } from "@/lib/security/secrets";
import { db } from "@/utils/db";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

/**
 * Saves the owner's own Claude API key. AI requests then run on their
 * Anthropic account instead of using credits. The key is checked with
 * Anthropic, encrypted at rest, and never sent back to the browser.
 */
export const PUT = route(async (request: Request) => {
  if (!databaseConfigured()) return jsonError(503, "Accounts are not configured on this server.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in first.");
  const body = await readJson(request, 1_000);
  if (body instanceof Response) return body;
  const key = String((body as { key?: unknown } | null)?.key ?? "").trim();
  const check = await verifyAnthropicKey(key);
  if (!check.ok) return jsonError(422, check.error);
  await db.query("UPDATE app_users SET anthropic_key_enc = $2, anthropic_key_hint = $3 WHERE id = $1", [user.id, encryptSecret(key), secretHint(key)]);
  return Response.json({ saved: true, hint: secretHint(key) });
});

export const DELETE = route(async () => {
  if (!databaseConfigured()) return jsonError(503, "Accounts are not configured on this server.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in first.");
  await db.query("UPDATE app_users SET anthropic_key_enc = NULL, anthropic_key_hint = NULL WHERE id = $1", [user.id]);
  return Response.json({ removed: true });
});

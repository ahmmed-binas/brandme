import { jsonError, readJson, route } from "@/lib/api/http";
import { requestReset, tooManyAttempts } from "@/lib/accounts/passwords";

/** Emails a reset link if the address has a password account. The answer is the same either way. */
export const POST = route(async (request: Request) => {
  const body = await readJson(request, 1_000);
  if (body instanceof Response) return body;
  const email = String((body as { email?: unknown } | null)?.email ?? "").trim().toLowerCase();
  if (!email) return jsonError(422, "Enter your email address.");
  if (!tooManyAttempts(`forgot:${email}`, 5, 60 * 60_000)) await requestReset(email);
  return Response.json({ ok: true });
});

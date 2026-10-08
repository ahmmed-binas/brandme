import { jsonError, readJson, route } from "@/lib/api/http";
import { requestReset } from "@/lib/accounts/passwords";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

/** Emails a reset link if the address has a password account. The answer is the same either way. */
export const POST = route(async (request: Request) => {
  const body = await readJson(request, 1_000);
  if (body instanceof Response) return body;
  const email = String((body as { email?: unknown } | null)?.email ?? "").trim().toLowerCase();
  if (!email) return jsonError(422, "Enter your email address.");
  // Per address and per visitor, so nobody can use this to bombard inboxes. The answer stays the same either way.
  if (await rateLimit(`forgot:${email}`, 5, 3600) && await rateLimit(`forgot-ip:${clientIp(request)}`, 20, 3600)) await requestReset(email);
  return Response.json({ ok: true });
});

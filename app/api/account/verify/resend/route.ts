import { jsonError, route } from "@/lib/api/http";
import { sendVerification, tooManyAttempts } from "@/lib/accounts/passwords";
import { getCurrentUser } from "@/utils/user-account";

export const POST = route(async () => {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in first.");
  if (user.emailVerified) return Response.json({ ok: true, already: true });
  if (tooManyAttempts(`verify:${user.id}`, 3, 30 * 60_000)) return jsonError(429, "We’ve sent a few already. Check your spam folder, or try again in half an hour.");
  await sendVerification(user.id);
  return Response.json({ ok: true });
});

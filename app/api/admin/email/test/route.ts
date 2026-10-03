import { jsonError, readJson, route } from "@/lib/api/http";
import { tooManyAttempts } from "@/lib/accounts/passwords";
import { sendTestMail } from "@/lib/email/mailer";
import { getCurrentUser } from "@/utils/user-account";

/** Superadmin only: log in to the mail server and send a test email. */
export const POST = route(async (request: Request) => {
  const user = await getCurrentUser();
  if (!user?.isSuperadmin) return jsonError(404, "Not found.");
  if (tooManyAttempts(`smtp-test:${user.id}`, 5, 10 * 60_000)) return jsonError(429, "That’s a lot of test emails. Wait ten minutes and try again.");
  const parsed = await readJson(request, 2_000);
  if (parsed instanceof Response) return parsed;
  const body = (parsed ?? {}) as { to?: unknown };
  const to = typeof body.to === "string" && body.to.trim() ? body.to.trim() : user.email;
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) return jsonError(422, "Enter a valid email address.");
  try {
    await sendTestMail(to);
  } catch (error) {
    return jsonError(502, explain(error as Error & { code?: string; responseCode?: number }));
  }
  return Response.json({ ok: true, to });
});

/** Turns the mail server's error into something the owner can act on. */
function explain(error: Error & { code?: string; responseCode?: number }): string {
  const raw = error.message.slice(0, 300);
  if (error.code === "EAUTH" || error.responseCode === 535) return `The mail server refused the username or password. Check SMTP_USER (usually the full email address) and SMTP_PASSWORD. (${raw})`;
  if (error.code === "ESOCKET" && /wrong version number|ssl3_get_record/i.test(raw)) return `Port and SMTP_SECURE don’t match: use 465 with SMTP_SECURE=true, or 587 with SMTP_SECURE=false. (${raw})`;
  if (error.code === "ETIMEDOUT" || error.code === "ECONNREFUSED" || error.code === "ECONNECTION" || error.code === "ESOCKET") return `Couldn’t reach ${process.env.SMTP_HOST}:${process.env.SMTP_PORT ?? 587}. Check SMTP_HOST and SMTP_PORT, and that your server’s host allows outgoing mail on that port. (${raw})`;
  if (error.code === "EDNS" || /ENOTFOUND/.test(raw)) return `There’s no mail server called ${process.env.SMTP_HOST}. Check SMTP_HOST. (${raw})`;
  if (error.responseCode && error.responseCode >= 550) return `The server logged in but wouldn’t send. SMTP_FROM usually has to be the same mailbox as SMTP_USER (or an alias of it). (${raw})`;
  return raw;
}

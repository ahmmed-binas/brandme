import { jsonError, readJson, route } from "@/lib/api/http";
import { sendMail, supportInbox } from "@/lib/email/mailer";
import { bearerMatches } from "@/lib/security/bearer";
import { rateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

/** Emails a day the agent may send the owner. */
const EMAILS_PER_DAY = 10;

/**
 * The owner's agent emails the owner: suggestions, decisions it needs, reports.
 * Body: { subject, text }. It can only ever write to the owner's own inbox
 * (SMTP_TO), never to anyone else, and at most EMAILS_PER_DAY times a day.
 */
export const POST = route(async (request: Request) => {
  if (!bearerMatches(request, "AGENT_TOKEN")) return jsonError(404, "Not found.");
  const to = supportInbox();
  if (!to) return jsonError(503, "Set SMTP_TO (the owner's inbox) first.");

  const body = await readJson(request, 40_000);
  if (body instanceof Response) return body;
  const { subject, text } = body as { subject?: unknown; text?: unknown };
  if (typeof subject !== "string" || !subject.trim() || typeof text !== "string" || !text.trim())
    return jsonError(422, "Send { subject, text }.");
  if (!(await rateLimit("agent-email", EMAILS_PER_DAY, 86_400)))
    return jsonError(429, `That's ${EMAILS_PER_DAY} emails today. Save the rest for tomorrow's summary.`);

  await sendMail({
    to,
    subject: `[Ahmed Agent] ${subject.trim().slice(0, 150)}`,
    text: text.slice(0, 30_000),
  });
  return Response.json({ ok: true });
});

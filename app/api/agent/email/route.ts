import { randomUUID } from "node:crypto";
import { jsonError, readJson, route } from "@/lib/api/http";
import { renderEmail, textToHtml } from "@/lib/email/layout";
import { sendMail, supportInbox, type Mail } from "@/lib/email/mailer";
import { loadDailyReport, reportNumbersHtml } from "@/lib/owner/daily-report";
import { ownerEmailsOff } from "@/lib/owner/alerts";
import { db } from "@/utils/db";
import { bearerMatches } from "@/lib/security/bearer";
import { rateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

/** Emails a day the agent may send the owner. */
const EMAILS_PER_DAY = 10;
/** Attachments are reports: PDFs, images and spreadsheets, up to 5 MB in all. */
const MAX_ATTACHMENT_BYTES = 5_000_000;
const ATTACHMENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  csv: "text/csv",
};

/**
 * The owner's agent emails the owner: suggestions, decisions it needs, reports.
 * Body: { subject, text, includeReport?, attachments?: [{ filename, contentBase64 }] }.
 * includeReport adds the live numbers (tiles, goal progress, top pages) under
 * the text: that's the two-day report, and while it arrives the server
 * doesn't send its own (lib/owner/daily-report.ts).
 * It can only ever write to the owner's own inbox (SMTP_TO), never to anyone
 * else, and at most EMAILS_PER_DAY times a day.
 */
export const POST = route(async (request: Request) => {
  if (!bearerMatches(request, "AGENT_TOKEN")) return jsonError(404, "Not found.");
  // The owner turned emails off (OWNER_EMAILS=off): agents report in the app instead.
  if (ownerEmailsOff()) return Response.json({ ok: false, reason: "The owner has turned emails off." });
  const to = supportInbox();
  if (!to) return jsonError(503, "Set SMTP_TO (the owner's inbox) first.");

  // Base64 adds a third, so allow a little over the attachment limit.
  const body = await readJson(request, 7_000_000);
  if (body instanceof Response) return body;
  const { subject, text, attachments, includeReport } = body as {
    subject?: unknown;
    text?: unknown;
    attachments?: unknown;
    includeReport?: unknown;
  };
  if (typeof subject !== "string" || !subject.trim() || typeof text !== "string" || !text.trim())
    return jsonError(422, "Send { subject, text }.");
  const files = readAttachments(attachments);
  if (typeof files === "string") return jsonError(422, files);
  if (!(await rateLimit("agent-email", EMAILS_PER_DAY, 86_400)))
    return jsonError(429, `That's ${EMAILS_PER_DAY} emails today. Save the rest for tomorrow's summary.`);

  await sendMail({
    to,
    subject: `[Ahmed Agent] ${subject.trim().slice(0, 150)}`,
    text: text.slice(0, 30_000),
    html: renderEmail({
      // The inbox preview: the first real line, skipping the "Hi Ahmed," greeting.
      preheader:
        text
          .trim()
          .split("\n")
          .find((line) => line.trim() && !/^hi\b/i.test(line.trim())) ?? subject,
      body:
        textToHtml(text.slice(0, 30_000)) +
        (includeReport === true ? reportNumbersHtml(await loadDailyReport()) : ""),
      footer: "Sent by Ahmed Agent, Kitefolio's AI assistant, to Kitefolio's owner only.",
    }),
    attachments: files,
  });
  // Logged so the server knows the owner has heard from the agent (see sendDailyReport).
  await db.query("INSERT INTO email_log (owner_id, kind, dedupe_key, status) VALUES (NULL, $1, $2, 'sent')", [
    includeReport === true ? "agent-report" : "agent",
    `agent:${randomUUID()}`,
  ]);
  return Response.json({ ok: true });
});

/** Checks the attachments; returns them ready for the mailer, or an error message. */
function readAttachments(value: unknown): NonNullable<Mail["attachments"]> | string {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 3) return "Send up to 3 attachments.";
  const files: NonNullable<Mail["attachments"]> = [];
  let total = 0;
  for (const item of value as Array<{ filename?: unknown; contentBase64?: unknown }>) {
    const filename = typeof item?.filename === "string" ? item.filename.replace(/[^\w.-]/g, "_") : "";
    const extension = filename.split(".").pop()?.toLowerCase() ?? "";
    const contentType = ATTACHMENT_TYPES[extension];
    if (!contentType || typeof item.contentBase64 !== "string")
      return "Attachments must be PDF, PNG, JPG or CSV files sent as { filename, contentBase64 }.";
    const content = Buffer.from(item.contentBase64, "base64");
    total += content.length;
    if (total > MAX_ATTACHMENT_BYTES) return "Attachments can be 5 MB in all.";
    files.push({ filename, content, contentType });
  }
  return files;
}

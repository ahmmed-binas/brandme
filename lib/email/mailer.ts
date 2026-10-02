import nodemailer, { type Transporter } from "nodemailer";
import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";

/**
 * Outgoing email over SMTP, with your own company mailbox (Google Workspace,
 * Zoho, Microsoft 365, Fastmail, your host's mail server…). Set:
 *   SMTP_HOST, SMTP_PORT (587, or 465 with SMTP_SECURE=true), SMTP_USER,
 *   SMTP_PASSWORD, SMTP_FROM ("Formora <hello@yourdomain.com>"),
 *   SMTP_TO (where support and contact messages arrive).
 * Without SMTP the app still runs: emails are written to the server log.
 */

export const mailConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);

let transporter: Transporter | undefined;
function transport(): Transporter {
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587), secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    pool: true, maxConnections: 3,
  });
  return transporter;
}

export const fromAddress = () => process.env.SMTP_FROM || process.env.SMTP_USER || "Formora <no-reply@localhost>";
export const supportInbox = () => process.env.SMTP_TO || process.env.SMTP_USER || null;

export interface Mail { to: string; subject: string; text: string; html?: string; replyTo?: string }

export async function sendMail(mail: Mail): Promise<void> {
  if (!mailConfigured()) {
    console.info(`[email not sent: SMTP not configured] to=${mail.to} subject="${mail.subject}"`);
    return;
  }
  await transport().sendMail({ from: fromAddress(), ...mail, headers: { "X-Entity-Ref-ID": crypto.randomUUID() } });
}

/**
 * Sends an email at most once per `key` (e.g. "trial-ending:<user>:<date>").
 * Returns false when it was already sent. Failures are recorded and retried
 * by the next scheduled run.
 */
export async function sendOnce(key: string, ownerId: string | null, kind: string, mail: Mail): Promise<boolean> {
  await ensureSchema();
  const claimed = await db.query("INSERT INTO email_log (owner_id, kind, dedupe_key, status) VALUES ($1, $2, $3, 'sending') ON CONFLICT (dedupe_key) DO UPDATE SET status = 'sending' WHERE email_log.status = 'failed' RETURNING id", [ownerId, kind, key]);
  if (!claimed.rowCount) return false;
  try {
    await sendMail(mail);
    await db.query("UPDATE email_log SET status = $2, error = NULL WHERE dedupe_key = $1", [key, mailConfigured() ? "sent" : "logged"]);
    return true;
  } catch (error) {
    await db.query("UPDATE email_log SET status = 'failed', error = $2 WHERE dedupe_key = $1", [key, (error as Error).message.slice(0, 500)]);
    console.error("Email failed", kind, key, error);
    return false;
  }
}

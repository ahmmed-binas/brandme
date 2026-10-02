import { sendMail, supportInbox } from "@/lib/email/mailer";
import type { ContactMessage } from "./types";

export async function sendContactEmail(contact: ContactMessage) {
  const to = supportInbox();
  if (!to) throw new Error("SMTP is not configured.");
  await sendMail({ to, replyTo: contact.email, subject: contact.subject, text: `Name: ${contact.name}\nEmail: ${contact.email}\n\n${contact.message}` });
}

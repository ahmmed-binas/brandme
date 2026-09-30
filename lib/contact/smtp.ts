import nodemailer from "nodemailer";
import type { ContactMessage } from "./types";

function smtpSettings() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const to = process.env.SMTP_TO;
  if (!host || !user || !pass || !to) throw new Error("SMTP is not configured.");
  const port = Number(process.env.SMTP_PORT ?? 587);
  return { host, port, secure: process.env.SMTP_SECURE === "true", auth: { user, pass }, to, from: process.env.SMTP_FROM ?? user };
}

export async function sendContactEmail(contact: ContactMessage) {
  const settings = smtpSettings();
  const transporter = nodemailer.createTransport({ host: settings.host, port: settings.port, secure: settings.secure, auth: settings.auth });
  await transporter.sendMail({ from: settings.from, to: settings.to, replyTo: contact.email, subject: contact.subject, text: `Name: ${contact.name}\nEmail: ${contact.email}\n\n${contact.message}` });
}

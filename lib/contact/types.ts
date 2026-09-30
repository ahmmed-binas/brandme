export type ContactChannel = "email" | "whatsapp" | "smtp";

/** Safe to store with a public portfolio. SMTP credentials are never included. */
export interface ContactDeliveryConfig {
  channel: ContactChannel;
  email: string;
  whatsappNumber: string;
  subjectPrefix: string;
  smtpProfile: "server-default";
}

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

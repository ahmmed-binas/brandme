import { NextResponse } from "next/server";
import { recordLead } from "@/lib/analytics/leads";
import { sendContactEmail } from "@/lib/contact/smtp";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { databaseConfigured } from "@/utils/db-schema";

export async function POST(request: Request) {
  // A public form that sends email: limit it so it can't be used to flood the inbox.
  if (
    databaseConfigured() &&
    (!(await rateLimit(`contact:${clientIp(request)}`, 5, 3600).catch(() => true)) ||
      !(await rateLimit("contact:all", 200, 86400).catch(() => true)))
  ) {
    return NextResponse.json(
      { error: "Too many messages from here. Please try again later, or email us directly." },
      { status: 429 },
    );
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
    const email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : "";
    const subject = typeof body.subject === "string" ? body.subject.trim().slice(0, 180) : "";
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 5000) : "";
    if (!name || !email || !subject || !message || !/^\S+@\S+\.\S+$/.test(email))
      return NextResponse.json(
        { error: "Enter a name, valid email, subject, and message." },
        { status: 400 },
      );
    // Saved as a lead first, so the person's name and email survive even if the email fails.
    // A saving problem never blocks the message.
    if (databaseConfigured())
      await recordLead({
        kind: "contact",
        page: new URL(request.headers.get("referer") ?? "/contact", "http://x").pathname,
        ip: clientIp(request),
        userAgent: request.headers.get("user-agent") ?? "",
        name,
        email,
        note: subject,
      }).catch((error) => console.error("Lead not recorded", (error as Error).message));
    await sendContactEmail({ name, email, subject, message });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact delivery failed", error);
    return NextResponse.json(
      { error: "Email delivery is not configured or is temporarily unavailable." },
      { status: 503 },
    );
  }
}

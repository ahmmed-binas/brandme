import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EmailTest from "@/components/admin/EmailTest";
import { mailSettings } from "@/lib/email/mailer";
import { getCurrentUser } from "@/utils/user-account";

export const metadata: Metadata = { title: "Email settings", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Superadmin only: the SMTP settings this server is using, and a test send. */
export default async function EmailSettings() {
  const viewer = await getCurrentUser().catch(() => null);
  if (!viewer?.isSuperadmin) notFound();
  const mail = mailSettings();
  const rows: [string, string, string][] = [
    ["SMTP_HOST", mail.host ?? "not set", "Your mail provider’s outgoing (SMTP) server."],
    ["SMTP_PORT", String(mail.port), "587 (with SMTP_SECURE=false) or 465 (with SMTP_SECURE=true)."],
    ["SMTP_SECURE", mail.secure ? "true" : "false", ""],
    ["SMTP_USER", mail.user ?? "not set", "Usually the full mailbox address."],
    ["SMTP_PASSWORD", mail.passwordSet ? "set (hidden)" : "not set", "The mailbox password."],
    ["SMTP_FROM", mail.from, "Who emails appear to come from. Use the same mailbox, e.g. “Formora <you@company.com>”."],
    ["SMTP_TO", mail.supportInbox ?? "not set", "Where support requests and contact messages arrive."],
  ];

  return <div className="mx-auto max-w-[900px] px-5 pb-24 pt-12 sm:px-8">
    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft"><Link href="/admin" className="hover:text-ink">Admin</Link> / Email</p>
    <h1 className="mt-3 font-display text-[clamp(2.2rem,4.4vw,3.2rem)] leading-[1] tracking-[-0.02em]">{mail.configured ? "Email is set up" : "Email isn’t set up yet"}</h1>
    <p className="mt-4 max-w-[60ch] text-ink-soft">{mail.configured ? "Sign-up confirmations, password resets, receipts, renewal reminders and Investigator reports are sent through the server below. Send yourself a test to be sure." : "Until it is, emails are only written to the server log, so customers can’t confirm their accounts or reset passwords."} These values come from the server’s <code>.env</code> file: change them there and restart the app.</p>

    <dl className="mt-8 divide-y divide-rule rounded-xl border border-rule bg-card">{rows.map(([key, value, help]) => <div key={key} className="grid gap-1 p-4 sm:grid-cols-[11rem_minmax(0,1fr)]">
      <dt className="font-mono text-[0.85rem] text-ink-soft">{key}</dt>
      <dd><span className={`break-all ${value.startsWith("not set") ? "text-red-800" : "text-ink"}`}>{value}</span>{help && <span className="mt-0.5 block text-[0.88rem] text-ink-faint">{help}</span>}</dd>
    </div>)}</dl>

    <section className="mt-10" aria-labelledby="test">
      <h2 id="test" className="font-display text-[1.6rem]">Send a test</h2>
      <p className="mt-1 text-ink-soft">This logs in to the mail server with the settings above and sends one email. If it fails, you’ll see what the server said.</p>
      <EmailTest defaultTo={viewer.email ?? ""} configured={mail.configured} />
    </section>
  </div>;
}

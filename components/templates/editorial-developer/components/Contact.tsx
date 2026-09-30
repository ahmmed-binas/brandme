"use client";

import { useState } from "react";
import { Code2, Link as LinkIcon, Mail, MessageCircle, Send } from "lucide-react";
import { useEditorialData } from "../EditorialDataContext";
import RevealOnScroll from "./RevealOnScroll";

export default function Contact() {
  const portfolio = useEditorialData();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const contact = portfolio.contact ?? { channel: "email" as const, email: portfolio.personal.email, whatsappNumber: "", subjectPrefix: "Portfolio enquiry" };
  const placeholder = (value?: string) => !value || value.startsWith("[ADD");
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const values = new FormData(event.currentTarget);
    const subject = [contact.subjectPrefix, String(values.get("subject") ?? "")].filter(Boolean).join(" — ");
    const body = `Name: ${values.get("name")}\nEmail: ${values.get("email")}\n\n${values.get("message")}`;
    if (contact.channel === "whatsapp") { const number = contact.whatsappNumber.replace(/\D/g, ""); if (!number) { setStatus("error"); return; } window.open(`https://wa.me/${number}?text=${encodeURIComponent(`${subject}\n\n${body}`)}`, "_blank", "noopener,noreferrer"); }
    else { if (placeholder(contact.email)) { setStatus("error"); return; } window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`; }
    setStatus("success");
  };
  const links = [{ icon: Mail, href: !placeholder(portfolio.personal.email) ? `mailto:${portfolio.personal.email}` : undefined, label: portfolio.personal.email }, { icon: Code2, href: !placeholder(portfolio.social.github) ? portfolio.social.github : undefined, label: "GitHub" }, { icon: LinkIcon, href: !placeholder(portfolio.social.linkedin) ? portfolio.social.linkedin : undefined, label: "LinkedIn" }];
  return <section id="contact" className="border-b border-line px-6 py-24 md:px-10"><div className="mx-auto max-w-content"><RevealOnScroll><h2 className="font-display text-4xl font-medium tracking-tight md:text-6xl">Have something worth building?</h2><p className="mt-5 max-w-md leading-relaxed text-muted">I&apos;m open to select opportunities. Send a message below or reach out directly.</p></RevealOnScroll><div className="mt-14 grid gap-12 md:ml-10 md:grid-cols-[1fr_1fr]"><RevealOnScroll><form onSubmit={submit} className="space-y-6"><div className="grid gap-6 sm:grid-cols-2"><label className="font-mono text-xs text-muted">Name<input name="name" required className="mt-2 w-full border-b border-line bg-transparent py-2 outline-none focus:border-accent" /></label><label className="font-mono text-xs text-muted">Email<input name="email" type="email" required className="mt-2 w-full border-b border-line bg-transparent py-2 outline-none focus:border-accent" /></label></div><label className="block font-mono text-xs text-muted">Subject<input name="subject" required className="mt-2 w-full border-b border-line bg-transparent py-2 outline-none focus:border-accent" /></label><label className="block font-mono text-xs text-muted">Message<textarea name="message" required rows={4} className="mt-2 w-full resize-none border-b border-line bg-transparent py-2 outline-none focus:border-accent" /></label><button className="inline-flex items-center gap-2 border border-text bg-text px-6 py-3 font-mono text-xs text-bg">{contact.channel === "whatsapp" ? "Continue on WhatsApp" : "Compose email"}{contact.channel === "whatsapp" ? <MessageCircle size={14} /> : <Send size={14} />}</button>{status === "success" && <p className="font-mono text-xs text-signal">Your {contact.channel === "whatsapp" ? "WhatsApp message" : "email draft"} is ready.</p>}{status === "error" && <p className="font-mono text-xs text-accent">Add a valid contact destination in the editor.</p>}</form></RevealOnScroll><RevealOnScroll delay={0.1}><div className="space-y-3">{links.map(({ icon: Icon, href, label }) => <div key={label} className="flex items-center gap-3 border-b border-line pb-3"><Icon size={16} className="text-muted" />{href ? <a href={href} className="font-mono text-sm underline-hover">{label}</a> : <span className="font-mono text-sm italic text-muted">{label}</span>}</div>)}</div></RevealOnScroll></div></div></section>;
}

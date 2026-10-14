import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { brand } from "@/lib/brand";
import { bookingUrl } from "@/lib/booking";
import { whatsappLink } from "@/lib/offers";

/**
 * Custom software and AI app builds, then monthly maintenance (owner's new service,
 * October 2026). No prices on purpose: each project is quoted after a free call.
 */
export const metadata: Metadata = {
  title: "Custom Software & AI App Development in Dubai, Built and Maintained",
  description: `${brand.name} builds custom software and AI apps for small businesses: AI assistants, booking and client portals, dashboards and automations. Free call, a written quote, then we build it and keep it running every month.`,
  alternates: { canonical: "/services/custom-software" },
};

const BUILDS = [
  {
    title: "AI assistants for your business",
    text: "Answers customer questions on WhatsApp or your website from your own documents, and hands over to you when it should.",
  },
  {
    title: "Booking, quotes and client portals",
    text: "Customers book, pay deposits, upload documents and see progress, without a chain of emails.",
  },
  {
    title: "Dashboards and internal tools",
    text: "Sales, stock, jobs or leads in one screen, pulled from the spreadsheets and systems you already use.",
  },
  {
    title: "Automations that save hours",
    text: "Invoices, follow-ups, reports and data entry done by software every day, checked by a person where it matters.",
  },
  {
    title: "Web and mobile apps",
    text: "From a first version to show investors to an app your customers use every day.",
  },
  {
    title: "Fixing software you already have",
    text: "Slow, broken or abandoned by the last developer: we take it over, fix it and keep it running.",
  },
];

const STEPS = [
  [
    "Free call",
    "Twenty minutes about the problem, not the technology. You’ll know straight away if we’re the right fit.",
  ],
  [
    "Written quote",
    "What we’ll build, what it costs and when it’s ready, in plain words, before any money changes hands.",
  ],
  ["We build it", "You see working progress every week and can change direction early, not at the end."],
  [
    "We keep it running",
    "A monthly plan covers hosting, security updates, fixes and small changes, so it never goes stale.",
  ],
];

const FAQ = [
  {
    q: "How much does custom software cost?",
    a: "It depends on what it needs to do, so every project is quoted after a free call. You get a fixed written quote before we start, and a monthly maintenance price that covers hosting, updates and fixes.",
  },
  {
    q: "Who owns the code?",
    a: "You do. The software, the code and your data are yours. If you ever move to another developer, we hand everything over.",
  },
  {
    q: "What does maintenance include?",
    a: "Hosting, security updates, backups, fixing anything that breaks, and a set number of small changes each month. Bigger new features are quoted separately.",
  },
  {
    q: "Do AI features cost extra to run?",
    a: "AI services charge per use. We pass that cost on at cost, or you can use your own AI account, and we show you what it is each month.",
  },
];

export default function CustomSoftwarePage() {
  const call = bookingUrl() ?? "/contact";
  const chat = whatsappLink("Hi! I'd like to talk about custom software / an AI app for my business: ");
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-24 pt-12 sm:px-8 lg:pt-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }}
      />
      <header className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Services</p>
          <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,4.8rem)] font-[400] leading-[0.95] tracking-[-0.03em] text-ink">
            Custom software and AI apps,{" "}
            <em className="font-[300] text-signal">built for you and kept running.</em>
          </h1>
        </div>
        <div>
          <p className="text-[1.08rem] leading-[1.7] text-ink-soft">
            Tell us what slows your business down. We build the software or AI app that fixes it, then look
            after it every month, so you never end up with an abandoned app nobody can update.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={call}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[0.95rem] font-medium text-paper transition-colors hover:bg-signal hover:text-signal-ink"
            >
              Book a free call <ArrowRight size={16} />
            </Link>
            <a
              href={chat}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-rule px-6 py-3 text-[0.95rem] text-ink hover:border-ink"
            >
              WhatsApp us
            </a>
          </div>
        </div>
      </header>

      <section className="mt-20" aria-labelledby="builds">
        <h2 id="builds" className="font-display text-[clamp(2rem,4vw,3rem)] tracking-[-0.02em] text-ink">
          What we build
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BUILDS.map((build) => (
            <li key={build.title} className="rounded-2xl border border-rule bg-card p-6">
              <h3 className="font-display text-[1.35rem] leading-tight text-ink">{build.title}</h3>
              <p className="mt-2 text-[0.96rem] leading-relaxed text-ink-soft">{build.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20 rounded-[2rem] bg-ink px-7 py-12 text-paper sm:px-12" aria-labelledby="how">
        <h2 id="how" className="font-display text-[clamp(1.9rem,4vw,3rem)] leading-tight">
          How it works
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([title, text], index) => (
            <li key={title}>
              <p className="font-mono text-[12px] text-paper/50">0{index + 1}</p>
              <p className="mt-1 font-display text-[1.4rem]">{title}</p>
              <p className="mt-1 text-[0.95rem] text-paper/75">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-20 grid gap-10 lg:grid-cols-[1fr_1.2fr]" aria-labelledby="why">
        <h2
          id="why"
          className="font-display text-[clamp(1.9rem,4vw,3rem)] leading-tight tracking-[-0.02em] text-ink"
        >
          Why work with us
        </h2>
        <ul className="space-y-3">
          {[
            `We build and run ${brand.name} ourselves, so we know what it takes to keep software working, not just ship it`,
            "Plain language: you’ll always know what we’re doing and why",
            "You own the code and your data",
            "Based in Dubai, working across the UAE and remotely",
          ].map((line) => (
            <li key={line} className="flex gap-3 text-[1.02rem] text-ink">
              <Check size={18} className="mt-1 shrink-0 text-signal" />
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20 max-w-[52rem]" aria-labelledby="faq">
        <h2 id="faq" className="font-display text-[clamp(1.9rem,4vw,3rem)] tracking-[-0.02em] text-ink">
          Questions
        </h2>
        <dl className="mt-6 divide-y divide-rule border-y border-rule">
          {FAQ.map((item) => (
            <div key={item.q} className="py-5">
              <dt className="font-medium text-ink">{item.q}</dt>
              <dd className="mt-2 leading-relaxed text-ink-soft">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-20 rounded-[2rem] border border-rule bg-card px-7 py-12 text-center">
        <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] leading-tight text-ink">
          Have something in mind? Let’s talk it through.
        </h2>
        <p className="mx-auto mt-3 max-w-[34rem] text-ink-soft">
          A free call, no obligation. You’ll leave with a clear idea of what it would take, even if you don’t
          build it with us.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href={call}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-medium text-paper hover:bg-signal hover:text-signal-ink"
          >
            Book a free call <ArrowRight size={16} />
          </Link>
          <a
            href={chat}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-rule px-6 py-3 text-ink hover:border-ink"
          >
            WhatsApp us
          </a>
        </div>
      </section>
    </div>
  );
}

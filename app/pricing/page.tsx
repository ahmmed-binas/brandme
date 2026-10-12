import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { CREDIT_PACKS } from "@/lib/billing/credits";
import { GRACE_DAYS, cardFeeCents, formatUsd } from "@/lib/plans";
import { AGENT_EDITS_PER_MONTH, FOUNDING_SPOTS, OFFERS, PRICES, aed, whatsappLink } from "@/lib/offers";
import { brand } from "@/lib/brand";
import { siteUrl } from "@/lib/site";

/*
 * Prices and plans come from lib/offers.ts (AED, set with the owner on 12 October 2026).
 * Until online checkout is live, paid plans start on WhatsApp. When it is, the card
 * checkout in ./PlanPicker.tsx can come back for Pro.
 */

export const metadata: Metadata = {
  title: "Pricing: free to start",
  description: `${brand.name} is free for one website with a blog. Pro is ${aed(PRICES.proMonth)} a month for your own domain; Agent is ${aed(PRICES.agentMonth)} a month for UAE real estate agents; or we build your site for you for ${aed(PRICES.doneForYou)}.`,
  alternates: { canonical: "/pricing" },
};

const FAQ: Array<[string, string]> = [
  [
    "Can I see a demo first?",
    "Yes. Book a free 20-minute demo call and we’ll walk you through the editor, the designs made for your kind of work and the Investigator, using your own details if you like. You can also try any template in the editor without an account.",
  ],
  [
    "What does Custom include?",
    "A personal designer who works with you on your requirements: start from any of our 50+ designs or from something new, choose free stock photos together, and add, remove or change any section or element. We build it, publish it and can keep it up to date for you. Book a free call to talk it through; we agree a price before any work starts.",
  ],
  [
    "Is Free really free?",
    "Yes. One website with a blog stays online for free for as long as you like, with a small “Made with Fuccura” link. We’d rather you use it and tell a friend than pay for something you’re unsure about.",
  ],
  [
    "How do I pay?",
    "Online checkout is opening soon. Until then, message us on WhatsApp: we set you up and send you a secure payment link. Founding members keep their price for good.",
  ],
  [
    "What’s the difference between Pro and Agent?",
    `Pro is for anyone who wants their own domain and no Fuccura link. Agent is built for real estate agents: listing pages, a WhatsApp button on every listing, your cloned voice for listing videos, and ${AGENT_EDITS_PER_MONTH} changes done for you each month.`,
  ],
  [
    "How does AI work if it isn’t in the price?",
    "AI costs real money every time it runs, so it’s paid separately and costs the same on every plan. Buy credits at what the AI costs us plus 5% (they never expire), or connect your own Claude or OpenAI API key and pay Anthropic or OpenAI directly. ChatGPT and Codex users can use an OpenAI key.",
  ],
  [
    "What’s the card fee?",
    `Card payments cost the payment provider about 3% + a few cents. When you buy credits or a domain we show it as its own line, so the thing you’re buying is at cost. For example, $10 of credits is $10 + ${formatUsd(cardFeeCents(1000))}.`,
  ],
  [
    "How does the Investigator get paid for?",
    "Every account gets its first check free. After that, reading GitHub and blog feeds is free, and the AI step (reading your other profiles and searching the web) costs a few credits per check, or nothing extra with your own Claude key. You choose how often it runs.",
  ],
  [
    "What counts as a change done for me?",
    `Anything you’d ask a web designer for: a new section, a different layout for your listings, your brand colours, a new page. On Agent, send it on WhatsApp and we do it, up to ${AGENT_EDITS_PER_MONTH} a month. Editing your own text and photos is unlimited and always free.`,
  ],
  [
    "Can I cancel?",
    "Yes, any time. Monthly plans stop at the end of the month you’ve paid for; yearly plans at the end of the year. Nothing is deleted when you cancel: your first website stays online on Free.",
  ],
  [
    "What happens if Pro ends?",
    `Pro keeps working for another ${GRACE_DAYS} days while you decide. After that your account moves to free Basic: your first published site stays online, any others rest (visitors see a short holding page), and nothing is deleted.`,
  ],
  [
    "Can I get a refund?",
    "Yes, within 14 days of your first payment, and for credits you haven’t used. The payment provider keeps its card fee when a payment is refunded, so you get back the payment minus that fee. Just message us.",
  ],
  [
    "Do I need a domain?",
    "No. Every portfolio gets a free address. With Pro you can connect a domain you own (we set it up and handle HTTPS) or buy one through us at the registrar’s price plus the card fee.",
  ],
];

export default function PricingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${brand.name} portfolio hosting`,
    description: brand.description,
    brand: { "@type": "Brand", name: brand.name },
    offers: [
      ...[
        ["Free plan", 0],
        ["Pro plan, monthly", PRICES.proMonth],
        ["Pro plan, yearly", PRICES.proYear],
        ["Agent plan, monthly", PRICES.agentMonth],
        ["Website done for you", PRICES.doneForYou],
      ].map(([name, price]) => ({
        "@type": "Offer",
        name,
        price: Number(price).toFixed(2),
        priceCurrency: "AED",
        url: `${siteUrl}/pricing`,
        availability: "https://schema.org/InStock",
      })),
    ],
  };

  return (
    <div className="mx-auto max-w-[1200px] px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <header className="mx-auto max-w-[46rem] text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Pricing</p>
        <h1 className="mt-4 font-display text-[clamp(2.8rem,6.6vw,5.4rem)] leading-[0.95] tracking-[-0.03em]">
          Free to start. <em className="font-[300] text-signal">Fair after that.</em>
        </h1>
        <p className="mx-auto mt-6 max-w-[34rem] text-[1.08rem] leading-[1.7] text-ink-soft">
          Your website and blog are free for as long as you like. Pro puts it on your own domain, Agent turns
          it into a lead machine for real estate, and we can build the whole thing for you.
        </p>
        <p className="mt-4 text-[0.95rem]">
          <Link href="/book" className="text-ink underline underline-offset-4">
            Book a free demo call
          </Link>{" "}
          <span className="text-ink-soft">if you’d like to see it first.</span>
        </p>
      </header>

      {/* Founding members: the first customers keep a low price for good. */}
      <div className="mx-auto mt-12 flex max-w-[52rem] flex-wrap items-center justify-between gap-4 rounded-2xl border border-signal/40 bg-signal/10 px-6 py-5">
        <p className="text-[0.98rem] text-ink">
          <b className="font-medium">Founding members:</b> the first {FOUNDING_SPOTS} customers get Pro for{" "}
          <b className="font-medium">{aed(PRICES.foundingYear)} a year</b>, locked in for good.
        </p>
        <a
          href={whatsappLink("Hi! I’d like a founding member spot for Fuccura Pro.")}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-signal hover:text-signal-ink"
        >
          Claim a spot
        </a>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {OFFERS.map((offer) => (
          <article
            key={offer.id}
            className={`flex flex-col rounded-3xl border p-7 ${offer.highlight ? "border-ink bg-ink text-paper" : "border-rule bg-card"}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.2em]">{offer.name}</h2>
              {offer.highlight && (
                <span className="rounded-full bg-signal px-2.5 py-0.5 text-[11px] font-medium text-signal-ink">
                  For agents
                </span>
              )}
            </div>
            <p className="mt-5 font-display text-[2.6rem] leading-none tracking-[-0.03em]">
              {offer.price}
              <span
                className={`ml-1.5 font-sans text-sm tracking-normal ${offer.highlight ? "text-paper/70" : "text-ink-soft"}`}
              >
                {offer.per}
              </span>
            </p>
            {offer.alternative && (
              <p className={`mt-2 text-[0.85rem] ${offer.highlight ? "text-paper/70" : "text-ink-soft"}`}>
                {offer.alternative}
              </p>
            )}
            <p className={`mt-4 text-[0.95rem] ${offer.highlight ? "text-paper/85" : "text-ink-soft"}`}>
              {offer.pitch}
            </p>
            <ul className="mt-6 flex-1 space-y-2.5 text-[0.92rem]">
              {offer.features.map((feature) => (
                <li key={feature} className="flex gap-2.5">
                  <Check
                    size={16}
                    className={`mt-0.5 shrink-0 ${offer.highlight ? "text-signal" : "text-emerald-600"}`}
                  />
                  {feature}
                </li>
              ))}
            </ul>
            <a
              href={offer.cta.href}
              className={`mt-7 inline-flex justify-center rounded-full px-5 py-3 text-sm font-medium transition ${offer.highlight ? "bg-paper text-ink hover:bg-signal hover:text-signal-ink" : "bg-ink text-paper hover:bg-signal hover:text-signal-ink"}`}
            >
              {offer.cta.label}
            </a>
          </article>
        ))}
      </div>

      <section className="mt-24 grid gap-10 rounded-2xl border border-rule p-8 lg:grid-cols-[1fr_1.2fr] lg:p-12">
        <div>
          <h2 className="font-display text-[2.2rem] leading-tight">AI, at cost</h2>
          <p className="mt-4 text-ink-soft">
            Writing help, imports from your CV or LinkedIn, and the Investigator use AI. Credits are priced
            from what each request really costs plus 5%, so a quick rewrite is a few cents. The card fee is
            shown separately.
          </p>
          <p className="mt-4 text-ink-soft">
            Prefer your own account?{" "}
            <b className="font-medium text-ink">Connect your Claude or OpenAI API key</b> and use AI without
            credits at all.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <li key={pack.id} className="rounded-xl bg-white/60 p-5 text-center">
              <p className="font-display text-[2.2rem] leading-none">{formatUsd(pack.cents)}</p>
              <p className="mt-2 text-[0.92rem]">{pack.label}</p>
              <p className="mt-1 text-[0.82rem] text-ink-faint">
                + {formatUsd(cardFeeCents(pack.cents))} card fee
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto mt-24 max-w-[48rem]">
        <h2 className="font-display text-[2.4rem] leading-tight">Questions people ask</h2>
        <dl className="mt-8 divide-y divide-rule border-y border-rule">
          {FAQ.map(([question, answer]) => (
            <div key={question} className="py-6">
              <dt className="font-medium">{question}</dt>
              <dd className="mt-2 leading-relaxed text-ink-soft">{answer}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-10 text-center text-ink-soft">
          Still unsure?{" "}
          <Link href="/templatechooser" className="text-ink underline underline-offset-4">
            Start free
          </Link>
          ,{" "}
          <Link href="/book" className="text-ink underline underline-offset-4">
            book a free call
          </Link>
          , or read our{" "}
          <Link href="/terms" className="text-ink underline underline-offset-4">
            terms
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

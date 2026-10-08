import type { Metadata } from "next";
import Link from "next/link";
import PlanPicker, { type PlanCard } from "./PlanPicker";
import { CREDIT_PACKS } from "@/lib/billing/credits";
import { GRACE_DAYS, PLANS, cardFeeCents, formatUsd } from "@/lib/plans";
import { stripeConfigured } from "@/lib/payments/stripe";
import { brand } from "@/lib/brand";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing: free to start",
  description: `${brand.name} is free for one portfolio with a blog. Pro is ${formatUsd(PLANS.pro.prices.year!)} a year or ${formatUsd(PLANS.pro.prices.month!)} a month for up to three sites on your own domain. AI at cost.`,
  alternates: { canonical: "/pricing" },
};

const FEATURES: Record<PlanCard["id"], string[]> = {
  basic: ["Every template, every colour and type option", "One portfolio at your free address; switch design any time and keep your content", "A blog on your portfolio", "The Investigator, on any schedule you choose", "Unlimited edits, saved as you type", `${PLANS.basic.storageMb} MB of images`, "A small “Made with Formora” link"],
  pro: ["Everything in Basic", "Up to three portfolios side by side, all live", "Your own domain, connected for you, with HTTPS", "No Formora link on your site", `${PLANS.pro.storageMb / 1000} GB of images`],
};

const FAQ: Array<[string, string]> = [
  ["Is Basic really free?", "Yes. One portfolio with a blog stays online for free for as long as you like, with a small “Made with Formora” link. We’d rather you use it and tell a friend than pay for something you’re unsure about."],
  ["How does AI work if it isn’t in the price?", "AI costs real money every time it runs, so it’s paid separately and costs the same on every plan. Buy credits at what the AI costs us plus 5% (they never expire), or connect your own Claude or OpenAI API key and pay Anthropic or OpenAI directly. ChatGPT and Codex users can use an OpenAI key."],
  ["What’s the card fee?", `Stripe charges about 2.9% + 30¢ for each card payment. When you buy credits or a domain we show it as its own line, so the thing you’re buying is at cost. For example, $10 of credits is $10 + ${formatUsd(cardFeeCents(1000))}.`],
  ["How does the Investigator get paid for?", "Every account gets its first check free. After that, reading GitHub and blog feeds is free, and the AI step (reading your other profiles and searching the web) costs a few credits per check, or nothing extra with your own Claude key. You choose how often it runs."],
  ["Will I be charged automatically?", "Only for Pro, and only if you choose it. We save your card for renewal, email yearly payers two weeks before, and you can switch renewal off any time in your account."],
  ["What happens if Pro ends?", `Pro keeps working for another ${GRACE_DAYS} days while you decide. After that your account moves to free Basic: your first published site stays online, any others rest (visitors see a short holding page), and nothing is deleted.`],
  ["Can I get a refund?", "Yes, for Pro within 14 days of paying, and for credits you haven’t used. Stripe keeps its card fee when a payment is refunded, so you get back the payment minus that fee. Just reply to your receipt."],
  ["Do I need a domain?", "No. Every portfolio gets a free address. With Pro you can connect a domain you own (we set it up and handle HTTPS) or buy one through us at the registrar’s price plus the card fee."],
];

export default function PricingPage() {
  const plans: PlanCard[] = (["basic", "pro"] as const).map((id) => ({ id, name: PLANS[id].name, summary: PLANS[id].summary, prices: PLANS[id].prices, features: FEATURES[id], highlight: id === "pro" }));
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: `${brand.name} portfolio hosting`, description: brand.description, brand: { "@type": "Brand", name: brand.name },
    offers: [
      { "@type": "Offer", name: "Basic plan", price: "0.00", priceCurrency: "USD", url: `${siteUrl}/pricing`, availability: "https://schema.org/InStock" },
      { "@type": "Offer", name: "Pro plan, yearly", price: (PLANS.pro.prices.year! / 100).toFixed(2), priceCurrency: "USD", url: `${siteUrl}/pricing`, availability: "https://schema.org/InStock" },
      { "@type": "Offer", name: "Pro plan, monthly", price: (PLANS.pro.prices.month! / 100).toFixed(2), priceCurrency: "USD", url: `${siteUrl}/pricing`, availability: "https://schema.org/InStock" },
    ],
  };

  return <div className="mx-auto max-w-[1200px] px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <header className="mx-auto max-w-[46rem] text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Pricing</p>
      <h1 className="mt-4 font-display text-[clamp(2.8rem,6.6vw,5.4rem)] leading-[0.95] tracking-[-0.03em]">Free to start. <em className="font-[300] text-signal">Fair after that.</em></h1>
      <p className="mx-auto mt-6 max-w-[34rem] text-[1.08rem] leading-[1.7] text-ink-soft">Your portfolio and blog are free for as long as you like. Pro adds more sites and your own domain. AI is sold at cost, so you only pay for what you use.</p>
    </header>

    <PlanPicker plans={plans} paymentsReady={stripeConfigured()} bookingHref="/book" />

    <section className="mt-24 grid gap-10 rounded-2xl border border-rule p-8 lg:grid-cols-[1fr_1.2fr] lg:p-12">
      <div><h2 className="font-display text-[2.2rem] leading-tight">AI, at cost</h2><p className="mt-4 text-ink-soft">Writing help, imports from your CV or LinkedIn, and the Investigator use AI. Credits are priced from what each request really costs plus 5%, so a quick rewrite is a few cents. The card fee is shown separately.</p>
        <p className="mt-4 text-ink-soft">Prefer your own account? <b className="font-medium text-ink">Connect your Claude or OpenAI API key</b> and use AI without credits at all.</p></div>
      <ul className="grid gap-3 sm:grid-cols-3">{CREDIT_PACKS.map((pack) => <li key={pack.id} className="rounded-xl bg-white/60 p-5 text-center"><p className="font-display text-[2.2rem] leading-none">{formatUsd(pack.cents)}</p><p className="mt-2 text-[0.92rem]">{pack.label}</p><p className="mt-1 text-[0.82rem] text-ink-faint">+ {formatUsd(cardFeeCents(pack.cents))} card fee</p></li>)}</ul>
    </section>

    <section className="mx-auto mt-24 max-w-[48rem]">
      <h2 className="font-display text-[2.4rem] leading-tight">Questions people ask</h2>
      <dl className="mt-8 divide-y divide-rule border-y border-rule">{FAQ.map(([question, answer]) => <div key={question} className="py-6"><dt className="font-medium">{question}</dt><dd className="mt-2 leading-relaxed text-ink-soft">{answer}</dd></div>)}</dl>
      <p className="mt-10 text-center text-ink-soft">Still unsure? <Link href="/templatechooser" className="text-ink underline underline-offset-4">Start free</Link>, <Link href="/book" className="text-ink underline underline-offset-4">book a free call</Link>, or read our <Link href="/terms" className="text-ink underline underline-offset-4">terms</Link>.</p>
    </section>
  </div>;
}

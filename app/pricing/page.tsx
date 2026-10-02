import type { Metadata } from "next";
import Link from "next/link";
import PlanPicker, { type PlanCard } from "./PlanPicker";
import { CREDIT_PACKS } from "@/lib/billing/credits";
import { GRACE_DAYS, PLANS, TRIAL_DAYS, priceFor, type PaidPlanId } from "@/lib/plans";
import { stripeConfigured } from "@/lib/payments/stripe";
import { brand } from "@/lib/brand";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing: from $10 a year",
  description: `${brand.name} costs from $10 a year for a portfolio on your own domain. ${TRIAL_DAYS}-day free trial, no card needed. Pay for up to five years at once.`,
  alternates: { canonical: "/pricing" },
};

const usd = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;

const FEATURES: Record<PaidPlanId, string[]> = {
  basic: ["One live portfolio", "Every template, every colour and type option", "Your own domain, connected for you, with HTTPS", "Unlimited edits, saved as you type", "200 MB of images", "Pay for 1 or 2 years"],
  pro: ["Everything in Basic", "Three live portfolios", "No Formora link on your site", "A blog on your site and your own domain", "GitHub checked weekly for new projects", "Career news search every 3 months", "100 AI credits every month", "Pay for up to 5 years"],
  premium: ["Everything in Pro", "A domain name included (up to $20/yr)", "Career news search every month", "300 AI credits every month", "Ten live portfolios and 5 GB of images", "Priority help from a person"],
};

const FAQ: Array<[string, string]> = [
  ["What happens when the trial ends?", `Nothing dramatic. Your site stays online for another ${GRACE_DAYS} days while you decide, and we’ll remind you kindly. After that it rests: visitors see a short holding page, and everything you made is kept until you come back.`],
  ["Why yearly, and why so cheap?", "A portfolio should be something you set up once and stop worrying about. Hosting a portfolio well doesn’t cost much, so we don’t charge much. Paying for two or five years at once is cheaper and means one less renewal to think about."],
  ["How does AI work if it isn’t in the price?", "AI costs real money each time it runs, so it’s paid separately and you only pay for what you use. Buy credits (they never expire), or connect your own Claude API key and pay Anthropic directly. Pro and Premium include monthly credits."],
  ["Will I be charged automatically?", "Only if you choose a plan. We save your card for renewal, email you two weeks before, and you can switch renewal off any time in your account."],
  ["Can I change plan later?", "Yes. When you switch, the unused time on your current plan is converted into time on the new one, so you never pay twice."],
  ["Can I get a refund?", "If it isn’t right for you, ask within 14 days of your first payment for a full refund. After that, prepaid years are not refunded, but your site stays live until the end of what you paid for."],
  ["Do I need a domain?", "No. Every portfolio gets a free address, and you can connect a domain you own (we set it up and handle HTTPS), or buy one with us."],
];

export default function PricingPage() {
  const plans: PlanCard[] = (["basic", "pro", "premium"] as const).map((id) => ({
    id, name: PLANS[id].name, summary: PLANS[id].summary, yearlyCents: PLANS[id].yearlyCents, terms: PLANS[id].terms,
    prices: Object.fromEntries(PLANS[id].terms.map((years) => [years, priceFor(id, years)])), features: FEATURES[id], highlight: id === "pro",
  }));
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: `${brand.name} portfolio hosting`, description: brand.description, brand: { "@type": "Brand", name: brand.name },
    offers: plans.map((plan) => ({ "@type": "Offer", name: `${plan.name} plan`, price: (plan.yearlyCents / 100).toFixed(2), priceCurrency: "USD", url: `${siteUrl}/pricing`, availability: "https://schema.org/InStock" })),
  };

  return <div className="mx-auto max-w-[1200px] px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <header className="mx-auto max-w-[46rem] text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Pricing</p>
      <h1 className="mt-4 font-display text-[clamp(2.8rem,6.6vw,5.4rem)] leading-[0.95] tracking-[-0.03em]">One small payment. <em className="font-[300] text-signal">Then forget about it.</em></h1>
      <p className="mx-auto mt-6 max-w-[34rem] text-[1.08rem] leading-[1.7] text-ink-soft">Try everything free for {TRIAL_DAYS} days, no card needed. Then pick a plan for a year, two, or five, and your portfolio keeps itself online and up to date.</p>
    </header>

    <PlanPicker plans={plans} paymentsReady={stripeConfigured()} />

    <section className="mt-24 grid gap-10 rounded-2xl border border-rule p-8 lg:grid-cols-[1fr_1.2fr] lg:p-12">
      <div><h2 className="font-display text-[2.2rem] leading-tight">AI, paid as you go</h2><p className="mt-4 text-ink-soft">Writing help, imports from your CV or LinkedIn, and career research use AI. Credits are priced from what each request really costs, so a quick rewrite is a few cents.</p>
        <p className="mt-4 text-ink-soft">Prefer your own account? <b className="font-medium text-ink">Connect your Claude API key</b> and use the assistant without credits at all.</p></div>
      <ul className="grid gap-3 sm:grid-cols-3">{CREDIT_PACKS.map((pack) => <li key={pack.id} className="rounded-xl bg-white/60 p-5 text-center"><p className="font-display text-[2.2rem] leading-none">{usd(pack.cents)}</p><p className="mt-2 text-[0.92rem]">{pack.label}</p><p className="mt-1 text-[0.82rem] text-ink-faint">about {Math.round(pack.credits / 7)} rewrites</p></li>)}</ul>
    </section>

    <section className="mx-auto mt-24 max-w-[48rem]">
      <h2 className="font-display text-[2.4rem] leading-tight">Questions people ask</h2>
      <dl className="mt-8 divide-y divide-rule border-y border-rule">{FAQ.map(([question, answer]) => <div key={question} className="py-6"><dt className="font-medium">{question}</dt><dd className="mt-2 leading-relaxed text-ink-soft">{answer}</dd></div>)}</dl>
      <p className="mt-10 text-center text-ink-soft">Still unsure? <Link href="/templatechooser" className="text-ink underline underline-offset-4">Start the free trial</Link>, or <Link href="/community/support" className="text-ink underline underline-offset-4">ask us anything</Link>.</p>
    </section>
  </div>;
}

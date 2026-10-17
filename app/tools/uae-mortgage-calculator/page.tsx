import type { Metadata } from "next";
import Link from "next/link";
import { MortgageCalculator } from "@/components/tools/MortgageCalculator";
import { brand } from "@/lib/brand";
import { siteUrl } from "@/lib/site";
import { RULES_CHECKED, RULES_SOURCE } from "@/lib/tools/uae-mortgage";

/**
 * Free UAE mortgage calculator for buyers and agents. The rules and fees live
 * in lib/tools/uae-mortgage.ts (with sources and the date they were checked).
 */

// "Mortgage repayment calculator" is a search people find this page with (Search Console, October 2026).
const TITLE = "UAE Mortgage Calculator 2026: Monthly Repayments & Upfront Costs";
const DESCRIPTION =
  "Free UAE mortgage repayment calculator: your monthly repayment, the minimum down payment for expats and UAE nationals, DLD fees and every cost you pay up front in Dubai.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "UAE mortgage calculator",
    "mortgage repayment calculator",
    "monthly mortgage repayment",
    "Dubai mortgage calculator",
    "mortgage calculator for expats UAE",
    "Dubai property purchase costs",
    "DLD fees calculator",
    "minimum down payment Dubai",
  ],
  alternates: { canonical: "/tools/uae-mortgage-calculator" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/tools/uae-mortgage-calculator",
    type: "website",
  },
};

const RULES: Array<[string, string, string, string]> = [
  ["First home up to AED 5M", "80%", "85%", "20% / 15%"],
  ["First home above AED 5M", "70%", "75%", "30% / 25%"],
  ["Second home or investment", "60%", "65%", "40% / 35%"],
  ["Off-plan (any buyer)", "50%", "50%", "50%"],
];

const FAQ: Array<{ question: string; answer: string }> = [
  {
    question: "How are monthly mortgage repayments calculated?",
    answer:
      "With the standard repayment formula: monthly repayment = loan × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1), where r is the yearly interest rate divided by 12 and n is the number of months. For example, a loan of AED 1,600,000 at 4.5% over 25 years (300 months) costs about AED 8,893 a month, and about AED 1,068,000 in interest over the whole term. The calculator above does this for you and adds every fee you pay up front.",
  },
  {
    question: "How much deposit do I need to buy in Dubai as an expat?",
    answer:
      "For a first, completed home worth up to AED 5 million, at least 20% of the price; above AED 5 million, at least 30%. For a second home or investment it’s 40%, and for off-plan property 50%. These are the Central Bank’s maximum loan-to-value limits; banks can ask for more. On top of the deposit, budget roughly 6–7% of the price for fees.",
  },
  {
    question: "What fees do I pay when buying property in Dubai?",
    answer:
      "The Dubai Land Department transfer fee (4% of the price plus AED 580), mortgage registration (0.25% of the loan plus AED 290), the registration trustee (AED 4,000 + VAT, or AED 2,000 + VAT under AED 500,000), the agent’s commission (usually 2% + VAT), and with a mortgage the bank’s arrangement fee (up to about 1% of the loan + VAT) and a valuation (about AED 2,500–3,500 + VAT).",
  },
  {
    question: "What is the longest mortgage term in the UAE?",
    answer:
      "25 years. Each bank also sets its own maximum age at the final repayment, so older buyers may be offered a shorter term.",
  },
  {
    question: "How much salary do I need for a mortgage in the UAE?",
    answer:
      "All your monthly loan repayments, including this mortgage, must stay under 50% of your income, and the mortgage can’t be more than 7 years of income for expats (8 for UAE nationals). The calculator shows the minimum monthly income that follows from both rules. Banks also test whether you could still pay if rates rose by 2–4 points.",
  },
  {
    question: "Are these figures exact?",
    answer: `They follow the Central Bank’s rules and Dubai’s published fees, last checked on ${RULES_CHECKED}. Your bank’s rate and fees, and the final DLD amounts, can differ, so treat this as a careful estimate, not financial advice. Other emirates have different land department fees.`,
  },
];

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "UAE Mortgage Calculator",
      url: `${siteUrl}/tools/uae-mortgage-calculator`,
      description: DESCRIPTION,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Any (in the browser)",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "AED" },
      provider: { "@type": "Organization", name: brand.name, url: siteUrl },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((entry) => ({
        "@type": "Question",
        name: entry.question,
        acceptedAnswer: { "@type": "Answer", text: entry.answer },
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: brand.name, item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Tools", item: `${siteUrl}/tools` },
        {
          "@type": "ListItem",
          position: 3,
          name: "UAE Mortgage Calculator",
          item: `${siteUrl}/tools/uae-mortgage-calculator`,
        },
      ],
    },
  ],
};

export default function MortgageCalculatorPage() {
  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-24 pt-10 sm:px-8 lg:pt-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
      <nav
        aria-label="Breadcrumb"
        className="flex gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft"
      >
        <Link href="/tools" className="hover:text-ink">
          Tools
        </Link>
        <span aria-hidden>/</span>
        <span className="text-ink">UAE Mortgage Calculator</span>
      </nav>

      <header className="mt-5 max-w-[48rem]">
        <h1 className="font-display text-[clamp(2.3rem,5vw,4rem)] leading-[1.02] tracking-[-0.02em]">
          UAE mortgage calculator
        </h1>
        <p className="mt-4 text-[1.08rem] leading-relaxed text-ink-soft">
          A mortgage repayment calculator for the UAE: your monthly repayment, the minimum down payment the
          law allows, and every fee you pay up front in Dubai. Built on the Central Bank’s rules for expats
          and UAE nationals, checked {RULES_CHECKED}.
        </p>
      </header>

      <div className="mt-10">
        <MortgageCalculator />
      </div>

      <section className="mt-20 grid gap-10 lg:grid-cols-[1fr_1fr]">
        {/* min-w-0 lets the wide table scroll inside its box on phones instead of widening the page. */}
        <div className="min-w-0">
          <h2 className="font-display text-3xl">How much can you borrow?</h2>
          <p className="mt-3 text-ink-soft">
            The Central Bank of the UAE caps how much of a property’s value a bank may lend (the
            loan-to-value, or LTV). Banks can lend less, never more.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[30rem] text-left text-[0.92rem]">
              <thead>
                <tr className="border-b border-ink">
                  <th className="py-2 pr-3 font-medium">Property</th>
                  <th className="py-2 pr-3 font-medium">Expats</th>
                  <th className="py-2 pr-3 font-medium">UAE nationals</th>
                  <th className="py-2 font-medium">Minimum deposit</th>
                </tr>
              </thead>
              <tbody>
                {RULES.map(([property, expat, national, deposit]) => (
                  <tr key={property} className="border-b border-rule">
                    <td className="py-2.5 pr-3">{property}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{expat}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{national}</td>
                    <td className="py-2.5 tabular-nums text-ink-soft">{deposit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[0.82rem] text-ink-soft">
            Source:{" "}
            <a href={RULES_SOURCE} className="underline underline-offset-4" rel="noopener">
              CBUAE Rulebook, Mortgage Loans, Article 3
            </a>
            . Checked {RULES_CHECKED}.
          </p>
        </div>

        <div>
          <h2 className="font-display text-3xl">Questions</h2>
          <div className="mt-5 divide-y divide-rule border-y border-rule">
            {FAQ.map((entry) => (
              <details key={entry.question} className="py-4">
                <summary className="cursor-pointer list-none font-medium text-ink">{entry.question}</summary>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{entry.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <p className="mt-12 max-w-[48rem] text-[0.82rem] leading-relaxed text-ink-soft">
        This calculator gives an estimate, not financial advice. Your bank decides your rate, fees and how
        much it lends. Fees shown are Dubai’s; Abu Dhabi and the other emirates differ.
      </p>

      <section className="mt-16 rounded-3xl bg-ink px-6 py-10 text-paper sm:px-10">
        <h2 className="font-display text-3xl">Agents: give your clients this, on your own website</h2>
        <p className="mt-3 max-w-prose text-paper/75">
          {brand.name} makes websites for real estate agents in the UAE: your listings, your reviews and your
          WhatsApp, at your own address. Pick a free design and publish in minutes, then clone your voice to
          narrate your listing videos.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/for/real-estate-agent"
            className="inline-flex rounded-full bg-paper px-5 py-3 text-sm font-medium text-ink transition hover:bg-signal hover:text-signal-ink"
          >
            See agent website designs
          </Link>
          <Link
            href="/tools/voice"
            className="inline-flex rounded-full border border-paper/30 px-5 py-3 text-sm font-medium text-paper transition hover:border-paper"
          >
            Clone your voice free
          </Link>
        </div>
      </section>
    </div>
  );
}

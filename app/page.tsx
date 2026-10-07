import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import TemplateShowcase, { CollectionStrip } from "@/components/landing/TemplateShowcase";
import Faq from "@/components/landing/Faq";
import Reveal from "@/components/landing/Reveal";
import { FAQ } from "@/components/landing/faq-data";
import { brand } from "@/lib/brand";
import { PLANS, formatUsd } from "@/lib/plans";
import { siteDescription, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${brand.name} — Portfolio builder with your own domain` },
  description: siteDescription,
  alternates: { canonical: "/" },
};

const OWNERSHIP = [
  { title: "Your address", body: "A domain registered in your name, not ours. If you ever leave, it leaves with you." },
  { title: "Your words", body: "AI can tidy your sentences, but it can’t invent a job, a metric or a link. What visitors read is what you wrote." },
  { title: "Your design, intact", body: "Templates are set by a designer and protected from breakage. You change content; the layout looks after itself." },
  { title: "Your data", body: "Delete your account and everything goes with it, straight away. No dark patterns, no ‘are you sure’ maze." },
];

function SectionHeading({ kicker, children, id }: { kicker: string; children: React.ReactNode; id: string }) {
  return <div className="max-w-[46rem]">
    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">{kicker}</p>
    <h2 id={id} className="mt-4 font-display text-[clamp(2.3rem,5vw,4rem)] font-[360] leading-[0.98] tracking-[-0.03em] text-ink [font-variation-settings:'opsz'_120]">{children}</h2>
  </div>;
}

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: brand.name,
        url: siteUrl,
        applicationCategory: "DesignApplication",
        operatingSystem: "Web",
        description: siteDescription,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free to build and publish" },
      },
      { "@type": "FAQPage", mainEntity: FAQ.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) },
    ],
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <Hero />

    <HowItWorks />

    <section aria-labelledby="templates-title" className="border-t border-rule py-24 lg:py-32">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal><SectionHeading kicker="Templates" id="templates-title">A design for your <em className="font-[300]">kind of work.</em></SectionHeading></Reveal>
          <Link href="/templatechooser" className="group inline-flex items-center gap-2 text-[0.98rem] text-ink">Browse all templates <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link>
        </div>
        <div className="mt-14"><TemplateShowcase /></div>
        <CollectionStrip />
      </div>
    </section>

    <section aria-labelledby="yours-title" className="border-t border-rule bg-ink py-24 text-paper lg:py-32">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-paper/60">What stays yours</p>
          <h2 id="yours-title" className="mt-4 max-w-[18ch] font-display text-[clamp(2.3rem,5vw,4rem)] font-[360] leading-[0.98] tracking-[-0.03em] [font-variation-settings:'opsz'_120]">A portfolio is a promise. <em className="font-[300] text-[#9aa6ff] dark:text-[#2338e0]">Keep it honest.</em></h2>
        </Reveal>
        <dl className="mt-16 grid border-t border-paper/15 sm:grid-cols-2">
          {OWNERSHIP.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.06} className={`border-b border-paper/15 py-10 sm:px-0 ${index % 2 === 0 ? "sm:border-r sm:pr-10" : "sm:pl-10"}`}>
              <dt className="flex items-baseline gap-4"><span className="font-mono text-[11px] text-paper/50">0{index + 1}</span><span className="font-display text-[1.8rem] leading-none tracking-[-0.02em]">{item.title}</span></dt>
              <dd className="mt-4 max-w-[32rem] pl-9 text-[1.02rem] leading-[1.7] text-paper/70">{item.body}</dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>

    <section aria-labelledby="pricing-title" className="py-24 lg:py-32">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-14 px-5 sm:px-8 lg:grid-cols-12">
        <Reveal className="lg:col-span-5"><SectionHeading kicker="Pricing" id="pricing-title">Free to start. <em className="font-[300]">Fair after that.</em></SectionHeading>
          <p className="mt-6 max-w-[26rem] text-[1.02rem] leading-[1.7] text-ink-soft">One portfolio with a blog is free for as long as you like. Pro adds more sites and your own domain. AI is sold at cost, or bring your own Claude key.</p></Reveal>
        <div className="grid gap-px overflow-hidden rounded-xl border border-rule bg-rule sm:grid-cols-2 lg:col-span-7">
          <Reveal className="flex flex-col bg-card p-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Basic</p>
            <p className="mt-5 font-display text-[3.6rem] leading-none tracking-[-0.04em] text-ink">Free</p>
            <ul className="mt-7 space-y-3 text-[0.98rem] text-ink-soft">{["Every template and design option", "Import from CV, GitHub, LinkedIn", "Publish at a free address, with a blog", "The Investigator: your first check free", "No card needed"].map((line) => <li key={line} className="flex gap-3"><span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-ink" />{line}</li>)}</ul>
            <Link href="/templatechooser" className="mt-9 inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-[0.95rem] font-medium text-paper transition-colors hover:bg-signal hover:text-signal-ink">Start building</Link>
          </Reveal>
          <Reveal delay={0.08} className="flex flex-col bg-card p-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Pro</p>
            <p className="mt-5 font-display text-[3.6rem] leading-none tracking-[-0.04em] text-ink">{formatUsd(PLANS.pro.prices.year!)}<span className="ml-1 font-sans text-base tracking-normal text-ink-soft">/ year</span></p>
            <ul className="mt-7 space-y-3 text-[0.98rem] text-ink-soft">{["Your own domain, set up and secured for you", "Up to three live portfolios", "No Formora link on your site", `Or ${formatUsd(PLANS.pro.prices.month!)} a month`].map((line) => <li key={line} className="flex gap-3"><span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-ink" />{line}</li>)}</ul>
            <Link href="/pricing" className="mt-auto pt-9 text-[0.95rem] text-ink underline decoration-rule underline-offset-[5px] hover:decoration-ink">Compare Basic and Pro →</Link>
          </Reveal>
        </div>
      </div>
    </section>

    <section aria-labelledby="faq-title" className="border-t border-rule py-24 lg:py-32">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-14 px-5 sm:px-8 lg:grid-cols-12">
        <Reveal className="lg:col-span-4"><SectionHeading kicker="Questions" id="faq-title">Asked, <em className="font-[300]">and answered.</em></SectionHeading></Reveal>
        <div className="lg:col-span-8"><Faq /></div>
      </div>
    </section>

    <section aria-labelledby="community-title" className="border-t border-rule">
      <Link href="/community" className="group mx-auto flex max-w-[1320px] flex-col gap-6 px-5 py-20 sm:px-8 md:flex-row md:items-end md:justify-between lg:py-28">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Community</p>
          <h2 id="community-title" className="mt-4 max-w-[22ch] font-display text-[clamp(2.1rem,4.6vw,3.6rem)] font-[360] leading-[1] tracking-[-0.03em] text-ink">Suggest a feature, review a template, or <em className="font-[300] text-signal">submit your own design.</em></h2>
        </div>
        <span className="grid size-16 shrink-0 place-items-center rounded-full border border-ink text-ink transition-colors duration-300 group-hover:bg-ink group-hover:text-paper"><ArrowRight size={22} className="transition-transform duration-300 group-hover:-rotate-45" /></span>
      </Link>
    </section>
  </>;
}

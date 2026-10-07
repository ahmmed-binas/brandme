import { legal, legalConfigured } from "@/lib/legal";

export interface LegalSection { title: string; body: React.ReactNode[] }

/** Shared layout for the privacy policy and terms. */
export default function LegalPage({ eyebrow, title, intro, sections }: { eyebrow: string; title: string; intro: React.ReactNode; sections: LegalSection[] }) {
  return <div className="mx-auto max-w-[760px] px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
    {!legalConfigured() && <p className="mb-8 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[0.92rem] text-amber-950">Draft: the site owner’s name and country haven’t been filled in yet (LEGAL_NAME and LEGAL_COUNTRY).</p>}
    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">{eyebrow}</p>
    <h1 className="mt-4 font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1] tracking-[-0.02em]">{title}</h1>
    <p className="mt-3 text-[0.9rem] text-ink-faint">Last updated {legal.updated}</p>
    <div className="mt-8 text-[1.04rem] leading-[1.75] text-ink-soft">{intro}</div>
    {sections.map((section, index) => <section key={section.title} className="mt-10 border-t border-rule pt-8">
      <h2 className="font-display text-[1.5rem] leading-tight text-ink"><span className="mr-2 font-mono text-[0.85rem] text-ink-faint">{index + 1}.</span>{section.title}</h2>
      <div className="mt-3 space-y-3 text-[1rem] leading-[1.75] text-ink-soft">{section.body.map((paragraph, i) => <div key={i}>{paragraph}</div>)}</div>
    </section>)}
  </div>;
}

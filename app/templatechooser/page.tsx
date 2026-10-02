import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import { TEMPLATE_MOCKS } from "@/components/landing/TemplateMocks";
import { templateCatalog } from "@/lib/templates/catalog";

/** Server-rendered for search engines; each card shows a live-styled miniature of the template. */
export default function TemplateChooser() {
  return <div className="mx-auto max-w-[1320px] px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
    <header className="max-w-[48rem]">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Templates</p>
      <h1 className="mt-4 font-display text-[clamp(2.8rem,6.4vw,5.2rem)] font-[400] leading-[0.95] tracking-[-0.03em] text-ink [font-variation-settings:'opsz'_48]">Pick a design. <em className="font-[300] text-signal">Keep your words.</em></h1>
      <p className="mt-6 max-w-[36rem] text-[1.08rem] leading-[1.7] text-ink-soft">Each template is set by a designer and protected from breakage. Start with one; standard templates share your content, so you can switch later without retyping.</p>
    </header>

    <ul className="mt-16 grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2 xl:grid-cols-3">
      {templateCatalog.map((template, index) => {
        const mock = TEMPLATE_MOCKS.find((item) => item.id === template.id);
        return <li key={template.id}>
          <Reveal delay={index * 0.08} className="flex h-full flex-col">
            <Link href={`/templatepreview?template=${template.id}`} className="group relative block h-[380px] overflow-hidden rounded-xl border border-rule" aria-label={`Preview ${template.name}`}>
              {mock && <div className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(0.2,0.7,0.1,1)] group-hover:scale-[1.03]"><mock.Mock name="Ada Lovelace" role={template.idealFor[0]?.replace(/s$/, "") ?? "Designer"} /></div>}
              <span className="absolute bottom-4 right-4 inline-flex translate-y-1 items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[0.85rem] text-paper opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">Preview <ArrowUpRight size={14} /></span>
            </Link>
            <div className="mt-5 flex items-baseline justify-between gap-4">
              <h2 className="font-display text-[1.7rem] leading-none tracking-[-0.02em] text-ink">{template.name}</h2>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">{template.style}</p>
            </div>
            <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-soft">{template.description}</p>
            <p className="mt-3 text-[0.88rem] text-ink-faint">For {template.idealFor.join(", ").toLowerCase()}</p>
            <div className="mt-auto flex items-center gap-5 pt-6">
              <Link href={`/editor/${template.id}`} className="group/cta inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.92rem] font-medium text-paper transition-colors hover:bg-signal hover:text-signal-ink">Use this template <ArrowRight size={15} className="transition-transform group-hover/cta:translate-x-0.5" /></Link>
              <Link href={`/templatepreview?template=${template.id}`} className="text-[0.92rem] text-ink underline decoration-rule underline-offset-[5px] hover:decoration-ink">Preview</Link>
            </div>
          </Reveal>
        </li>;
      })}
    </ul>

    <p className="mt-20 border-t border-rule pt-8 text-[0.98rem] text-ink-soft">Designed a template of your own? <Link href="/community?kind=design" className="text-ink underline underline-offset-4">Submit it to the community.</Link></p>
  </div>;
}

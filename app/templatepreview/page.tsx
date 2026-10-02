import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { getTemplate, DEFAULT_TEMPLATE_ID } from "@/lib/templates/catalog";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ template?: string }> }): Promise<Metadata> {
  const selected = getTemplate((await searchParams).template ?? "") ?? getTemplate(DEFAULT_TEMPLATE_ID)!;
  return { title: `${selected.name} template`, description: selected.description, alternates: { canonical: `/templates/${selected.id}` } };
}

export default async function TemplatePreviewPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const { template } = await searchParams;
  const selected = getTemplate(template ?? "") ?? getTemplate(DEFAULT_TEMPLATE_ID)!;
  return <div className="mx-auto max-w-[1320px] px-5 pb-20 pt-10 sm:px-8">
    <Link href="/templatechooser" className="inline-flex items-center gap-2 text-[0.92rem] text-ink-soft hover:text-ink"><ArrowLeft size={15} /> All templates</Link>
    <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
      <div className="lg:col-span-4 lg:pt-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">{selected.style} · {selected.category}</p>
        <h1 className="mt-4 font-display text-[clamp(2.4rem,4.4vw,3.6rem)] font-[400] leading-[0.98] tracking-[-0.03em] text-ink [font-variation-settings:'opsz'_48]">{selected.name}</h1>
        <p className="mt-5 text-[1.05rem] leading-[1.7] text-ink-soft">{selected.description}</p>
        <ul className="mt-6 space-y-2 text-[0.95rem] text-ink-soft">{selected.idealFor.map((role) => <li key={role} className="flex gap-3"><span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-ink" />{role}</li>)}</ul>
        <div className="mt-9 flex flex-wrap items-center gap-5">
          <Link href={`/editor/${selected.id}`} className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[0.95rem] font-medium text-paper transition-colors hover:bg-signal hover:text-signal-ink">Use this template <ArrowRight size={16} /></Link>
          <Link href={`/templates/${selected.id}?sample=1&demo=true`} target="_blank" className="inline-flex items-center gap-1 text-[0.95rem] text-ink underline decoration-rule underline-offset-[5px] hover:decoration-ink">Full screen <ArrowUpRight size={14} /></Link>
        </div>
      </div>
      <div className="lg:col-span-8">
        <div className="overflow-hidden rounded-xl border border-rule bg-card shadow-[0_40px_80px_-40px_rgb(21_20_15/0.4)]">
          <div className="flex items-center gap-3 border-b border-rule px-4 py-2.5"><span aria-hidden className="flex gap-1.5">{[0, 1, 2].map((dot) => <span key={dot} className="size-2.5 rounded-full border border-rule" />)}</span><span className="flex-1 truncate rounded-md bg-paper-deep px-3 py-1.5 font-mono text-[12px] text-ink-faint">Live preview with sample content</span></div>
          <iframe src={`/templates/${selected.id}?sample=1&demo=true`} title={`${selected.name} live preview`} className="h-[70vh] min-h-[480px] w-full border-0 bg-white" />
        </div>
      </div>
    </div>
  </div>;
}

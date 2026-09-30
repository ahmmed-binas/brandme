import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getTemplate, DEFAULT_TEMPLATE_ID } from "@/lib/templates/catalog";

export default async function TemplatePreviewPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const { template } = await searchParams;
  const selected = getTemplate(template ?? "") ?? getTemplate(DEFAULT_TEMPLATE_ID)!;
  return <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6"><div className="mx-auto max-w-7xl"><Link href="/templatechooser" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><ArrowLeft size={16} /> All templates</Link><section className="mt-5 overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl"><div className="grid lg:grid-cols-[.8fr_1.2fr]"><div className="p-7 sm:p-12"><p className="text-sm font-bold uppercase tracking-[.18em] text-violet-300">Selected template</p><h1 className="mt-4 text-3xl font-black sm:text-4xl">{selected.name}</h1><p className="mt-5 leading-7 text-slate-300">{selected.description}</p><div className="mt-7 flex flex-wrap gap-2">{selected.idealFor.map((role) => <span key={role} className="rounded-full border border-white/15 px-3 py-1.5 text-sm">{role}</span>)}</div><Link href={`/editor/${selected.id}`} className="mt-9 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 font-bold hover:bg-violet-400">Customize this template <ArrowRight size={18} /></Link></div><div className="min-h-96 bg-slate-800 p-3 sm:p-7"><iframe src={`/templates/${selected.id}?demo=true`} title={`${selected.name} live preview`} className="h-[480px] w-full rounded-xl border border-white/10 bg-white shadow-2xl" /></div></div></section></div></main>;
}

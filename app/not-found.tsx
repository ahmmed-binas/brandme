import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { brand } from "@/lib/brand";

export default function NotFound() {
  return <section className="grid min-h-[calc(100vh-64px)] place-items-center bg-slate-50 px-6 py-16 dark:bg-slate-950">
    <div className="max-w-xl text-center"><p className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"><Sparkles size={14} /> {brand.name}</p><p className="mt-8 text-sm font-bold uppercase tracking-[0.22em] text-slate-400">Error 404</p><h1 className="mt-3 text-5xl font-black tracking-tight text-slate-950 dark:text-white sm:text-7xl">This page is not here.</h1><p className="mx-auto mt-5 max-w-md text-base leading-7 text-slate-600 dark:text-slate-400">It may have moved, or the link may be incomplete. Let’s get you back to making your work look great.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"><ArrowLeft size={16} /> Back home</Link><Link href="/templatechooser" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-blue-400 dark:border-white/15 dark:bg-slate-900 dark:text-white">Browse portfolios</Link></div></div>
  </section>;
}

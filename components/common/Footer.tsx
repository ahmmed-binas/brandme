import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { brand } from "@/lib/brand";

export default function Footer() {
  return <footer className="border-t border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
    <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
      <div><p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300"><Sparkles size={15} /> {brand.name}</p><h2 className="mt-4 max-w-md text-2xl font-black tracking-tight text-slate-950 dark:text-white">Make your work easier to trust.</h2><p className="mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">Build a considered portfolio that makes your experience, projects, and next step clear.</p><Link href="/templatechooser" className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:underline dark:text-blue-300">Explore portfolios <ArrowUpRight size={15} /></Link></div>
      <nav aria-label="Product navigation"><h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Product</h3><ul className="mt-4 space-y-3 text-sm"><li><Link href="/templatechooser" className="hover:text-blue-700 dark:hover:text-blue-300">Templates</Link></li><li><Link href="/editor/template-one" className="hover:text-blue-700 dark:hover:text-blue-300">Portfolio editor</Link></li><li><Link href="/" className="hover:text-blue-700 dark:hover:text-blue-300">How it works</Link></li></ul></nav>
      <div><h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Built to be useful</h3><p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">Responsive portfolio templates, editable content, and a clear path from first draft to publishable work.</p></div>
    </div>
    <div className="border-t border-slate-200 dark:border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} {brand.name}. All rights reserved.</p><p>Designed for people who make things.</p></div></div>
  </footer>;
}

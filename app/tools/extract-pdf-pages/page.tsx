import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import PdfPageStudio from "@/components/tools/PdfPageStudio";
export const metadata: Metadata = { title: "Extract PDF pages free", description: "Keep, split, and download selected PDF pages locally in your browser.", alternates: { canonical: "/tools/extract-pdf-pages" } };
export default function ExtractPdfPages() { return <main className="min-h-screen bg-slate-50 px-5 py-10 dark:bg-slate-950 sm:px-6 sm:py-16"><div className="mx-auto max-w-5xl"><Link href="/tools" className="inline-flex items-center gap-2 text-sm font-bold text-violet-700 dark:text-violet-300"><ArrowLeft size={16} /> All tools</Link><p className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-violet-700"><LockKeyhole size={14} /> Free and local</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Extract pages from a PDF.</h1><p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-400">Keep the pages you need and save them as a new PDF—without sending your document anywhere.</p><div className="mt-10"><PdfPageStudio /></div></div></main>; }

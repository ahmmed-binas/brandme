"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Check, FileText, Globe, Lock } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";

const STEPS = [
  {
    label: "Import",
    title: "Start from what you already have.",
    body: "Upload your CV, point us at your GitHub, or drop in LinkedIn’s data export. Your name, roles, projects and skills land in the right places, and nothing is invented to fill the gaps.",
  },
  {
    label: "Shape",
    title: "Edit the words. The design holds.",
    body: "Every template is set by a designer, so long names, missing photos and late-night edits can’t knock it out of shape. Changes save as you type, and Undo is always one click away.",
  },
  {
    label: "Publish",
    title: "Put it on a domain with your name.",
    body: "Publish to a Formora address for free, or buy yourname.com in a few clicks. We register it in your name, point it at your portfolio and switch on HTTPS.",
  },
];

/** Illustrations are drawn in CSS and animate only while on screen. */
function ImportVignette({ active }: { active: boolean }) {
  const sources = [
    { icon: <FileText size={14} />, label: "ada-lovelace-cv.pdf" },
    { icon: <FaGithub size={14} />, label: "github.com/ada" },
    { icon: <FaLinkedin size={14} />, label: "linkedin-export.zip" },
  ];
  const fields = [["Name", "Ada Lovelace"], ["Title", "Analyst & writer"], ["Projects", "3 found"], ["Skills", "Mathematics, Algorithms…"]];
  return <div className="grid gap-4 sm:grid-cols-[1fr_auto_1.2fr] sm:items-center">
    <ul className="space-y-2">{sources.map((source, index) => <motion.li key={source.label} initial={{ opacity: 0, x: -12 }} animate={active ? { opacity: 1, x: 0 } : {}} transition={{ delay: index * 0.12, duration: 0.5 }} className="flex items-center gap-2.5 rounded-lg border border-rule bg-card px-3 py-2.5 font-mono text-[12px] text-ink">{source.icon}{source.label}</motion.li>)}</ul>
    <svg aria-hidden viewBox="0 0 40 80" className="mx-auto hidden h-20 w-10 text-ink-faint sm:block"><motion.path d="M2 10 C 24 10, 16 40, 38 40 M2 40 L38 40 M2 70 C 24 70, 16 40, 38 40" fill="none" stroke="currentColor" strokeWidth="1" initial={{ pathLength: 0 }} animate={active ? { pathLength: 1 } : {}} transition={{ duration: 0.9, delay: 0.3 }} /></svg>
    <dl className="rounded-lg border border-rule bg-card p-4">{fields.map(([term, value], index) => <motion.div key={term} initial={{ opacity: 0 }} animate={active ? { opacity: 1 } : {}} transition={{ delay: 0.7 + index * 0.15 }} className="flex justify-between gap-4 border-b border-rule py-2 text-[13px] last:border-0"><dt className="text-ink-faint">{term}</dt><dd className="truncate text-ink">{value}</dd></motion.div>)}</dl>
  </div>;
}

function ShapeVignette({ active }: { active: boolean }) {
  const full = "I turn complicated ideas into calm, useful products.";
  const [typed, setTyped] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!active) return;
    if (reduce) { const timer = window.setTimeout(() => setTyped(full.length), 0); return () => window.clearTimeout(timer); }
    let count = 0;
    const timer = window.setInterval(() => { count += 1; setTyped(count); if (count >= full.length) window.clearInterval(timer); }, 34);
    return () => window.clearInterval(timer);
  }, [active, reduce]);
  return <div className="grid gap-4 sm:grid-cols-2">
    <div className="rounded-lg border border-rule bg-card p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">Short introduction</p>
      <p className="mt-2 min-h-[3.2em] rounded-md border border-ink/25 bg-paper px-3 py-2 text-[14px] leading-snug text-ink">{full.slice(0, typed)}<span aria-hidden className="ml-px inline-block h-[1em] w-px translate-y-[0.15em] animate-[blink_1.1s_steps(1)_infinite] bg-signal" /></p>
      <div className="mt-3 flex items-center justify-between text-[12px] text-ink-faint"><span className="flex items-center gap-1.5"><Check size={13} className="text-[#2f9e5b]" /> Saved</span><span className="rounded border border-rule px-2 py-0.5">Undo</span></div>
    </div>
    <div className="overflow-hidden rounded-lg border border-rule bg-[#f2f0e7] p-4 text-[#20251f]">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#b94f38]">Product designer</p>
      <p className="mt-1 font-display text-[1.6rem] leading-none">Ada Lovelace</p>
      <p className="mt-2 text-[13px] leading-snug text-[#62685f]">{full.slice(0, typed) || " "}</p>
      <div className="mt-4 h-px bg-[#d2cfc3]" /><div className="mt-2 space-y-1.5">{[70, 52, 61].map((width) => <div key={width} className="h-1.5 rounded bg-[#d2cfc3]" style={{ width: `${width}%` }} />)}</div>
    </div>
  </div>;
}

function PublishVignette({ active }: { active: boolean }) {
  const rows = [["adalovelace.com", "$18 / yr", true], ["adalovelace.dev", "$18 / yr", true], ["ada.com", "Taken", false]] as const;
  return <div className="rounded-lg border border-rule bg-card p-4">
    <div className="flex items-center gap-2 rounded-md border border-ink/25 bg-paper px-3 py-2 font-mono text-[13px] text-ink"><Globe size={14} className="text-ink-faint" /> ada lovelace</div>
    <ul className="mt-3 divide-y divide-rule">{rows.map(([domain, price, available], index) => <motion.li key={domain} initial={{ opacity: 0, y: 6 }} animate={active ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 + index * 0.14 }} className="flex items-center justify-between py-2.5 text-[14px]"><span className={available ? "text-ink" : "text-ink-faint line-through"}>{domain}</span><span className={`font-mono text-[12px] ${available ? "text-signal" : "text-ink-faint"}`}>{price}</span></motion.li>)}</ul>
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={active ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.85, type: "spring", stiffness: 260, damping: 20 }} className="mt-3 flex items-center justify-between rounded-md bg-ink px-3 py-2.5 text-[13px] text-paper"><span className="flex items-center gap-2"><Lock size={13} /> adalovelace.com</span><span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em]"><span className="size-1.5 rounded-full bg-[#4ade80]" /> Live</span></motion.div>
  </div>;
}

const VIGNETTES = [ImportVignette, ShapeVignette, PublishVignette];

function Step({ index, onActive }: { index: number; onActive: (index: number) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Active when the step crosses a thin band in the middle of the screen, so exactly one step is active at a time.
  const inView = useInView(ref, { margin: "-48% 0px -48% 0px" });
  const seen = useInView(ref, { amount: 0.3, once: true });
  useEffect(() => { if (inView) onActive(index); }, [inView, index, onActive]);
  const step = STEPS[index];
  const Vignette = VIGNETTES[index];
  return <div ref={ref} className="border-t border-rule py-14 lg:flex lg:min-h-[72vh] lg:flex-col lg:justify-center lg:py-20">
    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal lg:hidden">0{index + 1} — {step.label}</p>
    <h3 className="mt-3 max-w-[20ch] font-display text-[clamp(2rem,3.6vw,3rem)] font-[380] leading-[1.02] tracking-[-0.025em] text-ink lg:mt-0">{step.title}</h3>
    <p className="mt-5 max-w-[38rem] text-[1.06rem] leading-[1.7] text-ink-soft">{step.body}</p>
    <div className="mt-9 max-w-[40rem]"><Vignette active={seen} /></div>
  </div>;
}

export default function HowItWorks() {
  const [active, setActive] = useState(0);
  return <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-16 border-t border-rule">
    <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
      <div className="grid grid-cols-1 gap-x-10 lg:grid-cols-12">
        <div className="pt-16 lg:col-span-4 lg:pt-0">
          <div className="lg:sticky lg:top-24 lg:flex lg:h-[calc(100vh-6rem)] lg:flex-col lg:justify-center">
            <h2 id="how-title" className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">How it works</h2>
            <div aria-hidden className="relative mt-4 hidden h-[clamp(9rem,15vw,13rem)] overflow-hidden lg:block">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span key={active} initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "-100%" }} transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }} className="absolute inset-0 font-display text-[clamp(9rem,15vw,13rem)] font-[300] leading-[0.9] tracking-[-0.06em] text-ink [font-variation-settings:'opsz'_144]">0{active + 1}</motion.span>
              </AnimatePresence>
            </div>
            <ol className="mt-6 hidden space-y-2 lg:block">{STEPS.map((step, index) => <li key={step.label} className={`flex items-center gap-3 text-[0.95rem] transition-colors duration-300 ${index === active ? "text-ink" : "text-ink-faint"}`}><span className={`h-px transition-all duration-500 ${index === active ? "w-10 bg-signal" : "w-4 bg-rule"}`} />{step.label}</li>)}</ol>
          </div>
        </div>
        <div className="lg:col-span-8">{STEPS.map((step, index) => <Step key={step.label} index={index} onActive={setActive} />)}</div>
      </div>
    </div>
  </section>;
}

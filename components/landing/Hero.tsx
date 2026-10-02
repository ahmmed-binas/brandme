"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
import { TEMPLATE_MOCKS } from "./TemplateMocks";

const ROLE = "Product designer";
const DEFAULT_NAME = "Ada Lovelace";

/** "Ada Lovelace" → "adalovelace.com" */
function domainFor(name: string) {
  const label = name.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);
  return `${label || "yourname"}.com`;
}

/** The URL bar types the domain out whenever it changes, like someone entering it. */
function TypedDomain({ domain }: { domain: string }) {
  const [shown, setShown] = useState(domain);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) { const timer = window.setTimeout(() => setShown(domain), 0); return () => window.clearTimeout(timer); }
    let index = 0;
    let common = 0;
    while (common < Math.min(shown.length, domain.length) && shown[common] === domain[common]) common += 1;
    index = common;
    const timer = window.setInterval(() => {
      index += 1;
      setShown(domain.slice(0, index));
      if (index >= domain.length) window.clearInterval(timer);
    }, 28);
    return () => window.clearInterval(timer);
    // `shown` is intentionally read once per domain change to type from the shared prefix.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, reduce]);
  return <span className="text-ink">{shown}<span aria-hidden className="ml-px inline-block h-[1em] w-px translate-y-[0.15em] animate-[blink_1.1s_steps(1)_infinite] bg-ink" /></span>;
}

function Specimen({ name, templateIndex, onTemplate, onInteract }: { name: string; templateIndex: number; onTemplate: (index: number) => void; onInteract: () => void }) {
  const reduce = useReducedMotion();
  const frame = useRef<HTMLDivElement | null>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-5, 5]), { stiffness: 140, damping: 18 });
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [4, -4]), { stiffness: 140, damping: 18 });
  const tabsId = useId();
  const template = TEMPLATE_MOCKS[templateIndex];
  const displayName = name.trim() || "Your Name";

  const onPointerMove = (event: React.PointerEvent) => {
    if (reduce || event.pointerType !== "mouse" || !frame.current) return;
    const bounds = frame.current.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    onInteract();
    const next = (templateIndex + (event.key === "ArrowRight" ? 1 : TEMPLATE_MOCKS.length - 1)) % TEMPLATE_MOCKS.length;
    onTemplate(next);
    document.getElementById(`${tabsId}-${next}`)?.focus();
  };

  return <div className="[perspective:1600px]">
    <motion.figure
      ref={frame}
      onPointerMove={onPointerMove}
      onPointerLeave={() => { pointerX.set(0); pointerY.set(0); }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.35, ease: [0.2, 0.7, 0.1, 1] }}
      className="relative overflow-hidden rounded-xl border border-rule bg-card shadow-[0_1px_0_rgb(255_255_255/0.6)_inset,0_40px_80px_-40px_rgb(21_20_15/0.45)]"
      aria-label={`Preview of a ${template.label} portfolio for ${displayName}`}
    >
      <div className="flex items-center gap-3 border-b border-rule px-4 py-2.5">
        <span aria-hidden className="flex gap-1.5">{[0, 1, 2].map((dot) => <span key={dot} className="size-2.5 rounded-full border border-rule" />)}</span>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-paper-deep px-3 py-1.5 font-mono text-[12px] text-ink-faint">
          <Lock size={11} aria-hidden className="shrink-0" />
          <span className="truncate">https://<TypedDomain domain={domainFor(name)} /></span>
        </div>
        <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft sm:flex"><span className="size-1.5 rounded-full bg-[#2f9e5b]" /> Live</span>
      </div>
      <div className="relative h-[360px] sm:h-[440px]">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={template.id}
            className="absolute inset-0"
            initial={reduce ? { opacity: 0 } : { opacity: 0, clipPath: "inset(0 0 0 100%)" }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, clipPath: "inset(0 0 0 0%)" }}
            exit={{ opacity: 0.6 }}
            transition={{ duration: 0.75, ease: [0.65, 0, 0.35, 1] }}
          >
            <template.Mock name={displayName} role={ROLE} />
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.figure>

    <div role="tablist" aria-label="Template" onKeyDown={onKeyDown} className="mt-5 flex items-center justify-center gap-1">
      {TEMPLATE_MOCKS.map((item, index) => {
        const selected = index === templateIndex;
        return <button
          key={item.id}
          id={`${tabsId}-${index}`}
          role="tab"
          type="button"
          aria-selected={selected}
          tabIndex={selected ? 0 : -1}
          onClick={() => { onInteract(); onTemplate(index); }}
          className={`relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-colors ${selected ? "text-ink" : "text-ink-faint hover:text-ink"}`}
        >
          {selected && <motion.span layoutId="template-pill" className="absolute inset-0 rounded-full border border-rule bg-card" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
          <span className="relative size-3 rounded-full border border-rule" style={{ background: item.swatch, boxShadow: `inset 0 0 0 3px ${item.swatch}, inset 0 0 0 6px ${item.ink}` }} />
          <span className="relative">{item.label}</span>
        </button>;
      })}
    </div>
  </div>;
}

export default function Hero() {
  const [name, setName] = useState("");
  const [templateIndex, setTemplateIndex] = useState(0);
  const [touched, setTouched] = useState(false);
  const reduce = useReducedMotion();

  // Gently cycle templates until the visitor takes over.
  useEffect(() => {
    if (touched || reduce) return;
    const timer = window.setInterval(() => setTemplateIndex((index) => (index + 1) % TEMPLATE_MOCKS.length), 4200);
    return () => window.clearInterval(timer);
  }, [touched, reduce]);

  return <section aria-labelledby="hero-title" className="grain relative -mt-16 overflow-hidden pt-16">
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(60%_60%_at_78%_20%,var(--signal-soft),transparent_70%)]" />
    <div className="relative mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-14 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:pb-28 lg:pt-20">
      <div className="min-w-0 lg:col-span-6">
        <p className="rise font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft" style={{ "--i": 0 } as React.CSSProperties}>Portfolio builder · Free to publish</p>
        <h1 id="hero-title" className="mt-6 font-display text-[clamp(3rem,8.4vw,6.6rem)] font-[360] leading-[0.92] tracking-[-0.035em] text-ink [font-variation-settings:'opsz'_144]">
          <span className="line"><span className="rise" style={{ "--i": 1 } as React.CSSProperties}>Your work,</span></span>
          <span className="line"><span className="rise" style={{ "--i": 2 } as React.CSSProperties}>at <em className="font-[300] text-signal">your own</em></span></span>
          <span className="line"><span className="rise" style={{ "--i": 3 } as React.CSSProperties}>address.</span></span>
        </h1>
        <p className="rise mt-8 max-w-[34rem] text-[1.12rem] leading-[1.65] text-ink-soft" style={{ "--i": 4 } as React.CSSProperties}>
          Formora turns your CV, GitHub or LinkedIn into a portfolio that’s carefully typeset, quick to load, and published at a domain with your name on it.
        </p>

        <form onSubmit={(event) => event.preventDefault()} className="rise mt-10 max-w-[30rem]" style={{ "--i": 5 } as React.CSSProperties}>
          <label htmlFor="hero-name" className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">See it with your name</label>
          <div className="group mt-2 flex items-end gap-3 border-b border-ink/30 pb-2 transition-colors focus-within:border-ink">
            <input
              id="hero-name"
              value={name}
              onChange={(event) => { setName(event.target.value.slice(0, 40)); setTouched(true); }}
              placeholder={DEFAULT_NAME}
              autoComplete="name"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent font-display text-[1.75rem] leading-tight text-ink outline-none placeholder:text-ink-faint/70"
            />
            <span aria-live="polite" className="pb-1.5 font-mono text-[12px] text-ink-soft">{domainFor(name || DEFAULT_NAME)}</span>
          </div>
        </form>

        <div className="rise mt-9 flex flex-wrap items-center gap-x-6 gap-y-4" style={{ "--i": 6 } as React.CSSProperties}>
          <Link href="/templatechooser" className="group inline-flex items-center gap-3 rounded-full bg-ink py-3.5 pl-6 pr-5 text-[0.98rem] font-medium text-paper transition-colors hover:bg-signal hover:text-signal-ink">
            Build your portfolio
            <span className="grid size-7 place-items-center rounded-full bg-paper/15 transition-transform duration-300 group-hover:translate-x-0.5"><ArrowRight size={15} /></span>
          </Link>
          <Link href="/templates/editorial-developer" className="text-[0.98rem] text-ink underline decoration-ink/25 underline-offset-[6px] transition hover:decoration-ink">See a live example</Link>
        </div>
      </div>

      <div className="relative min-w-0 lg:col-span-6 lg:pl-6 xl:pl-10">
        <p aria-hidden className="pointer-events-none absolute -top-14 left-10 hidden rotate-[-4deg] font-display text-[1.15rem] italic text-ink-soft xl:block">
          Typed live. Try your own name
          <svg viewBox="0 0 120 60" className="absolute left-full top-2 ml-2 h-12 w-24 text-ink-soft"><path d="M2 8 C 40 2, 78 10, 96 44 M96 44 l-11 -3 M96 44 l2 -11" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
        </p>
        <Specimen name={name || DEFAULT_NAME} templateIndex={templateIndex} onTemplate={setTemplateIndex} onInteract={() => setTouched(true)} />
      </div>
    </div>
  </section>;
}

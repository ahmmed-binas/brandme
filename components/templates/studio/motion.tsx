"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Motion for the studio's moving templates.
 *
 * Everything here works in three places: the live site (the window scrolls),
 * the editor (a panel scrolls) and static captures (thumbnails, where
 * `data-static` is set and every effect shows its finished state). Motion is
 * driven by CSS variables written straight to the element, so scrolling
 * never re-renders React. People who ask for reduced motion get the
 * finished state with no movement.
 */

const isStatic = () => typeof document !== "undefined" && document.documentElement.dataset.static !== undefined;
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const motionOff = () => isStatic() || reducedMotion();

/** The element that scrolls this one: the editor’s preview panel, or the window. */
export function scrollParent(node: HTMLElement | null): HTMLElement | Window {
  for (let current = node?.parentElement; current; current = current.parentElement) {
    const { overflowY } = getComputedStyle(current);
    if ((overflowY === "auto" || overflowY === "scroll") && current.scrollHeight > current.clientHeight) return current;
  }
  return window;
}

const viewport = (parent: HTMLElement | Window) => parent instanceof Window
  ? { top: 0, height: window.innerHeight, width: window.innerWidth }
  : (() => { const rect = parent.getBoundingClientRect(); return { top: rect.top, height: parent.clientHeight, width: parent.clientWidth }; })();

type Mode = "through" | "pin" | "enter";

/**
 * Writes scroll progress (0–1) to `--p` on the element.
 * through: from the element’s top entering to its bottom leaving.
 * pin: across a tall section whose child is sticky.
 * enter: from entering to reaching the middle of the screen.
 */
export function useScrollProgress<T extends HTMLElement>(mode: Mode = "through", restingValue = 1, onProgress?: (progress: number) => void) {
  const ref = useRef<T | null>(null);
  const callback = useRef(onProgress);
  useEffect(() => { callback.current = onProgress; });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (motionOff()) { node.style.setProperty("--p", String(restingValue)); callback.current?.(restingValue); return; }
    const parent = scrollParent(node);
    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const view = viewport(parent);
      const top = rect.top - view.top;
      let progress: number;
      if (mode === "pin") progress = -top / Math.max(1, rect.height - view.height);
      else if (mode === "enter") progress = (view.height - top) / Math.max(1, view.height / 2 + rect.height / 2);
      else progress = (view.height - top) / Math.max(1, view.height + rect.height);
      progress = Math.min(1, Math.max(0, progress));
      node.style.setProperty("--p", progress.toFixed(4));
      callback.current?.(progress);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    parent.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(frame); parent.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, [mode, restingValue]);
  return ref;
}

/** A wrapper that exposes `--p` to its children. */
export function Scrub({ mode = "through", resting = 1, className = "", style, children, as: Tag = "div" }: { mode?: Mode; resting?: number; className?: string; style?: CSSProperties; children: ReactNode; as?: "div" | "section" | "figure" | "li" }) {
  const ref = useScrollProgress<HTMLElement>(mode, resting);
  return <Tag ref={ref as never} className={className} style={{ "--p": resting, ...style } as CSSProperties}>{children}</Tag>;
}

/** True once the element has been on screen. Static captures and reduced motion count as seen. */
export function useSeen<T extends HTMLElement>(margin = "0px 0px -12% 0px") {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (motionOff()) { const frame = requestAnimationFrame(() => setSeen(true)); return () => cancelAnimationFrame(frame); }
    const observer = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) { setSeen(true); observer.disconnect(); } }, { rootMargin: margin });
    observer.observe(node);
    return () => observer.disconnect();
  }, [margin]);
  return [ref, seen] as const;
}

/** Words that rise into place one after another when they come into view. */
export function Words({ text, className = "", delay = 0, step = 55 }: { text?: string; className?: string; delay?: number; step?: number }) {
  const [ref, seen] = useSeen<HTMLSpanElement>("0px");
  const words = (text ?? "").split(/(\s+)/);
  return <span ref={ref} className={className}>
    {words.map((word, index) => /^\s+$/.test(word) ? word : <span key={index} className="inline-block overflow-hidden pb-[0.08em] align-bottom"><span className="inline-block transition-[transform,opacity] duration-[900ms] ease-[cubic-bezier(.2,.7,.1,1)]" style={{ transform: seen ? "none" : "translateY(105%)", opacity: seen ? 1 : 0, transitionDelay: `${delay + (index / 2) * step}ms` }}>{word}</span></span>)}
  </span>;
}

/** Counts up to a figure like “64”, “£38m”, “101.8%” or “1,400+” the first time it’s seen. */
export function CountUp({ value, className = "", duration = 1600 }: { value?: string; className?: string; duration?: number }) {
  const [ref, seen] = useSeen<HTMLSpanElement>();
  const match = (value ?? "").match(/^([^\d−-]*)([−-]?)([\d,]*\.?\d+)(.*)$/);
  const [shown, setShown] = useState<string | null>(null);
  useEffect(() => {
    if (!seen || !match || motionOff()) return;
    const [, prefix, sign, digits, suffix] = match;
    const target = Number.parseFloat(digits!.replace(/,/g, ""));
    const decimals = digits!.includes(".") ? digits!.split(".")[1]!.length : 0;
    const grouped = digits!.includes(",");
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = (target * eased).toFixed(decimals);
      const formatted = grouped ? Number(current).toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : current;
      setShown(`${prefix}${sign}${formatted}${suffix}`);
      if (t < 1) frame = requestAnimationFrame(tick); else setShown(null);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once when first seen
  }, [seen]);
  return <span ref={ref} className={`tabular-nums ${className}`}>{shown ?? value}</span>;
}

/** Follows the pointer inside an element: writes `--mx`/`--my` (px) and `--hover` (0/1). */
export function usePointer<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || motionOff() || !window.matchMedia("(pointer: fine)").matches) return;
    const move = (event: PointerEvent) => { const rect = node.getBoundingClientRect(); node.style.setProperty("--mx", `${event.clientX - rect.left}px`); node.style.setProperty("--my", `${event.clientY - rect.top}px`); };
    const enter = () => node.style.setProperty("--hover", "1");
    const leave = () => node.style.setProperty("--hover", "0");
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerenter", enter);
    node.addEventListener("pointerleave", leave);
    return () => { node.removeEventListener("pointermove", move); node.removeEventListener("pointerenter", enter); node.removeEventListener("pointerleave", leave); };
  }, []);
  return ref;
}

/** A button or link that leans towards the pointer. */
export function Magnetic({ children, className = "", strength = 0.3 }: { children: ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || motionOff() || !window.matchMedia("(pointer: fine)").matches) return;
    const move = (event: PointerEvent) => { const rect = node.getBoundingClientRect(); node.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * strength}px, ${(event.clientY - rect.top - rect.height / 2) * strength}px)`; };
    const leave = () => { node.style.transform = ""; };
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerleave", leave);
    return () => { node.removeEventListener("pointermove", move); node.removeEventListener("pointerleave", leave); };
  }, [strength]);
  return <span ref={ref} className={`inline-block transition-transform duration-300 ease-[cubic-bezier(.2,.7,.1,1)] ${className}`}>{children}</span>;
}

/** Cycles through items every few seconds, pausing while hovered. Static captures stay on the first. */
export function useRotation(count: number, every = 6000) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (count < 2 || paused || motionOff()) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), every);
    return () => window.clearInterval(timer);
  }, [count, every, paused]);
  return { index: Math.min(index, Math.max(0, count - 1)), setIndex, pause: () => setPaused(true), resume: () => setPaused(false) };
}

/** Horizontal track driven by vertical scroll on wide screens; a swipeable row on narrow ones. */
export function HorizontalScroll({ children, className = "", height = 3 }: { children: ReactNode; className?: string; height?: number }) {
  const box = useRef<HTMLDivElement | null>(null);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const check = () => setWide(!motionOff() && node.clientWidth >= 760);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={box}>{wide
    ? <PinnedTrack className={className} height={height}>{children}</PinnedTrack>
    : <div className={`flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto pb-4 [scrollbar-width:thin] @3xl:scroll-px-12 ${className}`}>{children}</div>}</div>;
}

function PinnedTrack({ children, className, height }: { children: ReactNode; className: string; height: number }) {
  const track = useRef<HTMLDivElement | null>(null);
  const outer = useScrollProgress<HTMLDivElement>("pin", 0, (progress) => {
    const node = track.current;
    if (!node) return;
    const distance = Math.max(0, node.scrollWidth - (node.parentElement?.clientWidth ?? node.clientWidth));
    node.style.transform = `translate3d(${-distance * progress}px,0,0)`;
  });
  return <div ref={outer} style={{ height: `${height * 100}vh` }} className="relative">
    <div className="sticky top-0 flex h-[100vh] max-h-[56rem] items-center overflow-hidden">
      <div ref={track} className={`flex w-max gap-6 will-change-transform ${className}`}>{children}</div>
    </div>
  </div>;
}

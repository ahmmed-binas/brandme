"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

/**
 * Splits a list into pages. The page goes back to 1 whenever `resetKey`
 * changes (a new search or filter), is kept in the address bar as ?page=,
 * and changing page scrolls back to the top of the list.
 */
export function usePaged<T>(items: T[], pageSize: number, resetKey: string) {
  const [page, setPage] = useState(1);
  const top = useRef<HTMLDivElement | null>(null);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pages);
  // A shared link with ?page=3 opens on page 3 (read after hydration, so server and browser agree).
  useEffect(() => {
    const wanted = Number(new URL(window.location.href).searchParams.get("page")) || 1;
    if (wanted > 1) { const frame = requestAnimationFrame(() => setPage(wanted)); return () => cancelAnimationFrame(frame); }
  }, []);
  const lastKey = useRef(resetKey);
  useEffect(() => {
    if (lastKey.current === resetKey) return;
    lastKey.current = resetKey;
    const frame = requestAnimationFrame(() => setPage(1));
    return () => cancelAnimationFrame(frame);
  }, [resetKey]);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (current > 1) url.searchParams.set("page", String(current)); else url.searchParams.delete("page");
    window.history.replaceState(null, "", url);
  }, [current]);
  const go = (next: number) => {
    setPage(Math.min(pages, Math.max(1, next)));
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return { items: items.slice((current - 1) * pageSize, current * pageSize), page: current, pages, go, top };
}

/** Page numbers with “…” gaps: 1 … 4 5 6 … 12. */
function numbers(page: number, pages: number): Array<number | "gap"> {
  const wanted = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...wanted].sort((a, b) => a - b);
  return sorted.flatMap((n, index) => (index && n - sorted[index - 1]! > 1 ? ["gap" as const, n] : [n]));
}

/** Previous / numbers / Next. Hidden when everything fits on one page. */
export function Pagination({ page, pages, go, label = "Pages" }: { page: number; pages: number; go: (page: number) => void; label?: string }) {
  if (pages < 2) return null;
  const button = "inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full border px-3 text-[0.92rem] transition-colors disabled:pointer-events-none disabled:opacity-35";
  return <nav aria-label={label} className="mt-14 flex flex-wrap items-center justify-center gap-2">
    <button type="button" onClick={() => go(page - 1)} disabled={page === 1} className={`${button} border-rule text-ink hover:border-ink`}><ArrowLeft size={15} /> <span className="hidden sm:inline">Previous</span></button>
    {numbers(page, pages).map((item, index) => item === "gap"
      ? <span key={`gap-${index}`} className="px-1 text-ink-faint">…</span>
      : <button key={item} type="button" onClick={() => go(item)} aria-current={item === page ? "page" : undefined} className={`${button} ${item === page ? "border-ink bg-ink text-paper" : "border-rule text-ink hover:border-ink"}`}>{item}</button>)}
    <button type="button" onClick={() => go(page + 1)} disabled={page === pages} className={`${button} border-rule text-ink hover:border-ink`}><span className="hidden sm:inline">Next</span> <ArrowRight size={15} /></button>
  </nav>;
}

export type PagedTop = RefObject<HTMLDivElement | null>;

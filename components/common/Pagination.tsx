"use client";

import { useEffect, useRef, useState, type MouseEvent, type RefObject } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

/**
 * Splits a list into pages.
 *
 * Search-engine friendly: the server renders the page asked for (`initialPage`,
 * read from ?page= by the route), and every page number is a real link
 * (`/gallery?page=3`) that a crawler can follow. In the browser the links
 * change page instantly without reloading, keep ?page= in the address bar, go
 * back to page 1 when a search or filter changes (`resetKey`), and scroll to
 * the top of the list.
 */
export function usePaged<T>(items: T[], pageSize: number, resetKey: string, initialPage = 1) {
  const [page, setPage] = useState(initialPage);
  const top = useRef<HTMLDivElement | null>(null);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pages);
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

/** The address of page `n` of a list at `basePath`: page 1 is the bare path. */
export const pageHref = (basePath: string, n: number) => (n > 1 ? `${basePath}?page=${n}` : basePath);

/**
 * Previous / numbers / Next as links. Crawlers follow the hrefs; in the
 * browser a click changes page in place. Hidden when everything fits.
 */
export function Pagination({ page, pages, go, basePath, label = "Pages" }: { page: number; pages: number; go: (page: number) => void; basePath: string; label?: string }) {
  if (pages < 2) return null;
  const link = "inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full border px-3 text-[0.92rem] transition-colors";
  const click = (n: number) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return; // new tab etc. still work
    event.preventDefault();
    go(n);
  };
  const edge = (n: number, rel: "prev" | "next", children: React.ReactNode) => (n < 1 || n > pages
    ? <span aria-disabled="true" className={`${link} pointer-events-none border-rule text-ink opacity-35`}>{children}</span>
    : <a href={pageHref(basePath, n)} rel={rel} onClick={click(n)} className={`${link} border-rule text-ink hover:border-ink`}>{children}</a>);
  return <nav aria-label={label} className="mt-14 flex flex-wrap items-center justify-center gap-2">
    {edge(page - 1, "prev", <><ArrowLeft size={15} /> <span className="hidden sm:inline">Previous</span></>)}
    {numbers(page, pages).map((item, index) => item === "gap"
      ? <span key={`gap-${index}`} className="px-1 text-ink-faint">…</span>
      : <a key={item} href={pageHref(basePath, item)} onClick={click(item)} aria-current={item === page ? "page" : undefined} aria-label={`Page ${item}`} className={`${link} ${item === page ? "border-ink bg-ink text-paper" : "border-rule text-ink hover:border-ink"}`}>{item}</a>)}
    {edge(page + 1, "next", <><span className="hidden sm:inline">Next</span> <ArrowRight size={15} /></>)}
  </nav>;
}

export type PagedTop = RefObject<HTMLDivElement | null>;

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Download, Search, Star, X } from "lucide-react";
import type { GalleryItem } from "@/lib/gallery/items";

const FILTERS = [
  { id: "all", label: "Everything" },
  { id: "original", label: "Studio originals" },
  { id: "community", label: "Community" },
  { id: "motion", label: "Moving designs" },
] as const;
type Filter = (typeof FILTERS)[number]["id"];

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** Phones and tablets: no hover, so the tile in the middle of the screen plays instead. */
const touchOnly = () => typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n));

/**
 * One square tile: the design's clip plays on hover (or when it's in the middle
 * of the screen on phones), and the tile tilts towards the pointer with a soft
 * glare, like a card held in the hand.
 */
function Tile({ item, index }: { item: GalleryItem; index: number }) {
  const card = useRef<HTMLAnchorElement | null>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  const [shown, setShown] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Rise into view once.
  useEffect(() => {
    const node = card.current;
    if (!node) return;
    if (reducedMotion()) { const frame = requestAnimationFrame(() => setShown(true)); return () => cancelAnimationFrame(frame); }
    const observer = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) { setShown(true); observer.disconnect(); } }, { rootMargin: "0px 0px -8% 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // On touch screens, play the tile nearest the middle of the screen.
  useEffect(() => {
    const node = card.current;
    if (!node || !touchOnly() || reducedMotion() || !item.clips.length) return;
    const observer = new IntersectionObserver(([entry]) => setPlaying(Boolean(entry?.isIntersecting)), { rootMargin: "-35% 0px -35% 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [item.clips.length]);

  useEffect(() => {
    const clip = video.current;
    if (!clip) return;
    if (playing) { clip.play().catch(() => undefined); } else { clip.pause(); }
  }, [playing]);

  const move = (event: React.PointerEvent) => {
    const node = card.current;
    if (!node || reducedMotion() || event.pointerType !== "mouse") return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    node.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
    node.style.setProperty("--ry", `${(x * 12).toFixed(2)}deg`);
    node.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(1)}%`);
    node.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(1)}%`);
  };
  const enter = (event?: React.PointerEvent) => { if ((!event || event.pointerType === "mouse") && !reducedMotion()) setPlaying(true); };
  const leave = (event?: React.PointerEvent) => {
    const node = card.current;
    node?.style.setProperty("--rx", "0deg");
    node?.style.setProperty("--ry", "0deg");
    if (!event || event.pointerType === "mouse") setPlaying(false);
  };

  return <li className="[perspective:1100px]" style={{ transitionDelay: `${(index % 3) * 70}ms` }}>
    <Link ref={card} href={`/gallery/${item.slug}`} onPointerMove={move} onPointerEnter={enter} onPointerLeave={leave} onFocus={() => enter()} onBlur={() => leave()}
      className={`group relative block aspect-square overflow-hidden rounded-[1.4rem] bg-ink/5 shadow-[0_1px_0_rgba(0,0,0,.04),0_24px_60px_-30px_rgba(0,0,0,.45)] outline-none ring-ink/0 transition-[transform,opacity,box-shadow] duration-[600ms] ease-[cubic-bezier(.2,.7,.1,1)] [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))_translateY(var(--lift,0px))] [transform-style:preserve-3d] hover:[--lift:-6px] hover:shadow-[0_40px_80px_-30px_rgba(0,0,0,.55)] focus-visible:ring-2 focus-visible:ring-ink ${shown ? "opacity-100" : "translate-y-8 opacity-0"}`}
      aria-label={`${item.title} by ${item.designer.name}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- poster frame, already sized */}
      <img src={item.poster} alt="" loading={index < 6 ? "eager" : "lazy"} decoding="async" className="absolute inset-0 size-full object-cover object-top transition-transform duration-[1.2s] ease-[cubic-bezier(.2,.7,.1,1)] group-hover:scale-[1.04]" />
      {item.clips.length > 0 && <video ref={video} muted loop playsInline preload="none" aria-hidden className={`absolute inset-0 size-full object-cover object-top transition-opacity duration-500 ${playing ? "opacity-100" : "opacity-0"}`}>{item.clips.map((clip) => <source key={clip.src} src={clip.src} type={clip.type} />)}</video>}
      <span aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 [background:radial-gradient(circle_at_var(--gx,50%)_var(--gy,50%),rgba(255,255,255,.28),transparent_45%)] group-hover:opacity-100" />
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      <span className="absolute left-4 top-4 flex gap-1.5 [transform:translateZ(30px)]">
        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-black backdrop-blur">Free</span>
        {item.kind === "community" && <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">Community</span>}
        {item.motion && <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">Moves</span>}
      </span>
      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white [transform:translateZ(40px)]">
        <span className="min-w-0">
          <span className="block truncate font-display text-[1.65rem] leading-none tracking-[-0.02em]">{item.title}</span>
          <span className="mt-1.5 block truncate text-[0.84rem] text-white/75">by {item.designer.username ? `@${item.designer.username}` : item.designer.name}</span>
        </span>
        <span className="flex shrink-0 items-center gap-3 text-[0.8rem] text-white/85">
          <span className="inline-flex items-center gap-1" aria-label={item.rating.count ? `Rated ${item.rating.average?.toFixed(1)} out of 5` : "No ratings yet"}><Star size={13} className={item.rating.count ? "fill-amber-300 text-amber-300" : ""} />{item.rating.count ? item.rating.average?.toFixed(1) : "–"}</span>
          <span className="inline-flex items-center gap-1" aria-label={`${item.downloads} downloads`}><Download size={13} />{compact(item.downloads)}</span>
        </span>
      </span>
    </Link>
  </li>;
}

export default function GalleryGrid({ items, initialQuery = "" }: { items: GalleryItem[]; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<Filter>("all");
  const matches = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((item) => {
      if (filter === "original" && item.kind !== "original") return false;
      if (filter === "community" && item.kind !== "community") return false;
      if (filter === "motion" && !item.motion) return false;
      const haystack = `${item.title} ${item.summary} ${item.tags.join(" ")} ${item.keywords} ${item.designer.name} ${item.designer.username ?? ""}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
  }, [items, query, filter]);

  // Keep the search in the address bar so a search can be shared.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("q", query); else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  }, [query]);

  return <>
    <div className="sticky top-16 z-20 -mx-5 mt-12 border-y border-rule bg-paper/90 px-5 py-4 backdrop-blur-md sm:-mx-8 sm:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[16rem] flex-1">
          <span className="sr-only">Search templates</span>
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search: lawyer, photographer, dark, motion, minimal…" className="w-full rounded-full border border-rule bg-card py-3 pl-11 pr-10 text-[0.98rem] text-ink outline-none transition focus:border-ink" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-faint hover:text-ink"><X size={16} /></button>}
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter">{FILTERS.map((option) => <button key={option.id} type="button" onClick={() => setFilter(option.id)} aria-pressed={filter === option.id} className={`rounded-full border px-4 py-2 text-[0.9rem] transition ${filter === option.id ? "border-ink bg-ink text-paper" : "border-rule text-ink-soft hover:border-ink hover:text-ink"}`}>{option.label}</button>)}</div>
      </div>
    </div>
    <p className="mt-6 text-[0.9rem] text-ink-soft" aria-live="polite">{matches.length} {matches.length === 1 ? "template" : "templates"}{query ? ` for “${query}”` : ""}</p>
    {matches.length
      ? <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{matches.map((item, index) => <Tile key={item.key} item={item} index={index} />)}</ul>
      : <div className="mt-16 text-center"><p className="font-display text-[2rem] text-ink">Nothing matches yet.</p><p className="mt-2 text-ink-soft">Try a profession or a style, or <button type="button" onClick={() => { setQuery(""); setFilter("all"); }} className="underline">see everything</button>.</p></div>}
  </>;
}

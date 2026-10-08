"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { StandardContent } from "@/lib/portfolio/schema";
import { motionOff } from "../motion";

/**
 * Shared pieces for the real estate templates: reading prices typed as text,
 * currency conversion, mortgage maths, listing filters, a gallery lightbox and
 * the ways agents are actually contacted (viewing requests, WhatsApp).
 *
 * Listings are the content model's projects: title = address, client = price,
 * role = beds/baths/size, category = status ("For sale", "Sold"…), year = when,
 * description, image and live_url (a portal link).
 */

export type Listing = NonNullable<StandardContent["projects"]>[number];

const SYMBOLS: Record<string, string> = { "$": "USD", "£": "GBP", "€": "EUR", "AED": "AED", "USD": "USD", "GBP": "GBP", "EUR": "EUR", "CHF": "CHF", "SAR": "SAR", "QAR": "QAR", "CAD": "CAD", "AUD": "AUD", "INR": "INR" };

/** “AED 12,500,000”, “$865,000”, “£1.25m”, “€2.4M”, “From £395k” → amount and currency. Null when there's no number. */
export function parsePrice(text?: string): { amount: number; currency: string | null } | null {
  if (!text) return null;
  const match = text.replace(/\s+/g, " ").match(/([\d][\d,]*(?:\.\d+)?)\s*([km]|bn|million)?\b/i);
  if (!match) return null;
  let amount = Number.parseFloat(match[1]!.replace(/,/g, ""));
  const unit = match[2]?.toLowerCase();
  if (unit === "k") amount *= 1e3; else if (unit === "m" || unit === "million") amount *= 1e6; else if (unit === "bn") amount *= 1e9;
  const code = Object.keys(SYMBOLS).find((symbol) => text.toUpperCase().includes(symbol));
  return Number.isFinite(amount) && amount > 0 ? { amount, currency: code ? SYMBOLS[code]! : null } : null;
}

/** Units of each currency per US dollar. Approximate; shown to visitors as a guide only. */
export const RATES: Record<string, number> = { USD: 1, AED: 3.6725, GBP: 0.78, EUR: 0.9, CHF: 0.86, SAR: 3.75, QAR: 3.64, CAD: 1.37, AUD: 1.5, INR: 84 };
export const CURRENCY_SIGN: Record<string, string> = { USD: "$", GBP: "£", EUR: "€", AED: "AED ", CHF: "CHF ", SAR: "SAR ", QAR: "QAR ", CAD: "C$", AUD: "A$", INR: "₹" };

export const convert = (amount: number, from: string, to: string) => (amount / (RATES[from] ?? 1)) * (RATES[to] ?? 1);

/** 12500000 → “12.5M”, 865000 → “865K” (compact) or “865,000”. */
export function money(amount: number, currency: string | null, compact = false): string {
  const sign = currency ? CURRENCY_SIGN[currency] ?? `${currency} ` : "";
  if (compact && amount >= 1e6) return `${sign}${(amount / 1e6).toFixed(amount >= 1e7 ? 1 : 2).replace(/\.?0+$/, "")}M`;
  if (compact && amount >= 1e4) return `${sign}${Math.round(amount / 1e3)}K`;
  return `${sign}${Math.round(amount).toLocaleString("en-GB")}`;
}

/** Monthly repayment on a repayment mortgage. */
export function monthlyPayment(principal: number, ratePercent: number, years: number): number {
  const months = Math.max(1, Math.round(years * 12));
  const r = ratePercent / 100 / 12;
  if (principal <= 0) return 0;
  return r === 0 ? principal / months : (principal * r) / (1 - Math.pow(1 + r, -months));
}

/** Statuses in the order they first appear, for filter tabs. */
export const statuses = (listings: Listing[]) => [...new Set(listings.map((item) => item.category?.trim()).filter(Boolean) as string[])];
export const isSold = (status?: string) => /sold|let agreed|completed|under offer|reserved/i.test(status ?? "");

/** Digits only, for wa.me and tel: links. */
const digits = (phone?: string) => (phone ?? "").replace(/[^\d]/g, "");
export const tel = (phone?: string) => (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "#contact");
export const whatsapp = (phone?: string, text = "") => (digits(phone).length >= 8 ? `https://wa.me/${digits(phone)}${text ? `?text=${encodeURIComponent(text)}` : ""}` : null);
export const mail = (email?: string, subject = "", body = "") => (email ? `mailto:${email}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ""}` : "#contact");

/** “Arrange a viewing of 4012 SE Lincoln St” by WhatsApp when there's a mobile, otherwise email. */
export function viewingLink(c: StandardContent, listing: Listing): string {
  const text = `Hello${c.name ? ` ${c.name.split(/\s+/)[0]}` : ""}, I’d like to arrange a viewing of ${listing.title ?? "this home"}${listing.client ? ` (${listing.client})` : ""}.`;
  return whatsapp(c.phone, text) ?? mail(c.email, `Viewing: ${listing.title ?? "a home"}`, text);
}

/** The listing's own page (a portal link) when there is one. */
export const listingUrl = (listing: Listing) => listing.live_url || null;

/** A date written in free text (“Launching 14 November 2026”) → time left, ticking every second. */
export function useCountdown(text?: string) {
  const target = (() => {
    const found = (text ?? "").match(/(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})/);
    const time = found ? Date.parse(found[1]!) : Number.NaN;
    return Number.isFinite(time) ? time : null;
  })();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (target === null) return;
    const tick = () => setNow(Date.now());
    const frame = requestAnimationFrame(tick);
    if (motionOff()) return () => cancelAnimationFrame(frame);
    const timer = window.setInterval(tick, 1000);
    return () => { cancelAnimationFrame(frame); window.clearInterval(timer); };
  }, [target]);
  if (target === null || now === null) return null;
  const left = Math.max(0, target - now);
  return { days: Math.floor(left / 864e5), hours: Math.floor(left / 36e5) % 24, minutes: Math.floor(left / 6e4) % 60, seconds: Math.floor(left / 1e3) % 60, done: left === 0 };
}

/**
 * A full-screen gallery: arrows, keyboard and swipe. Uses <dialog> so it sits
 * above the page without fixed positioning. In the editor it stays closed,
 * because clicks there open fields instead.
 */
export function useLightbox(count: number, embedded?: boolean) {
  const [index, setIndex] = useState<number | null>(null);
  return {
    index,
    open: (at: number) => { if (!embedded && count > 0) setIndex(at); },
    close: () => setIndex(null),
    step: (by: number) => setIndex((current) => (current === null ? null : (current + by + count) % count)),
  };
}

export function Lightbox({ items, box, accent = "#fff" }: { items: Array<{ image?: string; caption?: string }>; box: ReturnType<typeof useLightbox>; accent?: string }) {
  const dialog = useRef<HTMLDialogElement | null>(null);
  const touch = useRef<number | null>(null);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (box.index !== null && !node.open) node.showModal();
    if (box.index === null && node.open) node.close();
  }, [box.index]);
  const item = box.index !== null ? items[box.index] : null;
  return <dialog ref={dialog} onClose={box.close} onClick={(event) => { if (event.target === dialog.current) box.close(); }}
    onKeyDown={(event) => { if (event.key === "ArrowRight") box.step(1); if (event.key === "ArrowLeft") box.step(-1); }}
    onTouchStart={(event) => { touch.current = event.touches[0]?.clientX ?? null; }}
    onTouchEnd={(event) => { const start = touch.current; const end = event.changedTouches[0]?.clientX; if (start !== null && end !== undefined && Math.abs(end - start) > 40) box.step(end < start ? 1 : -1); touch.current = null; }}
    aria-label="Photo gallery" className="m-0 h-dvh max-h-none w-screen max-w-none bg-black/95 p-0 text-white backdrop:bg-black/80">
    {item && <div className="relative grid h-full grid-rows-[auto_1fr_auto]">
      <div className="flex items-center justify-between px-5 py-4 text-[13px] tracking-[0.18em]">
        <span className="tabular-nums opacity-70">{String((box.index ?? 0) + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</span>
        <button type="button" onClick={box.close} className="rounded-full border border-white/30 px-4 py-1.5 text-[12px] uppercase hover:bg-white hover:text-black" autoFocus>Close</button>
      </div>
      <div className="relative flex min-h-0 items-center justify-center px-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- owner's photos */}
        <img key={item.image} src={item.image} alt={item.caption ?? ""} className="max-h-full max-w-full object-contain [animation:re-fade_.45s_ease]" />
        {items.length > 1 && <>
          <button type="button" onClick={() => box.step(-1)} aria-label="Previous photo" className="absolute left-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-2xl backdrop-blur hover:bg-white hover:text-black">‹</button>
          <button type="button" onClick={() => box.step(1)} aria-label="Next photo" className="absolute right-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-2xl backdrop-blur hover:bg-white hover:text-black">›</button>
        </>}
      </div>
      <p className="min-h-12 px-5 py-4 text-center text-[15px] opacity-85">{item.caption}</p>
      <span aria-hidden className="absolute bottom-0 left-0 h-0.5 transition-[width] duration-500" style={{ width: `${(((box.index ?? 0) + 1) / items.length) * 100}%`, background: accent }} />
      <style>{"@keyframes re-fade{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:none}}"}</style>
    </div>}
  </dialog>;
}

/**
 * Classes for a mosaic of n photos in a 4-column grid (2 on phones) with no
 * gaps: every fifth photo is large when four small ones follow it, and the
 * last row's photos widen to fill it.
 */
export function mosaic(count: number): string[] {
  const big = (index: number) => index % 5 === 0 && index + 4 < count;
  const classes: string[] = Array.from({ length: count }, (_, index) => (big(index) ? "col-span-2 row-span-2" : ""));
  let cells = 0;
  classes.forEach((value) => { cells += value ? 4 : 1; });
  const rest = cells % 4;
  if (rest === 1) classes[count - 1] = "col-span-2 @3xl:col-span-4";
  if (rest === 2) { classes[count - 1] = "@3xl:col-span-2"; classes[count - 2] = "@3xl:col-span-2"; }
  if (rest === 3) classes[count - 3] = "@3xl:col-span-2";
  return classes;
}

/** Filter tabs for listing statuses: “All”, “For sale”, “Sold”… */
export function StatusTabs({ options, value, onChange, className = "", tab }: { options: string[]; value: string | null; onChange: (value: string | null) => void; className?: string; tab: (active: boolean) => string }) {
  if (options.length < 2) return null;
  return <div role="tablist" aria-label="Filter homes" className={`flex flex-wrap gap-2 ${className}`}>
    {[null, ...options].map((option) => <button key={option ?? "all"} type="button" role="tab" aria-selected={value === option} onClick={() => onChange(option)} className={tab(value === option)}>{option ?? "All"}</button>)}
  </div>;
}

/** A slider with a label and the formatted value beside it. */
export function Slider({ label, value, min, max, step, onChange, format, className = "" }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void; format: (value: number) => ReactNode; className?: string }) {
  return <label className={`block ${className}`}>
    <span className="flex items-baseline justify-between gap-3 text-[13px]"><span className="opacity-75">{label}</span><span className="font-semibold tabular-nums">{format(value)}</span></span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 w-full accent-[var(--t-accent)]" />
  </label>;
}

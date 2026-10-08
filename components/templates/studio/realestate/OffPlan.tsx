"use client";

import "@fontsource-variable/unbounded";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/syne";
import { useState } from "react";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";
import { CountUp, Words, useSeen } from "../motion";
import { Lightbox, isSold, mail, parsePrice, tel, useCountdown, useLightbox, viewingLink, whatsapp, type Listing } from "./re-kit";

const floorOf = (item: Listing) => Number((item.year ?? item.title ?? "").match(/(\d{1,3})/)?.[1] ?? Number.NaN);
const bedsOf = (item: Listing) => (item.role ?? "").match(/(\d+)\s*(?:bed|bd|br)/i)?.[1] ?? null;
const tone = (status?: string) => (isSold(status) ? (/reserved|under offer/i.test(status ?? "") ? "reserved" : "sold") : "available");
const COLOURS = { available: "var(--t-accent)", reserved: "#f2a93b", sold: "color-mix(in oklab, var(--t-fg) 22%, transparent)" } as const;

/** A figure like “72%” becomes a bar that fills when seen. */
function Progress({ value, label: text }: { value?: string; label?: string }) {
  const [ref, seen] = useSeen<HTMLDivElement>();
  const percent = Number((value ?? "").match(/([\d.]+)\s*%/)?.[1] ?? Number.NaN);
  return <div ref={ref}>
    <p className="fd text-[clamp(2.4rem,6cqw,4.6rem)] leading-none tracking-[-0.04em]"><CountUp value={value} /></p>
    <p className="fm mt-2 text-[12px] uppercase tracking-[0.16em] tm">{text}</p>
    {Number.isFinite(percent) && <div className="mt-4 h-1.5 overflow-hidden bg-[var(--t-rule)]"><span className="block h-full ba transition-[width] duration-[1600ms] ease-[cubic-bezier(.2,.7,.1,1)]" style={{ width: seen ? `${Math.min(100, percent)}%` : "0%" }} /></div>}
  </div>;
}

/**
 * Off Plan: new developments and launches. A countdown to launch read from the
 * availability line, the building rising floor by floor, a tower to pick a home
 * from with live availability, build progress bars and a construction diary.
 */
export default function OffPlan({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const units = c.projects ?? [];
  const gallery = (c.gallery ?? []).filter((item) => item.image);
  const box = useLightbox(gallery.length, embedded);
  const countdown = useCountdown(c.availability);
  const [beds, setBeds] = useState<string | null>(null);
  const bedOptions = [...new Set(units.map(bedsOf).filter(Boolean) as string[])].sort();
  const floors = Math.max(10, ...units.map(floorOf).filter(Number.isFinite));
  const [picked, setPicked] = useState(() => Math.max(0, units.findIndex((item) => tone(item.category) === "available")));
  const unit = units[picked];
  const counts = { available: 0, reserved: 0, sold: 0 };
  units.forEach((item) => { counts[tone(item.category)] += 1; });
  const [heroRef, heroSeen] = useSeen<HTMLDivElement>("0px");
  const chat = whatsapp(c.phone, `Hi ${c.name?.split(" ")[0] ?? ""}, please register me for the launch.`);

  return <StudioRoot studio={studio} className="text-[15px] leading-relaxed">
    <header className="flex items-center justify-between gap-4 border-b rule px-5 py-4 @3xl:px-10">
      <span className="fm text-[12px] uppercase tracking-[0.2em]" {...ed("location")}>{c.location}</span>
      <nav className="flex items-center gap-5 text-[13px]">
        <a href="#availability" className="hidden hover:text-[var(--t-accent)] @2xl:inline">Availability</a>
        <a href="#progress" className="hidden hover:text-[var(--t-accent)] @2xl:inline">Progress</a>
        <a href="#register" className="ba px-4 py-2 font-semibold text-[var(--t-bg)] hover:opacity-90">Register</a>
      </nav>
    </header>

    <section className="grid gap-10 px-5 py-12 @3xl:px-10 @4xl:grid-cols-[1.2fr_1fr] @4xl:items-end @4xl:py-16">
      <div>
        <p className="fm inline-flex items-center gap-2 border border-[var(--t-accent)] px-3 py-1.5 text-[12px] uppercase tracking-[0.18em] ta" {...ed("availability")}><span className="size-1.5 animate-pulse rounded-full ba" />{c.availability || "Now selling"}</p>
        <p className="fd mt-8 text-[clamp(2.4rem,7.4cqw,5.8rem)] font-[600] leading-[0.95] tracking-[-0.04em]" {...ed("tagline")}><Words text={c.tagline} step={70} /></p>
        {countdown && !countdown.done && <div className="mt-10 grid max-w-[34rem] grid-cols-4 gap-2" aria-label="Time until launch">{([["days", countdown.days], ["hrs", countdown.hours], ["min", countdown.minutes], ["sec", countdown.seconds]] as const).map(([unitName, value]) => <div key={unitName} className="bs border rule px-3 py-4 text-center">
          <p className="fm text-[clamp(1.6rem,4cqw,2.6rem)] leading-none tabular-nums">{String(value).padStart(2, "0")}</p>
          <p className="fm mt-2 text-[10px] uppercase tracking-[0.2em] tm">{unitName}</p>
        </div>)}</div>}
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t rule pt-6">
          <h1 className="fd text-[1.4rem] font-[600] tracking-[-0.02em]" {...ed("name")}>{c.name}</h1>
          <p className="tm" {...ed("professional_title")}>{c.professional_title}</p>
        </div>
      </div>
      {/* The building rises: the image is uncovered from the ground up in steps, like floors going on. */}
      <div ref={heroRef} className="relative aspect-[4/5] overflow-hidden">
        <div className="absolute inset-0 transition-[clip-path] duration-[2400ms] ease-[steps(12,end)]" style={{ clipPath: heroSeen ? "inset(0 0 0 0)" : "inset(100% 0 0 0)" }}>
          <Picture src={c.cover || gallery[0]?.image} alt="" embedded={embedded} className="size-full" edit={c.cover ? "cover" : undefined} />
        </div>
        <span aria-hidden className="absolute inset-x-0 h-0.5 ba shadow-[0_0_20px_var(--t-accent)] transition-[top] duration-[2400ms] ease-[steps(12,end)]" style={{ top: heroSeen ? "0%" : "100%" }} />
        <span className="fm absolute bottom-3 right-3 bg-[var(--t-bg)] px-2 py-1 text-[11px] uppercase tracking-[0.14em]">{floors} floors</span>
      </div>
    </section>

    {has("stats") && <section id="progress" className="grid gap-px border-y rule bg-[var(--t-rule)] @3xl:grid-cols-3">{(c.stats ?? []).map((stat, index) => <div key={index} className="bg-[var(--t-bg)] px-5 py-10 @3xl:px-10" {...ed(`stats.${index}`)}><Progress value={stat.value} label={stat.label} /></div>)}</section>}

    {has("projects") && units.length > 0 && <section id="availability" className="px-5 py-20 @3xl:px-10 @3xl:py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 className="fd text-[clamp(2rem,5cqw,3.6rem)] font-[600] leading-none tracking-[-0.04em]">{label("projects", "Choose your floor")}</h2>
          <p className="mt-3 tm">Tap a floor to see the home. Updated by the sales team.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {bedOptions.length > 1 && [null, ...bedOptions].map((option) => <button key={option ?? "all"} type="button" onClick={() => setBeds(option)} aria-pressed={beds === option} className={`fm border px-3 py-1.5 text-[12px] uppercase tracking-[0.12em] ${beds === option ? "border-[var(--t-accent)] ba text-[var(--t-bg)]" : "rule hover:border-[var(--t-fg)]"}`}>{option ? `${option} bed` : "All"}</button>)}
        </div>
      </div>
      <p className="fm mt-6 flex flex-wrap gap-5 text-[12px] uppercase tracking-[0.12em]">{(Object.keys(counts) as Array<keyof typeof counts>).map((key) => <span key={key} className="flex items-center gap-2"><span className="size-3" style={{ background: COLOURS[key] }} />{counts[key]} {key}</span>)}</p>
      <div className="mt-8 grid gap-8 @4xl:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="relative mx-auto w-full max-w-[22rem]">
          <div aria-hidden className="mx-auto h-4 w-1/3 border-x border-t rule" />
          <ol className="flex flex-col-reverse border-x-2 border-b-2 border-[var(--t-fg)] p-1.5" aria-label="Floors">{Array.from({ length: floors }, (_, level) => {
            const floor = level + 1;
            const here = units.map((item, index) => ({ item, index })).filter(({ item }) => floorOf(item) === floor);
            const match = here.filter(({ item }) => !beds || bedsOf(item) === beds);
            const chosen = here.some(({ index }) => index === picked);
            return <li key={floor} className="flex items-center gap-2">
              <span className="fm w-7 shrink-0 text-right text-[10px] tm tabular-nums">{floor}</span>
              <div className={`flex h-[clamp(0.9rem,2.4cqw,1.35rem)] flex-1 gap-1 p-[2px] transition-colors ${chosen ? "outline outline-2 outline-[var(--t-fg)]" : ""}`}>
                {here.length === 0 ? <span className="flex-1 bg-[var(--t-surface)]" /> : here.map(({ item, index }) => <button key={index} type="button" onClick={() => setPicked(index)} aria-label={`${item.title}, ${item.category}`} aria-pressed={index === picked} className={`flex-1 transition-[opacity,transform] hover:scale-y-125 ${match.some((m) => m.index === index) ? "opacity-100" : "opacity-20"}`} style={{ background: COLOURS[tone(item.category)] }} {...ed(`projects.${index}`)} />)}
              </div>
            </li>;
          })}</ol>
          <div aria-hidden className="mx-auto h-2 w-[110%] -translate-x-[4.5%] bg-[var(--t-fg)] opacity-20" />
        </div>
        {unit && <article key={picked} className="grid overflow-hidden border rule [animation:offplan-in_.5s_ease] @3xl:grid-cols-[1.1fr_1fr]" {...ed(`projects.${picked}`)}>
          <Picture src={unit.image} alt={unit.title ?? ""} embedded={embedded} className="aspect-[4/3] w-full @3xl:aspect-auto @3xl:h-full" />
          <div className="flex flex-col p-6 @3xl:p-8">
            <p className="fm flex items-center gap-2 text-[12px] uppercase tracking-[0.16em]"><span className="size-2.5" style={{ background: COLOURS[tone(unit.category)] }} />{unit.category} · {unit.year}</p>
            <h3 className="fd mt-4 text-[clamp(1.6rem,3.4cqw,2.4rem)] font-[600] leading-none tracking-[-0.03em]">{unit.title}</h3>
            <p className="mt-2 tm">{unit.role}</p>
            <p className="mt-4 text-[14px] tm pretty">{unit.description}</p>
            <p className="fd mt-auto pt-6 text-[clamp(1.8rem,3.6cqw,2.6rem)] font-[600] tracking-[-0.03em]">{unit.client}</p>
            {parsePrice(unit.client) && <p className="fm text-[12px] tm">5% deposit: {(unit.client ?? "").replace(/[\d,.]+/, Math.round(parsePrice(unit.client)!.amount * 0.05).toLocaleString("en-GB"))}</p>}
            {tone(unit.category) === "available" && <div className="mt-5 flex flex-wrap gap-2">
              <a href={viewingLink(c, unit)} {...external(viewingLink(c, unit))} className="ba px-5 py-3 text-[13px] font-semibold text-[var(--t-bg)] hover:opacity-90">Reserve this home</a>
              {unit.live_url && <a href={unit.live_url} {...external(unit.live_url)} className="border rule px-5 py-3 text-[13px] hover:border-[var(--t-fg)]">Floor plan</a>}
            </div>}
          </div>
        </article>}
      </div>
      <style>{"@keyframes offplan-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}"}</style>
    </section>}

    {has("skills") && <section className="border-t rule px-5 py-20 @3xl:px-10" {...ed("skills")}>
      <h2 className="fd text-[clamp(2rem,5cqw,3.4rem)] font-[600] tracking-[-0.04em]">{label("skills", "In the building")}</h2>
      <ul className="mt-10 grid grid-cols-2 gap-px bg-[var(--t-rule)] @3xl:grid-cols-4">{(c.skills ?? []).map((item, index) => <li key={item} className="group bg-[var(--t-bg)] p-6 transition-colors duration-300 hover:bg-[var(--t-accent)] hover:text-[var(--t-bg)]"><span className="fm text-[11px] opacity-60">{String(index + 1).padStart(2, "0")}</span><p className="fd mt-6 text-[1.15rem] font-[500] leading-tight">{item}</p></li>)}</ul>
    </section>}

    {has("services") && <section className="bs px-5 py-20 @3xl:px-10">
      <h2 className="fd text-[clamp(2rem,5cqw,3.4rem)] font-[600] tracking-[-0.04em]">{label("services", "Ways to buy")}</h2>
      <ul className="mt-10 grid gap-4 @3xl:grid-cols-3">{(c.services ?? []).map((service, index) => <Reveal as="li" key={index} delay={index * 100} className="flex flex-col border rule bg-[var(--t-bg)] p-7"><div className="flex h-full flex-col" {...ed(`services.${index}`)}>
        <p className="fm text-[12px] uppercase tracking-[0.16em] ta">{service.price}</p>
        <h3 className="fd mt-4 text-[1.5rem] font-[600] leading-tight tracking-[-0.02em]">{service.title}</h3>
        <p className="mt-3 tm">{service.description}</p>
      </div></Reveal>)}</ul>
    </section>}

    {has("gallery") && gallery.length > 0 && <section className="py-20">
      <div className="flex items-end justify-between px-5 @3xl:px-10"><h2 className="fd text-[clamp(2rem,5cqw,3.4rem)] font-[600] tracking-[-0.04em]">{label("gallery", "Construction diary")}</h2><p className="fm text-[12px] tm">{gallery.length} entries</p></div>
      <div className="mt-8 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-4 @3xl:scroll-px-10 [scrollbar-width:thin] @3xl:px-10">{gallery.map((item, index) => <button key={index} type="button" onClick={() => box.open(index)} className="group w-[min(70%,22rem)] shrink-0 snap-start text-left" {...ed(`gallery.${index}`)}>
        <span className="block overflow-hidden"><Picture src={item.image} alt={item.caption ?? ""} className="aspect-[3/4] w-full grayscale transition-[filter,transform] duration-700 group-hover:scale-[1.04] group-hover:grayscale-0" /></span>
        <span className="fm mt-2 flex justify-between text-[12px]"><span>{item.caption}</span><span className="tm">{String(index + 1).padStart(2, "0")}</span></span>
      </button>)}</div>
      <Lightbox items={gallery} box={box} accent={studio.accent} />
    </section>}

    {has("about") && <section className="grid gap-10 border-t rule px-5 py-20 @3xl:px-10 @4xl:grid-cols-[1fr_1.4fr]">
      <div className="flex items-start gap-5"><Picture src={c.avatar} alt={c.name ?? ""} embedded={embedded} prompt="Add your photo" className="size-28 shrink-0 grayscale" edit="avatar" /><div><p className="fd text-[1.4rem] font-[600] leading-tight">{c.name}</p><p className="mt-1 text-[14px] tm">{c.professional_title}</p></div></div>
      <div>
        <h2 className="fd text-[clamp(1.8rem,4cqw,2.8rem)] font-[600] leading-[1.05] tracking-[-0.03em]">{label("about", "About the development")}</h2>
        <div className="mt-6 space-y-4 text-[1.05rem] leading-[1.75] tm">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
        {has("highlights") && <ul className="mt-8 divide-y rule border-y rule">{(c.highlights ?? []).map((item, index) => <li key={index} className="flex items-baseline justify-between gap-4 py-3" {...ed(`highlights.${index}`)}><span>{item.title}<span className="tm">{item.detail && ` · ${item.detail}`}</span></span><span className="fm text-[12px] ta">{item.year}</span></li>)}</ul>}
      </div>
    </section>}

    {has("testimonials") && <section className="px-5 py-16 @3xl:px-10">
      <ul className="grid gap-4 @3xl:grid-cols-2">{(c.testimonials ?? []).map((item, index) => <li key={index} className="border-l-2 border-[var(--t-accent)] pl-6" {...ed(`testimonials.${index}`)}><blockquote className="fd text-[clamp(1.2rem,2.4cqw,1.6rem)] font-[500] leading-snug tracking-[-0.01em]">“{item.quote}”</blockquote><p className="fm mt-3 text-[12px] uppercase tracking-[0.12em] tm">{item.name} · {item.role}</p></li>)}</ul>
    </section>}

    {has("contact") && <footer id="register" className="ba px-5 py-20 text-[var(--t-bg)] @3xl:px-10 @3xl:py-24">
      <h2 className="fd max-w-[14ch] text-[clamp(2.6rem,8cqw,6.4rem)] font-[700] leading-[0.9] tracking-[-0.05em]">Register before launch.</h2>
      <p className="mt-6 max-w-[32rem] text-[1.1rem] opacity-85">Registered buyers see prices and floor plans first, and choose before the public release.</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <a href={mail(c.email, "Register for launch", "Please register me for the launch. I’m interested in: ")} className="bg-[var(--t-bg)] px-7 py-4 font-semibold text-[var(--t-fg)] hover:opacity-90" {...ed("email")}>Register by email</a>
        {chat && <a href={chat} {...external(chat)} className="border-2 border-current px-7 py-4 font-semibold hover:bg-black/10">WhatsApp the sales team</a>}
      </div>
      <p className="fm mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-current/25 pt-5 text-[12px] uppercase tracking-[0.12em]">{c.phone && <a href={tel(c.phone)} {...ed("phone")}>{c.phone}</a>}{contactLinks(c).filter((link) => !/^tel:/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover:underline">{link.label}</a>)}</p>
      <p className="mt-4 text-[11px] opacity-60">Images may be illustrative. Prices and availability can change; please confirm before reserving.</p>
    </footer>}
  </StudioRoot>;
}

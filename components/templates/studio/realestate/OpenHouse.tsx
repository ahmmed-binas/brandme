"use client";

import "@fontsource/gloock/400.css";
import "@fontsource-variable/hanken-grotesk";
import { useState } from "react";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";

const tel = (phone?: string) => (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "#contact");
const isSold = (status?: string) => /sold|closed|let/i.test(status ?? "");

/** A swing tag hanging from the corner of the featured photo. */
function PriceTag({ price, status }: { price?: string; status?: string }) {
  if (!price && !status) return null;
  return <div className="absolute -right-2 top-8 origin-top rotate-[4deg] @3xl:-right-6 [animation:open-house-swing_3.4s_ease-in-out_infinite]">
    <div className="mx-auto h-8 w-px bg-[var(--t-fg)] opacity-60" />
    <div className="relative rounded-[6px] bg-[var(--t-bg)] px-5 pb-4 pt-5 text-center shadow-[0_18px_30px_-16px_rgba(0,0,0,.55)] [clip-path:polygon(18%_0,82%_0,100%_14%,100%_100%,0_100%,0_14%)]">
      <span className="absolute left-1/2 top-2 size-2 -translate-x-1/2 rounded-full border border-[var(--t-fg)] opacity-60" />
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] ta">{status}</p>
      <p className="fd mt-1 text-[1.6rem] leading-none tabular-nums">{price}</p>
    </div>
    <style>{"@keyframes open-house-swing{0%,100%{transform:rotate(4deg)}50%{transform:rotate(-2deg)}}"}</style>
  </div>;
}

export default function OpenHouse({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const listings = c.projects ?? [];
  const featured = listings[0];
  const statuses = Array.from(new Set(listings.map((item) => item.category).filter(Boolean))) as string[];
  const [filter, setFilter] = useState("");
  // The featured listing already leads the page, so the grid starts after it.
  const shown = listings.map((item, index) => ({ item, index })).filter(({ item, index }) => (listings.length < 2 || index > 0 || filter) && (!filter || item.category === filter));
  const licence = (c.education ?? [])[0];

  return <StudioRoot studio={studio} className="text-[16px] leading-relaxed">
    <header className="mx-auto flex max-w-[78rem] items-center justify-between gap-4 px-5 py-5 @3xl:px-8">
      <span className="fd text-[1.5rem] leading-none">{c.name}</span>
      <nav className="flex items-center gap-6 text-[14px] font-medium"><a href="#listings" className="hidden hover-a @2xl:inline">Listings</a><a href="#areas" className="hidden hover-a @2xl:inline">Neighbourhoods</a>
        <a href={tel(c.phone)} className="rounded-full bg-[var(--t-fg)] px-4 py-2 tabular-nums text-[var(--t-bg)] transition-opacity hover:opacity-85" {...ed("phone")}>{c.phone || "Call me"}</a></nav>
    </header>

    <section className="mx-auto grid max-w-[78rem] items-center gap-12 px-5 pb-16 pt-8 @3xl:px-8 @4xl:grid-cols-[1fr_1.15fr]">
      <div>
        {c.availability && <p className="inline-flex items-center gap-2 rounded-full bs px-3 py-1 text-[13px] font-medium" {...ed("availability")}><span className="size-2 rounded-full ba" />{c.availability}</p>}
        <h1 className="fd mt-6 text-[clamp(2.3rem,5cqw,3.9rem)] leading-[1.02] tracking-[-0.01em] balance" {...ed("tagline")}>{c.tagline}</h1>
        <p className="mt-6 text-[15px] tm"><span {...ed("name")} className="font-semibold text-[var(--t-fg)]">{c.name}</span> · <span {...ed("professional_title")}>{c.professional_title}</span>{c.location && <> · <span {...ed("location")}>{c.location}</span></>}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={c.email ? `mailto:${c.email}?subject=${encodeURIComponent("Market report for my home")}` : "#contact"} className="rounded-full ba px-6 py-3 font-semibold text-[var(--t-bg)] transition-transform hover:-translate-y-0.5">What’s my home worth?</a>
          <a href="#listings" className="rounded-full border border-[var(--t-fg)] px-6 py-3 font-semibold transition-colors hover:bg-[var(--t-fg)] hover:text-[var(--t-bg)]">See listings</a>
        </div>
      </div>
      {featured && <figure className="relative" {...ed("projects.0")}>
        <Picture src={featured.image} alt={featured.title ?? ""} embedded={embedded} className="aspect-[4/3] w-full rounded-[4px]" />
        <PriceTag price={featured.client} status={featured.category} />
        <figcaption className="mt-3 flex flex-wrap justify-between gap-2 text-[14px]"><b className="font-semibold">{featured.title}</b><span className="tm">{featured.role}</span></figcaption>
      </figure>}
    </section>

    {has("stats") && <section className="border-y border-[var(--t-fg)]"><dl className="mx-auto grid max-w-[78rem] grid-cols-3">{(c.stats ?? []).map((stat, index) => <div key={index} className={`px-3 py-6 @3xl:px-8 @3xl:py-8 ${index ? "border-l rule" : ""}`} {...ed(`stats.${index}`)}>
      <dd className="fd text-[clamp(1.6rem,5cqw,3.6rem)] leading-none tabular-nums">{stat.value}</dd><dt className="mt-2 text-[14px] tm">{stat.label}</dt>
    </div>)}</dl></section>}

    {has("projects") && <section id="listings" className="mx-auto max-w-[78rem] px-5 py-20 @3xl:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="fd text-[clamp(2rem,4cqw,2.8rem)] leading-none">{label("projects", "Recent listings")}</h2>
        {statuses.length > 1 && <div className="flex gap-1 rounded-full bs p-1 text-[14px]" role="group" aria-label="Filter listings">{["", ...statuses].map((status) => <button key={status || "all"} type="button" onClick={() => setFilter(status)} aria-pressed={filter === status} className={`rounded-full px-4 py-1.5 font-medium transition-colors ${filter === status ? "bg-[var(--t-fg)] text-[var(--t-bg)]" : "hover-a"}`}>{status || "All"}</button>)}</div>}
      </div>
      <ul className="mt-10 grid gap-x-6 gap-y-12 @3xl:grid-cols-2 @6xl:grid-cols-3">{shown.map(({ item, index }) => <Reveal as="li" key={index} delay={(index % 3) * 70}>
        <article {...ed(`projects.${index}`)} className="group">
          <div className="relative overflow-hidden rounded-[4px]">
            <Picture src={item.image} alt={item.title ?? ""} embedded={embedded} className="aspect-[4/3] w-full transition-transform duration-700 group-hover:scale-[1.03]" />
            {item.category && (isSold(item.category)
              ? <span className="absolute left-4 top-4 -rotate-6 border-[3px] border-[var(--t-accent)] bg-[var(--t-bg)] px-3 py-0.5 text-[15px] font-black uppercase tracking-[0.2em] ta">{item.category}</span>
              : <span className="absolute left-4 top-4 rounded-full bg-[var(--t-bg)] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em]">{item.category}</span>)}
          </div>
          <div className="mt-4 flex items-baseline justify-between gap-4"><h3 className="text-[1.15rem] font-semibold leading-snug">{item.title}</h3><span className="fd shrink-0 text-[1.35rem] tabular-nums">{item.client}</span></div>
          {item.role && <p className="text-[14px] tm">{item.role}</p>}
          <p className="mt-2 text-[15px] tm pretty">{item.description}</p>
        </article>
      </Reveal>)}</ul>
    </section>}

    {has("skills") && <section id="areas" className="bs"><div className="mx-auto max-w-[78rem] px-5 py-16 @3xl:px-8">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.2em] tm">{label("skills", "Neighbourhoods I know street by street")}</h2>
      <ul className="mt-6 flex flex-wrap gap-3" {...ed("skills")}>{(c.skills ?? []).map((area) => <li key={area} className="rounded-[5px] border-2 border-[var(--t-bg)] ba px-4 py-2 text-[14px] font-bold uppercase tracking-[0.08em] text-[var(--t-bg)] shadow-[0_0_0_2px_var(--t-accent)]">{area}</li>)}</ul>
    </div></section>}

    {(has("about") || has("services")) && <section className="mx-auto grid max-w-[78rem] gap-14 px-5 py-20 @3xl:px-8 @4xl:grid-cols-2">
      {has("about") && <div><h2 className="fd text-[2.2rem] leading-none">{label("about", "About me")}</h2><div className="mt-6 space-y-4 text-[1.08rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div></div>}
      {has("services") && <div><h2 className="fd text-[2.2rem] leading-none">{label("services", "Working together")}</h2><ul className="mt-6 divide-y divide-[var(--t-rule)] border-y rule">{(c.services ?? []).map((service, index) => <li key={index} className="py-5" {...ed(`services.${index}`)}><div className="flex items-baseline justify-between gap-4"><h3 className="font-semibold">{service.title}</h3><span className="shrink-0 text-[14px] font-semibold ta">{service.price}</span></div><p className="mt-1 text-[15px] tm pretty">{service.description}</p></li>)}</ul></div>}
    </section>}

    {has("testimonials") && <section className="bg-[var(--t-fg)] text-[var(--t-bg)]"><div className="mx-auto grid max-w-[78rem] gap-10 px-5 py-20 @3xl:grid-cols-2 @3xl:px-8">{(c.testimonials ?? []).map((item, index) => <figure key={index} {...ed(`testimonials.${index}`)}>
      <p aria-label="Five stars" className="tracking-[0.2em] text-[var(--t-accent)]">★★★★★</p>
      <blockquote className="fd mt-3 text-[1.5rem] leading-snug">“{item.quote}”</blockquote>
      <figcaption className="mt-4 text-[14px] opacity-70">{item.name} — {item.role}</figcaption>
    </figure>)}</div></section>}

    {has("contact") && <footer id="contact" className="mx-auto max-w-[78rem] px-5 py-20 @3xl:px-8">
      <div className="grid gap-10 @4xl:grid-cols-[1.4fr_1fr]">
        <div><h2 className="fd text-[clamp(2.2rem,5cqw,3.6rem)] leading-[1.02] balance">Thinking of moving? Let’s walk through your home together.</h2></div>
        <div className="space-y-2 self-end text-[1.15rem]">
          {c.phone && <a href={tel(c.phone)} className="block font-semibold tabular-nums hover-a" {...ed("phone")}>{c.phone}</a>}
          <a href={c.email ? `mailto:${c.email}` : "#"} className="block break-all hover-a" {...ed("email")}>{c.email}</a>
          <p className="flex flex-wrap gap-x-5 pt-2 text-[14px] tm">{contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover-a">{link.label} ↗</a>)}</p>
        </div>
      </div>
      {licence && <p className="mt-16 border-t rule pt-5 text-[12px] tm" {...ed("education.0")}>{licence.degree}{licence.school && ` · ${licence.school}`}</p>}
    </footer>}
  </StudioRoot>;
}

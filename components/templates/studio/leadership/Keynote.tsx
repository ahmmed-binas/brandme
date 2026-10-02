"use client";

import "@fontsource/dm-serif-display/400.css";
import "@fontsource/dm-serif-display/400-italic.css";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/bricolage-grotesque";
import { useState } from "react";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";

export default function Keynote({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const [light, setLight] = useState({ x: 50, y: 30 });
  const quote = c.testimonials?.[0];

  return <StudioRoot studio={studio} className="text-[16px] leading-[1.6]">
    <section className="relative isolate overflow-hidden px-6 pb-20 pt-8 @3xl:px-14" onMouseMove={(event) => { const box = event.currentTarget.getBoundingClientRect(); setLight({ x: ((event.clientX - box.left) / box.width) * 100, y: ((event.clientY - box.top) / box.height) * 100 }); }}>
      <div aria-hidden className="absolute inset-0 -z-10 transition-[background] duration-300" style={{ background: `radial-gradient(circle at ${light.x}% ${light.y}%, color-mix(in oklab, var(--t-accent) 22%, transparent), transparent 42%)` }} />
      <header className="flex items-center justify-between text-[13px]"><span className="font-semibold">{c.name}</span><a href="#book" className="rounded-full border border-[var(--t-rule-strong)] px-4 py-1.5 hover:border-[var(--t-fg)]">Book {c.name?.split(" ")[0]} to speak</a></header>
      <div className="mx-auto max-w-[62rem] pt-24 text-center @3xl:pt-32">
        <p className="text-[13px] uppercase tracking-[0.3em] ta" {...ed("professional_title")}>{c.professional_title}</p>
        <h1 className="fd mt-8 text-[clamp(2.8rem,8cqw,6.8rem)] leading-[0.98] tracking-[-0.01em] balance" {...ed("tagline")}>{c.tagline}</h1>
        <p className="mt-8 text-[1.2rem] tm" {...ed("name")}>{c.name} · {c.location}</p>
      </div>
    </section>

    {has("stats") && <section className="border-y rule"><dl className="mx-auto grid max-w-[72rem] @3xl:grid-cols-4">{(c.stats ?? []).map((stat, index) => <div key={index} className="border-b rule px-6 py-8 text-center last:border-b-0 @3xl:border-b-0 @3xl:border-r @3xl:last:border-r-0" {...ed(`stats.${index}`)}><dd className="fd text-[3rem] leading-none">{stat.value}</dd><dt className="mt-2 text-[13px] uppercase tracking-[0.16em] tm">{stat.label}</dt></div>)}</dl></section>}

    {has("highlights") && <section className="mx-auto max-w-[72rem] px-6 py-20 @3xl:px-14">
      <h2 className="fd text-[clamp(2.2rem,5cqw,3.4rem)]">{label("highlights", "On stage")}</h2>
      <ul className="mt-8">{(c.highlights ?? []).map((item, index) => <Reveal as="li" key={index} delay={index * 60}><div className="group grid gap-2 border-t rule py-6 transition-colors @3xl:grid-cols-[7rem_1fr_auto] @3xl:items-baseline" {...ed(`highlights.${index}`)}><span className="text-[14px] tm">{item.year}</span><span className="fd text-[1.7rem] leading-tight transition-colors group-hover:text-[var(--t-accent)]">{item.title}</span><span className="text-[14px] tm">{item.detail}</span></div></Reveal>)}</ul>
    </section>}

    {quote && has("testimonials") && <section className="px-6 py-24 text-center @3xl:px-14"><figure className="mx-auto max-w-[56rem]" {...ed("testimonials.0")}><blockquote className="fd text-[clamp(2rem,5cqw,3.6rem)] italic leading-[1.1] balance">“{quote.quote}”</blockquote><figcaption className="mt-8 text-[13px] uppercase tracking-[0.2em] tm">{quote.name} — {quote.role}</figcaption></figure></section>}

    {has("about") && <section className="mx-auto grid max-w-[72rem] gap-10 border-t rule px-6 py-20 @3xl:grid-cols-[1fr_1.5fr] @3xl:px-14">
      <h2 className="fd text-[2.2rem]">{label("about", "Biography")}</h2>
      <div className="space-y-4 text-[1.1rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
    </section>}

    {has("projects") && <section className="mx-auto max-w-[72rem] px-6 pb-20 @3xl:px-14"><div className="grid gap-8 @3xl:grid-cols-2">{(c.projects ?? []).map((project, index) => <article key={index} className="group" {...ed(`projects.${index}`)}><div className="overflow-hidden rounded-xl"><Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="aspect-video w-full transition-transform duration-700 group-hover:scale-[1.03]" /></div><p className="mt-4 text-[13px] uppercase tracking-[0.16em] ta">{project.category} · {project.client} · {project.year}</p><h3 className="fd mt-1 text-[1.8rem] leading-tight">{project.title}</h3><p className="mt-1 tm">{project.description}</p></article>)}</div></section>}

    {has("contact") && <section id="book" className="px-6 pb-12 @3xl:px-14"><div className="mx-auto grid max-w-[72rem] gap-10 rounded-3xl bs p-8 @3xl:grid-cols-2 @3xl:p-14">
      <div><h2 className="fd text-[clamp(2rem,5cqw,3.2rem)] leading-tight">Booking enquiries</h2><p className="mt-3 tm" {...ed("availability")}>{c.availability}</p>
        <a href={c.email ? `mailto:${c.email}?subject=${encodeURIComponent("Speaking enquiry")}` : "#"} className="mt-8 inline-block rounded-full ba px-6 py-3 font-semibold text-[var(--t-bg)]" {...ed("email")}>Send event details</a>
        <p className="mt-6 flex flex-wrap gap-5 text-[14px] tm">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover-a">{link.label}</a>)}</p></div>
      {has("services") && <ul className="space-y-5">{(c.services ?? []).map((item, index) => <li key={index} className="border-t rule pt-4" {...ed(`services.${index}`)}><p className="fd text-[1.4rem]">{item.title}</p><p className="tm">{item.description}</p></li>)}</ul>}
    </div></section>}
  </StudioRoot>;
}

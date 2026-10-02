"use client";

import "@fontsource-variable/space-grotesk";
import "@fontsource/space-mono/400.css";
import "@fontsource/instrument-serif/400.css";
import { useState } from "react";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";

/** Sprocket holes along a strip of film. */
const Sprockets = () => <div aria-hidden className="flex justify-between gap-2 px-1 py-1">{Array.from({ length: 12 }, (_, i) => <span key={i} className="h-2 w-3 rounded-[2px] bg-[var(--t-bg)]" />)}</div>;

export default function Darkroom({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const frames = c.gallery ?? [];
  const [selected, setSelected] = useState(0);
  const current = frames[Math.min(selected, Math.max(frames.length - 1, 0))];
  const frameNo = (index: number) => `${index * 2 + 12}${index % 2 ? "A" : ""}`;

  return <StudioRoot studio={studio} className="text-[15px] leading-relaxed">
    <header className="fm flex items-center justify-between px-5 py-5 text-[11px] uppercase tracking-[0.2em] @3xl:px-10"><span className="flex items-center gap-2"><span className="size-2 rounded-full ba shadow-[0_0_12px_var(--t-accent)]" />{c.name}</span><nav className="flex gap-6"><a href="#sheet" className="hover-a">Contact sheet</a><a href="#about" className="hidden hover-a @2xl:inline">About</a><a href="#book" className="hover-a">Book</a></nav></header>

    {current && <section className="px-5 @3xl:px-10" aria-live="polite">
      <div className="relative" {...ed(`gallery.${selected}`)}>
        <Picture src={current.image} alt={current.caption ?? ""} embedded={embedded} className="aspect-[3/2] max-h-[78vh] w-full" />
        <span className="fm absolute bottom-3 left-3 text-[11px] uppercase tracking-[0.2em] text-white/80 mix-blend-difference">Frame {frameNo(selected)}</span>
      </div>
      <div className="mt-4 grid gap-4 @3xl:grid-cols-[1fr_auto]">
        <div><h1 className="fd text-[clamp(2.4rem,7cqw,6rem)] font-semibold leading-[0.9] tracking-[-0.04em]" {...ed("name")}>{c.name}</h1><p className="mt-2 tm" {...ed("professional_title")}>{c.professional_title}</p></div>
        <p className="fm self-end text-[12px] uppercase tracking-[0.14em] @3xl:text-right"><span className="ta">●</span> {current.caption}<br /><span className="tm">{current.year}</span></p>
      </div>
    </section>}

    {frames.length > 0 && <section id="sheet" className="px-5 py-16 @3xl:px-10">
      <h2 className="fm text-[11px] uppercase tracking-[0.24em] tm">{label("gallery", "Contact sheet")} — select a frame</h2>
      <div className="mt-6 grid grid-cols-2 gap-x-1 gap-y-6 bg-[#050505] p-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
        {frames.map((frame, index) => <div key={index} className="bg-[#1a1a1a]">
          <Sprockets />
          <button type="button" onClick={() => setSelected(index)} className="relative block w-full" aria-pressed={selected === index} aria-label={`Show frame ${frameNo(index)}: ${frame.caption ?? ""}`}>
            <Picture src={frame.image} alt="" className={`aspect-[3/2] w-full transition-[filter,opacity] duration-300 ${selected === index ? "" : "opacity-75 grayscale-[35%] hover:opacity-100 hover:grayscale-0"}`} />
            {selected === index && <svg viewBox="0 0 100 70" preserveAspectRatio="none" className="pointer-events-none absolute -inset-2 size-[calc(100%+1rem)] text-[var(--t-accent)]" aria-hidden><path d="M8 10 C 30 2, 80 0, 94 14 C 100 30, 98 56, 82 64 C 50 72, 14 70, 5 56 C -1 40, 2 20, 12 8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" vectorEffect="non-scaling-stroke" /></svg>}
          </button>
          <p className="fm flex justify-between px-2 py-1 text-[10px] tracking-[0.18em] text-[var(--t-accent)]"><span>▸ {frameNo(index)}</span><span className="text-[#777]">FORMORA 400</span></p>
        </div>)}
      </div>
    </section>}

    {has("about") && <section id="about" className="grid gap-10 border-t rule px-5 py-20 @3xl:grid-cols-[1fr_1.4fr] @3xl:px-10">
      <p className="fd text-[clamp(1.8rem,4cqw,3rem)] leading-[1.05] tracking-[-0.02em]" {...ed("tagline")}>{c.tagline}</p>
      <div className="space-y-4 tm">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
    </section>}

    {has("projects") && <section className="border-t rule px-5 py-20 @3xl:px-10">
      <h2 className="fm text-[11px] uppercase tracking-[0.24em] tm">{label("projects", "Stories")}</h2>
      <div className="mt-10 space-y-20">{(c.projects ?? []).map((project, index) => <Reveal key={index} as="article" className="grid items-end gap-6 @3xl:grid-cols-12" >
        <div className={`@3xl:col-span-8 ${index % 2 ? "@3xl:order-2 @3xl:col-start-5" : ""}`} {...ed(`projects.${index}`)}><Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="aspect-[16/10] w-full" /></div>
        <div className={`@3xl:col-span-4 ${index % 2 ? "@3xl:order-1" : ""}`}>
          <p className="fm text-[11px] uppercase tracking-[0.2em] ta">{project.client} · {project.year}</p>
          <h3 className="fd mt-3 text-[2.2rem] font-semibold leading-none tracking-[-0.03em]">{project.title}</h3>
          <p className="mt-4 tm pretty">{project.description}</p>
        </div>
      </Reveal>)}</div>
    </section>}

    {(has("testimonials") || has("highlights")) && <section className="grid gap-14 border-t rule px-5 py-20 @3xl:grid-cols-2 @3xl:px-10">
      {has("testimonials") && <div>{(c.testimonials ?? []).map((item, index) => <figure key={index} className="mb-10" {...ed(`testimonials.${index}`)}><blockquote className="fd text-[1.6rem] leading-snug">“{item.quote}”</blockquote><figcaption className="fm mt-4 text-[11px] uppercase tracking-[0.18em] tm">{item.name} — {item.role}</figcaption></figure>)}</div>}
      {has("highlights") && <div><h2 className="fm text-[11px] uppercase tracking-[0.24em] tm">{label("highlights", "Recognition")}</h2><ul className="mt-5">{(c.highlights ?? []).map((item, index) => <li key={index} className="flex justify-between gap-4 border-b rule py-3" {...ed(`highlights.${index}`)}><span>{item.title}{item.detail && <span className="tm"> — {item.detail}</span>}</span><span className="fm text-[12px] tm">{item.year}</span></li>)}</ul></div>}
    </section>}

    {has("services") && <section className="border-t rule px-5 py-20 @3xl:px-10"><h2 className="fm text-[11px] uppercase tracking-[0.24em] tm">{label("services", "Commissions")}</h2>
      <div className="mt-6 grid gap-6 @3xl:grid-cols-2">{(c.services ?? []).map((service, index) => <div key={index} className="border rule p-6" {...ed(`services.${index}`)}><h3 className="fd text-[1.6rem] font-semibold tracking-tight">{service.title}</h3><p className="mt-2 tm">{service.description}</p>{service.price && <p className="fm mt-5 text-[12px] uppercase tracking-[0.16em] ta">{service.price}</p>}</div>)}</div></section>}

    {has("contact") && <footer id="book" className="border-t rule px-5 py-20 @3xl:px-10">
      <p className="fm text-[11px] uppercase tracking-[0.24em] tm">{c.availability ?? "Available for assignments"}</p>
      <a href={c.email ? `mailto:${c.email}` : "#"} className="fd mt-4 block break-all text-[clamp(2rem,7cqw,5.6rem)] font-semibold leading-none tracking-[-0.04em] hover-a" {...ed("email")}>{c.email}</a>
      <p className="fm mt-8 flex flex-wrap gap-6 text-[11px] uppercase tracking-[0.2em]">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover-a">{link.label} ↗</a>)}</p>
    </footer>}
  </StudioRoot>;
}

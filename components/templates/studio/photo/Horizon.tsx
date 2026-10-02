"use client";

import "@fontsource-variable/manrope";
import "@fontsource-variable/newsreader";
import { useEffect, useRef, useState } from "react";
import { Picture, StudioRoot, contactLinks, ed, external, pad, paragraphs, useStudio, type StudioProps } from "../kit";

export default function Horizon({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const frames = c.gallery ?? [];
  const [index, setIndex] = useState(0);
  const stage = useRef<HTMLElement | null>(null);
  const count = frames.length;
  const go = (step: number) => setIndex((current) => (current + step + count) % Math.max(count, 1));

  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const onKey = (event: KeyboardEvent) => {
      if (!node.matches(":hover, :focus-within")) return;
      if (event.key === "ArrowRight") { event.preventDefault(); go(1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const current = frames[Math.min(index, Math.max(count - 1, 0))];

  return <StudioRoot studio={studio} className="text-[15px] leading-relaxed">
    <header className="flex items-baseline justify-between px-5 py-6 @3xl:px-10">
      <span className="text-[15px] font-semibold tracking-tight" {...ed("name")}>{c.name}</span>
      <nav className="flex gap-6 text-[14px] tm"><a href="#info" className="hover-a">Information</a><a href="#contact" className="hover-a">Contact</a></nav>
    </header>

    {current && <section ref={stage} tabIndex={0} aria-roledescription="carousel" aria-label={label("gallery", "Photographs")} className="px-5 outline-none @3xl:px-10">
      <div className="relative">
        <div className="grid">{frames.map((frame, i) => <div key={i} className={`col-start-1 row-start-1 transition-opacity duration-[900ms] ease-out ${i === index ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={i !== index} {...(i === index ? ed(`gallery.${i}`) : {})}>
          <Picture src={frame.image} alt={frame.caption ?? ""} embedded={embedded} className="aspect-[3/2] max-h-[80vh] w-full" />
        </div>)}</div>
        <button type="button" onClick={() => go(-1)} className="absolute inset-y-0 left-0 w-1/3 cursor-w-resize" aria-label="Previous photograph" />
        <button type="button" onClick={() => go(1)} className="absolute inset-y-0 right-0 w-2/3 cursor-e-resize" aria-label="Next photograph" />
      </div>
      <div className="mt-4 grid grid-cols-[auto_1fr_auto] items-baseline gap-6 text-[14px]">
        <span className="tabular-nums">{pad(index + 1)} <span className="tm">/ {pad(count)}</span></span>
        <span className="fd truncate text-[1.1rem] italic" aria-live="polite">{current.caption}{current.year && <span className="tm not-italic">, {current.year}</span>}</span>
        <span className="flex gap-4 tm"><button type="button" onClick={() => go(-1)} className="hover-a">Prev</button><button type="button" onClick={() => go(1)} className="hover-a">Next</button></span>
      </div>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">{frames.map((frame, i) => <button key={i} type="button" onClick={() => setIndex(i)} aria-label={`Show ${frame.caption ?? `photograph ${i + 1}`}`} className={`shrink-0 transition-opacity ${i === index ? "opacity-100" : "opacity-40 hover:opacity-80"}`}><Picture src={frame.image} alt="" className="h-14 w-20" /></button>)}</div>
    </section>}

    <section id="info" className="grid gap-10 px-5 py-24 @3xl:grid-cols-12 @3xl:px-10">
      <p className="fd text-[clamp(1.9rem,4.4cqw,3.4rem)] leading-[1.08] tracking-[-0.01em] @3xl:col-span-7 balance" {...ed("tagline")}>{c.tagline}</p>
      <div className="space-y-4 tm @3xl:col-span-4 @3xl:col-start-9">
        <p className="text-[var(--t-fg)]" {...ed("professional_title")}>{c.professional_title}{c.location && `, ${c.location}`}</p>
        {has("about") && paragraphs(c).map(({ text, index: i }) => <p key={i} className="pretty" {...ed(`summary.${i}`)}>{text}</p>)}
      </div>
    </section>

    {(has("highlights") || has("services")) && <section className="grid gap-12 border-t rule px-5 py-16 @3xl:grid-cols-12 @3xl:px-10">
      {has("highlights") && <div className="@3xl:col-span-6"><h2 className="text-[13px] tm">{label("highlights", "Selected")}</h2><ul className="mt-4">{(c.highlights ?? []).map((item, i) => <li key={i} className="grid grid-cols-[4rem_1fr] border-b rule py-2.5" {...ed(`highlights.${i}`)}><span className="tm">{item.year}</span><span>{item.title}{item.detail && <span className="tm">, {item.detail}</span>}</span></li>)}</ul></div>}
      {has("services") && <div className="@3xl:col-span-5 @3xl:col-start-8"><h2 className="text-[13px] tm">{label("services", "Commissions & prints")}</h2><ul className="mt-4 space-y-5">{(c.services ?? []).map((service, i) => <li key={i} {...ed(`services.${i}`)}><p className="flex justify-between gap-4"><span className="font-semibold">{service.title}</span><span className="tm">{service.price}</span></p><p className="tm">{service.description}</p></li>)}</ul></div>}
    </section>}

    {has("contact") && <footer id="contact" className="grid gap-6 border-t rule px-5 py-16 @3xl:grid-cols-12 @3xl:px-10">
      <a href={c.email ? `mailto:${c.email}` : "#"} className="fd text-[clamp(1.8rem,4cqw,3rem)] italic hover-a @3xl:col-span-7" {...ed("email")}>{c.email}</a>
      <p className="flex flex-wrap gap-x-6 gap-y-2 self-end text-[14px] @3xl:col-span-5 @3xl:col-start-8 @3xl:justify-end">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="tm hover-a">{link.label}</a>)}</p>
      {c.availability && <p className="text-[13px] tm @3xl:col-span-12" {...ed("availability")}>{c.availability}</p>}
    </footer>}
  </StudioRoot>;
}

"use client";

import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource-variable/work-sans";
import "@fontsource-variable/eb-garamond";
import { useEffect, useState } from "react";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";

/** Salon hang: varied sizes on a 12-column wall. [column span, aspect, vertical offset]. */
const HANG: Array<[string, string, string]> = [
  ["@3xl:col-span-5", "aspect-[4/5]", "@3xl:mt-10"], ["@3xl:col-span-4", "aspect-[4/5]", "@3xl:mt-0"], ["@3xl:col-span-3", "aspect-square", "@3xl:mt-24"],
  ["@3xl:col-span-3", "aspect-[3/4]", "@3xl:-mt-4"], ["@3xl:col-span-4", "aspect-[5/4]", "@3xl:mt-12"], ["@3xl:col-span-5", "aspect-[4/5]", "@3xl:mt-2"],
  ["@3xl:col-span-4", "aspect-[4/5]", "@3xl:mt-6"], ["@3xl:col-span-4", "aspect-square", "@3xl:mt-16"], ["@3xl:col-span-4", "aspect-[3/4]", "@3xl:mt-0"],
];
const FRAMES = ["border-[10px] border-[#1b1714] p-[6%] bg-[#fbf9f4]", "border-[14px] border-[#8a6a43] shadow-[inset_0_0_0_2px_#6b5233]", "border-[3px] border-[#1b1714]", "border-[12px] border-[#efe9dc] shadow-[inset_0_0_0_1px_rgba(0,0,0,.1)]"];

export default function Salon({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const works = c.gallery ?? [];
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => {
    if (open === null) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(null); if (event.key === "ArrowRight") setOpen((i) => i === null ? i : (i + 1) % works.length); if (event.key === "ArrowLeft") setOpen((i) => i === null ? i : (i - 1 + works.length) % works.length); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, works.length]);

  return <StudioRoot studio={studio} className="text-[17px] leading-[1.6]">
    <header className="flex items-center justify-between px-6 py-6 text-[12px] uppercase tracking-[0.24em] @3xl:px-12"><span>{c.name}</span><nav className="hidden gap-8 @2xl:flex"><a href="#works" className="hover-a">Works</a><a href="#cv" className="hover-a">Exhibitions</a><a href="#enquiries" className="hover-a">Enquiries</a></nav></header>

    <section className="mx-auto max-w-[56rem] px-6 pb-20 pt-16 text-center @3xl:pt-24">
      <p className="text-[12px] uppercase tracking-[0.3em] tm" {...ed("professional_title")}>{c.professional_title}</p>
      <h1 className="fd mt-6 text-[clamp(3.2rem,9cqw,7.5rem)] font-[400] leading-[0.95] tracking-[-0.01em]" {...ed("name")}>{c.name}</h1>
      <p className="fd mx-auto mt-6 max-w-[34rem] text-[1.6rem] italic leading-snug tm balance" {...ed("tagline")}>{c.tagline}</p>
      {c.location && <p className="mt-8 text-[12px] uppercase tracking-[0.24em]">{c.location}</p>}
    </section>

    {has("gallery") && <section id="works" className="px-6 pb-24 @3xl:px-12">
      <div className="mx-auto grid max-w-[84rem] grid-cols-2 gap-x-6 gap-y-14 @3xl:grid-cols-12 @3xl:gap-x-10">
        {works.map((work, index) => { const [span, aspect, offset] = HANG[index % HANG.length]!; return <Reveal key={index} delay={(index % 3) * 90} className={`col-span-2 ${span} ${offset} @md:col-span-1`}>
          <figure>
            <button type="button" onClick={() => !embedded && setOpen(index)} className={`block w-full bg-[var(--t-surface)] shadow-[0_18px_40px_-18px_rgba(0,0,0,.45),0_2px_4px_rgba(0,0,0,.12)] transition-transform duration-500 hover:-translate-y-1 ${FRAMES[index % FRAMES.length]}`} aria-label={`View ${work.caption ?? "work"} larger`} {...ed(`gallery.${index}`)}>
              <Picture src={work.image} alt={work.caption ?? ""} embedded={embedded} className={`${aspect} w-full`} />
            </button>
            <figcaption className="mt-4 grid grid-cols-[1.5rem_1fr] text-[13px] leading-snug"><span className="tm">{index + 1}</span><span><span className="fd text-[1.05rem] italic">{work.caption?.split(",")[0]}</span><span className="block tm">{work.caption?.split(",").slice(1).join(",").trim()}{work.year && `, ${work.year}`}</span></span></figcaption>
          </figure>
        </Reveal>; })}
      </div>
    </section>}

    {has("about") && <section className="bs py-20">
      <div className="mx-auto grid max-w-[64rem] gap-10 px-6 @3xl:grid-cols-[1fr_2fr]">
        <h2 className="fd text-[2.2rem] leading-tight">{label("about", "Statement")}</h2>
        <div className="fd space-y-5 text-[1.3rem] leading-[1.55]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty first:first-letter:float-left first:first-letter:mr-2 first:first-letter:text-[4.2rem] first:first-letter:leading-[0.8]" {...ed(`summary.${index}`)}>{text}</p>)}</div>
      </div>
    </section>}

    {has("projects") && <section className="mx-auto max-w-[72rem] px-6 py-24">
      <h2 className="text-center text-[12px] uppercase tracking-[0.3em] tm">{label("projects", "Exhibitions & publications")}</h2>
      <div className="mt-12 grid gap-16 @3xl:grid-cols-2">{(c.projects ?? []).map((project, index) => <article key={index} className="text-center" {...ed(`projects.${index}`)}>
        <Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="mx-auto aspect-[4/3] w-full" />
        <p className="mt-6 text-[12px] uppercase tracking-[0.24em] tm">{project.category} · {project.year}</p>
        <h3 className="fd mt-2 text-[2.2rem] italic leading-tight">{project.title}</h3>
        {project.client && <p className="tm">{project.client}</p>}
        <p className="mx-auto mt-4 max-w-[30rem] pretty">{project.description}</p>
      </article>)}</div>
    </section>}

    <section id="cv" className="border-t rule">
      <div className="mx-auto grid max-w-[64rem] gap-14 px-6 py-20 @3xl:grid-cols-2">
        {has("highlights") && <div><h2 className="fd text-[2rem]">{label("highlights", "Selected exhibitions")}</h2>
          <ul className="mt-6 space-y-3">{(c.highlights ?? []).map((item, index) => <li key={index} className="grid grid-cols-[4rem_1fr] text-[15px]" {...ed(`highlights.${index}`)}><span className="tm">{item.year}</span><span><span className="fd text-[1.15rem] italic">{item.title}</span>{item.detail && <span className="block tm">{item.detail}</span>}</span></li>)}</ul></div>}
        {has("education") && <div><h2 className="fd text-[2rem]">{label("education", "Education")}</h2>
          <ul className="mt-6 space-y-3">{(c.education ?? []).map((item, index) => <li key={index} className="grid grid-cols-[4rem_1fr] text-[15px]" {...ed(`education.${index}`)}><span className="tm">{item.end_date}</span><span>{item.degree}<span className="block tm">{item.school}</span></span></li>)}</ul></div>}
      </div>
    </section>

    {has("contact") && <footer id="enquiries" className="border-t rule px-6 py-24 text-center">
      <p className="text-[12px] uppercase tracking-[0.3em] tm">{label("contact", "Enquiries")}</p>
      <a href={c.email ? `mailto:${c.email}` : "#"} className="fd mt-6 inline-block text-[clamp(2rem,5cqw,3.6rem)] italic hover-a" {...ed("email")}>{c.email}</a>
      {c.availability && <p className="mt-4 tm" {...ed("availability")}>{c.availability}</p>}
      <p className="mt-10 flex flex-wrap justify-center gap-8 text-[12px] uppercase tracking-[0.24em]">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover-a">{link.label}</a>)}</p>
    </footer>}

    {open !== null && works[open] && !embedded && <div role="dialog" aria-modal="true" aria-label={works[open]!.caption ?? "Artwork"} className="fixed inset-0 z-[80] grid grid-rows-[1fr_auto] bg-[color-mix(in_oklab,var(--t-bg)_96%,black)] p-6 @3xl:p-12" onClick={() => setOpen(null)}>
      <Picture src={works[open]!.image} alt={works[open]!.caption ?? ""} className="mx-auto h-full max-h-[80vh] w-auto max-w-full object-contain shadow-2xl" />
      <div className="mt-6 flex items-center justify-between text-[13px]"><span className="fd text-[1.2rem] italic">{works[open]!.caption}</span><span className="tm">{open + 1} / {works.length} · ← → · Esc</span></div>
    </div>}
  </StudioRoot>;
}

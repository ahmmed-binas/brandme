"use client";

import "@fontsource-variable/dm-sans";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import { useRef, useState } from "react";
import { Picture, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";

export default function Index({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const list = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null);
  const projects = c.projects ?? [];
  const move = (index: number) => (event: React.MouseEvent) => {
    const box = list.current?.getBoundingClientRect();
    if (box) setHover({ index, x: event.clientX - box.left, y: event.clientY - box.top });
  };

  return <StudioRoot studio={studio} className="text-[15px] leading-[1.5]">
    <div className="mx-auto max-w-[96rem] px-5 @3xl:px-8">
      <header className="grid grid-cols-2 gap-4 py-6 text-[14px] @3xl:grid-cols-4">
        <span className="font-medium" {...ed("name")}>{c.name}</span>
        <span className="hidden tm @3xl:block" {...ed("professional_title")}>{c.professional_title}</span>
        <span className="hidden tm @3xl:block">{c.location}</span>
        <span className="text-right"><a href="#info" className="hover-a">Information</a></span>
      </header>

      <p className="fd max-w-[22ch] pb-16 pt-10 text-[clamp(2.2rem,5.6cqw,5.2rem)] leading-[1.02] tracking-[-0.015em] @3xl:pb-24 @3xl:pt-20 balance" {...ed("tagline")}>{c.tagline}</p>

      {has("projects") && <section aria-label={label("projects", "Index")}>
        <div className="grid grid-cols-[3.5rem_1fr] gap-4 border-b rule pb-2 text-[12px] tm @3xl:grid-cols-[6rem_1.4fr_1fr_1fr_5rem]"><span>Year</span><span>{label("projects", "Project")}</span><span className="hidden @3xl:block">Client</span><span className="hidden @3xl:block">Discipline</span><span className="hidden text-right @3xl:block">No.</span></div>
        <div ref={list} className="relative" onMouseLeave={() => setHover(null)}>
          {projects.map((project, index) => <a key={index} href={project.live_url || "#"} {...external(project.live_url || "#")} onMouseMove={move(index)} className={`group grid grid-cols-[3.5rem_1fr] items-baseline gap-4 border-b rule py-4 transition-opacity duration-300 @3xl:grid-cols-[6rem_1.4fr_1fr_1fr_5rem] @3xl:py-5 ${hover && hover.index !== index ? "opacity-30" : ""}`} {...ed(`projects.${index}`)}>
            <span className="text-[13px] tm">{project.year}</span>
            <span className="min-w-0"><span className="fd text-[clamp(1.4rem,2.8cqw,2.4rem)] leading-none tracking-[-0.01em]">{project.title}</span>
              <span className="mt-3 block max-w-[34rem] text-[14px] tm @3xl:hidden">{project.description}</span>
              <Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="mt-3 aspect-[16/10] w-full @3xl:hidden" /></span>
            <span className="hidden text-[14px] @3xl:block">{project.client}</span>
            <span className="hidden text-[14px] tm @3xl:block">{project.category}</span>
            <span className="hidden text-right text-[13px] tm @3xl:block">({String(index + 1).padStart(2, "0")})</span>
          </a>)}
          {hover && projects[hover.index] && <div className="pointer-events-none absolute z-20 hidden w-[min(30rem,34cqw)] @3xl:block" style={{ left: hover.x + 28, top: hover.y - 120, transition: "left .25s cubic-bezier(.2,.7,.1,1), top .25s cubic-bezier(.2,.7,.1,1)" }}>
            <Picture src={projects[hover.index]!.image} alt="" className="aspect-[16/10] w-full shadow-[0_30px_60px_-20px_rgba(0,0,0,.35)]" />
            <p className="mt-2 max-w-[26rem] bg-[var(--t-bg)] text-[13px] leading-snug">{projects[hover.index]!.description}</p>
          </div>}
        </div>
      </section>}

      <section id="info" className="grid gap-12 py-24 @3xl:grid-cols-4 @3xl:gap-4">
        <h2 className="text-[14px] tm">Information</h2>
        {has("about") && <div className="space-y-4 text-[1.05rem] @3xl:col-span-2">{paragraphs(c).map(({ text, index }) => <p key={index} className="max-w-[38rem] pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>}
        {has("contact") && <ul className="space-y-1 text-[14px]">{contactLinks(c).map((link) => <li key={link.url}><a href={link.url} {...external(link.url)} className="underline decoration-[var(--t-rule-strong)] underline-offset-4 hover-a">{link.label === "Email" ? c.email : link.label}</a></li>)}{c.availability && <li className="pt-4 tm" {...ed("availability")}>{c.availability}</li>}</ul>}
      </section>

      <section className="grid gap-12 border-t rule py-16 @3xl:grid-cols-4 @3xl:gap-4">
        {has("experience") && <><h2 className="text-[14px] tm">{label("experience", "Experience")}</h2>
          <ul className="space-y-3 text-[14px] @3xl:col-span-1">{(c.experience ?? []).map((role, index) => <li key={index} {...ed(`experience.${index}`)}><span className="block">{role.company}</span><span className="tm">{role.job_title}, {[role.start_date, role.end_date].filter(Boolean).join("–")}</span></li>)}</ul></>}
        {has("highlights") && <><h2 className="text-[14px] tm">{label("highlights", "Recognition")}</h2>
          <ul className="space-y-3 text-[14px]">{(c.highlights ?? []).map((item, index) => <li key={index} {...ed(`highlights.${index}`)}><span className="block">{item.title}</span><span className="tm">{[item.detail, item.year].filter(Boolean).join(", ")}</span></li>)}</ul></>}
      </section>

      <footer className="flex justify-between gap-4 border-t rule py-6 text-[13px] tm"><span>© {new Date().getFullYear()} {c.name}</span><a href="#top" onClick={(event) => { event.preventDefault(); event.currentTarget.closest(".studio-root")?.scrollIntoView({ behavior: "smooth" }); }} className="hover-a">Back to top ↑</a></footer>
    </div>
  </StudioRoot>;
}

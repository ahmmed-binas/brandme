"use client";

import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import "@fontsource-variable/caveat";
import "@fontsource/ibm-plex-mono/400.css";
import { useState } from "react";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, firstName, pad, paragraphs, useStudio, type StudioProps } from "../kit";

const STICKERS = ["#ffd166", "#06d6a0", "#ef476f", "#118ab2", "#f78c6b"];

export default function Syllabus({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const [open, setOpen] = useState<number | null>(0);
  const code = (index: number) => `${(c.skills?.[index % (c.skills?.length || 1)] ?? "PRJ").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "PRJ"} ${100 + index * 101}`;

  return <StudioRoot studio={studio} className="text-[16px] leading-[1.6]">
    <header className="flex items-center justify-between border-b-2 border-dashed rule-strong px-5 py-4 @3xl:px-10"><span className="fd text-[1.2rem] font-[700]">{c.name}</span><nav className="fm flex gap-5 text-[12px] uppercase"><a href="#courses" className="hover-a">Projects</a><a href="#report" className="hover-a">Report card</a><a href="#office" className="hover-a">Office hours</a></nav></header>

    <section className="grid gap-10 px-5 py-14 @3xl:px-10 @4xl:grid-cols-[1.3fr_1fr]">
      <div>
        <p className="fm text-[12px] uppercase tracking-[0.16em] tm">Course catalogue · {new Date().getFullYear()}–{new Date().getFullYear() + 1}</p>
        <h1 className="fd mt-4 text-[clamp(2.8rem,8cqw,6rem)] font-[800] leading-[0.92] tracking-[-0.04em]" {...ed("name")}>Introduction to <span className="relative inline-block"><span className="relative z-10">{firstName(c.name)}</span><span aria-hidden className="absolute inset-x-[-4%] bottom-[8%] -z-0 h-[38%] -rotate-1 bg-[color-mix(in_oklab,var(--t-accent)_45%,transparent)]" /></span></h1>
        <p className="mt-5 text-[1.2rem]" {...ed("professional_title")}>{c.professional_title}</p>
        <p className="mt-2 max-w-[34rem] tm" {...ed("tagline")}>{c.tagline}</p>
      </div>
      <dl className="fm self-end rounded-2xl border-2 border-[var(--t-fg)] bs p-5 text-[13px] shadow-[5px_5px_0_var(--t-fg)]">
        {[["Instructor", c.name], ["Location", c.location], ["Status", c.availability], ["Prerequisites", "Curiosity"]].filter(([, value]) => value).map(([key, value]) => <div key={key} className="grid grid-cols-[8rem_1fr] border-b border-dashed rule py-2 last:border-b-0"><dt className="uppercase tm">{key}</dt><dd className="font-[family-name:var(--t-text)] text-[14px]">{value}</dd></div>)}
      </dl>
    </section>

    {has("about") && <section className="grid gap-8 px-5 pb-14 @3xl:grid-cols-[14rem_1fr] @3xl:px-10"><h2 className="fm text-[12px] uppercase tracking-[0.16em] tm">{label("about", "Course description")}</h2><div className="max-w-[42rem] space-y-4 text-[1.1rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div></section>}

    {has("projects") && <section id="courses" className="border-t-2 border-dashed rule-strong px-5 py-14 @3xl:px-10">
      <h2 className="fd text-[2rem] font-[800] tracking-tight">{label("projects", "Projects")}</h2>
      <ul className="mt-6 space-y-3">{(c.projects ?? []).map((project, index) => <li key={index} className="overflow-hidden rounded-2xl border-2 border-[var(--t-fg)]">
        <button type="button" onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index} className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 p-4 text-left hover:bg-[var(--t-surface)]" {...ed(`projects.${index}`)}>
          <span className="fm rounded-md px-2 py-1 text-[12px] font-semibold text-[#1d1d1d]" style={{ background: STICKERS[index % STICKERS.length] }}>{code(index)}</span>
          <span><span className="fd block text-[1.25rem] font-[700] leading-tight">{project.title}</span><span className="text-[13px] tm">{[project.category, project.year].filter(Boolean).join(" · ")}</span></span>
          <span className={`fm text-[1.2rem] transition-transform ${open === index ? "rotate-45" : ""}`} aria-hidden>+</span>
        </button>
        <div className={`grid transition-[grid-template-rows] duration-500 ${open === index ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}><div className="overflow-hidden"><div className="grid gap-5 border-t-2 border-dashed rule-strong p-4 @3xl:grid-cols-[1fr_16rem]">
          <div><p className="pretty">{project.description}</p>{!!project.technologies?.length && <p className="fm mt-3 text-[12px] tm">Materials: {project.technologies.join(", ")}</p>}<p className="mt-3 flex gap-4 text-[14px] font-semibold">{project.live_url && <a href={project.live_url} {...external(project.live_url)} className="ta">Try it ↗</a>}{project.github && <a href={project.github} {...external(project.github)} className="ta">Code ↗</a>}</p></div>
          {project.image && <Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="aspect-[4/3] w-full rounded-lg border-2 border-[var(--t-fg)]" />}
        </div></div></div>
      </li>)}</ul>
    </section>}

    {has("experience") && <section className="border-t-2 border-dashed rule-strong px-5 py-14 @3xl:px-10"><h2 className="fd text-[2rem] font-[800] tracking-tight">{label("experience", "Timetable")}</h2>
      <div className="mt-6 grid gap-4 @3xl:grid-cols-2">{(c.experience ?? []).map((role, index) => <Reveal key={index} delay={index * 80} className="rounded-2xl p-5 text-[#1d1d1d]" ><div style={{ background: `color-mix(in oklab, ${STICKERS[(index + 2) % STICKERS.length]} 35%, white)` }} className="-m-5 rounded-2xl p-5" {...ed(`experience.${index}`)}><p className="fm text-[12px] uppercase">{[role.start_date, role.end_date].filter(Boolean).join(" → ")}</p><p className="fd mt-1 text-[1.3rem] font-[700]">{role.job_title}</p><p>{role.company}</p>{role.description && <p className="mt-2 text-[14px] opacity-80">{role.description}</p>}</div></Reveal>)}</div></section>}

    <section id="report" className="grid gap-10 border-t-2 border-dashed rule-strong px-5 py-14 @3xl:grid-cols-2 @3xl:px-10">
      <div>
        <h2 className="fd text-[2rem] font-[800] tracking-tight">Report card</h2>
        {has("education") && <ul className="mt-4 space-y-3">{(c.education ?? []).map((item, index) => <li key={index} className="rounded-xl border-2 border-[var(--t-fg)] p-4" {...ed(`education.${index}`)}><p className="font-semibold">{item.school}</p><p className="tm">{item.degree} · {[item.start_date, item.end_date].filter(Boolean).join("–")}</p>{item.description && <p className="fd mt-1 text-[1.6rem] font-[800] ta">{item.description}</p>}</li>)}</ul>}
        {has("stats") && <dl className="mt-4 grid grid-cols-2 gap-3">{(c.stats ?? []).map((stat, index) => <div key={index} className="rounded-xl bs p-3" {...ed(`stats.${index}`)}><dd className="fd text-[1.8rem] font-[800] leading-none">{stat.value}</dd><dt className="text-[13px] tm">{stat.label}</dt></div>)}</dl>}
      </div>
      <div>
        {has("skills") && <><h2 className="fd text-[2rem] font-[800] tracking-tight">{label("skills", "Skills")}</h2><ul className="mt-4 flex flex-wrap gap-2" {...ed("skills")}>{(c.skills ?? []).map((skill, index) => <li key={skill} className="rounded-full border-2 border-[var(--t-fg)] px-3 py-1 text-[14px] font-semibold" style={{ transform: `rotate(${(index % 3) - 1}deg)` }}>{skill}</li>)}</ul></>}
        {has("highlights") && <><h2 className="fd mt-8 text-[2rem] font-[800] tracking-tight">{label("highlights", "Gold stars")}</h2><ul className="mt-3 space-y-2">{(c.highlights ?? []).map((item, index) => <li key={index} className="flex gap-2" {...ed(`highlights.${index}`)}><span className="ta">★</span><span><b>{item.title}</b> <span className="tm">{item.year}</span></span></li>)}</ul></>}
      </div>
    </section>

    {has("contact") && <footer id="office" className="px-5 pb-10 @3xl:px-10"><div className="rounded-3xl bg-[var(--t-fg)] p-8 text-[var(--t-bg)] @3xl:p-12">
      <p className="fm text-[12px] uppercase tracking-[0.16em] opacity-70">Office hours: by email</p>
      <a href={c.email ? `mailto:${c.email}` : "#"} className="fd mt-3 block break-all text-[clamp(1.8rem,5cqw,3.4rem)] font-[800] leading-none hover:text-[var(--t-accent)]" {...ed("email")}>{c.email}</a>
      <p className="mt-6 flex flex-wrap gap-5 text-[14px] font-semibold">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="underline">{link.label}</a>)}</p>
      <p className="fm mt-8 text-[12px] opacity-60">{pad((c.projects ?? []).length)} projects · {pad((c.experience ?? []).length)} placements</p>
    </div></footer>}
  </StudioRoot>;
}

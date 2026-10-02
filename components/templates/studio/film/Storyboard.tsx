"use client";

import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/familjen-grotesk";
import "@fontsource-variable/caveat";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, pad, paragraphs, useStudio, type StudioProps } from "../kit";

const SHOTS = ["WIDE", "MEDIUM", "CLOSE-UP", "TRACKING", "AERIAL", "INSERT"];
const MOVES = ["slow push in", "hold", "pan left →", "dolly out", "handheld", "rack focus"];
const Pin = ({ className = "" }: { className?: string }) => <span aria-hidden className={`absolute z-10 size-3.5 rounded-full shadow-[0_2px_3px_rgba(0,0,0,.4)] ${className}`} style={{ background: "radial-gradient(circle at 35% 35%, #ff8a7a, var(--t-accent) 60%)" }} />;

export default function Storyboard({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const note = "font-[family-name:var(--t-mono)]";

  return <StudioRoot studio={studio} className="text-[15px] leading-relaxed">
    <header className="flex items-center justify-between border-b-2 border-[var(--t-fg)] px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] @3xl:px-8"><span>{c.name} — Production board</span><span className="hidden tm @2xl:inline">Sheet 1 of {Math.max(1, Math.ceil((c.projects ?? []).length / 3))}</span><a href="#call" className="hover-a">Call sheet ↓</a></header>

    <section className="grid gap-8 px-5 py-14 @3xl:px-8 @4xl:grid-cols-[1.3fr_1fr]">
      <div>
        <p className={`${note} text-[1.6rem] ta -rotate-1`}>title card —</p>
        <h1 className="fd text-[clamp(3rem,9cqw,7rem)] font-[700] leading-[0.88] tracking-[-0.04em]" {...ed("name")}>{c.name}</h1>
        <p className="mt-5 text-[1.2rem]" {...ed("professional_title")}>{c.professional_title}{c.location && <span className="tm"> · {c.location}</span>}</p>
      </div>
      <div className="relative self-end border-2 border-[var(--t-fg)] bs p-5 shadow-[6px_6px_0_var(--t-fg)]">
        <Pin className="-top-2 left-1/2" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] tm">Logline</p>
        <p className="mt-2 text-[1.3rem] font-semibold leading-snug" {...ed("tagline")}>{c.tagline}</p>
      </div>
    </section>

    {has("projects") && <section className="border-y-2 border-[var(--t-fg)] px-5 py-14 @3xl:px-8" style={{ backgroundImage: "radial-gradient(color-mix(in oklab,var(--t-fg) 9%,transparent) 1px, transparent 1px)", backgroundSize: "14px 14px" }}>
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em]">{label("projects", "Selected work")}</h2>
      <div className="mt-8 grid gap-x-6 gap-y-12 @3xl:grid-cols-2 @5xl:grid-cols-3">{(c.projects ?? []).map((project, index) => <Reveal key={index} delay={(index % 3) * 90} className={`relative ${index % 2 ? "rotate-[0.6deg]" : "-rotate-[0.6deg]"}`}>
        <Pin className="-top-1.5 left-6" /><Pin className="-top-1.5 right-6" />
        <article className="border-2 border-[var(--t-fg)] bg-[color-mix(in_oklab,var(--t-surface)_100%,transparent)] p-3 shadow-[0_10px_20px_-12px_rgba(0,0,0,.4)]" {...ed(`projects.${index}`)}>
          <div className="flex items-center justify-between border-b-2 border-[var(--t-fg)] pb-2 text-[11px] font-bold uppercase tracking-[0.14em]"><span>Sc. {pad(index + 1)} / Shot {String.fromCharCode(65 + index)}</span><span className="tm">{SHOTS[index % SHOTS.length]}</span></div>
          <div className="relative mt-3 border-2 border-[var(--t-fg)]"><Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="aspect-video w-full" />
            <svg viewBox="0 0 100 56" className="pointer-events-none absolute inset-0 size-full text-[var(--t-accent)]" preserveAspectRatio="none" aria-hidden><path d="M18 46 C 34 40, 52 36, 78 22" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" vectorEffect="non-scaling-stroke" /><path d="M78 22 l-6 0 M78 22 l-2 5" stroke="currentColor" strokeWidth="1.2" vectorEffect="non-scaling-stroke" /></svg></div>
          <h3 className="fd mt-3 text-[1.4rem] font-[700] leading-tight">{project.title}</h3>
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] tm">{[project.category, project.client, project.year].filter(Boolean).join(" · ")}</p>
          <p className="mt-2 text-[14px] pretty">{project.description}</p>
          <p className={`${note} mt-2 text-[1.3rem] leading-none ta`}>cam: {MOVES[index % MOVES.length]}</p>
        </article>
      </Reveal>)}</div>
    </section>}

    {has("about") && <section className="grid gap-8 px-5 py-16 @3xl:grid-cols-[1fr_2fr] @3xl:px-8"><h2 className="text-[12px] font-semibold uppercase tracking-[0.18em]">{label("about", "Treatment")}</h2><div className="space-y-4 text-[1.15rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div></section>}

    <section className="grid gap-10 border-t-2 border-[var(--t-fg)] px-5 py-16 @3xl:grid-cols-3 @3xl:px-8">
      {has("experience") && <div className="@3xl:col-span-2"><h2 className="text-[12px] font-semibold uppercase tracking-[0.18em]">{label("experience", "Crew history")}</h2>
        <table className="mt-4 w-full border-2 border-[var(--t-fg)] text-[14px]"><tbody>{(c.experience ?? []).map((role, index) => <tr key={index} className="border-b border-[var(--t-fg)] last:border-b-0" {...ed(`experience.${index}`)}><td className="w-28 border-r border-[var(--t-fg)] px-3 py-2 text-[12px] font-semibold uppercase">{[role.start_date, role.end_date].filter(Boolean).join("–")}</td><td className="px-3 py-2"><b>{role.job_title}</b> · {role.company}{role.description && <span className="block text-[13px] tm">{role.description}</span>}</td></tr>)}</tbody></table></div>}
      {has("skills") && <div><h2 className="text-[12px] font-semibold uppercase tracking-[0.18em]">{label("skills", "Kit")}</h2><ul className="mt-4 space-y-1" {...ed("skills")}>{(c.skills ?? []).map((skill) => <li key={skill} className="flex items-center gap-2"><span className="size-3 border-2 border-[var(--t-fg)] bg-[var(--t-accent)]" />{skill}</li>)}</ul></div>}
    </section>

    {has("highlights") && <section className="border-t-2 border-[var(--t-fg)] px-5 py-12 @3xl:px-8"><h2 className="text-[12px] font-semibold uppercase tracking-[0.18em]">{label("highlights", "Screenings")}</h2><ul className="mt-4 flex flex-wrap gap-3">{(c.highlights ?? []).map((item, index) => <li key={index} className="border-2 border-[var(--t-fg)] px-3 py-1.5 text-[14px]" {...ed(`highlights.${index}`)}><b>{item.title}</b> <span className="tm">{item.detail} {item.year}</span></li>)}</ul></section>}

    {has("contact") && <footer id="call" className="border-t-2 border-[var(--t-fg)] bg-[var(--t-fg)] px-5 py-14 text-[var(--t-bg)] @3xl:px-8">
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] opacity-70">Call sheet · {c.availability}</p>
      <a href={c.email ? `mailto:${c.email}` : "#"} className="fd mt-3 block break-all text-[clamp(2rem,6cqw,4.4rem)] font-[700] leading-none hover:text-[var(--t-accent)]" {...ed("email")}>{c.email}</a>
      <p className="mt-6 flex flex-wrap gap-5 text-[13px] font-semibold uppercase">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover:text-[var(--t-accent)]">{link.label} ↗</a>)}</p>
    </footer>}
  </StudioRoot>;
}

"use client";

import "@fontsource-variable/hanken-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import { useMemo, useState } from "react";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, initials, paragraphs, useStudio, type StudioProps } from "../kit";

const LANGUAGE_COLOURS = ["#3178c6", "#00add8", "#f1e05a", "#e34c26", "#563d7c", "#b07219", "#89e051"];
const yearOf = (value?: string) => { const match = value?.match(/\d{4}/); return match ? Number(match[0]) : /present|now/i.test(value ?? "") ? new Date().getFullYear() : undefined; };

/** A plausible activity pattern for a year, seeded so it is stable between renders. */
function activity(seed: number, busy: number) {
  let state = seed * 9301 + 49297;
  return Array.from({ length: 53 * 7 }, (_, day) => {
    state = (state * 9301 + 49297) % 233280;
    const weekday = day % 7;
    const base = (state / 233280) * (weekday === 0 || weekday === 6 ? 0.45 : 1) * busy;
    return base < 0.18 ? 0 : base < 0.42 ? 1 : base < 0.62 ? 2 : base < 0.8 ? 3 : 4;
  });
}

export default function Contributions({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const roles = c.experience ?? [];
  const now = new Date().getFullYear();
  const firstYear = Math.min(...roles.map((role) => yearOf(role.start_date) ?? now), now);
  const years = Array.from({ length: Math.min(now - firstYear + 1, 8) }, (_, i) => now - i);
  const [selected, setSelected] = useState(now);
  const [hover, setHover] = useState<number | null>(null);
  const roleThen = roles.find((role) => (yearOf(role.start_date) ?? 0) <= selected && selected <= (yearOf(role.end_date) ?? now));
  const cells = useMemo(() => activity(selected, roleThen ? 1.05 : 0.6), [selected, roleThen]);
  const total = cells.reduce((sum, level) => sum + level * 3, 0);
  const level = (n: number) => ["color-mix(in oklab,var(--t-fg) 7%,var(--t-bg))", "color-mix(in oklab,var(--t-accent) 30%,var(--t-bg))", "color-mix(in oklab,var(--t-accent) 55%,var(--t-bg))", "color-mix(in oklab,var(--t-accent) 80%,var(--t-bg))", "var(--t-accent)"][n];

  return <StudioRoot studio={studio} className="text-[15px] leading-relaxed">
    <header className="border-b rule bs"><div className="mx-auto flex h-14 max-w-[80rem] items-center gap-6 px-5 text-[14px]"><span className="font-semibold">{c.name}</span>
      <nav className="flex gap-5 overflow-x-auto tm"><a href="#overview" className="border-b-2 border-[var(--t-accent)] py-4 text-[var(--t-fg)]">Overview</a>{has("projects") && <a href="#pinned" className="py-4 hover-a">Projects <span className="rounded-full bg-[var(--t-rule)] px-1.5 text-[12px]">{(c.projects ?? []).length}</span></a>}{has("experience") && <a href="#activity" className="py-4 hover-a">Activity</a>}</nav></div></header>

    <div id="overview" className="mx-auto grid max-w-[80rem] gap-10 px-5 py-10 @4xl:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="min-w-0">
        <div className="grid aspect-square w-40 place-items-center overflow-hidden rounded-full border rule bs text-[3.2rem] font-semibold tracking-tight @4xl:w-full" {...ed("avatar")}>{c.avatar ? <Picture src={c.avatar} alt={c.name ?? ""} className="size-full" /> : initials(c.name)}</div>
        <h1 className="fd mt-5 text-[1.7rem] font-semibold leading-tight tracking-tight" {...ed("name")}>{c.name}</h1>
        <p className="text-[1.1rem] tm" {...ed("professional_title")}>{c.professional_title}</p>
        {c.availability && <p className="mt-4 flex items-center gap-2 rounded-md border rule px-3 py-1.5 text-[13px]" {...ed("availability")}><span className="size-2 shrink-0 rounded-full ba" />{c.availability}</p>}
        {c.tagline && <p className="mt-4 pretty" {...ed("tagline")}>{c.tagline}</p>}
        <ul className="mt-5 space-y-1.5 text-[14px]">{c.location && <li className="tm">⌖ {c.location}</li>}{contactLinks(c).map((link) => <li key={link.url}><a href={link.url} {...external(link.url)} className="hover-a">↗ {link.label}</a></li>)}</ul>
        {has("highlights") && <div className="mt-8 border-t rule pt-5"><h2 className="text-[14px] font-semibold">{label("highlights", "Achievements")}</h2>
          <ul className="mt-3 space-y-3">{(c.highlights ?? []).map((item, index) => <li key={index} className="flex gap-3" {...ed(`highlights.${index}`)}><span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-[var(--t-accent)] bs text-[10px] font-semibold">{item.year?.match(/\d{2}(\d{2})/)?.[1] ? `’${item.year.match(/\d{2}(\d{2})/)![1]}` : "★"}</span><span className="min-w-0 text-[13px] leading-snug">{item.url ? <a href={item.url} {...external(item.url)} className="font-medium hover-a">{item.title}</a> : <span className="font-medium">{item.title}</span>}{item.detail && <span className="block tm">{item.detail}</span>}</span></li>)}</ul></div>}
      </aside>

      <main className="min-w-0 space-y-10">
        {has("about") && <section className="rounded-lg border rule p-6"><p className="fm text-[12px] tm">{c.name?.split(" ")[0]?.toLowerCase()} / README.md</p><div className="mt-3 space-y-3 text-[1.02rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
          {has("skills") && <p className="mt-5 flex flex-wrap gap-1.5" {...ed("skills")}>{(c.skills ?? []).map((skill) => <span key={skill} className="rounded-full bg-[color-mix(in_oklab,var(--t-accent)_14%,var(--t-bg))] px-2.5 py-0.5 text-[12px] font-medium ta">{skill}</span>)}</p>}</section>}

        {has("projects") && <section id="pinned"><h2 className="text-[1rem]">Pinned</h2>
          <div className="mt-3 grid gap-4 @2xl:grid-cols-2">{(c.projects ?? []).map((project, index) => <Reveal key={index} as="article" className="flex min-w-0 flex-col overflow-hidden rounded-lg border rule">
            <div {...ed(`projects.${index}`)} className="flex flex-1 flex-col">
              <Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="aspect-[2/1] w-full border-b rule" />
              <div className="flex flex-1 flex-col p-4">
                <p className="flex items-center gap-2"><span className="tm">▢</span><a href={project.github || project.live_url || "#"} {...external(project.github || project.live_url || "#")} className="truncate font-semibold ta hover:underline">{project.title}</a><span className="ml-auto rounded-full border rule px-2 text-[11px] tm">{project.category ?? "Public"}</span></p>
                <p className="mt-2 flex-1 text-[14px] tm pretty">{project.description}</p>
                <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] tm">{(project.technologies ?? []).slice(0, 3).map((tech, k) => <span key={tech} className="flex items-center gap-1.5"><span className="size-3 rounded-full" style={{ background: LANGUAGE_COLOURS[(index + k) % LANGUAGE_COLOURS.length] }} />{tech}</span>)}{project.year && <span>Updated {project.year}</span>}</p>
              </div>
            </div>
          </Reveal>)}</div>
        </section>}

        {has("experience") && <section id="activity">
          <div className="flex items-baseline justify-between gap-4"><h2 className="text-[1rem]">{total.toLocaleString("en")} contributions in {selected}</h2>{roleThen && <p className="truncate text-[13px] tm">{roleThen.job_title} · {roleThen.company}</p>}</div>
          <div className="mt-3 grid gap-4 @3xl:grid-cols-[minmax(0,1fr)_6rem]">
            <div className="min-w-0 self-start overflow-x-auto rounded-lg border rule p-4">
              <div className="grid w-max grid-flow-col grid-rows-7 gap-[3px]" onMouseLeave={() => setHover(null)}>{cells.map((value, index) => <span key={index} onMouseEnter={() => setHover(index)} className="size-[11px] rounded-[2px] outline-offset-1 hover:outline hover:outline-1 hover:outline-[var(--t-fg)]" style={{ background: level(value) }} />)}</div>
              <div className="mt-3 flex items-center justify-between text-[12px] tm"><span>{hover !== null ? `${cells[hover]! * 3} contributions · week ${Math.floor(hover / 7) + 1}` : "Hover a day"}</span><span className="flex items-center gap-1">Less {[0, 1, 2, 3, 4].map((n) => <span key={n} className="size-[11px] rounded-[2px]" style={{ background: level(n) }} />)} More</span></div>
            </div>
            <ul className="flex gap-1 self-start overflow-x-auto @3xl:flex-col">{years.map((value) => <li key={value}><button type="button" onClick={() => setSelected(value)} className={`w-full rounded-md px-3 py-1.5 text-left text-[13px] ${selected === value ? "ba font-semibold text-[var(--t-bg)]" : "tm hover:bg-[var(--t-rule)]"}`}>{value}</button></li>)}</ul>
          </div>

          <ol className="mt-8 border-l-2 rule">{roles.map((role, index) => <li key={index} className="relative pb-8 pl-7" {...ed(`experience.${index}`)}>
            <span className="absolute -left-[9px] top-1 grid size-4 place-items-center rounded-full border-2 rule bg-[var(--t-bg)]"><span className="size-1.5 rounded-full ba" /></span>
            <p className="text-[13px] tm">{[role.start_date, role.end_date].filter(Boolean).join(" – ")}</p>
            <p className="font-semibold">{role.job_title} <span className="font-normal tm">at</span> {role.company}</p>
            {role.description && <p className="mt-1 text-[14px] tm pretty">{role.description}</p>}
          </li>)}</ol>
        </section>}

        {has("education") && <section className="rounded-lg border rule p-5"><h2 className="text-[14px] font-semibold">Education</h2><ul className="mt-2 space-y-2 text-[14px]">{(c.education ?? []).map((item, index) => <li key={index} {...ed(`education.${index}`)}><b>{item.school}</b> · {item.degree} <span className="tm">{[item.start_date, item.end_date].filter(Boolean).join("–")}</span></li>)}</ul></section>}
      </main>
    </div>
  </StudioRoot>;
}

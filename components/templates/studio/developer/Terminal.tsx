"use client";

import "@fontsource-variable/jetbrains-mono";
import "@fontsource/vt323";
import "@fontsource/ibm-plex-mono/400.css";
import { useState } from "react";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";

/** A deterministic short hash, so each job gets a stable fake commit id. */
const hash = (text: string) => { let h = 2166136261; for (const char of text) h = Math.imul(h ^ char.charCodeAt(0), 16777619); return (h >>> 0).toString(16).padStart(8, "0").slice(0, 7); };
const handle = (name?: string) => (name ?? "you").toLowerCase().split(/\s+/)[0]!.replace(/[^a-z0-9]/g, "") || "you";

function Prompt({ user, host, command }: { user: string; host: string; command: string }) {
  return <p className="text-[0.92rem]"><span className="ta">{user}@{host}</span><span className="tm">:~$ </span><span>{command}</span></p>;
}

export default function Terminal({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const [active, setActive] = useState(0);
  const user = handle(c.name);
  const host = (c.location ?? "home").split(/[,·]/)[0]!.trim().toLowerCase().replace(/[^a-z]/g, "") || "home";
  const projects = c.projects ?? [];
  const current = projects[Math.min(active, Math.max(projects.length - 1, 0))];

  return <StudioRoot studio={studio} className="fm text-[15px] leading-relaxed">
    <div className="sticky top-0 z-20 flex h-9 items-center gap-2 border-b rule bs px-4 text-[12px]">
      <span className="size-3 rounded-full bg-[#ff5f57]" /><span className="size-3 rounded-full bg-[#febc2e]" /><span className="size-3 rounded-full bg-[#28c840]" />
      <span className="mx-auto tm">{user}@{host}: ~/portfolio — zsh — 120×40</span>
      <nav className="hidden gap-4 @3xl:flex">{[["work", "projects"], ["log", "experience"], ["contact", "contact"]].map(([id, text]) => <a key={id} href={`#${id}`} className="tm hover-a">{text}</a>)}</nav>
    </div>

    <main className="mx-auto max-w-[72rem] px-5 pb-24 pt-12 @3xl:px-10">
      <Prompt user={user} host={host} command="whoami" />
      <h1 className="fd mt-4 text-[clamp(2.6rem,9cqw,6.5rem)] leading-[0.95] tracking-[-0.03em]" {...ed("name")}>{c.name}</h1>
      <p className="mt-4 text-[1.05rem]"><span className="ta">#</span> <span {...ed("professional_title")}>{c.professional_title}</span>{c.location && <span className="tm"> · {c.location}</span>}</p>
      {c.tagline && <p className="mt-6 max-w-[46rem] text-[1.15rem] leading-snug pretty" {...ed("tagline")}>{c.tagline}</p>}
      {c.availability && <p className="mt-6 inline-flex items-center gap-2 border rule px-3 py-1 text-[12px]" {...ed("availability")}><span className="size-2 animate-pulse rounded-full ba" />{c.availability}</p>}

      {has("about") && <section id="about" className="mt-20">
        <Prompt user={user} host={host} command={`cat ${label("about", "about").toLowerCase().replace(/\s+/g, "-")}.txt`} />
        <div className="mt-4 max-w-[46rem] space-y-4 border-l-2 rule-strong pl-5">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
      </section>}

      {has("projects") && <section id="work" className="mt-20">
        <Prompt user={user} host={host} command={`ls -la ~/${label("projects", "projects").toLowerCase().replace(/\s+/g, "-")}`} />
        <p className="mt-3 tm">total {projects.length}</p>
        <div className="mt-2 grid gap-8 @4xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <ul className="min-w-0">{projects.map((project, index) => <li key={index}>
            <button type="button" onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => setActive(index)} className={`grid w-full grid-cols-[auto_1fr] gap-x-4 border-b rule py-3 text-left transition-colors ${index === active ? "bs" : ""}`} {...ed(`projects.${index}`)}>
              <span className="tm hidden @xl:inline">drwxr-xr-x {project.year ?? "----"}</span>
              <span className="min-w-0 truncate @xl:col-auto col-span-2"><span className={index === active ? "ta" : ""}>{index === active ? "▸ " : "  "}{project.title}/</span></span>
              <span className="col-span-2 mt-1 block pl-4 text-[13px] tm @xl:pl-[9.5rem]">{project.description}</span>
            </button>
          </li>)}</ul>
          {current && <Reveal className="min-w-0 self-start @4xl:sticky @4xl:top-14">
            <div className="border rule p-2"><Picture src={current.image} alt={current.title ?? "Project"} embedded={embedded} className="aspect-[16/10] w-full" edit={`projects.${active}`} /></div>
            <dl className="mt-3 grid grid-cols-[7rem_1fr] gap-y-1 text-[13px]">
              {current.role && <><dt className="tm">role</dt><dd>{current.role}</dd></>}
              {current.client && <><dt className="tm">client</dt><dd>{current.client}</dd></>}
              {!!current.technologies?.length && <><dt className="tm">stack</dt><dd>{current.technologies.join(", ")}</dd></>}
            </dl>
            <p className="mt-3 flex gap-5 text-[13px]">{current.live_url && <a href={current.live_url} {...external(current.live_url)} className="ta underline">open ↗</a>}{current.github && <a href={current.github} {...external(current.github)} className="ta underline">source ↗</a>}</p>
          </Reveal>}
        </div>
      </section>}

      {has("experience") && <section id="log" className="mt-20">
        <Prompt user={user} host={host} command="git log --graph --oneline career" />
        <ol className="mt-4">{(c.experience ?? []).map((job, index) => <li key={index} className="grid grid-cols-[1.5rem_1fr] gap-x-2" {...ed(`experience.${index}`)}>
          <span className="relative flex justify-center"><span className="absolute inset-y-0 w-px bg-[var(--t-rule-strong)]" /><span className={`relative mt-2 size-2.5 rounded-full ${index === 0 ? "ba" : "border-2 border-[var(--t-fg)] bg-[var(--t-bg)]"}`} /></span>
          <div className="pb-8">
            <p><span className="ta">{hash(`${job.company}${job.job_title}`)}</span> {index === 0 && <span className="tm">(HEAD → main) </span>}<span className="font-semibold">{job.job_title}</span> @ {job.company}</p>
            <p className="text-[13px] tm">Date: {[job.start_date, job.end_date].filter(Boolean).join(" → ")}{job.location && ` · ${job.location}`}</p>
            {job.description && <p className="mt-2 max-w-[44rem] text-[14px] pretty">{job.description}</p>}
          </div>
        </li>)}</ol>
      </section>}

      {has("skills") && <section className="mt-12">
        <Prompt user={user} host={host} command="echo $STACK" />
        <p className="mt-4 flex flex-wrap gap-x-3 gap-y-2" {...ed("skills")}>{(c.skills ?? []).map((skill) => <span key={skill}><span className="tm">[</span>{skill}<span className="tm">]</span></span>)}</p>
      </section>}

      {has("highlights") && <section className="mt-20">
        <Prompt user={user} host={host} command={`tail -n ${(c.highlights ?? []).length} ${label("highlights", "talks").toLowerCase().replace(/\s+/g, "-")}.log`} />
        <ul className="mt-4 space-y-1.5 text-[14px]">{(c.highlights ?? []).map((item, index) => <li key={index} className="flex gap-4" {...ed(`highlights.${index}`)}><span className="tm shrink-0">[{item.year ?? "----"}]</span><span>{item.url ? <a href={item.url} {...external(item.url)} className="underline hover-a">{item.title}</a> : item.title}{item.detail && <span className="tm"> — {item.detail}</span>}</span></li>)}</ul>
      </section>}

      {has("contact") && <section id="contact" className="mt-20">
        <Prompt user={user} host={host} command="./contact.sh" />
        <ul className="mt-4 space-y-1" {...ed("email")}>{contactLinks(c).map((link) => <li key={link.url}><span className="tm">→ </span><span className="inline-block w-24 tm">{link.label.toLowerCase()}</span><a href={link.url} {...external(link.url)} className="underline hover-a">{link.url.replace(/^mailto:/, "").replace(/^https?:\/\//, "")}</a></li>)}</ul>
        <p className="mt-16"><span className="ta">{user}@{host}</span><span className="tm">:~$ </span><span className="inline-block h-[1.1em] w-[0.6em] translate-y-[3px] bg-[var(--t-fg)] [animation:studio-blink_1.1s_steps(1)_infinite]" /></p>
      </section>}
    </main>
  </StudioRoot>;
}

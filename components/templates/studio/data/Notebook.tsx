"use client";

import "@fontsource-variable/inter-tight";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import { useState, type ReactNode } from "react";
import { Picture, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";

const variable = (name?: string) => (name ?? "me").toLowerCase().split(/\s+/)[0]!.replace(/[^a-z0-9]/g, "") || "me";

function Cell({ n, code, children, running }: { n: number; code: ReactNode; children?: ReactNode; running?: boolean }) {
  return <div className="group grid grid-cols-[4.5rem_1fr] gap-x-3 rounded-md border border-transparent py-2 transition-colors hover:border-[var(--t-rule)] @3xl:grid-cols-[5.5rem_1fr]">
    <span className="fm pt-2.5 text-right text-[12px] ta">In [{running ? "*" : n}]:</span>
    <pre className="fm overflow-x-auto rounded-md border rule bs px-3 py-2 text-[13px] leading-6">{code}</pre>
    {children && <><span className="fm pt-2 text-right text-[12px] text-[#d84a4a]">Out[{running ? " " : n}]:</span><div className={`min-w-0 py-2 transition-opacity duration-300 ${running ? "opacity-30" : ""}`}>{children}</div></>}
  </div>;
}

const kw = (text: string) => <span className="text-[#008000] font-semibold">{text}</span>;
const str = (text: string) => <span className="text-[#ba2121]">&quot;{text}&quot;</span>;
const fn = (text: string) => <span className="text-[#0055aa]">{text}</span>;

export default function Notebook({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const me = variable(c.name);
  const [runs, setRuns] = useState(1);
  const [running, setRunning] = useState(false);
  const runAll = () => { setRunning(true); window.setTimeout(() => { setRunning(false); setRuns((value) => value + 1); }, 650); };
  let cell = (runs - 1) * 10;
  const n = () => ++cell;
  const max = Math.max(...(c.stats ?? []).map((_, i) => i + 1), 1);

  return <StudioRoot studio={studio} className="text-[15px] leading-relaxed">
    <header className="sticky top-0 z-10 border-b rule bg-[var(--t-bg)]">
      <div className="mx-auto flex max-w-[64rem] items-center gap-4 px-4 py-2 text-[13px]">
        <span className="font-semibold">{me}_portfolio.ipynb</span><span className="hidden tm @2xl:inline">Last saved: just now</span>
        <button type="button" onClick={runAll} className="ml-auto rounded border rule px-2.5 py-1 hover:bg-[var(--t-surface)]" aria-label="Run all cells">▶▶ Run all</button>
        <span className="flex items-center gap-1.5 tm"><span className={`size-2.5 rounded-full border border-current ${running ? "bg-[var(--t-fg)]" : ""}`} />Python 3</span>
      </div>
    </header>

    <main className="mx-auto max-w-[64rem] px-2 py-8 @3xl:px-4">
      <div className="mb-4 px-2 @3xl:pl-[6.25rem]">
        <h1 className="fd text-[clamp(2.2rem,6cqw,3.6rem)] font-[700] leading-none tracking-[-0.03em]" {...ed("name")}>{c.name}</h1>
        <p className="mt-2 text-[1.15rem] tm" {...ed("professional_title")}>{c.professional_title} · {c.location}</p>
        <p className="mt-4 max-w-[40rem] text-[1.1rem] pretty" {...ed("tagline")}>{c.tagline}</p>
      </div>

      {has("about") && <Cell n={n()} running={running} code={<>{fn("print")}({me}.bio)</>}><div className="space-y-3 max-w-[44rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div></Cell>}

      {has("stats") && <Cell n={n()} running={running} code={<>{me}.impact.{fn("plot")}(kind={str("barh")})</>}>
        <div className="max-w-[40rem] space-y-2">{(c.stats ?? []).map((stat, index) => <div key={index} className="grid grid-cols-[8rem_1fr] items-center gap-3" {...ed(`stats.${index}`)}><span className="fm truncate text-right text-[12px] tm">{stat.label}</span><span className="flex items-center gap-2"><span className="h-5 ba transition-[width] duration-700" style={{ width: running ? "0%" : `${30 + ((max - index) / max) * 60}%` }} /><span className="fm text-[13px] font-semibold">{stat.value}</span></span></div>)}</div>
      </Cell>}

      {has("projects") && <Cell n={n()} running={running} code={<>{me}.projects[[{str("title")}, {str("year")}, {str("result")}]]</>}>
        <div className="overflow-x-auto"><table className="fm w-full min-w-[34rem] text-[12.5px]"><thead><tr className="border-b-2 border-[var(--t-fg)] text-left"><th className="px-2 py-1" /><th className="px-2 py-1">title</th><th className="px-2 py-1">year</th><th className="px-2 py-1">result</th></tr></thead>
          <tbody>{(c.projects ?? []).map((project, index) => <tr key={index} className="border-b rule even:bs" {...ed(`projects.${index}`)}><td className="px-2 py-1.5 font-semibold">{index}</td><td className="px-2 py-1.5 font-semibold">{project.title}</td><td className="px-2 py-1.5">{project.year}</td><td className="px-2 py-1.5 font-[family-name:var(--t-text)] text-[13.5px]">{project.description}</td></tr>)}</tbody></table></div>
      </Cell>}

      {has("projects") && (c.projects ?? []).filter((project) => project.image).map((project, index) => <Cell key={index} n={n()} running={running} code={<>{fn("display")}({me}.projects.{fn("figure")}({index}))  <span className="text-[#888]"># {project.title}</span></>}>
        <figure {...ed(`projects.${index}`)}><Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="aspect-[16/10] w-full max-w-[44rem] border rule" /><figcaption className="mt-1 text-[13px] tm">{project.title} — {project.technologies?.join(", ")}</figcaption></figure>
      </Cell>)}

      {has("experience") && <Cell n={n()} running={running} code={<>{me}.experience.{fn("sort_values")}({str("start")}, ascending={kw("False")})</>}>
        <div className="overflow-x-auto"><table className="fm w-full min-w-[34rem] text-[12.5px]"><thead><tr className="border-b-2 border-[var(--t-fg)] text-left"><th className="px-2 py-1">company</th><th className="px-2 py-1">role</th><th className="px-2 py-1">start</th><th className="px-2 py-1">end</th></tr></thead>
          <tbody>{(c.experience ?? []).map((role, index) => <tr key={index} className="border-b rule even:bs" {...ed(`experience.${index}`)}><td className="px-2 py-1.5 font-semibold">{role.company}</td><td className="px-2 py-1.5">{role.job_title}</td><td className="px-2 py-1.5">{role.start_date}</td><td className="px-2 py-1.5">{role.end_date}</td></tr>)}</tbody></table></div>
        <ul className="mt-3 max-w-[44rem] list-disc space-y-1 pl-5 text-[14px]">{(c.experience ?? []).filter((role) => role.description).map((role, index) => <li key={index}><b>{role.company}:</b> {role.description}</li>)}</ul>
      </Cell>}

      {has("skills") && <Cell n={n()} running={running} code={<>!pip list --{fn("user")}</>}><pre className="fm text-[12.5px] leading-6" {...ed("skills")}>{"Package              Version\n-------------------- -------\n"}{(c.skills ?? []).map((skill) => `${skill.toLowerCase().replace(/\s+/g, "-").padEnd(21)}latest\n`).join("")}</pre></Cell>}

      {(has("highlights") || has("education")) && <div className="my-4 px-2 @3xl:pl-[6.25rem]">
        {has("highlights") && <><h2 className="fd text-[1.5rem] font-[700]">## {label("highlights", "Talks & recognition")}</h2><ul className="mt-2 list-disc space-y-1 pl-5">{(c.highlights ?? []).map((item, index) => <li key={index} {...ed(`highlights.${index}`)}><b>{item.title}</b>{item.detail && ` — ${item.detail}`} ({item.year})</li>)}</ul></>}
        {has("education") && <><h2 className="fd mt-6 text-[1.5rem] font-[700]">## {label("education", "Education")}</h2><ul className="mt-2 list-disc space-y-1 pl-5">{(c.education ?? []).map((item, index) => <li key={index} {...ed(`education.${index}`)}>{item.degree}, <i>{item.school}</i> ({item.end_date})</li>)}</ul></>}
      </div>}

      {has("contact") && <Cell n={n()} running={running} code={<>{me}.{fn("contact")}()</>}>
        <ul className="space-y-1">{contactLinks(c).map((link) => <li key={link.url} className="fm text-[13px]"><span className="tm">{link.label.toLowerCase().padEnd(10, " ")}</span> <a href={link.url} {...external(link.url)} className="ta underline">{link.url.replace(/^mailto:|^https?:\/\//g, "")}</a></li>)}</ul>
        {c.availability && <p className="mt-3 text-[14px]" {...ed("availability")}>✓ {c.availability}</p>}
      </Cell>}
    </main>
  </StudioRoot>;
}

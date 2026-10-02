"use client";

import "@fontsource-variable/crimson-pro";
import "@fontsource-variable/crimson-pro/wght-italic.css";
import "@fontsource-variable/eb-garamond";
import "@fontsource/ibm-plex-mono/400.css";
import type { ReactNode } from "react";
import { Picture, StudioRoot, contactLinks, ed, external, hostname, paragraphs, useStudio, type StudioProps } from "../kit";

function Heading({ n, children }: { n: number; children: ReactNode }) {
  return <h2 className="fd mt-12 text-[1.35rem] font-[600]"><span className="mr-4">{n}</span>{children}</h2>;
}

export default function Preprint({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const year = new Date().getFullYear();
  const id = `${String(year).slice(2)}${String(new Date().getMonth() + 1).padStart(2, "0")}.${String((c.name ?? "").length * 1373 % 100000).padStart(5, "0")}`;
  let section = 0;
  const next = () => ++section;
  const references = c.highlights ?? [];

  return <StudioRoot studio={studio} className="text-[18px] leading-[1.6]">
    <div className="fm flex items-center gap-3 border-b rule bs px-5 py-2 text-[12px] tm"><span className="rounded-sm ba px-1.5 py-0.5 font-semibold text-[var(--t-bg)]">formora</span><span>:{id}v3 [{(c.skills?.[0] ?? "general").toLowerCase().replace(/\s+/g, "-")}]</span><span className="ml-auto hidden @2xl:inline" suppressHydrationWarning>Updated {new Date().toISOString().slice(0, 10)}</span></div>

    <article className="mx-auto max-w-[44rem] px-6 py-16">
      <header className="text-center">
        <h1 className="fd text-[clamp(1.9rem,4.2cqw,2.6rem)] font-[600] leading-tight balance" {...ed("tagline")}>{c.tagline}</h1>
        <p className="mt-6 text-[1.15rem]"><span {...ed("name")}>{c.name}</span><sup className="ml-0.5">1</sup></p>
        <p className="text-[15px] italic tm"><sup>1</sup><span {...ed("professional_title")}>{c.professional_title}</span>{c.location && `, ${c.location}`}</p>
        {c.email && <p className="fm mt-1 text-[13px]"><a href={`mailto:${c.email}`} className="ta" {...ed("email")}>{c.email}</a></p>}
      </header>

      {has("about") && <section className="mx-auto mt-10 max-w-[38rem]">
        <h2 className="fd text-center text-[1rem] font-[700]">Abstract</h2>
        <div className="mt-2 space-y-3 text-justify text-[16px] [hyphens:auto]">{paragraphs(c).map(({ text, index }) => <p key={index} {...ed(`summary.${index}`)}>{text}</p>)}</div>
        {has("skills") && <p className="mt-4 text-[15px]" {...ed("skills")}><b>Keywords:</b> <i>{(c.skills ?? []).join(" · ")}</i></p>}
      </section>}

      {has("projects") && <section><Heading n={next()}>{label("projects", "Research")}</Heading>
        <div className="mt-4 space-y-10">{(c.projects ?? []).map((project, index) => <figure key={index} {...ed(`projects.${index}`)}>
          <p className="text-justify"><b>{project.title}</b>{project.year && ` (${project.year})`}. {project.description}{project.github && <> Code: <a href={project.github} {...external(project.github)} className="fm text-[14px] ta">{hostname(project.github)}</a>.</>}</p>
          {project.image && <><Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="mt-4 aspect-[16/10] w-full border rule" />
            <figcaption className="mt-2 text-[15px]"><b>Figure {index + 1}.</b> {project.title}{project.category && `, ${project.category.toLowerCase()}`}.</figcaption></>}
        </figure>)}</div>
      </section>}

      {has("experience") && <section><Heading n={next()}>{label("experience", "Appointments")}</Heading>
        <table className="mt-4 w-full border-y-2 border-[var(--t-fg)] text-[16px]"><thead><tr className="border-b border-[var(--t-fg)] text-left"><th className="py-1.5 pr-4 font-[600]">Period</th><th className="py-1.5 pr-4 font-[600]">Position</th><th className="py-1.5 font-[600]">Institution</th></tr></thead>
          <tbody>{(c.experience ?? []).map((role, index) => <tr key={index} className="align-top" {...ed(`experience.${index}`)}><td className="py-1.5 pr-4 tabular-nums">{[role.start_date, role.end_date].filter(Boolean).join("–")}</td><td className="py-1.5 pr-4">{role.job_title}</td><td className="py-1.5">{role.company}</td></tr>)}</tbody></table>
      </section>}

      {has("education") && <section><Heading n={next()}>{label("education", "Education")}</Heading>
        <ul className="mt-3 space-y-1">{(c.education ?? []).map((item, index) => <li key={index} {...ed(`education.${index}`)}>{item.degree}, <i>{item.school}</i>{item.end_date && `, ${item.end_date}`}.</li>)}</ul></section>}

      {has("services") && <section><Heading n={next()}>{label("services", "Opportunities")}</Heading>
        <dl className="mt-3 space-y-3">{(c.services ?? []).map((item, index) => <div key={index} {...ed(`services.${index}`)}><dt className="inline font-[600]">{item.title}.</dt> <dd className="inline">{item.description}</dd></div>)}</dl></section>}

      {references.length > 0 && has("highlights") && <section><h2 className="fd mt-12 text-[1.35rem] font-[600]">{label("highlights", "References")}</h2>
        <ol className="mt-3 space-y-2 text-[16px]">{references.map((item, index) => <li key={index} className="grid grid-cols-[2.4rem_1fr]" {...ed(`highlights.${index}`)}><span>[{index + 1}]</span><span>{item.detail && <>{item.detail}. </>}<i>{item.title}</i>.{item.year && ` ${item.year}.`}{item.url && <> <a href={item.url} {...external(item.url)} className="fm text-[13px] ta">{hostname(item.url)}</a></>}</span></li>)}</ol></section>}

      {has("contact") && <footer className="mt-16 border-t rule pt-4 text-[14px] tm"><p><sup>*</sup>Correspondence: <a href={c.email ? `mailto:${c.email}` : "#"} className="ta">{c.email}</a>. {c.availability}</p>
        <p className="mt-2 flex flex-wrap gap-x-4">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="underline">{link.label}</a>)}</p></footer>}
    </article>
  </StudioRoot>;
}

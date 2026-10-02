"use client";

import "@fontsource/courier-prime/400.css";
import "@fontsource/courier-prime/700.css";
import "@fontsource/courier-prime/400-italic.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/600.css";
import type { ReactNode } from "react";
import { StudioRoot, contactLinks, ed, external, hostname, paragraphs, useStudio, type StudioProps } from "../kit";

const command = (name?: string) => (name ?? "you").toLowerCase().split(/\s+/)[0]!.replace(/[^a-z0-9]/g, "") || "you";
const flag = (text?: string) => `--${(text ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return <section id={id} className="mt-10"><h2 className="font-bold uppercase tracking-wide">{title}</h2><div className="mt-2 pl-[7ch]">{children}</div></section>;
}

export default function Manpage({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const cmd = command(c.name);
  const head = `${cmd.toUpperCase()}(1)`;
  const today = new Date().toLocaleDateString("en", { month: "long", year: "numeric" });

  return <StudioRoot studio={studio} className="fm text-[clamp(14px,2.9cqw,16.5px)] leading-[1.6]">
    <div className="mx-auto max-w-[86ch] px-5 py-12 @3xl:py-20">
      <header className="flex justify-between gap-4 border-b rule pb-3"><span className="font-bold">{head}</span><span className="hidden tm @xl:inline">Portfolio Manual</span><span className="font-bold">{head}</span></header>

      <Section title="Name"><p><b {...ed("name")}>{cmd}</b> — <span {...ed("professional_title")}>{c.professional_title}</span>{c.location && <span className="tm">, {c.location}</span>}</p></Section>

      {has("skills") && <Section title="Synopsis"><p className="pretty" {...ed("skills")}><b>{cmd}</b> {(c.skills ?? []).map((skill) => <span key={skill}><span className="whitespace-nowrap">[<b>{flag(skill)}</b>]</span> </span>)}[<i className="underline">problem</i> ...]</p></Section>}

      {has("about") && <Section title="Description">
        {c.tagline && <p className="mb-4 pretty" {...ed("tagline")}><b>{cmd}</b>: {c.tagline}</p>}
        <div className="space-y-4">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
      </Section>}

      {has("projects") && <Section title={label("projects", "Commands")}>
        <dl className="space-y-5">{(c.projects ?? []).map((project, index) => <div key={index} {...ed(`projects.${index}`)}>
          <dt><b>{flag(project.title)}</b>{project.year && <span className="tm"> ({project.year})</span>}</dt>
          <dd className="pl-[7ch] pretty">{project.description}{!!project.technologies?.length && <span className="tm"> Built with {project.technologies.join(", ")}.</span>}
            {(project.live_url || project.github) && <span className="mt-1 block">{project.live_url && <a href={project.live_url} {...external(project.live_url)} className="underline">{hostname(project.live_url)}</a>}{project.live_url && project.github && " · "}{project.github && <a href={project.github} {...external(project.github)} className="underline">source</a>}</span>}</dd>
        </div>)}</dl>
      </Section>}

      {has("experience") && <Section title={label("experience", "History")}>
        <dl className="space-y-5">{(c.experience ?? []).map((role, index) => <div key={index} {...ed(`experience.${index}`)}>
          <dt><b>{role.company}</b> <span className="tm">{[role.start_date, role.end_date].filter(Boolean).join("–")}</span></dt>
          <dd className="pl-[7ch]"><i>{role.job_title}</i>{role.location && `, ${role.location}`}. <span className="pretty">{role.description}</span></dd>
        </div>)}</dl>
      </Section>}

      {has("highlights") && <Section title={label("highlights", "Notes")}><ul className="space-y-2">{(c.highlights ?? []).map((item, index) => <li key={index} className="pretty" {...ed(`highlights.${index}`)}>{item.url ? <a href={item.url} {...external(item.url)} className="underline">{item.title}</a> : item.title}{item.detail && `, ${item.detail}`}{item.year && ` (${item.year})`}.</li>)}</ul></Section>}

      {has("education") && <Section title="Files"><ul className="space-y-1">{(c.education ?? []).map((item, index) => <li key={index} {...ed(`education.${index}`)}><i className="underline">{item.school}</i> — {item.degree}{item.end_date && `, ${item.end_date}`}</li>)}</ul></Section>}

      {c.availability && <Section title="Bugs"><p {...ed("availability")}>{c.availability}. Report interest to the author below.</p></Section>}

      {has("contact") && <Section title="See also" id="contact"><p className="pretty">{contactLinks(c).map((link, index, all) => <span key={link.url}><a href={link.url} {...external(link.url)} className="font-bold underline">{link.label.toLowerCase().replace(/\s+/g, "")}</a>({index + 1}){index < all.length - 1 ? ", " : ""}</span>)}</p></Section>}

      {has("contact") && c.email && <Section title="Author"><p>Written by {c.name} &lt;<a href={`mailto:${c.email}`} className="underline" {...ed("email")}>{c.email}</a>&gt;.</p></Section>}

      <footer className="mt-14 flex justify-between gap-4 border-t rule pt-3"><span className="tm">Formora 1.0</span><span className="tm">{today}</span><span className="font-bold">{head}</span></footer>
    </div>
  </StudioRoot>;
}

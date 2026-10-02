"use client";

import "@fontsource/libre-caslon-text/400.css";
import "@fontsource/libre-caslon-text/400-italic.css";
import "@fontsource/libre-caslon-text/700.css";
import "@fontsource-variable/libre-franklin";
import { Fragment } from "react";
import { Reveal, StudioRoot, contactLinks, ed, external, paragraphs, roman, useStudio, type StudioProps } from "../kit";

/** Pleading paper: numbered lines down the margin between a double and a single rule. */
function LineNumbers() {
  return <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 hidden w-12 select-none overflow-hidden pt-[7.4rem] text-right font-[family-name:var(--t-mono)] text-[11px] leading-[28px] tm @3xl:block">
    {Array.from({ length: 400 }, (_, index) => <div key={index} className="pr-3">{index + 1}</div>)}
  </div>;
}

const Heading = ({ number, children }: { number: number; children: React.ReactNode }) =>
  <h2 className="mb-6 flex items-baseline gap-4 font-[family-name:var(--t-mono)] text-[12px] font-semibold uppercase tracking-[0.22em]"><span className="ta">{roman(number).toUpperCase()}.</span>{children}</h2>;

export default function Brief({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const caseNo = `${new Date().getFullYear()}–${(c.name ?? "").replace(/^(dr|prof)\.?\s+/i, "").split(/\s+/).map((part) => part[0]).join("").toUpperCase() || "CV"}–01`;
  const sections = (["about", "services", "projects", "experience", "testimonials", "highlights"] as const).filter(has);
  const no = (section: (typeof sections)[number]) => sections.indexOf(section) + 1;

  return <StudioRoot studio={studio} className="text-[16px] leading-[28px]">
    <div className="relative mx-auto max-w-[66rem] @3xl:px-8">
      <LineNumbers />
      <div className="relative mx-0 border-[var(--t-accent)] px-5 py-10 @3xl:ml-12 @3xl:border-l-[6px] @3xl:border-double @3xl:border-r @3xl:px-14 @3xl:py-14">
        <header className="flex flex-wrap items-baseline justify-between gap-3 font-[family-name:var(--t-mono)] text-[11px] uppercase tracking-[0.2em] tm">
          <span>{c.location}</span><span>Profile of counsel</span>
        </header>

        {/* The caption: parties on the left, a column of section marks, the case details on the right. */}
        <section className="mt-10 grid border-y-2 border-[var(--t-fg)] @3xl:grid-cols-[1fr_auto_1fr]">
          <div className="py-6 @3xl:pr-8">
            <p className="font-[family-name:var(--t-mono)] text-[11px] uppercase tracking-[0.2em] tm">In the matter of</p>
            <h1 className="fd mt-3 text-[clamp(2.3rem,6cqw,3.9rem)] font-[700] leading-[1.02] tracking-[-0.01em]" {...ed("name")}>{c.name}</h1>
            <p className="mt-3 italic" {...ed("professional_title")}>{c.professional_title}</p>
          </div>
          <div aria-hidden className="hidden flex-col justify-center py-6 text-center leading-[22px] @3xl:flex">{Array.from({ length: 7 }, (_, index) => <span key={index}>)</span>)}</div>
          <div className="border-t rule py-6 @3xl:border-t-0 @3xl:pl-8">
            <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 font-[family-name:var(--t-mono)] text-[12px]">
              <dt className="uppercase tracking-[0.16em] tm">Case no.</dt><dd suppressHydrationWarning>{caseNo}</dd>
              {(c.stats ?? []).slice(0, 3).map((stat, index) => <Fragment key={index}><dt className="uppercase tracking-[0.16em] tm" {...ed(`stats.${index}`)}>{stat.label}</dt><dd className="font-semibold tabular-nums">{stat.value}</dd></Fragment>)}
            </dl>
            {c.availability && <p className="mt-5 border-l-2 border-[var(--t-accent)] pl-3 text-[14px] leading-snug" {...ed("availability")}>{c.availability}</p>}
          </div>
        </section>

        <Reveal className="mt-14">
          <p className="font-[family-name:var(--t-mono)] text-[11px] uppercase tracking-[0.2em] ta">Statement</p>
          <p className="fd mt-3 max-w-[40rem] text-[clamp(1.6rem,3.6cqw,2.3rem)] italic leading-[1.25] balance" {...ed("tagline")}>{c.tagline}</p>
        </Reveal>

        {has("about") && <section className="mt-16">
          <Heading number={no("about")}>{label("about", "Background")}</Heading>
          <ol className="max-w-[42rem] space-y-4">{paragraphs(c).map(({ text, index }, position) => <li key={index} className="grid grid-cols-[2.4rem_1fr] pretty" {...ed(`summary.${index}`)}><span className="tm">{position + 1}.</span><span>{text}</span></li>)}</ol>
          {has("skills") && <p className="mt-8 max-w-[42rem] text-[15px]"><span className="font-[family-name:var(--t-mono)] text-[11px] uppercase tracking-[0.18em] tm">Practice areas: </span>{(c.skills ?? []).join("; ")}.</p>}
        </section>}

        {has("services") && <section className="mt-16">
          <Heading number={no("services")}>{label("services", "Schedule of fees")}</Heading>
          <table className="w-full border-collapse text-left">
            <thead className="font-[family-name:var(--t-mono)] text-[11px] uppercase tracking-[0.16em] tm"><tr className="border-b-2 border-[var(--t-fg)]"><th className="w-12 py-2 font-normal">Item</th><th className="py-2 font-normal">Service</th><th className="py-2 text-right font-normal">Fee</th></tr></thead>
            <tbody>{(c.services ?? []).map((service, index) => <tr key={index} className="border-b rule align-top" {...ed(`services.${index}`)}>
              <td className="py-4 tm">{index + 1}</td>
              <td className="py-4 pr-6"><b className="font-[700]">{service.title}</b><span className="block text-[15px] tm pretty">{service.description}</span></td>
              <td className="whitespace-nowrap py-4 text-right tabular-nums">{service.price}</td>
            </tr>)}</tbody>
          </table>
        </section>}

        {has("projects") && <section className="mt-16">
          <Heading number={no("projects")}>{label("projects", "Selected matters")}</Heading>
          <ol className="space-y-9">{(c.projects ?? []).map((matter, index) => <Reveal as="li" key={index} delay={(index % 2) * 60}>
            <article className="grid gap-x-8 @3xl:grid-cols-[9rem_1fr]" {...ed(`projects.${index}`)}>
              <p className="font-[family-name:var(--t-mono)] text-[12px] uppercase tracking-[0.12em] tm">{matter.year}<span className="block normal-case tracking-normal">{matter.category}</span></p>
              <div>
                <h3 className="fd text-[1.3rem] font-[700] leading-snug"><span className="mr-2 italic font-normal tm">Re:</span>{matter.title}</h3>
                {matter.role && <p className="text-[14px] italic tm">{matter.role}</p>}
                <p className="mt-2 max-w-[40rem] pretty">{matter.description}</p>
                {matter.client && <p className="mt-3 inline-block border border-[var(--t-accent)] px-2 font-[family-name:var(--t-mono)] text-[11px] font-semibold uppercase leading-[22px] tracking-[0.16em] ta">Outcome: {matter.client}</p>}
              </div>
            </article>
          </Reveal>)}</ol>
        </section>}

        {has("experience") && <section className="mt-16">
          <Heading number={no("experience")}>{label("experience", "Admissions & appointments")}</Heading>
          <ul className="divide-y divide-[var(--t-rule)] border-y rule">
            {(c.experience ?? []).map((role, index) => <li key={`e${index}`} className="grid gap-x-8 py-3 @3xl:grid-cols-[9rem_1fr]" {...ed(`experience.${index}`)}><span className="tabular-nums tm">{[role.start_date, role.end_date].filter(Boolean).join(" – ")}</span><span><b className="font-[700]">{role.job_title}</b>, {role.company}{role.description && <span className="block text-[15px] tm">{role.description}</span>}</span></li>)}
            {(c.education ?? []).map((item, index) => <li key={`d${index}`} className="grid gap-x-8 py-3 @3xl:grid-cols-[9rem_1fr]" {...ed(`education.${index}`)}><span className="tabular-nums tm">{item.end_date}</span><span>{item.degree}, <i>{item.school}</i></span></li>)}
          </ul>
        </section>}

        {has("testimonials") && <section className="mt-16">
          <Heading number={no("testimonials")}>{label("testimonials", "Client statements")}</Heading>
          <div className="grid gap-10 @3xl:grid-cols-2">{(c.testimonials ?? []).map((item, index) => <figure key={index} {...ed(`testimonials.${index}`)}>
            <blockquote className="fd border-l-2 border-[var(--t-accent)] pl-5 text-[1.15rem] italic leading-[1.6]">{item.quote}</blockquote>
            <figcaption className="mt-3 pl-5 font-[family-name:var(--t-mono)] text-[11px] uppercase tracking-[0.16em] tm">{item.name} · {item.role}</figcaption>
          </figure>)}</div>
        </section>}

        {has("highlights") && <section className="mt-16">
          <Heading number={no("highlights")}>{label("highlights", "Recognition")}</Heading>
          <ul className="space-y-2">{(c.highlights ?? []).map((item, index) => <li key={index} className="flex flex-wrap justify-between gap-x-6" {...ed(`highlights.${index}`)}><span>{item.url ? <a href={item.url} {...external(item.url)} className="underline decoration-[var(--t-rule-strong)] hover-a">{item.title}</a> : item.title}{item.detail && <i className="tm"> — {item.detail}</i>}</span><span className="tabular-nums tm">{item.year}</span></li>)}</ul>
        </section>}

        {has("contact") && <footer className="mt-20 grid gap-10 border-t-2 border-[var(--t-fg)] pt-10 @3xl:grid-cols-2">
          <div>
            <p className="italic">Respectfully submitted,</p>
            <p className="fd mt-8 border-b border-[var(--t-fg)] pb-1 text-[2rem] italic leading-none" aria-hidden>{c.name}</p>
            <p className="mt-2 font-[700]">{c.name}</p>
            <p className="text-[15px] tm">{c.professional_title}</p>
          </div>
          <div className="self-end">
            <p className="font-[family-name:var(--t-mono)] text-[11px] uppercase tracking-[0.2em] tm">Instructions to</p>
            {c.phone && <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="mt-2 block text-[1.3rem] tabular-nums hover-a" {...ed("phone")}>{c.phone}</a>}
            <a href={c.email ? `mailto:${c.email}` : "#"} className="block break-all text-[1.3rem] hover-a" {...ed("email")}>{c.email}</a>
            <p className="mt-4 flex flex-wrap gap-x-5 font-[family-name:var(--t-mono)] text-[12px] uppercase tracking-[0.14em]">{contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover-a">{link.label}</a>)}</p>
          </div>
        </footer>}
      </div>
    </div>
  </StudioRoot>;
}

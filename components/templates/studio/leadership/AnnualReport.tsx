"use client";

import "@fontsource-variable/playfair-display";
import "@fontsource-variable/playfair-display/wght-italic.css";
import "@fontsource/libre-caslon-text/400.css";
import "@fontsource/libre-caslon-text/400-italic.css";
import "@fontsource-variable/libre-franklin";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, firstName, pad, paragraphs, useStudio, type StudioProps } from "../kit";

export default function AnnualReport({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const year = new Date().getFullYear();

  return <StudioRoot studio={studio} className="text-[16px] leading-[1.65]">
    <section className="relative overflow-hidden bg-[var(--t-fg)] px-6 py-8 text-[var(--t-bg)] @3xl:px-14">
      <div className="flex justify-between text-[12px] uppercase tracking-[0.24em] opacity-80"><span>{c.name}</span><span>Annual report {year}</span></div>
      <div className="grid min-h-[70vh] items-end gap-10 pb-6 pt-24 @4xl:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em] ta">{year} in review</p>
          <h1 className="fd mt-6 text-[clamp(3rem,8.6cqw,7.4rem)] leading-[0.95] tracking-[-0.02em]" {...ed("tagline")}>{c.tagline}</h1>
        </div>
        <div className="border-t border-[color-mix(in_oklab,var(--t-bg)_30%,transparent)] pt-4">
          <p className="fd text-[1.6rem]" {...ed("name")}>{c.name}</p>
          <p className="opacity-75" {...ed("professional_title")}>{c.professional_title}</p>
          <p className="mt-1 opacity-60">{c.location}</p>
        </div>
      </div>
    </section>

    {has("stats") && <section className="border-b rule px-6 py-16 @3xl:px-14">
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.24em] tm">{label("stats", "The year in numbers")}</h2>
      <dl className="mt-8 grid gap-y-10 @2xl:grid-cols-2 @4xl:grid-cols-4">{(c.stats ?? []).map((stat, index) => <Reveal key={index} delay={index * 90} className="border-l-2 border-[var(--t-accent)] pl-5"><div {...ed(`stats.${index}`)}><dd className="fd text-[clamp(2.8rem,6cqw,4.6rem)] leading-none">{stat.value}</dd><dt className="mt-2 text-[14px] uppercase tracking-[0.14em] tm">{stat.label}</dt></div></Reveal>)}</dl>
    </section>}

    {has("about") && <section className="grid gap-10 px-6 py-20 @3xl:px-14 @4xl:grid-cols-[1fr_1.5fr]">
      <div><p className="text-[12px] font-semibold uppercase tracking-[0.24em] ta">{label("about", "Letter from the founder")}</p><p className="fd mt-4 text-[2.2rem] italic leading-tight">Dear reader,</p></div>
      <div className="space-y-5 text-[1.1rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}<p className="fd pt-4 text-[2rem] italic leading-none">{firstName(c.name)}</p></div>
    </section>}

    {has("experience") && <section className="bs px-6 py-20 @3xl:px-14">
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.24em] tm">{label("experience", "Milestones")}</h2>
      <ol className="mt-10 grid gap-8 @3xl:grid-cols-3">{(c.experience ?? []).map((role, index) => <li key={index} className="relative border-t-2 border-[var(--t-fg)] pt-5" {...ed(`experience.${index}`)}>
        <span className="absolute -top-[9px] left-0 size-4 rounded-full border-2 border-[var(--t-fg)] bg-[var(--t-bg)]" />
        <p className="fd text-[2.4rem] leading-none ta">{role.start_date}</p>
        <p className="mt-3 text-[1.15rem] font-semibold">{role.job_title}</p><p className="tm">{role.company}</p>
        {role.description && <p className="mt-2 text-[15px] pretty">{role.description}</p>}
      </li>)}</ol>
    </section>}

    {has("highlights") && <section className="px-6 py-20 @3xl:px-14">
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.24em] tm">{label("highlights", "Highlights")}</h2>
      <ul className="mt-6 divide-y divide-[var(--t-rule)] border-y rule">{(c.highlights ?? []).map((item, index) => <li key={index} className="grid gap-2 py-5 @3xl:grid-cols-[4rem_1fr_8rem]" {...ed(`highlights.${index}`)}><span className="text-[13px] tm">{pad(index + 1)}</span><span><span className="fd text-[1.4rem]">{item.title}</span>{item.detail && <span className="block tm">{item.detail}</span>}</span><span className="text-[14px] tm @3xl:text-right">{item.year}</span></li>)}</ul>
    </section>}

    {has("projects") && <section className="grid gap-10 px-6 pb-20 @3xl:grid-cols-2 @3xl:px-14">{(c.projects ?? []).map((project, index) => <article key={index} {...ed(`projects.${index}`)}><Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="aspect-[16/10] w-full" /><p className="mt-4 text-[12px] uppercase tracking-[0.2em] ta">{project.category} · {project.client} · {project.year}</p><h3 className="fd mt-1 text-[1.8rem] leading-tight">{project.title}</h3><p className="mt-2 tm">{project.description}</p></article>)}</section>}

    {has("testimonials") && <section className="bg-[var(--t-fg)] px-6 py-20 text-center text-[var(--t-bg)] @3xl:px-14">{(c.testimonials ?? []).slice(0, 1).map((item, index) => <figure key={index} className="mx-auto max-w-[50rem]" {...ed(`testimonials.${index}`)}><blockquote className="fd text-[clamp(1.7rem,4cqw,2.8rem)] italic leading-snug balance">“{item.quote}”</blockquote><figcaption className="mt-6 text-[13px] uppercase tracking-[0.2em] opacity-70">{item.name} · {item.role}</figcaption></figure>)}</section>}

    <section className="grid gap-12 px-6 py-20 @3xl:grid-cols-2 @3xl:px-14">
      {has("services") && <div><h2 className="text-[12px] font-semibold uppercase tracking-[0.24em] tm">{label("services", "Governance & giving back")}</h2><ul className="mt-5 space-y-4">{(c.services ?? []).map((item, index) => <li key={index} {...ed(`services.${index}`)}><p className="fd text-[1.3rem]">{item.title}</p><p className="tm">{item.description}</p></li>)}</ul></div>}
      {has("education") && <div><h2 className="text-[12px] font-semibold uppercase tracking-[0.24em] tm">{label("education", "Education")}</h2><ul className="mt-5 space-y-3">{(c.education ?? []).map((item, index) => <li key={index} {...ed(`education.${index}`)}><p className="fd text-[1.3rem]">{item.school}</p><p className="tm">{item.degree}, {[item.start_date, item.end_date].filter(Boolean).join("–")}</p></li>)}</ul></div>}
    </section>

    {has("contact") && <footer className="border-t-4 border-[var(--t-accent)] px-6 py-16 @3xl:px-14">
      <div className="grid gap-8 @3xl:grid-cols-[1fr_auto]"><div><p className="text-[12px] font-semibold uppercase tracking-[0.24em] tm">Investor & press relations</p><a href={c.email ? `mailto:${c.email}` : "#"} className="fd mt-3 block text-[clamp(1.8rem,4.6cqw,3.2rem)] hover-a" {...ed("email")}>{c.email}</a>{c.availability && <p className="mt-2 tm" {...ed("availability")}>{c.availability}</p>}</div>
        <ul className="self-end text-[14px] @3xl:text-right">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <li key={link.url}><a href={link.url} {...external(link.url)} className="hover-a">{link.label} ↗</a></li>)}</ul></div>
    </footer>}
  </StudioRoot>;
}

"use client";

import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import { Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";

const tel = (phone?: string) => (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "#");
const narrow = "[font-stretch:72%]";

/** Attainment against quota: the bar runs to 150%, with a marker at 100%. */
function Attainment({ value, label, path }: { value: string; label?: string; path: string }) {
  const percent = Number.parseFloat(value.replace(/[^\d.]/g, ""));
  const show = Number.isFinite(percent) && value.includes("%");
  const width = show ? Math.min(percent / 150, 1) * 100 : 0;
  return <div {...ed(path)}>
    <p className="font-[family-name:var(--t-mono)] text-[12px] uppercase tracking-[0.18em] opacity-70">{label}</p>
    <p className={`fd text-[clamp(5rem,20cqw,13rem)] font-[800] leading-[0.8] tracking-[-0.02em] tabular-nums ta ${narrow}`}>{value}</p>
    {show && <div className="relative mt-6 h-4 rounded-full bg-[color-mix(in_oklab,var(--t-bg)_14%,transparent)]">
      <div className="h-full rounded-full ba [animation:quota-fill_1.6s_cubic-bezier(.2,.7,.1,1)_both] motion-reduce:animate-none" style={{ width: `${width}%` }} />
      <span className="absolute -top-2 bottom-[-0.5rem] w-0.5 bg-[var(--t-bg)]" style={{ left: `${(100 / 150) * 100}%` }} />
      <span className="absolute top-6 -translate-x-1/2 font-[family-name:var(--t-mono)] text-[11px] uppercase opacity-70" style={{ left: `${(100 / 150) * 100}%` }}>Quota</span>
      <style>{"@keyframes quota-fill{from{width:0}}"}</style>
    </div>}
  </div>;
}

export default function Quota({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const [headline, ...stats] = c.stats ?? [];
  const roles = [...(c.experience ?? [])].map((role, index) => ({ role, index })).reverse();

  return <StudioRoot studio={studio} className="text-[16px] leading-relaxed">
    <header className="flex items-center justify-between px-5 py-4 @3xl:px-10"><span className={`fd text-[1.4rem] font-[800] uppercase ${narrow}`}>{c.name}</span><a href={c.email ? `mailto:${c.email}` : "#contact"} className="font-[family-name:var(--t-mono)] text-[13px] uppercase hover-a">Contact →</a></header>

    <section className="px-5 @3xl:px-10">
      <div className="rounded-[10px] bs p-6 text-[var(--t-bg)] shadow-[inset_0_0_0_6px_color-mix(in_oklab,var(--t-bg)_8%,transparent)] @3xl:p-12">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className={`fd text-[clamp(2.4rem,6.4cqw,4.6rem)] font-[800] uppercase leading-[0.9] ${narrow}`} {...ed("name")}>{c.name}</h1>
            <p className="mt-2 font-[family-name:var(--t-mono)] text-[13px] uppercase tracking-[0.12em] opacity-75" {...ed("professional_title")}>{c.professional_title}{c.location && ` · ${c.location}`}</p>
          </div>
          {c.availability && <p className="max-w-[18rem] rounded-[4px] border border-current/30 px-3 py-2 font-[family-name:var(--t-mono)] text-[12px] uppercase leading-snug" {...ed("availability")}>{c.availability}</p>}
        </div>
        <div className="mt-12">{headline ? <Attainment value={headline.value ?? ""} label={headline.label} path="stats.0" /> : <p className="fd text-[3rem]" {...ed("tagline")}>{c.tagline}</p>}</div>
        {stats.length > 0 && <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-[6px] bg-[color-mix(in_oklab,var(--t-bg)_16%,transparent)]">{stats.map((stat, index) => <div key={index} className="bs p-5" {...ed(`stats.${index + 1}`)}><dd className={`fd text-[clamp(2.2rem,6cqw,4rem)] font-[800] leading-none tabular-nums ${narrow}`}>{stat.value}</dd><dt className="mt-1 font-[family-name:var(--t-mono)] text-[12px] uppercase opacity-70">{stat.label}</dt></div>)}</dl>}
      </div>
    </section>

    {headline && <section className="px-5 pt-14 @3xl:px-10"><p className="fd max-w-[46rem] text-[clamp(1.8rem,4.2cqw,3rem)] font-[600] leading-[1.08] balance" {...ed("tagline")}>{c.tagline}</p></section>}

    {has("highlights") && <ul className="flex flex-wrap gap-4 px-5 pt-12 @3xl:px-10">{(c.highlights ?? []).map((item, index) => <li key={index} className="relative bg-[var(--t-fg)] py-3 pl-4 pr-9 text-[var(--t-bg)] [clip-path:polygon(0_0,100%_0,calc(100%-18px)_50%,100%_100%,0_100%)]" {...ed(`highlights.${index}`)}>
      <b className={`fd block text-[1.15rem] font-[800] uppercase leading-tight ${narrow}`}>{item.title}</b><span className="font-[family-name:var(--t-mono)] text-[11px] uppercase opacity-70">{[item.year, item.detail].filter(Boolean).join(" · ")}</span>
    </li>)}</ul>}

    {has("projects") && <section className="px-5 py-20 @3xl:px-10">
      <h2 className={`fd text-[clamp(2.2rem,5cqw,3.4rem)] font-[800] uppercase leading-none ${narrow}`}>{label("projects", "Closed-won")}</h2>
      <ul className="mt-8 border-t-4 border-[var(--t-fg)]">{(c.projects ?? []).map((deal, index) => <Reveal as="li" key={index} delay={index * 60}>
        <article className="grid gap-3 border-b-2 border-[var(--t-fg)] py-6 @3xl:grid-cols-[6rem_1fr_auto] @3xl:items-baseline @3xl:gap-8" {...ed(`projects.${index}`)}>
          <span className="font-[family-name:var(--t-mono)] text-[13px] font-bold">{deal.year}</span>
          <div>
            <h3 className="text-[1.25rem] font-[700] leading-snug">{deal.title}{deal.category && <span className="ml-3 rounded-[3px] ba px-2 py-0.5 align-middle font-[family-name:var(--t-mono)] text-[11px] font-bold uppercase text-[var(--t-fg)]">{deal.category}</span>}</h3>
            {deal.role && <p className="font-[family-name:var(--t-mono)] text-[12px] uppercase tm">{deal.role}</p>}
            <p className="mt-2 max-w-[44rem] tm pretty">{deal.description}</p>
          </div>
          <span className={`fd text-[clamp(2rem,4.4cqw,3rem)] font-[800] leading-none tabular-nums @3xl:text-right ${narrow}`}>{deal.client}</span>
        </article>
      </Reveal>)}</ul>
    </section>}

    {has("experience") && <section className="bs px-5 py-20 text-[var(--t-bg)] @3xl:px-10">
      <h2 className={`fd text-[clamp(2.2rem,5cqw,3.4rem)] font-[800] uppercase leading-none ${narrow}`}>{label("experience", "The climb")}</h2>
      {/* Each role is a step higher than the last. */}
      <ol className="mt-10 grid items-end gap-3 @3xl:grid-flow-col @3xl:auto-cols-fr">{roles.map(({ role, index }, step) => <li key={index} className="flex flex-col justify-end" {...ed(`experience.${index}`)}>
        <div className="mb-3"><p className="font-[family-name:var(--t-mono)] text-[11px] uppercase opacity-70">{[role.start_date, role.end_date].filter(Boolean).join("–")}</p><p className="text-[1.1rem] font-[700] leading-tight">{role.job_title}</p><p className="text-[14px] opacity-75">{role.company}</p></div>
        <div className="rounded-t-[4px] ba @3xl:block" style={{ height: `${2.5 + step * 3.2}rem` }} aria-hidden />
        {role.description && <p className="mt-3 text-[14px] opacity-80 pretty">{role.description}</p>}
      </li>)}</ol>
    </section>}

    {(has("about") || has("skills")) && <section className="grid gap-12 px-5 py-20 @3xl:px-10 @4xl:grid-cols-2">
      {has("about") && <div><h2 className={`fd text-[2rem] font-[800] uppercase ${narrow}`}>{label("about", "How I sell")}</h2><div className="mt-5 space-y-4 text-[1.08rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div></div>}
      {has("skills") && <div><h2 className={`fd text-[2rem] font-[800] uppercase ${narrow}`}>{label("skills", "Playbook")}</h2><ul className="mt-5 flex flex-wrap gap-2" {...ed("skills")}>{(c.skills ?? []).map((skill) => <li key={skill} className="rounded-[3px] border-2 border-[var(--t-fg)] px-3 py-1 font-[family-name:var(--t-mono)] text-[13px] uppercase">{skill}</li>)}</ul>
        {has("education") && <ul className="mt-8 space-y-1 text-[15px]">{(c.education ?? []).map((item, index) => <li key={index} {...ed(`education.${index}`)}>{item.degree} · <span className="tm">{item.school}</span></li>)}</ul>}</div>}
    </section>}

    {has("testimonials") && <section className="grid gap-5 px-5 pb-20 @3xl:grid-cols-2 @3xl:px-10">{(c.testimonials ?? []).map((item, index) => <figure key={index} className="border-l-8 border-[var(--t-accent)] py-2 pl-6" {...ed(`testimonials.${index}`)}>
      <blockquote className="text-[1.3rem] font-[600] leading-snug">“{item.quote}”</blockquote>
      <figcaption className="mt-3 font-[family-name:var(--t-mono)] text-[12px] uppercase tm">{item.name} · {item.role}</figcaption>
    </figure>)}</section>}

    {has("contact") && <footer id="contact" className="ba px-5 py-16 text-[var(--t-fg)] @3xl:px-10">
      <h2 className={`fd text-[clamp(3rem,10cqw,7rem)] font-[800] uppercase leading-[0.85] ${narrow}`}>Let’s talk numbers.</h2>
      <div className="mt-8 flex flex-wrap gap-x-10 gap-y-3 text-[1.15rem] font-[700]">
        <a href={c.email ? `mailto:${c.email}` : "#"} className="break-all underline decoration-2 underline-offset-4" {...ed("email")}>{c.email}</a>
        {c.phone && <a href={tel(c.phone)} className="tabular-nums" {...ed("phone")}>{c.phone}</a>}
        {contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)}>{link.label} ↗</a>)}
      </div>
    </footer>}
  </StudioRoot>;
}

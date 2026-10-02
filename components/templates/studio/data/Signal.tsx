"use client";

import "@fontsource-variable/unbounded";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/space-grotesk";
import "@fontsource/space-mono/400.css";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, pad, paragraphs, useStudio, type StudioProps } from "../kit";

/** A deterministic sparkline path, rising overall. */
function spark(seed: number, width = 240, height = 56, points = 28) {
  let state = seed * 7919 + 13;
  const values = Array.from({ length: points }, (_, i) => { state = (state * 9301 + 49297) % 233280; return 0.25 + (i / points) * 0.6 + (state / 233280 - 0.5) * 0.3; });
  return values.map((v, i) => `${i ? "L" : "M"}${((i / (points - 1)) * width).toFixed(1)},${(height - v * height).toFixed(1)}`).join(" ");
}

export default function Signal({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const ticker = [...(c.stats ?? []).map((stat) => `${stat.label} ${stat.value}`), c.availability].filter(Boolean).join("   ◆   ");

  return <StudioRoot studio={studio} className="text-[15px] leading-relaxed">
    <div className="overflow-hidden border-b rule py-2" aria-hidden><div className="fm flex w-max gap-10 whitespace-nowrap text-[12px] uppercase tracking-[0.14em] [animation:studio-marquee_40s_linear_infinite]">{Array.from({ length: 6 }, (_, i) => <span key={i}><span className="ta">▲</span> {ticker}</span>)}</div></div>

    <header className="mx-auto max-w-[80rem] px-5 pb-10 pt-14 @3xl:px-10">
      <p className="fm text-[12px] uppercase tracking-[0.2em] tm"><span className="mr-2 inline-block size-2 animate-pulse rounded-full ba" />Live · {c.location}</p>
      <h1 className="fd mt-6 text-[clamp(2.4rem,8cqw,6.6rem)] font-[700] leading-[0.92] tracking-[-0.04em]" {...ed("name")}>{c.name}</h1>
      <p className="mt-4 text-[1.2rem] tm" {...ed("professional_title")}>{c.professional_title}</p>
      <p className="mt-6 max-w-[40rem] text-[1.4rem] leading-snug pretty" {...ed("tagline")}>{c.tagline}</p>
    </header>

    {has("stats") && <section className="mx-auto grid max-w-[80rem] gap-px bg-[var(--t-rule)] border-y rule @3xl:grid-cols-3">{(c.stats ?? []).map((stat, index) => <div key={index} className="bg-[var(--t-bg)] px-5 py-8 @3xl:px-10" {...ed(`stats.${index}`)}>
      <p className="fm text-[11px] uppercase tracking-[0.2em] tm">{pad(index + 1)} · {stat.label}</p>
      <p className="fd mt-4 text-[clamp(3rem,8cqw,5.5rem)] font-[700] leading-none tracking-[-0.05em] ta">{stat.value}</p>
      <svg viewBox="0 0 240 56" className="mt-6 h-14 w-full" preserveAspectRatio="none" aria-hidden><path d={spark(index + 3)} fill="none" stroke="var(--t-accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" /><path d={`${spark(index + 3)} L240,56 L0,56 Z`} fill="var(--t-accent)" opacity=".1" /></svg>
    </div>)}</section>}

    {has("about") && <section className="mx-auto grid max-w-[80rem] gap-8 px-5 py-20 @3xl:grid-cols-[16rem_1fr] @3xl:px-10">
      <h2 className="fm text-[12px] uppercase tracking-[0.2em] tm">{label("about", "Summary")}</h2>
      <div className="max-w-[46rem] space-y-4 text-[1.15rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
    </section>}

    {has("projects") && <section className="mx-auto max-w-[80rem] px-5 pb-20 @3xl:px-10">
      <h2 className="fm text-[12px] uppercase tracking-[0.2em] tm">{label("projects", "Results")}</h2>
      <div className="mt-8 grid gap-6 @4xl:grid-cols-3">{(c.projects ?? []).map((project, index) => <Reveal key={index} as="article" delay={index * 80} className="group flex flex-col overflow-hidden rounded-xl border rule bs">
        <div {...ed(`projects.${index}`)} className="flex flex-1 flex-col">
          <div className="relative overflow-hidden"><Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="aspect-[16/10] w-full opacity-80 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100" /><span className="fm absolute left-3 top-3 rounded bg-[var(--t-bg)] px-2 py-0.5 text-[11px] uppercase tracking-[0.14em]">{project.category}</span></div>
          <div className="flex flex-1 flex-col p-5"><p className="fm text-[12px] tm">{project.client} · {project.year}</p><h3 className="fd mt-2 text-[1.4rem] font-[700] leading-tight tracking-[-0.02em]">{project.title}</h3><p className="mt-3 flex-1 tm pretty">{project.description}</p>
            {!!project.technologies?.length && <p className="fm mt-4 text-[11px] uppercase tracking-[0.14em] ta">{project.technologies.join(" / ")}</p>}</div>
        </div>
      </Reveal>)}</div>
    </section>}

    {has("experience") && <section className="border-t rule"><div className="mx-auto max-w-[80rem] px-5 py-20 @3xl:px-10">
      <h2 className="fm text-[12px] uppercase tracking-[0.2em] tm">{label("experience", "Track record")}</h2>
      <ol className="mt-8">{(c.experience ?? []).map((role, index) => <li key={index} className="grid gap-3 border-t rule py-6 @3xl:grid-cols-[10rem_1fr_14rem] @3xl:gap-8" {...ed(`experience.${index}`)}>
        <span className="fm text-[13px] tm">{[role.start_date, role.end_date].filter(Boolean).join(" → ")}</span>
        <div><h3 className="text-[1.2rem] font-semibold">{role.job_title} · <span className="ta">{role.company}</span></h3><p className="mt-1 tm pretty">{role.description}</p></div>
        <svg viewBox="0 0 240 56" className="hidden h-12 w-full @3xl:block" preserveAspectRatio="none" aria-hidden><path d={spark(index + 11, 240, 56, 18)} fill="none" stroke="currentColor" strokeOpacity=".5" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>
      </li>)}</ol>
    </div></section>}

    {(has("skills") || has("testimonials")) && <section className="border-t rule"><div className="mx-auto grid max-w-[80rem] gap-12 px-5 py-20 @3xl:grid-cols-2 @3xl:px-10">
      {has("skills") && <div><h2 className="fm text-[12px] uppercase tracking-[0.2em] tm">{label("skills", "Toolkit")}</h2><ul className="mt-6 flex flex-wrap gap-2" {...ed("skills")}>{(c.skills ?? []).map((skill) => <li key={skill} className="fm rounded-full border rule px-3 py-1 text-[13px]">{skill}</li>)}</ul></div>}
      {has("testimonials") && <div>{(c.testimonials ?? []).map((item, index) => <figure key={index} className="mb-6" {...ed(`testimonials.${index}`)}><blockquote className="fd text-[1.4rem] font-[500] leading-snug tracking-[-0.01em]">“{item.quote}”</blockquote><figcaption className="fm mt-3 text-[12px] uppercase tracking-[0.14em] tm">{item.name} · {item.role}</figcaption></figure>)}</div>}
    </div></section>}

    {has("contact") && <footer className="border-t rule"><div className="mx-auto max-w-[80rem] px-5 py-20 @3xl:px-10">
      <p className="fm text-[12px] uppercase tracking-[0.2em] tm">Open a channel</p>
      <a href={c.email ? `mailto:${c.email}` : "#"} className="fd mt-4 block break-all text-[clamp(2rem,6cqw,4.6rem)] font-[700] leading-none tracking-[-0.04em] hover-a" {...ed("email")}>{c.email}</a>
      <p className="fm mt-8 flex flex-wrap gap-6 text-[12px] uppercase tracking-[0.16em]">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover-a">{link.label} ↗</a>)}</p>
    </div></footer>}
  </StudioRoot>;
}

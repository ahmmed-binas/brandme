"use client";

import "@fontsource-variable/big-shoulders-display";
import "@fontsource/anton/400.css";
import "@fontsource-variable/archivo";
import "@fontsource/space-mono/400.css";
import { Reveal, StudioRoot, contactLinks, ed, external, pad, paragraphs, useStudio, type StudioProps } from "../kit";

export default function TrainingLog({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const [first, ...rest] = (c.name ?? "").split(" ");

  return <StudioRoot studio={studio} className="text-[16px] leading-[1.55]">
    <header className="flex items-center justify-between px-5 py-4 @3xl:px-10"><span className="fd text-[1.6rem] font-[800] uppercase leading-none">{c.name}</span><a href="#join" className="fd ba px-4 py-2 text-[1.1rem] font-[800] uppercase text-[var(--t-bg)]">Start training</a></header>

    <section className="relative overflow-hidden px-5 pb-12 pt-8 @3xl:px-10">
      <p className="fm text-[12px] uppercase tracking-[0.2em] ta" {...ed("professional_title")}>{c.professional_title} · {c.location}</p>
      <h1 className="fd mt-3 text-[clamp(4.4rem,20cqw,16rem)] font-[900] uppercase leading-[0.78] tracking-[-0.01em]" {...ed("name")}>{first}<br /><span className="ta">{rest.join(" ")}</span></h1>
      <p className="fd mt-6 max-w-[34rem] text-[clamp(1.8rem,4cqw,2.8rem)] font-[700] uppercase leading-none" {...ed("tagline")}>{c.tagline}</p>
      <div aria-hidden className="pointer-events-none absolute -right-[6cqw] top-[10%] flex flex-col gap-3 opacity-20">{Array.from({ length: 6 }, (_, i) => <span key={i} className="block h-6 ba" style={{ width: `${18 + i * 6}cqw`, transform: "skewX(-20deg)" }} />)}</div>
    </section>

    {has("stats") && <section className="grid border-y-2 border-[var(--t-fg)] @3xl:grid-cols-3">{(c.stats ?? []).map((stat, index) => <div key={index} className="border-b-2 border-[var(--t-fg)] px-5 py-6 last:border-b-0 @3xl:border-b-0 @3xl:border-r-2 @3xl:px-10 @3xl:last:border-r-0" {...ed(`stats.${index}`)}><dd className="fd text-[clamp(3.4rem,8cqw,6rem)] font-[900] leading-none">{stat.value}</dd><dt className="fm mt-1 text-[12px] uppercase tracking-[0.16em] tm">{stat.label}</dt></div>)}</section>}

    {has("about") && <section className="grid gap-8 px-5 py-16 @3xl:grid-cols-[1fr_1.5fr] @3xl:px-10"><h2 className="fd text-[3rem] font-[900] uppercase leading-none">{label("about", "The coach")}</h2><div className="space-y-4 text-[1.15rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div></section>}

    {has("services") && <section id="join" className="px-5 py-16 @3xl:px-10">
      <h2 className="fd text-[3rem] font-[900] uppercase leading-none">{label("services", "Programmes")}</h2>
      <div className="mt-8 border-2 border-[var(--t-fg)] bs">{(c.services ?? []).map((service, index) => <Reveal key={index} delay={index * 80}><div className="grid items-center gap-4 border-b-2 border-dashed border-[var(--t-fg)] p-5 last:border-b-0 @3xl:grid-cols-[4rem_1fr_auto] @3xl:p-7" {...ed(`services.${index}`)}>
        <span className="fd text-[2.4rem] font-[900] leading-none ta">{pad(index + 1)}</span>
        <div><h3 className="fd text-[2rem] font-[800] uppercase leading-none">{service.title}</h3><p className="mt-1 tm">{service.description}</p></div>
        <div className="flex items-center gap-4 @3xl:flex-col @3xl:items-end"><span className="fd text-[1.8rem] font-[800] leading-none">{service.price}</span><a href={c.email ? `mailto:${c.email}?subject=${encodeURIComponent(service.title ?? "Training")}` : "#"} className="fm border-2 border-[var(--t-fg)] px-3 py-1 text-[12px] uppercase hover:bg-[var(--t-accent)] hover:text-[var(--t-bg)]">Sign up</a></div>
      </div></Reveal>)}</div>
    </section>}

    {has("testimonials") && <section className="ba px-5 py-16 text-[var(--t-bg)] @3xl:px-10">{(c.testimonials ?? []).map((item, index) => <figure key={index} className="max-w-[56rem]" {...ed(`testimonials.${index}`)}><blockquote className="fd text-[clamp(2.2rem,5.4cqw,4rem)] font-[800] uppercase leading-[0.95]">“{item.quote}”</blockquote><figcaption className="fm mt-4 text-[13px] uppercase">— {item.name}, {item.role}</figcaption></figure>)}</section>}

    <section className="grid gap-10 px-5 py-16 @3xl:grid-cols-2 @3xl:px-10">
      {has("highlights") && <div><h2 className="fd text-[2.4rem] font-[900] uppercase leading-none">{label("highlights", "Certifications")}</h2><ul className="mt-5 space-y-2">{(c.highlights ?? []).map((item, index) => <li key={index} className="flex justify-between gap-4 border-b-2 border-[var(--t-fg)] pb-2" {...ed(`highlights.${index}`)}><span className="font-semibold">{item.title}</span><span className="fm text-[13px] tm">{item.year}</span></li>)}</ul></div>}
      {has("experience") && <div><h2 className="fd text-[2.4rem] font-[900] uppercase leading-none">{label("experience", "Coaching history")}</h2><ul className="mt-5 space-y-2">{(c.experience ?? []).map((role, index) => <li key={index} className="flex justify-between gap-4 border-b-2 border-[var(--t-fg)] pb-2" {...ed(`experience.${index}`)}><span><b>{role.job_title}</b> · {role.company}</span><span className="fm shrink-0 text-[13px] tm">{[role.start_date, role.end_date].filter(Boolean).join("–")}</span></li>)}</ul></div>}
    </section>

    {has("contact") && <footer className="border-t-2 border-[var(--t-fg)] px-5 py-14 @3xl:px-10">
      <p className="fm text-[12px] uppercase tracking-[0.2em] ta" {...ed("availability")}>{c.availability}</p>
      <a href={c.email ? `mailto:${c.email}` : "#"} className="fd mt-2 block break-all text-[clamp(2.4rem,8cqw,6rem)] font-[900] uppercase leading-[0.85] hover-a" {...ed("email")}>{c.email}</a>
      <p className="fm mt-6 flex flex-wrap gap-5 text-[12px] uppercase">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover-a">{link.label} ↗</a>)}</p>
    </footer>}
  </StudioRoot>;
}

"use client";

import "@fontsource/anton/400.css";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/big-shoulders-display";
import "@fontsource-variable/archivo";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, pad, paragraphs, useStudio, type StudioProps } from "../kit";

export default function Campaign({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const words = (c.name ?? "").split(" ");

  return <StudioRoot studio={studio} className="text-[16px] leading-[1.5]">
    <header className="flex items-center justify-between px-5 py-4 text-[13px] font-semibold uppercase tracking-[0.08em] @3xl:px-8"><span>{c.name}</span><span className="hidden @2xl:inline tm">{c.professional_title}</span><a href="#brief" className="rounded-full bg-[var(--t-fg)] px-4 py-1.5 text-[var(--t-bg)]">Send a brief</a></header>

    <section className="relative overflow-hidden px-5 pb-10 @3xl:px-8">
      <div className="ba relative overflow-hidden rounded-[20px] px-6 pb-8 pt-10 text-[var(--t-surface)] @3xl:px-12 @3xl:pb-12">
        <h1 className="fd text-[clamp(4.4rem,19cqw,17rem)] uppercase leading-[0.8] tracking-[-0.01em]" {...ed("name")}>{words.map((word, index) => <span key={index} className="block">{word}</span>)}</h1>
        <div className="mt-8 grid gap-6 @3xl:grid-cols-[1fr_auto] @3xl:items-end">
          <p className="max-w-[30rem] text-[1.4rem] font-semibold leading-tight" {...ed("tagline")}>{c.tagline}</p>
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em]">{c.location}</p>
        </div>
      </div>
    </section>

    {has("stats") && <section className="overflow-hidden border-y-2 border-[var(--t-fg)]" aria-label="Results">
      <div className="flex w-max gap-14 py-5 [animation:studio-marquee_32s_linear_infinite]">{Array.from({ length: 4 }, (_, k) => (c.stats ?? []).map((stat, index) => <span key={`${k}-${index}`} className="flex items-baseline gap-3 whitespace-nowrap" {...(k === 0 ? ed(`stats.${index}`) : {})}><span className="fd text-[clamp(3rem,7cqw,5.5rem)] uppercase leading-none">{stat.value}</span><span className="text-[13px] font-semibold uppercase tracking-[0.1em] tm">{stat.label}</span><span className="text-[2rem] ta">✺</span></span>))}</div>
    </section>}

    {has("projects") && <section className="px-5 py-16 @3xl:px-8">
      <h2 className="fd text-[clamp(2.6rem,7cqw,5.5rem)] uppercase leading-none">{label("projects", "The work")}</h2>
      <div className="mt-10 grid gap-6 @3xl:grid-cols-2">{(c.projects ?? []).map((project, index) => <Reveal key={index} as="article" delay={(index % 2) * 120} className={`group ${index % 3 === 0 ? "@3xl:col-span-2 @3xl:grid @3xl:grid-cols-[1.3fr_1fr] @3xl:gap-8" : ""}`}>
        <div className="overflow-hidden rounded-[16px]" {...ed(`projects.${index}`)}><Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className={`w-full transition-transform duration-700 group-hover:scale-[1.04] ${project.image ? "h-auto" : "aspect-[4/5]"}`} /></div>
        <div className="mt-5 flex flex-col @3xl:mt-0 @3xl:justify-end">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] tm">{pad(index + 1)} — {project.client} · {project.year}</p>
          <h3 className="fd mt-2 text-[clamp(2rem,4.6cqw,3.6rem)] uppercase leading-[0.9]">{project.title}</h3>
          <p className="mt-3 max-w-[34rem] text-[1.05rem] pretty">{project.description}</p>
          {project.category && <p className="mt-4 inline-flex w-max rounded-full ba px-3 py-1 text-[12px] font-bold uppercase text-[var(--t-surface)]">{project.category}</p>}
        </div>
      </Reveal>)}</div>
    </section>}

    {has("about") && <section className="bg-[var(--t-surface)] px-5 py-20 text-[var(--t-bg)] @3xl:px-8">
      <div className="grid gap-10 @4xl:grid-cols-[1fr_1.3fr]">
        <h2 className="fd text-[clamp(2.6rem,7cqw,5.5rem)] uppercase leading-[0.9]">{label("about", "Who’s behind it")}</h2>
        <div className="space-y-5 text-[1.25rem] leading-snug">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
      </div>
    </section>}

    {has("testimonials") && <section className="px-5 py-20 @3xl:px-8">{(c.testimonials ?? []).map((item, index) => <figure key={index} className="mx-auto max-w-[60rem] text-center" {...ed(`testimonials.${index}`)}><blockquote className="fd text-[clamp(2.2rem,6cqw,4.6rem)] uppercase leading-[0.95]">“{item.quote}”</blockquote><figcaption className="mt-6 text-[14px] font-semibold uppercase tracking-[0.1em] tm">{item.name} — {item.role}</figcaption></figure>)}</section>}

    <section className="grid gap-12 border-t-2 border-[var(--t-fg)] px-5 py-16 @3xl:grid-cols-3 @3xl:px-8">
      {has("experience") && <div className="@3xl:col-span-1"><h2 className="text-[13px] font-bold uppercase tracking-[0.12em]">{label("experience", "Experience")}</h2><ul className="mt-4 space-y-4">{(c.experience ?? []).map((role, index) => <li key={index} {...ed(`experience.${index}`)}><p className="fd text-[1.8rem] uppercase leading-none">{role.company}</p><p className="text-[14px] tm">{role.job_title}, {[role.start_date, role.end_date].filter(Boolean).join("–")}</p></li>)}</ul></div>}
      {has("highlights") && <div><h2 className="text-[13px] font-bold uppercase tracking-[0.12em]">{label("highlights", "Awards")}</h2><ul className="mt-4 space-y-3">{(c.highlights ?? []).map((item, index) => <li key={index} className="flex gap-3" {...ed(`highlights.${index}`)}><span className="ta">✺</span><span><b>{item.title}</b> <span className="tm">{item.year}</span></span></li>)}</ul></div>}
      {has("services") && <div><h2 className="text-[13px] font-bold uppercase tracking-[0.12em]">{label("services", "Hire me for")}</h2><ul className="mt-4 space-y-3">{(c.services ?? []).map((item, index) => <li key={index} {...ed(`services.${index}`)}><b>{item.title}</b><p className="text-[14px] tm">{item.description}</p></li>)}</ul></div>}
    </section>

    {has("contact") && <footer id="brief" className="px-5 pb-8 @3xl:px-8"><div className="rounded-[20px] bg-[var(--t-fg)] px-6 py-14 text-[var(--t-bg)] @3xl:px-12">
      <p className="text-[13px] font-bold uppercase tracking-[0.12em] opacity-70">{c.availability ?? "Got a brief?"}</p>
      <a href={c.email ? `mailto:${c.email}` : "#"} className="fd mt-4 block break-all text-[clamp(2.4rem,8cqw,7rem)] uppercase leading-[0.85] hover:text-[var(--t-accent)]" {...ed("email")}>{c.email}</a>
      <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14px] font-semibold uppercase">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover:text-[var(--t-accent)]">{link.label} ↗</a>)}</p>
    </div></footer>}
  </StudioRoot>;
}

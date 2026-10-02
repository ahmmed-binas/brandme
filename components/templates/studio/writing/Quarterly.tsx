"use client";

import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource-variable/literata";
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/crimson-pro";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";

export default function Quarterly({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const contents = [
    ...(c.projects ?? []).map((item, index) => ({ title: item.title, kind: item.category, path: `projects.${index}`, anchor: `feature-${index}` })),
    ...(c.highlights ?? []).map((item, index) => ({ title: item.title, kind: item.detail, path: `highlights.${index}`, anchor: "notes" })),
  ];
  const quote = c.testimonials?.[0];

  return <StudioRoot studio={studio} className="text-[17px] leading-[1.7]">
    <section className="relative grid min-h-[92vh] grid-rows-[auto_1fr_auto] overflow-hidden ba px-6 py-6 text-[var(--t-bg)] @3xl:px-12">
      <div className="flex items-center justify-between text-[12px] uppercase tracking-[0.28em]"><span>The {c.name?.split(" ").at(-1)} Quarterly</span><span>Nº {new Date().getFullYear() % 100} · {["Winter", "Spring", "Summer", "Autumn"][Math.floor(new Date().getMonth() / 3)]}</span></div>
      <div className="grid place-items-center text-center">
        <div>
          <p className="fd text-[clamp(1.2rem,2.6cqw,1.8rem)] italic">featuring new work by</p>
          <h1 className="fd mt-2 text-[clamp(3.6rem,13cqw,11rem)] font-[400] leading-[0.86] tracking-[-0.03em]" {...ed("name")}>{c.name}</h1>
          <p className="fd mx-auto mt-6 max-w-[30rem] text-[1.35rem] italic opacity-90 balance" {...ed("tagline")}>{c.tagline}</p>
        </div>
      </div>
      <div className="flex justify-between text-[12px] uppercase tracking-[0.28em]"><span {...ed("professional_title")}>{c.professional_title}</span><span>{c.location}</span></div>
    </section>

    <section className="mx-auto grid max-w-[72rem] gap-12 px-6 py-24 @4xl:grid-cols-[1fr_1.3fr]">
      <h2 className="fd text-[clamp(3rem,7cqw,5.5rem)] font-[400] italic leading-none">Contents</h2>
      <ol className="text-[1.05rem]">{contents.map((item, index) => <li key={index} {...ed(item.path)}><a href={`#${item.anchor}`} className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-3 border-b rule py-3"><span className="fd text-[1.3rem] ta">{index + 1}</span><span><span className="fd text-[1.25rem] group-hover:italic">{item.title}</span>{item.kind && <span className="block text-[13px] uppercase tracking-[0.18em] tm">{item.kind}</span>}</span><span className="text-[13px] tm">p. {12 + index * 9}</span></a></li>)}</ol>
    </section>

    {has("about") && <article className="border-t rule px-6 py-24">
      <div className="mx-auto max-w-[38rem]">
        <p className="text-center text-[12px] uppercase tracking-[0.3em] ta">{label("about", "Editor’s letter")}</p>
        <div className="mt-10 space-y-5">{paragraphs(c).map(({ text, index }) => <p key={index} className={`pretty ${index === 0 ? "first-letter:fd first-letter:float-left first-letter:mr-3 first-letter:mt-2 first-letter:text-[5.2rem] first-letter:leading-[0.7] first-letter:text-[var(--t-accent)]" : ""}`} {...ed(`summary.${index}`)}>{text}</p>)}</div>
        {quote && <figure className="-mx-6 my-14 border-y-2 border-[var(--t-accent)] py-8 text-center @3xl:-mx-24" {...ed("testimonials.0")}><blockquote className="fd text-[clamp(1.6rem,3.6cqw,2.4rem)] italic leading-snug balance">“{quote.quote}”</blockquote><figcaption className="mt-4 text-[13px] uppercase tracking-[0.2em] tm">{quote.name} · {quote.role}</figcaption></figure>}
      </div>
    </article>}

    {has("projects") && <section className="border-t rule">{(c.projects ?? []).map((project, index) => <Reveal key={index} as="article" className={`grid items-center gap-10 border-b rule px-6 py-20 @4xl:grid-cols-2 @4xl:px-16 ${index % 2 ? "bs" : ""}`}>
      <div id={`feature-${index}`} className={index % 2 ? "@4xl:order-2" : ""} {...ed(`projects.${index}`)}><Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="mx-auto aspect-[2/3] w-[min(22rem,80%)] shadow-[0_30px_60px_-25px_rgba(0,0,0,.45)]" /></div>
      <div>
        <p className="text-[12px] uppercase tracking-[0.3em] ta">{project.category} · {project.year}</p>
        <h3 className="fd mt-3 text-[clamp(2.4rem,5cqw,4rem)] leading-[1] tracking-[-0.02em]">{project.title}</h3>
        {project.client && <p className="fd mt-2 italic tm">{project.client}</p>}
        <p className="mt-6 max-w-[30rem] pretty">{project.description}</p>
      </div>
    </Reveal>)}</section>}

    <section id="notes" className="mx-auto grid max-w-[72rem] gap-16 px-6 py-24 @4xl:grid-cols-2">
      {has("highlights") && <div><h2 className="fd text-[2.4rem] italic">{label("highlights", "Recent pieces")}</h2><ul className="mt-6 space-y-5">{(c.highlights ?? []).map((item, index) => <li key={index} {...ed(`highlights.${index}`)}><p className="fd text-[1.3rem] leading-snug">{item.url ? <a href={item.url} {...external(item.url)} className="underline decoration-[var(--t-rule-strong)] underline-offset-4 hover-a">{item.title}</a> : item.title}</p><p className="text-[13px] uppercase tracking-[0.16em] tm">{[item.detail, item.year].filter(Boolean).join(" · ")}</p></li>)}</ul></div>}
      {has("experience") && <div><h2 className="fd text-[2.4rem] italic">{label("experience", "Mastheads")}</h2><ul className="mt-6 space-y-5">{(c.experience ?? []).map((role, index) => <li key={index} {...ed(`experience.${index}`)}><p className="fd text-[1.3rem]">{role.company}</p><p className="text-[14px] tm">{role.job_title}, {[role.start_date, role.end_date].filter(Boolean).join("–")}</p></li>)}</ul></div>}
    </section>

    {has("contact") && <footer className="border-t rule px-6 py-20 text-center">
      <p className="text-[12px] uppercase tracking-[0.3em] tm">Colophon & correspondence</p>
      <a href={c.email ? `mailto:${c.email}` : "#"} className="fd mt-6 block text-[clamp(1.8rem,4.6cqw,3.4rem)] italic hover-a" {...ed("email")}>{c.email}</a>
      {c.availability && <p className="mt-3 tm" {...ed("availability")}>{c.availability}</p>}
      <p className="mt-8 flex flex-wrap justify-center gap-8 text-[13px] uppercase tracking-[0.2em]">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover-a">{link.label}</a>)}</p>
    </footer>}
  </StudioRoot>;
}

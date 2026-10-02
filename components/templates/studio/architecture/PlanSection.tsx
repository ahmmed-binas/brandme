"use client";

import "@fontsource/ibm-plex-sans/300.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource-variable/familjen-grotesk";
import "@fontsource/space-mono/400.css";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, pad, paragraphs, useStudio, type StudioProps } from "../kit";

const ScaleBar = () => <div aria-hidden className="flex items-end gap-0"><span className="h-2 w-8 bg-[var(--t-fg)]" /><span className="h-2 w-8 border border-[var(--t-fg)]" /><span className="h-2 w-8 bg-[var(--t-fg)]" /><span className="h-2 w-16 border border-[var(--t-fg)]" /><span className="fm ml-2 text-[10px]">0 1 2 5m</span></div>;
const North = () => <svg viewBox="0 0 40 40" className="size-9" aria-hidden><circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="1" /><path d="M20 5 L26 26 L20 21 L14 26Z" fill="currentColor" /></svg>;

export default function PlanSection({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const sheet = (n: number) => `A-${100 + n}`;

  return <StudioRoot studio={studio} className="text-[15px] leading-relaxed">
    <div className="m-3 border border-[var(--t-fg)] @3xl:m-5">
      <header className="grid grid-cols-2 border-b border-[var(--t-fg)] @3xl:grid-cols-[1fr_1fr_1fr_auto]">
        <span className="border-r border-[var(--t-fg)] px-4 py-3 font-semibold">{c.name}</span>
        <span className="hidden border-r border-[var(--t-fg)] px-4 py-3 tm @3xl:block">{c.professional_title}</span>
        <span className="hidden border-r border-[var(--t-fg)] px-4 py-3 tm @3xl:block">{c.location}</span>
        <a href="#contact" className="fm px-4 py-3 text-right text-[12px] uppercase tracking-[0.16em] hover-a">Contact</a>
      </header>

      <section className="grid @4xl:grid-cols-[1fr_22rem]">
        <div className="relative border-b border-[var(--t-fg)] p-6 @3xl:p-12 @4xl:border-b-0 @4xl:border-r">
          <p className="fm text-[11px] uppercase tracking-[0.24em] tm">Sheet {sheet(0)} · Cover</p>
          <h1 className="fd mt-8 text-[clamp(3rem,10cqw,8.5rem)] font-[300] leading-[0.88] tracking-[-0.04em]" {...ed("name")}>{c.name}</h1>
          <p className="mt-8 max-w-[34rem] text-[1.35rem] font-[300] leading-snug pretty" {...ed("tagline")}>{c.tagline}</p>
          <div className="mt-12 flex items-center gap-6"><North /><ScaleBar /></div>
        </div>
        <dl className="fm text-[12px]">
          {[["Practice", c.professional_title], ["Location", c.location], ["Status", c.availability], ["Contact", c.email]].filter(([, value]) => value).map(([key, value]) => <div key={key} className="border-b border-[var(--t-fg)] px-4 py-3"><dt className="text-[10px] uppercase tracking-[0.2em] tm">{key}</dt><dd className="mt-1">{value}</dd></div>)}
          <div className="grid grid-cols-2"><div className="border-r border-[var(--t-fg)] px-4 py-3"><dt className="text-[10px] uppercase tracking-[0.2em] tm">Scale</dt><dd className="mt-1">As shown</dd></div><div className="px-4 py-3"><dt className="text-[10px] uppercase tracking-[0.2em] tm">Sheet</dt><dd className="fd mt-1 text-[2rem] leading-none">{sheet(0)}</dd></div></div>
        </dl>
      </section>

      {has("about") && <section className="grid gap-6 border-t border-[var(--t-fg)] p-6 @3xl:grid-cols-[14rem_1fr] @3xl:p-12">
        <h2 className="fm text-[11px] uppercase tracking-[0.24em] tm">{label("about", "Practice notes")}</h2>
        <div className="max-w-[44rem] space-y-4 text-[1.1rem] font-[300]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
      </section>}

      {has("projects") && <section className="border-t border-[var(--t-fg)]">
        <h2 className="fm border-b border-[var(--t-fg)] px-6 py-3 text-[11px] uppercase tracking-[0.24em] tm @3xl:px-12">{label("projects", "Drawing register")}</h2>
        {(c.projects ?? []).map((project, index) => <Reveal key={index} as="article" className="grid border-b border-[var(--t-fg)] last:border-b-0 @4xl:grid-cols-[1fr_20rem]">
          <div className="border-b border-[var(--t-fg)] p-4 @3xl:p-8 @4xl:border-b-0 @4xl:border-r" {...ed(`projects.${index}`)}><Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="aspect-[16/10] w-full" /></div>
          <div className="flex flex-col">
            <div className="flex-1 p-6"><p className="fm text-[11px] uppercase tracking-[0.2em] ta">{project.category}</p><h3 className="fd mt-2 text-[2rem] font-[400] leading-none tracking-[-0.02em]">{project.title}</h3><p className="mt-4 text-[14px] pretty">{project.description}</p></div>
            <dl className="fm grid grid-cols-2 border-t border-[var(--t-fg)] text-[11px]">
              <div className="border-r border-[var(--t-fg)] px-4 py-2"><dt className="tm uppercase tracking-[0.16em]">Client</dt><dd>{project.client ?? "—"}</dd></div>
              <div className="px-4 py-2"><dt className="tm uppercase tracking-[0.16em]">Year</dt><dd>{project.year ?? "—"}</dd></div>
              <div className="border-r border-t border-[var(--t-fg)] px-4 py-2"><dt className="tm uppercase tracking-[0.16em]">Role</dt><dd>{project.role ?? "Architect"}</dd></div>
              <div className="border-t border-[var(--t-fg)] px-4 py-2"><dt className="tm uppercase tracking-[0.16em]">Sheet</dt><dd className="fd text-[1.3rem] leading-none">{sheet(index + 1)}</dd></div>
            </dl>
          </div>
        </Reveal>)}
      </section>}

      {has("services") && <section className="border-t border-[var(--t-fg)]"><h2 className="fm border-b border-[var(--t-fg)] px-6 py-3 text-[11px] uppercase tracking-[0.24em] tm @3xl:px-12">{label("services", "Scope of services")}</h2>
        <div className="grid @3xl:grid-cols-2">{(c.services ?? []).map((service, index) => <div key={index} className="border-b border-[var(--t-fg)] p-6 @3xl:border-r @3xl:p-10 @3xl:[&:nth-child(2n)]:border-r-0" {...ed(`services.${index}`)}><p className="fm text-[11px] tm">{pad(index + 1)}</p><h3 className="fd mt-2 text-[1.6rem]">{service.title}</h3><p className="mt-2 font-[300]">{service.description}</p>{service.price && <p className="fm mt-4 text-[12px] ta">{service.price}</p>}</div>)}</div></section>}

      <section className="grid border-t border-[var(--t-fg)] @4xl:grid-cols-2">
        {has("experience") && <div className="border-b border-[var(--t-fg)] p-6 @3xl:p-10 @4xl:border-b-0 @4xl:border-r"><h2 className="fm text-[11px] uppercase tracking-[0.24em] tm">{label("experience", "Practice history")}</h2>
          <table className="mt-4 w-full text-[14px]"><tbody>{(c.experience ?? []).map((role, index) => <tr key={index} className="border-b rule align-top" {...ed(`experience.${index}`)}><td className="fm w-28 py-2 text-[12px] tm">{[role.start_date, role.end_date].filter(Boolean).join("–")}</td><td className="py-2"><b className="font-semibold">{role.company}</b><br /><span className="tm">{role.job_title}</span></td></tr>)}</tbody></table></div>}
        <div className="p-6 @3xl:p-10">
          {has("highlights") && <><h2 className="fm text-[11px] uppercase tracking-[0.24em] tm">{label("highlights", "Awards & publications")}</h2><ul className="mt-4 space-y-2 text-[14px]">{(c.highlights ?? []).map((item, index) => <li key={index} className="flex gap-4" {...ed(`highlights.${index}`)}><span className="fm w-12 shrink-0 text-[12px] tm">{item.year}</span><span>{item.title}{item.detail && <span className="tm"> — {item.detail}</span>}</span></li>)}</ul></>}
          {has("testimonials") && (c.testimonials ?? []).slice(0, 1).map((item, index) => <figure key={index} className="mt-10 border-l-2 border-[var(--t-accent)] pl-5" {...ed(`testimonials.${index}`)}><blockquote className="text-[1.15rem] font-[300] italic">“{item.quote}”</blockquote><figcaption className="fm mt-2 text-[11px] uppercase tracking-[0.16em] tm">{item.name}, {item.role}</figcaption></figure>)}
        </div>
      </section>

      {has("contact") && <footer id="contact" className="grid border-t border-[var(--t-fg)] @3xl:grid-cols-[1fr_auto]">
        <div className="p-6 @3xl:p-12"><p className="fm text-[11px] uppercase tracking-[0.24em] tm">Issued for enquiry</p><a href={c.email ? `mailto:${c.email}` : "#"} className="fd mt-3 block break-all text-[clamp(1.8rem,5cqw,4rem)] font-[300] leading-none tracking-[-0.03em] hover-a" {...ed("email")}>{c.email}</a></div>
        <ul className="fm border-t border-[var(--t-fg)] text-[12px] uppercase tracking-[0.16em] @3xl:border-l @3xl:border-t-0">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <li key={link.url} className="border-b border-[var(--t-fg)] last:border-b-0"><a href={link.url} {...external(link.url)} className="block px-6 py-3 hover-a">{link.label} ↗</a></li>)}</ul>
      </footer>}
    </div>
  </StudioRoot>;
}

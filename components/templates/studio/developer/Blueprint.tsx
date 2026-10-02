"use client";

import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/space-mono/400.css";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, pad, paragraphs, useStudio, type StudioProps } from "../kit";

const grid = { backgroundImage: "linear-gradient(var(--t-rule) 1px, transparent 1px), linear-gradient(90deg, var(--t-rule) 1px, transparent 1px), linear-gradient(color-mix(in oklab,var(--t-fg) 7%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab,var(--t-fg) 7%,transparent) 1px, transparent 1px)", backgroundSize: "120px 120px, 120px 120px, 24px 24px, 24px 24px" };

/** A horizontal dimension line with arrowheads and a centred label. */
function Dimension({ text }: { text: string }) {
  return <div className="fm flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] tm" aria-hidden>
    <span className="h-3 w-px bg-current" /><span className="relative h-px flex-1 bg-current"><span className="absolute -left-px -top-[3px] border-y-[3.5px] border-r-[7px] border-y-transparent border-r-current" /></span>
    <span className="shrink-0">{text}</span>
    <span className="relative h-px flex-1 bg-current"><span className="absolute -right-px -top-[3px] border-y-[3.5px] border-l-[7px] border-y-transparent border-l-current" /></span><span className="h-3 w-px bg-current" />
  </div>;
}

const year = (value?: string) => { const match = value?.match(/\d{4}/); return match ? Number(match[0]) : value && /present|now|current/i.test(value) ? new Date().getFullYear() : undefined; };

export default function Blueprint({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const roles = c.experience ?? [];
  const spans = roles.map((role) => ({ role, from: year(role.start_date), to: year(role.end_date) ?? year(role.start_date) }));
  const known = spans.filter((item) => item.from);
  const min = Math.min(...known.map((item) => item.from!), new Date().getFullYear() - 1);
  const max = Math.max(...known.map((item) => item.to ?? item.from!), new Date().getFullYear());
  const years = max - min || 1;
  const sheet = (n: number) => `A-${pad(n, 3)}`;

  return <StudioRoot studio={studio} className="text-[15px] leading-relaxed">
    <div className="absolute inset-0 -z-10" style={grid} />
    <div className="mx-auto max-w-[76rem] px-5 @3xl:px-10">
      <header className="fm flex items-center justify-between border-b rule-strong py-4 text-[11px] uppercase tracking-[0.22em]"><span>{c.name} · drawing set</span><span className="hidden @2xl:inline tm">Rev. {new Date().getFullYear()} · Not for construction</span><a href="#contact" className="hover-a">Contact ↘</a></header>

      <section className="relative grid gap-10 py-16 @4xl:grid-cols-[1fr_20rem] @4xl:py-24">
        <div>
          <p className="fm text-[11px] uppercase tracking-[0.3em] tm">Sheet {sheet(1)} — General arrangement</p>
          <h1 className="fd mt-6 text-[clamp(2.6rem,8.4cqw,7rem)] font-semibold uppercase leading-[0.92] tracking-[-0.02em]" {...ed("name")}>{c.name}</h1>
          <div className="mt-4 max-w-[40rem]"><Dimension text={c.stats?.[0] ? `${c.stats[0].value} ${c.stats[0].label}` : c.professional_title ?? ""} /></div>
          <p className="mt-6 text-[1.25rem]" {...ed("professional_title")}>{c.professional_title}</p>
          {c.tagline && <p className="mt-3 max-w-[38rem] tm pretty" {...ed("tagline")}>{c.tagline}</p>}
        </div>
        <dl className="fm self-end border rule-strong text-[11px] uppercase tracking-[0.14em]">
          {[["Project", c.professional_title], ["Location", c.location], ["Status", c.availability], ["Drawn", c.name]].filter(([, value]) => value).map(([key, value]) => <div key={key} className="grid grid-cols-[6.5rem_1fr] border-b rule last:border-b-0"><dt className="border-r rule px-3 py-2 tm">{key}</dt><dd className="px-3 py-2 normal-case tracking-normal">{value}</dd></div>)}
          <div className="grid grid-cols-2"><span className="border-r rule px-3 py-3 tm">Sheet</span><span className="px-3 py-3 text-[1.6rem] tracking-normal">{sheet(1)}</span></div>
        </dl>
      </section>

      {has("about") && <section className="grid gap-8 border-t rule-strong py-16 @3xl:grid-cols-[14rem_1fr]">
        <h2 className="fm text-[11px] uppercase tracking-[0.3em] tm">01 · General notes</h2>
        <ol className="max-w-[44rem] space-y-4 text-[1.05rem]">{paragraphs(c).map(({ text, index }, position) => <li key={index} className="grid grid-cols-[2rem_1fr]" {...ed(`summary.${index}`)}><span className="fm tm">{position + 1}.</span><span className="pretty">{text}</span></li>)}</ol>
      </section>}

      {has("projects") && <section className="border-t rule-strong py-16">
        <h2 className="fm text-[11px] uppercase tracking-[0.3em] tm">02 · {label("projects", "Details")}</h2>
        <div className="mt-10 space-y-20">{(c.projects ?? []).map((project, index) => <Reveal key={index} as="article" className={`grid items-start gap-8 @4xl:grid-cols-12`}>
          <div className={`relative @4xl:col-span-7 ${index % 2 ? "@4xl:order-2" : ""}`} {...ed(`projects.${index}`)}>
            {["left-0 top-0 border-l border-t", "right-0 top-0 border-r border-t", "left-0 bottom-0 border-l border-b", "right-0 bottom-0 border-r border-b"].map((corner) => <span key={corner} className={`absolute size-5 rule-strong ${corner} -m-2`} />)}
            <Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="aspect-[16/10] w-full opacity-90 mix-blend-luminosity" />
            <span className="fm absolute -bottom-7 left-0 text-[11px] uppercase tracking-[0.2em] tm">Detail {pad(index + 1)} · scale 1:1</span>
          </div>
          <div className={`@4xl:col-span-5 ${index % 2 ? "@4xl:order-1" : ""}`}>
            <p className="fm flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] tm"><span className="grid size-8 place-items-center rounded-full border rule-strong text-[12px] tracking-normal">{pad(index + 1)}</span>{project.year} {project.client && `· ${project.client}`}</p>
            <h3 className="fd mt-4 text-[1.9rem] font-semibold uppercase leading-none tracking-tight">{project.title}</h3>
            <p className="mt-4 pretty">{project.description}</p>
            {!!project.technologies?.length && <ul className="fm mt-6 space-y-1.5 text-[12px] uppercase tracking-[0.12em]">{project.technologies.map((tech, k) => <li key={tech} className="flex items-center gap-3"><span className="w-10 border-t rule-strong" />{String.fromCharCode(65 + k)} — {tech}</li>)}</ul>}
            <p className="fm mt-6 flex gap-5 text-[12px] uppercase tracking-[0.16em]">{project.live_url && <a href={project.live_url} {...external(project.live_url)} className="underline hover-a">Live ↗</a>}{project.github && <a href={project.github} {...external(project.github)} className="underline hover-a">Source ↗</a>}</p>
          </div>
        </Reveal>)}</div>
      </section>}

      {has("experience") && <section className="border-t rule-strong py-16">
        <h2 className="fm text-[11px] uppercase tracking-[0.3em] tm">03 · {label("experience", "Elevation — career")}</h2>
        <div className="mt-10 overflow-x-auto">
          <div className="relative min-w-[40rem]">
            <div className="fm flex justify-between border-b rule-strong pb-2 text-[11px] tm">{Array.from({ length: years + 1 }, (_, i) => <span key={i}>{min + i}</span>)}</div>
            <div className="mt-4 space-y-3">{spans.map(({ role, from, to }, index) => from ? <div key={index} className="relative h-14" {...ed(`experience.${index}`)}>
              <div className="absolute inset-y-0 flex flex-col justify-center border-x border-y rule-strong bs px-3" style={{ left: `${((from - min) / years) * 100}%`, width: `${Math.max(((to! - from) / years) * 100, 8)}%` }}>
                <span className="truncate text-[13px] font-semibold">{role.job_title}</span><span className="fm truncate text-[11px] tm">{role.company}</span>
              </div>
            </div> : null)}</div>
          </div>
        </div>
        <ul className="mt-10 grid gap-6 @3xl:grid-cols-3">{roles.map((role, index) => <li key={index} className="border-t rule pt-4" {...ed(`experience.${index}`)}><p className="fm text-[11px] uppercase tracking-[0.16em] tm">{[role.start_date, role.end_date].filter(Boolean).join(" – ")}</p><p className="mt-1 font-semibold">{role.company}</p><p className="mt-2 text-[14px] tm pretty">{role.description}</p></li>)}</ul>
      </section>}

      <section className="grid gap-12 border-t rule-strong py-16 @4xl:grid-cols-2">
        {has("skills") && <div><h2 className="fm text-[11px] uppercase tracking-[0.3em] tm">04 · {label("skills", "Parts list")}</h2>
          <table className="fm mt-6 w-full border-collapse text-[12px] uppercase tracking-[0.1em]" {...ed("skills")}><thead><tr className="tm"><th className="border rule-strong px-3 py-2 text-left font-normal">Item</th><th className="border rule-strong px-3 py-2 text-left font-normal">Part</th><th className="border rule-strong px-3 py-2 text-right font-normal">Qty</th></tr></thead>
            <tbody>{(c.skills ?? []).map((skill, index) => <tr key={skill}><td className="border rule px-3 py-1.5 tm">{pad(index + 1)}</td><td className="border rule px-3 py-1.5 normal-case tracking-normal">{skill}</td><td className="border rule px-3 py-1.5 text-right">1</td></tr>)}</tbody></table></div>}
        {has("stats") && <div><h2 className="fm text-[11px] uppercase tracking-[0.3em] tm">05 · Key dimensions</h2>
          <div className="mt-6 space-y-8">{(c.stats ?? []).map((stat, index) => <div key={index} {...ed(`stats.${index}`)}><p className="fd text-[3.4rem] font-semibold leading-none tracking-tight">{stat.value}</p><div className="mt-2"><Dimension text={stat.label ?? ""} /></div></div>)}</div></div>}
      </section>

      {has("contact") && <footer id="contact" className="grid gap-8 border-t rule-strong py-16 @3xl:grid-cols-[1fr_auto]">
        <div><h2 className="fm text-[11px] uppercase tracking-[0.3em] tm">06 · Issue for discussion</h2>
          <a href={c.email ? `mailto:${c.email}` : "#"} className="fd mt-4 block break-all text-[clamp(1.8rem,5cqw,3.6rem)] font-semibold uppercase leading-none hover-a" {...ed("email")}>{c.email}</a></div>
        <ul className="fm self-end text-[12px] uppercase tracking-[0.16em]">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <li key={link.url} className="border-b rule py-2"><a href={link.url} {...external(link.url)} className="hover-a">{link.label} ↗</a></li>)}</ul>
      </footer>}
    </div>
  </StudioRoot>;
}

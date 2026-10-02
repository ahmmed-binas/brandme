"use client";

import "@fontsource-variable/eb-garamond";
import "@fontsource-variable/eb-garamond/wght-italic.css";
import "@fontsource-variable/inter-tight";
import { StudioRoot, contactLinks, ed, external, firstName, pad, paragraphs, useStudio, type StudioProps } from "../kit";
import { CountUp, Magnetic, useRotation, useSeen } from "../motion";

const tel = (phone?: string) => (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "#contact");
const small = "font-[family-name:var(--t-mono)] text-[11px] font-semibold uppercase tracking-[0.24em]";

/** A headline whose lines slide up out of a mask, one after another. */
function MaskedLines({ text, className = "" }: { text?: string; className?: string }) {
  const [ref, seen] = useSeen<HTMLSpanElement>("0px");
  // Break into lines of similar length so each can rise on its own.
  const words = (text ?? "").split(/\s+/).filter(Boolean);
  const budget = Math.max(12, Math.ceil(words.join(" ").length / Math.max(2, Math.round(words.join(" ").length / 22))));
  const lines: string[] = [];
  for (const word of words) { const last = lines[lines.length - 1]; if (last && `${last} ${word}`.length <= budget) lines[lines.length - 1] = `${last} ${word}`; else lines.push(word); }
  // Never leave one short word alone on the last line.
  if (lines.length > 1 && lines[lines.length - 1]!.length < budget / 3) lines.splice(-2, 2, `${lines[lines.length - 2]} ${lines[lines.length - 1]}`);
  return <span ref={ref} className={className}>{lines.map((line, index) => <span key={index} className="block overflow-hidden"><span className="block transition-transform duration-[1.1s] ease-[cubic-bezier(.7,0,.2,1)]" style={{ transform: seen ? "none" : "translateY(105%)", transitionDelay: `${150 + index * 140}ms` }}>{line}</span></span>)}</span>;
}

export default function Counsel({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const matters = c.projects ?? [];
  const outcomes = matters.map((item) => item.client).filter(Boolean) as string[];
  const since = [...(c.experience ?? [])].map((role) => Number.parseInt(role.start_date ?? "", 10)).filter(Number.isFinite).sort()[0];
  const quotes = c.testimonials ?? [];
  const rotation = useRotation(quotes.length, 8000);
  const [rule, ruleSeen] = useSeen<HTMLSpanElement>("0px");

  return <StudioRoot studio={studio} className="text-[17px] leading-[1.7]">
    <header className="flex items-center justify-between border-b rule px-5 py-5 @3xl:px-12">
      <span className={small}>{c.name}</span>
      <nav className={`flex items-center gap-8 ${small}`}><a href="#practice" className="hidden tm hover-a @2xl:inline">Practice</a><a href="#matters" className="hidden tm hover-a @2xl:inline">Matters</a><a href="#contact" className="hover-a">Contact</a></nav>
    </header>

    <section className="grid gap-10 px-5 pb-20 pt-16 @3xl:px-12 @3xl:pt-24 @5xl:grid-cols-[auto_1fr]">
      <div className="hidden @5xl:block"><span ref={rule} aria-hidden className="block w-px origin-top bg-[var(--t-fg)] transition-transform duration-[1.6s] ease-[cubic-bezier(.7,0,.2,1)]" style={{ height: "100%", transform: ruleSeen ? "scaleY(1)" : "scaleY(0)" }} /></div>
      <div>
        <p className={`${small} ta`} {...ed("professional_title")}>{c.professional_title}{since ? ` · Since ${since}` : ""}</p>
        <h1 className="fd mt-8 max-w-[24ch] text-[clamp(2.8rem,8.4cqw,7rem)] font-[420] leading-[0.98] tracking-[-0.02em]" {...ed("tagline")}><MaskedLines text={c.tagline} /></h1>
        <div className="mt-12 grid gap-8 border-t rule pt-8 @3xl:grid-cols-[1fr_auto] @3xl:items-end">
          <p className="max-w-[34rem] text-[1.1rem] tm" {...ed("name")}><b className="font-semibold text-[var(--t-fg)]">{c.name}</b>{c.location && ` · ${c.location}`}{c.availability && <span className="block" {...ed("availability")}>{c.availability}</span>}</p>
          <Magnetic><a href="#contact" className={`inline-flex items-center gap-3 border border-[var(--t-fg)] px-6 py-4 ${small} transition-colors hover:bg-[var(--t-fg)] hover:text-[var(--t-bg)]`}>Speak to {firstName(c.name)} <span aria-hidden>→</span></a></Magnetic>
        </div>
      </div>
    </section>

    {outcomes.length > 0 && <div aria-hidden className="overflow-hidden border-y border-[var(--t-fg)] bg-[var(--t-fg)] py-4 text-[var(--t-bg)]">
      <div className="flex w-max gap-12 [animation:studio-marquee_40s_linear_infinite]">{[...outcomes, ...outcomes, ...outcomes, ...outcomes].map((outcome, index) => <span key={index} className="fd flex items-center gap-12 whitespace-nowrap text-[1.6rem] italic">{outcome}<span className="text-[0.8rem] not-italic ta">◆</span></span>)}</div>
    </div>}

    {has("stats") && <section className="grid grid-cols-3 px-5 @3xl:px-12">{(c.stats ?? []).map((stat, index) => <div key={index} className={`py-12 ${index ? "border-l rule pl-4 @3xl:pl-10" : ""}`} {...ed(`stats.${index}`)}>
      <p className="fd text-[clamp(2.4rem,6.4cqw,5rem)] leading-none"><CountUp value={stat.value} /></p><p className={`mt-3 ${small} tm`}>{stat.label}</p>
    </div>)}</section>}

    {(has("about") || has("skills")) && <section id="practice" className="grid gap-14 border-t rule px-5 py-20 @3xl:px-12 @3xl:py-28 @4xl:grid-cols-2">
      {has("about") && <div><p className={`${small} tm`}>{label("about", "The practice")}</p><div className="mt-6 space-y-5 text-[1.15rem]">{paragraphs(c).map(({ text, index }, position) => <p key={index} className={`pretty ${position === 0 ? "fd text-[1.6rem] leading-snug" : ""}`} {...ed(`summary.${index}`)}>{text}</p>)}</div></div>}
      {has("skills") && <div><p className={`${small} tm`}>{label("skills", "Areas of practice")}</p>
        <ol className="mt-6" {...ed("skills")}>{(c.skills ?? []).map((skill, index) => <li key={skill} className="group flex items-baseline gap-5 border-b rule py-3.5 transition-[padding] duration-500 hover:pl-3"><span className={`${small} tm`}>{pad(index + 1)}</span><span className="fd text-[1.55rem] leading-tight transition-colors group-hover:text-[var(--t-accent)]">{skill}</span></li>)}</ol>
      </div>}
    </section>}

    {has("projects") && <section id="matters" className="border-t rule px-5 py-20 @3xl:px-12 @3xl:py-28">
      <p className={`${small} tm`}>{label("projects", "Selected matters")}</p>
      {/* Cards stick and stack as you scroll past them. */}
      <div className="mt-10">{matters.map((matter, index) => <article key={index} className="sticky mb-8 border border-[var(--t-fg)] bg-[var(--t-bg)] p-7 shadow-[0_-18px_40px_-30px_rgba(0,0,0,.45)] @3xl:p-10" style={{ top: `${1.5 + index * 1.25}rem` }} {...ed(`projects.${index}`)}>
        <div className="flex flex-wrap items-baseline justify-between gap-4"><p className={`${small} tm`}>{[matter.year, matter.category].filter(Boolean).join(" · ")}</p>{matter.client && <p className={`${small} ta`}>{matter.client}</p>}</div>
        <h3 className="fd mt-5 text-[clamp(1.8rem,4cqw,2.8rem)] leading-[1.08]">{matter.title}</h3>
        {matter.role && <p className="mt-2 italic tm">{matter.role}</p>}
        <p className="mt-4 max-w-[46rem] pretty">{matter.description}</p>
      </article>)}</div>
    </section>}

    {has("services") && <section className="bs px-5 py-20 @3xl:px-12 @3xl:py-28">
      <p className={`${small} tm`}>{label("services", "Fees")}</p>
      <ul className="mt-8 divide-y divide-[var(--t-rule)] border-y border-[var(--t-fg)]">{(c.services ?? []).map((service, index) => <li key={index} className="grid gap-2 py-6 @3xl:grid-cols-[1fr_1.4fr_auto] @3xl:gap-10" {...ed(`services.${index}`)}>
        <h3 className="fd text-[1.5rem] leading-tight">{service.title}</h3><p className="tm pretty">{service.description}</p><p className="fd whitespace-nowrap text-[1.3rem] @3xl:text-right">{service.price}</p>
      </li>)}</ul>
    </section>}

    {has("testimonials") && quotes.length > 0 && <section className="px-5 py-24 @3xl:px-12 @3xl:py-32" onPointerEnter={rotation.pause} onPointerLeave={rotation.resume}>
      <div className="grid max-w-[60rem]">{quotes.map((item, index) => <figure key={index} aria-hidden={index !== rotation.index} className={`col-start-1 row-start-1 transition-opacity duration-1000 ${index === rotation.index ? "opacity-100" : "pointer-events-none opacity-0"}`} {...ed(`testimonials.${index}`)}>
        <blockquote className="fd text-[clamp(2rem,5cqw,3.6rem)] italic leading-[1.1]">“{item.quote}”</blockquote>
        <figcaption className={`mt-8 ${small} tm`}>{item.name} — {item.role}</figcaption>
      </figure>)}</div>
      {quotes.length > 1 && <p className={`mt-10 ${small} tm`}>{pad(rotation.index + 1)} / {pad(quotes.length)}</p>}
    </section>}

    {(has("experience") || has("education") || has("highlights")) && <section className="grid gap-12 border-t rule px-5 py-20 @3xl:grid-cols-3 @3xl:px-12">
      {has("experience") && <div><p className={`${small} tm`}>{label("experience", "Career")}</p><ul className="mt-5 space-y-4">{(c.experience ?? []).map((role, index) => <li key={index} {...ed(`experience.${index}`)}><span className="fd block text-[1.3rem]">{role.job_title}</span><span className="text-[15px] tm">{role.company} · {[role.start_date, role.end_date].filter(Boolean).join("–")}</span></li>)}</ul></div>}
      {has("education") && <div><p className={`${small} tm`}>{label("education", "Admissions")}</p><ul className="mt-5 space-y-4">{(c.education ?? []).map((item, index) => <li key={index} {...ed(`education.${index}`)}><span className="fd block text-[1.3rem]">{item.degree}</span><span className="text-[15px] tm">{item.school}</span></li>)}</ul></div>}
      {has("highlights") && <div><p className={`${small} tm`}>{label("highlights", "Recognition")}</p><ul className="mt-5 space-y-4">{(c.highlights ?? []).map((item, index) => <li key={index} {...ed(`highlights.${index}`)}><span className="fd block text-[1.3rem]">{item.title}</span><span className="text-[15px] tm">{[item.detail, item.year].filter(Boolean).join(" · ")}</span></li>)}</ul></div>}
    </section>}

    {has("contact") && <footer id="contact" className="bg-[var(--t-fg)] px-5 py-24 text-[var(--t-bg)] @3xl:px-12 @3xl:py-32">
      <p className={`${small} opacity-60`}>Instructions & enquiries</p>
      <h2 className="fd mt-6 text-[clamp(2.8rem,8cqw,6.4rem)] font-[420] leading-[0.98] tracking-[-0.02em]"><MaskedLines text={`Speak to ${firstName(c.name)} in confidence.`} /></h2>
      <div className="mt-14 grid gap-6 border-t border-current/25 pt-8 @3xl:grid-cols-3">
        {c.phone && <a href={tel(c.phone)} className="fd text-[1.6rem] tabular-nums hover:opacity-70" {...ed("phone")}>{c.phone}</a>}
        <a href={c.email ? `mailto:${c.email}` : "#"} className="fd break-all text-[1.6rem] hover:opacity-70" {...ed("email")}>{c.email}</a>
        <p className={`flex flex-wrap gap-x-6 gap-y-2 ${small} opacity-70 @3xl:justify-end`}>{contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover:opacity-100">{link.label}</a>)}</p>
      </div>
    </footer>}
  </StudioRoot>;
}

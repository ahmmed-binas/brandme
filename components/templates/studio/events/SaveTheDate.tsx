"use client";

import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource-variable/hanken-grotesk";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, initials, paragraphs, useStudio, type StudioProps } from "../kit";

const tel = (phone?: string) => (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "#rsvp");

/** Torn, deckled paper edge: a fixed jittered polygon so it renders the same everywhere. */
const DECKLE = (() => {
  const points: string[] = [];
  let seed = 7;
  const jitter = () => { seed = (seed * 9301 + 49297) % 233280; return (seed / 233280) * 0.9; };
  for (let x = 0; x <= 100; x += 2) points.push(`${x}% ${jitter()}%`);
  for (let y = 0; y <= 100; y += 1.2) points.push(`${100 - jitter()}% ${y}%`);
  for (let x = 100; x >= 0; x -= 2) points.push(`${x}% ${100 - jitter()}%`);
  for (let y = 100; y >= 0; y -= 1.2) points.push(`${jitter()}% ${y}%`);
  return `polygon(${points.join(",")})`;
})();

/** A pressed wax seal with the planner's initials. */
function Seal({ text }: { text: string }) {
  return <div aria-hidden className="relative mx-auto -mt-12 grid size-24 place-items-center">
    <svg viewBox="0 0 100 100" className="absolute inset-0 drop-shadow-[0_6px_8px_rgba(0,0,0,.3)]"><path d="M50 3c7 0 9 5 15 6s11-2 15 3 1 10 4 15 9 7 9 13-6 8-7 14 3 11-1 16-10 3-15 6-6 10-13 10-9-5-15-6-11 2-15-3-1-10-4-15-9-7-9-13 6-8 7-14-3-11 1-16 10-3 15-6 6-10 13-10Z" fill="var(--t-accent)" /><circle cx="50" cy="50" r="31" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="1.5" /><circle cx="50" cy="50" r="40" fill="url(#sheen)" /><defs><radialGradient id="sheen" cx=".35" cy=".3" r=".7"><stop offset="0" stopColor="#fff" stopOpacity=".35" /><stop offset=".6" stopColor="#fff" stopOpacity="0" /></radialGradient></defs></svg>
    <span className="fd relative text-[1.9rem] italic leading-none text-[rgba(255,255,255,.88)] [text-shadow:0_-1px_0_rgba(0,0,0,.25)]">{text}</span>
  </div>;
}

const Small = ({ children, className = "" }: { children: React.ReactNode; className?: string }) =>
  <p className={`text-[11px] font-semibold uppercase tracking-[0.34em] tm ${className}`}>{children}</p>;

export default function SaveTheDate({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const enquire = c.email ? `mailto:${c.email}?subject=${encodeURIComponent("Our date")}` : "#rsvp";

  return <StudioRoot studio={studio} className="text-[16px] leading-[1.7]">
    <div className="bs px-4 pb-20 pt-10 @3xl:px-10 @3xl:pt-16">
      <article className="relative mx-auto max-w-[40rem] bg-[var(--t-bg)] px-8 py-16 text-center shadow-[0_40px_60px_-40px_rgba(0,0,0,.5)] @3xl:px-16 @3xl:py-20" style={{ clipPath: DECKLE }}>
        <Small>{c.location}</Small>
        <p className="fd mt-10 text-[1.3rem] italic tm">The pleasure of your company is requested by</p>
        <h1 className="fd mt-4 text-[clamp(3rem,9cqw,5.4rem)] font-[400] leading-[0.95]" {...ed("name")}>{c.name}</h1>
        <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.3em]" {...ed("professional_title")}>{c.professional_title}</p>
        <div aria-hidden className="mx-auto my-9 flex w-40 items-center gap-3"><span className="h-px flex-1 bg-[var(--t-rule-strong)]" /><span className="ta">✦</span><span className="h-px flex-1 bg-[var(--t-rule-strong)]" /></div>
        <p className="fd mx-auto max-w-[26rem] text-[1.75rem] italic leading-snug balance" {...ed("tagline")}>{c.tagline}</p>
        {c.availability && <p className="mt-10 text-[13px] font-semibold uppercase tracking-[0.2em] ta" {...ed("availability")}>{c.availability}</p>}
        <a href={enquire} className="mt-8 inline-block border border-[var(--t-fg)] px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.26em] transition-colors hover:bg-[var(--t-fg)] hover:text-[var(--t-bg)]">Enquire about your date</a>
      </article>
      <Seal text={initials(c.name)} />
      {has("stats") && <dl className="mx-auto mt-10 flex max-w-[40rem] justify-center gap-10 text-center">{(c.stats ?? []).map((stat, index) => <div key={index} {...ed(`stats.${index}`)}><dd className="fd text-[2.4rem] leading-none tabular-nums">{stat.value}</dd><dt className="mt-1 text-[11px] font-semibold uppercase tracking-[0.24em] tm">{stat.label}</dt></div>)}</dl>}
    </div>

    {has("projects") && <section className="px-5 py-24 @3xl:px-10">
      <Small className="text-center">{label("projects", "Celebrations")}</Small>
      <div className="mx-auto mt-14 grid max-w-[68rem] gap-16 @3xl:grid-cols-2">{(c.projects ?? []).map((event, index) => <Reveal key={index} delay={(index % 2) * 120}>
        <figure className={`${index % 2 ? "@3xl:mt-24 rotate-[1.4deg]" : "-rotate-[1.2deg]"} bg-[var(--t-bg)] p-3 pb-6 shadow-[0_24px_40px_-24px_rgba(0,0,0,.5)] ring-1 ring-[var(--t-rule)]`} {...ed(`projects.${index}`)}>
          {(event.image || embedded) && <Picture src={event.image} alt={event.title ?? ""} embedded={embedded} className="aspect-[4/3] w-full" />}
          <figcaption className="px-3 pt-5 text-center">
            <p className="fd text-[2.1rem] italic leading-none">{event.title}</p>
            <Small className="mt-3">{[event.year, event.role, event.client].filter(Boolean).join(" · ")}</Small>
            <p className="mx-auto mt-3 max-w-[26rem] text-[15px] tm pretty">{event.description}</p>
          </figcaption>
        </figure>
      </Reveal>)}</div>
    </section>}

    {has("services") && <section className="bs px-5 py-24 @3xl:px-10">
      <h2 className="fd text-center text-[clamp(2.4rem,5cqw,3.4rem)] italic leading-none">{label("services", "The details")}</h2>
      <div className="mx-auto mt-12 grid max-w-[68rem] gap-6 @3xl:grid-cols-3">{(c.services ?? []).map((service, index) => <div key={index} className="flex flex-col border border-[var(--t-rule-strong)] bg-[var(--t-bg)] p-8 text-center outline outline-1 outline-offset-[-8px] outline-[var(--t-rule)]" {...ed(`services.${index}`)}>
        <Small>{String(index + 1).padStart(2, "0")}</Small>
        <h3 className="fd mt-4 text-[1.8rem] leading-tight">{service.title}</h3>
        <p className="mt-3 flex-1 text-[15px] tm pretty">{service.description}</p>
        <p className="fd mt-6 text-[1.4rem] italic ta">{service.price}</p>
      </div>)}</div>
    </section>}

    {(has("about") || has("skills")) && <section className="mx-auto grid max-w-[68rem] gap-12 px-5 py-24 @4xl:grid-cols-[1fr_1.4fr]">
      <h2 className="fd text-[clamp(2.4rem,5cqw,3.4rem)] italic leading-none">{label("about", "A little about me")}</h2>
      <div>
        <div className="space-y-4 text-[1.06rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
        {has("skills") && <p className="mt-8 text-[12px] font-semibold uppercase leading-[2.1] tracking-[0.18em] tm" {...ed("skills")}>{(c.skills ?? []).join("  ·  ")}</p>}
      </div>
    </section>}

    {has("testimonials") && <section className="px-5 pb-24 @3xl:px-10"><div className="mx-auto grid max-w-[68rem] gap-8 @3xl:grid-cols-2">{(c.testimonials ?? []).map((item, index) => <figure key={index} className="bg-[var(--t-bg)] p-10 text-center shadow-[0_20px_40px_-30px_rgba(0,0,0,.5)] ring-1 ring-[var(--t-rule)]" {...ed(`testimonials.${index}`)}>
      <Small>Thank you</Small>
      <blockquote className="fd mt-5 text-[1.6rem] italic leading-snug">{item.quote}</blockquote>
      <figcaption className="mt-5 text-[14px] tm">— {item.name}, {item.role}</figcaption>
    </figure>)}</div></section>}

    {(has("highlights") || has("experience")) && <section className="mx-auto grid max-w-[68rem] gap-12 border-t rule px-5 py-16 @3xl:grid-cols-2">
      {has("highlights") && <div><Small>{label("highlights", "Press & memberships")}</Small><ul className="mt-5 space-y-3">{(c.highlights ?? []).map((item, index) => <li key={index} {...ed(`highlights.${index}`)}><span className="fd text-[1.3rem]">{item.title}</span>{(item.detail || item.year) && <span className="text-[14px] tm"> · {[item.detail, item.year].filter(Boolean).join(", ")}</span>}</li>)}</ul></div>}
      {has("experience") && <div><Small>{label("experience", "Experience")}</Small><ul className="mt-5 space-y-3">{(c.experience ?? []).map((role, index) => <li key={index} {...ed(`experience.${index}`)}><span className="fd text-[1.3rem]">{role.company}</span><span className="block text-[14px] tm">{role.job_title} · {[role.start_date, role.end_date].filter(Boolean).join("–")}</span></li>)}</ul></div>}
    </section>}

    {has("contact") && <footer id="rsvp" className="bs px-5 py-24 text-center">
      <div className="mx-auto max-w-[34rem] bg-[var(--t-bg)] px-8 py-14 ring-1 ring-[var(--t-rule-strong)]" style={{ clipPath: DECKLE }}>
        <h2 className="fd text-[3.2rem] italic leading-none">R.s.v.p.</h2>
        <p className="mt-4 tm">Kindly reply with your date, venue and guest count.</p>
        <a href={c.email ? `mailto:${c.email}` : "#"} className="fd mt-6 block break-all text-[1.6rem] hover-a" {...ed("email")}>{c.email}</a>
        {c.phone && <a href={tel(c.phone)} className="mt-1 block tabular-nums tm hover-a" {...ed("phone")}>{c.phone}</a>}
        <p className="mt-6 flex flex-wrap justify-center gap-x-6 text-[11px] font-semibold uppercase tracking-[0.28em]">{contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover-a">{link.label}</a>)}</p>
      </div>
    </footer>}
  </StudioRoot>;
}

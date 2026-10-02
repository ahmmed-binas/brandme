"use client";

import "@fontsource/libre-caslon-text/400.css";
import "@fontsource/libre-caslon-text/400-italic.css";
import "@fontsource-variable/crimson-pro";
import "@fontsource-variable/libre-franklin";
import "@fontsource/ibm-plex-mono/400.css";
import { StudioRoot, contactLinks, ed, external, pad, paragraphs, useStudio, type StudioProps } from "../kit";

export default function Ledger({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const ref = `${(c.name ?? "").split(" ").map((part) => part[0]).join("").toUpperCase()}-${new Date().getFullYear()}`;

  return <StudioRoot studio={studio} className="text-[16px] leading-[1.6] [font-variant-numeric:tabular-nums]">
    <div className="mx-auto max-w-[62rem] px-5 py-12 @3xl:py-16">
      <header className="grid gap-6 border-b-[3px] border-double border-[var(--t-fg)] pb-6 @3xl:grid-cols-[1fr_auto] @3xl:items-end">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] ta">Statement of practice</p>
          <h1 className="fd mt-3 text-[clamp(2.4rem,6cqw,4.2rem)] leading-[1.02]" {...ed("name")}>{c.name}</h1>
          <p className="fd mt-1 text-[1.2rem] italic tm" {...ed("professional_title")}>{c.professional_title}</p>
        </div>
        <dl className="fm grid grid-cols-[auto_auto] gap-x-6 gap-y-1 text-[12px]"><dt className="tm">Reference</dt><dd>{ref}</dd><dt className="tm">Office</dt><dd>{c.location}</dd><dt className="tm">Status</dt><dd>{c.availability ? "Accepting" : "—"}</dd></dl>
      </header>

      <p className="fd mt-10 max-w-[44rem] text-[1.6rem] leading-snug" {...ed("tagline")}>{c.tagline}</p>

      {has("stats") && <section className="mt-10 grid border-y border-[var(--t-fg)] @3xl:grid-cols-3">{(c.stats ?? []).map((stat, index) => <div key={index} className="border-b rule px-1 py-5 last:border-b-0 @3xl:border-b-0 @3xl:border-r @3xl:px-6 @3xl:first:pl-0 @3xl:last:border-r-0" {...ed(`stats.${index}`)}><dt className="text-[12px] uppercase tracking-[0.16em] tm">{stat.label}</dt><dd className="fd mt-2 text-[2.4rem] leading-none">{stat.value}</dd></div>)}</section>}

      {has("about") && <section className="mt-14 grid gap-6 @3xl:grid-cols-[12rem_1fr]"><h2 className="text-[12px] font-semibold uppercase tracking-[0.2em] tm">{label("about", "Summary")}</h2><div className="space-y-4">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div></section>}

      {has("services") && <section className="mt-14"><h2 className="text-[12px] font-semibold uppercase tracking-[0.2em] tm">{label("services", "Schedule of fees")}</h2>
        <table className="mt-4 w-full border-collapse"><thead><tr className="border-y-2 border-[var(--t-fg)] text-left text-[12px] uppercase tracking-[0.14em]"><th className="w-12 py-2 font-semibold">No.</th><th className="py-2 font-semibold">Service</th><th className="py-2 text-right font-semibold">Fee</th></tr></thead>
          <tbody>{(c.services ?? []).map((service, index) => <tr key={index} className="border-b rule align-top" {...ed(`services.${index}`)}><td className="fm py-4 text-[13px] tm">{pad(index + 1)}</td><td className="py-4 pr-6"><span className="fd text-[1.2rem]">{service.title}</span><span className="mt-0.5 block text-[14px] tm">{service.description}</span></td><td className="fm whitespace-nowrap py-4 text-right text-[14px]"><span className="border-b border-dotted rule-strong">{service.price ?? "On request"}</span></td></tr>)}</tbody></table>
        <p className="mt-3 text-right text-[12px] italic tm">All fees exclusive of VAT. Engagements begin with a free introductory call.</p></section>}

      {has("projects") && <section className="mt-14"><h2 className="text-[12px] font-semibold uppercase tracking-[0.2em] tm">{label("projects", "Selected engagements")}</h2>
        <ol className="mt-4 border-t-2 border-[var(--t-fg)]">{(c.projects ?? []).map((project, index) => <li key={index} className="grid gap-2 border-b rule py-5 @3xl:grid-cols-[3rem_1fr_10rem]" {...ed(`projects.${index}`)}><span className="fm text-[13px] tm">{pad(index + 1)}</span><div><p className="fd text-[1.3rem]">{project.title}</p><p className="text-[14px] tm pretty">{project.description}</p></div><p className="text-[14px] @3xl:text-right"><span className="block">{project.client}</span><span className="tm">{project.year}</span></p></li>)}</ol></section>}

      {has("testimonials") && <section className="mt-14 grid gap-6 @3xl:grid-cols-2">{(c.testimonials ?? []).map((item, index) => <figure key={index} className="border-l-2 border-[var(--t-accent)] pl-5" {...ed(`testimonials.${index}`)}><blockquote className="fd text-[1.2rem] italic leading-snug">“{item.quote}”</blockquote><figcaption className="mt-2 text-[13px] tm">{item.name}, {item.role}</figcaption></figure>)}</section>}

      <section className="mt-14 grid gap-12 @3xl:grid-cols-2">
        {has("experience") && <div><h2 className="text-[12px] font-semibold uppercase tracking-[0.2em] tm">{label("experience", "Appointments")}</h2><ul className="mt-4">{(c.experience ?? []).map((role, index) => <li key={index} className="flex justify-between gap-4 border-b rule py-2.5" {...ed(`experience.${index}`)}><span>{role.job_title}, <i>{role.company}</i></span><span className="fm shrink-0 text-[12px] tm">{[role.start_date, role.end_date].filter(Boolean).join("–")}</span></li>)}</ul></div>}
        {has("highlights") && <div><h2 className="text-[12px] font-semibold uppercase tracking-[0.2em] tm">{label("highlights", "Qualifications")}</h2><ul className="mt-4">{(c.highlights ?? []).map((item, index) => <li key={index} className="flex justify-between gap-4 border-b rule py-2.5" {...ed(`highlights.${index}`)}><span>{item.title}</span><span className="fm text-[12px] tm">{item.year}</span></li>)}</ul></div>}
      </section>

      {has("contact") && <footer className="mt-16 grid gap-8 border-t-[3px] border-double border-[var(--t-fg)] pt-8 @3xl:grid-cols-[1fr_auto]">
        <div><p className="text-[12px] font-semibold uppercase tracking-[0.2em] tm">Correspondence</p><a href={c.email ? `mailto:${c.email}` : "#"} className="fd mt-2 block text-[1.8rem] hover-a" {...ed("email")}>{c.email}</a><p className="mt-2 flex flex-wrap gap-5 text-[14px]">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="underline">{link.label}</a>)}</p></div>
        <div className="self-end text-right"><p className="fd text-[2rem] italic leading-none">{c.name}</p><p className="mt-1 border-t border-[var(--t-fg)] pt-1 text-[11px] uppercase tracking-[0.2em] tm">Signed</p></div>
      </footer>}
    </div>
  </StudioRoot>;
}

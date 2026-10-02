"use client";

import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-sans/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/600.css";
import { Picture, StudioRoot, contactLinks, ed, external, initials, pad, paragraphs, useStudio, type StudioProps } from "../kit";

const mono = "font-[family-name:var(--t-mono)]";

const Head = ({ children }: { children: React.ReactNode }) =>
  <h2 className="mb-4 flex items-center gap-3 border-b-2 border-[var(--t-fg)] pb-1 text-[13px] font-bold uppercase tracking-[0.12em]"><span aria-hidden className="size-2.5 ba" />{children}</h2>;

/** A dual-in-line package: career on the left pins, credentials on the right. */
function Pinout({ left, right, name }: { left: Array<{ label: string; sub?: string; path: string }>; right: Array<{ label: string; sub?: string; path: string }>; name: string }) {
  const rows = Math.max(left.length, right.length, 3);
  return <div className="overflow-x-auto"><div className="mx-auto grid min-w-[36rem] max-w-[52rem] grid-cols-[1fr_8rem_1fr] items-stretch">
    <ol className="flex flex-col justify-around py-4">{Array.from({ length: rows }, (_, index) => { const pin = left[index]; return <li key={index} className="flex h-14 items-center justify-end gap-2 text-right" {...(pin ? ed(pin.path) : {})}>
      {pin && <span className="leading-tight"><b className="block text-[14px] font-semibold">{pin.label}</b><span className={`${mono} text-[11px] tm`}>{pin.sub}</span></span>}
      <span className={`${mono} w-5 text-[11px] tm`}>{index + 1}</span><span aria-hidden className="h-2.5 w-7 border border-[var(--t-fg)] bg-[var(--t-surface)]" />
    </li>; })}</ol>
    <div className="relative rounded-[6px] bg-[var(--t-fg)] text-[var(--t-bg)]">
      <span aria-hidden className="absolute left-1/2 top-0 h-4 w-8 -translate-x-1/2 rounded-b-full bg-[var(--t-bg)]" />
      <span aria-hidden className="absolute left-3 top-6 size-2.5 rounded-full border border-current opacity-60" />
      <p className={`${mono} absolute inset-0 grid place-items-center text-center text-[13px] font-semibold uppercase tracking-[0.2em] [writing-mode:vertical-rl]`}>{name}</p>
    </div>
    <ol className="flex flex-col justify-around py-4">{Array.from({ length: rows }, (_, index) => { const pin = right[index]; return <li key={index} className="flex h-14 items-center gap-2" {...(pin ? ed(pin.path) : {})}>
      <span aria-hidden className="h-2.5 w-7 border border-[var(--t-fg)] bg-[var(--t-surface)]" /><span className={`${mono} w-6 text-[11px] tm`}>{rows * 2 - index}</span>
      {pin && <span className="leading-tight"><b className="block text-[14px] font-semibold">{pin.label}</b><span className={`${mono} text-[11px] tm`}>{pin.sub}</span></span>}
    </li>; })}</ol>
  </div></div>;
}

export default function Datasheet({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const projects = c.projects ?? [];
  const lead = projects.find((item) => item.image);
  const part = `${initials(c.name) || "EN"}-${pad((c.experience ?? []).length * 7 + (c.skills ?? []).length, 3)}`;
  const year = String(new Date().getFullYear());
  const figures = projects.map((item, index) => ({ item, index })).filter(({ item }) => item.image && item !== lead);

  return <StudioRoot studio={studio} className="text-[15.5px] leading-[1.6]">
    <div className="mx-auto max-w-[72rem] px-5 py-8 @3xl:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b-4 border-[var(--t-fg)] pb-3">
        <div className="flex items-center gap-3"><span className="grid size-11 place-items-center ba text-[15px] font-bold text-[var(--t-bg)]">{initials(c.name)}</span><span className={`${mono} text-[12px] uppercase leading-tight tm`}>{c.location}<br />{c.professional_title}</span></div>
        <div className={`${mono} text-right text-[12px] uppercase`}><b className="block text-[1.4rem] font-semibold tracking-[0.04em] text-[var(--t-fg)]">{part}</b><span className="tm" suppressHydrationWarning>Datasheet · Rev. {year}</span></div>
      </header>

      <section className="py-8">
        <h1 className="text-[clamp(2.4rem,6cqw,4.4rem)] font-bold leading-[1] tracking-[-0.02em]" {...ed("name")}>{c.name}</h1>
        <p className="mt-3 max-w-[44rem] text-[1.3rem] leading-snug" {...ed("tagline")}>{c.tagline}</p>
        {c.availability && <p className={`${mono} mt-4 inline-block border border-[var(--t-accent)] px-2 py-0.5 text-[12px] uppercase ta`} {...ed("availability")}>Status: {c.availability}</p>}
      </section>

      <div className="grid gap-10 @4xl:grid-cols-2">
        {has("skills") && <section><Head>{label("skills", "Features")}</Head><ul className="grid gap-1.5 @2xl:grid-cols-2" {...ed("skills")}>{(c.skills ?? []).map((skill) => <li key={skill} className="flex gap-2"><span aria-hidden className="mt-[0.55em] size-1.5 shrink-0 bg-[var(--t-fg)]" />{skill}</li>)}</ul></section>}
        {lead && <section><Head>Typical application</Head><figure {...ed(`projects.${projects.indexOf(lead)}`)}><Picture src={lead.image} alt={lead.title ?? ""} embedded={embedded} className="aspect-[16/10] w-full border border-[var(--t-fg)] bg-white" /><figcaption className={`${mono} mt-2 text-[12px] tm`}>Figure 1. {lead.title}{lead.client && `, ${lead.client}`}</figcaption></figure></section>}
      </div>

      {has("about") && <section className="mt-12"><Head>{label("about", "Description")}</Head><div className="max-w-[48rem] space-y-3 @5xl:columns-2 @5xl:max-w-none @5xl:gap-10">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div></section>}

      {has("stats") && <section className="mt-12"><Head>{label("stats", "Absolute maximum ratings")}</Head>
        <table className="w-full max-w-[40rem] border-collapse text-left text-[15px]"><thead className={`${mono} text-[11px] uppercase tm`}><tr className="border-b border-[var(--t-fg)]"><th className="py-1.5 font-normal">Parameter</th><th className="py-1.5 text-right font-normal">Rating</th></tr></thead>
          <tbody>{(c.stats ?? []).map((stat, index) => <tr key={index} className="border-b rule" {...ed(`stats.${index}`)}><td className="py-2 first-letter:uppercase">{stat.label}</td><td className={`${mono} py-2 text-right font-semibold tabular-nums`}>{stat.value}</td></tr>)}</tbody></table>
      </section>}

      {has("projects") && <section className="mt-12"><Head>{label("projects", "Project characteristics")}</Head>
        <div className="overflow-x-auto"><table className="w-full min-w-[42rem] border-collapse text-left text-[14.5px]"><thead className={`${mono} bs text-[11px] uppercase`}><tr><th className="px-3 py-2 font-semibold">Ref.</th><th className="px-3 py-2 font-semibold">Project</th><th className="px-3 py-2 font-semibold">Client</th><th className="px-3 py-2 font-semibold">Role</th><th className="px-3 py-2 text-right font-semibold">Year</th></tr></thead>
          <tbody>{projects.map((item, index) => <tr key={index} className="border-b rule align-top" {...ed(`projects.${index}`)}><td className={`${mono} px-3 py-2.5 ta`}>P{index + 1}</td><td className="px-3 py-2.5"><b className="font-semibold">{item.title}</b><span className="block text-[14px] tm pretty">{item.description}</span></td><td className="px-3 py-2.5">{item.client}</td><td className="px-3 py-2.5">{item.role}</td><td className={`${mono} px-3 py-2.5 text-right`}>{item.year}</td></tr>)}</tbody></table></div>
        {figures.length > 0 && <div className="mt-8 grid gap-6 @3xl:grid-cols-2">{figures.map(({ item, index }, position) => <figure key={index} {...ed(`projects.${index}`)}><Picture src={item.image} alt={item.title ?? ""} embedded={embedded} className="aspect-[16/10] w-full border border-[var(--t-fg)] bg-white" /><figcaption className={`${mono} mt-2 text-[12px] tm`}>Figure {position + (lead ? 2 : 1)}. {item.title} (P{index + 1})</figcaption></figure>)}</div>}
      </section>}

      {(has("experience") || has("education")) && <section className="mt-12"><Head>{label("experience", "Pin configuration")}</Head>
        <Pinout name={c.name ?? ""}
          left={has("experience") ? (c.experience ?? []).map((role, index) => ({ label: `${role.job_title}, ${role.company}`, sub: [role.start_date, role.end_date].filter(Boolean).join("–"), path: `experience.${index}` })) : []}
          right={has("education") ? (c.education ?? []).map((item, index) => ({ label: item.degree ?? "", sub: [item.school, item.end_date].filter(Boolean).join(" · "), path: `education.${index}` })) : []} />
        <p className={`${mono} mt-3 text-center text-[11px] uppercase tm`}>Left: appointments · Right: qualifications</p>
      </section>}

      {(has("highlights") || has("testimonials")) && <section className="mt-12 grid gap-10 @4xl:grid-cols-2">
        {has("highlights") && <div><Head>{label("highlights", "Application notes")}</Head><ul className="space-y-2">{(c.highlights ?? []).map((item, index) => <li key={index} className="flex gap-3" {...ed(`highlights.${index}`)}><span className={`${mono} shrink-0 text-[12px] ta`}>AN-{pad(index + 1)}</span><span>{item.url ? <a href={item.url} {...external(item.url)} className="underline underline-offset-4 hover-a">{item.title}</a> : item.title}<span className="tm">{[item.detail, item.year].filter(Boolean).map((part) => ` · ${part}`).join("")}</span></span></li>)}</ul></div>}
        {has("testimonials") && <div><Head>{label("testimonials", "Field reports")}</Head><div className="space-y-5">{(c.testimonials ?? []).map((item, index) => <figure key={index} {...ed(`testimonials.${index}`)}><blockquote className="text-[1.08rem]">“{item.quote}”</blockquote><figcaption className={`${mono} mt-1 text-[12px] uppercase tm`}>{item.name}, {item.role}</figcaption></figure>)}</div></div>}
      </section>}

      {has("contact") && <footer className="mt-12"><Head>Ordering information</Head>
        <table className="w-full max-w-[44rem] border-collapse text-left text-[15px]"><tbody>
          <tr className="border-b rule"><th className={`${mono} w-36 py-2 text-[12px] font-normal uppercase tm`}>Email</th><td className="py-2"><a href={c.email ? `mailto:${c.email}` : "#"} className="break-all font-semibold hover-a" {...ed("email")}>{c.email}</a></td></tr>
          {c.phone && <tr className="border-b rule"><th className={`${mono} py-2 text-[12px] font-normal uppercase tm`}>Phone</th><td className="py-2"><a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="hover-a" {...ed("phone")}>{c.phone}</a></td></tr>}
          {contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <tr key={link.url} className="border-b rule"><th className={`${mono} py-2 text-[12px] font-normal uppercase tm`}>{link.label}</th><td className="py-2"><a href={link.url} {...external(link.url)} className="hover-a">{link.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</a></td></tr>)}
        </tbody></table>
        <p className={`${mono} mt-10 flex justify-between border-t-4 border-[var(--t-fg)] pt-2 text-[11px] uppercase tm`}><span>{part}</span><span>Page 1 of 1</span></p>
      </footer>}
    </div>
  </StudioRoot>;
}

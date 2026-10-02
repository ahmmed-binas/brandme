"use client";

import "@fontsource-variable/big-shoulders-display";
import "@fontsource-variable/archivo";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, pad, paragraphs, useStudio, type StudioProps } from "../kit";

const tel = (phone?: string) => (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "#contact");

/** Black-and-accent hazard tape. */
const Hazard = ({ className = "" }: { className?: string }) =>
  <div aria-hidden className={`h-4 w-full [background:repeating-linear-gradient(-45deg,var(--t-accent)_0_18px,var(--t-fg)_18px_36px)] ${className}`} />;

const Label = ({ children }: { children: React.ReactNode }) =>
  <h2 className="fd text-[clamp(2rem,4.6cqw,3.2rem)] font-[800] uppercase leading-none tracking-[0.01em]">{children}</h2>;

export default function SiteBoard({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const quote = c.email ? `mailto:${c.email}?subject=${encodeURIComponent("Quote request")}` : "#contact";
  // "Electrician · Gallagher Electrical" → the trade on the board, the firm in the header.
  const titleParts = (c.professional_title ?? "").split(/\s+[·|–]\s+/);
  const company = titleParts.length > 1 ? titleParts[titleParts.length - 1] : c.name;
  const trade = titleParts.length > 1 ? titleParts.slice(0, -1).join(" · ") : c.professional_title;
  const credentials = [...(c.highlights ?? []).map((item, index) => ({ text: item.title, sub: item.year, path: `highlights.${index}` })), ...(c.education ?? []).map((item, index) => ({ text: item.degree, sub: item.school, path: `education.${index}` }))];

  return <StudioRoot studio={studio} className="text-[16px] leading-relaxed">
    <Hazard />
    <header className="flex items-center justify-between gap-4 px-5 py-4 @3xl:px-10">
      <span className="fd text-[1.6rem] font-[800] uppercase leading-none tracking-[0.02em]">{company}</span>
      <a href={tel(c.phone)} className="fd rounded-[4px] ba px-4 py-2 text-[1.3rem] font-[800] uppercase leading-none tabular-nums text-[var(--t-fg)]" {...ed("phone")}>{c.phone || "Call us"}</a>
    </header>

    {/* The hoarding: a dark board with the trade in giant letters. */}
    <section className="px-5 pb-10 @3xl:px-10">
      <div className="relative overflow-hidden rounded-[6px] bs text-[var(--t-bg)]">
        <div className="grid gap-10 p-6 @3xl:p-12 @5xl:grid-cols-[1.5fr_1fr]">
          <div>
            {c.availability && <p className="inline-flex items-center gap-2 rounded-[3px] ba px-3 py-1 text-[13px] font-bold uppercase tracking-[0.12em] text-[var(--t-fg)]" {...ed("availability")}><span className="size-2 animate-pulse rounded-full bg-[var(--t-fg)]" />{c.availability}</p>}
            <h1 className="fd mt-6 text-[clamp(3.4rem,11cqw,8.6rem)] font-[900] uppercase leading-[0.82] tracking-[-0.01em]" {...ed("name")}>{c.name}</h1>
            <p className="fd mt-3 text-[clamp(1.6rem,4cqw,2.6rem)] font-[700] uppercase leading-none ta" {...ed("professional_title")}>{trade}</p>
            <p className="mt-6 max-w-[34rem] text-[1.2rem] leading-snug opacity-90" {...ed("tagline")}>{c.tagline}</p>
          </div>
          <div className="flex flex-col justify-end gap-4">
            {c.location && <p className="border-l-4 border-[var(--t-accent)] pl-4 text-[15px] uppercase tracking-[0.08em]" {...ed("location")}><span className="block text-[12px] opacity-60">Covering</span><b className="font-bold">{c.location}</b></p>}
            {c.phone && <a href={tel(c.phone)} className="group block rounded-[4px] ba p-5 text-[var(--t-fg)] transition-transform hover:-translate-y-0.5"><span className="block text-[12px] font-bold uppercase tracking-[0.16em]">Call or text</span><span className="fd block text-[clamp(2rem,5cqw,3rem)] font-[900] leading-none tabular-nums">{c.phone}</span></a>}
            <a href={quote} className="block rounded-[4px] border-2 border-current px-5 py-3 text-center font-bold uppercase tracking-[0.1em] transition-colors hover:bg-[var(--t-bg)] hover:text-[var(--t-fg)]">Get a free quote</a>
          </div>
        </div>
      </div>
    </section>

    {(credentials.length > 0 || has("stats")) && <section className="px-5 pb-12 @3xl:px-10">
      {has("stats") && <dl className="grid grid-cols-3 border-y-4 border-[var(--t-fg)]">{(c.stats ?? []).map((stat, index) => <div key={index} className={`py-5 ${index ? "border-l-2 border-[var(--t-fg)] pl-4 @3xl:pl-8" : ""}`} {...ed(`stats.${index}`)}><dd className="fd text-[clamp(2.2rem,6cqw,4.4rem)] font-[900] leading-none tabular-nums">{stat.value}</dd><dt className="mt-1 text-[13px] font-semibold uppercase tracking-[0.08em] tm">{stat.label}</dt></div>)}</dl>}
      {credentials.length > 0 && <ul className="mt-8 flex flex-wrap gap-3">{credentials.map((item) => <li key={item.path} className="rounded-[3px] border-2 border-[var(--t-fg)] px-3 py-2 text-[13px] font-bold uppercase leading-tight tracking-[0.06em]" {...ed(item.path)}>{item.text}{item.sub && <span className="block text-[11px] font-semibold normal-case tracking-normal tm">{item.sub}</span>}</li>)}</ul>}
    </section>}

    {has("services") && <><Hazard /><section className="px-5 py-16 @3xl:px-10">
      <Label>{label("services", "Prices")}</Label>
      <ul className="mt-8 max-w-[60rem]">{(c.services ?? []).map((service, index) => <li key={index} className="border-b-2 border-dashed border-[var(--t-rule-strong)] py-5" {...ed(`services.${index}`)}>
        <div className="flex items-baseline gap-3"><h3 className="text-[1.2rem] font-bold uppercase tracking-[0.02em]">{service.title}</h3><span aria-hidden className="flex-1 translate-y-[-4px] border-b-2 border-dotted border-[var(--t-rule-strong)]" /><span className="fd shrink-0 rounded-[3px] ba px-2.5 py-0.5 text-[1.35rem] font-[800] uppercase leading-tight text-[var(--t-fg)]">{service.price}</span></div>
        <p className="mt-1 max-w-[44rem] tm pretty">{service.description}</p>
      </li>)}</ul>
    </section></>}

    {has("projects") && <section className="bs px-5 py-16 text-[var(--t-bg)] @3xl:px-10">
      <Label>{label("projects", "Recent jobs")}</Label>
      <div className="mt-8 grid gap-6 @3xl:grid-cols-2 @6xl:grid-cols-3">{(c.projects ?? []).map((job, index) => <Reveal key={index} delay={(index % 3) * 70}>
        <article className="h-full overflow-hidden rounded-[4px] bg-[color-mix(in_oklab,var(--t-bg)_8%,transparent)]" {...ed(`projects.${index}`)}>
          <div className="relative"><Picture src={job.image} alt={job.title ?? ""} embedded={embedded} className="aspect-[16/10] w-full" /><span className="fd absolute left-0 top-0 ba px-3 py-1 text-[1.1rem] font-[800] text-[var(--t-fg)]">JOB {pad(index + 1, 3)}</span></div>
          <div className="p-5">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] ta">{[job.category, job.client, job.year].filter(Boolean).join(" · ")}</p>
            <h3 className="mt-1 text-[1.2rem] font-bold leading-snug">{job.title}</h3>
            {job.role && <p className="text-[14px] opacity-70">{job.role}</p>}
            <p className="mt-2 text-[15px] opacity-85 pretty">{job.description}</p>
          </div>
        </article>
      </Reveal>)}</div>
    </section>}

    {(has("about") || has("skills")) && <section className="grid gap-12 px-5 py-16 @3xl:px-10 @4xl:grid-cols-2">
      {has("about") && <div><Label>{label("about", "About us")}</Label><div className="mt-6 space-y-4 text-[1.08rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div></div>}
      {has("skills") && <div><Label>{label("skills", "What we do")}</Label><ul className="mt-6 grid gap-x-8 @2xl:grid-cols-2" {...ed("skills")}>{(c.skills ?? []).map((skill) => <li key={skill} className="flex items-center gap-3 border-b-2 border-[var(--t-fg)] py-3 font-semibold uppercase tracking-[0.03em]"><span aria-hidden className="size-3 shrink-0 ba" />{skill}</li>)}</ul></div>}
    </section>}

    {has("testimonials") && <section className="px-5 pb-16 @3xl:px-10"><div className="grid gap-5 @3xl:grid-cols-2">{(c.testimonials ?? []).map((item, index) => <figure key={index} className="rounded-[4px] border-2 border-[var(--t-fg)] p-6" {...ed(`testimonials.${index}`)}>
      <p aria-label="Five stars" className="text-[1.3rem] tracking-[0.15em] ta [text-shadow:0_0_0_var(--t-fg)]">★★★★★</p>
      <blockquote className="mt-2 text-[1.12rem] leading-snug">“{item.quote}”</blockquote>
      <figcaption className="mt-4 text-[13px] font-bold uppercase tracking-[0.08em] tm">{item.name} · {item.role}</figcaption>
    </figure>)}</div></section>}

    {has("experience") && <section className="px-5 pb-16 @3xl:px-10"><ul className="flex flex-wrap gap-x-10 gap-y-2 text-[15px]">{(c.experience ?? []).map((role, index) => <li key={index} {...ed(`experience.${index}`)}><b className="font-bold">{role.job_title}</b>, {role.company} <span className="tm">{[role.start_date, role.end_date].filter(Boolean).join("–")}</span></li>)}</ul></section>}

    {has("contact") && <footer id="contact" className="ba text-[var(--t-fg)]">
      <Hazard className="[background:repeating-linear-gradient(-45deg,var(--t-fg)_0_18px,transparent_18px_36px)]" />
      <div className="grid gap-8 px-5 py-14 @3xl:px-10 @4xl:grid-cols-[1.4fr_1fr]">
        <div><p className="text-[13px] font-bold uppercase tracking-[0.16em]">Call or message</p><a href={tel(c.phone)} className="fd mt-2 block text-[clamp(3rem,10cqw,7rem)] font-[900] leading-[0.9] tabular-nums">{c.phone || "Call us"}</a></div>
        <div className="space-y-2 self-end text-[1.1rem] font-semibold">
          <a href={c.email ? `mailto:${c.email}` : "#"} className="block break-all underline decoration-2 underline-offset-4" {...ed("email")}>{c.email}</a>
          <p className="flex flex-wrap gap-x-5 text-[15px]">{contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="underline-offset-4 hover:underline">{link.label} →</a>)}</p>
        </div>
      </div>
    </footer>}
  </StudioRoot>;
}

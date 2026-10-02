"use client";

import "@fontsource-variable/familjen-grotesk";
import "@fontsource-variable/literata";
import "@fontsource-variable/literata/wght-italic.css";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, firstName, paragraphs, useStudio, type StudioProps } from "../kit";

/** One hundred dots, the share filled in: “94 of every 100”. */
function DotShare({ percent }: { percent: number }) {
  const filled = Math.round(Math.max(0, Math.min(100, percent)));
  return <div aria-hidden className="grid w-full max-w-[16rem] grid-cols-10 gap-1.5">{Array.from({ length: 100 }, (_, index) => <span key={index} className={`aspect-square rounded-full ${index < filled ? "ba" : "bg-[color-mix(in_oklab,var(--t-fg)_14%,transparent)]"}`} style={{ transitionDelay: `${index * 8}ms` }} />)}</div>;
}

const Kicker = ({ children }: { children: React.ReactNode }) =>
  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] ta">{children}</p>;

export default function FieldReport({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const cover = c.cover || c.gallery?.[0]?.image || (c.projects ?? []).find((item) => item.image)?.image;
  const stats = c.stats ?? [];
  const shareIndex = stats.findIndex((stat) => /%\s*$/.test(stat.value ?? ""));
  const share = shareIndex >= 0 ? stats[shareIndex] : undefined;

  return <StudioRoot studio={studio} className="text-[16.5px] leading-[1.65]">
    <section className="relative isolate min-h-[34rem] overflow-hidden text-white">
      <Picture src={cover} alt="" embedded={embedded} className="absolute inset-0 -z-10 size-full" edit={c.cover ? "cover" : undefined} />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
      <div className="flex min-h-[34rem] flex-col justify-between px-5 py-6 @3xl:px-10 @3xl:py-10">
        <div className="flex justify-between text-[12px] font-semibold uppercase tracking-[0.2em]"><span>Field report</span><span {...ed("location")}>{c.location}</span></div>
        <div className="max-w-[46rem]">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] opacity-85" {...ed("professional_title")}>{c.professional_title}</p>
          <h1 className="fd mt-3 text-[clamp(2.8rem,7.4cqw,5.6rem)] font-[600] leading-[0.95] tracking-[-0.025em]" {...ed("name")}>{c.name}</h1>
          <p className="mt-5 max-w-[34rem] font-[family-name:var(--t-text)] text-[1.35rem] italic leading-snug opacity-95" {...ed("tagline")}>{c.tagline}</p>
        </div>
      </div>
    </section>

    {has("stats") && <section className="border-b rule px-5 py-16 @3xl:px-10">
      <Kicker>{label("stats", "At a glance")}</Kicker>
      <div className={`mt-8 grid gap-12 ${share ? "@4xl:grid-cols-[1fr_auto]" : ""}`}>
        <dl className="grid gap-8 @3xl:grid-cols-3">{stats.map((stat, index) => <div key={index} className="border-t-2 border-[var(--t-fg)] pt-4" {...ed(`stats.${index}`)}><dd className="fd text-[clamp(2.8rem,6cqw,4.6rem)] font-[600] leading-none tracking-[-0.03em] tabular-nums">{stat.value}</dd><dt className="mt-2 text-[15px] tm">{stat.label}</dt></div>)}</dl>
        {share && <figure className="self-end" {...ed(`stats.${shareIndex}`)}><DotShare percent={Number.parseFloat(share.value ?? "0")} /><figcaption className="mt-3 max-w-[16rem] text-[13px] tm">{Number.parseFloat(share.value ?? "0")} of every 100 · {share.label}</figcaption></figure>}
      </div>
    </section>}

    {has("about") && <section className="grid gap-10 px-5 py-20 @3xl:px-10 @4xl:grid-cols-[1fr_2fr]">
      <div><Kicker>{label("about", `A letter from ${firstName(c.name)}`)}</Kicker></div>
      <div className="max-w-[40rem]">
        <div className="space-y-5 text-[1.12rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
        <p className="fd mt-8 text-[1.8rem] italic">{firstName(c.name)}</p>
        {c.availability && <p className="mt-6 inline-block border-l-4 border-[var(--t-accent)] pl-3 text-[15px]" {...ed("availability")}>{c.availability}</p>}
      </div>
    </section>}

    {has("projects") && <section className="bs px-5 py-20 @3xl:px-10">
      <Kicker>{label("projects", "Programmes")}</Kicker>
      <div className="mt-10 space-y-16">{(c.projects ?? []).map((item, index) => <Reveal key={index}>
        <article className={`grid items-center gap-8 ${item.image ? "@4xl:grid-cols-2" : ""}`} {...ed(`projects.${index}`)}>
          {item.image && <Picture src={item.image} alt={item.title ?? ""} embedded={embedded} className={`aspect-[3/2] w-full ${index % 2 ? "@4xl:order-2" : ""}`} />}
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] tm">{[item.category, item.year, item.role].filter(Boolean).join(" · ")}</p>
            <h3 className="fd mt-2 text-[clamp(1.8rem,3.6cqw,2.5rem)] font-[600] leading-[1.05] tracking-[-0.02em]">{item.title}</h3>
            <p className="mt-4 max-w-[34rem] pretty">{item.description}</p>
            {item.client && <p className="mt-6 inline-flex items-baseline gap-3 border-t-2 border-[var(--t-accent)] pt-3"><span className="text-[12px] font-semibold uppercase tracking-[0.16em] tm">Outcome</span><span className="fd text-[1.5rem] font-[600] ta">{item.client}</span></p>}
          </div>
        </article>
      </Reveal>)}</div>
    </section>}

    {has("testimonials") && <section className="px-5 py-20 @3xl:px-10">
      <Kicker>{label("testimonials", "Voices")}</Kicker>
      <div className="mt-8 grid gap-10 @3xl:grid-cols-2">{(c.testimonials ?? []).map((item, index) => <figure key={index} {...ed(`testimonials.${index}`)}><blockquote className="text-[1.4rem] italic leading-snug">“{item.quote}”</blockquote><figcaption className="mt-4 text-[14px] font-semibold">{item.name}<span className="block font-normal tm">{item.role}</span></figcaption></figure>)}</div>
    </section>}

    {(has("experience") || has("education") || has("skills")) && <section className="grid gap-12 border-t rule px-5 py-16 @3xl:px-10 @4xl:grid-cols-3">
      {has("experience") && <div className="@4xl:col-span-2"><Kicker>{label("experience", "Career")}</Kicker><ul className="mt-6 space-y-5">{(c.experience ?? []).map((role, index) => <li key={index} className="grid gap-1 @3xl:grid-cols-[8rem_1fr] @3xl:gap-6" {...ed(`experience.${index}`)}><span className="text-[14px] tabular-nums tm">{[role.start_date, role.end_date].filter(Boolean).join("–")}</span><span><b className="fd font-[600]">{role.job_title}</b>, {role.company}{role.description && <span className="block text-[15px] tm">{role.description}</span>}</span></li>)}</ul></div>}
      <div className="space-y-10">
        {has("education") && <div><Kicker>{label("education", "Education")}</Kicker><ul className="mt-4 space-y-2 text-[15px]">{(c.education ?? []).map((item, index) => <li key={index} {...ed(`education.${index}`)}>{item.degree}<span className="block tm">{item.school}</span></li>)}</ul></div>}
        {has("skills") && <div><Kicker>{label("skills", "Strengths")}</Kicker><p className="mt-4 text-[15px]" {...ed("skills")}>{(c.skills ?? []).join(" · ")}</p></div>}
      </div>
    </section>}

    {has("highlights") && <section className="border-t rule px-5 py-16 @3xl:px-10"><Kicker>{label("highlights", "Reports & speaking")}</Kicker>
      <ul className="mt-6 grid gap-4 @3xl:grid-cols-2">{(c.highlights ?? []).map((item, index) => <li key={index} className="border-l-2 border-[var(--t-rule-strong)] pl-4" {...ed(`highlights.${index}`)}>{item.url ? <a href={item.url} {...external(item.url)} className="fd font-[600] underline underline-offset-4 hover-a">{item.title}</a> : <b className="fd font-[600]">{item.title}</b>}<span className="block text-[14px] tm">{[item.detail, item.year].filter(Boolean).join(" · ")}</span></li>)}</ul>
    </section>}

    {has("contact") && <footer className="ba px-5 py-16 text-[var(--t-bg)] @3xl:px-10">
      <h2 className="fd max-w-[40rem] text-[clamp(2.2rem,5cqw,3.6rem)] font-[600] leading-[1.02] tracking-[-0.02em]">Partner, fund or just ask a question.</h2>
      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-[1.1rem]">
        <a href={c.email ? `mailto:${c.email}` : "#"} className="break-all font-semibold underline decoration-2 underline-offset-4" {...ed("email")}>{c.email}</a>
        {c.phone && <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="tabular-nums" {...ed("phone")}>{c.phone}</a>}
        {contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="opacity-85 hover:opacity-100">{link.label} ↗</a>)}
      </div>
    </footer>}
  </StudioRoot>;
}

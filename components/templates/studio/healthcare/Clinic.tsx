"use client";

import "@fontsource-variable/literata";
import "@fontsource-variable/literata/wght-italic.css";
import "@fontsource-variable/public-sans";
import { Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";

const tel = (phone?: string) => (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "#contact");

/** One heartbeat across the page, drawn once when the page opens. */
function Trace() {
  const beat = (x: number) => `L${x} 60 L${x + 14} 60 L${x + 22} 46 L${x + 30} 60 L${x + 38} 60 L${x + 44} 72 L${x + 52} 8 L${x + 60} 92 L${x + 68} 60 L${x + 84} 60 L${x + 96} 50 L${x + 110} 60`;
  const d = `M0 60 ${[120, 420, 720, 1020].map(beat).join(" ")} L1200 60`;
  return <svg aria-hidden viewBox="0 0 1200 100" preserveAspectRatio="none" className="block h-16 w-full @3xl:h-20">
    <path d={d} fill="none" stroke="var(--t-accent)" strokeWidth="2.2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="[stroke-dasharray:2600] [stroke-dashoffset:2600] [animation:clinic-trace_2.6s_cubic-bezier(.5,0,.2,1)_.3s_forwards] motion-reduce:[stroke-dashoffset:0]" />
    <style>{"@keyframes clinic-trace{to{stroke-dashoffset:0}}"}</style>
  </svg>;
}

export default function Clinic({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const book = c.email ? `mailto:${c.email}?subject=${encodeURIComponent("Appointment request")}` : "#contact";
  const accepting = c.availability && !/not|closed|full/i.test(c.availability);

  return <StudioRoot studio={studio} className="text-[16.5px] leading-[1.7]">
    <header className="mx-auto flex max-w-[74rem] items-center justify-between gap-4 px-5 py-5 @3xl:px-8">
      <span className="fd text-[1.15rem] font-semibold">{c.name}</span>
      <nav className="flex items-center gap-5 text-[14px] font-medium"><a href="#fees" className="hidden tm hover-a @2xl:inline">Appointments & fees</a><a href="#training" className="hidden tm hover-a @2xl:inline">Training</a>
        <a href={book} className="rounded-[8px] ba px-4 py-2 font-semibold text-[var(--t-bg)]">Book</a></nav>
    </header>

    <section className="mx-auto grid max-w-[74rem] gap-12 px-5 pb-6 pt-10 @3xl:px-8 @4xl:grid-cols-[1.5fr_1fr] @4xl:pt-16">
      <div>
        {c.availability && <p className="inline-flex items-center gap-2 rounded-full border rule px-3 py-1 text-[13px] font-medium" {...ed("availability")}><span className={`size-2 rounded-full ${accepting ? "bg-[#22a06b]" : "bg-[#d97706]"}`} />{c.availability}</p>}
        <h1 className="fd mt-6 text-[clamp(2.6rem,6.4cqw,4.6rem)] font-[500] leading-[1.02] tracking-[-0.02em]" {...ed("name")}>{c.name}</h1>
        <p className="mt-2 text-[1.2rem] ta" {...ed("professional_title")}>{c.professional_title}</p>
        <p className="fd mt-6 max-w-[34rem] text-[1.45rem] leading-snug balance" {...ed("tagline")}>{c.tagline}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={book} className="rounded-[10px] ba px-6 py-3 font-semibold text-[var(--t-bg)] transition-transform hover:-translate-y-0.5">Request an appointment</a>
          {c.phone && <a href={tel(c.phone)} className="rounded-[10px] border border-[var(--t-fg)] px-6 py-3 font-semibold tabular-nums" {...ed("phone")}>Call {c.phone}</a>}
        </div>
      </div>
      <aside className="self-end rounded-[14px] bs p-6 text-[15px]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] tm">The practice</p>
        <dl className="mt-4 grid grid-cols-[6.5rem_1fr] gap-y-3">
          {c.location && <><dt className="tm">Where</dt><dd {...ed("location")}>{c.location}</dd></>}
          {(c.services ?? [])[0] && <><dt className="tm">From</dt><dd {...ed("services.0")}>{c.services![0]!.price} · {c.services![0]!.title}</dd></>}
          {c.phone && <><dt className="tm">Phone</dt><dd><a href={tel(c.phone)} className="tabular-nums hover-a">{c.phone}</a></dd></>}
          {c.email && <><dt className="tm">Email</dt><dd className="break-all"><a href={`mailto:${c.email}`} className="hover-a">{c.email}</a></dd></>}
        </dl>
      </aside>
    </section>

    <Trace />

    {has("stats") && <dl className="mx-auto grid max-w-[74rem] grid-cols-3 gap-4 px-5 pt-4 @3xl:px-8">{(c.stats ?? []).map((stat, index) => <div key={index} {...ed(`stats.${index}`)}><dd className="fd text-[clamp(1.8rem,4cqw,2.6rem)] leading-none tabular-nums">{stat.value}</dd><dt className="mt-1 text-[14px] tm">{stat.label}</dt></div>)}</dl>}

    {(has("about") || has("skills")) && <section className="mx-auto grid max-w-[74rem] gap-12 px-5 py-20 @3xl:px-8 @4xl:grid-cols-[1.5fr_1fr]">
      {has("about") && <div><h2 className="fd text-[2rem]">{label("about", "How I work")}</h2><div className="mt-5 max-w-[38rem] space-y-4">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div></div>}
      {has("skills") && <div><h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] tm">{label("skills", "Clinical interests")}</h2><ul className="mt-5 space-y-2" {...ed("skills")}>{(c.skills ?? []).map((skill) => <li key={skill} className="flex gap-3 border-b rule pb-2"><svg aria-hidden viewBox="0 0 16 16" className="mt-[0.45em] size-3.5 shrink-0"><path d="M2 8.5 6 12l8-9" fill="none" stroke="var(--t-accent)" strokeWidth="2" /></svg>{skill}</li>)}</ul></div>}
    </section>}

    {has("services") && <section id="fees" className="bs"><div className="mx-auto max-w-[74rem] px-5 py-20 @3xl:px-8">
      <h2 className="fd text-[2rem]">{label("services", "Appointments & fees")}</h2>
      <div className="mt-8 grid gap-4 @3xl:grid-cols-2">{(c.services ?? []).map((service, index) => <Reveal key={index} delay={(index % 2) * 70}>
        <div className="flex h-full gap-5 rounded-[12px] bg-[var(--t-bg)] p-6" {...ed(`services.${index}`)}>
          <div className="flex-1"><h3 className="text-[1.08rem] font-semibold">{service.title}</h3><p className="mt-1 text-[15px] tm pretty">{service.description}</p></div>
          <p className="fd shrink-0 text-[1.6rem] leading-none tabular-nums ta">{service.price}</p>
        </div>
      </Reveal>)}</div>
    </div></section>}

    {(has("education") || has("experience")) && <section id="training" className="mx-auto grid max-w-[74rem] gap-14 px-5 py-20 @3xl:px-8 @4xl:grid-cols-2">
      {has("education") && <div><h2 className="fd text-[1.7rem]">{label("education", "Training & registration")}</h2><ol className="mt-6 border-l-2 border-[var(--t-accent)]">{(c.education ?? []).map((item, index) => <li key={index} className="relative pb-6 pl-6" {...ed(`education.${index}`)}><span className="absolute -left-[7px] top-[0.55em] size-3 rounded-full border-2 border-[var(--t-accent)] bg-[var(--t-bg)]" /><p className="font-semibold">{item.degree}</p><p className="text-[15px] tm">{item.school}{item.end_date && ` · ${[item.start_date, item.end_date].filter(Boolean).join("–")}`}</p></li>)}</ol></div>}
      {has("experience") && <div><h2 className="fd text-[1.7rem]">{label("experience", "Appointments")}</h2><ul className="mt-6 space-y-5">{(c.experience ?? []).map((role, index) => <li key={index} {...ed(`experience.${index}`)}><p className="font-semibold">{role.job_title}</p><p className="text-[15px] tm">{role.company}{role.start_date && ` · ${[role.start_date, role.end_date].filter(Boolean).join("–")}`}</p>{role.description && <p className="mt-1 text-[15px] pretty">{role.description}</p>}</li>)}</ul></div>}
    </section>}

    {has("highlights") && <section className="border-t rule"><div className="mx-auto max-w-[74rem] px-5 py-16 @3xl:px-8">
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] tm">{label("highlights", "Publications, talks & memberships")}</h2>
      <ul className="mt-5 divide-y divide-[var(--t-rule)]">{(c.highlights ?? []).map((item, index) => <li key={index} className="grid gap-1 py-3 @3xl:grid-cols-[1fr_auto] @3xl:gap-8" {...ed(`highlights.${index}`)}><span>{item.url ? <a href={item.url} {...external(item.url)} className="underline decoration-[var(--t-rule-strong)] underline-offset-4 hover-a">{item.title}</a> : item.title}{item.detail && <i className="tm"> · {item.detail}</i>}</span><span className="text-[14px] tabular-nums tm">{item.year}</span></li>)}</ul>
    </div></section>}

    {has("testimonials") && <section className="mx-auto grid max-w-[74rem] gap-6 px-5 pb-20 @3xl:grid-cols-2 @3xl:px-8">{(c.testimonials ?? []).map((item, index) => <figure key={index} className="rounded-[12px] border rule p-7" {...ed(`testimonials.${index}`)}>
      <blockquote className="fd text-[1.2rem] leading-snug">“{item.quote}”</blockquote><figcaption className="mt-4 text-[14px] tm">{item.name}, {item.role}</figcaption>
    </figure>)}</section>}

    {has("contact") && <footer id="contact" className="bg-[var(--t-fg)] text-[var(--t-bg)]"><div className="mx-auto grid max-w-[74rem] gap-10 px-5 py-16 @3xl:px-8 @4xl:grid-cols-2">
      <div><h2 className="fd text-[clamp(1.9rem,4cqw,2.8rem)] leading-tight">Book an appointment</h2><p className="mt-3 max-w-[28rem] opacity-75">Write with a few words about what you’d like to discuss and the days that suit you. I reply within one working day.</p></div>
      <div className="space-y-2 self-end text-[1.1rem]">
        {c.phone && <a href={tel(c.phone)} className="block font-semibold tabular-nums">{c.phone}</a>}
        <a href={c.email ? `mailto:${c.email}` : "#"} className="block break-all" {...ed("email")}>{c.email}</a>
        <p className="flex flex-wrap gap-x-5 pt-1 text-[14px] opacity-75">{contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)}>{link.label}</a>)}</p>
      </div>
      <p className="border-t border-current/20 pt-5 text-[13px] opacity-60 @4xl:col-span-2">This website does not give medical advice. In an emergency, call your local emergency number.</p>
    </div></footer>}
  </StudioRoot>;
}

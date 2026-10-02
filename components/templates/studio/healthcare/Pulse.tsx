"use client";

import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/hanken-grotesk";
import { StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";
import { CountUp, Magnetic, Scrub, Words, useRotation } from "../motion";

const tel = (phone?: string) => (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "#book");

/** A heartbeat that travels along the bottom of the hero, forever and calmly. */
function Heartbeat() {
  const beat = (x: number) => `L${x} 50 L${x + 10} 50 L${x + 16} 40 L${x + 22} 50 L${x + 30} 50 L${x + 35} 58 L${x + 42} 8 L${x + 49} 90 L${x + 55} 50 L${x + 70} 50 L${x + 80} 43 L${x + 92} 50`;
  const d = `M0 50 ${[60, 360, 660, 960, 1260, 1560, 1860, 2160].map(beat).join(" ")} L2400 50`;
  return <svg aria-hidden viewBox="0 0 1200 100" preserveAspectRatio="none" className="block h-20 w-full overflow-hidden">
    <g className="[animation:pulse-travel_6s_linear_infinite] motion-reduce:animate-none"><path d={d} fill="none" stroke="var(--t-accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" /></g>
    <style>{"@keyframes pulse-travel{to{transform:translateX(-1200px)}}@keyframes pulse-breathe{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(4%,-3%) scale(1.12)}}@keyframes pulse-dot{0%{box-shadow:0 0 0 0 rgba(34,160,107,.5)}100%{box-shadow:0 0 0 12px rgba(34,160,107,0)}}"}</style>
  </svg>;
}

export default function Pulse({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const book = c.email ? `mailto:${c.email}?subject=${encodeURIComponent("Appointment request")}` : "#book";
  const accepting = c.availability && !/not|closed|full/i.test(c.availability);
  const quotes = c.testimonials ?? [];
  const rotation = useRotation(quotes.length, 6500);
  const timeline = [...(c.education ?? []).map((item, index) => ({ when: item.end_date, title: item.degree, where: item.school, path: `education.${index}` })), ...(c.experience ?? []).map((role, index) => ({ when: [role.start_date, role.end_date].filter(Boolean).join("–"), title: role.job_title, where: role.company, path: `experience.${index}` }))];

  return <StudioRoot studio={studio} className="text-[16.5px] leading-[1.7]">
    {/* Hero: two soft lights breathe behind the name; the line keeps time below. */}
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="absolute -left-[10%] -top-[20%] -z-10 aspect-square w-[70%] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--t-accent)_30%,transparent),transparent_65%)] blur-2xl [animation:pulse-breathe_14s_ease-in-out_infinite] motion-reduce:animate-none" />
      <div aria-hidden className="absolute -right-[15%] top-[10%] -z-10 aspect-square w-[60%] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--t-surface)_90%,transparent),transparent_60%)] blur-2xl [animation:pulse-breathe_18s_ease-in-out_-6s_infinite_reverse] motion-reduce:animate-none" />
      <header className="mx-auto flex max-w-[76rem] items-center justify-between px-5 py-6 @3xl:px-10">
        <span className="text-[15px] font-semibold">{c.name}</span>
        <nav className="flex items-center gap-6 text-[14px]"><a href="#care" className="hidden tm hover-a @2xl:inline">Care</a><a href="#fees" className="hidden tm hover-a @2xl:inline">Fees</a><a href={book} className="rounded-full bg-[var(--t-fg)] px-4 py-2 font-medium text-[var(--t-bg)]">Book</a></nav>
      </header>
      <div className="mx-auto max-w-[76rem] px-5 pb-6 pt-16 @3xl:px-10 @3xl:pt-24">
        {c.availability && <p className="inline-flex items-center gap-2.5 rounded-full bg-[var(--t-bg)]/70 px-3.5 py-1.5 text-[13px] font-medium shadow-[0_0_0_1px_var(--t-rule)] backdrop-blur" {...ed("availability")}><span className={`size-2 rounded-full ${accepting ? "bg-[#22a06b] [animation:pulse-dot_1.6s_ease-out_infinite]" : "bg-[#d97706]"}`} />{c.availability}</p>}
        <h1 className="fd mt-8 text-[clamp(3.2rem,9.4cqw,7.6rem)] leading-[0.92] tracking-[-0.025em]" {...ed("name")}><Words text={c.name} step={90} /></h1>
        <p className="mt-5 text-[1.2rem] ta" {...ed("professional_title")}>{c.professional_title}</p>
        <p className="fd mt-8 max-w-[36rem] text-[clamp(1.5rem,3cqw,2.1rem)] italic leading-snug" {...ed("tagline")}>{c.tagline}</p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Magnetic><a href={book} className="inline-block rounded-full ba px-7 py-3.5 font-semibold text-[var(--t-bg)] shadow-[0_14px_30px_-14px_var(--t-accent)]">Request an appointment</a></Magnetic>
          {c.phone && <a href={tel(c.phone)} className="rounded-full px-5 py-3.5 font-semibold tabular-nums shadow-[inset_0_0_0_1.5px_var(--t-fg)]" {...ed("phone")}>{c.phone}</a>}
        </div>
      </div>
      <Heartbeat />
    </section>

    {has("stats") && <section className="mx-auto grid max-w-[76rem] grid-cols-3 gap-4 px-5 py-14 @3xl:px-10">{(c.stats ?? []).map((stat, index) => <div key={index} {...ed(`stats.${index}`)}><p className="fd text-[clamp(2.4rem,6cqw,4.6rem)] leading-none"><CountUp value={stat.value} /></p><p className="mt-2 text-[14px] tm">{stat.label}</p></div>)}</section>}

    {has("skills") && <section id="care" className="mx-auto max-w-[76rem] px-5 py-16 @3xl:px-10">
      <p className="text-[13px] font-semibold uppercase tracking-[0.2em] tm">{label("skills", "What I treat")}</p>
      <ul className="mt-6 grid @3xl:grid-cols-2" {...ed("skills")}>{(c.skills ?? []).map((skill) => <li key={skill} className="group relative overflow-hidden border-b rule">
        <span aria-hidden className="absolute inset-0 origin-left scale-x-0 bg-[color-mix(in_oklab,var(--t-accent)_12%,transparent)] transition-transform duration-700 ease-[cubic-bezier(.2,.7,.1,1)] group-hover:scale-x-100" />
        <span className="fd relative flex items-center justify-between px-2 py-4 text-[clamp(1.5rem,3.2cqw,2.2rem)] leading-tight">{skill}<span aria-hidden className="text-[1rem] opacity-0 transition-[opacity,transform] duration-500 group-hover:translate-x-0 group-hover:opacity-100 -translate-x-2 ta">→</span></span>
      </li>)}</ul>
    </section>}

    {has("about") && <section className="mx-auto grid max-w-[76rem] gap-10 px-5 py-20 @3xl:px-10 @4xl:grid-cols-[1fr_1.6fr]">
      <h2 className="fd text-[clamp(2.2rem,5cqw,3.6rem)] leading-[1.02]">{label("about", "How I work")}</h2>
      <div className="space-y-5 text-[1.12rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
    </section>}

    {has("services") && <section id="fees" className="bs py-20">
      <div className="mx-auto max-w-[76rem] px-5 @3xl:px-10">
        <h2 className="fd text-[clamp(2.2rem,5cqw,3.6rem)] leading-none">{label("services", "Appointments & fees")}</h2>
        <div className="mt-10 grid gap-4 @3xl:grid-cols-2">{(c.services ?? []).map((service, index) => <a key={index} href={book} className="group flex items-start justify-between gap-6 rounded-[20px] bg-[var(--t-bg)] p-7 transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(.2,.7,.1,1)] hover:-translate-y-1 hover:shadow-[0_24px_40px_-24px_rgba(0,0,0,.35)]" {...ed(`services.${index}`)}>
          <span><b className="block text-[1.12rem] font-semibold">{service.title}</b><span className="mt-1 block text-[15px] tm pretty">{service.description}</span><span className="mt-4 inline-block text-[13px] font-semibold ta transition-transform group-hover:translate-x-1">Book this →</span></span>
          <span className="fd shrink-0 text-[2rem] leading-none">{service.price}</span>
        </a>)}</div>
      </div>
    </section>}

    {timeline.length > 0 && (has("education") || has("experience")) && <section className="mx-auto max-w-[76rem] px-5 py-20 @3xl:px-10">
      <h2 className="fd text-[clamp(2.2rem,5cqw,3.6rem)] leading-none">{label("education", "Training & experience")}</h2>
      {/* The line draws down the page as you read. */}
      <Scrub mode="enter" className="relative mt-12 pl-10">
        <span aria-hidden className="absolute left-[7px] top-1 h-[calc(100%-0.5rem)] w-[2px] bg-[var(--t-rule)]" />
        <span aria-hidden className="absolute left-[7px] top-1 h-[calc(100%-0.5rem)] w-[2px] origin-top ba" style={{ transform: "scaleY(var(--p))" }} />
        <ol className="space-y-9">{timeline.map((item) => <li key={item.path} className="relative" {...ed(item.path)}>
          <span aria-hidden className="absolute -left-10 top-[0.45em] size-4 rounded-full border-2 border-[var(--t-accent)] bg-[var(--t-bg)]" />
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] tm">{item.when}</p>
          <p className="fd mt-1 text-[1.6rem] leading-tight">{item.title}</p>
          <p className="tm">{item.where}</p>
        </li>)}</ol>
      </Scrub>
    </section>}

    {has("testimonials") && quotes.length > 0 && <section className="mx-auto max-w-[60rem] px-5 py-24 text-center" onPointerEnter={rotation.pause} onPointerLeave={rotation.resume}>
      <div className="grid">{quotes.map((item, index) => <figure key={index} aria-hidden={index !== rotation.index} className={`col-start-1 row-start-1 transition-[opacity,filter] duration-1000 ${index === rotation.index ? "opacity-100 blur-0" : "pointer-events-none opacity-0 blur-sm"}`} {...ed(`testimonials.${index}`)}>
        <blockquote className="fd text-[clamp(1.8rem,4.2cqw,3rem)] italic leading-[1.15]">“{item.quote}”</blockquote>
        <figcaption className="mt-6 text-[14px] tm">{item.name} · {item.role}</figcaption>
      </figure>)}</div>
    </section>}

    {has("highlights") && <section className="mx-auto max-w-[76rem] border-t rule px-5 py-14 @3xl:px-10"><ul className="grid gap-4 @3xl:grid-cols-2">{(c.highlights ?? []).map((item, index) => <li key={index} {...ed(`highlights.${index}`)}>{item.url ? <a href={item.url} {...external(item.url)} className="underline decoration-[var(--t-rule-strong)] underline-offset-4 hover-a">{item.title}</a> : item.title}<span className="block text-[14px] tm">{[item.detail, item.year].filter(Boolean).join(" · ")}</span></li>)}</ul></section>}

    {has("contact") && <footer id="book" className="relative isolate overflow-hidden bg-[var(--t-fg)] px-5 py-24 text-[var(--t-bg)] @3xl:px-10">
      <div aria-hidden className="absolute -right-[10%] -top-[30%] -z-10 aspect-square w-[60%] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--t-accent)_45%,transparent),transparent_65%)] blur-2xl [animation:pulse-breathe_16s_ease-in-out_infinite] motion-reduce:animate-none" />
      <div className="mx-auto grid max-w-[76rem] gap-10 @4xl:grid-cols-[1.4fr_1fr]">
        <h2 className="fd text-[clamp(2.6rem,7cqw,5.4rem)] leading-[0.98]"><Words text="Book a time that suits you." /></h2>
        <div className="space-y-2 self-end text-[1.1rem]">
          {c.phone && <a href={tel(c.phone)} className="block font-semibold tabular-nums">{c.phone}</a>}
          <a href={c.email ? `mailto:${c.email}` : "#"} className="block break-all" {...ed("email")}>{c.email}</a>
          <p className="flex flex-wrap gap-x-5 pt-1 text-[14px] opacity-75">{contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)}>{link.label}</a>)}</p>
        </div>
        <p className="border-t border-current/20 pt-5 text-[13px] opacity-60 @4xl:col-span-2">This website does not give medical advice. In an emergency, call your local emergency number.</p>
      </div>
    </footer>}
  </StudioRoot>;
}

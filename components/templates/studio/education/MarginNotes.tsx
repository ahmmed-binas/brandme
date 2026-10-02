"use client";

import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/full-italic.css";
import "@fontsource-variable/figtree";
import "@fontsource-variable/caveat";
import { useEffect, useState } from "react";
import { Picture, StudioRoot, contactLinks, ed, external, firstName, paragraphs, useStudio, type StudioProps } from "../kit";
import { CountUp, Magnetic, Words, motionOff, useScrollProgress, useSeen } from "../motion";

const hand = "font-['Caveat_Variable',cursive]";
const TERM_COLOURS = ["#f6d8c8", "#d6e6d0", "#d7def3", "#f3e6b8", "#e8d6ee"];

/** A hand-drawn loop that draws itself around a word when it comes into view. */
function Circled({ children }: { children: React.ReactNode }) {
  const [ref, seen] = useSeen<HTMLSpanElement>("0px");
  return <span ref={ref} className="relative inline-block">
    {children}
    <svg aria-hidden viewBox="0 0 200 80" preserveAspectRatio="none" className="pointer-events-none absolute -inset-x-[8%] -inset-y-[22%] h-[144%] w-[116%] overflow-visible">
      <path d="M12 44 C 10 14, 70 6, 112 8 S 196 22, 190 44 S 130 76, 86 74 S 6 66, 16 36 S 80 2, 150 10" fill="none" stroke="var(--t-accent)" strokeWidth="3.2" strokeLinecap="round" pathLength={1}
        style={{ strokeDasharray: 1, strokeDashoffset: seen ? 0 : 1, transition: "stroke-dashoffset 1.3s cubic-bezier(.6,0,.2,1) .9s" }} />
    </svg>
  </span>;
}

/** Little doodles that bob on the page and drift at different speeds as you scroll. */
const DOODLES = [
  { d: "M12 2 L14.6 9 L22 9.3 L16.2 14 L18.2 21.2 L12 17 L5.8 21.2 L7.8 14 L2 9.3 L9.4 9 Z", x: "8%", y: "18%", s: 34, speed: -18, delay: 0 },
  { d: "M12 3 a9 9 0 1 0 0.01 0 M12 3 C 18 8, 18 16, 12 21 M12 3 C 6 8, 6 16, 12 21 M3 12 H21", x: "84%", y: "14%", s: 42, speed: 24, delay: 1.2 },
  { d: "M4 20 L16 8 L19 11 L7 23 L3 24 Z M16 8 L18 6 L21 9 L19 11", x: "90%", y: "64%", s: 36, speed: -30, delay: 0.6 },
  { d: "M2 12 Q 7 4, 12 12 T 22 12", x: "4%", y: "72%", s: 40, speed: 16, delay: 1.8 },
];

function Ring({ value, label, path, index }: { value?: string; label?: string; path: string; index: number }) {
  const [ref, seen] = useSeen<HTMLDivElement>();
  const percent = Number.parseFloat((value ?? "").replace(/[^\d.]/g, ""));
  const share = (value ?? "").includes("%") && Number.isFinite(percent) ? Math.min(percent, 100) / 100 : 0.72 + index * 0.08;
  return <div ref={ref} className="flex items-center gap-5" {...ed(path)}>
    <svg viewBox="0 0 80 80" className="size-24 shrink-0 -rotate-90" aria-hidden><circle cx="40" cy="40" r="34" fill="none" stroke="var(--t-rule)" strokeWidth="7" /><circle cx="40" cy="40" r="34" fill="none" stroke="var(--t-accent)" strokeWidth="7" strokeLinecap="round" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: seen ? 1 - share : 1, transition: `stroke-dashoffset 1.6s cubic-bezier(.2,.7,.1,1) ${index * 150}ms` }} /></svg>
    <div><p className="fd text-[2.4rem] font-[600] leading-none"><CountUp value={value} /></p><p className="mt-1 text-[14px] tm">{label}</p></div>
  </div>;
}

export default function MarginNotes({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const words = (c.tagline ?? "").trim().split(/\s+/);
  const last = words.pop();
  const hero = useScrollProgress<HTMLElement>("through", 0.5);
  const steps = (c.projects?.length ? c.projects.map((item, index) => ({ title: item.title, body: item.description, tag: [item.category, item.year].filter(Boolean).join(" · "), image: item.image, path: `projects.${index}` }))
    : (c.highlights ?? []).map((item, index) => ({ title: item.title, body: item.detail, tag: item.year, image: undefined, path: `highlights.${index}` })));
  // The pinned story needs motion; captures and reduced motion get a simple list instead.
  const [pinned, setPinned] = useState(false);
  useEffect(() => { const frame = requestAnimationFrame(() => setPinned(!motionOff())); return () => cancelAnimationFrame(frame); }, []);

  return <StudioRoot studio={studio} className="text-[17px] leading-[1.7]">
    <section ref={hero} className="relative overflow-hidden px-5 pb-24 pt-8 @3xl:px-12 @3xl:pb-32" style={{ "--p": 0.5 } as React.CSSProperties}>
      <style>{"@keyframes margin-bob{0%,100%{translate:0 0;rotate:-4deg}50%{translate:0 -10px;rotate:5deg}}"}</style>
      {DOODLES.map((doodle, index) => <svg key={index} aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute hidden opacity-70 @3xl:block" style={{ left: doodle.x, top: doodle.y, width: doodle.s, transform: `translateY(calc((var(--p) - .5) * ${doodle.speed * 6}px))` }}>
        <path d={doodle.d} fill="none" stroke={index % 2 ? "var(--t-accent)" : "var(--t-fg)"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ animation: `margin-bob ${5 + index}s ease-in-out ${doodle.delay}s infinite` }} />
      </svg>)}
      <header className="relative flex items-center justify-between text-[15px]"><span className="fd text-[1.3rem] font-[600]">{c.name}</span><nav className="flex gap-6 tm"><a href="#year" className="hidden hover-a @2xl:inline">My classroom</a><a href="#lessons" className="hidden hover-a @2xl:inline">Lessons</a><a href="#contact" className="hover-a">Say hello</a></nav></header>
      <div className="relative mx-auto mt-20 max-w-[60rem] text-center @3xl:mt-28">
        <p className="text-[14px] font-semibold uppercase tracking-[0.2em] ta" {...ed("professional_title")}>{c.professional_title}</p>
        <h1 className="fd mt-6 text-[clamp(2.6rem,7.4cqw,6rem)] font-[560] leading-[1.02] tracking-[-0.025em] [font-variation-settings:'SOFT'_100,'WONK'_1] balance" {...ed("tagline")}>
          <Words text={words.join(" ")} /> {last && <Circled><Words text={last} delay={words.length * 28} /></Circled>}
        </h1>
        <p className={`${hand} relative mt-10 inline-block text-[1.9rem] leading-none ta`} {...ed("name")}>— {c.name}<svg aria-hidden viewBox="0 0 60 30" className="absolute -right-16 -top-6 w-14 -rotate-12"><path d="M4 26 C 20 24, 40 16, 54 4 M44 4 H54 V14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></p>
        {c.availability && <p className="mx-auto mt-8 w-fit rounded-full bs px-4 py-1.5 text-[14px]" {...ed("availability")}>{c.availability}</p>}
      </div>
    </section>

    {has("stats") && <section className="grid gap-10 border-y rule px-5 py-14 @3xl:grid-cols-3 @3xl:px-12">{(c.stats ?? []).map((stat, index) => <Ring key={index} value={stat.value} label={stat.label} path={`stats.${index}`} index={index} />)}</section>}

    {has("skills") && <section aria-label={label("skills", "What I teach")} className="overflow-hidden py-12" {...ed("skills")}>
      {[0, 1].map((row) => <div key={row} className="flex w-max gap-4 py-2" style={{ animation: `studio-marquee ${36 + row * 8}s linear infinite ${row ? "reverse" : ""}` }}>
        {[...(c.skills ?? []), ...(c.skills ?? [])].map((skill, index) => <span key={index} className={`rounded-full px-6 py-3 text-[1.1rem] ${(index + row) % 3 === 0 ? "ba text-[var(--t-bg)]" : "bs"}`}>{skill}</span>)}
      </div>)}
    </section>}

    {steps.length > 0 && (has("projects") || has("highlights")) && <section id="year">
      <h2 className="fd px-5 pt-16 text-[clamp(2.2rem,5cqw,3.6rem)] font-[600] tracking-[-0.02em] @3xl:px-12">{label("projects", "A year in my classroom")}</h2>
      {!pinned && <ol className="grid gap-6 px-5 py-12 @3xl:grid-cols-2 @3xl:px-12">{steps.map((item, index) => <li key={item.path} className="rounded-[18px] p-7" style={{ background: `color-mix(in oklab, ${TERM_COLOURS[index % TERM_COLOURS.length]} 55%, var(--t-bg))` }} {...ed(item.path)}>
        <p className={`${hand} text-[1.7rem] leading-none ta`}>{String(index + 1).padStart(2, "0")}</p>
        {item.image && <Picture src={item.image} alt="" embedded={embedded} className="mt-4 aspect-[16/10] w-full rounded-[6px]" />}
        <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.18em] tm">{item.tag}</p>
        <h3 className="fd mt-2 text-[1.8rem] font-[600] leading-tight">{item.title}</h3>
        <p className="mt-3 pretty">{item.body}</p>
      </li>)}</ol>}
      {/* Pinned story: the panel stays while the steps scroll past; the colour changes with each one. */}
      {pinned && <PinnedStory steps={steps} embedded={embedded} />}
    </section>}

    {has("about") && <section className="mx-auto max-w-[46rem] px-5 py-24 @3xl:py-32">
      <p className={`${hand} text-[2rem] leading-none ta`}>{label("about", `About ${firstName(c.name)}`)}</p>
      <div className="mt-6 space-y-5 text-[1.15rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
    </section>}

    {has("services") && <section id="lessons" className="px-5 pb-24 @3xl:px-12">
      <h2 className="fd text-[clamp(2.2rem,5cqw,3.6rem)] font-[600] tracking-[-0.02em]">{label("services", "Lessons you can book")}</h2>
      <div className="mt-10 grid gap-6 [perspective:1200px] @3xl:grid-cols-3">{(c.services ?? []).map((service, index) => <article key={index} className="group rounded-[18px] border-2 border-[var(--t-fg)] bg-[var(--t-bg)] p-7 shadow-[6px_6px_0_var(--t-fg)] transition-transform duration-500 ease-[cubic-bezier(.2,.7,.1,1)] hover:[transform:rotateX(4deg)_rotateY(-6deg)_translateY(-6px)]" {...ed(`services.${index}`)}>
        <p className={`${hand} text-[2rem] leading-none ta`}>{service.price}</p>
        <h3 className="fd mt-4 text-[1.5rem] font-[600] leading-tight">{service.title}</h3>
        <p className="mt-2 text-[15.5px] tm pretty">{service.description}</p>
      </article>)}</div>
    </section>}

    {has("testimonials") && <section className="overflow-hidden bs px-5 py-24 @3xl:px-12">
      <div className="mx-auto grid max-w-[64rem] gap-10 @3xl:grid-cols-2">{(c.testimonials ?? []).map((item, index) => <Note key={index} index={index} quote={item.quote} name={item.name} role={item.role} />)}</div>
    </section>}

    {(has("experience") || has("education")) && <section className="mx-auto grid max-w-[64rem] gap-12 px-5 py-20 @3xl:grid-cols-2">
      {has("experience") && <div><p className={`${hand} text-[1.8rem] leading-none ta`}>{label("experience", "Where I’ve taught")}</p><ul className="mt-5 space-y-4">{(c.experience ?? []).map((role, index) => <li key={index} {...ed(`experience.${index}`)}><b className="font-semibold">{role.job_title}</b><span className="block tm">{role.company} · {[role.start_date, role.end_date].filter(Boolean).join("–")}</span></li>)}</ul></div>}
      {has("education") && <div><p className={`${hand} text-[1.8rem] leading-none ta`}>{label("education", "Qualifications")}</p><ul className="mt-5 space-y-4">{(c.education ?? []).map((item, index) => <li key={index} {...ed(`education.${index}`)}><b className="font-semibold">{item.degree}</b><span className="block tm">{item.school}</span></li>)}</ul></div>}
    </section>}

    {has("contact") && <footer id="contact" className="px-5 pb-16 pt-10 text-center @3xl:px-12">
      <h2 className="fd text-[clamp(2.6rem,7cqw,5.4rem)] font-[600] leading-[1] tracking-[-0.03em]">Let’s <Circled>talk.</Circled></h2>
      <div className="mt-10 flex justify-center"><Magnetic><a href={c.email ? `mailto:${c.email}` : "#"} className="inline-block rounded-full bg-[var(--t-fg)] px-8 py-4 text-[1.05rem] font-semibold text-[var(--t-bg)]" {...ed("email")}>{c.email || "Email me"}</a></Magnetic></div>
      <p className="mt-6 flex flex-wrap justify-center gap-x-6 tm">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover-a">{link.label}</a>)}</p>
    </footer>}
  </StudioRoot>;
}

function Note({ index, quote, name, role }: { index: number; quote?: string; name?: string; role?: string }) {
  const [ref, seen] = useSeen<HTMLElement>();
  const from = index % 2 ? "translateX(60px) rotate(6deg)" : "translateX(-60px) rotate(-6deg)";
  return <figure ref={ref} className="bg-[#fff6c9] p-8 text-[#2b2410] shadow-[0_20px_40px_-24px_rgba(0,0,0,.45)] transition-[transform,opacity] duration-[1s] ease-[cubic-bezier(.2,.7,.1,1)]" style={{ transform: seen ? `rotate(${index % 2 ? 1.5 : -1.5}deg)` : from, opacity: seen ? 1 : 0 }} {...ed(`testimonials.${index}`)}>
    <blockquote className={`${hand} text-[1.9rem] leading-[1.1]`}>{quote}</blockquote>
    <figcaption className="mt-4 text-[14px] font-semibold opacity-70">— {name}{role && `, ${role}`}</figcaption>
  </figure>;
}

interface Step { title?: string; body?: string; tag?: string; image?: string; path: string }

/** The year told as you scroll: the panel stays put while the steps change beneath it. */
function PinnedStory({ steps, embedded }: { steps: Step[]; embedded?: boolean }) {
  const [active, setActive] = useState(0);
  const story = useScrollProgress<HTMLDivElement>("pin", 0, (progress) => setActive(Math.min(steps.length - 1, Math.floor(progress * steps.length * 0.999))));
  const step = steps[active];
  return <div ref={story} className="relative" style={{ height: `${Math.max(1, steps.length) * 80}vh` }}>
        <div className="sticky top-0 flex min-h-[min(100vh,48rem)] items-center px-5 py-10 transition-colors duration-700 @3xl:px-12" style={{ background: `color-mix(in oklab, ${TERM_COLOURS[active % TERM_COLOURS.length]} 55%, var(--t-bg))` }}>
          <div className="grid w-full gap-10 @4xl:grid-cols-[1fr_1.1fr] @4xl:items-center">
            <div>
              <p className={`${hand} text-[2rem] leading-none ta`}>{String(active + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}</p>
              <div key={active} className="[animation:margin-in_.7s_cubic-bezier(.2,.7,.1,1)] motion-reduce:animate-none" {...ed(step?.path ?? "projects.0")}>
                <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.18em] tm">{step?.tag}</p>
                <h3 className="fd mt-3 text-[clamp(2rem,4.6cqw,3.4rem)] font-[600] leading-[1.05] tracking-[-0.02em]">{step?.title}</h3>
                <p className="mt-5 max-w-[34rem] text-[1.1rem] pretty">{step?.body}</p>
              </div>
              <div className="mt-8 flex gap-2">{steps.map((_, index) => <span key={index} className={`h-1.5 rounded-full transition-all duration-500 ${index === active ? "w-10 ba" : "w-3 bg-[var(--t-rule-strong)]"}`} />)}</div>
            </div>
            {step?.image && <div key={`image-${active}`} className="[animation:margin-in_.9s_cubic-bezier(.2,.7,.1,1)] motion-reduce:animate-none"><Picture src={step.image} alt="" embedded={embedded} className="aspect-[4/3] w-full rotate-[1.5deg] rounded-[6px] shadow-[0_30px_60px_-30px_rgba(0,0,0,.45)]" /></div>}
          </div>
          <style>{"@keyframes margin-in{from{opacity:0;transform:translateY(24px)}}"}</style>
        </div>
      </div>;
}

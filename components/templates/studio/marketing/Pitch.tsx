"use client";

import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource-variable/space-grotesk";
import "@fontsource/dm-serif-display/400.css";
import "@fontsource-variable/dm-sans";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Picture, StudioRoot, contactLinks, ed, external, pad, paragraphs, useStudio, type StudioProps } from "../kit";

function Slide({ n, total, title, children, dark }: { n: number; total: number; title: string; children: ReactNode; dark?: boolean }) {
  return <section aria-label={`Slide ${n}: ${title}`} className={`relative flex min-h-[24rem] w-full shrink-0 snap-start flex-col overflow-hidden rounded-[10px] p-7 @3xl:aspect-[16/9] @3xl:min-h-0 @3xl:w-[min(100%,72rem)] @3xl:p-14 ${dark ? "bg-[var(--t-surface)] text-[var(--t-bg)]" : "bg-[color-mix(in_oklab,var(--t-bg)_92%,white)] shadow-[0_1px_0_var(--t-rule),0_30px_60px_-30px_rgba(0,0,0,.35)]"}`}>
    <header className="flex justify-between text-[12px] uppercase tracking-[0.18em] opacity-60"><span>{title}</span><span className="tabular-nums">{pad(n)} / {pad(total)}</span></header>
    <div className="flex min-h-0 flex-1 flex-col justify-center py-6">{children}</div>
  </section>;
}

export default function Pitch({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const track = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  const slides: Array<{ title: string; dark?: boolean; body: ReactNode }> = [
    { title: c.professional_title ?? "Introduction", body: <><h1 className="fd text-[clamp(3rem,8cqw,6.5rem)] leading-[0.92] tracking-[-0.03em]" {...ed("name")}>{c.name}</h1><p className="fd mt-6 max-w-[34rem] text-[clamp(1.3rem,2.6cqw,2rem)] italic leading-snug ta" {...ed("tagline")}>{c.tagline}</p><p className="mt-auto pt-8 text-[14px] opacity-70">{c.location}</p></> },
    ...(has("about") ? [{ title: label("about", "Context"), body: <div className="grid gap-8 @3xl:grid-cols-[1fr_1.4fr]"><p className="fd text-[clamp(2rem,4.4cqw,3.4rem)] leading-[1.02]">The short version.</p><div className="space-y-4 text-[1.1rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div></div> }] : []),
    ...(has("stats") ? [{ title: label("stats", "In numbers"), dark: true, body: <div className="grid gap-8 @3xl:grid-cols-3">{(c.stats ?? []).map((stat, index) => <div key={index} {...ed(`stats.${index}`)}><p className="fd text-[clamp(3.4rem,8cqw,6.4rem)] leading-none ta">{stat.value}</p><p className="mt-2 text-[1rem] opacity-80">{stat.label}</p></div>)}</div> }] : []),
    ...(has("projects") ? (c.projects ?? []).map((project, index) => ({ title: `${label("projects", "Case")} ${pad(index + 1)}`, body: <div className="grid items-center gap-8 @3xl:grid-cols-[1fr_1.1fr]" {...ed(`projects.${index}`)}><div><p className="text-[13px] uppercase tracking-[0.16em] ta">{project.client} · {project.year}</p><h2 className="fd mt-3 text-[clamp(2rem,4.6cqw,3.6rem)] leading-[1]">{project.title}</h2><p className="mt-4 text-[1.05rem] pretty">{project.description}</p></div><Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="aspect-[4/3] w-full rounded-md" /></div> })) : []),
    ...(has("experience") ? [{ title: label("experience", "Track record"), body: <ol className="grid gap-6 @3xl:grid-cols-2">{(c.experience ?? []).map((role, index) => <li key={index} className="border-t-2 border-[var(--t-accent)] pt-3" {...ed(`experience.${index}`)}><p className="text-[13px] opacity-60">{[role.start_date, role.end_date].filter(Boolean).join(" – ")}</p><p className="fd text-[1.8rem] leading-tight">{role.company}</p><p className="opacity-80">{role.job_title}</p><p className="mt-2 text-[15px] opacity-70">{role.description}</p></li>)}</ol> }] : []),
    ...(has("testimonials") ? [{ title: label("testimonials", "What people say"), dark: true, body: (c.testimonials ?? []).slice(0, 1).map((item, index) => <figure key={index} {...ed(`testimonials.${index}`)}><blockquote className="fd text-[clamp(2rem,4.6cqw,3.8rem)] italic leading-[1.05]">“{item.quote}”</blockquote><figcaption className="mt-6 opacity-70">{item.name} — {item.role}</figcaption></figure>) }] : []),
    ...(has("services") ? [{ title: label("services", "How I can help"), body: <div className="grid gap-6 @3xl:grid-cols-2">{(c.services ?? []).map((item, index) => <div key={index} className="rounded-md border rule p-5" {...ed(`services.${index}`)}><p className="fd text-[1.6rem] leading-tight">{item.title}</p><p className="mt-2 opacity-75">{item.description}</p></div>)}</div> }] : []),
    ...(has("contact") ? [{ title: "The ask", dark: true, body: <><p className="fd text-[clamp(2.4rem,6cqw,4.8rem)] leading-[0.95]">Let’s talk.</p><a href={c.email ? `mailto:${c.email}` : "#"} className="mt-6 block break-all text-[clamp(1.4rem,3cqw,2.2rem)] font-semibold ta underline underline-offset-4" {...ed("email")}>{c.email}</a>{c.availability && <p className="mt-4 opacity-75" {...ed("availability")}>{c.availability}</p>}<p className="mt-8 flex flex-wrap gap-5 text-[14px]">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="underline">{link.label}</a>)}</p></> }] : []),
  ];

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const onScroll = () => { const width = node.firstElementChild?.getBoundingClientRect().width ?? 1; setActive(Math.round(node.scrollLeft / (width + 24))); };
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, []);
  const go = (index: number) => { const node = track.current; const target = node?.children[Math.max(0, Math.min(index, slides.length - 1))] as HTMLElement | undefined; if (node && target) node.scrollTo({ left: target.offsetLeft - node.offsetLeft, behavior: "smooth" }); };

  return <StudioRoot studio={studio} className="text-[16px] leading-[1.55]">
    <header className="flex items-center justify-between px-5 py-5 text-[14px] @3xl:px-10"><span className="fd text-[1.2rem]">{c.name}</span>
      <div className="hidden items-center gap-3 @3xl:flex"><button type="button" onClick={() => go(active - 1)} className="grid size-9 place-items-center rounded-full border rule hover:border-[var(--t-fg)]" aria-label="Previous slide">←</button><span className="tabular-nums tm">{pad(active + 1)} / {pad(slides.length)}</span><button type="button" onClick={() => go(active + 1)} className="grid size-9 place-items-center rounded-full border rule hover:border-[var(--t-fg)]" aria-label="Next slide">→</button></div></header>
    <div ref={track} tabIndex={0} onKeyDown={(event) => { if (event.key === "ArrowRight") go(active + 1); if (event.key === "ArrowLeft") go(active - 1); }} className="flex flex-col gap-6 px-5 pb-10 outline-none @3xl:snap-x @3xl:snap-mandatory @3xl:flex-row @3xl:overflow-x-auto @3xl:px-10 @3xl:pb-14 [scrollbar-width:thin]">
      {slides.map((slide, index) => <Slide key={index} n={index + 1} total={slides.length} title={slide.title} dark={slide.dark}>{slide.body}</Slide>)}
    </div>
    <nav className="hidden justify-center gap-1.5 pb-10 @3xl:flex" aria-label="Slides">{slides.map((slide, index) => <button key={index} type="button" onClick={() => go(index)} aria-label={`Go to slide ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === active ? "w-8 ba" : "w-3 bg-[var(--t-rule-strong)]"}`} />)}</nav>
  </StudioRoot>;
}

"use client";

import "@fontsource-variable/syne";
import "@fontsource-variable/space-grotesk";
import "@fontsource/space-mono/400.css";
import "@fontsource/instrument-serif/400.css";
import { useRef, useState } from "react";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, pad, paragraphs, useStudio, type StudioProps } from "../kit";

/** A record that can be spun by dragging; it keeps a little momentum. */
function Vinyl({ label, cover }: { label: string; cover?: string }) {
  const [angle, setAngle] = useState(0);
  const drag = useRef<{ x: number; start: number } | null>(null);
  return <div className="relative aspect-square w-full touch-none select-none" onPointerDown={(event) => { (event.target as HTMLElement).setPointerCapture(event.pointerId); drag.current = { x: event.clientX, start: angle }; }}
    onPointerMove={(event) => { if (drag.current) setAngle(drag.current.start + (event.clientX - drag.current.x) * 0.8); }} onPointerUp={() => { drag.current = null; }} role="img" aria-label={`${label} record. Drag to spin.`}>
    <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,#2a2a2a_0_18%,#0d0d0d_19%,#161616_40%,#0b0b0b_41%,#191919_60%,#0d0d0d_61%,#141414_80%,#080808_100%)] shadow-[0_30px_60px_-20px_rgba(0,0,0,.7)]" style={{ transform: `rotate(${angle}deg)`, transition: drag.current ? "none" : "transform 1.2s cubic-bezier(.2,.7,.1,1)" }}>
      <div className="absolute inset-0 rounded-full opacity-40 [background:repeating-radial-gradient(circle,transparent_0_2px,rgba(255,255,255,.05)_2px_3px)]" />
      <div className="absolute inset-[34%] overflow-hidden rounded-full border-4 border-[#0b0b0b]">{cover ? <Picture src={cover} alt="" className="size-full" /> : <div className="size-full ba" />}</div>
      <div className="absolute inset-[48.5%] rounded-full bg-[#e9e2d3]" />
      <div className="absolute left-1/2 top-[12%] h-[10%] w-px bg-white/20" />
    </div>
  </div>;
}

export default function LinerNotes({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const releases = c.projects ?? [];
  const [current, setCurrent] = useState(0);
  const release = releases[Math.min(current, Math.max(releases.length - 1, 0))];

  return <StudioRoot studio={studio} className="text-[15px] leading-relaxed">
    <header className="fm flex items-center justify-between px-5 py-5 text-[11px] uppercase tracking-[0.24em] @3xl:px-10"><span>{c.name}</span><nav className="flex gap-6"><a href="#records" className="hover-a">Records</a><a href="#dates" className="hover-a">Live</a><a href="#booking" className="hover-a">Booking</a></nav></header>

    <section className="grid items-center gap-10 px-5 pb-16 pt-6 @3xl:px-10 @4xl:grid-cols-[1fr_1fr]">
      <div className="relative mx-auto w-full max-w-[34rem]">
        <div className="relative z-10 w-[78%] shadow-[0_40px_80px_-30px_rgba(0,0,0,.7)]" {...(release ? ed(`projects.${current}`) : {})}><Picture src={release?.image} alt={release?.title ?? ""} embedded={embedded} className="aspect-square w-full" /></div>
        <div className="absolute right-0 top-[6%] w-[70%] transition-transform duration-700 hover:translate-x-4">{<Vinyl label={release?.title ?? c.name ?? ""} cover={release?.image} />}</div>
      </div>
      <div>
        <p className="fm text-[11px] uppercase tracking-[0.24em] tm" {...ed("professional_title")}>{c.professional_title}</p>
        <h1 className="fd mt-4 text-[clamp(3.4rem,10cqw,8rem)] font-[800] uppercase leading-[0.85] tracking-[-0.03em]" {...ed("name")}>{c.name}</h1>
        <p className="mt-6 max-w-[28rem] text-[1.25rem] leading-snug" {...ed("tagline")}>{c.tagline}</p>
        {release && <p className="fm mt-8 text-[12px] uppercase tracking-[0.18em]"><span className="ta">Now playing</span> — {release.title} ({release.year})</p>}
      </div>
    </section>

    {has("projects") && <section id="records" className="border-t rule px-5 py-16 @3xl:px-10">
      <h2 className="fm text-[11px] uppercase tracking-[0.24em] tm">{label("projects", "Discography")}</h2>
      <ol className="mt-6">{releases.map((item, index) => <li key={index}>
        <button type="button" onClick={() => setCurrent(index)} onMouseEnter={() => setCurrent(index)} className={`group grid w-full grid-cols-[2.5rem_4rem_1fr] items-center gap-4 border-b rule py-3 text-left transition-colors @3xl:grid-cols-[3rem_5rem_1fr_10rem_4rem] ${index === current ? "bs" : ""}`} {...ed(`projects.${index}`)}>
          <span className="fm text-[12px] tm">{index === current ? <span className="ta">▶</span> : pad(index + 1)}</span>
          <Picture src={item.image} alt="" className="aspect-square w-full" />
          <span className="min-w-0"><span className="fd block truncate text-[1.4rem] font-[700] leading-tight">{item.title}</span><span className="block truncate text-[13px] tm">{item.description}</span></span>
          <span className="fm hidden text-[12px] uppercase tracking-[0.14em] tm @3xl:block">{item.category} · {item.client}</span>
          <span className="fm hidden text-right text-[12px] tm @3xl:block">{item.year}</span>
        </button>
      </li>)}</ol>
    </section>}

    {has("about") && <section className="grid gap-10 border-t rule px-5 py-16 @3xl:grid-cols-[1fr_2fr] @3xl:px-10">
      <h2 className="fm text-[11px] uppercase tracking-[0.24em] tm">{label("about", "Liner notes")}</h2>
      <div className="columns-1 gap-10 text-[1.05rem] @4xl:columns-2">{paragraphs(c).map(({ text, index }) => <p key={index} className="mb-4 break-inside-avoid pretty" {...ed(`summary.${index}`)}>{text}</p>)}
        {has("stats") && <p className="fm mt-6 break-inside-avoid text-[12px] uppercase tracking-[0.16em] tm">{(c.stats ?? []).map((stat) => `${stat.value} ${stat.label}`).join(" · ")}</p>}</div>
    </section>}

    {has("highlights") && <section id="dates" className="border-t rule px-5 py-16 @3xl:px-10">
      <h2 className="fm text-[11px] uppercase tracking-[0.24em] tm">{label("highlights", "Live")}</h2>
      <ul className="mt-6">{(c.highlights ?? []).map((item, index) => <Reveal as="li" key={index} delay={index * 50}><div className="grid grid-cols-[7rem_1fr_auto] items-baseline gap-4 border-b rule py-4" {...ed(`highlights.${index}`)}><span className="fm text-[13px] ta">{item.year}</span><span className="fd text-[1.3rem] font-[700]">{item.title}{item.detail && <span className="ml-2 text-[13px] font-normal tm">{item.detail}</span>}</span>{item.url ? <a href={item.url} {...external(item.url)} className="fm rounded-full border rule px-3 py-1 text-[11px] uppercase tracking-[0.14em] hover:border-[var(--t-fg)]">Tickets</a> : <span className="fm text-[11px] uppercase tracking-[0.14em] tm">On sale soon</span>}</div></Reveal>)}</ul>
    </section>}

    {has("experience") && <section className="border-t rule px-5 py-16 @3xl:px-10">
      <h2 className="fm text-[11px] uppercase tracking-[0.24em] tm">{label("experience", "Credits")}</h2>
      <ul className="mt-6 columns-1 gap-10 @3xl:columns-2">{(c.experience ?? []).map((role, index) => <li key={index} className="mb-5 break-inside-avoid" {...ed(`experience.${index}`)}><p className="fm text-[11px] uppercase tracking-[0.18em] tm">{role.job_title} · {role.start_date}</p><p className="fd text-[1.3rem] font-[700]">{role.company}</p>{role.description && <p className="text-[14px] tm">{role.description}</p>}</li>)}</ul>
    </section>}

    {has("contact") && <footer id="booking" className="border-t rule px-5 py-20 @3xl:px-10">
      <p className="fm text-[11px] uppercase tracking-[0.24em] tm">{c.availability ?? "Booking & press"}</p>
      <a href={c.email ? `mailto:${c.email}` : "#"} className="fd mt-4 block break-all text-[clamp(2rem,6cqw,4.6rem)] font-[800] uppercase leading-none hover-a" {...ed("email")}>{c.email}</a>
      <p className="fm mt-8 flex flex-wrap gap-6 text-[11px] uppercase tracking-[0.2em]">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover-a">{link.label} ↗</a>)}</p>
    </footer>}
  </StudioRoot>;
}

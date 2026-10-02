"use client";

import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/syne";
import "@fontsource-variable/space-grotesk";
import "@fontsource/ibm-plex-mono/400.css";
import { useState } from "react";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";

const SIZES = [144, 96, 64, 40, 24];
const WEIGHTS = [200, 300, 400, 500, 600, 700, 800];

export default function Specimen({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const [sample, setSample] = useState("");
  const [size, setSize] = useState(72);
  const [weight, setWeight] = useState(700);
  const glyphs = [...new Set((c.name ?? "").replace(/\s/g, ""))];
  const text = sample || c.tagline || c.name || "";

  return <StudioRoot studio={studio} className="text-[15px] leading-[1.5]">
    <header className="fm flex items-center justify-between border-b rule px-5 py-3 text-[11px] uppercase tracking-[0.16em] @3xl:px-8"><span>{c.name} — Specimen</span><span className="hidden tm @2xl:inline">Vol. {new Date().getFullYear()} · {c.location}</span><a href="#license" className="hover-a">Licences →</a></header>

    <section className="grid border-b rule @4xl:grid-cols-[1.1fr_1fr]">
      <div className="relative grid min-h-[22rem] place-items-center overflow-hidden border-b rule @4xl:border-b-0 @4xl:border-r">
        <span className="fd select-none text-[clamp(10rem,34cqw,26rem)] font-[800] leading-none tracking-[-0.06em]">{(c.name ?? "Aa").charAt(0)}<span className="ta">{(c.name ?? "Aa").charAt(1)}</span></span>
        {["top-6", "bottom-6"].map((position) => <span key={position} className={`absolute inset-x-0 ${position} border-t border-dashed rule-strong`} />)}
        <span className="fm absolute left-4 top-3 text-[10px] uppercase tracking-[0.2em] tm">Cap height</span><span className="fm absolute bottom-7 left-4 text-[10px] uppercase tracking-[0.2em] tm">Baseline</span>
      </div>
      <div className="flex flex-col justify-between p-5 @3xl:p-8">
        <div>
          <p className="fm text-[11px] uppercase tracking-[0.2em] tm">Family</p>
          <h1 className="fd mt-2 text-[clamp(2.6rem,6cqw,5rem)] font-[750] leading-[0.92] tracking-[-0.04em]" {...ed("name")}>{c.name}</h1>
          <p className="mt-3 text-[1.15rem]" {...ed("professional_title")}>{c.professional_title}</p>
        </div>
        <dl className="fm mt-10 grid grid-cols-2 gap-4 text-[11px] uppercase tracking-[0.14em]">
          <div><dt className="tm">Styles</dt><dd className="mt-1 text-[1.4rem] tracking-normal">{(c.skills ?? []).length}</dd></div>
          <div><dt className="tm">Glyphs</dt><dd className="mt-1 text-[1.4rem] tracking-normal">{glyphs.length}</dd></div>
          <div><dt className="tm">Released</dt><dd className="mt-1 normal-case tracking-normal">{c.experience?.at(-1)?.start_date ?? "—"}</dd></div>
          <div><dt className="tm">Status</dt><dd className="mt-1 normal-case tracking-normal">{c.availability ?? "Available"}</dd></div>
        </dl>
      </div>
    </section>

    <section className="border-b rule px-5 py-10 @3xl:px-8" aria-label="Type tester">
      <div className="fm flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] uppercase tracking-[0.14em] tm">
        <span>Type tester</span>
        <label className="flex items-center gap-2">Size <input type="range" min={24} max={160} value={size} onChange={(event) => setSize(Number(event.target.value))} className="accent-[var(--t-accent)]" /> {size}px</label>
        <label className="flex items-center gap-2">Weight <input type="range" min={200} max={800} step={100} value={weight} onChange={(event) => setWeight(Number(event.target.value))} className="accent-[var(--t-accent)]" /> {weight}</label>
      </div>
      <textarea aria-label="Type your own text" value={text} onChange={(event) => setSample(event.target.value)} rows={2} spellCheck={false} className="fd mt-6 w-full resize-none bg-transparent leading-[0.98] tracking-[-0.03em] outline-none" style={{ fontSize: `min(${size}px, 14cqw)`, fontWeight: weight }} />
    </section>

    {has("about") && <section className="grid gap-8 border-b rule px-5 py-14 @3xl:grid-cols-[14rem_1fr] @3xl:px-8">
      <h2 className="fm text-[11px] uppercase tracking-[0.2em] tm">{label("about", "About the family")}</h2>
      <div className="columns-1 gap-10 text-[1.1rem] @4xl:columns-2">{paragraphs(c).map(({ text: paragraph, index }) => <p key={index} className="mb-4 break-inside-avoid pretty" {...ed(`summary.${index}`)}>{paragraph}</p>)}</div>
    </section>}

    <section className="border-b rule px-5 py-12 @3xl:px-8" aria-label="Waterfall">
      {SIZES.map((px) => <div key={px} className="grid grid-cols-[4rem_1fr] items-baseline gap-4 overflow-hidden border-b rule py-2 last:border-b-0">
        <span className="fm text-[11px] tm">{px}px</span>
        <span className="fd truncate font-[650] leading-[1.05] tracking-[-0.03em]" style={{ fontSize: `min(${px}px, ${px / 10}cqw)` }}>{c.professional_title}</span>
      </div>)}
    </section>

    {has("skills") && <section className="border-b rule px-5 py-12 @3xl:px-8">
      <h2 className="fm text-[11px] uppercase tracking-[0.2em] tm">{label("skills", "Styles")}</h2>
      <ul className="mt-6 grid gap-x-8 @3xl:grid-cols-2" {...ed("skills")}>{(c.skills ?? []).map((skill, index) => <li key={skill} className="flex items-baseline justify-between gap-4 border-b rule py-3"><span className="fd text-[clamp(1.6rem,3.4cqw,2.6rem)] leading-none tracking-[-0.03em]" style={{ fontWeight: WEIGHTS[index % WEIGHTS.length] }}>{skill}</span><span className="fm text-[11px] tm">{WEIGHTS[index % WEIGHTS.length]}</span></li>)}</ul>
    </section>}

    {has("projects") && <section className="border-b rule px-5 py-12 @3xl:px-8">
      <h2 className="fm text-[11px] uppercase tracking-[0.2em] tm">{label("projects", "In use")}</h2>
      <div className="mt-6 grid gap-5 @3xl:grid-cols-2">{(c.projects ?? []).map((project, index) => <Reveal key={index} as="article" className="group border rule">
        <div {...ed(`projects.${index}`)}>
          <div className="relative overflow-hidden"><Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="aspect-[4/3] w-full transition-transform duration-700 group-hover:scale-[1.04]" />
            <span className="fd absolute left-4 top-2 text-[5.5rem] font-[800] leading-none text-white mix-blend-difference">{project.title?.charAt(0)}</span></div>
          <div className="grid grid-cols-[1fr_auto] gap-4 p-4"><div><h3 className="fd text-[1.5rem] font-[700] leading-tight tracking-[-0.02em]">{project.title}</h3><p className="mt-1 text-[14px] tm pretty">{project.description}</p></div><p className="fm text-right text-[11px] uppercase tracking-[0.14em] tm">{project.client}<br />{project.year}</p></div>
        </div>
      </Reveal>)}</div>
    </section>}

    <section className="border-b rule px-5 py-12 @3xl:px-8" aria-label="Character set">
      <h2 className="fm text-[11px] uppercase tracking-[0.2em] tm">Character set</h2>
      <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(4.2rem,1fr))] border-l border-t rule">{glyphs.map((glyph) => <span key={glyph} className="fd grid aspect-square place-items-center border-b border-r rule text-[2rem] font-[600] transition-colors hover:bg-[var(--t-accent)] hover:text-[var(--t-bg)]">{glyph}</span>)}</div>
    </section>

    {has("services") && <section id="license" className="border-b rule px-5 py-12 @3xl:px-8">
      <h2 className="fm text-[11px] uppercase tracking-[0.2em] tm">{label("services", "Licences")}</h2>
      <ul className="mt-6">{(c.services ?? []).map((service, index) => <li key={index} className="grid gap-2 border-t rule py-5 @3xl:grid-cols-[1fr_2fr_10rem]" {...ed(`services.${index}`)}><span className="fd text-[1.5rem] font-[700] tracking-[-0.02em]">{service.title}</span><span className="tm pretty">{service.description}</span><span className="fm text-[13px] @3xl:text-right">{service.price}</span></li>)}</ul>
    </section>}

    {has("highlights") && <section className="border-b rule px-5 py-12 @3xl:px-8"><h2 className="fm text-[11px] uppercase tracking-[0.2em] tm">{label("highlights", "Awards")}</h2>
      <ul className="mt-4 text-[1.1rem]">{(c.highlights ?? []).map((item, index) => <li key={index} className="flex gap-4 border-t rule py-2.5" {...ed(`highlights.${index}`)}><span className="fm w-14 shrink-0 text-[12px] leading-7 tm">{item.year}</span>{item.title}{item.detail && <span className="tm">— {item.detail}</span>}</li>)}</ul></section>}

    {has("contact") && <footer className="px-5 py-16 @3xl:px-8">
      <a href={c.email ? `mailto:${c.email}` : "#"} className="group inline-flex items-center gap-4 rounded-full ba px-7 py-4 text-[1.1rem] font-semibold text-[var(--t-bg)]" {...ed("email")}>Request the full specimen <span className="transition-transform group-hover:translate-x-1">→</span></a>
      <p className="fm mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[12px] uppercase tracking-[0.14em]">{contactLinks(c).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover-a">{link.label}</a>)}</p>
    </footer>}
  </StudioRoot>;
}

"use client";

import "@fontsource-variable/caveat";
import "@fontsource-variable/literata";
import "@fontsource-variable/work-sans";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, firstName, paragraphs, useStudio, type StudioProps } from "../kit";

const TILTS = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "rotate-[0.5deg]", "-rotate-[1.5deg]"];
const NOTE_COLOURS = ["#fff3a8", "#ffd6e0", "#cdeefc", "#d8f5c9"];

/** A strip of masking tape. */
const Tape = ({ className = "" }: { className?: string }) => <span aria-hidden className={`absolute z-10 h-6 w-20 bg-[#e8dcb5]/80 shadow-sm [mask-image:linear-gradient(90deg,transparent_0,black_4px,black_calc(100%-4px),transparent)] ${className}`} />;

/** A pencil squiggle under headings. */
const Squiggle = () => <svg viewBox="0 0 200 14" className="mt-1 h-3 w-40 text-[var(--t-accent)]" aria-hidden><path d="M2 9 C 30 2, 50 14, 80 7 S 140 2, 198 8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>;

/** A hand-drawn arrow. */
const Arrow = ({ className = "" }: { className?: string }) => <svg viewBox="0 0 120 60" className={`h-12 w-24 text-[var(--t-fg)] ${className}`} aria-hidden><path d="M4 50 C 30 10, 70 8, 108 22 M108 22 l-14 -10 M108 22 l-12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;

export default function Sketchbook({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const hand = "font-[family-name:var(--t-display)]";

  return <StudioRoot studio={studio} className="paper text-[16.5px] leading-[1.7]">
    <div className="mx-auto max-w-[78rem] px-5 py-10 @3xl:px-10">
      <div className="relative overflow-hidden rounded-[6px] bs shadow-[0_30px_60px_-30px_rgba(0,0,0,.35),0_0_0_1px_rgba(0,0,0,.04)]" style={{ backgroundImage: "linear-gradient(transparent 31px, color-mix(in oklab,var(--t-accent) 14%,transparent) 32px)", backgroundSize: "100% 32px" }}>
        <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-16 -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(0,0,0,.08),transparent)] @4xl:block" aria-hidden />

        <section className="grid gap-12 p-6 @3xl:p-12 @4xl:grid-cols-2 @4xl:gap-24">
          <div className="relative">
            <p className={`${hand} text-[1.6rem] ta -rotate-2`}>hello! I’m</p>
            <h1 className={`${hand} text-[clamp(4rem,11cqw,8.5rem)] font-[700] leading-[0.82]`} {...ed("name")}>{c.name}</h1>
            <p className="mt-6 text-[1.15rem]" {...ed("professional_title")}>{c.professional_title}{c.location && <span className="tm"> — {c.location}</span>}</p>
            <p className={`${hand} mt-6 max-w-[26rem] text-[1.9rem] leading-[1.1]`} {...ed("tagline")}>{c.tagline}</p>
            <Arrow className="absolute -bottom-6 right-8 hidden rotate-12 @4xl:block" />
          </div>
          {has("about") && <div className="space-y-4 @4xl:pt-16">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}
            {c.availability && <p className={`${hand} inline-block -rotate-1 rounded-sm px-3 py-1 text-[1.5rem]`} style={{ background: NOTE_COLOURS[0] }} {...ed("availability")}>✎ {c.availability}</p>}</div>}
        </section>

        {has("gallery") && <section className="px-6 pb-16 @3xl:px-12">
          <h2 className={`${hand} text-[2.6rem] font-[700]`}>{label("gallery", "from the last few pages")}</h2><Squiggle />
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 @3xl:grid-cols-4">{(c.gallery ?? []).map((item, index) => <Reveal key={index} delay={(index % 4) * 70} className={`relative ${TILTS[index % TILTS.length]} ${index % 3 === 1 ? "@3xl:mt-10" : ""}`}>
            <Tape className={index % 2 ? "-right-4 top-3 rotate-45" : "-left-5 -top-2 -rotate-12"} />
            <figure className="bg-white p-2.5 pb-3 shadow-[0_8px_20px_-8px_rgba(0,0,0,.35)] transition-transform duration-300 hover:rotate-0 hover:scale-[1.03]" {...ed(`gallery.${index}`)}>
              <Picture src={item.image} alt={item.caption ?? ""} embedded={embedded} className="aspect-[4/5] w-full" />
              <figcaption className={`${hand} mt-2 text-[1.25rem] leading-tight text-[#2a2722]`}>{item.caption?.split(",")[0]}{item.year && <span className="text-[#8a8170]"> ’{item.year.slice(-2)}</span>}</figcaption>
            </figure>
          </Reveal>)}</div>
        </section>}

        {has("projects") && <section className="grid gap-10 px-6 pb-16 @3xl:grid-cols-2 @3xl:px-12">
          <div className="@3xl:col-span-2"><h2 className={`${hand} text-[2.6rem] font-[700]`}>{label("projects", "bigger projects")}</h2><Squiggle /></div>
          {(c.projects ?? []).map((project, index) => <article key={index} className={`relative ${index % 2 ? "rotate-1" : "-rotate-1"}`} {...ed(`projects.${index}`)}>
            <Tape className="left-1/2 -top-3 -translate-x-1/2 rotate-2" />
            <div className="grid gap-4 bg-white p-4 shadow-[0_10px_24px_-10px_rgba(0,0,0,.3)] @xl:grid-cols-[10rem_1fr]">
              <Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="aspect-square w-full" />
              <div className="text-[#2a2722]"><h3 className={`${hand} text-[2rem] font-[700] leading-none`}>{project.title}</h3><p className="mt-1 text-[13px] text-[#857c6c]">{[project.category, project.client, project.year].filter(Boolean).join(" · ")}</p><p className="mt-2 text-[15px] pretty">{project.description}</p></div>
            </div>
          </article>)}
        </section>}

        <section className="grid gap-12 px-6 pb-16 @3xl:grid-cols-2 @3xl:px-12">
          {has("skills") && <div><h2 className={`${hand} text-[2.4rem] font-[700]`}>{label("skills", "tools I reach for")}</h2><Squiggle />
            <ul className="mt-5 flex flex-wrap gap-3" {...ed("skills")}>{(c.skills ?? []).map((skill, index) => <li key={skill} className={`${hand} rounded-[50%] border-2 border-[var(--t-fg)] px-4 py-1 text-[1.4rem] ${TILTS[index % TILTS.length]}`}>{skill}</li>)}</ul></div>}
          {has("highlights") && <div><h2 className={`${hand} text-[2.4rem] font-[700]`}>{label("highlights", "things that happened")}</h2><Squiggle />
            <ul className="mt-5 space-y-2">{(c.highlights ?? []).map((item, index) => <li key={index} className="flex gap-3" {...ed(`highlights.${index}`)}><span className={`${hand} text-[1.6rem] leading-none ta`}>✓</span><span><b className="font-semibold">{item.title}</b>{item.detail && <span className="tm"> · {item.detail}</span>} <span className={`${hand} text-[1.2rem] tm`}>({item.year})</span></span></li>)}</ul></div>}
        </section>

        {has("contact") && <footer className="relative px-6 pb-16 @3xl:px-12">
          <div className="relative inline-block -rotate-1 p-6 pr-10 shadow-[0_10px_24px_-10px_rgba(0,0,0,.3)]" style={{ background: NOTE_COLOURS[2] }}>
            <p className={`${hand} text-[2rem] font-[700] text-[#1e2b2a]`}>write to {firstName(c.name).toLowerCase() || "me"} ↓</p>
            <a href={c.email ? `mailto:${c.email}` : "#"} className="mt-1 block text-[1.15rem] font-medium text-[#1e2b2a] underline decoration-wavy decoration-[var(--t-accent)] underline-offset-4" {...ed("email")}>{c.email}</a>
            <p className="mt-3 flex flex-wrap gap-4 text-[14px] text-[#1e2b2a]">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="underline">{link.label}</a>)}</p>
          </div>
        </footer>}
      </div>
    </div>
  </StudioRoot>;
}

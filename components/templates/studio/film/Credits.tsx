"use client";

import "@fontsource/courier-prime/400.css";
import "@fontsource/courier-prime/700.css";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/bodoni-moda";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, pad, paragraphs, useStudio, type StudioProps } from "../kit";

export default function Credits({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const films = c.projects ?? [];
  const roll = [
    ...(c.experience ?? []).map((role) => ({ role: role.job_title, name: role.company })),
    ...(c.testimonials ?? []).map((item) => ({ role: "Kind words", name: `${item.name}` })),
    ...(c.skills ?? []).map((skill) => ({ role: "Craft", name: skill })),
  ];

  return <StudioRoot studio={studio} className="text-[15px] leading-relaxed">
    <header className="fm flex items-center justify-between px-5 py-5 text-[12px] uppercase tracking-[0.2em] @3xl:px-10"><span>{c.name}</span><nav className="flex gap-6"><a href="#films" className="hover-a">Films</a><a href="#contact" className="hover-a">Contact</a></nav></header>

    <section className="px-5 @3xl:px-10">
      {films[0] && <div className="relative bg-black" {...ed("projects.0")}>
        <div className="h-[6cqw] bg-black" /><Picture src={films[0].image} alt={films[0].title ?? ""} embedded={embedded} className="aspect-[2.39/1] w-full" /><div className="h-[6cqw] bg-black" />
        <p className="fm absolute bottom-[1.5cqw] left-0 right-0 text-center text-[clamp(11px,1.4cqw,15px)] text-[#f4e9c8]">“{c.tagline}”</p>
      </div>}
      <div className="grid gap-4 py-10 @3xl:grid-cols-[1fr_auto] @3xl:items-end">
        <h1 className="fd text-[clamp(2.6rem,8cqw,6.5rem)] leading-[0.9] tracking-[-0.02em]" {...ed("name")}>{c.name}</h1>
        <p className="fm text-[12px] uppercase tracking-[0.2em] @3xl:text-right" {...ed("professional_title")}>{c.professional_title}<br /><span className="tm">{c.location}</span></p>
      </div>
    </section>

    {has("projects") && <section id="films" className="border-t rule px-5 py-16 @3xl:px-10">
      <h2 className="fm text-[12px] uppercase tracking-[0.24em] tm">{label("projects", "Films")}</h2>
      <div className="mt-10 space-y-20">{films.map((film, index) => <Reveal key={index} as="article" className="grid gap-8 @4xl:grid-cols-[1.6fr_1fr]">
        <div className="group relative overflow-hidden bg-black" {...ed(`projects.${index}`)}><Picture src={film.image} alt={film.title ?? ""} embedded={embedded} className="aspect-[2.39/1] w-full transition-transform duration-[1.5s] group-hover:scale-[1.03]" />
          <span className="absolute left-3 top-3 grid size-11 place-items-center rounded-full border border-white/40 text-white/90 backdrop-blur-sm transition-colors group-hover:bg-white group-hover:text-black" aria-hidden>▶</span></div>
        <div className="fm border border-[var(--t-rule-strong)] text-[12px] uppercase">
          <div className="flex h-8 overflow-hidden" aria-hidden>{Array.from({ length: 12 }, (_, i) => <span key={i} className={`h-full flex-1 -skew-x-[30deg] ${i % 2 ? "bg-[var(--t-fg)]" : "bg-[var(--t-bg)]"}`} />)}</div>
          <dl className="grid grid-cols-2">
            <div className="col-span-2 border-b border-[var(--t-rule-strong)] p-3"><dt className="text-[10px] tm">Production</dt><dd className="fd text-[1.6rem] normal-case leading-tight">{film.title}</dd></div>
            <div className="border-b border-r border-[var(--t-rule-strong)] p-3"><dt className="text-[10px] tm">Director</dt><dd>{film.role ?? c.name}</dd></div>
            <div className="border-b border-[var(--t-rule-strong)] p-3"><dt className="text-[10px] tm">For</dt><dd>{film.client ?? "—"}</dd></div>
            <div className="border-r border-[var(--t-rule-strong)] p-3"><dt className="text-[10px] tm">Roll / Scene</dt><dd>{pad(index + 1)} / {pad(index * 7 + 3)}</dd></div>
            <div className="p-3"><dt className="text-[10px] tm">Year</dt><dd>{film.year}</dd></div>
          </dl>
          <p className="border-t border-[var(--t-rule-strong)] p-3 font-[family-name:var(--t-text)] text-[14px] normal-case leading-relaxed">{film.description}</p>
        </div>
      </Reveal>)}</div>
    </section>}

    {has("about") && <section className="grid gap-8 border-t rule px-5 py-16 @3xl:grid-cols-[1fr_2fr] @3xl:px-10"><h2 className="fm text-[12px] uppercase tracking-[0.24em] tm">{label("about", "Director’s note")}</h2><div className="fd space-y-4 text-[1.4rem] leading-snug">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div></section>}

    {has("highlights") && <section className="border-t rule px-5 py-16 @3xl:px-10"><h2 className="fm text-[12px] uppercase tracking-[0.24em] tm">{label("highlights", "Festivals & awards")}</h2>
      <ul className="mt-8 grid gap-6 @3xl:grid-cols-3">{(c.highlights ?? []).map((item, index) => <li key={index} className="flex flex-col items-center px-4 text-center" {...ed(`highlights.${index}`)}>
        <svg viewBox="0 0 120 50" className="h-10 w-28 ta" aria-hidden><path d="M20 45 C 8 35, 6 18, 14 5 M100 45 C 112 35, 114 18, 106 5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M14 12 l-6 -4 M12 22 l-7 -2 M13 32 l-7 1 M106 12 l6 -4 M108 22 l7 -2 M107 32 l7 1" stroke="currentColor" strokeWidth="2" /></svg>
        <p className="fm mt-1 text-[11px] uppercase tracking-[0.2em] tm">{item.year}</p><p className="fd text-[1.3rem] leading-tight">{item.title}</p>{item.detail && <p className="text-[13px] tm">{item.detail}</p>}
      </li>)}</ul></section>}

    {roll.length > 0 && <section aria-label="Credits" className="relative h-[28rem] overflow-hidden border-t rule bg-black text-[#ecebe6]">
      <div className="absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-black to-transparent" /><div className="absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black to-transparent" />
      <div className="mx-auto max-w-[36rem] px-5 [animation:studio-roll_40s_linear_infinite] hover:[animation-play-state:paused]">{[0, 1].map((copy) => <dl key={copy} className="fm space-y-3 py-10 text-[13px] uppercase tracking-[0.14em]">{roll.map((line, index) => <div key={index} className="grid grid-cols-2 gap-6"><dt className="text-right text-[#8a8780]">{line.role}</dt><dd>{line.name}</dd></div>)}</dl>)}</div>
    </section>}

    {has("contact") && <footer id="contact" className="border-t rule px-5 py-20 text-center @3xl:px-10">
      <p className="fm text-[12px] uppercase tracking-[0.24em] tm">{c.availability ?? "Representation & enquiries"}</p>
      <a href={c.email ? `mailto:${c.email}` : "#"} className="fd mt-4 inline-block break-all text-[clamp(2rem,5cqw,3.8rem)] leading-none hover-a" {...ed("email")}>{c.email}</a>
      <p className="fm mt-8 flex flex-wrap justify-center gap-6 text-[12px] uppercase tracking-[0.2em]">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover-a">{link.label}</a>)}</p>
      <p className="fm mt-16 text-[11px] uppercase tracking-[0.3em] tm">The end</p>
    </footer>}
  </StudioRoot>;
}

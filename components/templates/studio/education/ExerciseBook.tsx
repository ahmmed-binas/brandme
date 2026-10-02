"use client";

import "@fontsource-variable/figtree";
import "@fontsource-variable/caveat";
import "@fontsource-variable/bricolage-grotesque";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";

const LINE = 32;
const MARK = "#d23f3f";
const hand = "font-['Caveat_Variable',cursive]";

/** Feint ruling every 32px with a red margin, like a school exercise book. */
const ruled = {
  backgroundImage: `linear-gradient(90deg, transparent 4.2rem, ${MARK}66 4.2rem, ${MARK}66 calc(4.2rem + 1px), transparent calc(4.2rem + 1px)), repeating-linear-gradient(180deg, transparent 0 ${LINE - 1}px, color-mix(in oklab, var(--t-accent) 22%, transparent) ${LINE - 1}px ${LINE}px)`,
};

function Lesson({ number, title, children, id }: { number: number; title: string; children: React.ReactNode; id?: string }) {
  return <section id={id} className="relative py-8 pl-[5.2rem] pr-5 @3xl:pr-10">
    <span aria-hidden className={`${hand} absolute left-3 top-8 text-[1.4rem] leading-[32px] tm`}>{number}.</span>
    <h2 className={`${hand} inline-block text-[2.3rem] font-[700] leading-[32px]`}>{title}<span aria-hidden className="block h-[5px] border-y border-current opacity-70" /></h2>
    <div className="mt-8">{children}</div>
  </section>;
}

const Margin = ({ children, className = "" }: { children: React.ReactNode; className?: string }) =>
  <span aria-hidden className={`${hand} pointer-events-none absolute hidden rotate-[-6deg] text-[1.5rem] leading-none @4xl:block ${className}`} style={{ color: MARK }}>{children}</span>;

export default function ExerciseBook({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const order = (["about", "projects", "services", "experience", "highlights", "testimonials"] as const).filter(has);
  const n = (section: (typeof order)[number]) => order.indexOf(section) + 2;

  return <StudioRoot studio={studio} className="text-[16px] leading-[32px]">
    {/* The cover: a coloured board with a white name label. */}
    <header className="ba px-5 pb-10 pt-8 text-[var(--t-bg)] @3xl:px-10">
      <h1 className="sr-only">{[c.name, c.professional_title].filter(Boolean).join(", ")}</h1>
      <div className="flex items-center justify-between text-[12px] font-semibold uppercase tracking-[0.2em] opacity-80"><span>Exercise book</span><span>{c.location}</span></div>
      <div className="mx-auto mt-8 max-w-[34rem] rotate-[-1deg] rounded-[14px] border-2 border-[var(--t-fg)] bg-[#fffef9] p-6 text-[#1f2a44] shadow-[0_14px_0_-6px_rgba(0,0,0,.18)]">
        {[["Name", "name", c.name], ["Subject", "professional_title", c.professional_title], ["Where", "location", c.location]].map(([field, path, value]) => <p key={field} className="flex items-baseline gap-3 border-b border-dashed border-[#1f2a44]/35 py-1">
          <span className="w-20 shrink-0 text-[12px] font-semibold uppercase tracking-[0.16em] opacity-60">{field}</span>
          <span className={`${hand} min-w-0 text-[clamp(1.6rem,4.4cqw,2.3rem)] font-[600] leading-tight`} {...ed(path!)}>{value}</span>
        </p>)}
      </div>
    </header>

    <div className="relative" style={ruled}>
      <section className="relative py-8 pl-[5.2rem] pr-5 @3xl:pr-10">
        <span aria-hidden className={`${hand} absolute left-3 top-8 text-[1.4rem] tm`}>1.</span>
        <p className={`${hand} max-w-[40rem] text-[clamp(2.1rem,5.4cqw,3.4rem)] font-[600] leading-[1.15]`} {...ed("tagline")}>{c.tagline}</p>
        {c.availability && <p className="mt-6 inline-block rounded-[6px] bg-[#fff3a6] px-3 text-[15px] text-[#1f2a44] shadow-[2px_3px_0_rgba(0,0,0,.12)]" {...ed("availability")}>{c.availability}</p>}
        <Margin className="right-10 top-10">Great start! ✓</Margin>
        {has("stats") && <ul className="mt-10 flex flex-wrap gap-6">{(c.stats ?? []).map((stat, index) => <li key={index} className="relative grid size-32 place-items-center text-center" {...ed(`stats.${index}`)}>
          <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 size-full drop-shadow-[0_3px_0_rgba(0,0,0,.15)]" style={{ rotate: `${(index % 3) * 7 - 7}deg` }}><path d="M50 3 61 36 96 36 68 57 79 91 50 70 21 91 32 57 4 36 39 36Z" fill="#f4c430" stroke="#c99a10" strokeWidth="2" strokeLinejoin="round" /></svg>
          <span className="relative mt-3 text-[#3a2a00]"><b className="block text-[1.05rem] font-bold leading-tight">{stat.value}</b><span className="block max-w-[5.5rem] text-[10px] font-semibold uppercase leading-tight">{stat.label}</span></span>
        </li>)}</ul>}
      </section>

      {has("about") && <Lesson number={n("about")} title={label("about", "About me")}>
        <div className="max-w-[40rem] space-y-[32px]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
        {has("skills") && <p className="mt-8 max-w-[40rem]"><span className={`${hand} mr-2 text-[1.4rem]`}>I teach:</span>{(c.skills ?? []).map((skill, index) => <span key={skill}><span className="bg-[linear-gradient(transparent_55%,#fff3a6_55%)] px-0.5 text-[var(--t-fg)]">{skill}</span>{index < (c.skills ?? []).length - 1 ? ", " : ""}</span>)}</p>}
      </Lesson>}

      {has("projects") && <Lesson number={n("projects")} title={label("projects", "Things we made in class")}>
        <div className="columns-1 gap-10 @3xl:columns-2">{(c.projects ?? []).map((project, index) => <Reveal key={index} delay={(index % 2) * 80} className="mb-10 break-inside-avoid">
          <article className="relative bg-[var(--t-bg)] p-5 shadow-[0_10px_24px_-14px_rgba(0,0,0,.45)]" style={{ rotate: `${index % 2 ? 1 : -1}deg` }} {...ed(`projects.${index}`)}>
            <span aria-hidden className="absolute -top-2 left-6 h-3 w-10 rounded-[2px] border border-[#9aa3ad] bg-gradient-to-b from-[#e9edf1] to-[#b9c1c9]" />
            {project.image && <Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="mb-4 aspect-[16/10] w-full" />}
            <p className="text-[12px] font-semibold uppercase leading-6 tracking-[0.14em] tm">{[project.category, project.year].filter(Boolean).join(" · ")}</p>
            <h3 className="fd text-[1.25rem] font-bold leading-7">{project.title}</h3>
            <p className="mt-2 text-[15px] leading-6 pretty">{project.description}</p>
            {project.live_url && <a href={project.live_url} {...external(project.live_url)} className="mt-2 inline-block text-[14px] font-semibold ta">Open it →</a>}
          </article>
        </Reveal>)}</div>
      </Lesson>}

      {has("services") && <Lesson number={n("services")} title={label("services", "Lessons you can book")}>
        <div className="overflow-x-auto"><table className="w-full min-w-[30rem] border-collapse bg-[var(--t-bg)] text-left text-[15px] leading-6 shadow-[0_0_0_2px_var(--t-fg)]">
          <thead><tr className="ba text-[var(--t-bg)]"><th className="px-4 py-2 font-semibold">Lesson</th><th className="px-4 py-2 font-semibold">What we do</th><th className="px-4 py-2 text-right font-semibold">Cost</th></tr></thead>
          <tbody>{(c.services ?? []).map((service, index) => <tr key={index} className="border-t-2 border-[var(--t-fg)] align-top" {...ed(`services.${index}`)}><td className="px-4 py-3 font-semibold">{service.title}</td><td className="px-4 py-3 tm pretty">{service.description}</td><td className={`${hand} whitespace-nowrap px-4 py-3 text-right text-[1.5rem]`}>{service.price}</td></tr>)}</tbody>
        </table></div>
      </Lesson>}

      {has("experience") && <Lesson number={n("experience")} title={label("experience", "Where I’ve taught")}>
        <ul className="max-w-[44rem]">{(c.experience ?? []).map((role, index) => <li key={index} className="grid grid-cols-[7rem_1fr] gap-4" {...ed(`experience.${index}`)}><span className="tabular-nums tm">{[role.start_date, role.end_date].filter(Boolean).join("–")}</span><span><b className="font-semibold">{role.job_title}</b>, {role.company}{role.description && <span className="block tm">{role.description}</span>}</span></li>)}
          {(c.education ?? []).map((item, index) => <li key={`ed${index}`} className="grid grid-cols-[7rem_1fr] gap-4" {...ed(`education.${index}`)}><span className="tabular-nums tm">{item.end_date}</span><span>{item.degree}, <i>{item.school}</i></span></li>)}</ul>
      </Lesson>}

      {has("highlights") && <Lesson number={n("highlights")} title={label("highlights", "Certificates & awards")}>
        <ul className="flex flex-wrap gap-4">{(c.highlights ?? []).map((item, index) => <li key={index} className="flex max-w-[20rem] items-start gap-3 rounded-[10px] border-2 border-dashed border-[var(--t-accent)] bg-[var(--t-bg)] p-4 leading-6" {...ed(`highlights.${index}`)}>
          <svg aria-hidden viewBox="0 0 24 32" className="mt-1 h-8 w-6 shrink-0"><circle cx="12" cy="10" r="9" fill="var(--t-accent)" /><path d="M6 17 3 31l9-5 9 5-3-14" fill="var(--t-accent)" opacity=".6" /></svg>
          <span><b className="block font-semibold">{item.title}</b><span className="text-[14px] tm">{[item.detail, item.year].filter(Boolean).join(" · ")}</span></span>
        </li>)}</ul>
      </Lesson>}

      {has("testimonials") && <Lesson number={n("testimonials")} title={label("testimonials", "Notes from home")}>
        <div className="flex flex-wrap gap-8">{(c.testimonials ?? []).map((item, index) => <figure key={index} className="w-full max-w-[22rem] bg-[#fff3a6] p-6 leading-7 text-[#2b2410] shadow-[0_14px_24px_-14px_rgba(0,0,0,.5)]" style={{ rotate: `${index % 2 ? 2 : -2}deg` }} {...ed(`testimonials.${index}`)}>
          <blockquote className={`${hand} text-[1.55rem] leading-[1.15]`}>{item.quote}</blockquote><figcaption className="mt-3 text-[13px] font-semibold opacity-70">— {item.name}, {item.role}</figcaption>
        </figure>)}</div>
      </Lesson>}

      {has("contact") && <footer className="relative py-12 pl-[5.2rem] pr-5 @3xl:pr-10">
        <h2 className={`${hand} text-[2.3rem] font-[700]`}>Homework: say hello</h2>
        <a href={c.email ? `mailto:${c.email}` : "#"} className="fd mt-2 block break-all text-[clamp(1.4rem,3.6cqw,2.2rem)] font-bold underline decoration-[var(--t-accent)] decoration-[3px] underline-offset-[6px]" {...ed("email")}>{c.email}</a>
        <p className="mt-4 flex flex-wrap gap-x-6 text-[15px]">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover-a">{link.label} →</a>)}</p>
        <Margin className="right-12 top-12">10/10</Margin>
      </footer>}
    </div>
  </StudioRoot>;
}

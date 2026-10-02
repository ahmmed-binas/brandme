"use client";

import "@fontsource-variable/crimson-pro";
import "@fontsource-variable/crimson-pro/wght-italic.css";
import "@fontsource-variable/work-sans";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";

const small = "font-[family-name:var(--t-mono)] text-[11px] font-semibold uppercase tracking-[0.2em]";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** Section heading in the style of a dictionary run-on entry. */
const Entry = ({ word, kind, children }: { word: string; kind: string; children: React.ReactNode }) =>
  <section className="border-t rule py-12">
    <h2 className="text-[1.6rem]"><b className="fd font-[700]">{word}</b> <i className="tm">{kind}</i></h2>
    <div className="mt-6">{children}</div>
  </section>;

export default function Lexicon({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const surname = (c.name ?? "").trim().split(/\s+/).pop() ?? "";
  const initial = (surname || "A").charAt(0).toUpperCase();
  const senses = [{ text: c.tagline, path: "tagline" }, ...paragraphs(c).map(({ text, index }) => ({ text, path: `summary.${index}` }))].filter((sense) => sense.text?.trim());
  const books = (c.projects ?? []).map((item, index) => ({ item, index }));

  return <StudioRoot studio={studio} className="text-[18px] leading-[1.6]">
    {/* Thumb index down the page edge, the owner's letter cut deepest. */}
    <ol aria-hidden className="absolute right-0 top-28 z-10 hidden flex-col @4xl:flex">{ALPHABET.map((letter) => <li key={letter} className={`grid h-7 place-items-center rounded-l-[4px] text-[11px] font-semibold ${letter === initial ? "w-12 ba text-[var(--t-bg)]" : "w-7 bs tm"}`}>{letter}</li>)}</ol>

    <div className="mx-auto max-w-[62rem] px-5 @3xl:px-10 @4xl:pr-20">
      <header className={`flex justify-between border-b border-[var(--t-fg)] py-3 ${small} tm`}><span>{surname.toLowerCase()}</span><span>{(c.professional_title ?? "").split(/\s+/)[0]?.toLowerCase()}</span></header>

      <section className="py-14">
        <h1 className="text-[clamp(2.8rem,8cqw,5.6rem)] leading-[0.95]"><b className="fd font-[700] tracking-[-0.01em]" {...ed("name")}>{c.name}</b></h1>
        <p className="mt-4 text-[1.3rem]"><i className="tm" {...ed("professional_title")}>{c.professional_title}</i>{c.location && <span className="tm"> · <span {...ed("location")}>[{c.location}]</span></span>}</p>
        <ol className="mt-8 max-w-[44rem] space-y-4">{senses.map((sense, index) => <li key={sense.path} className="grid grid-cols-[2rem_1fr] pretty" {...ed(sense.path)}><b className="ta">{index + 1}.</b><span className={index === 0 ? "fd text-[1.5rem] italic leading-snug" : ""}>{sense.text}</span></li>)}</ol>
        {has("skills") && <p className="mt-8 max-w-[44rem]" {...ed("skills")}><span className={`${small} mr-2 ta`}>Pairs & fields</span>{(c.skills ?? []).map((skill, index) => <span key={skill}><span className="whitespace-nowrap">{skill}</span>{index < (c.skills ?? []).length - 1 && <span className="tm"> | </span>}</span>)}</p>}
        {c.availability && <p className="mt-6 italic tm" {...ed("availability")}>Usage note: {c.availability}.</p>}
        {has("stats") && <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-4">{(c.stats ?? []).map((stat, index) => <div key={index} {...ed(`stats.${index}`)}><dd className="fd text-[2.6rem] font-[600] leading-none tabular-nums">{stat.value}</dd><dt className={`${small} mt-1 tm`}>{stat.label}</dt></div>)}</dl>}
      </section>

      {has("projects") && <Entry word={label("projects", "translations")} kind="n. pl.">
        <div className="space-y-10">{books.map(({ item, index }) => <Reveal key={index}>
          <article className={`grid gap-6 ${item.image ? "@3xl:grid-cols-[9rem_1fr]" : ""}`} {...ed(`projects.${index}`)}>
            {item.image && <Picture src={item.image} alt={item.title ?? ""} embedded={embedded} className="aspect-[2/3] w-36 shadow-[6px_8px_0_var(--t-surface)] @3xl:w-full" />}
            <div>
              <p className={`${small} tm`}>{[item.category, item.year].filter(Boolean).join(" · ")}</p>
              <h3 className="fd mt-2 text-[1.7rem] italic leading-tight">{item.title}</h3>
              <p className="mt-1 text-[16px] tm">{[item.role, item.client].filter(Boolean).join(" — ")}</p>
              <p className="mt-3 max-w-[38rem] pretty">{item.description}</p>
            </div>
          </article>
        </Reveal>)}</div>
      </Entry>}

      {has("services") && <Entry word={label("services", "rates")} kind="n. pl.">
        <dl className="divide-y divide-[var(--t-rule)]">{(c.services ?? []).map((service, index) => <div key={index} className="grid gap-1 py-4 @3xl:grid-cols-[14rem_1fr_auto] @3xl:gap-6" {...ed(`services.${index}`)}><dt className="fd font-[700]">{service.title}</dt><dd className="tm pretty">{service.description}</dd><dd className="whitespace-nowrap tabular-nums ta">{service.price}</dd></div>)}</dl>
      </Entry>}

      {has("testimonials") && <Entry word={label("testimonials", "citations")} kind="n. pl.">
        <div className="space-y-8">{(c.testimonials ?? []).map((item, index) => <blockquote key={index} className="border-l-2 border-[var(--t-accent)] pl-5" {...ed(`testimonials.${index}`)}><p className="fd text-[1.35rem] italic leading-snug">“{item.quote}”</p><footer className="mt-2 text-[15px] tm">— {item.name}, <i>{item.role}</i></footer></blockquote>)}</div>
      </Entry>}

      {(has("experience") || has("education")) && <Entry word={label("experience", "training & practice")} kind="n.">
        <ul className="space-y-3">
          {(c.experience ?? []).map((role, index) => <li key={`x${index}`} {...ed(`experience.${index}`)}><b className="font-[600]">{role.job_title}</b>, {role.company} <span className="tm">({[role.start_date, role.end_date].filter(Boolean).join("–")})</span></li>)}
          {(c.education ?? []).map((item, index) => <li key={`e${index}`} {...ed(`education.${index}`)}><b className="font-[600]">{item.degree}</b>, <i>{item.school}</i>{item.end_date && <span className="tm"> ({item.end_date})</span>}</li>)}
        </ul>
      </Entry>}

      {has("highlights") && <Entry word={label("highlights", "see also")} kind="">
        <ul className="space-y-2">{(c.highlights ?? []).map((item, index) => <li key={index} {...ed(`highlights.${index}`)}><span className="ta">→ </span>{item.url ? <a href={item.url} {...external(item.url)} className="underline underline-offset-4 hover-a">{item.title}</a> : item.title}{(item.detail || item.year) && <span className="tm"> · {[item.detail, item.year].filter(Boolean).join(", ")}</span>}</li>)}</ul>
      </Entry>}

      {has("contact") && <footer className="border-t-2 border-[var(--t-fg)] py-14">
        <p className="text-[1.6rem]"><b className="fd font-[700]">con·tact</b> <span className="tm">/ˈkɒn.tækt/</span> <i className="tm">v.</i></p>
        <p className="mt-4 max-w-[40rem]"><b className="ta">1.</b> To write to <a href={c.email ? `mailto:${c.email}` : "#"} className="fd break-all text-[1.25rem] font-[600] underline decoration-[var(--t-accent)] underline-offset-4" {...ed("email")}>{c.email}</a>{c.phone && <> or call <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="whitespace-nowrap tabular-nums hover-a" {...ed("phone")}>{c.phone}</a></>}.</p>
        <p className="mt-3 flex flex-wrap gap-x-6"><b className="ta">2.</b>{contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="italic hover-a">{link.label}</a>)}</p>
      </footer>}
    </div>
  </StudioRoot>;
}

"use client";

import "@fontsource-variable/inter-tight";
import "@fontsource-variable/jetbrains-mono";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, initials, pad, paragraphs, useStudio, type StudioProps } from "../kit";

/** Splits "Problem: … Bet: … Outcome: …" into its parts; anything else stays one paragraph. */
function briefParts(text = ""): Array<[string, string]> {
  const parts = [...text.matchAll(/(Problem|Bet|Outcome|Result|Approach|Context)\s*:\s*([^]*?)(?=\s(?:Problem|Bet|Outcome|Result|Approach|Context)\s*:|$)/g)].map((match) => { const body = match[2]!.trim(); return [match[1]!, body.charAt(0).toUpperCase() + body.slice(1)] as [string, string]; });
  return parts.length >= 2 ? parts : [["", text]];
}

const Mono = ({ children, className = "" }: { children: React.ReactNode; className?: string }) =>
  <span className={`font-[family-name:var(--t-mono)] text-[12px] uppercase tracking-[0.08em] ${className}`}>{children}</span>;

export default function Roadmap({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const roles = c.experience ?? [];

  return <StudioRoot studio={studio} className="text-[16px] leading-[1.6]">
    <div className="mx-auto max-w-[76rem] px-5 @3xl:px-10">
      <header className="flex items-center justify-between border-b rule py-4"><Mono className="tm">{c.name} / portfolio.md</Mono><nav className="flex gap-5 text-[14px]"><a href="#work" className="hover-a">Work</a><a href="#contact" className="hover-a">Contact</a></nav></header>

      <section className="grid gap-10 py-16 @4xl:grid-cols-[1.5fr_1fr] @4xl:py-24">
        <div>
          <div className="flex flex-wrap gap-2">
            {c.availability && <span className="inline-flex items-center gap-2 rounded-[6px] bg-[color-mix(in_oklab,var(--t-accent)_14%,transparent)] px-2.5 py-1 text-[13px] font-medium ta" {...ed("availability")}><span className="size-1.5 rounded-full ba" />{c.availability}</span>}
          </div>
          <h1 className="mt-6 text-[clamp(2.6rem,6.6cqw,5rem)] font-[650] leading-[1] tracking-[-0.035em] balance" {...ed("tagline")}>{c.tagline}</h1>
        </div>
        <dl className="self-end rounded-[10px] border rule text-[14px]">
          {[["Owner", c.name, "name"], ["Role", c.professional_title, "professional_title"], ["Based", c.location, "location"]].filter(([, value]) => value).map(([key, value, path]) => <div key={key} className="grid grid-cols-[6rem_1fr] border-b rule px-4 py-2.5 last:border-0"><dt><Mono className="tm">{key}</Mono></dt><dd className="font-medium" {...ed(path!)}>{value}</dd></div>)}
        </dl>
      </section>

      {has("stats") && <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-[10px] border rule bg-[var(--t-rule)]">{(c.stats ?? []).map((stat, index) => {
        const down = stat.value?.trim().startsWith("−") || stat.value?.trim().startsWith("-");
        return <div key={index} className="bg-[var(--t-bg)] p-5 @3xl:p-7" {...ed(`stats.${index}`)}>
          <dd className="flex items-baseline gap-2 text-[clamp(1.8rem,4.6cqw,3.2rem)] font-[650] leading-none tracking-[-0.03em] tabular-nums">{stat.value}{/^[−+-]/.test(stat.value ?? "") && <span aria-hidden className="text-[0.5em] ta">{down ? "↓" : "↑"}</span>}</dd>
          <dt className="mt-2 text-[14px] tm">{stat.label}</dt>
        </div>;
      })}</dl>}

      {has("projects") && <section id="work" className="py-20">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] tm">{label("projects", "Selected briefs")}</h2>
        <div className="mt-8 space-y-8">{(c.projects ?? []).map((project, index) => {
          const parts = briefParts(project.description);
          return <Reveal key={index}>
            <article className="overflow-hidden rounded-[12px] border rule" {...ed(`projects.${index}`)}>
              <header className="flex flex-wrap items-center justify-between gap-3 border-b rule bs px-5 py-3"><Mono className="tm">Brief-{pad(index + 1, 3)} · {[project.client, project.category].filter(Boolean).join(" · ")}</Mono><Mono className="tm">{project.role} · {project.year}</Mono></header>
              <div className={`grid gap-6 p-5 @3xl:p-8 ${project.image ? "@4xl:grid-cols-[1fr_17rem]" : ""}`}>
                <div>
                  <h3 className="text-[1.6rem] font-[650] leading-tight tracking-[-0.02em]">{project.title}</h3>
                  <div className={`mt-5 grid gap-5 ${parts.length > 1 ? "@3xl:grid-cols-3" : ""}`}>{parts.map(([key, text], part) => <div key={part} className={parts.length > 1 ? "border-t-2 pt-3" : ""} style={parts.length > 1 ? { borderColor: part === parts.length - 1 ? "var(--t-accent)" : "var(--t-rule-strong)" } : undefined}>
                    {key && <Mono className={part === parts.length - 1 ? "ta" : "tm"}>{key}</Mono>}
                    <p className={`mt-1 pretty ${part === parts.length - 1 && parts.length > 1 ? "font-medium" : "tm"}`}>{text}</p>
                  </div>)}</div>
                </div>
                {project.image && <Picture src={project.image} alt="" embedded={embedded} className="aspect-[4/3] w-full rounded-[8px] border rule" />}
              </div>
            </article>
          </Reveal>;
        })}</div>
      </section>}

      {(has("about") || has("skills")) && <section className="grid gap-10 border-t rule py-20 @4xl:grid-cols-[1fr_1.5fr]">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] tm">{label("about", "How I work")}</h2>
        <div>
          <div className="max-w-[40rem] space-y-4 text-[1.1rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
          {has("skills") && <ul className="mt-8 flex flex-wrap gap-2" {...ed("skills")}>{(c.skills ?? []).map((skill) => <li key={skill} className="rounded-[6px] border rule px-2.5 py-1 text-[14px]">{skill}</li>)}</ul>}
        </div>
      </section>}

      {has("experience") && <section className="border-t rule py-20">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] tm">{label("experience", "Release history")}</h2>
        <ol className="relative mt-10 grid gap-8 @3xl:grid-flow-col @3xl:auto-cols-fr">
          <span aria-hidden className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-px bg-[var(--t-rule-strong)] @3xl:left-0 @3xl:top-[7px] @3xl:h-px @3xl:w-full" />
          {roles.map((role, index) => <li key={index} className="relative pl-8 @3xl:pl-0 @3xl:pt-8" {...ed(`experience.${index}`)}>
            <span aria-hidden className={`absolute left-0 top-1 size-[15px] rounded-full border-2 border-[var(--t-accent)] @3xl:top-0 ${index === 0 ? "ba" : "bg-[var(--t-bg)]"}`} />
            <Mono className="ta">v{roles.length - index}.0 · {[role.start_date, role.end_date].filter(Boolean).join("–")}</Mono>
            <p className="mt-2 font-semibold">{role.job_title}</p><p className="tm">{role.company}</p>
            {role.description && <p className="mt-2 text-[15px] tm pretty">{role.description}</p>}
          </li>)}
        </ol>
      </section>}

      {has("testimonials") && <section className="border-t rule py-20">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] tm">{label("testimonials", "Comments")}</h2>
        <div className="mt-8 grid gap-4 @3xl:grid-cols-2">{(c.testimonials ?? []).map((item, index) => <figure key={index} className="rounded-[10px] border rule p-5" {...ed(`testimonials.${index}`)}>
          <figcaption className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full ba text-[12px] font-semibold text-[var(--t-bg)]">{initials(item.name) || "•"}</span><span className="text-[14px]"><b className="font-semibold">{item.name}</b> <span className="tm">· {item.role}</span></span><Mono className="ml-auto tm">✓ Resolved</Mono></figcaption>
          <blockquote className="mt-3 text-[1.05rem] leading-snug">{item.quote}</blockquote>
        </figure>)}</div>
      </section>}

      {(has("highlights") || has("education")) && <section className="grid gap-10 border-t rule py-16 @3xl:grid-cols-2">
        {has("highlights") && <div><h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] tm">{label("highlights", "Writing & talks")}</h2><ul className="mt-5 space-y-2">{(c.highlights ?? []).map((item, index) => <li key={index} className="flex justify-between gap-4" {...ed(`highlights.${index}`)}><span>{item.url ? <a href={item.url} {...external(item.url)} className="underline decoration-[var(--t-rule-strong)] underline-offset-4 hover-a">{item.title}</a> : item.title}{item.detail && <span className="tm"> · {item.detail}</span>}</span><Mono className="tm">{item.year}</Mono></li>)}</ul></div>}
        {has("education") && <div><h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] tm">{label("education", "Education")}</h2><ul className="mt-5 space-y-2">{(c.education ?? []).map((item, index) => <li key={index} {...ed(`education.${index}`)}>{item.degree}<span className="tm"> · {item.school}</span></li>)}</ul></div>}
      </section>}

      {has("contact") && <footer id="contact" className="mb-10 rounded-[14px] bg-[var(--t-fg)] px-6 py-14 text-[var(--t-bg)] @3xl:px-12">
        <Mono className="opacity-60">Next step</Mono>
        <h2 className="mt-3 max-w-[36rem] text-[clamp(2rem,4.6cqw,3.2rem)] font-[650] leading-[1.05] tracking-[-0.03em]">Have a problem worth solving? Let’s write the brief together.</h2>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <a href={c.email ? `mailto:${c.email}` : "#"} className="rounded-[8px] ba px-5 py-3 font-semibold text-[var(--t-bg)]" {...ed("email")}>{c.email || "Email me"}</a>
          {contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="text-[15px] opacity-75 hover:opacity-100">{link.label} ↗</a>)}
        </div>
      </footer>}
    </div>
  </StudioRoot>;
}

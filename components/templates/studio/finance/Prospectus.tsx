"use client";

import "@fontsource-variable/newsreader";
import "@fontsource-variable/newsreader/wght-italic.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import { Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";

const SUP = ["¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
const tel = (phone?: string) => (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "#");

function Section({ id, number, title, children }: { id: string; number: number; title: string; children: React.ReactNode }) {
  return <section id={id} className="grid gap-6 border-t border-[var(--t-fg)] py-12 @4xl:grid-cols-[14rem_1fr] @4xl:gap-12">
    <h2 className="fd text-[1.5rem] leading-tight"><span className="mr-3 font-[family-name:var(--t-mono)] text-[13px] ta">{number}.</span>{title}</h2>
    <div className="min-w-0">{children}</div>
  </section>;
}

export default function Prospectus({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const parts = [
    ["about", "adviser", label("about", "The adviser")],
    ["projects", "record", label("projects", "Track record")],
    ["services", "charges", label("services", "Services and charges")],
    ["experience", "experience", label("experience", "Experience")],
    ["education", "qualifications", label("education", "Qualifications")],
    ["testimonials", "references", label("testimonials", "References")],
    ["highlights", "publications", label("highlights", "Publications")],
  ].filter(([key]) => has(key as never)) as Array<[string, string, string]>;
  const no = (key: string) => parts.findIndex(([item]) => item === key) + 1;
  const quotes = c.testimonials ?? [];

  return <StudioRoot studio={studio} className="text-[16px] leading-[1.65]">
    <div className="mx-auto max-w-[70rem] px-5 @3xl:px-10">
      <header className="flex items-center justify-between border-b-[3px] border-double border-[var(--t-fg)] py-4 font-[family-name:var(--t-mono)] text-[11px] uppercase tracking-[0.22em]">
        <span>Prospectus</span><span className="tm" suppressHydrationWarning>Issued {new Date().getFullYear()}</span>
      </header>

      <section className="grid gap-12 py-14 @4xl:grid-cols-[1.35fr_1fr] @4xl:py-20">
        <div>
          <p className="font-[family-name:var(--t-mono)] text-[12px] uppercase tracking-[0.18em] ta" {...ed("professional_title")}>{c.professional_title}</p>
          <h1 className="fd mt-4 text-[clamp(2.8rem,7.4cqw,5.4rem)] font-[400] leading-[0.98] tracking-[-0.02em]" {...ed("name")}>{c.name}</h1>
          <p className="fd mt-6 max-w-[32rem] text-[1.5rem] italic leading-snug tm balance" {...ed("tagline")}>{c.tagline}</p>
        </div>
        <aside className="self-start border-2 border-[var(--t-fg)]">
          <h2 className="ba px-5 py-2 font-[family-name:var(--t-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--t-bg)]">Key facts</h2>
          <dl className="divide-y divide-[var(--t-rule)] px-5 text-[15px]">
            {c.location && <div className="flex justify-between gap-4 py-2.5"><dt className="tm">Based in</dt><dd className="text-right" {...ed("location")}>{c.location}</dd></div>}
            {(c.stats ?? []).map((stat, index) => <div key={index} className="flex justify-between gap-4 py-2.5" {...ed(`stats.${index}`)}><dt className="tm">{stat.label}</dt><dd className="font-[family-name:var(--t-mono)] font-semibold tabular-nums">{stat.value}</dd></div>)}
            {c.availability && <div className="py-2.5" {...ed("availability")}><dt className="tm">Availability</dt><dd>{c.availability}</dd></div>}
          </dl>
        </aside>
      </section>

      {parts.length > 2 && <nav aria-label="Contents" className="mb-6 max-w-[34rem]">
        <p className="font-[family-name:var(--t-mono)] text-[11px] uppercase tracking-[0.22em] tm">Contents</p>
        <ol className="mt-3">{parts.map(([, id, title], index) => <li key={id}><a href={`#${id}`} className="flex items-baseline gap-2 py-1 hover-a"><span className="w-6 font-[family-name:var(--t-mono)] text-[13px] tm">{index + 1}.</span><span>{title}</span><span aria-hidden className="mx-1 flex-1 translate-y-[-3px] border-b border-dotted border-[var(--t-rule-strong)]" /><span className="font-[family-name:var(--t-mono)] text-[13px] tm">{index + 2}</span></a></li>)}</ol>
      </nav>}

      {has("about") && <Section id="adviser" number={no("about")} title={label("about", "The adviser")}>
        <div className="max-w-[40rem] space-y-4 text-[1.06rem]">{paragraphs(c).map(({ text, index }, position) => <p key={index} className={`pretty ${position === 0 ? "fd text-[1.3rem] leading-snug" : ""}`} {...ed(`summary.${index}`)}>{text}</p>)}</div>
        {has("skills") && <p className="mt-6 max-w-[40rem] text-[15px] tm">Specialisms: {(c.skills ?? []).join(" · ")}</p>}
      </Section>}

      {has("projects") && <Section id="record" number={no("projects")} title={label("projects", "Track record")}>
        <div className="overflow-x-auto"><table className="w-full min-w-[34rem] border-collapse text-left text-[15px]">
          <thead className="font-[family-name:var(--t-mono)] text-[11px] uppercase tracking-[0.14em] tm"><tr className="border-b border-[var(--t-fg)]"><th className="py-2 pr-4 font-normal">Year</th><th className="py-2 pr-4 font-normal">Engagement</th><th className="py-2 text-right font-normal">Result</th></tr></thead>
          <tbody>{(c.projects ?? []).map((item, index) => <tr key={index} className="border-b rule align-top" {...ed(`projects.${index}`)}>
            <td className="py-4 pr-4 font-[family-name:var(--t-mono)] tabular-nums tm">{item.year}</td>
            <td className="py-4 pr-6"><b className="font-semibold">{item.title}</b>{item.role && <span className="tm"> · {item.role}</span>}<span className="mt-1 block tm pretty">{item.description}</span></td>
            <td className="whitespace-nowrap py-4 text-right font-[family-name:var(--t-mono)] font-semibold tabular-nums ta">{item.client}</td>
          </tr>)}</tbody>
        </table></div>
      </Section>}

      {has("services") && <Section id="charges" number={no("services")} title={label("services", "Services and charges")}>
        <div className="grid gap-px overflow-hidden border border-[var(--t-fg)] bg-[var(--t-fg)] @3xl:grid-cols-3">{(c.services ?? []).map((service, index) => <Reveal key={index} delay={index * 70} className="flex flex-col bg-[var(--t-bg)] p-5">
          <div className="flex flex-1 flex-col" {...ed(`services.${index}`)}>
            <h3 className="fd text-[1.25rem] leading-tight">{service.title}</h3>
            <p className="mt-2 flex-1 text-[15px] tm pretty">{service.description}</p>
            <p className="mt-5 border-t rule pt-3 font-[family-name:var(--t-mono)] text-[14px] font-semibold tabular-nums">{service.price}</p>
          </div>
        </Reveal>)}</div>
      </Section>}

      {has("experience") && <Section id="experience" number={no("experience")} title={label("experience", "Experience")}>
        <ul className="divide-y divide-[var(--t-rule)] border-y rule">{(c.experience ?? []).map((role, index) => <li key={index} className="grid gap-1 py-4 @3xl:grid-cols-[9rem_1fr] @3xl:gap-6" {...ed(`experience.${index}`)}><span className="font-[family-name:var(--t-mono)] text-[13px] tabular-nums tm">{[role.start_date, role.end_date].filter(Boolean).join(" – ")}</span><span><b className="font-semibold">{role.job_title}</b>, {role.company}{role.description && <span className="block text-[15px] tm">{role.description}</span>}</span></li>)}</ul>
      </Section>}

      {has("education") && <Section id="qualifications" number={no("education")} title={label("education", "Qualifications")}>
        <ul className="space-y-3">{(c.education ?? []).map((item, index) => <li key={index} {...ed(`education.${index}`)}><b className="font-semibold">{item.degree}</b><span className="tm"> — {item.school}{item.end_date && `, ${item.end_date}`}</span></li>)}</ul>
      </Section>}

      {has("testimonials") && <Section id="references" number={no("testimonials")} title={label("testimonials", "References")}>
        <div className="space-y-8">{quotes.map((item, index) => <blockquote key={index} className="fd max-w-[40rem] text-[1.35rem] leading-snug" {...ed(`testimonials.${index}`)}>“{item.quote}”<sup className="ml-0.5 font-[family-name:var(--t-mono)] text-[0.6em] ta">{SUP[index] ?? index + 1}</sup></blockquote>)}</div>
      </Section>}

      {has("highlights") && <Section id="publications" number={no("highlights")} title={label("highlights", "Publications")}>
        <ul className="space-y-2">{(c.highlights ?? []).map((item, index) => <li key={index} className="flex flex-wrap justify-between gap-x-6" {...ed(`highlights.${index}`)}><span>{item.url ? <a href={item.url} {...external(item.url)} className="underline decoration-[var(--t-rule-strong)] underline-offset-4 hover-a">{item.title}</a> : item.title}{item.detail && <span className="tm">, {item.detail}</span>}</span><span className="font-[family-name:var(--t-mono)] text-[13px] tm">{item.year}</span></li>)}</ul>
      </Section>}

      {has("contact") && <footer className="border-t-[3px] border-double border-[var(--t-fg)] py-12">
        <div className="grid gap-8 @4xl:grid-cols-[14rem_1fr] @4xl:gap-12">
          <h2 className="fd text-[1.5rem]">Enquiries</h2>
          <div className="space-y-1 text-[1.15rem]">
            {c.phone && <a href={tel(c.phone)} className="block font-[family-name:var(--t-mono)] tabular-nums hover-a" {...ed("phone")}>{c.phone}</a>}
            <a href={c.email ? `mailto:${c.email}` : "#"} className="block break-all hover-a" {...ed("email")}>{c.email}</a>
            <p className="flex flex-wrap gap-x-5 pt-2 text-[14px] tm">{contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover-a">{link.label}</a>)}</p>
          </div>
        </div>
        {has("testimonials") && quotes.length > 0 && <ol className="mt-12 space-y-1 border-t rule pt-4 text-[12px] leading-snug tm">{quotes.map((item, index) => <li key={index}>{SUP[index] ?? index + 1} {item.name}{item.role && `, ${item.role}`}.</li>)}</ol>}
      </footer>}
    </div>
  </StudioRoot>;
}

"use client";

import "@fontsource/old-standard-tt/400.css";
import "@fontsource/old-standard-tt/700.css";
import "@fontsource/old-standard-tt/400-italic.css";
import "@fontsource/unifrakturmaguntia/400.css";
import "@fontsource-variable/newsreader";
import { Picture, StudioRoot, contactLinks, ed, external, hostname, paragraphs, useStudio, type StudioProps } from "../kit";

const Rule = ({ double }: { double?: boolean }) => <div aria-hidden className={double ? "border-y-[3px] border-double border-[var(--t-fg)] py-[1px]" : "border-t border-[var(--t-fg)]"} />;

export default function Broadsheet({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const now = new Date();
  const date = `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()]} ${now.getDate()} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][now.getMonth()]} ${now.getFullYear()}`;
  const stories = c.highlights ?? [];
  const [lead, ...more] = stories;

  return <StudioRoot studio={studio} className="text-[16px] leading-[1.55]">
    <div className="mx-auto max-w-[80rem] px-4 py-6 @3xl:px-8">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] tm"><span>Vol. {new Date().getFullYear() - 2000} · No. {(c.highlights ?? []).length + (c.projects ?? []).length}</span><span className="hidden @2xl:inline">{c.location}</span><span>Free to read</span></div>
      {studio.font?.id === "blackletter"
        ? <h1 className="mt-3 text-center font-['UnifrakturMaguntia',serif] text-[clamp(2.6rem,10cqw,7.5rem)] leading-[1] tracking-[0.01em]" {...ed("name")}>The {c.name}</h1>
        : <h1 className="fd mt-4 text-center text-[clamp(2.4rem,9.4cqw,7rem)] font-[700] uppercase leading-[0.92] tracking-[-0.015em] [font-feature-settings:'kern','liga'] balance" {...ed("name")}><span className="mb-2 block text-[0.2em] font-[400] italic normal-case tracking-[0.04em] tm">The</span>{c.name}</h1>}
      <Rule double />
      <div className="flex items-center justify-between py-1.5 text-[12px] italic"><span suppressHydrationWarning>{date}</span><span className="hidden @2xl:inline" {...ed("professional_title")}>{c.professional_title}</span><a href="#classifieds" className="not-italic hover-a">Contact ▸</a></div>
      <Rule />

      <div className="mt-6 grid gap-8 @4xl:grid-cols-[1fr_17rem]">
        <main className="min-w-0">
          <article>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] ta">{label("about", "Profile")}</p>
            <h2 className="fd mt-2 text-[clamp(2.2rem,5.8cqw,4.6rem)] font-[700] leading-[0.98] tracking-[-0.01em] balance" {...ed("tagline")}>{c.tagline}</h2>
            <p className="mt-3 text-[13px] italic tm">By {c.name}{c.location && `, ${c.location}`}</p>
            {has("about") && <div className="mt-5 columns-1 gap-8 [column-rule:1px_solid_var(--t-rule)] @3xl:columns-2 @5xl:columns-3">{paragraphs(c).map(({ text, index }) => <p key={index} className={`mb-3 text-justify [hyphens:auto] ${index === 0 ? "first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:text-[4.2rem] first-letter:font-bold first-letter:leading-[0.75]" : ""}`} {...ed(`summary.${index}`)}>{text}</p>)}</div>}
          </article>

          {has("highlights") && lead && <>
            <div className="my-8"><Rule double /></div>
            <section aria-label={label("highlights", "Selected writing")} className="grid gap-8 @3xl:grid-cols-3">
              <article className="@3xl:col-span-2 @3xl:border-r @3xl:rule @3xl:pr-8" {...ed("highlights.0")}>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] ta">{lead.detail}</p>
                <h3 className="fd mt-2 text-[2.2rem] font-[700] leading-[1.02]">{lead.url ? <a href={lead.url} {...external(lead.url)} className="hover:underline">{lead.title}</a> : lead.title}</h3>
                <p className="mt-2 text-[13px] italic tm">{lead.year}{lead.url && ` · ${hostname(lead.url)}`}</p>
                {has("stats") && <div className="mt-8 grid grid-cols-2 gap-3 @xl:grid-cols-4">{(c.stats ?? []).map((stat, index) => <div key={index} className="border-y-2 border-[var(--t-fg)] py-3 text-center" {...ed(`stats.${index}`)}><p className="fd text-[2.6rem] font-[700] leading-none">{stat.value}</p><p className="mt-1 text-[11px] uppercase tracking-[0.16em] tm">{stat.label}</p></div>)}</div>}
                {lead.url && <a href={lead.url} {...external(lead.url)} className="mt-6 inline-block text-[13px] font-bold uppercase tracking-[0.16em] ta">Read the full piece →</a>}
              </article>
              <ul className="space-y-4">{more.slice(0, 3).map((item, index) => <li key={index} className="border-b rule pb-4 last:border-0" {...ed(`highlights.${index + 1}`)}><p className="text-[10px] font-bold uppercase tracking-[0.2em] ta">{item.detail}</p><h4 className="fd mt-1 text-[1.25rem] font-[700] leading-tight">{item.url ? <a href={item.url} {...external(item.url)} className="hover:underline">{item.title}</a> : item.title}</h4><p className="text-[12px] italic tm">{item.year}</p></li>)}</ul>
            </section>
            {more.length > 3 && <ul className="mt-6 grid gap-x-8 border-t rule pt-4 @3xl:grid-cols-2">{more.slice(3).map((item, index) => <li key={index} className="flex gap-3 py-1.5 text-[15px]" {...ed(`highlights.${index + 4}`)}><span className="ta">▪</span><span><b>{item.title}</b>{item.detail && <span className="italic tm"> — {item.detail}</span>}</span></li>)}</ul>}
          </>}

          {has("projects") && <>
            <div className="my-8"><Rule double /></div>
            <section aria-label={label("projects", "Books & projects")} className="grid gap-6 @3xl:grid-cols-3">{(c.projects ?? []).map((project, index) => <article key={index} className="border border-[var(--t-fg)] p-3" {...ed(`projects.${index}`)}>
              <Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="aspect-[2/3] w-full grayscale-[25%]" />
              <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.24em] ta">{project.category} · {project.year}</p>
              <h3 className="fd mt-1 text-center text-[1.5rem] font-[700] italic leading-tight">{project.title}</h3>
              <p className="mt-2 text-center text-[14px] pretty">{project.description}</p>
            </article>)}</section>
          </>}
        </main>

        <aside className="space-y-8 @4xl:border-l @4xl:rule @4xl:pl-8">
          <section><h2 className="border-b-2 border-[var(--t-fg)] pb-1 text-[12px] font-bold uppercase tracking-[0.2em]">In this edition</h2>
            <ol className="mt-3 space-y-1.5 text-[14px]">{[has("about") && "Profile", has("highlights") && "Selected writing", has("projects") && "Books", has("experience") && "Appointments", has("testimonials") && "Letters", "Classifieds"].filter(Boolean).map((item, index) => <li key={String(item)} className="flex justify-between border-b border-dotted rule"><span>{item}</span><span className="tm">A{index + 1}</span></li>)}</ol></section>
          {has("experience") && <section><h2 className="border-b-2 border-[var(--t-fg)] pb-1 text-[12px] font-bold uppercase tracking-[0.2em]">{label("experience", "Appointments")}</h2>
            <ul className="mt-3 space-y-3 text-[14px]">{(c.experience ?? []).map((role, index) => <li key={index} {...ed(`experience.${index}`)}><b>{role.job_title}</b>, {role.company}. <span className="italic tm">{[role.start_date, role.end_date].filter(Boolean).join("–")}.</span> {role.description}</li>)}</ul></section>}
          {has("testimonials") && <section><h2 className="border-b-2 border-[var(--t-fg)] pb-1 text-[12px] font-bold uppercase tracking-[0.2em]">{label("testimonials", "Letters")}</h2>
            {(c.testimonials ?? []).map((item, index) => <blockquote key={index} className="mt-3 text-[14px] italic" {...ed(`testimonials.${index}`)}>“{item.quote}” <span className="not-italic tm">— {item.name}, {item.role}</span></blockquote>)}</section>}
        </aside>
      </div>

      {has("contact") && <footer id="classifieds" className="mt-12"><Rule double />
        <div className="grid gap-6 py-6 @3xl:grid-cols-[auto_1fr_auto] @3xl:items-center">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.2em]">Classifieds</h2>
          <p className="border border-dashed border-[var(--t-fg)] p-4 text-[15px]"><b>WANTED:</b> <span {...ed("availability")}>{(c.availability ?? "Interesting commissions").replace(/[.!]?$/, ".")}</span> Write to <a href={c.email ? `mailto:${c.email}` : "#"} className="font-bold underline" {...ed("email")}>{c.email}</a>.</p>
          <p className="flex flex-wrap gap-4 text-[13px]">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="underline hover-a">{link.label}</a>)}</p>
        </div><Rule />
      </footer>}
    </div>
  </StudioRoot>;
}

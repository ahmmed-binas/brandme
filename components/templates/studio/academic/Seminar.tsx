"use client";

import "@fontsource-variable/literata";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/public-sans";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, initials, paragraphs, useStudio, type StudioProps } from "../kit";

export default function Seminar({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const papers = (c.highlights ?? []).filter((item) => item.detail && /\b[A-Z][a-z]+ [A-Z]{1,2}[,.]/.test(item.detail)); // author lists look like "Raman P, Chen W."
  const news = (c.highlights ?? []).filter((item) => !papers.includes(item));

  return <StudioRoot studio={studio} className="text-[16px] leading-[1.65]">
    <header className="border-b rule"><div className="mx-auto flex max-w-[70rem] items-center justify-between px-5 py-4 text-[14px]"><span className="fd text-[1.1rem]">{c.name}</span><nav className="flex gap-5 tm">{has("highlights") && <a href="#publications" className="hover-a">Publications</a>}{has("projects") && <a href="#research" className="hover-a">Research</a>}{has("services") && <a href="#join" className="hover-a">Join</a>}</nav></div></header>

    <div className="mx-auto grid max-w-[70rem] gap-12 px-5 py-14 @4xl:grid-cols-[15rem_1fr]">
      <aside className="@4xl:sticky @4xl:top-8 @4xl:self-start">
        <div className="grid aspect-[4/5] w-40 place-items-center overflow-hidden rounded-sm bs fd text-[3rem] ta @4xl:w-full" {...ed("avatar")}>{c.avatar ? <Picture src={c.avatar} alt={c.name ?? ""} className="size-full" /> : initials(c.name)}</div>
        <ul className="mt-5 space-y-1.5 text-[14px]">{c.location && <li className="tm">{c.location}</li>}{contactLinks(c).map((link) => <li key={link.url}><a href={link.url} {...external(link.url)} className="ta underline decoration-[color-mix(in_oklab,var(--t-accent)_35%,transparent)] underline-offset-2">{link.label === "Email" ? c.email : link.label}</a></li>)}</ul>
        {has("stats") && <dl className="mt-6 grid grid-cols-3 gap-2 border-t rule pt-4 text-center">{(c.stats ?? []).map((stat, index) => <div key={index} {...ed(`stats.${index}`)}><dd className="fd text-[1.4rem] leading-none">{stat.value}</dd><dt className="mt-1 text-[11px] leading-tight tm">{stat.label}</dt></div>)}</dl>}
      </aside>

      <main className="min-w-0">
        <h1 className="fd text-[clamp(2.2rem,5cqw,3.4rem)] leading-tight" {...ed("name")}>{c.name}</h1>
        <p className="mt-1 text-[1.1rem] tm" {...ed("professional_title")}>{c.professional_title}</p>
        {c.availability && <p className="mt-4 inline-block rounded-sm bg-[color-mix(in_oklab,var(--t-accent)_12%,var(--t-bg))] px-3 py-1 text-[14px] ta" {...ed("availability")}>{c.availability}</p>}
        {has("about") && <div className="mt-6 max-w-[42rem] space-y-4 text-[1.05rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>}

        {news.length > 0 && has("highlights") && <section className="mt-12"><h2 className="fd text-[1.5rem]">News</h2>
          <ul className="mt-3">{news.map((item) => { const index = (c.highlights ?? []).indexOf(item); return <li key={index} className="grid grid-cols-[5rem_1fr] border-t rule py-2.5 text-[15px]" {...ed(`highlights.${index}`)}><span className="tm">{item.year}</span><span>{item.title}{item.detail && <span className="tm"> — {item.detail}</span>}</span></li>; })}</ul></section>}

        {papers.length > 0 && has("highlights") && <section id="publications" className="mt-12"><h2 className="fd text-[1.5rem]">{label("highlights", "Selected publications")}</h2>
          <ol className="mt-3 space-y-5">{papers.map((item) => { const index = (c.highlights ?? []).indexOf(item); return <Reveal as="li" key={index}><div {...ed(`highlights.${index}`)}>
            <p className="fd text-[1.1rem] leading-snug">{item.url ? <a href={item.url} {...external(item.url)} className="hover-a">{item.title}</a> : item.title}</p>
            <p className="text-[14px] tm">{item.detail?.replace(new RegExp(`(${(c.name ?? "").split(" ").at(-1)} \\w)`), "§$1§").split("§").map((part, k) => k === 1 ? <b key={k} className="font-semibold text-[var(--t-fg)]">{part}</b> : part)} <span className="tabular-nums">({item.year})</span></p>
            {item.url && <p className="mt-1 flex gap-3 text-[12px]"><a href={item.url} {...external(item.url)} className="rounded-sm border rule px-1.5 ta">PDF</a><a href={item.url} {...external(item.url)} className="rounded-sm border rule px-1.5 ta">BibTeX</a></p>}
          </div></Reveal>; })}</ol></section>}

        {has("projects") && <section id="research" className="mt-12"><h2 className="fd text-[1.5rem]">{label("projects", "Research & software")}</h2>
          <div className="mt-4 grid gap-5 @2xl:grid-cols-2">{(c.projects ?? []).map((project, index) => <article key={index} className="border rule" {...ed(`projects.${index}`)}><Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="aspect-[16/9] w-full border-b rule" /><div className="p-4"><h3 className="font-semibold">{project.title} <span className="font-normal tm">· {project.category}</span></h3><p className="mt-1 text-[14px] tm pretty">{project.description}</p>{(project.github || project.live_url) && <a href={project.github || project.live_url} {...external(project.github || project.live_url || "#")} className="mt-2 inline-block text-[14px] ta">Code & data →</a>}</div></article>)}</div></section>}

        {has("services") && <section id="join" className="mt-12 border-l-4 border-[var(--t-accent)] bs p-5"><h2 className="fd text-[1.5rem]">{label("services", "Join the lab")}</h2>
          <ul className="mt-2 space-y-2">{(c.services ?? []).map((item, index) => <li key={index} {...ed(`services.${index}`)}><b className="font-semibold">{item.title}.</b> {item.description}</li>)}</ul></section>}

        <div className="mt-12 grid gap-10 @3xl:grid-cols-2">
          {has("experience") && <section><h2 className="fd text-[1.5rem]">{label("experience", "Positions")}</h2><ul className="mt-3 space-y-2 text-[15px]">{(c.experience ?? []).map((role, index) => <li key={index} {...ed(`experience.${index}`)}><b className="font-semibold">{role.job_title}</b>, {role.company} <span className="tm">({[role.start_date, role.end_date].filter(Boolean).join("–")})</span></li>)}</ul></section>}
          {has("education") && <section><h2 className="fd text-[1.5rem]">{label("education", "Education")}</h2><ul className="mt-3 space-y-2 text-[15px]">{(c.education ?? []).map((item, index) => <li key={index} {...ed(`education.${index}`)}><b className="font-semibold">{item.degree}</b>, {item.school} <span className="tm">({[item.start_date, item.end_date].filter(Boolean).join("–")})</span></li>)}</ul></section>}
        </div>
      </main>
    </div>
  </StudioRoot>;
}

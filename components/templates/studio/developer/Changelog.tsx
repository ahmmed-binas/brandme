"use client";

import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource/ibm-plex-mono/400.css";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, initials, paragraphs, useStudio, type StudioProps } from "../kit";

const KIND_COLOURS = ["#e5484d", "#2f6fed", "#30a46c", "#f5a524", "#8e4ec6"];

export default function Changelog({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const roles = c.experience ?? [];
  const latest = roles.length;
  const version = (index: number) => `v${latest - index}.0.0`;

  return <StudioRoot studio={studio} className="text-[15.5px] leading-[1.65]">
    <header className="sticky top-0 z-20 border-b rule bg-[color-mix(in_oklab,var(--t-bg)_88%,transparent)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[68rem] items-center gap-3 px-5">
        <span className="grid size-7 place-items-center rounded-md bg-[var(--t-fg)] text-[11px] font-bold text-[var(--t-bg)]">{initials(c.name)}</span>
        <span className="font-semibold tracking-tight">{c.name}</span>
        <span className="fm rounded border rule px-1.5 text-[11px] tm">{version(0)}</span>
        <nav className="ml-auto hidden gap-6 text-[14px] tm @2xl:flex">{has("projects") && <a href="#releases" className="hover-a">Releases</a>}{has("experience") && <a href="#changelog" className="hover-a">Changelog</a>}<a href="#contact" className="hover-a">Contact</a></nav>
      </div>
    </header>

    <section className="mx-auto max-w-[68rem] px-5 pb-16 pt-16 @3xl:pt-24">
      <p className="fm text-[12px] uppercase tracking-[0.18em] tm">Changelog · {c.location}</p>
      <h1 className="fd mt-5 max-w-[16ch] text-[clamp(2.8rem,8cqw,5.8rem)] font-semibold leading-[0.98] tracking-[-0.04em] balance" {...ed("name")}>{c.name}</h1>
      <p className="mt-5 text-[1.3rem] tracking-tight" {...ed("professional_title")}>{c.professional_title}</p>
      {c.tagline && <p className="mt-3 max-w-[40rem] text-[1.05rem] tm pretty" {...ed("tagline")}>{c.tagline}</p>}
      {roles[0] && <a href="#changelog" className="mt-9 inline-flex items-center gap-3 rounded-full border rule py-1.5 pl-1.5 pr-4 text-[14px] transition-colors hover:border-[var(--t-fg)]">
        <span className="rounded-full ba px-2.5 py-0.5 text-[12px] font-semibold text-white">Latest</span>
        <span><span className="fm">{version(0)}</span> — {roles[0].job_title} at {roles[0].company}</span><span aria-hidden>→</span>
      </a>}
    </section>

    {has("about") && <section className="border-y rule bs">
      <div className="mx-auto grid max-w-[68rem] gap-8 px-5 py-14 @3xl:grid-cols-[14rem_1fr]">
        <h2 className="fm text-[12px] uppercase tracking-[0.18em] tm">README.md</h2>
        <div className="max-w-[42rem] space-y-4 text-[1.08rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
      </div>
    </section>}

    {has("projects") && <section id="releases" className="mx-auto max-w-[68rem] px-5 py-20">
      <div className="flex items-end justify-between gap-4"><h2 className="fd text-[2rem] font-semibold tracking-[-0.03em]">{label("projects", "Featured releases")}</h2><span className="fm text-[12px] tm">{(c.projects ?? []).length} packages</span></div>
      <div className="mt-8 grid gap-5 @3xl:grid-cols-2">{(c.projects ?? []).map((project, index) => <Reveal key={index} delay={index * 60} as="article" className={`group overflow-hidden rounded-xl border rule bg-[var(--t-bg)] ${index === 0 ? "@3xl:col-span-2 @3xl:grid @3xl:grid-cols-[1.3fr_1fr]" : ""}`}>
        <div {...ed(`projects.${index}`)} className="contents">
          <div className="overflow-hidden border-b rule @3xl:border-b-0"><Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="aspect-[16/9] h-full w-full transition-transform duration-700 group-hover:scale-[1.03]" /></div>
          <div className="p-6">
            <p className="fm flex items-center gap-2 text-[12px] tm"><span className="size-2 rounded-full" style={{ background: KIND_COLOURS[index % KIND_COLOURS.length] }} />{project.category ?? "release"} · {project.year}</p>
            <h3 className="mt-2 text-[1.35rem] font-semibold tracking-tight">{project.title}</h3>
            <p className="mt-2 tm pretty">{project.description}</p>
            {!!project.technologies?.length && <p className="fm mt-4 flex flex-wrap gap-1.5 text-[12px]">{project.technologies.map((tech) => <span key={tech} className="rounded border rule px-1.5">{tech}</span>)}</p>}
            <p className="mt-4 flex gap-4 text-[14px] font-medium">{project.live_url && <a href={project.live_url} {...external(project.live_url)} className="ta">View release ↗</a>}{project.github && <a href={project.github} {...external(project.github)} className="ta">Source ↗</a>}</p>
          </div>
        </div>
      </Reveal>)}</div>
    </section>}

    {has("experience") && <section id="changelog" className="border-t rule">
      <div className="mx-auto grid max-w-[68rem] gap-10 px-5 py-20 @4xl:grid-cols-[12rem_1fr]">
        <aside className="@4xl:sticky @4xl:top-24 @4xl:self-start">
          <h2 className="fd text-[2rem] font-semibold tracking-[-0.03em]">{label("experience", "Changelog")}</h2>
          <ol className="fm mt-5 hidden space-y-1.5 text-[13px] @4xl:block">{roles.map((role, index) => <li key={index}><a href={`#v-${index}`} className="tm hover-a">{version(index)}</a> <span className="tm opacity-60">{role.start_date}</span></li>)}</ol>
        </aside>
        <ol className="space-y-14">{roles.map((role, index) => <Reveal as="li" key={index}>
          <article id={`v-${index}`} className="grid gap-4 @2xl:grid-cols-[8.5rem_1fr]" {...ed(`experience.${index}`)}>
            <div><span className="fm inline-block rounded-md border rule-strong px-2 py-0.5 text-[13px] font-semibold">{version(index)}</span><p className="fm mt-2 text-[12px] tm">{[role.start_date, role.end_date].filter(Boolean).join(" → ")}</p></div>
            <div className="border-l rule pl-6">
              <h3 className="text-[1.25rem] font-semibold tracking-tight">{role.job_title} <span className="tm font-normal">at</span> {role.company}</h3>
              {role.location && <p className="text-[14px] tm">{role.location}</p>}
              {role.description && <><p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.12em]"><span className="mr-2 inline-block size-2 rounded-full bg-[#30a46c]" />Added</p><p className="mt-1 max-w-[40rem] pretty">{role.description}</p></>}
              {!!role.technologies?.length && <><p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.12em]"><span className="mr-2 inline-block size-2 rounded-full bg-[#2f6fed]" />Dependencies</p><p className="fm mt-1 text-[13px] tm">{role.technologies.join(" · ")}</p></>}
            </div>
          </article>
        </Reveal>)}</ol>
      </div>
    </section>}

    {(has("highlights") || has("skills")) && <section className="border-t rule bs">
      <div className="mx-auto grid max-w-[68rem] gap-12 px-5 py-20 @4xl:grid-cols-2">
        {has("highlights") && <div><h2 className="fd text-[1.6rem] font-semibold tracking-tight">{label("highlights", "Release notes")}</h2>
          <ul className="mt-6 divide-y divide-[var(--t-rule)] border-y rule">{(c.highlights ?? []).map((item, index) => <li key={index} className="flex items-baseline gap-4 py-3" {...ed(`highlights.${index}`)}><span className="fm w-12 shrink-0 text-[12px] tm">{item.year}</span><span className="min-w-0">{item.url ? <a href={item.url} {...external(item.url)} className="underline decoration-[var(--t-rule-strong)] hover-a">{item.title}</a> : item.title}{item.detail && <span className="block text-[14px] tm">{item.detail}</span>}</span></li>)}</ul></div>}
        {has("skills") && <div><h2 className="fd text-[1.6rem] font-semibold tracking-tight">{label("skills", "package.json")}</h2>
          <pre className="fm mt-6 overflow-x-auto rounded-xl border rule bg-[var(--t-bg)] p-5 text-[13px] leading-6" {...ed("skills")}>{"{\n  "}<span className="tm">&quot;dependencies&quot;</span>{": {\n"}{(c.skills ?? []).map((skill, index, all) => <span key={skill}>{"    "}<span className="ta">&quot;{skill.toLowerCase().replace(/\s+/g, "-")}&quot;</span>: <span>&quot;latest&quot;</span>{index < all.length - 1 ? "," : ""}{"\n"}</span>)}{"  }\n}"}</pre></div>}
      </div>
    </section>}

    {has("contact") && <footer id="contact" className="border-t rule">
      <div className="mx-auto max-w-[68rem] px-5 py-20">
        <p className="fm text-[12px] uppercase tracking-[0.18em] tm">Subscribe to updates</p>
        <a href={c.email ? `mailto:${c.email}` : "#"} className="fd mt-4 block break-all text-[clamp(2rem,6cqw,4rem)] font-semibold leading-none tracking-[-0.04em] hover-a" {...ed("email")}>{c.email}</a>
        <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14px]">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="underline decoration-[var(--t-rule-strong)] hover-a">{link.label}</a>)}</p>
        {c.availability && <p className="mt-10 text-[14px] tm" {...ed("availability")}>Status: {c.availability}</p>}
      </div>
    </footer>}
  </StudioRoot>;
}

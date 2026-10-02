"use client";

import "@fontsource-variable/archivo";
import "@fontsource-variable/inter-tight";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, pad, paragraphs, useStudio, type StudioProps } from "../kit";

export default function Swiss({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const [first, ...rest] = (c.name ?? "").split(" ");

  return <StudioRoot studio={studio} className="text-[16px] leading-[1.45]">
    <div className="mx-auto max-w-[90rem] px-5 @3xl:px-10">
      <header className="grid grid-cols-2 gap-4 border-b-2 border-[var(--t-fg)] py-4 text-[13px] font-medium @3xl:grid-cols-12">
        <span className="@3xl:col-span-3">{c.name}</span>
        <span className="hidden @3xl:col-span-4 @3xl:block" {...ed("professional_title")}>{c.professional_title}</span>
        <span className="hidden @3xl:col-span-3 @3xl:block tm">{c.location}</span>
        <a href="#contact" className="text-right @3xl:col-span-2 hover-a">Contact</a>
      </header>

      <section className="relative grid gap-y-10 py-12 @3xl:grid-cols-12 @3xl:gap-x-5 @3xl:py-16">
        <h1 className="fd relative z-10 text-[clamp(3.4rem,15.5cqw,15rem)] font-[750] leading-[0.82] tracking-[-0.055em] @3xl:col-span-12" {...ed("name")}>{first}<br />{rest.join(" ")}<span className="ta">.</span></h1>
        <div className="absolute right-[2%] top-[5%] -z-0 aspect-square w-[24cqw] rounded-full ba opacity-95 mix-blend-multiply" aria-hidden />
        <p className="text-[1.45rem] font-medium leading-[1.15] tracking-[-0.02em] @3xl:col-span-5 @3xl:col-start-1 pretty" {...ed("tagline")}>{c.tagline}</p>
        {has("stats") && <dl className="grid grid-cols-2 gap-x-5 gap-y-4 self-end text-[13px] @3xl:col-span-5 @3xl:col-start-8">
          {(c.stats ?? []).slice(0, 4).map((stat, index) => <div key={index} className="border-t border-[var(--t-fg)] pt-2" {...ed(`stats.${index}`)}><dt className="tm">{stat.label}</dt><dd className="text-[2rem] font-[750] leading-none tracking-tight">{stat.value}</dd></div>)}
        </dl>}
      </section>

      {has("about") && <section className="grid gap-5 border-t-2 border-[var(--t-fg)] py-12 @3xl:grid-cols-12">
        <h2 className="text-[13px] font-semibold @3xl:col-span-3">{label("about", "Profile")}</h2>
        <div className="space-y-5 text-[1.3rem] leading-[1.3] tracking-[-0.01em] @3xl:col-span-7">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
      </section>}

      {has("projects") && <section className="border-t-2 border-[var(--t-fg)] py-12">
        <h2 className="text-[13px] font-semibold">{label("projects", "Selected work")} <span className="tm">({pad((c.projects ?? []).length)})</span></h2>
        <div className="mt-10 space-y-24">{(c.projects ?? []).map((project, index) => <Reveal key={index} as="article" className="grid gap-5 @3xl:grid-cols-12">
          <p className="fd text-[clamp(4rem,11cqw,10rem)] font-[750] leading-[0.8] tracking-[-0.06em] ta @3xl:col-span-3">{pad(index + 1)}</p>
          <div className="@3xl:col-span-6" {...ed(`projects.${index}`)}><Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="aspect-[4/3] w-full" /></div>
          <div className="flex flex-col @3xl:col-span-3">
            <h3 className="text-[1.6rem] font-[700] leading-[1.05] tracking-[-0.03em]">{project.title}</h3>
            <dl className="mt-4 grid grid-cols-[5rem_1fr] gap-y-1 border-t border-[var(--t-fg)] pt-3 text-[13px]">
              {project.client && <><dt className="tm">Client</dt><dd>{project.client}</dd></>}
              {project.year && <><dt className="tm">Year</dt><dd>{project.year}</dd></>}
              {project.category && <><dt className="tm">Scope</dt><dd>{project.category}</dd></>}
            </dl>
            <p className="mt-4 text-[15px] pretty">{project.description}</p>
            {project.live_url && <a href={project.live_url} {...external(project.live_url)} className="mt-auto pt-4 text-[13px] font-semibold ta">View project →</a>}
          </div>
        </Reveal>)}</div>
      </section>}

      {has("services") && <section className="border-t-2 border-[var(--t-fg)] py-12">
        <h2 className="text-[13px] font-semibold">{label("services", "Services")}</h2>
        <div className="mt-8 grid gap-px bg-[var(--t-fg)] @3xl:grid-cols-3">{(c.services ?? []).map((service, index) => <div key={index} className="flex flex-col bg-[var(--t-bg)] p-6 @3xl:min-h-[18rem]" {...ed(`services.${index}`)}>
          <span className="text-[13px] tm">{pad(index + 1)}</span>
          <h3 className="mt-6 text-[1.7rem] font-[700] leading-none tracking-[-0.03em]">{service.title}</h3>
          <p className="mt-4 text-[15px] tm pretty">{service.description}</p>
          {service.price && <p className="mt-auto pt-6 text-[1.1rem] font-semibold ta">{service.price}</p>}
        </div>)}</div>
      </section>}

      {has("experience") && <section className="grid gap-5 border-t-2 border-[var(--t-fg)] py-12 @3xl:grid-cols-12">
        <h2 className="text-[13px] font-semibold @3xl:col-span-3">{label("experience", "Experience")}</h2>
        <ol className="@3xl:col-span-9">{(c.experience ?? []).map((role, index) => <li key={index} className="grid grid-cols-[6rem_1fr] gap-x-5 border-t border-[var(--t-fg)] py-4 @3xl:grid-cols-[8rem_1fr_1fr]" {...ed(`experience.${index}`)}>
          <span className="text-[13px] tm">{[role.start_date, role.end_date].filter(Boolean).join("–")}</span>
          <span className="font-semibold">{role.company}</span>
          <span className="col-start-2 tm @3xl:col-start-3">{role.job_title}</span>
        </li>)}</ol>
      </section>}

      {has("testimonials") && <section className="border-t-2 border-[var(--t-fg)] py-16">{(c.testimonials ?? []).slice(0, 2).map((item, index) => <figure key={index} className="grid gap-5 py-6 @3xl:grid-cols-12" {...ed(`testimonials.${index}`)}>
        <span className="text-[5rem] font-[750] leading-[0.6] ta @3xl:col-span-1">“</span>
        <blockquote className="text-[clamp(1.5rem,3.2cqw,2.6rem)] font-[650] leading-[1.08] tracking-[-0.03em] @3xl:col-span-9 balance">{item.quote}</blockquote>
        <figcaption className="text-[13px] @3xl:col-span-9 @3xl:col-start-2">{item.name} <span className="tm">— {item.role}</span></figcaption>
      </figure>)}</section>}

      {has("highlights") && <section className="grid gap-5 border-t-2 border-[var(--t-fg)] py-12 @3xl:grid-cols-12">
        <h2 className="text-[13px] font-semibold @3xl:col-span-3">{label("highlights", "Recognition")}</h2>
        <ul className="@3xl:col-span-9">{(c.highlights ?? []).map((item, index) => <li key={index} className="grid grid-cols-[4rem_1fr] border-t border-[var(--t-rule-strong)] py-2.5" {...ed(`highlights.${index}`)}><span className="text-[13px] tm">{item.year}</span><span>{item.title}{item.detail && <span className="tm"> · {item.detail}</span>}</span></li>)}</ul>
      </section>}
    </div>

    {has("contact") && <footer id="contact" className="ba text-[var(--t-bg)]">
      <div className="mx-auto max-w-[90rem] px-5 py-16 @3xl:px-10 @3xl:py-24">
        <p className="text-[13px] font-semibold">{c.availability ?? "Get in touch"}</p>
        <a href={c.email ? `mailto:${c.email}` : "#"} className="fd mt-6 block break-all text-[clamp(2.4rem,8cqw,8rem)] font-[750] leading-[0.9] tracking-[-0.05em] hover:underline" {...ed("email")}>{c.email}</a>
        <p className="mt-12 flex flex-wrap gap-x-8 gap-y-2 text-[14px] font-medium">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover:underline">{link.label} ↗</a>)}</p>
      </div>
    </footer>}
  </StudioRoot>;
}

"use client";

import "@fontsource-variable/bodoni-moda";
import "@fontsource-variable/bodoni-moda/wght-italic.css";
import "@fontsource-variable/manrope";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, firstName, lastName, pad, paragraphs, useStudio, type StudioProps } from "../kit";

const tel = (phone?: string) => (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "#book");

export default function Lookbook({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const looks = c.projects ?? [];
  const cover = c.cover || looks[0]?.image || c.gallery?.[0]?.image;
  const book = c.email ? `mailto:${c.email}?subject=${encodeURIComponent("Booking a consultation")}` : "#book";
  const [lead, ...quotes] = c.testimonials ?? [];

  return <StudioRoot studio={studio} className="text-[15.5px] leading-[1.7]">
    <header className="flex items-center justify-between px-5 py-5 text-[12px] font-semibold uppercase tracking-[0.26em] @3xl:px-10">
      <span>{c.name}</span>
      <nav className="flex gap-6"><a href="#looks" className="hidden hover-a @2xl:inline">Looks</a><a href="#menu" className="hidden hover-a @2xl:inline">Menu</a><a href={book} className="border-b border-current pb-0.5 hover-a">Book</a></nav>
    </header>

    <section className="relative grid gap-8 px-5 pb-20 pt-6 @3xl:px-10 @4xl:grid-cols-12">
      <div className="relative z-10 @4xl:col-span-6 @4xl:pt-16">
        <p className="text-[12px] font-semibold uppercase tracking-[0.26em] ta" {...ed("professional_title")}>{c.professional_title}</p>
        <h1 className="fd mt-6 text-[clamp(4rem,13cqw,10.5rem)] font-[400] leading-[0.82] tracking-[-0.035em] @4xl:-mr-[30%]" {...ed("name")}>{firstName(c.name)}<br /><i className="pl-[12%] font-[400]">{lastName(c.name)}</i></h1>
        <p className="fd mt-10 max-w-[24rem] text-[1.5rem] italic leading-snug" {...ed("tagline")}>{c.tagline}</p>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <a href={book} className="bg-[var(--t-fg)] px-7 py-3.5 text-[12px] font-bold uppercase tracking-[0.22em] text-[var(--t-bg)] transition-colors hover:bg-[var(--t-accent)]">Book a consultation</a>
          {c.availability && <span className="text-[13px] tm" {...ed("availability")}>{c.availability}</span>}
        </div>
        {c.location && <p className="mt-10 text-[12px] font-semibold uppercase tracking-[0.26em] tm" {...ed("location")}>{c.location}</p>}
      </div>
      <div className="relative @4xl:col-span-5 @4xl:col-start-8">
        <Picture src={cover} alt={looks[0]?.title ?? c.name ?? ""} embedded={embedded} className="aspect-[4/5] w-full" edit={c.cover ? "cover" : looks[0] ? "projects.0" : undefined} />
        {looks[0] && <p className="mt-3 text-[12px] uppercase tracking-[0.2em] tm">Look 01 — {looks[0].title}</p>}
      </div>
    </section>

    {has("projects") && looks.length > 1 && <section id="looks" className="px-5 pb-24 @3xl:px-10">
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.26em] tm">{label("projects", "Looks")}</h2>
      <div className="mt-10 grid gap-x-8 gap-y-16 @3xl:grid-cols-12">{looks.slice(1).map((look, position) => {
        const index = position + 1;
        const wide = position % 3 === 0;
        return <Reveal key={index} delay={(position % 2) * 120} className={wide ? "@3xl:col-span-7" : `@3xl:col-span-5 ${position % 3 === 1 ? "@3xl:mt-32" : ""}`}>
          <figure {...ed(`projects.${index}`)}>
            <Picture src={look.image} alt={look.title ?? ""} embedded={embedded} className={wide ? "aspect-[5/4] w-full" : "aspect-[3/4] w-full"} />
            <figcaption className="mt-4 grid grid-cols-[3.5rem_1fr] gap-x-2">
              <span className="fd text-[2.2rem] italic leading-none ta">{pad(index + 1)}</span>
              <span><b className="fd block text-[1.5rem] font-[500] leading-tight">{look.title}</b><span className="text-[14px] tm pretty">{look.description}</span></span>
            </figcaption>
          </figure>
        </Reveal>;
      })}</div>
    </section>}

    {has("services") && <section id="menu" className="bs px-5 py-24 @3xl:px-10">
      <div className="mx-auto max-w-[62rem]">
        <h2 className="fd text-center text-[clamp(2.6rem,7cqw,5rem)] italic leading-none">{label("services", "The menu")}</h2>
        <ul className="mt-14 grid gap-x-14 @3xl:grid-cols-2">{(c.services ?? []).map((service, index) => <li key={index} className="border-t border-[var(--t-fg)] py-6" {...ed(`services.${index}`)}>
          <div className="flex items-baseline justify-between gap-4"><h3 className="text-[13px] font-bold uppercase tracking-[0.18em]">{service.title}</h3><span className="fd shrink-0 text-[1.35rem] tabular-nums">{service.price}</span></div>
          <p className="mt-2 text-[14.5px] tm pretty">{service.description}</p>
        </li>)}</ul>
        <p className="mt-10 text-center"><a href={book} className="text-[12px] font-bold uppercase tracking-[0.22em] underline decoration-[var(--t-accent)] decoration-2 underline-offset-[6px]">Request an appointment</a></p>
      </div>
    </section>}

    {(has("about") || lead) && <section className="grid gap-14 px-5 py-24 @3xl:px-10 @4xl:grid-cols-12">
      {has("testimonials") && lead && <figure className="@4xl:col-span-6" {...ed("testimonials.0")}>
        <blockquote className="fd text-[clamp(2rem,4.4cqw,3.3rem)] italic leading-[1.08] tracking-[-0.01em]">“{lead.quote}”</blockquote>
        <figcaption className="mt-6 text-[12px] font-semibold uppercase tracking-[0.22em] tm">{lead.name} · {lead.role}</figcaption>
      </figure>}
      {has("about") && <div className="@4xl:col-span-5 @4xl:col-start-8">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.26em] tm">{label("about", "About")}</h2>
        <div className="mt-5 space-y-4">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
        {has("skills") && <p className="mt-8 text-[12px] font-semibold uppercase leading-[2] tracking-[0.2em]" {...ed("skills")}>{(c.skills ?? []).join(" / ")}</p>}
      </div>}
    </section>}

    {(quotes.length > 0 && has("testimonials")) && <section className="grid gap-10 border-t rule px-5 py-16 @3xl:grid-cols-2 @3xl:px-10">{quotes.map((item, position) => <figure key={position} {...ed(`testimonials.${position + 1}`)}><blockquote className="fd text-[1.4rem] italic leading-snug">“{item.quote}”</blockquote><figcaption className="mt-3 text-[12px] font-semibold uppercase tracking-[0.2em] tm">{item.name}</figcaption></figure>)}</section>}

    {(has("highlights") || has("experience") || has("education")) && <section className="grid gap-12 border-t rule px-5 py-16 @3xl:grid-cols-3 @3xl:px-10">
      {has("highlights") && <div><h2 className="text-[12px] font-semibold uppercase tracking-[0.26em] tm">{label("highlights", "As seen")}</h2><ul className="mt-4 space-y-3">{(c.highlights ?? []).map((item, index) => <li key={index} {...ed(`highlights.${index}`)}><span className="fd text-[1.2rem]">{item.title}</span> <span className="text-[13px] tm">{item.year}</span></li>)}</ul></div>}
      {has("experience") && <div><h2 className="text-[12px] font-semibold uppercase tracking-[0.26em] tm">{label("experience", "Salons")}</h2><ul className="mt-4 space-y-3">{(c.experience ?? []).map((role, index) => <li key={index} {...ed(`experience.${index}`)}><span className="fd text-[1.2rem]">{role.company}</span><span className="block text-[13px] tm">{role.job_title} · {[role.start_date, role.end_date].filter(Boolean).join("–")}</span></li>)}</ul></div>}
      {has("education") && <div><h2 className="text-[12px] font-semibold uppercase tracking-[0.26em] tm">{label("education", "Training")}</h2><ul className="mt-4 space-y-3">{(c.education ?? []).map((item, index) => <li key={index} {...ed(`education.${index}`)}><span className="fd text-[1.2rem]">{item.degree}</span><span className="block text-[13px] tm">{item.school}</span></li>)}</ul></div>}
    </section>}

    {has("contact") && <footer id="book" className="bg-[var(--t-fg)] px-5 py-20 text-[var(--t-bg)] @3xl:px-10">
      <h2 className="fd text-[clamp(3.4rem,12cqw,9rem)] italic leading-[0.85] tracking-[-0.03em]">Book in.</h2>
      <div className="mt-10 grid gap-6 @3xl:grid-cols-3">
        {c.phone && <a href={tel(c.phone)} className="text-[1.15rem] tabular-nums hover:opacity-70" {...ed("phone")}><span className="block text-[11px] font-semibold uppercase tracking-[0.26em] opacity-60">Call the studio</span>{c.phone}</a>}
        <a href={c.email ? `mailto:${c.email}` : "#"} className="break-all text-[1.15rem] hover:opacity-70" {...ed("email")}><span className="block text-[11px] font-semibold uppercase tracking-[0.26em] opacity-60">Email</span>{c.email}</a>
        <p className="text-[1.15rem]"><span className="block text-[11px] font-semibold uppercase tracking-[0.26em] opacity-60">Follow</span>{contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="mr-5 hover:opacity-70">{link.label}</a>)}</p>
      </div>
    </footer>}
  </StudioRoot>;
}

"use client";

import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource-variable/eb-garamond";
import "@fontsource-variable/eb-garamond/wght-italic.css";
import "@fontsource-variable/work-sans";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";

const tel = (phone?: string) => (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "#");

/** A small drawn sprig between courses. */
const Sprig = () => <svg aria-hidden viewBox="0 0 120 24" className="mx-auto my-10 h-5 w-28 text-[var(--t-accent)]">
  <path d="M4 12h44M72 12h44" stroke="currentColor" strokeWidth=".8" />
  <path d="M60 4c-4 4-4 12 0 16 4-4 4-12 0-16Z M52 8c2 3 6 4 8 4-2-4-5-5-8-4Z M68 8c-2 3-6 4-8 4 2-4 5-5 8-4Z" fill="currentColor" />
</svg>;

const Course = ({ children }: { children: React.ReactNode }) =>
  <h2 className="text-center font-[family-name:var(--t-mono)] text-[11px] font-medium uppercase tracking-[0.42em] ta">{children}</h2>;

/** Menu line: name · dotted leader · price. */
const Line = ({ name, price, note }: { name?: string; price?: string; note?: string }) =>
  <div><div className="flex items-baseline gap-2"><span className="fd text-[1.45rem] font-[500] leading-tight">{name}</span><span aria-hidden className="flex-1 translate-y-[-5px] border-b border-dotted border-[var(--t-rule-strong)]" /><span className="shrink-0 tabular-nums">{price}</span></div>
    {note && <p className="mt-1 max-w-[34rem] italic leading-snug tm pretty">{note}</p>}</div>;

export default function Carte({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const dishes = c.projects ?? [];
  const plates = (c.gallery?.length ? c.gallery.map((item, index) => ({ image: item.image, caption: item.caption, path: `gallery.${index}` })) : dishes.filter((dish) => dish.image).map((dish) => ({ image: dish.image, caption: dish.title, path: `projects.${dishes.indexOf(dish)}` }))).slice(0, 3);

  return <StudioRoot studio={studio} className="text-[18px] leading-[1.55]">
    <div className="bs px-3 py-6 @3xl:px-8 @3xl:py-14">
    <article className="relative mx-auto max-w-[50rem] bg-[var(--t-bg)] px-6 py-14 shadow-[0_30px_60px_-30px_rgba(0,0,0,.45)] @3xl:px-16 @3xl:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-3 border border-[var(--t-rule-strong)] @3xl:inset-5" />
      <div aria-hidden className="pointer-events-none absolute inset-4 border border-[var(--t-rule)] @3xl:inset-6" />

      <header className="relative text-center">
        <p className="font-[family-name:var(--t-mono)] text-[11px] uppercase tracking-[0.42em] tm" {...ed("location")}>{c.location}</p>
        <h1 className="fd mt-8 text-[clamp(3rem,10cqw,5.6rem)] font-[400] italic leading-[0.95]" {...ed("name")}>{c.name}</h1>
        <p className="mt-4 font-[family-name:var(--t-mono)] text-[12px] uppercase tracking-[0.3em]" {...ed("professional_title")}>{c.professional_title}</p>
        <Sprig />
        <p className="fd mx-auto max-w-[30rem] text-[1.6rem] italic leading-snug balance" {...ed("tagline")}>{c.tagline}</p>
        {c.availability && <p className="mt-6 text-[15px] tm" {...ed("availability")}>{c.availability}</p>}
      </header>

      {plates.length > 0 && <div className="relative mt-14 flex justify-center gap-[4%]">{plates.map((plate, index) => <Reveal key={plate.path} delay={index * 120} className="w-[30%] max-w-[12rem]">
        <figure {...ed(plate.path)}><div className="overflow-hidden rounded-full shadow-[0_18px_30px_-16px_rgba(0,0,0,.6)]"><Picture src={plate.image} alt={plate.caption ?? ""} embedded={embedded} className="aspect-square w-full scale-[1.35]" /></div>
          <figcaption className="mt-3 text-center text-[14px] italic tm">{plate.caption}</figcaption></figure>
      </Reveal>)}</div>}

      {has("about") && <section className="relative mt-16"><Course>{label("about", "To begin")}</Course>
        <div className="mx-auto mt-6 max-w-[34rem] space-y-4 text-center">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
      </section>}

      {has("projects") && <section className="relative mt-4"><Sprig /><Course>{label("projects", "From the kitchen")}</Course>
        <ul className="mt-8 space-y-7">{dishes.map((dish, index) => <li key={index} {...ed(`projects.${index}`)}><Line name={dish.title} price={dish.year} note={[dish.description, dish.role].filter(Boolean).join(" · ")} /></li>)}</ul>
      </section>}

      {has("services") && <section className="relative mt-4"><Sprig /><Course>{label("services", "At your table")}</Course>
        <ul className="mt-8 space-y-7">{(c.services ?? []).map((service, index) => <li key={index} {...ed(`services.${index}`)}><Line name={service.title} price={service.price} note={service.description} /></li>)}</ul>
      </section>}

      {has("experience") && <section className="relative mt-4"><Sprig /><Course>{label("experience", "Kitchens")}</Course>
        <ul className="mt-8 space-y-4">{(c.experience ?? []).map((role, index) => <li key={index} {...ed(`experience.${index}`)}><Line name={role.company} price={[role.start_date, role.end_date].filter(Boolean).join("–")} note={[role.job_title, role.description].filter(Boolean).join(". ")} /></li>)}</ul>
      </section>}

      {has("highlights") && <section className="relative mt-4"><Sprig /><Course>{label("highlights", "Recognition")}</Course>
        <ul className="mt-6 space-y-2 text-center">{(c.highlights ?? []).map((item, index) => <li key={index} {...ed(`highlights.${index}`)}><span className="fd text-[1.25rem]">{item.title}</span>{(item.detail || item.year) && <span className="italic tm"> — {[item.detail, item.year].filter(Boolean).join(", ")}</span>}</li>)}</ul>
      </section>}

      {has("testimonials") && <section className="relative mt-4"><Sprig />
        <div className="space-y-10">{(c.testimonials ?? []).map((item, index) => <figure key={index} className="text-center" {...ed(`testimonials.${index}`)}>
          <blockquote className="fd mx-auto max-w-[32rem] text-[1.5rem] italic leading-snug balance">“{item.quote}”</blockquote>
          <figcaption className="mt-3 font-[family-name:var(--t-mono)] text-[11px] uppercase tracking-[0.3em] tm">{item.name} · {item.role}</figcaption>
        </figure>)}</div>
      </section>}

      {has("contact") && <footer className="relative mt-4 text-center"><Sprig /><Course>{label("contact", "Bookings & enquiries")}</Course>
        {c.phone && <a href={tel(c.phone)} className="fd mt-6 block text-[1.8rem] tabular-nums hover-a" {...ed("phone")}>{c.phone}</a>}
        <a href={c.email ? `mailto:${c.email}` : "#"} className="fd block break-all text-[1.5rem] italic hover-a" {...ed("email")}>{c.email}</a>
        <p className="mt-5 flex flex-wrap justify-center gap-x-6 font-[family-name:var(--t-mono)] text-[11px] uppercase tracking-[0.3em] tm">{contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover-a">{link.label}</a>)}</p>
      </footer>}
    </article>
    </div>
  </StudioRoot>;
}

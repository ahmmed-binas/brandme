"use client";

import "@fontsource/bowlby-one/400.css";
import "@fontsource/anton/400.css";
import "@fontsource-variable/space-grotesk";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";

const STARBURST = "polygon(50% 0%, 61% 18%, 82% 10%, 78% 32%, 100% 38%, 82% 52%, 96% 72%, 72% 72%, 68% 96%, 50% 80%, 32% 96%, 28% 72%, 4% 72%, 18% 52%, 0% 38%, 22% 32%, 18% 10%, 39% 18%)";

export default function TourPoster({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const dates = c.highlights ?? [];

  return <StudioRoot studio={studio} className="paper text-[16px] leading-[1.5]">
    <div className="mx-auto max-w-[64rem] px-4 py-6 @3xl:px-8 @3xl:py-10">
      <div className="relative border-[6px] border-[var(--t-accent)] px-5 pb-10 pt-8 text-center @3xl:px-12">
        <p className="text-[13px] font-bold uppercase tracking-[0.4em]" {...ed("professional_title")}>{c.professional_title}</p>
        <h1 className="fd mt-4 text-[clamp(4rem,17cqw,12rem)] uppercase leading-[0.82] ta" {...ed("name")}>{c.name}</h1>
        <div aria-hidden className="mx-auto mt-6 grid aspect-square w-[min(15rem,42cqw)] place-items-center ba text-[var(--t-bg)]" style={{ clipPath: STARBURST }}><span className="fd -rotate-12 text-[clamp(1.2rem,3.6cqw,2rem)] uppercase leading-none">{c.location?.split(/[·,]/)[0]?.trim()}</span></div>
        <p className="mx-auto mt-6 max-w-[34rem] text-[1.2rem] font-bold uppercase leading-tight" {...ed("tagline")}>{c.tagline}</p>

        {has("highlights") && <ul className="mt-10 border-y-[3px] border-[var(--t-fg)]">{dates.map((item, index) => <Reveal as="li" key={index} delay={index * 60}><div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b-2 border-dashed border-[var(--t-fg)] py-3 text-left last:border-b-0 @2xl:grid-cols-[9rem_1fr_auto]" {...ed(`highlights.${index}`)}>
          <span className="fd text-[1.2rem] uppercase ta @2xl:text-[1.4rem]">{item.year}</span>
          <span className="col-span-2 row-start-2 text-[1.1rem] font-bold uppercase @2xl:col-span-1 @2xl:row-start-auto">{item.title}{item.detail && <span className="block text-[13px] font-normal normal-case tm">{item.detail}</span>}</span>
          {item.url ? <a href={item.url} {...external(item.url)} className="row-start-1 justify-self-end bg-[var(--t-fg)] px-3 py-1.5 text-[12px] font-bold uppercase text-[var(--t-bg)] @2xl:row-start-auto">Tickets</a> : <span className="row-start-1 justify-self-end border-2 border-[var(--t-fg)] px-3 py-1 text-[12px] font-bold uppercase @2xl:row-start-auto">Soon</span>}
        </div></Reveal>)}</ul>}
      </div>

      {has("projects") && <section className="mt-12">
        <h2 className="fd text-center text-[clamp(2.4rem,7cqw,4rem)] uppercase ta">{label("projects", "Records")}</h2>
        <div className="mt-6 grid grid-cols-2 gap-5 @3xl:grid-cols-4">{(c.projects ?? []).map((record, index) => <figure key={index} className={`group ${index % 2 ? "rotate-[1.5deg]" : "-rotate-[1.5deg]"}`} {...ed(`projects.${index}`)}>
          <Picture src={record.image} alt={record.title ?? ""} embedded={embedded} className="aspect-square w-full border-[3px] border-[var(--t-fg)] transition-transform duration-300 group-hover:-translate-y-1" />
          <figcaption className="mt-2 text-center"><span className="fd block text-[1.1rem] uppercase leading-tight">{record.title}</span><span className="text-[12px] font-bold uppercase tm">{record.category} · {record.year}</span></figcaption>
        </figure>)}</div>
      </section>}

      {has("about") && <section className="mx-auto mt-14 max-w-[40rem] text-center">{paragraphs(c).map(({ text, index }) => <p key={index} className="mb-4 text-[1.1rem] pretty" {...ed(`summary.${index}`)}>{text}</p>)}</section>}

      {has("gallery") && <section className="mt-10 grid grid-cols-2 gap-4 @3xl:grid-cols-3">{(c.gallery ?? []).map((item, index) => <figure key={index} {...ed(`gallery.${index}`)}><Picture src={item.image} alt={item.caption ?? ""} embedded={embedded} className="aspect-[4/5] w-full border-[3px] border-[var(--t-fg)]" /><figcaption className="mt-1 text-[12px] font-bold uppercase tm">{item.caption}</figcaption></figure>)}</section>}

      {has("contact") && <footer className="mt-14 bg-[var(--t-fg)] px-6 py-12 text-center text-[var(--t-bg)]">
        <p className="text-[13px] font-bold uppercase tracking-[0.3em]">{c.availability ?? "Booking"}</p>
        <a href={c.email ? `mailto:${c.email}` : "#"} className="fd mt-3 block break-all text-[clamp(1.8rem,5.4cqw,3.6rem)] uppercase leading-none hover:text-[var(--t-accent)]" {...ed("email")}>{c.email}</a>
        <p className="mt-6 flex flex-wrap justify-center gap-5 text-[13px] font-bold uppercase">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover:text-[var(--t-accent)]">{link.label}</a>)}</p>
      </footer>}
    </div>
  </StudioRoot>;
}

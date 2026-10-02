"use client";

import "@fontsource/libre-caslon-text/400.css";
import "@fontsource/libre-caslon-text/400-italic.css";
import "@fontsource/libre-caslon-text/700.css";
import "@fontsource-variable/bodoni-moda";
import "@fontsource-variable/work-sans";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, paragraphs, roman, useStudio, type StudioProps } from "../kit";

export default function Monograph({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const plates = c.gallery ?? [];

  return <StudioRoot studio={studio} className="text-[16px] leading-[1.7]">
    <section className="grid min-h-[90vh] place-items-center px-6 py-20 text-center">
      <div>
        <p className="text-[12px] uppercase tracking-[0.4em] tm">{c.professional_title}</p>
        <h1 className="fd mt-10 text-[clamp(3rem,9cqw,7.5rem)] leading-[0.95]" {...ed("name")}>{c.name}</h1>
        <p className="fd mx-auto mt-8 max-w-[28rem] text-[1.3rem] italic tm balance" {...ed("tagline")}>{c.tagline}</p>
        {plates[0] && <div className="mx-auto mt-14 w-[min(26rem,70cqw)]" {...ed("gallery.0")}><Picture src={plates[0].image} alt={plates[0].caption ?? ""} className="aspect-[4/5] w-full" /></div>}
        <p className="mt-10 text-[12px] uppercase tracking-[0.3em] tm">{c.location}</p>
      </div>
    </section>

    {has("about") && <section className="border-t rule px-6 py-24">
      <div className="mx-auto max-w-[36rem]">
        <h2 className="text-center text-[12px] uppercase tracking-[0.4em] tm">{label("about", "Foreword")}</h2>
        <div className="fd mt-10 space-y-5 text-[1.15rem] leading-[1.75]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty [text-indent:2em] first:[text-indent:0]" {...ed(`summary.${index}`)}>{text}</p>)}</div>
        <p className="fd mt-8 text-right italic tm">— {c.name}</p>
      </div>
    </section>}

    {has("gallery") && <section aria-label={label("gallery", "Plates")}>
      {plates.map((plate, index) => <Reveal key={index} as="article" className="grid min-h-[80vh] items-center gap-8 border-t rule px-6 py-16 @3xl:grid-cols-2 @3xl:gap-0 @3xl:p-0">
        <div className={`flex h-full items-end @3xl:p-14 ${index % 2 ? "@3xl:order-2 @3xl:border-l @3xl:rule" : "@3xl:border-r @3xl:rule"}`}>
          <p className="text-[13px] leading-snug"><span className="block text-[11px] uppercase tracking-[0.3em] tm">Plate {roman(index + 1)}</span><span className="fd mt-2 block text-[1.15rem] italic">{plate.caption}</span>{plate.year && <span className="tm">{plate.year}</span>}</p>
        </div>
        <div className={`@3xl:p-[8%] ${index % 2 ? "@3xl:order-1" : ""}`} {...ed(`gallery.${index}`)}><Picture src={plate.image} alt={plate.caption ?? ""} embedded={embedded} className={`w-full ${index % 3 === 1 ? "aspect-[4/5]" : "aspect-[3/2]"}`} /></div>
      </Reveal>)}
    </section>}

    {has("testimonials") && <section className="border-t rule px-6 py-24 text-center">{(c.testimonials ?? []).slice(0, 1).map((item, index) => <figure key={index} className="mx-auto max-w-[38rem]" {...ed(`testimonials.${index}`)}><blockquote className="fd text-[clamp(1.5rem,3.4cqw,2.3rem)] italic leading-snug balance">{item.quote}</blockquote><figcaption className="mt-6 text-[12px] uppercase tracking-[0.3em] tm">{item.name}, {item.role}</figcaption></figure>)}</section>}

    {has("projects") && <section className="border-t rule px-6 py-24">
      <h2 className="text-center text-[12px] uppercase tracking-[0.4em] tm">{label("projects", "Commissions")}</h2>
      <div className="mx-auto mt-14 grid max-w-[64rem] gap-16 @3xl:grid-cols-3">{(c.projects ?? []).map((project, index) => <article key={index} {...ed(`projects.${index}`)}><Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className="aspect-[4/5] w-full" /><p className="mt-4 text-[11px] uppercase tracking-[0.3em] tm">{project.client} · {project.year}</p><h3 className="fd mt-1 text-[1.5rem] italic">{project.title}</h3><p className="mt-2 text-[14px] tm pretty">{project.description}</p></article>)}</div>
    </section>}

    <section className="border-t rule px-6 py-24">
      <div className="mx-auto grid max-w-[64rem] gap-16 @3xl:grid-cols-2">
        {has("gallery") && <div><h2 className="text-[12px] uppercase tracking-[0.4em] tm">Index of plates</h2><ol className="mt-6">{plates.map((plate, index) => <li key={index} className="flex items-baseline gap-3 border-b rule py-2 text-[14px]"><span className="w-10 shrink-0 tm">{roman(index + 1)}</span><span className="fd flex-1 italic">{plate.caption?.split(",")[0]}</span><span className="tm">{plate.year}</span></li>)}</ol></div>}
        {has("highlights") && <div><h2 className="text-[12px] uppercase tracking-[0.4em] tm">{label("highlights", "Exhibitions & awards")}</h2><ul className="mt-6">{(c.highlights ?? []).map((item, index) => <li key={index} className="border-b rule py-2 text-[14px]" {...ed(`highlights.${index}`)}><span className="tm">{item.year} — </span>{item.title}{item.detail && <span className="tm">, {item.detail}</span>}</li>)}</ul></div>}
      </div>
    </section>

    {has("contact") && <footer className="border-t rule px-6 py-20 text-center">
      <h2 className="text-[12px] uppercase tracking-[0.4em] tm">Colophon</h2>
      <p className="fd mx-auto mt-6 max-w-[30rem] italic">Photographs by {c.name}. {c.availability}</p>
      <a href={c.email ? `mailto:${c.email}` : "#"} className="fd mt-4 inline-block text-[1.6rem] hover-a" {...ed("email")}>{c.email}</a>
      <p className="mt-6 flex justify-center gap-6 text-[12px] uppercase tracking-[0.3em]">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover-a">{link.label}</a>)}</p>
    </footer>}
  </StudioRoot>;
}

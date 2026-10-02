"use client";

import "@fontsource/gloock/400.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource-variable/manrope";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";

/** Material swatches: textures drawn in CSS so they work in any palette. */
const SWATCHES: Array<{ name: string; style: React.CSSProperties }> = [
  { name: "Oiled oak", style: { background: "repeating-linear-gradient(92deg,#b98b58 0 3px,#a87a49 3px 5px,#c49a69 5px 9px)" } },
  { name: "Lime plaster", style: { background: "radial-gradient(circle at 30% 30%,#f2ece1,#ddd3c3)" } },
  { name: "Travertine", style: { background: "repeating-linear-gradient(178deg,#e6dccb 0 6px,#d8ccb6 6px 7px,#e9e0d0 7px 14px)" } },
  { name: "Blackened steel", style: { background: "linear-gradient(135deg,#3b3a38,#22211f)" } },
  { name: "Linen", style: { background: "repeating-linear-gradient(0deg,#e8e1d4 0 1px,#efe9de 1px 3px),repeating-linear-gradient(90deg,rgba(0,0,0,.04) 0 1px,transparent 1px 3px)" } },
  { name: "Terracotta", style: { background: "radial-gradient(circle at 70% 20%,#c57c55,#a65f3c)" } },
];

export default function Material({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const [hero, ...projects] = c.projects ?? [];
  const cover = c.cover || c.gallery?.[0]?.image || hero?.image;

  return <StudioRoot studio={studio} className="text-[16px] leading-[1.7]">
    <header className="flex items-center justify-between px-6 py-6 text-[14px] @3xl:px-12"><span className="fd text-[1.4rem]">{c.name}</span><nav className="flex gap-7 tm"><a href="#work" className="hover-a">Work</a><a href="#studio" className="hidden hover-a @2xl:inline">Studio</a><a href="#contact" className="hover-a">Contact</a></nav></header>

    <section className="grid gap-10 px-6 pb-20 pt-6 @3xl:px-12 @4xl:grid-cols-[1fr_1.15fr] @4xl:items-end">
      <div>
        <p className="text-[13px] uppercase tracking-[0.24em] ta" {...ed("professional_title")}>{c.professional_title}</p>
        <h1 className="fd mt-6 text-[clamp(2.8rem,7.4cqw,6.4rem)] leading-[0.98] tracking-[-0.02em] balance" {...ed("tagline")}>{c.tagline}</h1>
        <p className="mt-6 tm">{c.location}</p>
      </div>
      <div className="overflow-hidden rounded-t-[999px]" {...ed("cover")}><Picture src={cover} alt={hero?.title ?? c.name ?? ""} embedded={embedded} className="aspect-[4/5] w-full transition-transform duration-[2s] hover:scale-[1.04]" /></div>
    </section>

    <section aria-label="Materials" className="border-y rule px-6 py-10 @3xl:px-12">
      <ul className="flex flex-wrap items-center gap-x-8 gap-y-5">{SWATCHES.map((swatch) => <li key={swatch.name} className="flex items-center gap-3 text-[13px] tm"><span className="size-12 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,.08)]" style={swatch.style} />{swatch.name}</li>)}</ul>
    </section>

    {has("about") && <section id="studio" className="grid gap-10 px-6 py-24 @3xl:px-12 @4xl:grid-cols-[1fr_1.4fr]">
      <h2 className="fd text-[2.6rem] leading-tight">{label("about", "The studio")}</h2>
      <div className="space-y-5 text-[1.15rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
    </section>}

    {has("projects") && <section id="work" className="px-6 pb-24 @3xl:px-12">
      <h2 className="text-[13px] uppercase tracking-[0.24em] tm">{label("projects", "Selected projects")}</h2>
      {hero && <Reveal as="article" className="mt-8 grid gap-8 @4xl:grid-cols-[1.6fr_1fr] @4xl:items-end">
        <div {...ed("projects.0")}><Picture src={hero.image} alt={hero.title ?? ""} embedded={embedded} className="aspect-[16/10] w-full rounded-[4px]" /></div>
        <div><p className="text-[13px] tm">{[hero.category, hero.year].filter(Boolean).join(" · ")}</p><h3 className="fd mt-2 text-[2.6rem] leading-none">{hero.title}</h3><p className="mt-4 pretty">{hero.description}</p></div>
      </Reveal>}
      <div className="mt-20 grid gap-x-10 gap-y-16 @3xl:grid-cols-2">{projects.map((project, index) => <Reveal key={index} as="article" delay={(index % 2) * 120} className={index % 2 ? "@3xl:mt-24" : ""}>
        <div {...ed(`projects.${index + 1}`)}><Picture src={project.image} alt={project.title ?? ""} embedded={embedded} className={`w-full rounded-[4px] ${index % 2 ? "aspect-[4/5]" : "aspect-[5/4]"}`} /></div>
        <p className="mt-5 text-[13px] tm">{[project.category, project.client, project.year].filter(Boolean).join(" · ")}</p>
        <h3 className="fd mt-1 text-[1.9rem] leading-tight">{project.title}</h3>
        <p className="mt-2 max-w-[30rem] tm pretty">{project.description}</p>
      </Reveal>)}</div>
    </section>}

    {has("gallery") && <section className="px-6 pb-24 @3xl:px-12"><div className="columns-2 gap-4 @3xl:columns-3">{(c.gallery ?? []).map((item, index) => <figure key={index} className="mb-4 break-inside-avoid" {...ed(`gallery.${index}`)}><Picture src={item.image} alt={item.caption ?? ""} embedded={embedded} className="w-full rounded-[4px]" /><figcaption className="mt-2 text-[13px] tm">{item.caption}</figcaption></figure>)}</div></section>}

    {has("services") && <section className="bs px-6 py-24 @3xl:px-12">
      <h2 className="fd text-[2.6rem]">{label("services", "How we work")}</h2>
      <div className="mt-10 grid gap-6 @3xl:grid-cols-2">{(c.services ?? []).map((service, index) => <div key={index} className="rounded-[28px] bg-[var(--t-bg)] p-8" {...ed(`services.${index}`)}><p className="fd text-[3rem] leading-none ta">{index + 1}</p><h3 className="fd mt-4 text-[1.7rem]">{service.title}</h3><p className="mt-2 tm">{service.description}</p>{service.price && <p className="mt-6 text-[14px] font-semibold">{service.price}</p>}</div>)}</div>
    </section>}

    {has("testimonials") && <section className="px-6 py-24 text-center @3xl:px-12">{(c.testimonials ?? []).slice(0, 1).map((item, index) => <figure key={index} className="mx-auto max-w-[46rem]" {...ed(`testimonials.${index}`)}><blockquote className="fd text-[clamp(1.6rem,3.6cqw,2.6rem)] leading-snug balance">“{item.quote}”</blockquote><figcaption className="mt-6 text-[14px] tm">{item.name} — {item.role}</figcaption></figure>)}</section>}

    {has("contact") && <footer id="contact" className="grid gap-8 border-t rule px-6 py-20 @3xl:grid-cols-2 @3xl:px-12">
      <div><p className="text-[13px] uppercase tracking-[0.24em] tm">{c.availability ?? "Start a project"}</p><a href={c.email ? `mailto:${c.email}` : "#"} className="fd mt-4 block break-all text-[clamp(2rem,5cqw,3.8rem)] leading-none hover-a" {...ed("email")}>{c.email}</a></div>
      <ul className="self-end text-[15px] @3xl:text-right">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <li key={link.url}><a href={link.url} {...external(link.url)} className="tm hover-a">{link.label} ↗</a></li>)}</ul>
    </footer>}
  </StudioRoot>;
}

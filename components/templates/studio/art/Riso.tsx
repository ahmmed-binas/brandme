"use client";

import "@fontsource-variable/unbounded";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "@fontsource/bowlby-one/400.css";
import "@fontsource-variable/space-grotesk";
import { StudioRoot, contactLinks, ed, external, paragraphs, pad, useStudio, type StudioProps } from "../kit";

const halftone = (colour: string, size = 7) => ({ backgroundImage: `radial-gradient(${colour} 32%, transparent 34%)`, backgroundSize: `${size}px ${size}px` });

/** An image printed in the second ink: greyscale, multiplied over an accent block, slightly off-register. */
function RisoImage({ src, alt, className = "", edit, offset = 0 }: { src?: string; alt: string; className?: string; edit?: string; offset?: number }) {
  return <div className={`relative overflow-hidden ${className}`} {...(edit ? ed(edit) : {})}>
    <div className="absolute inset-0 ba" style={{ transform: `translate(${4 + offset}px, ${-3 - offset}px)` }} />
    {/* eslint-disable-next-line @next/next/no-img-element -- printed effect needs a plain image */}
    {src ? <img src={src} alt={alt} loading="lazy" className="relative size-full object-cover mix-blend-multiply brightness-[1.45] contrast-[1.15] grayscale" /> : <div role="img" aria-label={alt} className="relative size-full mix-blend-multiply" style={halftone("var(--t-fg)", 9)} />}
    <div className="pointer-events-none absolute inset-0 opacity-25 mix-blend-screen" style={halftone("var(--t-bg)", 5)} />
  </div>;
}

export default function Riso({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const marquee = [c.professional_title, c.location, c.availability].filter(Boolean).join("  ✶  ");

  return <StudioRoot studio={studio} className="paper fm text-[15px] leading-[1.6]">
    <header className="flex items-center justify-between border-b-2 border-[var(--t-fg)] px-5 py-3 text-[12px] font-bold uppercase @3xl:px-8"><span>Issue Nº {new Date().getFullYear() % 100}</span><span className="hidden @2xl:inline">{c.name} — printed in two inks</span><a href="#order" className="ta">Order ↓</a></header>

    <section className="relative overflow-hidden px-5 pb-12 pt-10 @3xl:px-8 @3xl:pb-20">
      <div aria-hidden className="absolute -right-[8cqw] top-6 aspect-square w-[46cqw] rounded-full ba mix-blend-multiply" />
      <div aria-hidden className="absolute right-[20cqw] top-[22cqw] aspect-square w-[22cqw] mix-blend-multiply" style={halftone("var(--t-fg)", 10)} />
      <h1 className="fd relative text-[clamp(3.4rem,13.5cqw,12rem)] font-[800] uppercase leading-[0.86] tracking-[-0.04em]" {...ed("name")}>
        <span style={{ textShadow: "0.045em 0.035em 0 var(--t-accent)" }}>{c.name}</span>
      </h1>
      <p className="relative mt-8 max-w-[30rem] text-[1.1rem] font-bold" {...ed("tagline")}>{c.tagline}</p>
    </section>

    <div className="overflow-hidden border-y-2 border-[var(--t-fg)] ba py-2 text-[var(--t-bg)]" aria-hidden><div className="flex w-max gap-8 whitespace-nowrap text-[13px] font-bold uppercase [animation:studio-marquee_28s_linear_infinite]">{Array.from({ length: 8 }, (_, i) => <span key={i}>{marquee}  ✶</span>)}</div></div>

    {has("gallery") && <section className="px-5 py-14 @3xl:px-8">
      <h2 className="fd text-[clamp(2rem,5cqw,3.6rem)] font-[800] uppercase leading-none">{label("gallery", "Prints")}</h2>
      <div className="mt-8 grid grid-cols-2 gap-4 @3xl:grid-cols-4">{(c.gallery ?? []).map((item, index) => <figure key={index} className={index % 5 === 0 ? "col-span-2 row-span-2" : ""}>
        <RisoImage src={item.image} alt={item.caption ?? ""} edit={`gallery.${index}`} offset={index % 3} className={index % 5 === 0 ? "aspect-square" : "aspect-[4/5]"} />
        <figcaption className="mt-2 flex justify-between gap-2 text-[11px] uppercase"><span className="truncate">{item.caption?.split(",")[0]}</span><span className="ta">{pad(index + 1)}</span></figcaption>
      </figure>)}</div>
    </section>}

    {has("about") && <section className="grid gap-8 border-t-2 border-[var(--t-fg)] px-5 py-14 @3xl:grid-cols-[1fr_2fr] @3xl:px-8">
      <h2 className="fd text-[clamp(2rem,5cqw,3.6rem)] font-[800] uppercase leading-none">{label("about", "About")}</h2>
      <div className="space-y-4 text-[1.05rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
    </section>}

    {has("projects") && <section className="border-t-2 border-[var(--t-fg)] px-5 py-14 @3xl:px-8">
      <h2 className="fd text-[clamp(2rem,5cqw,3.6rem)] font-[800] uppercase leading-none">{label("projects", "Projects")}</h2>
      <div className="mt-8 grid gap-8 @3xl:grid-cols-2">{(c.projects ?? []).map((project, index) => <article key={index} className="grid grid-cols-[8rem_1fr] gap-4 border-2 border-[var(--t-fg)] p-3" {...ed(`projects.${index}`)}>
        <RisoImage src={project.image} alt={project.title ?? ""} className="aspect-[3/4]" offset={index} />
        <div><p className="text-[11px] uppercase ta">{project.category} / {project.year}</p><h3 className="fd mt-1 text-[1.4rem] font-[800] uppercase leading-none">{project.title}</h3><p className="mt-3 text-[13px] pretty">{project.description}</p></div>
      </article>)}</div>
    </section>}

    <section id="order" className="grid gap-10 border-t-2 border-[var(--t-fg)] px-5 py-14 @3xl:grid-cols-2 @3xl:px-8">
      {has("services") && <div><h2 className="fd text-[clamp(2rem,5cqw,3.6rem)] font-[800] uppercase leading-none">{label("services", "Shop")}</h2>
        <ul className="mt-6 space-y-3">{(c.services ?? []).map((service, index) => <li key={index} className="flex items-start gap-4" {...ed(`services.${index}`)}><span className="relative mt-1 grid min-w-20 shrink-0 place-items-center px-2 py-1 text-[13px] font-bold text-[var(--t-bg)]"><span className="absolute inset-0 -rotate-3 ba" /><span className="relative">{service.price ?? "—"}</span></span><span><b className="uppercase">{service.title}</b><span className="block text-[13px]">{service.description}</span></span></li>)}</ul></div>}
      {has("highlights") && <div><h2 className="fd text-[clamp(2rem,5cqw,3.6rem)] font-[800] uppercase leading-none">{label("highlights", "Shows")}</h2>
        <ul className="mt-6 divide-y-2 divide-dashed divide-[var(--t-fg)]">{(c.highlights ?? []).map((item, index) => <li key={index} className="grid grid-cols-[4rem_1fr] py-2 text-[13px]" {...ed(`highlights.${index}`)}><span className="ta font-bold">{item.year}</span><span>{item.title}{item.detail && <span className="block opacity-75">{item.detail}</span>}</span></li>)}</ul></div>}
    </section>

    {has("contact") && <footer className="relative overflow-hidden border-t-2 border-[var(--t-fg)] px-5 py-16 @3xl:px-8">
      <div aria-hidden className="absolute -bottom-[20cqw] -left-[10cqw] aspect-square w-[50cqw] rounded-full ba mix-blend-multiply" />
      <p className="relative text-[12px] font-bold uppercase">Write in</p>
      <a href={c.email ? `mailto:${c.email}` : "#"} className="fd relative mt-3 block break-all text-[clamp(1.8rem,6cqw,5rem)] font-[800] uppercase leading-none hover:underline" {...ed("email")}>{c.email}</a>
      <p className="relative mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[12px] font-bold uppercase">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover:underline">{link.label} ↗</a>)}</p>
    </footer>}
  </StudioRoot>;
}

"use client";

import "@fontsource/dm-serif-display/400.css";
import "@fontsource/dm-serif-display/400-italic.css";
import "@fontsource-variable/manrope";
import { Picture, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";
import { CountUp, HorizontalScroll, Magnetic, Scrub, Words, usePointer, useRotation } from "../motion";

const tel = (phone?: string) => (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "#contact");

export default function Residence({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const listings = c.projects ?? [];
  const hero = c.cover || listings[0]?.image || c.gallery?.[0]?.image;
  const pictures = [...listings.map((item) => item.image), ...(c.gallery ?? []).map((item) => item.image)].filter(Boolean) as string[];
  const areas = usePointer<HTMLUListElement>();
  const quotes = c.testimonials ?? [];
  const rotation = useRotation(quotes.length, 7000);
  const licence = (c.education ?? [])[0];

  return <StudioRoot studio={studio} className="text-[16px] leading-relaxed">
    {/* Hero: the house fills the screen, drifting slowly; the headline rises in. */}
    <Scrub as="section" resting={0.5} className="relative isolate flex min-h-[min(100vh,58rem)] flex-col justify-between overflow-hidden px-5 pb-10 pt-6 text-white @3xl:px-12">
      <div className="absolute -inset-y-[8%] inset-x-0 -z-10 overflow-hidden" style={{ transform: "translateY(calc((var(--p) - .5) * 14%))" }}>
        <Picture src={hero} alt="" embedded={embedded} className="size-full origin-center [animation:residence-drift_24s_ease-in-out_infinite_alternate] motion-reduce:animate-none" edit={c.cover ? "cover" : listings[0] ? "projects.0" : undefined} />
      </div>
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,.45),rgba(0,0,0,.05)_35%,rgba(0,0,0,.65)),linear-gradient(90deg,rgba(0,0,0,.45),transparent_60%)]" />
      <style>{"@keyframes residence-drift{from{transform:scale(1.04)}to{transform:scale(1.16) translate(-1.5%,-1%)}}@keyframes residence-scroll{0%{transform:scaleY(0);transform-origin:top}49%{transform:scaleY(1);transform-origin:top}50%{transform-origin:bottom}100%{transform:scaleY(0);transform-origin:bottom}}"}</style>
      <header className="flex items-center justify-between text-[12px] font-semibold uppercase tracking-[0.28em]">
        <span {...ed("name")}>{c.name}</span>
        <nav className="flex items-center gap-7"><a href="#homes" className="hidden opacity-80 hover:opacity-100 @2xl:inline">Homes</a><a href="#about" className="hidden opacity-80 hover:opacity-100 @2xl:inline">About</a><a href={tel(c.phone)} className="rounded-full border border-white/50 px-4 py-2 backdrop-blur-sm transition-colors hover:bg-white hover:text-black" {...ed("phone")}>{c.phone || "Contact"}</a></nav>
      </header>
      <div className="max-w-[56rem]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.3em] opacity-85" {...ed("professional_title")}>{c.professional_title}</p>
        <h1 className="fd mt-5 text-[clamp(2.8rem,8cqw,6.6rem)] leading-[0.98] tracking-[-0.01em]" {...ed("tagline")}><Words text={c.tagline} /></h1>
        <div className="mt-10 flex flex-wrap items-end justify-between gap-6">
          {c.availability && <p className="max-w-[22rem] text-[15px] opacity-90" {...ed("availability")}>{c.availability}</p>}
          <span aria-hidden className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] opacity-80">Scroll<span className="block h-10 w-px bg-white/80 [animation:residence-scroll_2.4s_ease-in-out_infinite]" /></span>
        </div>
      </div>
    </Scrub>

    {has("stats") && <section className="grid grid-cols-3 border-b rule px-5 @3xl:px-12">{(c.stats ?? []).map((stat, index) => <div key={index} className={`py-10 @3xl:py-14 ${index ? "border-l rule pl-4 @3xl:pl-10" : ""}`} {...ed(`stats.${index}`)}>
      <p className="fd text-[clamp(2.2rem,6cqw,4.8rem)] leading-none"><CountUp value={stat.value} /></p>
      <p className="mt-2 text-[13px] uppercase tracking-[0.14em] tm">{stat.label}</p>
    </div>)}</section>}

    {has("projects") && <section id="homes" className="py-20 @3xl:py-28">
      <div className="flex items-end justify-between gap-6 px-5 @3xl:px-12">
        <h2 className="fd text-[clamp(2.4rem,6cqw,4.4rem)] leading-none">{label("projects", "Selected homes")}</h2>
        <p className="hidden max-w-[18rem] text-right text-[14px] tm @3xl:block">Scroll to walk through them.</p>
      </div>
      <HorizontalScroll height={Math.max(2, listings.length * 0.9)} className="mt-10 px-5 @3xl:px-12">
        {listings.map((home, index) => <article key={index} className="w-[min(82vw,34rem)] shrink-0 snap-start" {...ed(`projects.${index}`)}>
          <div className="group relative overflow-hidden">
            <Picture src={home.image} alt={home.title ?? ""} embedded={embedded} className="aspect-[4/3] w-full transition-transform duration-[1.4s] ease-[cubic-bezier(.2,.7,.1,1)] group-hover:scale-[1.06]" />
            {home.category && <span className="absolute left-4 top-4 bg-[var(--t-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">{home.category}</span>}
          </div>
          <div className="mt-5 flex items-baseline justify-between gap-4"><h3 className="fd text-[1.7rem] leading-tight">{home.title}</h3><span className="fd shrink-0 text-[1.4rem] ta">{home.client}</span></div>
          {home.role && <p className="mt-1 text-[13px] uppercase tracking-[0.14em] tm">{home.role}</p>}
          <p className="mt-3 max-w-[30rem] text-[15px] tm pretty">{home.description}</p>
        </article>)}
      </HorizontalScroll>
    </section>}

    {has("skills") && <section className="border-y rule px-5 py-20 @3xl:px-12 @3xl:py-28">
      <p className="text-[12px] font-semibold uppercase tracking-[0.28em] tm">{label("skills", "Where I sell")}</p>
      {/* Hovering a neighbourhood floats a home beside the pointer. */}
      <ul ref={areas} className="relative mt-8 [--hover:0]" {...ed("skills")}>
        {(c.skills ?? []).map((area, index) => <li key={area} className="group border-b rule">
          <span className="fd flex items-baseline justify-between py-4 text-[clamp(1.8rem,5cqw,3.6rem)] leading-none transition-[padding,color] duration-500 group-hover:pl-6 group-hover:text-[var(--t-accent)]"><span>{area}</span><span className="text-[13px] tm">{String(index + 1).padStart(2, "0")}</span></span>
          {pictures.length > 0 && <span aria-hidden className="pointer-events-none absolute left-0 top-0 z-10 hidden w-56 opacity-0 transition-opacity duration-300 group-hover:opacity-100 @3xl:block" style={{ transform: "translate(calc(var(--mx, 0px) + 24px), calc(var(--my, 0px) - 50%))" }}>
            <Picture src={pictures[index % pictures.length]} alt="" className="aspect-[4/3] w-full shadow-[0_30px_60px_-20px_rgba(0,0,0,.5)]" />
          </span>}
        </li>)}
      </ul>
    </section>}

    {has("about") && <section id="about" className="grid items-center gap-12 px-5 py-20 @3xl:px-12 @3xl:py-28 @4xl:grid-cols-2">
      {pictures[1] && <Scrub className="overflow-hidden"><div style={{ transform: "translateY(calc((var(--p) - .5) * -14%)) scale(1.15)" }}><Picture src={pictures[1]} alt="" embedded={embedded} className="aspect-[4/5] w-full" /></div></Scrub>}
      <div>
        <h2 className="fd text-[clamp(2.2rem,5cqw,3.8rem)] leading-[1.02]">{label("about", "A quieter way to move home")}</h2>
        <div className="mt-8 space-y-5 text-[1.08rem] leading-[1.75]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
      </div>
    </section>}

    {has("services") && <section className="bs px-5 py-20 @3xl:px-12 @3xl:py-28">
      <h2 className="fd text-[clamp(2.2rem,5cqw,3.8rem)] leading-none">{label("services", "How I help")}</h2>
      <ul className="mt-12 grid gap-px bg-[var(--t-rule)] @3xl:grid-cols-3">{(c.services ?? []).map((service, index) => <li key={index} className="group relative overflow-hidden bg-[var(--t-surface)] p-8" {...ed(`services.${index}`)}>
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-0 bg-[var(--t-accent)] opacity-10 transition-[height] duration-700 ease-[cubic-bezier(.2,.7,.1,1)] group-hover:h-full" />
        <p className="relative text-[12px] font-semibold uppercase tracking-[0.2em] ta">{service.price}</p>
        <h3 className="fd relative mt-4 text-[1.7rem] leading-tight">{service.title}</h3>
        <p className="relative mt-3 text-[15px] tm pretty">{service.description}</p>
      </li>)}</ul>
    </section>}

    {has("testimonials") && quotes.length > 0 && <section className="px-5 py-24 text-center @3xl:px-12 @3xl:py-32" onPointerEnter={rotation.pause} onPointerLeave={rotation.resume}>
      <div className="relative mx-auto grid max-w-[54rem]">{quotes.map((item, index) => <figure key={index} aria-hidden={index !== rotation.index} className={`col-start-1 row-start-1 transition-[opacity,transform] duration-1000 ${index === rotation.index ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`} {...ed(`testimonials.${index}`)}>
        <blockquote className="fd text-[clamp(1.7rem,4cqw,2.9rem)] leading-[1.18]">“{item.quote}”</blockquote>
        <figcaption className="mt-8 text-[12px] font-semibold uppercase tracking-[0.24em] tm">{item.name} · {item.role}</figcaption>
      </figure>)}</div>
      {quotes.length > 1 && <div className="mt-10 flex justify-center gap-2">{quotes.map((_, index) => <button key={index} type="button" onClick={() => rotation.setIndex(index)} aria-label={`Show review ${index + 1}`} className={`h-1 rounded-full transition-all duration-500 ${index === rotation.index ? "w-10 ba" : "w-4 bg-[var(--t-rule-strong)]"}`} />)}</div>}
    </section>}

    {has("contact") && <footer id="contact" className="bg-[var(--t-fg)] px-5 py-24 text-[var(--t-bg)] @3xl:px-12 @3xl:py-32">
      <h2 className="fd max-w-[18ch] text-[clamp(2.6rem,7cqw,5.6rem)] leading-[0.98]"><Words text="Thinking of moving? Let’s talk it through." /></h2>
      <div className="mt-12 flex flex-wrap items-center gap-10">
        <Magnetic><a href={c.email ? `mailto:${c.email}?subject=${encodeURIComponent("Private viewing")}` : "#"} className="grid size-36 place-items-center rounded-full ba text-center text-[12px] font-semibold uppercase leading-snug tracking-[0.16em] text-[var(--t-bg)]">Book a<br />private<br />viewing</a></Magnetic>
        <div className="space-y-2 text-[1.1rem]">
          {c.phone && <a href={tel(c.phone)} className="block tabular-nums hover:opacity-70">{c.phone}</a>}
          <a href={c.email ? `mailto:${c.email}` : "#"} className="block break-all hover:opacity-70" {...ed("email")}>{c.email}</a>
          <p className="flex flex-wrap gap-x-5 pt-2 text-[13px] uppercase tracking-[0.16em] opacity-70">{contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover:opacity-100">{link.label}</a>)}</p>
        </div>
      </div>
      {licence && <p className="mt-20 border-t border-current/20 pt-5 text-[12px] opacity-50" {...ed("education.0")}>{licence.degree}{licence.school && ` · ${licence.school}`}</p>}
    </footer>}
  </StudioRoot>;
}

"use client";

import "@fontsource/dm-serif-display/400.css";
import "@fontsource/dm-serif-display/400-italic.css";
import "@fontsource-variable/dm-sans";
import { Picture, StudioRoot, contactLinks, ed, external, firstName, lastName, pad, paragraphs, useStudio, type StudioProps } from "../kit";
import { Magnetic, Scrub, Words, useRotation, useSeen } from "../motion";

const tel = (phone?: string) => (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "#book");
const small = "text-[11px] font-semibold uppercase tracking-[0.26em]";

/** A menu line whose dotted leader draws across when it comes into view. */
function MenuLine({ name, price, note, path, index }: { name?: string; price?: string; note?: string; path: string; index: number }) {
  const [ref, seen] = useSeen<HTMLLIElement>();
  return <li ref={ref} className="py-5" {...ed(path)}>
    <div className="flex items-baseline gap-3"><span className="fd text-[1.7rem] leading-tight">{name}</span>
      <span aria-hidden className="h-px flex-1 origin-left translate-y-[-6px] border-b border-dotted border-[var(--t-rule-strong)] transition-transform duration-[1.2s] ease-[cubic-bezier(.7,0,.2,1)]" style={{ transform: seen ? "scaleX(1)" : "scaleX(0)", transitionDelay: `${index * 90}ms` }} />
      <span className="shrink-0 tabular-nums ta">{price}</span></div>
    {note && <p className="mt-1 max-w-[36rem] text-[15px] italic tm pretty">{note}</p>}
  </li>;
}

export default function Mise({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const dishes = c.projects ?? [];
  const plates = dishes.filter((dish) => dish.image);
  const heroPlate = c.cover || plates[0]?.image || c.gallery?.[0]?.image;
  const quotes = c.testimonials ?? [];
  const rotation = useRotation(quotes.length, 6500);
  const book = c.email ? `mailto:${c.email}?subject=${encodeURIComponent("Booking a dinner")}` : "#book";

  return <StudioRoot studio={studio} className="text-[16.5px] leading-[1.7]">
    <style>{"@keyframes mise-spin{to{transform:rotate(360deg)}}"}</style>
    <header className={`flex items-center justify-between px-5 py-5 @3xl:px-12 ${small}`}><span>{c.location}</span><nav className="flex gap-7"><a href="#dishes" className="hidden hover-a @2xl:inline">Dishes</a><a href="#menu" className="hidden hover-a @2xl:inline">Menu</a><a href="#book" className="hover-a">Book</a></nav></header>

    {/* Hero: the name over the rim of a plate that turns slowly, like a lazy Susan. */}
    <section className="flex flex-col items-center px-5 pb-16 pt-10 text-center">
      <h1 className="fd relative z-10 text-[clamp(3.6rem,14cqw,12rem)] leading-[0.84] tracking-[-0.03em]" {...ed("name")}><span className="block"><Words text={firstName(c.name)} /></span><span className="block italic ta"><Words text={lastName(c.name)} delay={200} /></span></h1>
      {heroPlate && <div aria-hidden className="-mt-[5cqw] aspect-square w-[min(78%,34rem)] overflow-hidden rounded-full shadow-[0_60px_120px_-40px_rgba(0,0,0,.6)]"><div className="size-full [animation:mise-spin_90s_linear_infinite] motion-reduce:animate-none"><Picture src={heroPlate} alt="" className="size-full scale-[1.4]" /></div></div>}
      <div className="mt-10 max-w-[32rem]">
        <p className={`${small} ta`} {...ed("professional_title")}>{c.professional_title}</p>
        <p className="fd mt-4 text-[1.8rem] italic leading-snug" {...ed("tagline")}>{c.tagline}</p>
        {c.availability && <p className="mt-4 text-[14px] tm" {...ed("availability")}>{c.availability}</p>}
      </div>
    </section>

    {has("skills") && <div aria-hidden className="overflow-hidden border-y border-[var(--t-fg)] py-5"><div className="flex w-max gap-10 [animation:studio-marquee_45s_linear_infinite]">{[...(c.skills ?? []), ...(c.skills ?? []), ...(c.skills ?? [])].map((skill, index) => <span key={index} className="fd flex items-center gap-10 whitespace-nowrap text-[clamp(1.8rem,4cqw,3rem)] italic">{skill}<span className="not-italic ta">✺</span></span>)}</div></div>}

    {has("projects") && <section id="dishes" className="px-5 py-20 @3xl:px-12 @3xl:py-28">
      <p className={`${small} tm`}>{label("projects", "Signature dishes")}</p>
      <div className="mt-12 space-y-24">{dishes.map((dish, index) => <Scrub key={index} className={`grid items-center gap-10 @4xl:grid-cols-2 ${index % 2 ? "@4xl:[&>*:first-child]:order-2" : ""}`}>
        <div className="relative mx-auto w-full max-w-[28rem]" {...ed(`projects.${index}`)}>
          {dish.image ? <div className="aspect-square overflow-hidden rounded-full shadow-[0_40px_80px_-40px_rgba(0,0,0,.55)]"><div className="size-full" style={{ transform: `rotate(calc(var(--p) * ${index % 2 ? -50 : 50}deg))` }}><Picture src={dish.image} alt={dish.title ?? ""} embedded={embedded} className="size-full scale-[1.35]" /></div></div>
            : <div className="grid aspect-square place-items-center rounded-full border border-[var(--t-rule-strong)]"><span className="fd text-[5rem] italic ta">{pad(index + 1)}</span></div>}
        </div>
        <div style={{ transform: "translateY(calc((0.5 - var(--p)) * 60px))" }}>
          <p className={`${small} ta`}>{pad(index + 1)} · {[dish.category, dish.year].filter(Boolean).join(" · ")}</p>
          <h3 className="fd mt-4 text-[clamp(2.4rem,5.4cqw,4.2rem)] leading-[0.98]">{dish.title}</h3>
          {dish.role && <p className="mt-3 italic tm">{dish.role}</p>}
          <p className="mt-5 max-w-[30rem] text-[1.08rem] pretty">{dish.description}</p>
        </div>
      </Scrub>)}</div>
    </section>}

    {has("about") && <section className="bs px-5 py-24 @3xl:px-12 @3xl:py-32"><div className="mx-auto max-w-[48rem] text-center">
      <p className={`${small} tm`}>{label("about", "The cook")}</p>
      <div className="mt-8 space-y-6">{paragraphs(c).map(({ text, index }, position) => <p key={index} className={position === 0 ? "fd text-[clamp(1.7rem,3.6cqw,2.5rem)] leading-[1.2]" : "text-[1.1rem] tm"} {...ed(`summary.${index}`)}>{text}</p>)}</div>
    </div></section>}

    {has("services") && <section id="menu" className="px-5 py-20 @3xl:px-12 @3xl:py-28"><div className="mx-auto max-w-[52rem]">
      <h2 className="fd text-center text-[clamp(2.6rem,6cqw,4.4rem)] italic leading-none">{label("services", "At your table")}</h2>
      <ul className="mt-12">{(c.services ?? []).map((service, index) => <MenuLine key={index} index={index} name={service.title} price={service.price} note={service.description} path={`services.${index}`} />)}</ul>
    </div></section>}

    {has("gallery") && (c.gallery ?? []).length > 0 && <section className="pb-20" aria-label={label("gallery", "From the pass")}>
      <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 [scrollbar-width:thin] @3xl:px-12">{(c.gallery ?? []).map((item, index) => <figure key={index} className="w-[min(78%,24rem)] shrink-0 snap-start" {...ed(`gallery.${index}`)}><Picture src={item.image} alt={item.caption ?? ""} embedded={embedded} className="aspect-[4/5] w-full" /><figcaption className={`mt-3 ${small} tm`}>{item.caption}</figcaption></figure>)}</div>
    </section>}

    {has("testimonials") && quotes.length > 0 && <section className="border-y border-[var(--t-fg)] px-5 py-24 text-center @3xl:px-12" onPointerEnter={rotation.pause} onPointerLeave={rotation.resume}>
      <div className="mx-auto grid max-w-[56rem]">{quotes.map((item, index) => <figure key={index} aria-hidden={index !== rotation.index} className={`col-start-1 row-start-1 transition-[opacity,transform] duration-1000 ${index === rotation.index ? "opacity-100" : "pointer-events-none scale-95 opacity-0"}`} {...ed(`testimonials.${index}`)}>
        <blockquote className="fd text-[clamp(1.9rem,4.4cqw,3.2rem)] italic leading-[1.12]">“{item.quote}”</blockquote>
        <figcaption className={`mt-6 ${small} tm`}>{item.name} · {item.role}</figcaption>
      </figure>)}</div>
    </section>}

    {(has("experience") || has("highlights")) && <section className="grid gap-12 px-5 py-20 @3xl:grid-cols-2 @3xl:px-12">
      {has("experience") && <div><p className={`${small} tm`}>{label("experience", "Kitchens")}</p><ul className="mt-6">{(c.experience ?? []).map((role, index) => <li key={index} className="flex flex-wrap items-baseline justify-between gap-x-6 border-b rule py-4" {...ed(`experience.${index}`)}><span><span className="fd text-[1.5rem]">{role.company}</span><span className="block text-[14px] tm">{role.job_title}</span></span><span className="text-[14px] tabular-nums tm">{[role.start_date, role.end_date].filter(Boolean).join("–")}</span></li>)}</ul></div>}
      {has("highlights") && <div><p className={`${small} tm`}>{label("highlights", "Recognition")}</p><ul className="mt-6">{(c.highlights ?? []).map((item, index) => <li key={index} className="border-b rule py-4" {...ed(`highlights.${index}`)}><span className="fd text-[1.5rem]">{item.title}</span><span className="block text-[14px] tm">{[item.detail, item.year].filter(Boolean).join(" · ")}</span></li>)}</ul></div>}
    </section>}

    {has("contact") && <footer id="book" className="bg-[var(--t-fg)] px-5 py-24 text-center text-[var(--t-bg)] @3xl:px-12">
      <h2 className="fd text-[clamp(3rem,9cqw,7.4rem)] italic leading-[0.9]"><Words text="Come and eat." /></h2>
      <div className="mt-12 flex justify-center"><Magnetic><a href={book} className="grid size-36 place-items-center rounded-full ba text-center text-[12px] font-semibold uppercase leading-snug tracking-[0.18em] text-[var(--t-bg)]">Book a<br />dinner</a></Magnetic></div>
      <div className="mt-10 space-y-1 text-[1.1rem]">
        {c.phone && <a href={tel(c.phone)} className="block tabular-nums hover:opacity-70" {...ed("phone")}>{c.phone}</a>}
        <a href={c.email ? `mailto:${c.email}` : "#"} className="block break-all hover:opacity-70" {...ed("email")}>{c.email}</a>
        <p className={`flex flex-wrap justify-center gap-x-6 pt-3 ${small} opacity-70`}>{contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover:opacity-100">{link.label}</a>)}</p>
      </div>
    </footer>}
  </StudioRoot>;
}

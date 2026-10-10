"use client";

import "@fontsource/anton";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/big-shoulders-display";
import { useMemo, useState } from "react";
import { ChromaFlow, FilmGrain, Plasma } from "shaders/react";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";
import { CountUp, Magnetic, Words } from "../motion";
import { isSold, mail, tel, viewingLink, whatsapp } from "./re-kit";
import { ShaderStage } from "./re-shader";

/** How buying a home in Dubai works, in the order it happens. */
const STEPS: Array<[string, string]> = [
  ["Know your budget", "Get a mortgage pre-approval (expats usually put down 20%) and add about 7% for fees: the 4% DLD transfer fee, the agency fee and registration."],
  ["View homes", "In person or on a live video call. I’ll tell you what similar homes really sold for, not just the asking prices."],
  ["Agree the price", "We sign the sale agreement (Form F) and you pay a deposit, usually 10%, held until transfer."],
  ["NOC from the developer", "The seller gets a no-objection certificate confirming there’s nothing owed on the home."],
  ["Transfer and keys", "Everyone meets at a registration trustee office, the title deed is issued in your name and you get the keys."],
];

/**
 * Debut: a loud personal brand for agents building a following. Liquid colour
 * chases the cursor behind a giant name; listings are phone-shaped reels to
 * swipe through; a five-step guide answers the first-time buyer's questions.
 */
export default function Debut({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label, palette, accent } = studio;
  const listings = useMemo(() => c.projects ?? [], [c.projects]);
  const [step, setStep] = useState(0);
  const bg = palette?.bg ?? "#0a0a12";
  const light = palette?.id === "paper";
  const surface = palette?.surface ?? bg;
  const chat = whatsapp(c.phone, `Hey ${c.name?.split(" ")[0] ?? ""}! Saw your page. Can we talk about a home?`);
  const social = contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url));
  const words = (c.name ?? "").split(/\s+/).filter(Boolean);

  return <StudioRoot studio={studio} className="text-[16px] leading-relaxed">
    {/* Hero: liquid colour follows the cursor; the name fills the screen. */}
    <section className="relative isolate flex min-h-[min(100vh,58rem)] flex-col overflow-hidden px-5 pb-8 pt-5 @3xl:px-10">
      <ShaderStage fallback={`radial-gradient(60% 60% at 30% 70%, ${accent}66, transparent 70%), radial-gradient(50% 50% at 80% 20%, ${accent}33, transparent 70%), ${bg}`} className="-z-10" opacity={light ? 0.6 : 1}>
        <FilmGrain strength={0.25}>
          <Plasma colorA={surface} colorB={bg} density={1.2} speed={0.6} intensity={1.1} warp={0.5} contrast={1.3} />
        </FilmGrain>
        <ChromaFlow baseColor={bg} upColor={accent} downColor={accent} leftColor={surface} rightColor={accent} intensity={0.9} radius={2.6} momentum={34} opacity={0.85} />
      </ShaderStage>

      <header className="flex items-center justify-between gap-4 text-[13px] font-semibold uppercase tracking-[0.12em]">
        <span className="rounded-full bg-[var(--t-fg)] px-3 py-1.5 text-[var(--t-bg)]" {...ed("professional_title")}>{c.professional_title}</span>
        <div className="flex items-center gap-2">{social.slice(0, 3).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hidden rounded-full border border-current px-3 py-1.5 hover:bg-[var(--t-fg)] hover:text-[var(--t-bg)] @2xl:inline">{link.label}</a>)}</div>
      </header>

      <h1 className="fd mt-auto pt-20 text-[clamp(4.4rem,21cqw,17rem)] uppercase leading-[0.82] tracking-[-0.01em]" {...ed("name")}>
        {words.map((word, index) => <span key={index} className={`block ${index % 2 ? "ta @3xl:ps-[12cqw]" : ""}`}><Words text={word} delay={index * 140} /></span>)}
      </h1>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
        <p className="max-w-[30rem] text-[clamp(1.15rem,2.4cqw,1.5rem)] font-semibold leading-snug" {...ed("tagline")}>{c.tagline}</p>
        {chat && <Magnetic><a href={chat} {...external(chat)} className="inline-flex items-center gap-3 rounded-full ba px-6 py-4 text-[15px] font-bold uppercase tracking-[0.06em] text-[var(--t-bg)]" {...ed("phone")}><span className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--t-bg)] opacity-60" /><span className="relative size-2.5 rounded-full bg-[var(--t-bg)]" /></span>WhatsApp me</a></Magnetic>}
      </div>
      {c.availability && <p className="mt-6 text-[13px] font-medium tm" {...ed("availability")}>{c.availability}</p>}
    </section>

    {has("skills") && <section className="overflow-hidden py-5 ba text-[var(--t-bg)]" {...ed("skills")}>
      <div className="flex w-max [animation:studio-marquee_28s_linear_infinite]">{[0, 1].map((copy) => <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0">{(c.skills ?? []).map((area) => <li key={area} className="fd flex items-center whitespace-nowrap px-5 text-[clamp(1.8rem,4.4cqw,3.2rem)] uppercase leading-none">{area}<span className="ms-10">✺</span></li>)}</ul>)}</div>
    </section>}

    {has("stats") && <section className="grid gap-px bg-[var(--t-rule)] @3xl:grid-cols-3">{(c.stats ?? []).map((stat, index) => <div key={index} className="bg-[var(--t-bg)] px-5 py-10 @3xl:px-10" {...ed(`stats.${index}`)}>
      <p className="fd text-[clamp(3.4rem,8cqw,6rem)] uppercase leading-none"><CountUp value={stat.value} /></p>
      <p className="mt-2 text-[14px] font-semibold uppercase tracking-[0.08em] tm">{stat.label}</p>
    </div>)}</section>}

    {has("projects") && <section id="homes" className="py-20 @3xl:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4 px-5 @3xl:px-10">
        <h2 className="fd text-[clamp(3rem,8cqw,6rem)] uppercase leading-[0.85]">{label("projects", "Home tours")}</h2>
        <p className="text-[14px] font-semibold tm">Swipe →</p>
      </div>
      <ul className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-6 [scrollbar-width:none] @3xl:px-10">{listings.map((item, index) => {
        const sold = isSold(item.category);
        return <li key={index} className="group relative aspect-[9/16] w-[min(72cqw,19rem)] shrink-0 snap-center overflow-hidden rounded-[2rem] border-[6px] border-[var(--t-fg)] bg-black" {...ed(`projects.${index}`)}>
          <Picture src={item.image} alt={item.title ?? ""} embedded={embedded} className={`absolute inset-0 size-full scale-[1.12] transition-transform duration-[6s] ease-linear group-hover:scale-100 ${sold ? "grayscale" : ""}`} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90" />
          <div className="absolute inset-x-3 top-3 flex gap-1" aria-hidden>{listings.map((_, bar) => <span key={bar} className={`h-1 flex-1 rounded-full ${bar <= index ? "bg-white" : "bg-white/30"}`} />)}</div>
          <p className="absolute left-4 top-7 flex items-center gap-2 text-[13px] font-semibold text-white"><span className="grid size-7 place-items-center rounded-full ba text-[11px] text-[var(--t-bg)]">{(c.name ?? "?")[0]}</span>{item.year}</p>
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            {item.category && <span className={`inline-block rounded-full px-3 py-1 text-[12px] font-bold uppercase ${sold ? "bg-white/20" : "ba text-[var(--t-bg)]"}`}>{item.category}</span>}
            <h3 className="mt-3 text-[1.35rem] font-bold leading-tight">{item.title}</h3>
            <p className="mt-1 text-[13px] text-white/75">{item.role}</p>
            <p className="fd mt-3 text-[2rem] uppercase leading-none" style={{ color: accent }}>{item.client}</p>
            <p className="mt-3 line-clamp-3 text-[13px] text-white/80">{item.description}</p>
            {!sold && <a href={viewingLink(c, item)} {...external(viewingLink(c, item))} className="mt-4 block rounded-full bg-white py-3 text-center text-[14px] font-bold text-black transition-transform hover:scale-[1.03]">Book a viewing</a>}
          </div>
        </li>;
      })}</ul>
    </section>}

    {has("about") && <section className="grid gap-10 px-5 py-20 @3xl:px-10 @4xl:grid-cols-[1fr_1.2fr] @4xl:items-center">
      <div className="relative">
        <Picture src={c.avatar} alt={c.name ?? ""} embedded={embedded} prompt="Add your photo" className="aspect-[4/5] w-full rounded-[2rem]" edit="avatar" />
        <span className="absolute -bottom-4 -right-2 rotate-[-6deg] rounded-full ba px-5 py-2 text-[14px] font-bold uppercase text-[var(--t-bg)]">That’s me 👋</span>
      </div>
      <div>
        <h2 className="fd text-[clamp(3rem,7cqw,5.4rem)] uppercase leading-[0.86]">{label("about", "Who I am")}</h2>
        <div className="mt-8 space-y-5 text-[1.15rem] font-medium leading-[1.65]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
        {has("highlights") && <ul className="mt-8 flex flex-wrap gap-2">{(c.highlights ?? []).map((item, index) => <li key={index} className="rounded-full border rule px-4 py-2 text-[14px] font-semibold" {...ed(`highlights.${index}`)}>{item.title}{item.detail && <span className="tm"> · {item.detail}</span>}</li>)}</ul>}
      </div>
    </section>}

    <section className="bs px-5 py-20 @3xl:px-10 @3xl:py-24">
      <h2 className="fd text-[clamp(3rem,7cqw,5.4rem)] uppercase leading-[0.86]">First home in Dubai?</h2>
      <p className="mt-4 max-w-[34rem] text-[1.1rem] tm">Five steps, start to keys. Tap each one.</p>
      <div className="mt-10 grid gap-8 @4xl:grid-cols-[1fr_1.2fr]">
        <ol className="space-y-2">{STEPS.map(([title], index) => <li key={title}><button type="button" onClick={() => setStep(index)} aria-pressed={step === index} className={`flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left text-[1.1rem] font-bold transition-colors ${step === index ? "ba text-[var(--t-bg)]" : "bg-[var(--t-bg)] hover:text-[var(--t-accent)]"}`}><span className="fd text-[1.8rem] leading-none">{index + 1}</span>{title}</button></li>)}</ol>
        <div className="relative overflow-hidden rounded-[2rem] bg-[var(--t-bg)] p-8">
          <p aria-hidden className="fd pointer-events-none absolute -right-2 -top-6 text-[12rem] leading-none opacity-[0.07]">{step + 1}</p>
          {STEPS.map(([title, text], index) => <div key={title} hidden={index !== step}><h3 className="fd text-[2.4rem] uppercase leading-none ta">{title}</h3><p className="mt-5 text-[1.15rem] leading-relaxed">{text}</p></div>)}
          <p className="mt-8 text-[13px] tm">A general guide; I’ll walk you through the details for your home.</p>
        </div>
      </div>
    </section>

    {has("services") && <section className="px-5 py-20 @3xl:px-10">
      <h2 className="fd text-[clamp(3rem,7cqw,5.4rem)] uppercase leading-[0.86]">{label("services", "What I do")}</h2>
      <ul className="mt-10 grid gap-4 @3xl:grid-cols-3">{(c.services ?? []).map((service, index) => <Reveal as="li" key={index} delay={index * 80} className="rounded-[2rem] border-2 border-[var(--t-fg)] p-7 transition-transform hover:-rotate-1">
        <div {...ed(`services.${index}`)}>
          <h3 className="text-[1.4rem] font-bold">{service.title}</h3>
          <p className="mt-2 tm pretty">{service.description}</p>
          {service.price && <p className="mt-5 inline-block rounded-full ba px-3 py-1 text-[13px] font-bold text-[var(--t-bg)]">{service.price}</p>}
        </div>
      </Reveal>)}</ul>
    </section>}

    {has("testimonials") && <section className="px-5 pb-20 @3xl:px-10">
      <h2 className="text-[14px] font-bold uppercase tracking-[0.1em] tm">{label("testimonials", "Comments")}</h2>
      <ul className="mt-6 grid gap-4 @3xl:grid-cols-2">{(c.testimonials ?? []).map((item, index) => <li key={index} className="flex gap-3" {...ed(`testimonials.${index}`)}>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bs text-[14px] font-bold">{(item.name ?? "?")[0]}</span>
        <div className="rounded-2xl rounded-tl-sm bs px-5 py-4"><p className="text-[14px] font-bold">{item.name} <span className="font-normal tm">· {item.role}</span></p><p className="mt-1">{item.quote}</p><p className="mt-2 text-[12px] tm">♥ Helpful</p></div>
      </li>)}</ul>
    </section>}

    {has("gallery") && (c.gallery ?? []).some((item) => item.image) && <section className="grid grid-cols-2 gap-1 @3xl:grid-cols-4">{(c.gallery ?? []).filter((item) => item.image).map((item, index) => <figure key={index} className="group relative aspect-square overflow-hidden" {...ed(`gallery.${index}`)}>
      <Picture src={item.image} alt={item.caption ?? ""} className="size-full transition-transform duration-700 group-hover:scale-110" />
      <figcaption className="absolute inset-0 grid place-items-center bg-black/60 p-4 text-center text-[14px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">{item.caption}</figcaption>
    </figure>)}</section>}

    {has("contact") && <footer id="contact" className="px-5 py-24 @3xl:px-10 @3xl:py-32">
      <h2 className="fd text-[clamp(3.6rem,13cqw,11rem)] uppercase leading-[0.82]"><Words text="Let’s talk." /></h2>
      <div className="mt-10 flex flex-wrap items-center gap-3 text-[15px] font-bold">
        {chat && <a href={chat} {...external(chat)} className="rounded-full ba px-6 py-4 uppercase text-[var(--t-bg)]">WhatsApp</a>}
        {c.phone && <a href={tel(c.phone)} className="rounded-full border-2 border-current px-6 py-4 tabular-nums" {...ed("phone")}>{c.phone}</a>}
        {c.email && <a href={mail(c.email, "Hello")} className="rounded-full border-2 border-current px-6 py-4" {...ed("email")}>Email</a>}
        {social.map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="rounded-full border-2 border-current px-6 py-4">{link.label}</a>)}
      </div>
      <p className="mt-16 flex flex-wrap justify-between gap-4 border-t rule pt-5 text-[13px] tm"><span {...ed("location")}>{c.location}</span>{(c.education ?? [])[0] && <span {...ed("education.0")}>{c.education![0]!.degree}</span>}</p>
    </footer>}
  </StudioRoot>;
}

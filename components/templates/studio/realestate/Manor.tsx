"use client";

import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource-variable/libre-franklin";
import "@fontsource-variable/eb-garamond";
import { useState } from "react";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";
import { CountUp, Scrub } from "../motion";
import { Lightbox, StatusTabs, isSold, mail, statuses, tel, useLightbox, viewingLink, whatsapp } from "./re-kit";

const SEASONS = ["Winter", "Spring", "Summer", "Autumn"];

/**
 * Manor: country houses and village homes, laid out like a property magazine.
 * A masthead, particulars as alternating spreads with a status stamp, a village
 * picker that finds the homes in each place, and a free valuation request.
 */
export default function Manor({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const listings = c.projects ?? [];
  const gallery = (c.gallery ?? []).filter((item) => item.image);
  const box = useLightbox(gallery.length, embedded);
  const [status, setStatus] = useState<string | null>(null);
  const villages = c.skills ?? [];
  const [village, setVillage] = useState<string | null>(null);
  const inVillage = (name: string) => listings.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(name.toLowerCase()));
  const shown = listings.map((item, index) => ({ item, index })).filter(({ item }) => !status || item.category === status);
  const now = new Date();
  const issue = `${SEASONS[Math.floor(((now.getMonth() + 1) % 12) / 3)]} ${now.getFullYear()}`;
  const [valuation, setValuation] = useState({ name: "", address: "", bedrooms: "4", when: "In the next 6 months" });
  const valuationText = `Hello ${c.name?.split(" ")[0] ?? ""}, I’d like a free valuation.\n\nName: ${valuation.name}\nAddress: ${valuation.address}\nBedrooms: ${valuation.bedrooms}\nThinking of selling: ${valuation.when}`;
  const chat = whatsapp(c.phone, valuationText);

  return <StudioRoot studio={studio} className="paper text-[16px] leading-relaxed">
    {/* Masthead */}
    <header className="border-b-2 border-[var(--t-fg)] px-5 pt-6 @3xl:px-12">
      <div className="flex items-center justify-between border-b rule pb-3 text-[11px] uppercase tracking-[0.24em] tm">
        <span>{issue}</span><span className="hidden @2xl:inline" {...ed("location")}>{c.location}</span>
        <a href="#valuation" className="ta hover:underline">Free valuation</a>
      </div>
      <h1 className="fd py-5 text-center text-[clamp(3rem,12cqw,9.5rem)] font-[400] italic leading-[0.9] tracking-[-0.02em]" {...ed("name")}>{c.name}</h1>
      <nav className="flex justify-center gap-8 border-t rule py-3 text-[11px] uppercase tracking-[0.24em]">
        <a href="#particulars" className="hover:text-[var(--t-accent)]">Particulars</a>
        {villages.length > 0 && <a href="#villages" className="hover:text-[var(--t-accent)]">Villages</a>}
        <a href="#about" className="hidden hover:text-[var(--t-accent)] @2xl:inline">About</a>
        <a href="#contact" className="hover:text-[var(--t-accent)]">Contact</a>
      </nav>
    </header>

    <section className="grid gap-8 px-5 py-10 @3xl:px-12 @4xl:grid-cols-[1.5fr_1fr] @4xl:gap-12 @4xl:py-14">
      <figure>
        <Scrub className="overflow-hidden"><div style={{ transform: "translateY(calc((var(--p) - .5) * 10%)) scale(1.1)" }}><Picture src={c.cover || listings[0]?.image} alt="" embedded={embedded} className="aspect-[3/2] w-full" edit={c.cover ? "cover" : "projects.0"} /></div></Scrub>
        {listings[0] && <figcaption className="mt-3 flex justify-between gap-4 text-[13px] italic tm"><span>{listings[0].title}</span><span>{listings[0].client}</span></figcaption>}
      </figure>
      <div className="flex flex-col justify-center">
        <p className="text-[11px] uppercase tracking-[0.28em] ta" {...ed("professional_title")}>{c.professional_title}</p>
        <p className="fd mt-5 text-[clamp(2rem,4.4cqw,3.4rem)] leading-[1.05]" {...ed("tagline")}>{c.tagline}</p>
        {c.availability && <p className="mt-6 border-l-2 border-[var(--t-accent)] pl-4 text-[15px] tm" {...ed("availability")}>{c.availability}</p>}
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#valuation" className="ba px-6 py-3 text-[12px] uppercase tracking-[0.2em] text-[var(--t-bg)] hover:opacity-90">Value my home</a>
          <a href="#particulars" className="border border-[var(--t-fg)] px-6 py-3 text-[12px] uppercase tracking-[0.2em] hover:bg-[var(--t-fg)] hover:text-[var(--t-bg)]">See the houses</a>
        </div>
      </div>
    </section>

    {has("stats") && <section className="mx-5 grid border-y-2 border-[var(--t-fg)] @3xl:mx-12 @3xl:grid-cols-3">{(c.stats ?? []).map((stat, index) => <div key={index} className={`py-8 text-center ${index ? "border-t rule @3xl:border-l @3xl:border-t-0" : ""}`} {...ed(`stats.${index}`)}>
      <p className="fd text-[clamp(2.6rem,5.4cqw,4.2rem)] italic leading-none"><CountUp value={stat.value} /></p>
      <p className="mt-2 text-[11px] uppercase tracking-[0.22em] tm">{stat.label}</p>
    </div>)}</section>}

    {has("projects") && <section id="particulars" className="px-5 py-20 @3xl:px-12 @3xl:py-24">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b rule pb-6">
        <h2 className="fd text-[clamp(2.4rem,6cqw,4.4rem)] leading-none">{label("projects", "Particulars")}</h2>
        <StatusTabs options={statuses(listings)} value={status} onChange={setStatus} tab={(active) => `px-1 pb-1 text-[12px] uppercase tracking-[0.2em] transition-colors ${active ? "border-b-2 border-[var(--t-accent)] ta" : "border-b-2 border-transparent tm hover:text-[var(--t-fg)]"}`} />
      </div>
      <div className="divide-y rule">{shown.map(({ item, index }, position) => <Reveal key={index} as="article" className="grid gap-8 py-12 @4xl:grid-cols-2 @4xl:items-center @4xl:gap-14">
        <div className={`group relative overflow-hidden ${position % 2 ? "@4xl:order-2" : ""}`} {...ed(`projects.${index}`)}>
          <Picture src={item.image} alt={item.title ?? ""} embedded={embedded} className="aspect-[4/3] w-full transition-transform duration-[1.4s] group-hover:scale-[1.04]" />
          {item.category && isSold(item.category) && <span className="absolute right-5 top-5 rotate-[8deg] border-2 border-current px-4 py-1.5 text-[13px] font-semibold uppercase tracking-[0.24em] text-white mix-blend-difference">{item.category}</span>}
        </div>
        <div {...ed(`projects.${index}`)}>
          <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.24em] tm"><span className="fd text-[2.4rem] normal-case italic leading-none ta">{String(index + 1).padStart(2, "0")}</span>{item.category}</p>
          <h3 className="fd mt-4 text-[clamp(2rem,4cqw,3rem)] leading-[1.02]">{item.title}</h3>
          <p className="mt-3 text-[13px] uppercase tracking-[0.16em] tm">{item.role}</p>
          <p className="mt-5 max-w-[34rem] tm pretty">{item.description}</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <p className="fd text-[2rem] leading-none">{item.client}</p>
            {!isSold(item.category) && <a href={viewingLink(c, item)} {...external(viewingLink(c, item))} className="text-[12px] uppercase tracking-[0.2em] underline decoration-[var(--t-accent)] decoration-2 underline-offset-[6px] hover:text-[var(--t-accent)]">Arrange a viewing</a>}
            {item.live_url && <a href={item.live_url} {...external(item.live_url)} className="text-[12px] uppercase tracking-[0.2em] tm hover:text-[var(--t-fg)]">Brochure</a>}
          </div>
        </div>
      </Reveal>)}</div>
    </section>}

    {has("skills") && villages.length > 0 && <section id="villages" className="bs px-5 py-20 @3xl:px-12 @3xl:py-24" {...ed("skills")}>
      <div className="grid gap-12 @4xl:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="fd text-[clamp(2.2rem,5cqw,3.8rem)] leading-[1.02]">{label("skills", "Villages I know best")}</h2>
          <p className="mt-4 max-w-[28rem] tm">Choose a village to see what I have there, or ask me what’s coming up before it reaches the portals.</p>
          <ul className="mt-8 flex flex-wrap gap-2">{villages.map((name) => <li key={name}><button type="button" onClick={() => setVillage(village === name ? null : name)} aria-pressed={village === name} className={`border px-4 py-2 text-[14px] transition-colors ${village === name ? "border-[var(--t-accent)] bg-[var(--t-accent)] text-[var(--t-bg)]" : "rule bg-[var(--t-bg)] hover:border-[var(--t-fg)]"}`}>{name}{inVillage(name).length > 0 && <sup className="ml-1 text-[10px]">{inVillage(name).length}</sup>}</button></li>)}</ul>
        </div>
        <div className="min-h-[16rem] border rule bg-[var(--t-bg)] p-7" aria-live="polite">
          {!village ? <p className="fd text-[1.6rem] italic leading-snug tm">“The right village matters more than the right house. You can change a kitchen; you can’t move a school or a train line.”</p>
            : inVillage(village).length > 0 ? <div><p className="text-[11px] uppercase tracking-[0.24em] ta">{village}</p><ul className="mt-4 space-y-4">{inVillage(village).map((item) => <li key={item.title} className="flex items-center gap-4"><Picture src={item.image} alt="" className="size-20 shrink-0" /><div><p className="fd text-[1.35rem] leading-tight">{item.title}</p><p className="text-[13px] tm">{item.client} · {item.category}</p></div></li>)}</ul></div>
            : <div><p className="text-[11px] uppercase tracking-[0.24em] ta">{village}</p><p className="fd mt-3 text-[1.7rem] leading-snug">Nothing on the market in {village} today.</p><p className="mt-3 tm">Homes here often sell before they’re advertised. Tell me what you’re looking for and I’ll call you first.</p><a href={mail(c.email, `Homes in ${village}`, `I’m looking for a home in ${village}. `)} className="mt-5 inline-block text-[12px] uppercase tracking-[0.2em] underline decoration-[var(--t-accent)] decoration-2 underline-offset-[6px]">Register my interest</a></div>}
        </div>
      </div>
    </section>}

    {has("about") && <section id="about" className="grid gap-12 px-5 py-20 @3xl:px-12 @3xl:py-28 @4xl:grid-cols-[0.8fr_1.2fr]">
      <div><Picture src={c.avatar} alt={c.name ?? ""} embedded={embedded} prompt="Add your portrait" className="aspect-[4/5] w-full grayscale-[0.25]" edit="avatar" /><p className="mt-3 text-[13px] italic tm">{c.name}, {c.location}</p></div>
      <div>
        <h2 className="fd text-[clamp(2.2rem,5cqw,3.8rem)] leading-[1.02]">{label("about", "A word from me")}</h2>
        <div className="mt-8 space-y-5 text-[1.1rem] leading-[1.8]">{paragraphs(c).map(({ text, index }) => <p key={index} className={`pretty ${index === 0 ? "first-letter:font-[family-name:var(--t-display)] first-letter:float-left first-letter:mr-2 first-letter:text-[4.2rem] first-letter:leading-[0.8] first-letter:text-[var(--t-accent)]" : ""}`} {...ed(`summary.${index}`)}>{text}</p>)}</div>
        {has("highlights") && <ul className="mt-10 grid gap-4 border-t rule pt-6 @3xl:grid-cols-2">{(c.highlights ?? []).map((item, index) => <li key={index} {...ed(`highlights.${index}`)}><p className="fd text-[1.3rem] leading-tight">{item.title}</p><p className="text-[13px] tm">{[item.detail, item.year].filter(Boolean).join(" · ")}</p></li>)}</ul>}
      </div>
    </section>}

    {has("gallery") && gallery.length > 0 && <section className="border-y rule py-14">
      <h2 className="fd px-5 text-[clamp(2rem,4cqw,3rem)] leading-none @3xl:px-12">{label("gallery", "From the albums")}</h2>
      <div className="mt-8 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-4 @3xl:scroll-px-12 [scrollbar-width:thin] @3xl:px-12">{gallery.map((item, index) => <button key={index} type="button" onClick={() => box.open(index)} className="group w-[min(78%,26rem)] shrink-0 snap-start text-left" {...ed(`gallery.${index}`)}>
        <span className="block overflow-hidden"><Picture src={item.image} alt={item.caption ?? ""} className="aspect-[4/3] w-full transition-transform duration-1000 group-hover:scale-[1.05]" /></span>
        <span className="mt-2 block text-[13px] italic tm">{item.caption}</span>
      </button>)}</div>
      <Lightbox items={gallery} box={box} accent={studio.accent} />
    </section>}

    {has("testimonials") && <section className="px-5 py-20 @3xl:px-12 @3xl:py-24">
      <div className="grid gap-12 @4xl:grid-cols-2">{(c.testimonials ?? []).map((item, index) => <Reveal key={index} delay={index * 120}><figure {...ed(`testimonials.${index}`)}>
        <blockquote className="fd text-[clamp(1.6rem,3cqw,2.3rem)] italic leading-[1.2]">“{item.quote}”</blockquote>
        <figcaption className="mt-5 text-[11px] uppercase tracking-[0.24em] tm">— {item.name}, {item.role}</figcaption>
      </figure></Reveal>)}</div>
    </section>}

    {has("services") && <section className="border-t-2 border-[var(--t-fg)] px-5 py-20 @3xl:px-12">
      <h2 className="fd text-[clamp(2.2rem,5cqw,3.6rem)] leading-none">{label("services", "Terms of business")}</h2>
      <dl className="mt-10 divide-y rule border-y rule">{(c.services ?? []).map((service, index) => <div key={index} className="grid gap-2 py-6 @3xl:grid-cols-[1fr_2fr_auto] @3xl:items-baseline @3xl:gap-8" {...ed(`services.${index}`)}>
        <dt className="fd text-[1.6rem] leading-tight">{service.title}</dt><dd className="tm">{service.description}</dd><dd className="text-[13px] uppercase tracking-[0.18em] ta">{service.price}</dd>
      </div>)}</dl>
    </section>}

    {/* Valuation: the form writes a message the visitor sends from their own email or WhatsApp. */}
    <section id="valuation" className="bg-[var(--t-fg)] px-5 py-20 text-[var(--t-bg)] @3xl:px-12 @3xl:py-24">
      <div className="grid gap-12 @4xl:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] opacity-70">Free, with no obligation</p>
          <h2 className="fd mt-4 text-[clamp(2.4rem,6cqw,4.4rem)] leading-[0.98]">What is your home worth?</h2>
          <p className="mt-5 max-w-[28rem] opacity-75">Tell me a little about it. I’ll visit, look at the recent sales nearby and send you a written valuation within a week.</p>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); window.location.href = mail(c.email, "Free valuation request", valuationText); }} className="grid gap-4 @3xl:grid-cols-2">
          {[["name", "Your name"], ["address", "Address or postcode"]].map(([key, text]) => <label key={key} className="block @3xl:col-span-2"><span className="text-[11px] uppercase tracking-[0.2em] opacity-70">{text}</span>
            <input required value={valuation[key as "name" | "address"]} onChange={(event) => setValuation({ ...valuation, [key!]: event.target.value })} className="mt-1 w-full border-b border-current/40 bg-transparent py-2 text-[1.1rem] outline-none focus:border-current" /></label>)}
          <label className="block"><span className="text-[11px] uppercase tracking-[0.2em] opacity-70">Bedrooms</span>
            <select value={valuation.bedrooms} onChange={(event) => setValuation({ ...valuation, bedrooms: event.target.value })} className="mt-1 w-full border-b border-current/40 bg-transparent py-2 text-[1.1rem] outline-none [&>option]:text-black">{["1", "2", "3", "4", "5", "6+"].map((n) => <option key={n}>{n}</option>)}</select></label>
          <label className="block"><span className="text-[11px] uppercase tracking-[0.2em] opacity-70">Thinking of selling</span>
            <select value={valuation.when} onChange={(event) => setValuation({ ...valuation, when: event.target.value })} className="mt-1 w-full border-b border-current/40 bg-transparent py-2 text-[1.1rem] outline-none [&>option]:text-black">{["As soon as possible", "In the next 6 months", "Next year", "Just curious"].map((n) => <option key={n}>{n}</option>)}</select></label>
          <div className="mt-4 flex flex-wrap items-center gap-4 @3xl:col-span-2">
            <button className="bg-[var(--t-bg)] px-7 py-3.5 text-[12px] uppercase tracking-[0.2em] text-[var(--t-fg)] hover:opacity-90">Request my valuation</button>
            {chat && <a href={chat} {...external(chat)} className="text-[12px] uppercase tracking-[0.2em] underline underline-offset-[6px] opacity-80 hover:opacity-100">or send by WhatsApp</a>}
          </div>
          <p className="text-[12px] opacity-60 @3xl:col-span-2">This opens your email with the details filled in, ready to send.</p>
        </form>
      </div>
    </section>

    {has("contact") && <footer id="contact" className="px-5 py-16 @3xl:px-12">
      <div className="flex flex-wrap items-end justify-between gap-8 border-b-2 border-[var(--t-fg)] pb-10">
        <p className="fd text-[clamp(2.4rem,6cqw,4.6rem)] italic leading-none">{c.name}</p>
        <div className="space-y-1 text-right text-[15px]">
          {c.phone && <a href={tel(c.phone)} className="block tabular-nums hover:text-[var(--t-accent)]" {...ed("phone")}>{c.phone}</a>}
          {c.email && <a href={`mailto:${c.email}`} className="block hover:text-[var(--t-accent)]" {...ed("email")}>{c.email}</a>}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap justify-between gap-4 text-[12px] uppercase tracking-[0.18em] tm">
        <span>{c.location}</span>
        <span className="flex flex-wrap gap-5">{contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover:text-[var(--t-fg)]">{link.label}</a>)}</span>
        {(c.education ?? [])[0] && <span {...ed("education.0")}>{c.education![0]!.degree}</span>}
      </div>
    </footer>}
  </StudioRoot>;
}

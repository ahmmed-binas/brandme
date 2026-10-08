"use client";

import "@fontsource-variable/bodoni-moda";
import "@fontsource-variable/manrope";
import "@fontsource-variable/playfair-display";
import { useMemo, useState } from "react";
import { Picture, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";
import { CountUp, Magnetic, Scrub, Words, useRotation } from "../motion";
import { CURRENCY_SIGN, Lightbox, mosaic, RATES, Slider, StatusTabs, convert, isSold, mail, money, parsePrice, statuses, tel, useLightbox, viewingLink, whatsapp } from "./re-kit";

const CURRENCIES = ["AED", "USD", "GBP", "EUR"] as const;

/**
 * Skyline: luxury and investment property (Dubai, Miami, Monaco). A slow
 * cross-fading hero, prices that switch currency live, listings that stack as
 * you scroll, a rental-yield calculator and a full-screen gallery.
 */
export default function Skyline({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const listings = useMemo(() => c.projects ?? [], [c.projects]);
  const gallery = (c.gallery ?? []).filter((item) => item.image);
  const slides = [c.cover, ...listings.map((item) => item.image), ...gallery.map((item) => item.image)].filter(Boolean).slice(0, 4) as string[];
  const hero = useRotation(slides.length, 6500);
  const quotes = c.testimonials ?? [];
  const quote = useRotation(quotes.length, 8000);
  const box = useLightbox(gallery.length, embedded);
  const tiles = mosaic(gallery.length);
  const [status, setStatus] = useState<string | null>(null);
  const base = listings.map((item) => parsePrice(item.client)).find(Boolean)?.currency ?? "USD";
  const [currency, setCurrency] = useState<string>(base);
  const shown = listings.map((item, index) => ({ item, index })).filter(({ item }) => !status || item.category === status);
  const show = (text?: string) => {
    const price = parsePrice(text);
    if (!price || currency === (price.currency ?? base)) return text;
    return `≈ ${money(convert(price.amount, price.currency ?? base, currency), currency)}`;
  };
  const priced = listings.map((item) => parsePrice(item.client)).filter(Boolean) as Array<{ amount: number; currency: string | null }>;
  const [price, setPrice] = useState(() => {
    const sorted = priced.map((item) => convert(item.amount, item.currency ?? base, base)).sort((a, b) => a - b);
    return sorted.length ? Math.round(sorted[Math.floor(sorted.length / 2)]! / 250_000) * 250_000 : 5_000_000;
  });
  const [yieldPct, setYieldPct] = useState(6.5);
  const chat = whatsapp(c.phone, `Hello ${c.name?.split(" ")[0] ?? ""}, I found you through your website.`);

  return <StudioRoot studio={studio} className="text-[15px] leading-relaxed">
    {/* Hero: photographs cross-fade and drift; the name sits in Bodoni over them. */}
    <section className="relative isolate flex min-h-[min(100vh,60rem)] flex-col overflow-hidden px-5 pb-10 pt-6 text-white @3xl:px-12">
      <div className="absolute inset-0 -z-10">
        {(slides.length ? slides : [undefined]).map((src, index) => <div key={index} className={`absolute inset-0 transition-opacity duration-[1800ms] ${index === hero.index ? "opacity-100" : "opacity-0"}`}>
          <Picture src={src} alt="" embedded={embedded} className={`size-full ${index === hero.index ? "[animation:sky-drift_9s_ease-out_forwards]" : ""} motion-reduce:animate-none`} edit={index === 0 && c.cover ? "cover" : undefined} />
        </div>)}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,14,.72),rgba(5,8,14,.1)_32%,rgba(5,8,14,.55)_58%,rgba(5,8,14,.9))]" />
      </div>
      <style>{"@keyframes sky-drift{from{transform:scale(1.14)}to{transform:scale(1.02)}}@keyframes sky-line{from{transform:scaleX(0)}to{transform:scaleX(1)}}"}</style>
      <header className="flex items-center justify-between gap-4 text-[11px] font-semibold uppercase tracking-[0.32em]">
        <span className="fd text-[15px] normal-case tracking-[0.06em]" {...ed("name")}>{c.name}</span>
        <nav className="flex items-center gap-6">
          <a href="#residences" className="hidden opacity-80 hover:opacity-100 @2xl:inline">Residences</a>
          {gallery.length > 0 && <a href="#gallery" className="hidden opacity-80 hover:opacity-100 @2xl:inline">Gallery</a>}
          <a href="#contact" className="border border-white/40 px-4 py-2 backdrop-blur-md transition-colors hover:bg-white hover:text-black">Enquire</a>
        </nav>
      </header>
      <div className="mt-auto grid gap-10 @4xl:grid-cols-[1fr_auto] @4xl:items-end">
        <div>
          <p className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--t-accent)]" {...ed("professional_title")}><span className="h-px w-10 origin-left bg-current [animation:sky-line_1.4s_ease_forwards]" />{c.professional_title}</p>
          <h1 className="fd mt-6 text-[clamp(3.2rem,11cqw,9rem)] font-[400] leading-[0.9] tracking-[-0.02em]" {...ed("name")}><Words text={c.name} step={120} /></h1>
          <p className="mt-6 max-w-[34rem] text-[clamp(1.05rem,2cqw,1.3rem)] leading-snug text-white/85" {...ed("tagline")}>{c.tagline}</p>
        </div>
        {slides.length > 1 && <div className="flex items-center gap-3">{slides.map((_, index) => <button key={index} type="button" onClick={() => hero.setIndex(index)} aria-label={`Show photo ${index + 1}`} className="group h-8 py-3.5"><span className={`block h-px transition-all duration-700 ${index === hero.index ? "w-14 bg-[var(--t-accent)]" : "w-6 bg-white/50 group-hover:bg-white"}`} /></button>)}</div>}
      </div>
      {c.availability && <p className="mt-8 border-t border-white/20 pt-5 text-[13px] text-white/80" {...ed("availability")}>{c.availability}</p>}
    </section>

    {has("stats") && <section className="grid border-b rule @3xl:grid-cols-3">{(c.stats ?? []).map((stat, index) => <div key={index} className={`px-5 py-10 @3xl:px-12 @3xl:py-14 ${index ? "border-t rule @3xl:border-l @3xl:border-t-0" : ""}`} {...ed(`stats.${index}`)}>
      <p className="fd text-[clamp(2.4rem,5cqw,4rem)] leading-none text-[var(--t-accent)]"><CountUp value={stat.value} /></p>
      <p className="mt-3 text-[12px] uppercase tracking-[0.2em] tm">{stat.label}</p>
    </div>)}</section>}

    {has("projects") && <section id="residences" className="px-5 py-20 @3xl:px-12 @3xl:py-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] ta">Portfolio</p>
          <h2 className="fd mt-3 text-[clamp(2.4rem,6cqw,4.6rem)] leading-none">{label("projects", "Residences")}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <StatusTabs options={statuses(listings)} value={status} onChange={setStatus} tab={(active) => `border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors ${active ? "border-[var(--t-accent)] bg-[var(--t-accent)] text-[var(--t-bg)]" : "rule hover:border-[var(--t-accent)]"}`} />
          <div role="radiogroup" aria-label="Show prices in" className="flex border rule">{CURRENCIES.filter((code) => RATES[code]).map((code) => <button key={code} type="button" role="radio" aria-checked={currency === code} onClick={() => setCurrency(code)} className={`px-3 py-2 text-[11px] font-semibold tracking-[0.14em] transition-colors ${currency === code ? "bg-[var(--t-fg)] text-[var(--t-bg)]" : "hover:text-[var(--t-accent)]"}`}>{code}</button>)}</div>
        </div>
      </div>
      {/* Each residence sticks and the next slides over it, like turning pages of a brochure. */}
      <div className="mt-12 space-y-6">{shown.map(({ item, index }, position) => <article key={index} className="sticky overflow-hidden border rule bg-[var(--t-surface)] shadow-[0_-30px_60px_-30px_rgba(0,0,0,.6)]" style={{ top: `${24 + position * 14}px` }} {...ed(`projects.${index}`)}>
        <div className="grid @4xl:grid-cols-[1.35fr_1fr]">
          <div className="group relative overflow-hidden">
            <Picture src={item.image} alt={item.title ?? ""} embedded={embedded} className="aspect-[16/10] w-full transition-transform duration-[1.6s] ease-[cubic-bezier(.2,.7,.1,1)] group-hover:scale-[1.05] @4xl:aspect-auto @4xl:h-full @4xl:min-h-[26rem]" />
            {item.category && <span className={`absolute left-4 top-4 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] ${isSold(item.category) ? "bg-black/70 text-white" : "ba text-[var(--t-bg)]"}`}>{item.category}</span>}
          </div>
          <div className="flex flex-col p-7 @3xl:p-10">
            <p className="fm text-[12px] tm">{String(index + 1).padStart(2, "0")} / {String(listings.length).padStart(2, "0")}</p>
            <h3 className="fd mt-4 text-[clamp(1.7rem,3.4cqw,2.6rem)] leading-[1.05]">{item.title}</h3>
            {item.role && <p className="mt-3 text-[12px] uppercase tracking-[0.18em] tm">{item.role}</p>}
            <p className="mt-5 text-[15px] tm pretty">{item.description}</p>
            <div className="mt-auto pt-8">
              <p className="fd text-[clamp(1.6rem,3cqw,2.3rem)] leading-none text-[var(--t-accent)] tabular-nums" aria-live="polite">{show(item.client)}</p>
              {!isSold(item.category) && <div className="mt-6 flex flex-wrap gap-3">
                <a href={viewingLink(c, item)} {...external(viewingLink(c, item))} className="ba px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--t-bg)] transition-opacity hover:opacity-85">Private viewing</a>
                {item.live_url && <a href={item.live_url} {...external(item.live_url)} className="border rule px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] hover:border-[var(--t-accent)]">Full details</a>}
              </div>}
            </div>
          </div>
        </div>
      </article>)}</div>
      {currency !== base && <p className="mt-6 text-[12px] tm">Converted prices are approximate, at indicative exchange rates. The asking price is in {base}.</p>}
    </section>}

    {has("projects") && priced.length > 0 && <section className="bs border-y rule px-5 py-20 @3xl:px-12 @3xl:py-24">
      <div className="grid gap-12 @4xl:grid-cols-[1fr_1.1fr] @4xl:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] ta">For investors</p>
          <h2 className="fd mt-3 text-[clamp(2.2rem,5cqw,3.8rem)] leading-[1.02]">What would it earn?</h2>
          <p className="mt-5 max-w-[30rem] tm">Move the sliders to see the gross rental income on a home at this price. Ask me for real figures for any building.</p>
        </div>
        <div className="border rule bg-[var(--t-bg)] p-7 @3xl:p-10">
          <Slider label="Purchase price" value={price} min={500_000} max={Math.max(50_000_000, price)} step={250_000} onChange={setPrice} format={(value) => money(value, base, true)} />
          <Slider className="mt-6" label="Gross yield" value={yieldPct} min={3} max={10} step={0.1} onChange={setYieldPct} format={(value) => `${value.toFixed(1)}%`} />
          <div className="mt-8 grid grid-cols-2 gap-6 border-t rule pt-6">
            <div><p className="text-[11px] uppercase tracking-[0.2em] tm">A year</p><p className="fd mt-2 text-[clamp(1.6rem,3cqw,2.4rem)] text-[var(--t-accent)] tabular-nums">{money(price * yieldPct / 100, base, true)}</p></div>
            <div><p className="text-[11px] uppercase tracking-[0.2em] tm">A month</p><p className="fd mt-2 text-[clamp(1.6rem,3cqw,2.4rem)] tabular-nums">{money(price * yieldPct / 1200, base, true)}</p></div>
          </div>
          <p className="mt-5 text-[12px] tm">Before service charges, management and vacancy. A guide, not advice.</p>
        </div>
      </div>
    </section>}

    {has("skills") && <section className="overflow-hidden border-b rule py-10" {...ed("skills")}>
      <p className="px-5 text-[11px] font-semibold uppercase tracking-[0.3em] tm @3xl:px-12">{label("skills", "Where I work")}</p>
      <div className="mt-6 flex w-max [animation:studio-marquee_40s_linear_infinite] hover:[animation-play-state:paused]">{[0, 1].map((copy) => <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0">{(c.skills ?? []).map((area) => <li key={area} className="fd flex items-center whitespace-nowrap px-6 text-[clamp(2rem,5cqw,3.6rem)] leading-none">{area}<span className="ml-12 text-[0.4em] ta">◆</span></li>)}</ul>)}</div>
    </section>}

    {has("about") && <section className="grid items-center gap-12 px-5 py-20 @3xl:px-12 @3xl:py-28 @4xl:grid-cols-[0.9fr_1.1fr]">
      <Scrub className="relative overflow-hidden">
        <div style={{ transform: "translateY(calc((var(--p) - .5) * -10%)) scale(1.12)" }}><Picture src={c.avatar} alt={c.name ?? ""} embedded={embedded} prompt="Add your portrait" className="aspect-[4/5] w-full" edit="avatar" /></div>
        <span aria-hidden className="absolute inset-3 border border-white/30" />
      </Scrub>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] ta">{label("about", "Your adviser")}</p>
        <h2 className="fd mt-4 text-[clamp(2.2rem,5cqw,3.8rem)] leading-[1.02]">{c.name}</h2>
        <div className="mt-8 space-y-5 text-[1.05rem] leading-[1.8] tm">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
        {(c.highlights ?? []).length > 0 && has("highlights") && <ul className="mt-10 space-y-3 border-t rule pt-6">{(c.highlights ?? []).map((item, index) => <li key={index} className="flex items-baseline justify-between gap-4 text-[14px]" {...ed(`highlights.${index}`)}><span>{item.title}{item.detail && <span className="tm"> · {item.detail}</span>}</span><span className="fm shrink-0 text-[12px] ta">{item.year}</span></li>)}</ul>}
      </div>
    </section>}

    {has("services") && <section className="border-t rule px-5 py-20 @3xl:px-12 @3xl:py-28">
      <h2 className="fd text-[clamp(2.2rem,5cqw,3.8rem)] leading-none">{label("services", "How I can help")}</h2>
      <ul className="mt-12 grid gap-px border rule bg-[var(--t-rule)] @3xl:grid-cols-3">{(c.services ?? []).map((service, index) => <li key={index} className="group relative bg-[var(--t-bg)] p-8 transition-colors duration-500 hover:bg-[var(--t-surface)]" {...ed(`services.${index}`)}>
        <span className="fm text-[12px] ta">0{index + 1}</span>
        <h3 className="fd mt-6 text-[1.7rem] leading-tight">{service.title}</h3>
        <p className="mt-3 text-[14px] tm pretty">{service.description}</p>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em]">{service.price}</p>
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[var(--t-accent)] transition-transform duration-700 group-hover:scale-x-100" />
      </li>)}</ul>
    </section>}

    {has("gallery") && gallery.length > 0 && <section id="gallery" className="px-5 pb-20 @3xl:px-12 @3xl:pb-28">
      <div className="flex items-end justify-between gap-6"><h2 className="fd text-[clamp(2.2rem,5cqw,3.8rem)] leading-none">{label("gallery", "Gallery")}</h2><p className="text-[12px] uppercase tracking-[0.2em] tm">{gallery.length} photographs</p></div>
      <div className="mt-10 grid grid-flow-dense auto-rows-[9rem] grid-cols-2 gap-3 @3xl:auto-rows-[13rem] @3xl:grid-cols-4">{gallery.map((item, index) => <button key={index} type="button" onClick={() => box.open(index)} className={`group relative overflow-hidden text-left ${tiles[index]}`} {...ed(`gallery.${index}`)}>
        <Picture src={item.image} alt={item.caption ?? ""} className="size-full transition-transform duration-[1.2s] group-hover:scale-[1.06]" />
        <span className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/75 to-transparent p-4 text-[13px] text-white transition-transform duration-500 group-hover:translate-y-0">{item.caption}</span>
      </button>)}</div>
      <Lightbox items={gallery} box={box} accent={studio.accent} />
    </section>}

    {has("testimonials") && quotes.length > 0 && <section className="bs border-y rule px-5 py-24 text-center @3xl:px-12 @3xl:py-32" onPointerEnter={quote.pause} onPointerLeave={quote.resume}>
      <p className="fd text-[5rem] leading-none ta" aria-hidden>“</p>
      <div className="mx-auto grid max-w-[52rem]">{quotes.map((item, index) => <figure key={index} aria-hidden={index !== quote.index} className={`col-start-1 row-start-1 transition-[opacity,transform] duration-1000 ${index === quote.index ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`} {...ed(`testimonials.${index}`)}>
        <blockquote className="fd text-[clamp(1.6rem,3.6cqw,2.6rem)] leading-[1.2]">{item.quote}</blockquote>
        <figcaption className="mt-8 text-[11px] font-semibold uppercase tracking-[0.26em] tm">{item.name} · {item.role}</figcaption>
      </figure>)}</div>
      {quotes.length > 1 && <div className="mt-10 flex justify-center gap-2">{quotes.map((_, index) => <button key={index} type="button" onClick={() => quote.setIndex(index)} aria-label={`Show review ${index + 1}`} className={`h-px transition-all duration-500 ${index === quote.index ? "w-12 ba" : "w-5 bg-[var(--t-rule-strong)]"}`} />)}</div>}
    </section>}

    {has("contact") && <footer id="contact" className="relative isolate overflow-hidden px-5 py-24 @3xl:px-12 @3xl:py-32">
      <div className="absolute inset-0 -z-10 opacity-25"><Picture src={slides[slides.length - 1]} alt="" className="size-full" /><div className="absolute inset-0 bg-[var(--t-bg)]/70" /></div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] ta">Private enquiries</p>
      <h2 className="fd mt-5 max-w-[16ch] text-[clamp(2.8rem,8cqw,6.4rem)] leading-[0.95]"><Words text="Let’s find your next address." /></h2>
      <div className="mt-12 flex flex-wrap items-center gap-8">
        <Magnetic><a href={mail(c.email, "Private enquiry")} className="grid size-36 place-items-center rounded-full ba text-center text-[11px] font-semibold uppercase leading-snug tracking-[0.18em] text-[var(--t-bg)]" {...ed("email")}>Book a<br />private<br />consultation</a></Magnetic>
        <div className="space-y-2 text-[1.05rem]">
          {chat && <a href={chat} {...external(chat)} className="flex items-center gap-2 hover:text-[var(--t-accent)]"><span className="size-2 rounded-full bg-[#25d366]" />WhatsApp me</a>}
          {c.phone && <a href={tel(c.phone)} className="block tabular-nums hover:text-[var(--t-accent)]" {...ed("phone")}>{c.phone}</a>}
          {c.email && <a href={`mailto:${c.email}`} className="block break-all hover:text-[var(--t-accent)]">{c.email}</a>}
          <p className="flex flex-wrap gap-x-5 pt-2 text-[11px] uppercase tracking-[0.2em] tm">{contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover:text-[var(--t-fg)]">{link.label}</a>)}</p>
        </div>
      </div>
      <p className="mt-20 flex flex-wrap justify-between gap-4 border-t rule pt-5 text-[12px] tm"><span>{c.location}</span>{(c.education ?? [])[0] && <span {...ed("education.0")}>{c.education![0]!.degree}</span>}<span>{CURRENCY_SIGN[base] ? `Prices in ${base}` : ""}</span></p>
    </footer>}
  </StudioRoot>;
}

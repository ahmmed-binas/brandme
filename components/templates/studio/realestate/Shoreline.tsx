"use client";

import "@fontsource-variable/fraunces";
import "@fontsource-variable/dm-sans";
import "@fontsource/young-serif";
import { useEffect, useRef, useState } from "react";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";
import { CountUp, Words, motionOff, scrollParent } from "../motion";
import { Lightbox, Slider, StatusTabs, isSold, mail, money, parsePrice, statuses, tel, useLightbox, viewingLink, whatsapp } from "./re-kit";

/** Two layered waves drifting sideways; the bottom edge of a section. */
function Waves({ className = "", tone = "var(--t-bg)" }: { className?: string; tone?: string }) {
  const wave = "M0 40 Q 150 0 300 40 T 600 40 T 900 40 T 1200 40 V 120 H 0 Z";
  return <div aria-hidden className={`pointer-events-none absolute inset-x-0 bottom-0 h-[clamp(3rem,8cqw,6rem)] overflow-hidden ${className}`}>
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute bottom-0 h-full w-[200%] [animation:shore-drift_14s_linear_infinite] opacity-40"><path d={wave} fill={tone} /><path d={wave} fill={tone} transform="translate(1200 0)" /></svg>
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute bottom-0 h-[80%] w-[200%] [animation:shore-drift_9s_linear_infinite_reverse]"><path d={wave} fill={tone} /><path d={wave} fill={tone} transform="translate(1200 0)" /></svg>
  </div>;
}

/**
 * Shoreline: coastal and holiday homes. Waves along the hero, a photograph
 * that changes as you read down the homes, a holiday-let income estimate and
 * a masonry gallery.
 */
export default function Shoreline({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const listings = c.projects ?? [];
  const gallery = (c.gallery ?? []).filter((item) => item.image);
  const box = useLightbox(gallery.length, embedded);
  const [status, setStatus] = useState<string | null>(null);
  const shown = listings.map((item, index) => ({ item, index })).filter(({ item }) => !status || item.category === status);
  const [active, setActive] = useState(0);
  const blocks = useRef<Array<HTMLElement | null>>([]);
  const currency = listings.map((item) => parsePrice(item.client)).find(Boolean)?.currency ?? "EUR";
  const [weeks, setWeeks] = useState(20);
  const [home, setHome] = useState(() => listings.findIndex((item) => parsePrice(item.client) && !isSold(item.category)));
  const homePrice = parsePrice(listings[home]?.client)?.amount ?? 0;
  // A starting nightly rate in proportion to the price (about 6% gross at 20 weeks), which the visitor then adjusts.
  const suggested = (amount: number) => Math.min(2000, Math.max(80, Math.round((amount * 0.00045) / 10) * 10));
  const [nightly, setNightly] = useState(() => suggested(homePrice || 800_000));
  const income = nightly * 7 * weeks;
  const chat = whatsapp(c.phone, `Olá ${c.name?.split(" ")[0] ?? ""}! I’d like to plan a viewing trip.`);

  // The photo panel follows whichever home is in the middle of the screen.
  const [moving, setMoving] = useState(false);
  useEffect(() => {
    if (motionOff()) return;
    const frame = requestAnimationFrame(() => setMoving(true));
    const first = blocks.current.find(Boolean) ?? null;
    const parent = scrollParent(first);
    let pending = 0;
    // The active home is the last one whose top has passed the middle of the view.
    const measure = () => {
      pending = 0;
      const middle = parent instanceof Window ? innerHeight / 2 : parent.getBoundingClientRect().top + parent.clientHeight / 2;
      let next = 0;
      blocks.current.forEach((node, position) => { if (node && node.getBoundingClientRect().top < middle) next = position; });
      setActive(next);
    };
    const schedule = () => { if (!pending) pending = requestAnimationFrame(measure); };
    measure();
    parent.addEventListener("scroll", schedule, { passive: true });
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(pending); parent.removeEventListener("scroll", schedule); };
  }, [shown.length, status]);
  const current = shown[Math.min(active, shown.length - 1)];

  return <StudioRoot studio={studio} className="text-[16px] leading-relaxed">
    <style>{"@keyframes shore-drift{to{transform:translateX(-50%)}}@keyframes shore-bob{50%{transform:translateY(-6px)}}"}</style>
    <section className="relative isolate flex min-h-[min(100vh,56rem)] flex-col px-5 pb-28 pt-6 text-white @3xl:px-12">
      <div className="absolute inset-0 -z-10"><Picture src={c.cover || listings[0]?.image} alt="" embedded={embedded} className="size-full" edit={c.cover ? "cover" : undefined} /><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,30,44,.5),transparent_65%),linear-gradient(180deg,rgba(6,30,44,.55),rgba(6,30,44,.15)_40%,rgba(6,30,44,.55))]" /></div>
      <header className="flex items-center justify-between text-[14px]">
        <span className="fd text-[1.2rem] italic" {...ed("location")}>{c.location}</span>
        <nav className="flex items-center gap-6"><a href="#homes" className="hidden opacity-85 hover:opacity-100 @2xl:inline">Homes</a><a href="#places" className="hidden opacity-85 hover:opacity-100 @2xl:inline">Places</a><a href="#contact" className="rounded-full bg-white/90 px-5 py-2 font-medium text-[#0f2a3a] backdrop-blur hover:bg-white">Plan a visit</a></nav>
      </header>
      <div className="m-auto max-w-[60rem] text-center">
        <p className="text-[13px] font-medium uppercase tracking-[0.3em] opacity-90" {...ed("professional_title")}>{c.professional_title}</p>
        <h1 className="fd mt-6 text-[clamp(3.4rem,11cqw,8.6rem)] font-[350] leading-[0.92] tracking-[-0.03em] [font-variation-settings:'SOFT'_100,'WONK'_1]" {...ed("name")}><Words text={c.name} step={110} /></h1>
        <p className="fd mx-auto mt-6 max-w-[36rem] text-[clamp(1.15rem,2.4cqw,1.6rem)] italic leading-snug opacity-95" {...ed("tagline")}>{c.tagline}</p>
      </div>
      <Waves />
    </section>

    {has("stats") && <section className="flex flex-wrap justify-center gap-x-16 gap-y-8 px-5 py-12">{(c.stats ?? []).map((stat, index) => <div key={index} className="text-center" {...ed(`stats.${index}`)}>
      <p className="fd text-[clamp(2.6rem,6cqw,4.4rem)] font-[350] leading-none ta"><CountUp value={stat.value} /></p>
      <p className="mt-2 text-[14px] tm">{stat.label}</p>
    </div>)}</section>}

    {has("projects") && <section id="homes" className="px-5 py-16 @3xl:px-12 @3xl:py-20">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <h2 className="fd text-[clamp(2.4rem,6cqw,4.4rem)] font-[350] leading-none tracking-[-0.02em]">{label("projects", "Homes by the sea")}</h2>
        <StatusTabs options={statuses(listings)} value={status} onChange={(value) => { setStatus(value); setActive(0); }} tab={(active) => `rounded-full px-4 py-2 text-[14px] transition-colors ${active ? "ba text-[var(--t-bg)]" : "bg-[var(--t-surface)] hover:bg-[var(--t-rule)]"}`} />
      </div>
      <div className="mt-12 grid gap-10 @4xl:grid-cols-[1.15fr_1fr]">
        {/* Sticky photograph on wide screens, cross-fading between homes. */}
        <div className="hidden @4xl:block">
          <div className="sticky top-6 aspect-[4/5] overflow-hidden rounded-[2rem]">
            {shown.map(({ item, index }, position) => <div key={index} className={`absolute inset-0 transition-[opacity,transform] duration-[1100ms] ease-[cubic-bezier(.2,.7,.1,1)] ${current?.index === index ? "scale-100 opacity-100" : "scale-[1.06] opacity-0"}`} aria-hidden={current?.index !== index}>
              <Picture src={item.image} alt={item.title ?? ""} embedded={embedded} className="size-full" />
              <span className="absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-1.5 text-[13px] font-medium text-[#0f2a3a] backdrop-blur">{String(position + 1).padStart(2, "0")} · {item.title}</span>
            </div>)}
          </div>
        </div>
        <div className="space-y-6 @4xl:space-y-[18vh] @4xl:py-[8vh]">{shown.map(({ item, index }, position) => <article key={index} ref={(node) => { blocks.current[position] = node; }} data-position={position} className={`transition-opacity duration-700 @4xl:min-h-[36vh] ${current?.index === index || !moving ? "opacity-100" : "@4xl:opacity-35"}`} {...ed(`projects.${index}`)}>
          <Picture src={item.image} alt={item.title ?? ""} embedded={embedded} className="mb-6 aspect-[4/3] w-full rounded-[1.5rem] @4xl:hidden" />
          <p className="flex items-center gap-3 text-[13px] font-medium uppercase tracking-[0.2em]"><span className={`size-2 rounded-full ${isSold(item.category) ? "bg-[var(--t-muted)]" : "ba"}`} /><span className={isSold(item.category) ? "tm" : "ta"}>{item.category}</span></p>
          <h3 className="fd mt-3 text-[clamp(2rem,4cqw,3rem)] font-[350] leading-[1.02] tracking-[-0.02em]">{item.title}</h3>
          <p className="mt-2 text-[15px] tm">{item.role}</p>
          <p className="mt-4 max-w-[30rem] pretty">{item.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <p className="fd text-[1.9rem] font-[400]">{item.client}</p>
            {!isSold(item.category) && <a href={viewingLink(c, item)} {...external(viewingLink(c, item))} className="rounded-full ba px-5 py-2.5 text-[14px] font-medium text-[var(--t-bg)] hover:opacity-90">Ask about a viewing</a>}
            {item.live_url && <a href={item.live_url} {...external(item.live_url)} className="text-[14px] underline underline-offset-4 tm hover:text-[var(--t-fg)]">Details</a>}
          </div>
        </article>)}</div>
      </div>
    </section>}

    {has("projects") && home >= 0 && <section className="relative bs px-5 py-20 @3xl:px-12 @3xl:py-24">
      <div className="mx-auto grid max-w-[64rem] gap-10 @4xl:grid-cols-2 @4xl:items-center">
        <div>
          <h2 className="fd text-[clamp(2.2rem,5cqw,3.6rem)] font-[350] leading-[1.02] tracking-[-0.02em]">Let it while you’re not there</h2>
          <p className="mt-4 tm">A rough guide to what a holiday home here can earn. I’ll introduce you to managers who can give you real figures.</p>
          <label className="mt-6 block text-[14px]"><span className="tm">Home</span>
            <select value={home} onChange={(event) => { const next = Number(event.target.value); setHome(next); setNightly(suggested(parsePrice(listings[next]?.client)?.amount ?? 800_000)); }} className="mt-1 w-full rounded-xl border rule bg-[var(--t-bg)] px-3 py-2.5 outline-none focus:border-[var(--t-accent)]">{listings.map((item, index) => !isSold(item.category) && parsePrice(item.client) && <option key={index} value={index}>{item.title} · {item.client}</option>)}</select></label>
        </div>
        <div className="rounded-[2rem] bg-[var(--t-bg)] p-7 shadow-[0_30px_60px_-30px_rgba(16,40,58,.35)] @3xl:p-9">
          <Slider label="Nightly rate" value={nightly} min={80} max={2000} step={10} onChange={setNightly} format={(value) => money(value, currency)} />
          <Slider className="mt-6" label="Weeks let each year" value={weeks} min={4} max={40} step={1} onChange={setWeeks} format={(value) => `${value} weeks`} />
          <div className="mt-8 flex items-end justify-between gap-4 border-t rule pt-6">
            <div><p className="text-[13px] tm">Before costs, a year</p><p className="fd text-[clamp(2.4rem,5cqw,3.4rem)] font-[350] leading-none ta tabular-nums">{money(income, currency)}</p></div>
            {homePrice > 0 && <div className="text-right"><p className="text-[13px] tm">Gross yield</p><p className="fd text-[1.8rem] tabular-nums">{((income / homePrice) * 100).toFixed(1)}%</p></div>}
          </div>
          <p className="mt-4 text-[12px] tm">Management usually takes 20–25%. Licences and local tax vary by area.</p>
        </div>
      </div>
    </section>}

    {has("skills") && <section id="places" className="overflow-hidden py-20" {...ed("skills")}>
      <h2 className="fd px-5 text-[clamp(2.2rem,5cqw,3.6rem)] font-[350] tracking-[-0.02em] @3xl:px-12">{label("skills", "Places I know")}</h2>
      <ul className="mt-8 flex gap-4 overflow-x-auto px-5 pb-6 [scrollbar-width:none] @3xl:px-12">{(c.skills ?? []).map((place, index) => {
        const picture = [...listings.map((item) => item.image), ...gallery.map((item) => item.image)].filter(Boolean)[index % Math.max(1, listings.length + gallery.length)];
        return <li key={place} className="w-52 shrink-0 rounded-xl bg-white p-2.5 pb-4 text-[#10283a] shadow-[0_12px_30px_-12px_rgba(16,40,58,.35)] transition-transform hover:-translate-y-2" style={{ rotate: `${index % 2 ? 2 : -2}deg`, animation: !moving ? undefined : `shore-bob ${5 + (index % 3)}s ease-in-out ${index * 0.4}s infinite` }}>
          <Picture src={picture} alt="" className="aspect-[4/3] w-full rounded-lg" />
          <p className="fd mt-3 px-1 text-[1.3rem] italic">{place}</p>
        </li>;
      })}</ul>
    </section>}

    {has("about") && <section className="grid items-center gap-12 px-5 py-16 @3xl:px-12 @4xl:grid-cols-2">
      {c.avatar ? <Picture src={c.avatar} alt={c.name ?? ""} embedded={embedded} className="aspect-square w-full max-w-[28rem] rounded-full" edit="avatar" />
        : <Picture src={gallery[1]?.image ?? listings[1]?.image} alt="" embedded={embedded} prompt="Add your portrait" className="aspect-square w-full max-w-[28rem] rounded-full" edit="avatar" />}
      <div>
        <h2 className="fd text-[clamp(2.2rem,5cqw,3.6rem)] font-[350] leading-[1.02] tracking-[-0.02em]">{label("about", "Hello, olá, γεια σας")}</h2>
        <div className="mt-6 space-y-4 text-[1.08rem] leading-[1.8]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
        {has("highlights") && <ul className="mt-8 space-y-2 text-[14px] tm">{(c.highlights ?? []).map((item, index) => <li key={index} {...ed(`highlights.${index}`)}>〜 {item.title}{item.detail && `, ${item.detail}`}</li>)}</ul>}
      </div>
    </section>}

    {has("services") && <section className="px-5 py-16 @3xl:px-12">
      <h2 className="fd text-[clamp(2.2rem,5cqw,3.6rem)] font-[350] tracking-[-0.02em]">{label("services", "Buying from abroad, made simple")}</h2>
      <ol className="relative mt-10 grid gap-8 @3xl:grid-cols-3">
        <span aria-hidden className="absolute left-0 right-0 top-6 hidden h-px border-t-2 border-dashed rule @3xl:block" />
        {(c.services ?? []).map((service, index) => <Reveal as="li" key={index} delay={index * 140} className="relative"><div {...ed(`services.${index}`)}>
          <span className="fd relative grid size-12 place-items-center rounded-full ba text-[1.2rem] text-[var(--t-bg)]">{index + 1}</span>
          <h3 className="fd mt-5 text-[1.5rem] leading-tight">{service.title}</h3>
          <p className="mt-2 tm">{service.description}</p>
          <p className="mt-3 text-[14px] font-medium ta">{service.price}</p>
        </div></Reveal>)}
      </ol>
    </section>}

    {has("gallery") && gallery.length > 0 && <section className="px-5 py-16 @3xl:px-12">
      <h2 className="fd text-[clamp(2.2rem,5cqw,3.6rem)] font-[350] tracking-[-0.02em]">{label("gallery", "Light, water, stone")}</h2>
      <div className="mt-8 columns-2 gap-4 @3xl:columns-3">{gallery.map((item, index) => <button key={index} type="button" onClick={() => box.open(index)} className="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl" {...ed(`gallery.${index}`)}>
        <Picture src={item.image} alt={item.caption ?? ""} className={`w-full transition-transform duration-700 group-hover:scale-[1.04] ${index % 3 === 0 ? "aspect-[3/4]" : "aspect-[4/3]"}`} />
      </button>)}</div>
      <Lightbox items={gallery} box={box} accent={studio.accent} />
    </section>}

    {has("testimonials") && <section className="px-5 py-16 @3xl:px-12">
      <div className="mx-auto max-w-[56rem] space-y-14">{(c.testimonials ?? []).map((item, index) => <Reveal key={index}><figure className={index % 2 ? "text-right" : ""} {...ed(`testimonials.${index}`)}>
        <blockquote className="fd text-[clamp(1.6rem,3.4cqw,2.5rem)] font-[350] italic leading-[1.2]">“{item.quote}”</blockquote>
        <figcaption className="mt-4 text-[14px] tm">{item.name} · {item.role}</figcaption>
      </figure></Reveal>)}</div>
    </section>}

    {has("contact") && <footer id="contact" className="relative isolate mt-10 overflow-hidden px-5 pb-16 pt-28 text-center text-white @3xl:px-12">
      <div className="absolute inset-0 -z-10"><Picture src={gallery[0]?.image ?? c.cover} alt="" className="size-full" /><div className="absolute inset-0 bg-[rgba(6,30,44,.62)]" /></div>
      <h2 className="fd mx-auto max-w-[16ch] text-[clamp(2.6rem,7cqw,5.4rem)] font-[350] leading-[0.98] tracking-[-0.02em]"><Words text="Come and see it for yourself." /></h2>
      <p className="mx-auto mt-5 max-w-[30rem] text-[1.1rem] opacity-90">Tell me your dates. I’ll line up the homes, the lawyer and the bank.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <a href={mail(c.email, "Viewing trip")} className="rounded-full bg-white px-7 py-3.5 font-medium text-[#0f2a3a] hover:opacity-90" {...ed("email")}>Plan a viewing trip</a>
        {chat && <a href={chat} {...external(chat)} className="rounded-full border border-white/70 px-7 py-3.5 font-medium hover:bg-white/10">WhatsApp</a>}
      </div>
      <p className="mt-14 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[14px] opacity-80">{c.phone && <a href={tel(c.phone)} {...ed("phone")}>{c.phone}</a>}{contactLinks(c).filter((link) => !/^tel:/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover:underline">{link.label}</a>)}</p>
      {(c.highlights ?? [])[0] && <p className="mt-4 text-[12px] opacity-60">{c.highlights![0]!.title}{c.highlights![0]!.detail && ` · ${c.highlights![0]!.detail}`}</p>}
    </footer>}
  </StudioRoot>;
}

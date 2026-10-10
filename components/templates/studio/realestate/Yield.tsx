"use client";

import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/unbounded";
import { useMemo, useState } from "react";
import { ContourLines, DotGrid, FractalNoise } from "shaders/react";
import { Picture, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";
import { CountUp, Magnetic, Words } from "../motion";
import { Slider, convert, isSold, mail, money, parsePrice, tel, useCountdown, viewingLink, whatsapp, type Listing } from "./re-kit";
import { ShaderStage } from "./re-shader";

/** Dubai Land Department transfer fee, paid by the buyer. */
const DLD_FEE = 0.04;
/** Registration trustee and title deed charges, roughly, for a home over AED 500,000. */
const REGISTRATION_AED = 5_000;
const GOLDEN_VISA_AED = 2_000_000;

/** “60/40 plan” → 60% before handover, 40% on handover. */
const planOf = (item?: Listing) => {
  const match = `${item?.role ?? ""} ${item?.description ?? ""}`.match(/\b(\d{2})\s*\/\s*(\d{2})\b/);
  const before = match ? Number(match[1]) : 60;
  return before + (match ? Number(match[2]) : 40) === 100 ? before : 60;
};
/** “812 sq ft” → 812. */
const areaOf = (item?: Listing) => Number((item?.role ?? "").replace(/,/g, "").match(/(\d{3,6})\s*sq\s*ft/i)?.[1] ?? 0);

/**
 * Yield: off-plan property for investors. Contour lines drift across the hero
 * like a survey map; units sit on a board you can open; a payment-plan
 * builder turns any unit into a schedule with every fee; a yield panel and a
 * Golden Visa check answer the questions investors ask first.
 */
export default function Yield({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label, palette, accent } = studio;
  const listings = useMemo(() => c.projects ?? [], [c.projects]);
  const open = listings.findIndex((item) => !isSold(item.category) && !/sold out/i.test(item.category ?? ""));
  const [unit, setUnit] = useState(Math.max(0, open));
  const [expanded, setExpanded] = useState<number | null>(null);
  const chosen = listings[unit];
  const base = listings.map((item) => parsePrice(item.client)).find(Boolean)?.currency ?? "AED";
  const priceOf = (item?: Listing) => { const found = parsePrice(item?.client); return found ? convert(found.amount, found.currency ?? base, base) : 0; };
  const [price, setPrice] = useState(() => priceOf(chosen) || 1_500_000);
  const [booking, setBooking] = useState(10);
  const [before, setBefore] = useState(() => planOf(chosen));
  const [gross, setGross] = useState(7);
  const [charge, setCharge] = useState(18);
  const countdown = useCountdown(c.availability);
  const bg = palette?.bg ?? "#07100c";
  const light = palette?.id === "ledger";
  const chat = whatsapp(c.phone, `Hello ${c.name?.split(" ")[0] ?? ""}, I’d like the numbers on a unit.`);

  const choose = (index: number) => { setUnit(index); setPrice(priceOf(listings[index]) || price); setBefore(planOf(listings[index])); };
  const area = areaOf(chosen);
  const construction = Math.max(0, before - booking);
  const handover = 100 - before;
  const fees = price * DLD_FEE + convert(REGISTRATION_AED, "AED", base);
  const rent = (price * gross) / 100;
  const service = area * charge;
  const net = price ? ((rent - service) / (price + fees)) * 100 : 0;
  const golden = convert(price, base, "AED") >= GOLDEN_VISA_AED;
  const m = (value: number) => money(value, base);

  return <StudioRoot studio={studio} className="text-[15px] leading-relaxed">
    {/* Hero: a survey map that never stops moving. */}
    <section className="relative isolate overflow-hidden border-b rule px-5 pb-12 pt-6 @3xl:px-12">
      <ShaderStage fallback={`repeating-radial-gradient(circle at 70% 30%, transparent 0 22px, ${accent}22 22px 23px), ${bg}`} className="-z-10" opacity={light ? 0.5 : 0.85}>
        <ContourLines levels={16} lineWidth={1.2} softness={0.3} colorMode="custom" lineColor={accent} backgroundColor={bg}>
          <FractalNoise colorA="#000000" colorB="#ffffff" octaves={3} contrast={0.6} speed={0.06} />
        </ContourLines>
        <DotGrid color={accent} density={60} dotSize={0.08} twinkle={0.6} speed={0.4} opacity={0.35} />
      </ShaderStage>
      <div aria-hidden className="absolute inset-0 -z-10" style={{ background: `linear-gradient(90deg, ${bg} 10%, ${bg}d9 45%, transparent)` }} />

      <header className="fm flex flex-wrap items-center justify-between gap-4 text-[12px]">
        <span {...ed("name")}><span className="ta">●</span> {c.name}</span>
        <nav className="flex items-center gap-5">
          {has("projects") && <a href="#units" className="hidden hover:text-[var(--t-accent)] @2xl:inline">/units</a>}
          {has("projects") && <a href="#calculator" className="hidden hover:text-[var(--t-accent)] @2xl:inline">/calculator</a>}
          <a href="#contact" className="border border-current px-3 py-1.5 hover:bg-[var(--t-accent)] hover:text-[var(--t-bg)]">/contact</a>
        </nav>
      </header>

      <div className="mt-20 grid gap-12 @4xl:mt-28 @4xl:grid-cols-[1.25fr_1fr] @4xl:items-end">
        <div>
          <p className="fm text-[12px] ta" {...ed("professional_title")}>{c.professional_title}</p>
          <h1 className="fd mt-5 text-[clamp(3rem,10cqw,8.4rem)] font-semibold leading-[0.88] tracking-[-0.045em]" {...ed("name")}><Words text={c.name} step={90} /></h1>
          <p className="mt-6 max-w-[34rem] text-[clamp(1.05rem,2cqw,1.3rem)] leading-snug tm" {...ed("tagline")}>{c.tagline}</p>
        </div>
        <div className="border rule bg-[var(--t-bg)]/80 p-5 backdrop-blur-md" {...ed("availability")}>
          <p className="fm text-[11px] uppercase tracking-[0.2em] tm">{c.availability?.split("·")[0]?.trim() || "Next launch"}</p>
          {countdown && !countdown.done ? <div className="mt-3 grid grid-cols-4 gap-2 text-center">{([["days", countdown.days], ["hrs", countdown.hours], ["min", countdown.minutes], ["sec", countdown.seconds]] as const).map(([unitLabel, value]) => <div key={unitLabel} className="border rule py-3">
            <p className="fd text-[clamp(1.6rem,3.6cqw,2.4rem)] font-semibold leading-none tabular-nums">{String(value).padStart(2, "0")}</p>
            <p className="fm mt-1 text-[10px] tm">{unitLabel}</p>
          </div>)}</div> : <p className="fd mt-3 text-[1.4rem]">{c.availability}</p>}
          {c.availability?.includes("·") && <p className="fm mt-3 text-[12px] ta">{c.availability.split("·").slice(1).join("·").trim()}</p>}
        </div>
      </div>
    </section>

    {has("stats") && <section className="grid border-b rule @3xl:grid-cols-3">{(c.stats ?? []).map((stat, index) => <div key={index} className="flex items-baseline justify-between gap-4 border-b rule px-5 py-7 @3xl:border-b-0 @3xl:border-r @3xl:px-12 last:border-0" {...ed(`stats.${index}`)}>
      <p className="fm text-[12px] tm">{stat.label}</p>
      <p className="fd text-[clamp(2rem,4cqw,3rem)] font-semibold leading-none ta"><CountUp value={stat.value} /></p>
    </div>)}</section>}

    {has("projects") && <section id="units" className="px-5 py-20 @3xl:px-12 @3xl:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="fd text-[clamp(2.2rem,5cqw,3.8rem)] font-semibold leading-none tracking-[-0.03em]">{label("projects", "Units")}</h2>
        <p className="fm text-[12px] tm">{listings.length} units · tap a row</p>
      </div>
      <div className="fm mt-10 hidden grid-cols-[2.4fr_1fr_1fr_1.2fr_auto] gap-4 border-b rule pb-3 text-[11px] uppercase tracking-[0.14em] tm @4xl:grid"><span>Unit</span><span>Handover</span><span>Plan</span><span className="text-right">Price</span><span className="w-24 text-right">Status</span></div>
      <ul>{listings.map((item, index) => {
        const isOpen = expanded === index;
        const done = isSold(item.category) || /sold out/i.test(item.category ?? "");
        return <li key={index} className="border-b rule" {...ed(`projects.${index}`)}>
          <button type="button" onClick={() => setExpanded(isOpen ? null : index)} aria-expanded={isOpen} className="grid w-full items-center gap-x-4 gap-y-1 py-5 text-left transition-colors hover:text-[var(--t-accent)] @4xl:grid-cols-[2.4fr_1fr_1fr_1.2fr_auto]">
            <span className="fd text-[1.25rem] font-medium leading-tight">{item.title}</span>
            <span className="fm text-[13px] tm">{item.year}</span>
            <span className="fm text-[13px] tm">{planOf(item)}/{100 - planOf(item)}</span>
            <span className="fm text-[15px] tabular-nums @4xl:text-right">{item.client}</span>
            <span className={`fm w-max px-2 py-1 text-[11px] @4xl:ml-auto @4xl:w-24 @4xl:text-center ${done ? "border rule tm" : "ba text-[var(--t-bg)]"}`}>{item.category}</span>
          </button>
          <div className={`grid transition-[grid-template-rows] duration-500 ${isOpen || embedded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
            <div className="overflow-hidden">
              <div className="grid gap-6 pb-8 @3xl:grid-cols-[18rem_1fr]">
                <Picture src={item.image} alt={item.title ?? ""} embedded={embedded} className="aspect-[4/3] w-full" />
                <div>
                  <p className="fm text-[12px] tm">{item.role}</p>
                  <p className="mt-3 max-w-[40rem] tm pretty">{item.description}</p>
                  {!done && <div className="mt-6 flex flex-wrap gap-3 text-[13px] font-medium">
                    <a href="#calculator" onClick={() => choose(index)} className="ba px-4 py-2.5 text-[var(--t-bg)]">Run the numbers</a>
                    <a href={viewingLink(c, item)} {...external(viewingLink(c, item))} className="border rule px-4 py-2.5 hover:border-[var(--t-accent)]">Reserve an allocation</a>
                  </div>}
                </div>
              </div>
            </div>
          </div>
        </li>;
      })}</ul>
    </section>}

    {has("projects") && <section id="calculator" className="bs border-y rule px-5 py-20 @3xl:px-12 @3xl:py-24">
      <div className="grid gap-12 @5xl:grid-cols-[1fr_1.15fr]">
        <div>
          <p className="fm text-[12px] ta">/calculator</p>
          <h2 className="fd mt-3 text-[clamp(2.2rem,5cqw,3.8rem)] font-semibold leading-[0.95] tracking-[-0.03em]">What you’ll pay, and when.</h2>
          <p className="mt-5 max-w-[30rem] tm">Pick a unit or set a price. The schedule, the fees and the yield update as you go. Estimates only; I’ll send exact figures for any unit.</p>
          {listings.length > 1 && <div className="mt-8 flex flex-wrap gap-2">{listings.map((item, index) => !isSold(item.category) && !/sold out/i.test(item.category ?? "") && <button key={index} type="button" onClick={() => choose(index)} className={`fm border px-3 py-1.5 text-[12px] transition-colors ${unit === index ? "border-[var(--t-accent)] bg-[var(--t-accent)] text-[var(--t-bg)]" : "rule hover:border-[var(--t-accent)]"}`}>{item.title?.split(/[·,]/)[0]?.trim()}</button>)}</div>}
          <div className="mt-8 space-y-6">
            <Slider label="Price" value={price} min={400_000} max={Math.max(15_000_000, price)} step={10_000} onChange={setPrice} format={(value) => money(value, base, true)} />
            <Slider label="Booking deposit" value={booking} min={5} max={30} step={1} onChange={(value) => { setBooking(value); setBefore(Math.max(before, value)); }} format={(value) => `${value}%`} />
            <Slider label="Paid before handover" value={before} min={booking} max={100} step={5} onChange={setBefore} format={(value) => `${value}%`} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="border rule bg-[var(--t-bg)] p-6">
            <p className="fm text-[11px] uppercase tracking-[0.18em] tm">Payment schedule</p>
            <div className="mt-4 flex h-3 overflow-hidden" aria-hidden>
              <span className="ba transition-[width] duration-500" style={{ width: `${booking}%` }} />
              <span className="transition-[width] duration-500" style={{ width: `${construction}%`, background: `color-mix(in oklab, ${accent} 55%, transparent)` }} />
              <span className="transition-[width] duration-500" style={{ width: `${handover}%`, background: "var(--t-rule-strong)" }} />
            </div>
            <dl className="fm mt-5 space-y-2 text-[13px]">
              <div className="flex justify-between"><dt>On booking · {booking}%</dt><dd className="tabular-nums">{m(price * booking / 100)}</dd></div>
              <div className="flex justify-between"><dt>During construction · {construction}%</dt><dd className="tabular-nums">{m(price * construction / 100)}</dd></div>
              <div className="flex justify-between"><dt>On handover · {handover}%</dt><dd className="tabular-nums">{m(price * handover / 100)}</dd></div>
              <div className="flex justify-between border-t rule pt-2 tm"><dt>DLD fee (4%) + registration</dt><dd className="tabular-nums">{m(fees)}</dd></div>
              <div className="flex justify-between border-t rule pt-2 text-[15px] font-semibold"><dt>All in</dt><dd className="tabular-nums ta">{m(price + fees)}</dd></div>
            </dl>
            <p className="mt-4 text-[12px] tm">Due on booking, with the DLD fee: <b className="text-[var(--t-fg)] tabular-nums">{m(price * booking / 100 + fees)}</b></p>
          </div>

          <div className="grid gap-6 @3xl:grid-cols-2">
            <div className="border rule bg-[var(--t-bg)] p-6">
              <p className="fm text-[11px] uppercase tracking-[0.18em] tm">After handover</p>
              <Slider className="mt-4" label="Gross yield" value={gross} min={4} max={10} step={0.1} onChange={setGross} format={(value) => `${value.toFixed(1)}%`} />
              {area > 0 && <Slider className="mt-4" label={`Service charge / sq ft (${area.toLocaleString("en-GB")} sq ft)`} value={charge} min={10} max={35} step={1} onChange={setCharge} format={(value) => `AED ${value}`} />}
              <p className="fm mt-5 text-[12px] tm">Rent a year</p>
              <p className="fd text-[1.8rem] font-semibold tabular-nums">{money(rent, base, true)}</p>
              {area > 0 && <p className="fm mt-1 text-[12px] tm">Net yield ≈ <b className="ta">{net.toFixed(1)}%</b></p>}
            </div>
            <div className={`border p-6 ${golden ? "border-[var(--t-accent)]" : "rule"} bg-[var(--t-bg)]`}>
              <p className="fm text-[11px] uppercase tracking-[0.18em] tm">Golden Visa</p>
              <p className="fd mt-4 text-[1.6rem] font-semibold leading-tight">{golden ? "Meets the AED 2M threshold" : `${money(Math.max(0, convert(GOLDEN_VISA_AED, "AED", base) - price), base, true)} below the threshold`}</p>
              <p className="mt-3 text-[13px] tm">{golden ? "A home at this price can support a 10-year UAE Golden Visa application, subject to approval." : "Property worth AED 2M or more can support a 10-year Golden Visa. Ask me which units qualify."}</p>
            </div>
          </div>
        </div>
      </div>
    </section>}

    {has("services") && <section className="px-5 py-20 @3xl:px-12 @3xl:py-24">
      <h2 className="fd text-[clamp(2.2rem,5cqw,3.8rem)] font-semibold leading-none tracking-[-0.03em]">{label("services", "What I do for investors")}</h2>
      <ul className="mt-10 grid gap-px border rule bg-[var(--t-rule)] @3xl:grid-cols-3">{(c.services ?? []).map((service, index) => <li key={index} className="bg-[var(--t-bg)] p-7" {...ed(`services.${index}`)}>
        <p className="fm text-[12px] ta">{String(index + 1).padStart(2, "0")}</p>
        <h3 className="fd mt-5 text-[1.45rem] font-semibold leading-tight">{service.title}</h3>
        <p className="mt-3 text-[14px] tm pretty">{service.description}</p>
        {service.price && <p className="fm mt-5 text-[12px]">{service.price}</p>}
      </li>)}</ul>
    </section>}

    {has("skills") && <section className="overflow-hidden border-y rule py-6" {...ed("skills")}>
      <div className="flex w-max [animation:studio-marquee_45s_linear_infinite] hover:[animation-play-state:paused]">{[0, 1].map((copy) => <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0">{(c.skills ?? []).map((area) => <li key={area} className="fd flex items-center whitespace-nowrap px-6 text-[clamp(1.6rem,3.6cqw,2.6rem)] font-semibold tracking-[-0.03em]">{area}<span className="ml-12 text-[0.5em] ta">↗</span></li>)}</ul>)}</div>
    </section>}

    {has("about") && <section className="grid gap-12 px-5 py-20 @3xl:px-12 @3xl:py-24 @4xl:grid-cols-[20rem_1fr]">
      <Picture src={c.avatar} alt={c.name ?? ""} embedded={embedded} prompt="Add your portrait" className="aspect-square w-full grayscale transition-[filter] duration-700 hover:grayscale-0" edit="avatar" />
      <div>
        <p className="fm text-[12px] ta">{label("about", "/about")}</p>
        <div className="mt-5 space-y-5 text-[1.1rem] leading-[1.75]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
        {has("highlights") && <ul className="fm mt-8 space-y-2 border-t rule pt-6 text-[13px]">{(c.highlights ?? []).map((item, index) => <li key={index} className="flex justify-between gap-4" {...ed(`highlights.${index}`)}><span>{item.title}{item.detail && <span className="tm"> · {item.detail}</span>}</span><span className="ta">{item.year}</span></li>)}</ul>}
      </div>
    </section>}

    {has("testimonials") && <section className="bs border-y rule px-5 py-20 @3xl:px-12 @3xl:py-24">
      <ul className="grid gap-10 @3xl:grid-cols-2">{(c.testimonials ?? []).map((item, index) => <li key={index} {...ed(`testimonials.${index}`)}>
        <p className="fd text-[clamp(1.4rem,2.8cqw,1.9rem)] font-medium leading-snug tracking-[-0.01em]">“{item.quote}”</p>
        <p className="fm mt-5 text-[12px] tm">— {item.name}, {item.role}</p>
      </li>)}</ul>
    </section>}

    {has("gallery") && (c.gallery ?? []).some((item) => item.image) && <section className="px-5 py-20 @3xl:px-12">
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]">{(c.gallery ?? []).filter((item) => item.image).map((item, index) => <figure key={index} className="w-[min(80cqw,24rem)] shrink-0 snap-start" {...ed(`gallery.${index}`)}>
        <Picture src={item.image} alt={item.caption ?? ""} className="aspect-[4/3] w-full" />
        <figcaption className="fm mt-2 text-[12px] tm">{item.caption}</figcaption>
      </figure>)}</div>
    </section>}

    {has("contact") && <footer id="contact" className="px-5 py-20 @3xl:px-12 @3xl:py-28">
      <h2 className="fd max-w-[16ch] text-[clamp(2.6rem,7.4cqw,6rem)] font-semibold leading-[0.92] tracking-[-0.04em]"><Words text="Get the numbers before you sign." /></h2>
      <div className="mt-10 flex flex-wrap items-center gap-6">
        <Magnetic><a href={chat ?? mail(c.email, "Investment enquiry")} {...external(chat ?? "#")} className="inline-flex items-center gap-3 ba px-6 py-4 text-[15px] font-semibold text-[var(--t-bg)]" {...ed(c.phone ? "phone" : "email")}>{chat ? "Message me on WhatsApp" : "Email me"} →</a></Magnetic>
        <div className="fm space-y-1 text-[13px]">
          {c.phone && <a href={tel(c.phone)} className="block hover:text-[var(--t-accent)]">{c.phone}</a>}
          {c.email && <a href={`mailto:${c.email}`} className="block break-all hover:text-[var(--t-accent)]" {...ed("email")}>{c.email}</a>}
          <p className="flex flex-wrap gap-x-4 pt-1 tm">{contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover:text-[var(--t-fg)]">{link.label}</a>)}</p>
        </div>
      </div>
      <p className="fm mt-16 flex flex-wrap justify-between gap-4 border-t rule pt-5 text-[12px] tm"><span {...ed("location")}>{c.location}</span>{(c.education ?? [])[0] && <span {...ed("education.0")}>{c.education![0]!.degree}</span>}<span>Figures are estimates, not financial advice.</span></p>
    </footer>}
  </StudioRoot>;
}

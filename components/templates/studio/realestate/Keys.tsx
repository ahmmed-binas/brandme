"use client";

import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import "@fontsource-variable/familjen-grotesk";
import { useMemo, useState } from "react";
import { CursorRipples, MeshGradient, Ripples } from "shaders/react";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";
import { CountUp, Magnetic, Words } from "../motion";
import { isSold, mail, money, parsePrice, tel, viewingLink, whatsapp, type Listing } from "./re-kit";
import { ShaderStage } from "./re-shader";

/** Typical Dubai move-in costs. Shown as a guide; landlords and buildings vary. */
const EJARI_AED = 220;
const DEWA_DEPOSIT = { apartment: 2_000, villa: 4_000 };
const AGENCY_RATE = 0.05;
const VAT = 0.05;
const CHEQUE_OPTIONS = [1, 2, 4, 6, 12];

const furnished = (item?: Listing) => /\bfurnished\b/i.test(item?.role ?? "") && !/\bunfurnished\b/i.test(item?.role ?? "");
const isVilla = (item?: Listing) => /villa|townhouse/i.test(`${item?.title ?? ""} ${item?.role ?? ""}`);
/** “Up to 4 cheques” → 4; “2 cheques” → 2. */
const maxCheques = (item?: Listing) => Number(`${item?.year ?? ""} ${item?.description ?? ""}`.match(/(\d{1,2})\s*cheques?/i)?.[1] ?? (/monthly cheques/i.test(item?.description ?? "") ? 12 : 4));
/** “6 min to Metro” → 6. */
const metroMinutes = (item?: Listing) => { const found = (item?.role ?? "").match(/(\d{1,2})\s*min(?:utes)?\s*(?:to|from)\s*(?:the\s*)?metro/i); return found ? Number(found[1]) : null; };
const yearly = (item?: Listing) => parsePrice(item?.client)?.amount ?? 0;

/**
 * Keys: rentals in the UAE, where rent is quoted by the year and paid in
 * cheques. Water ripples under the cursor in the hero; homes filter by
 * furnished and by distance to the Metro; a move-in calculator shows what
 * leaves your account on day one, cheque by cheque.
 */
export default function Keys({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label, palette, accent } = studio;
  const listings = useMemo(() => c.projects ?? [], [c.projects]);
  const [onlyFurnished, setOnlyFurnished] = useState<boolean | null>(null);
  const [nearMetro, setNearMetro] = useState(false);
  const available = listings.findIndex((item) => !isSold(item.category));
  const [pick, setPick] = useState(Math.max(0, available));
  const chosen = listings[pick];
  const [cheques, setCheques] = useState(() => Math.min(4, maxCheques(chosen)));
  const currency = parsePrice(chosen?.client)?.currency ?? "AED";
  const bg = palette?.bg ?? "#f2f8f7";
  const dark = palette?.id === "deep";
  const chat = whatsapp(c.phone, `Hi ${c.name?.split(" ")[0] ?? ""}, I’m looking for a place to rent.`);

  const shown = listings.map((item, index) => ({ item, index })).filter(({ item }) =>
    (onlyFurnished === null || furnished(item) === onlyFurnished) && (!nearMetro || (metroMinutes(item) ?? 99) <= 10));
  const choose = (index: number) => { setPick(index); setCheques(Math.min(cheques, maxCheques(listings[index]))); };

  const rent = yearly(chosen);
  const firstCheque = rent / cheques;
  const deposit = rent * (furnished(chosen) ? 0.1 : 0.05);
  const agency = rent * AGENCY_RATE * (1 + VAT);
  const dewa = isVilla(chosen) ? DEWA_DEPOSIT.villa : DEWA_DEPOSIT.apartment;
  const dayOne = firstCheque + deposit + agency + EJARI_AED + dewa;
  const aed = (value: number) => money(value, currency);
  const pill = (active: boolean) => `rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${active ? "ba text-[var(--t-bg)]" : "bg-[var(--t-bg)] hover:text-[var(--t-accent)]"}`;

  return <StudioRoot studio={studio} className="text-[16px] leading-relaxed">
    {/* Hero: soft water that ripples where the cursor moves. */}
    <section className="relative isolate overflow-hidden px-5 pb-14 pt-6 @3xl:px-12">
      <ShaderStage fallback={`radial-gradient(80% 70% at 75% 20%, ${accent}55, transparent 70%), ${bg}`} className="-z-10" opacity={dark ? 0.9 : 0.8}>
        <CursorRipples intensity={7} decay={9} radius={0.45} chromaticSplit={0.4}>
          <MeshGradient colorA={bg} colorB={accent} count={4} smoothness={3} swirl={0.5} drift={0.4} speed={0.6} stops={[{ color: bg, position: 0 }, { color: palette?.surface ?? bg, position: 0.4 }, { color: accent, position: 0.85 }, { color: bg, position: 1 }]} />
        </CursorRipples>
        <Ripples center={{ x: 0.82, y: 0.35 }} colorA={accent} colorB="transparent" frequency={14} softness={2.2} thickness={0.16} speed={0.4} opacity={0.3} />
      </ShaderStage>

      <header className="flex items-center justify-between gap-4">
        <span className="fd text-[1.25rem] font-bold tracking-[-0.02em]" {...ed("name")}>{c.name}</span>
        <a href="#contact" className="rounded-full bg-[var(--t-fg)] px-4 py-2 text-[14px] font-semibold text-[var(--t-bg)] transition-transform hover:-translate-y-0.5">Get in touch</a>
      </header>

      <div className="mt-16 max-w-[56rem] @4xl:mt-24">
        <p className="inline-flex items-center gap-2 rounded-full bg-[var(--t-bg)]/70 px-3 py-1 text-[13px] font-medium backdrop-blur" {...ed("professional_title")}>🔑 {c.professional_title}</p>
        <h1 className="fd mt-6 text-[clamp(3rem,9.4cqw,7.4rem)] font-bold leading-[0.92] tracking-[-0.045em]" {...ed("name")}><Words text={c.name} step={80} /></h1>
        <p className="mt-6 max-w-[38rem] text-[clamp(1.15rem,2.4cqw,1.5rem)] font-medium leading-snug" {...ed("tagline")}>{c.tagline}</p>
        {c.location && <p className="mt-3 text-[15px] tm" {...ed("location")}>{c.location}</p>}
        {c.availability && <p className="mt-3 text-[15px] font-medium ta" {...ed("availability")}>{c.availability}</p>}
      </div>

      {has("projects") && <div className="mt-10 inline-flex flex-wrap items-center gap-2 rounded-[1.6rem] bs p-2 shadow-[0_20px_60px_-30px_rgba(0,0,0,.35)]" role="group" aria-label="Filter homes">
        <button type="button" onClick={() => setOnlyFurnished(null)} className={pill(onlyFurnished === null)}>All homes</button>
        <button type="button" onClick={() => setOnlyFurnished(true)} className={pill(onlyFurnished === true)}>Furnished</button>
        <button type="button" onClick={() => setOnlyFurnished(false)} className={pill(onlyFurnished === false)}>Unfurnished</button>
        <button type="button" onClick={() => setNearMetro(!nearMetro)} aria-pressed={nearMetro} className={pill(nearMetro)}>🚇 Near the Metro</button>
      </div>}
    </section>

    {has("stats") && <section className="grid grid-cols-1 gap-4 px-5 @3xl:grid-cols-3 @3xl:px-12">{(c.stats ?? []).map((stat, index) => <div key={index} className="rounded-3xl bs px-6 py-6" {...ed(`stats.${index}`)}>
      <p className="fd text-[clamp(2.2rem,4.4cqw,3.2rem)] font-bold leading-none ta"><CountUp value={stat.value} /></p>
      <p className="mt-2 text-[14px] tm">{stat.label}</p>
    </div>)}</section>}

    {has("projects") && <section id="homes" className="px-5 py-20 @3xl:px-12 @3xl:py-24">
      <h2 className="fd text-[clamp(2.2rem,5cqw,3.6rem)] font-bold leading-none tracking-[-0.03em]">{label("projects", "Homes to rent")}</h2>
      {shown.length === 0 && <p className="mt-8 tm">Nothing matches those filters right now. Message me and I’ll look for you.</p>}
      <ul className="mt-10 grid gap-6 @3xl:grid-cols-2 @6xl:grid-cols-3">{shown.map(({ item, index }) => {
        const minutes = metroMinutes(item);
        const let_ = isSold(item.category);
        return <Reveal as="li" key={index} className={`group overflow-hidden rounded-[1.8rem] border rule bg-[var(--t-bg)] transition-shadow hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,.35)] ${pick === index ? "ring-2 ring-[var(--t-accent)]" : ""}`}>
          <div {...ed(`projects.${index}`)}>
            <div className="relative overflow-hidden">
              <Picture src={item.image} alt={item.title ?? ""} embedded={embedded} className={`aspect-[4/3] w-full transition-transform duration-700 group-hover:scale-[1.05] ${let_ ? "grayscale" : ""}`} />
              <div className="absolute left-3 top-3 flex flex-wrap gap-2 text-[12px] font-semibold">
                {item.category && <span className={`rounded-full px-3 py-1 ${let_ ? "bg-black/70 text-white" : "ba text-[var(--t-bg)]"}`}>{item.category}</span>}
                {furnished(item) && <span className="rounded-full bg-white/90 px-3 py-1 text-black">Furnished</span>}
                {minutes !== null && <span className="rounded-full bg-white/90 px-3 py-1 text-black">🚇 {minutes} min</span>}
              </div>
            </div>
            <div className="p-6">
              <h3 className="fd text-[1.35rem] font-bold leading-tight tracking-[-0.01em]">{item.title}</h3>
              <p className="mt-1 text-[14px] tm">{item.role?.replace(/·\s*\d{1,2}\s*min.*metro/i, "").replace(/·\s*(un)?furnished/i, "").trim()}</p>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="fd text-[1.5rem] font-bold tabular-nums">{item.client}</p>
                  {yearly(item) > 0 && <p className="text-[13px] tm">≈ {aed(yearly(item) / 12)} a month</p>}
                </div>
                {item.year && <span className="rounded-full border rule px-3 py-1 text-[12px] font-medium">{item.year}</span>}
              </div>
              <p className="mt-4 text-[14px] tm pretty">{item.description}</p>
              {!let_ && <div className="mt-5 flex flex-wrap gap-2 text-[14px] font-semibold">
                <a href={viewingLink(c, item)} {...external(viewingLink(c, item))} className="rounded-full ba px-4 py-2.5 text-[var(--t-bg)]">Book a viewing</a>
                <a href="#move-in" onClick={() => choose(index)} className="rounded-full border rule px-4 py-2.5 hover:border-[var(--t-accent)]">Move-in costs</a>
              </div>}
            </div>
          </div>
        </Reveal>;
      })}</ul>
    </section>}

    {has("projects") && rent > 0 && <section id="move-in" className="px-5 pb-20 @3xl:px-12 @3xl:pb-24">
      <div className="grid gap-8 overflow-hidden rounded-[2rem] bs p-6 @3xl:p-10 @4xl:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="text-[14px] font-semibold ta">Move-in calculator</p>
          <h2 className="fd mt-2 text-[clamp(2rem,4.4cqw,3.2rem)] font-bold leading-[1] tracking-[-0.03em]">What you pay on day one</h2>
          <p className="mt-4 tm">Rent in the UAE is agreed by the year and paid in cheques. Fewer cheques can mean a better rent; more cheques mean less upfront.</p>
          <label className="mt-6 block text-[14px] font-medium">Home
            <select value={pick} onChange={(event) => choose(Number(event.target.value))} className="mt-2 w-full rounded-xl border rule bg-[var(--t-bg)] px-3 py-2.5">{listings.map((item, index) => !isSold(item.category) && <option key={index} value={index}>{item.title} · {item.client}</option>)}</select>
          </label>
          <p className="mt-6 text-[14px] font-medium">Cheques a year</p>
          <div className="mt-2 flex flex-wrap gap-2">{CHEQUE_OPTIONS.map((count) => <button key={count} type="button" disabled={count > maxCheques(chosen)} onClick={() => setCheques(count)} className={`size-12 rounded-full text-[15px] font-bold transition-colors disabled:opacity-30 ${cheques === count ? "ba text-[var(--t-bg)]" : "bg-[var(--t-bg)] hover:text-[var(--t-accent)]"}`}>{count}</button>)}</div>
          <p className="mt-2 text-[12px] tm">This landlord accepts up to {maxCheques(chosen)}.</p>
        </div>
        <div className="rounded-[1.5rem] bg-[var(--t-bg)] p-6">
          <dl className="space-y-3 text-[15px]">
            <div className="flex justify-between gap-4"><dt>First cheque <span className="tm">(1 of {cheques})</span></dt><dd className="tabular-nums">{aed(firstCheque)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Security deposit <span className="tm">({furnished(chosen) ? "10%, furnished" : "5%"})</span></dt><dd className="tabular-nums">{aed(deposit)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Agency fee <span className="tm">(5% + VAT)</span></dt><dd className="tabular-nums">{aed(agency)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Ejari registration</dt><dd className="tabular-nums">{aed(EJARI_AED)}</dd></div>
            <div className="flex justify-between gap-4"><dt>DEWA deposit <span className="tm">({isVilla(chosen) ? "villa" : "apartment"})</span></dt><dd className="tabular-nums">{aed(dewa)}</dd></div>
          </dl>
          <div className="mt-5 flex items-end justify-between gap-4 border-t rule pt-5">
            <p className="font-semibold">Day one</p>
            <p className="fd text-[clamp(2rem,4cqw,2.8rem)] font-bold leading-none tabular-nums ta">{aed(dayOne)}</p>
          </div>
          {cheques > 1 && <p className="mt-3 text-[14px] tm">Then {cheques - 1} more cheque{cheques > 2 ? "s" : ""} of {aed(firstCheque)}, every {12 / cheques} month{12 / cheques === 1 ? "" : "s"}.</p>}
          <p className="mt-4 text-[12px] tm">A guide: deposits and fees vary by landlord and building. The deposit and DEWA deposit come back at the end of the tenancy.</p>
        </div>
      </div>
    </section>}

    {has("services") && <section className="px-5 pb-20 @3xl:px-12 @3xl:pb-24">
      <h2 className="fd text-[clamp(2rem,4.4cqw,3.2rem)] font-bold leading-none tracking-[-0.03em]">{label("services", "How I help")}</h2>
      <ul className="mt-10 grid gap-4 @3xl:grid-cols-3">{(c.services ?? []).map((service, index) => <li key={index} className="rounded-3xl border rule p-7 transition-colors hover:border-[var(--t-accent)]" {...ed(`services.${index}`)}>
        <h3 className="fd text-[1.3rem] font-bold">{service.title}</h3>
        <p className="mt-2 text-[15px] tm pretty">{service.description}</p>
        {service.price && <p className="mt-4 inline-block rounded-full bs px-3 py-1 text-[13px] font-semibold">{service.price}</p>}
      </li>)}</ul>
    </section>}

    {has("skills") && <section className="px-5 pb-20 @3xl:px-12" {...ed("skills")}>
      <p className="text-[14px] font-semibold ta">{label("skills", "Areas I cover")}</p>
      <ul className="mt-4 flex flex-wrap gap-2">{(c.skills ?? []).map((area) => <li key={area} className="rounded-full bs px-4 py-2 text-[15px] font-medium">{area}</li>)}</ul>
    </section>}

    {has("about") && <section className="grid items-center gap-10 px-5 pb-20 @3xl:px-12 @4xl:grid-cols-[18rem_1fr]">
      <Picture src={c.avatar} alt={c.name ?? ""} embedded={embedded} prompt="Add your portrait" className="aspect-square w-full rounded-[2rem]" edit="avatar" />
      <div>
        <h2 className="fd text-[clamp(2rem,4.4cqw,3.2rem)] font-bold leading-none tracking-[-0.03em]">{label("about", `Hi, I’m ${c.name?.split(" ")[0] ?? ""}`)}</h2>
        <div className="mt-6 space-y-4 text-[1.08rem] leading-[1.75] tm">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
        {has("highlights") && <p className="mt-6 flex flex-wrap gap-2 text-[13px]">{(c.highlights ?? []).map((item, index) => <span key={index} className="rounded-full border rule px-3 py-1" {...ed(`highlights.${index}`)}>{item.title}{item.detail && ` · ${item.detail}`}</span>)}</p>}
      </div>
    </section>}

    {has("testimonials") && <section className="bs px-5 py-20 @3xl:px-12">
      <ul className="grid gap-6 @3xl:grid-cols-2">{(c.testimonials ?? []).map((item, index) => <li key={index} className="rounded-3xl bg-[var(--t-bg)] p-7" {...ed(`testimonials.${index}`)}>
        <p className="text-[1.15rem] leading-relaxed">“{item.quote}”</p>
        <p className="mt-4 text-[14px] font-semibold">{item.name} <span className="font-normal tm">· {item.role}</span></p>
      </li>)}</ul>
    </section>}

    {has("gallery") && (c.gallery ?? []).some((item) => item.image) && <section className="px-5 py-20 @3xl:px-12">
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">{(c.gallery ?? []).filter((item) => item.image).map((item, index) => <figure key={index} className="w-[min(75cqw,22rem)] shrink-0 snap-start" {...ed(`gallery.${index}`)}>
        <Picture src={item.image} alt={item.caption ?? ""} className="aspect-[4/5] w-full rounded-[1.6rem]" />
        <figcaption className="mt-2 text-[14px] tm">{item.caption}</figcaption>
      </figure>)}</div>
    </section>}

    {has("contact") && <footer id="contact" className="px-5 pb-12 @3xl:px-12">
      <div className="rounded-[2rem] bg-[var(--t-fg)] px-6 py-16 text-[var(--t-bg)] @3xl:px-12 @3xl:py-20">
        <h2 className="fd max-w-[16ch] text-[clamp(2.4rem,6.4cqw,4.8rem)] font-bold leading-[0.95] tracking-[-0.04em]"><Words text="Tell me what you need. I’ll send a shortlist today." /></h2>
        <div className="mt-10 flex flex-wrap items-center gap-4 text-[15px] font-semibold">
          {chat && <Magnetic><a href={chat} {...external(chat)} className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-6 py-3.5 text-black" {...ed("phone")}>WhatsApp me</a></Magnetic>}
          {c.email && <a href={mail(c.email, "Looking to rent")} className="rounded-full border border-current px-6 py-3.5" {...ed("email")}>Email</a>}
          {c.phone && <a href={tel(c.phone)} className="tabular-nums opacity-80 hover:opacity-100">{c.phone}</a>}
        </div>
        <p className="mt-12 flex flex-wrap justify-between gap-4 border-t border-current/20 pt-5 text-[13px] opacity-70"><span>{contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="me-4 hover:opacity-100">{link.label}</a>)}</span>{(c.education ?? [])[0] && <span {...ed("education.0")}>{c.education![0]!.degree}</span>}</p>
      </div>
    </footer>}
  </StudioRoot>;
}

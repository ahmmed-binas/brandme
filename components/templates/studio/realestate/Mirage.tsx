"use client";

import "@fontsource/gloock";
import "@fontsource-variable/manrope";
import "@fontsource/dm-serif-display";
import { useMemo, useState } from "react";
import { FilmGrain, Godrays, ImageTexture, LightLeak, Satin, WaveDistortion } from "shaders/react";
import {
  Picture,
  StudioRoot,
  contactLinks,
  ed,
  external,
  paragraphs,
  useStudio,
  type StudioProps,
} from "../kit";
import { CountUp, HorizontalScroll, Magnetic, Scrub, Words, useRotation } from "../motion";
import {
  CURRENCY_SIGN,
  Lightbox,
  RATES,
  convert,
  isSold,
  mail,
  money,
  mosaic,
  parsePrice,
  tel,
  useLightbox,
  viewingLink,
  whatsapp,
} from "./re-kit";
import { ShaderStage } from "./re-shader";

const CURRENCIES = ["AED", "USD", "GBP", "EUR", "INR"] as const;
/** A Dubai property worth AED 2M or more can qualify its owner for a 10-year Golden Visa. */
const GOLDEN_VISA_AED = 2_000_000;

const absolute = (src?: string) =>
  src && typeof window !== "undefined" ? new URL(src, window.location.href).href : src;

/**
 * Mirage: prime Dubai property. The cover photograph shimmers like heat over
 * the desert under slow golden light; residences pass sideways as you scroll,
 * each priced in the visitor's currency and marked when it can bring a
 * Golden Visa; the enquiry closes on a sheet of moving silk.
 */
export default function Mirage({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label, palette, accent } = studio;
  const listings = useMemo(() => c.projects ?? [], [c.projects]);
  const gallery = (c.gallery ?? []).filter((item) => item.image);
  const box = useLightbox(gallery.length, embedded);
  const tiles = mosaic(gallery.length);
  const quotes = c.testimonials ?? [];
  const quote = useRotation(quotes.length, 7500);
  const base = listings.map((item) => parsePrice(item.client)).find(Boolean)?.currency ?? "AED";
  const [currency, setCurrency] = useState<string>(base);
  const cover = c.cover || listings.find((item) => item.image)?.image;
  const dark = palette?.id !== "dune";
  const bg = palette?.bg ?? "#0c0a08";
  const chat = whatsapp(c.phone, `Hello ${c.name?.split(" ")[0] ?? ""}, I found you through your website.`);

  const show = (text?: string) => {
    const price = parsePrice(text);
    if (!price || currency === (price.currency ?? base)) return text;
    return `≈ ${money(convert(price.amount, price.currency ?? base, currency), currency, true)}`;
  };
  const golden = (text?: string) => {
    const price = parsePrice(text);
    return price ? convert(price.amount, price.currency ?? base, "AED") >= GOLDEN_VISA_AED : false;
  };

  return (
    <StudioRoot studio={studio} className="text-[15px] leading-relaxed">
      {/* Hero: the cover photograph, shimmering, with light falling across it. */}
      <section className="relative isolate flex min-h-[min(100vh,62rem)] flex-col overflow-hidden px-5 pb-8 pt-6 text-[#f6efe2] @3xl:px-12">
        <ShaderStage
          fallback={
            cover
              ? `center / cover no-repeat url("${cover}"), ${bg}`
              : `radial-gradient(120% 80% at 70% 0%, ${accent}55, transparent 60%), ${bg}`
          }
          className="-z-10"
        >
          <FilmGrain strength={0.18}>
            <WaveDistortion strength={0.025} frequency={2.4} speed={0.35} angle={90}>
              {cover && <ImageTexture url={absolute(cover)!} objectFit="cover" />}
            </WaveDistortion>
          </FilmGrain>
          <Godrays
            center={{ x: 0.78, y: -0.08 }}
            rayColor={accent}
            density={0.22}
            intensity={0.55}
            spotty={0.6}
            speed={0.25}
          />
          <LightLeak position={{ x: 0.98, y: 0.12 }} intensity={0.12} colorMid={accent} />
        </ShaderStage>
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(8,6,4,.62),rgba(8,6,4,.05)_30%,rgba(8,6,4,.4)_62%,rgba(8,6,4,.92))]"
        />
        {embedded && (
          <button
            type="button"
            className="absolute right-4 top-16 z-10 rounded-full bg-black/50 px-3 py-1.5 text-[11px] backdrop-blur"
            {...ed("cover")}
          >
            Change cover photo
          </button>
        )}

        <header className="flex items-center justify-between gap-4">
          <span className="fd text-[1.15rem] tracking-[0.02em]" {...ed("name")}>
            {c.name}
          </span>
          <nav className="flex items-center gap-6 text-[11px] font-semibold uppercase tracking-[0.28em]">
            {has("projects") && (
              <a href="#residences" className="hidden opacity-80 hover:opacity-100 @2xl:inline">
                Residences
              </a>
            )}
            {has("skills") && (
              <a href="#communities" className="hidden opacity-80 hover:opacity-100 @2xl:inline">
                Communities
              </a>
            )}
            <a
              href="#contact"
              className="rounded-full border border-white/40 px-4 py-2 backdrop-blur-md transition-colors hover:bg-white hover:text-black"
            >
              Enquire
            </a>
          </nav>
        </header>

        <div className="mt-auto grid gap-10 pt-24 @4xl:grid-cols-[1fr_20rem] @4xl:items-end">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.34em]"
              style={{ color: accent }}
              {...ed("professional_title")}
            >
              {c.professional_title}
            </p>
            <h1
              className="fd mt-5 text-[clamp(3.4rem,12.5cqw,10.5rem)] font-normal leading-[0.86] tracking-[-0.025em]"
              {...ed("name")}
            >
              <Words text={c.name} step={130} />
            </h1>
            <p
              className="mt-7 max-w-[36rem] text-[clamp(1.05rem,2.1cqw,1.35rem)] leading-snug text-white/85"
              {...ed("tagline")}
            >
              {c.tagline}
            </p>
          </div>
          {listings[0] && (
            <a
              href="#residences"
              className="group hidden rounded-2xl border border-white/20 bg-black/25 p-5 backdrop-blur-xl transition-colors hover:border-white/50 @4xl:block"
              {...ed("projects.0")}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/60">
                Featured · {listings[0].category}
              </p>
              <p className="fd mt-3 text-[1.5rem] leading-tight">{listings[0].title}</p>
              <p className="mt-3 text-[1.1rem] tabular-nums" style={{ color: accent }}>
                {listings[0].client}
              </p>
              {golden(listings[0].client) && (
                <p className="mt-3 inline-flex items-center gap-2 text-[11px] text-white/75">
                  <span className="size-1.5 rounded-full" style={{ background: accent }} />
                  Golden Visa eligible
                </p>
              )}
            </a>
          )}
        </div>
        {c.availability && (
          <p
            className="mt-8 flex items-center gap-3 border-t border-white/15 pt-5 text-[13px] text-white/80"
            {...ed("availability")}
          >
            <span className="relative flex size-2">
              <span
                className="absolute inline-flex size-full animate-ping rounded-full opacity-60"
                style={{ background: accent }}
              />
              <span className="relative size-2 rounded-full" style={{ background: accent }} />
            </span>
            {c.availability}
          </p>
        )}
      </section>

      {has("stats") && (
        <section className="grid grid-cols-2 border-b rule @3xl:grid-cols-4">
          {(c.stats ?? []).map((stat, index) => (
            <div
              key={index}
              className="border-r rule px-5 py-10 last:border-r-0 @3xl:px-10 @3xl:py-14"
              {...ed(`stats.${index}`)}
            >
              <p className="fd text-[clamp(2.2rem,4.6cqw,3.6rem)] leading-none ta">
                <CountUp value={stat.value} />
              </p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.22em] tm">{stat.label}</p>
            </div>
          ))}
        </section>
      )}

      {has("projects") && (
        <section id="residences" className="pt-20 @3xl:pt-28">
          <div className="flex flex-wrap items-end justify-between gap-6 px-5 @3xl:px-12">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] ta">The collection</p>
              <h2 className="fd mt-3 text-[clamp(2.6rem,7cqw,5.4rem)] leading-[0.92]">
                {label("projects", "Residences")}
              </h2>
            </div>
            <div role="radiogroup" aria-label="Show prices in" className="flex rounded-full border rule p-1">
              {CURRENCIES.filter((code) => RATES[code]).map((code) => (
                <button
                  key={code}
                  type="button"
                  role="radio"
                  aria-checked={currency === code}
                  onClick={() => setCurrency(code)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] transition-colors ${currency === code ? "ba text-[var(--t-bg)]" : "hover:text-[var(--t-accent)]"}`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
          <HorizontalScroll height={Math.max(2, listings.length * 0.7)} className="px-5 py-10 @3xl:px-12">
            {listings.map((item, index) => (
              <article
                key={index}
                className="group relative w-[min(82cqw,26rem)] shrink-0 snap-start overflow-hidden rounded-[1.4rem] bs"
                {...ed(`projects.${index}`)}
              >
                <div className="relative aspect-[3/4] max-h-[60vh] w-full overflow-hidden">
                  <Picture
                    src={item.image}
                    alt={item.title ?? ""}
                    embedded={embedded}
                    className="size-full transition-transform duration-[1.6s] ease-[cubic-bezier(.2,.7,.1,1)] group-hover:scale-[1.07]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <div className="absolute left-4 right-4 top-4 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.2em]">
                    {item.category && (
                      <span
                        className={`rounded-full px-3 py-1.5 ${isSold(item.category) ? "bg-black/70 text-white" : "ba text-[var(--t-bg)]"}`}
                      >
                        {item.category}
                      </span>
                    )}
                    {golden(item.client) && !isSold(item.category) && (
                      <span className="rounded-full border border-white/40 bg-black/30 px-3 py-1.5 text-white backdrop-blur">
                        Golden Visa
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <p className="fm text-[11px] text-white/60">
                      {String(index + 1).padStart(2, "0")} — {String(listings.length).padStart(2, "0")}
                    </p>
                    <h3 className="fd mt-2 text-[1.75rem] leading-[1.05]">{item.title}</h3>
                    {item.role && <p className="mt-2 text-[12px] text-white/75">{item.role}</p>}
                    <p
                      className="fd mt-4 text-[1.5rem] tabular-nums"
                      style={{ color: accent }}
                      aria-live="polite"
                    >
                      {show(item.client)}
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-[14px] tm pretty">{item.description}</p>
                  {!isSold(item.category) && (
                    <div className="mt-5 flex flex-wrap gap-3 text-[11px] font-semibold uppercase tracking-[0.18em]">
                      <a
                        href={viewingLink(c, item)}
                        {...external(viewingLink(c, item))}
                        className="rounded-full ba px-4 py-2.5 text-[var(--t-bg)] transition-opacity hover:opacity-85"
                      >
                        Private viewing
                      </a>
                      {item.live_url && (
                        <a
                          href={item.live_url}
                          {...external(item.live_url)}
                          className="rounded-full border rule px-4 py-2.5 hover:border-[var(--t-accent)]"
                        >
                          Details
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
            <a
              href="#contact"
              className="flex w-[min(70cqw,20rem)] shrink-0 snap-start flex-col justify-end rounded-[1.4rem] border border-dashed rule p-8 transition-colors hover:border-[var(--t-accent)]"
            >
              <p className="fd text-[2rem] leading-[1.05]">Most of what I sell is never advertised.</p>
              <p className="mt-4 text-[13px] tm">Ask for the off-market list →</p>
            </a>
          </HorizontalScroll>
          {currency !== base && (
            <p className="px-5 pb-6 text-[12px] tm @3xl:px-12">
              Converted prices are approximate, at indicative exchange rates. Asking prices are in {base}.
            </p>
          )}
        </section>
      )}

      {has("skills") && (
        <section
          id="communities"
          className="border-y rule px-5 py-20 @3xl:px-12 @3xl:py-28"
          {...ed("skills")}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] ta">
            {label("skills", "Communities I know best")}
          </p>
          <ul className="mt-10 grid @3xl:grid-cols-2 @3xl:gap-x-12">
            {(c.skills ?? []).map((area, index) => (
              <li key={area} className="group flex items-baseline gap-5 border-b rule py-4">
                <span className="fm w-8 shrink-0 text-[12px] tm">{String(index + 1).padStart(2, "0")}</span>
                <span className="fd text-[clamp(1.8rem,4.4cqw,3.2rem)] leading-none transition-[color,transform] duration-500 group-hover:translate-x-2 group-hover:text-[var(--t-accent)]">
                  {area}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {has("about") && (
        <section className="grid items-center gap-12 px-5 py-20 @3xl:px-12 @3xl:py-28 @4xl:grid-cols-[0.85fr_1.15fr]">
          <Scrub className="relative overflow-hidden rounded-[2rem]">
            <div style={{ transform: "translateY(calc((var(--p) - .5) * -12%)) scale(1.14)" }}>
              <Picture
                src={c.avatar}
                alt={c.name ?? ""}
                embedded={embedded}
                prompt="Add your portrait"
                className="aspect-[4/5] w-full"
                edit="avatar"
              />
            </div>
          </Scrub>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] ta">
              {label("about", "Your adviser")}
            </p>
            <h2 className="fd mt-4 text-[clamp(2.4rem,5.4cqw,4.2rem)] leading-[0.98]">{c.name}</h2>
            <div className="mt-8 space-y-5 text-[1.05rem] leading-[1.8] tm">
              {paragraphs(c).map(({ text, index }) => (
                <p key={index} className="pretty" {...ed(`summary.${index}`)}>
                  {text}
                </p>
              ))}
            </div>
            {has("highlights") && (
              <ul className="mt-10 grid gap-3 @3xl:grid-cols-2">
                {(c.highlights ?? []).map((item, index) => (
                  <li
                    key={index}
                    className="rounded-xl border rule p-4 text-[14px]"
                    {...ed(`highlights.${index}`)}
                  >
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-[13px] tm">
                      {[item.detail, item.year].filter(Boolean).join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {has("services") && (
        <section className="bs px-5 py-20 @3xl:px-12 @3xl:py-28">
          <h2 className="fd text-[clamp(2.4rem,5.4cqw,4.2rem)] leading-none">
            {label("services", "How I work")}
          </h2>
          <ol className="mt-12 grid gap-5 @3xl:grid-cols-3">
            {(c.services ?? []).map((service, index) => (
              <li
                key={index}
                className="group relative overflow-hidden rounded-2xl border rule bg-[var(--t-bg)] p-8"
                {...ed(`services.${index}`)}
              >
                <span
                  aria-hidden
                  className="absolute -right-4 -top-8 fd text-[8rem] leading-none opacity-[0.06] transition-opacity duration-700 group-hover:opacity-[0.16]"
                >
                  {index + 1}
                </span>
                <h3 className="fd text-[1.7rem] leading-tight">{service.title}</h3>
                <p className="mt-3 text-[14px] tm pretty">{service.description}</p>
                {service.price && (
                  <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] ta">
                    {service.price}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {has("gallery") && gallery.length > 0 && (
        <section id="gallery" className="px-5 py-20 @3xl:px-12 @3xl:py-28">
          <h2 className="fd text-[clamp(2.4rem,5.4cqw,4.2rem)] leading-none">{label("gallery", "Inside")}</h2>
          <div className="mt-10 grid grid-flow-dense auto-rows-[9rem] grid-cols-2 gap-3 @3xl:auto-rows-[13rem] @3xl:grid-cols-4">
            {gallery.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => box.open(index)}
                className={`group relative overflow-hidden rounded-xl text-left ${tiles[index]}`}
                {...ed(`gallery.${index}`)}
              >
                <Picture
                  src={item.image}
                  alt={item.caption ?? ""}
                  className="size-full transition-transform duration-[1.2s] group-hover:scale-[1.06]"
                />
                <span className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/75 to-transparent p-4 text-[13px] text-white transition-transform duration-500 group-hover:translate-y-0">
                  {item.caption}
                </span>
              </button>
            ))}
          </div>
          <Lightbox items={gallery} box={box} accent={accent} />
        </section>
      )}

      {has("testimonials") && quotes.length > 0 && (
        <section
          className="border-t rule px-5 py-24 @3xl:px-12 @3xl:py-32"
          onPointerEnter={quote.pause}
          onPointerLeave={quote.resume}
        >
          <div className="mx-auto grid max-w-[56rem]">
            {quotes.map((item, index) => (
              <figure
                key={index}
                aria-hidden={index !== quote.index}
                className={`col-start-1 row-start-1 transition-[opacity,filter] duration-1000 ${index === quote.index ? "opacity-100 blur-0" : "pointer-events-none opacity-0 blur-sm"}`}
                {...ed(`testimonials.${index}`)}
              >
                <blockquote className="fd text-[clamp(1.7rem,3.8cqw,2.8rem)] leading-[1.18]">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-8 text-[11px] font-semibold uppercase tracking-[0.26em] tm">
                  {item.name} · {item.role}
                </figcaption>
              </figure>
            ))}
          </div>
          {quotes.length > 1 && (
            <div className="mx-auto mt-10 flex max-w-[56rem] gap-2">
              {quotes.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => quote.setIndex(index)}
                  aria-label={`Show review ${index + 1}`}
                  className={`h-1 rounded-full transition-all duration-500 ${index === quote.index ? "w-10 ba" : "w-4 bg-[var(--t-rule-strong)]"}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {has("contact") && (
        <footer
          id="contact"
          className={`relative isolate overflow-hidden px-5 py-24 @3xl:px-12 @3xl:py-36 ${dark ? "text-[#f6efe2]" : ""}`}
        >
          <ShaderStage
            fallback={`linear-gradient(160deg, ${accent}, ${bg} 70%)`}
            className="-z-10"
            opacity={dark ? 0.9 : 0.55}
          >
            <Satin
              color={dark ? "#3a2a14" : accent}
              highlightColor={accent}
              foldCount={6}
              foldDirection={100}
              speed={0.35}
              breeze={0.35}
              sheen={0.7}
              fill={0.6}
            />
          </ShaderStage>
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background: `linear-gradient(180deg, ${bg} 0%, transparent 35%, transparent 70%, ${bg}cc)`,
            }}
          />
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.3em]"
            style={{ color: dark ? accent : undefined }}
          >
            Private enquiries
          </p>
          <h2 className="fd mt-5 max-w-[14ch] text-[clamp(3rem,9cqw,7rem)] leading-[0.92]">
            <Words text="Your next address starts here." />
          </h2>
          <div className="mt-12 flex flex-wrap items-center gap-8">
            <Magnetic>
              <a
                href={chat ?? mail(c.email, "Private enquiry")}
                {...external(chat ?? "#")}
                className="grid size-36 place-items-center rounded-full ba text-center text-[11px] font-semibold uppercase leading-snug tracking-[0.18em] text-[var(--t-bg)]"
                {...ed(c.phone ? "phone" : "email")}
              >
                {chat ? (
                  <>
                    WhatsApp
                    <br />
                    me now
                  </>
                ) : (
                  <>
                    Book a<br />
                    consultation
                  </>
                )}
              </a>
            </Magnetic>
            <div className="space-y-2 text-[1.05rem]">
              {c.phone && (
                <a href={tel(c.phone)} className="block tabular-nums hover:opacity-75" {...ed("phone")}>
                  {c.phone}
                </a>
              )}
              {c.email && (
                <a href={`mailto:${c.email}`} className="block break-all hover:opacity-75" {...ed("email")}>
                  {c.email}
                </a>
              )}
              <p className="flex flex-wrap gap-x-5 pt-2 text-[11px] uppercase tracking-[0.2em] opacity-75">
                {contactLinks(c)
                  .filter((link) => !/^(mailto|tel):/.test(link.url))
                  .map((link) => (
                    <a key={link.url} href={link.url} {...external(link.url)} className="hover:opacity-100">
                      {link.label}
                    </a>
                  ))}
              </p>
            </div>
          </div>
          <p className="mt-20 flex flex-wrap justify-between gap-4 border-t border-current/20 pt-5 text-[12px] opacity-75">
            <span {...ed("location")}>{c.location}</span>
            {(c.education ?? [])[0] && <span {...ed("education.0")}>{c.education![0]!.degree}</span>}
            <span>{CURRENCY_SIGN[base] ? `Prices in ${base}` : ""}</span>
          </p>
        </footer>
      )}
    </StudioRoot>
  );
}

"use client";

import "@fontsource-variable/readex-pro";
import "@fontsource-variable/eb-garamond";
import { useMemo, useState } from "react";
import { HexGrid, MeshGradient, Truchet } from "shaders/react";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, useStudio, type StudioProps } from "../kit";
import { CountUp, Words } from "../motion";
import { isSold, mail, statuses, tel, viewingLink, whatsapp, StatusTabs, type Listing } from "./re-kit";
import { ShaderStage } from "./re-shader";

type Lang = "en" | "ar";

/** Every word the template itself writes, in both languages. The owner's own text stays as they typed it. */
const T = {
  en: {
    homes: "Homes",
    about: "About",
    contact: "Contact",
    switchTo: "العربية",
    aboutTitle: "About me",
    homesTitle: "Homes for sale",
    areas: "Communities I know",
    help: "How I help",
    say: "What families say",
    gallery: "Gallery",
    all: "All",
    viewing: "Book a viewing",
    details: "Details",
    whatsapp: "Message me on WhatsApp",
    email: "Email me",
    call: "Call",
    closing: "Let’s find your family home.",
    prices: "Prices in AED",
  },
  ar: {
    homes: "المنازل",
    about: "نبذة عني",
    contact: "تواصل",
    switchTo: "English",
    aboutTitle: "نبذة عني",
    homesTitle: "منازل للبيع",
    areas: "المجتمعات التي أعرفها",
    help: "كيف أساعدكم",
    say: "آراء العائلات",
    gallery: "معرض الصور",
    all: "الكل",
    viewing: "احجز معاينة",
    details: "التفاصيل",
    whatsapp: "راسلني عبر واتساب",
    email: "راسلني بالبريد",
    call: "اتصل",
    closing: "لنجد منزل عائلتكم.",
    prices: "الأسعار بالدرهم الإماراتي",
  },
} as const;

const STATUS_AR: Array<[RegExp, string]> = [
  [/sold/i, "تم البيع"],
  [/under offer|reserved/i, "قيد التفاوض"],
  [/let agreed/i, "تم التأجير"],
  [/rent|let/i, "للإيجار"],
  [/off.?market/i, "خارج السوق"],
  [/new/i, "جديد"],
  [/sale/i, "للبيع"],
];
const status = (text: string | undefined, lang: Lang) =>
  lang === "ar" && text ? (STATUS_AR.find(([pattern]) => pattern.test(text))?.[1] ?? text) : text;
const arabic = (text: string) => /[؀-ۿ]/.test(text);

/**
 * Majlis: for agents whose clients are Arab and Emirati families. One tap
 * turns the whole site to Arabic, right to left; paragraphs the owner wrote
 * in Arabic show in Arabic, the rest in English. Homes sit under arches, over
 * a quiet pattern of interlocking tiles like a mashrabiya screen.
 */
export default function Majlis({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label, palette, accent } = studio;
  const [lang, setLang] = useState<Lang>("en");
  const t = T[lang];
  const listings = useMemo(() => c.projects ?? [], [c.projects]);
  const [filter, setFilter] = useState<string | null>(null);
  const shown = listings
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !filter || item.category === filter);
  const bg = palette?.bg ?? "#f5efe4";
  const dark = palette?.id === "night";
  // The owner's paragraphs in the chosen language; if they wrote none in it, all of them.
  const paras = (c.summary ?? []).map((text, index) => ({ text, index })).filter((item) => item.text.trim());
  const inLang = paras.filter((item) => arabic(item.text) === (lang === "ar"));
  const story = inLang.length ? inLang : paras;
  const own = (section: Parameters<typeof label>[0], fallback: string) =>
    lang === "en" ? label(section, fallback) : fallback;
  const first = c.name?.split(" ")[0] ?? "";
  const hello =
    lang === "ar" ? `مرحباً ${first}، وجدتك عبر موقعك.` : `Hello ${first}, I found you through your website.`;
  const chat = whatsapp(c.phone, hello);
  const viewing = (item: Listing) =>
    lang === "ar"
      ? (whatsapp(c.phone, `مرحباً ${first}، أود حجز معاينة لـ ${item.title ?? "هذا المنزل"}.`) ??
        mail(c.email, `معاينة: ${item.title ?? ""}`))
      : viewingLink(c, item);

  return (
    <StudioRoot studio={studio} className="text-[16px] leading-relaxed">
      <div
        dir={lang === "ar" ? "rtl" : "ltr"}
        lang={lang}
        className={lang === "ar" ? "[&_.fd]:font-[family-name:var(--t-text)] [&_.fd]:tracking-normal" : ""}
      >
        {/* Hero: a pattern of interlocking arcs drifts over soft colour; the portrait sits in an arch. */}
        <section className="relative isolate overflow-hidden px-5 pb-16 pt-6 @3xl:px-12">
          <ShaderStage
            fallback={`radial-gradient(90% 70% at 80% 10%, ${accent}33, transparent 70%), ${bg}`}
            className="-z-10"
            opacity={dark ? 0.9 : 0.75}
          >
            <MeshGradient
              colorA={bg}
              colorB={accent}
              count={3}
              smoothness={3}
              variation={0.25}
              swirl={0.15}
              drift={0.25}
              speed={0.4}
              stops={[
                { color: bg, position: 0 },
                { color: palette?.surface ?? bg, position: 0.55 },
                { color: accent, position: 1 },
              ]}
              opacity={0.5}
            />
            <Truchet
              colorA="transparent"
              colorB={accent}
              cells={18}
              thickness={1.2}
              softness={0.4}
              seed={7}
              opacity={0.22}
            />
            <HexGrid
              colorA="transparent"
              colorB={accent}
              cells={9}
              thickness={0.6}
              softness={0.5}
              opacity={0.12}
            />
          </ShaderStage>
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 -z-10 h-1/2"
            style={{ background: `linear-gradient(transparent, ${bg})` }}
          />

          <header className="flex items-center justify-between gap-4">
            <span className="fd text-[1.2rem] font-medium" dir="auto" {...ed("name")}>
              {c.name}
            </span>
            <nav className="flex items-center gap-5 text-[14px]">
              {has("projects") && (
                <a href="#homes" className="hidden opacity-75 hover:opacity-100 @2xl:inline">
                  {t.homes}
                </a>
              )}
              {has("about") && (
                <a href="#about" className="hidden opacity-75 hover:opacity-100 @2xl:inline">
                  {t.about}
                </a>
              )}
              <button
                type="button"
                onClick={() => setLang(lang === "en" ? "ar" : "en")}
                lang={lang === "en" ? "ar" : "en"}
                className="rounded-full border border-[var(--t-accent)] px-4 py-1.5 font-medium ta transition-colors hover:bg-[var(--t-accent)] hover:text-[var(--t-bg)]"
              >
                {t.switchTo}
              </button>
            </nav>
          </header>

          <div className="mt-14 grid items-end gap-12 @4xl:mt-20 @4xl:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p
                className="text-[13px] font-medium uppercase tracking-[0.2em] ta"
                dir="auto"
                {...ed("professional_title")}
              >
                {c.professional_title}
              </p>
              <h1
                className="fd mt-5 text-[clamp(3rem,10cqw,7.6rem)] font-medium leading-[0.95] tracking-[-0.02em]"
                dir="auto"
                {...ed("name")}
              >
                <Words key={lang} text={c.name} step={110} />
              </h1>
              <p
                className="mt-6 max-w-[34rem] text-[clamp(1.1rem,2.2cqw,1.4rem)] leading-snug tm"
                dir="auto"
                {...ed("tagline")}
              >
                {c.tagline}
              </p>
              {c.availability && (
                <p
                  className="mt-8 inline-flex items-center gap-3 rounded-full bs px-4 py-2 text-[14px]"
                  {...ed("availability")}
                >
                  <span className="size-2 rounded-full ba" />
                  <span dir="auto">{c.availability}</span>
                </p>
              )}
            </div>
            <div className="relative mx-auto w-full max-w-[22rem]">
              <span
                aria-hidden
                className="absolute -inset-3 rounded-t-full border border-[var(--t-accent)] opacity-50"
              />
              <Picture
                src={c.avatar}
                alt={c.name ?? ""}
                embedded={embedded}
                prompt="Add your portrait"
                className="aspect-[3/4] w-full rounded-t-full"
                edit="avatar"
              />
            </div>
          </div>
        </section>

        {has("stats") && (
          <section className="mx-5 grid gap-px overflow-hidden rounded-3xl border rule bg-[var(--t-rule)] @3xl:mx-12 @3xl:grid-cols-3">
            {(c.stats ?? []).map((stat, index) => (
              <div key={index} className="bg-[var(--t-bg)] px-6 py-8 text-center" {...ed(`stats.${index}`)}>
                <p className="fd text-[clamp(2.4rem,5cqw,3.6rem)] font-medium leading-none ta">
                  <CountUp value={stat.value} />
                </p>
                <p className="mt-3 text-[13px] tm" dir="auto">
                  {stat.label}
                </p>
              </div>
            ))}
          </section>
        )}

        {has("about") && (
          <section id="about" className="mx-auto max-w-[52rem] px-5 py-20 text-center @3xl:py-28">
            <p className="text-[13px] font-medium ta">{own("about", t.aboutTitle)}</p>
            <div className="mt-6 space-y-6 text-[clamp(1.15rem,2.3cqw,1.45rem)] leading-[1.7]">
              {story.map(({ text, index }) => (
                <Reveal key={`${lang}${index}`}>
                  <p className="pretty" dir="auto" {...ed(`summary.${index}`)}>
                    {text}
                  </p>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {has("projects") && (
          <section id="homes" className="px-5 pb-20 @3xl:px-12 @3xl:pb-28">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className="fd text-[clamp(2.2rem,5cqw,3.8rem)] font-medium leading-none">
                {own("projects", t.homesTitle)}
              </h2>
              <StatusTabs
                options={statuses(listings)}
                value={filter}
                onChange={setFilter}
                name={(option) => (option ? (status(option, lang) ?? option) : t.all)}
                tab={(active) =>
                  `rounded-full px-4 py-1.5 text-[13px] transition-colors ${active ? "ba text-[var(--t-bg)]" : "bs hover:text-[var(--t-accent)]"}`
                }
              />
            </div>
            <ul className="mt-12 grid gap-x-6 gap-y-14 @2xl:grid-cols-2 @5xl:grid-cols-3">
              {shown.map(({ item, index }) => (
                <li key={index} className="group" {...ed(`projects.${index}`)}>
                  <div className="relative overflow-hidden rounded-t-[999px]">
                    <Picture
                      src={item.image}
                      alt={item.title ?? ""}
                      embedded={embedded}
                      className="aspect-[4/5] w-full transition-transform duration-[1.4s] ease-[cubic-bezier(.2,.7,.1,1)] group-hover:scale-[1.06]"
                    />
                    {item.category && (
                      <span
                        className={`absolute bottom-4 start-4 rounded-full px-3 py-1 text-[12px] font-medium ${isSold(item.category) ? "bg-black/70 text-white" : "ba text-[var(--t-bg)]"}`}
                      >
                        {status(item.category, lang)}
                      </span>
                    )}
                  </div>
                  <div className="mt-5 flex items-baseline justify-between gap-4">
                    <h3 className="fd text-[1.45rem] font-medium leading-tight" dir="auto">
                      {item.title}
                    </h3>
                    <p className="shrink-0 font-medium tabular-nums ta" dir="ltr">
                      {item.client}
                    </p>
                  </div>
                  {item.role && (
                    <p className="mt-1 text-[14px] tm" dir="ltr">
                      {item.role}
                    </p>
                  )}
                  <p className="mt-3 text-[15px] tm pretty" dir="auto">
                    {item.description}
                  </p>
                  {!isSold(item.category) && (
                    <div className="mt-5 flex flex-wrap gap-3 text-[14px] font-medium">
                      <a
                        href={viewing(item)}
                        {...external(viewing(item))}
                        className="rounded-full ba px-5 py-2.5 text-[var(--t-bg)] transition-opacity hover:opacity-85"
                      >
                        {t.viewing}
                      </a>
                      {item.live_url && (
                        <a
                          href={item.live_url}
                          {...external(item.live_url)}
                          className="rounded-full border rule px-5 py-2.5 hover:border-[var(--t-accent)]"
                        >
                          {t.details}
                        </a>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {has("skills") && (
          <section className="bs px-5 py-16 @3xl:px-12" {...ed("skills")}>
            <p className="text-[13px] font-medium ta">{own("skills", t.areas)}</p>
            <ul className="mt-6 flex flex-wrap gap-3">
              {(c.skills ?? []).map((area) => (
                <li
                  key={area}
                  dir="auto"
                  className="rounded-full border rule bg-[var(--t-bg)] px-5 py-2.5 text-[15px] transition-colors hover:border-[var(--t-accent)] hover:text-[var(--t-accent)]"
                >
                  {area}
                </li>
              ))}
            </ul>
          </section>
        )}

        {has("services") && (
          <section className="px-5 py-20 @3xl:px-12 @3xl:py-28">
            <h2 className="fd text-[clamp(2.2rem,5cqw,3.8rem)] font-medium leading-none">
              {own("services", t.help)}
            </h2>
            <ul className="mt-12 grid gap-6 @3xl:grid-cols-3">
              {(c.services ?? []).map((service, index) => (
                <Reveal
                  as="li"
                  key={index}
                  delay={index * 90}
                  className="rounded-t-[3rem] border rule p-8 pt-10"
                >
                  <div {...ed(`services.${index}`)}>
                    <span aria-hidden className="block text-[1.6rem] ta">
                      ✦
                    </span>
                    <h3 className="fd mt-4 text-[1.45rem] font-medium leading-tight" dir="auto">
                      {service.title}
                    </h3>
                    <p className="mt-3 text-[15px] tm pretty" dir="auto">
                      {service.description}
                    </p>
                    {service.price && (
                      <p className="mt-5 text-[13px] font-medium ta" dir="auto">
                        {service.price}
                      </p>
                    )}
                  </div>
                </Reveal>
              ))}
            </ul>
          </section>
        )}

        {has("testimonials") && (
          <section className="border-y rule px-5 py-20 @3xl:px-12 @3xl:py-24">
            <h2 className="text-[13px] font-medium ta">{own("testimonials", t.say)}</h2>
            <ul className="mt-10 grid gap-10 @3xl:grid-cols-2 @5xl:grid-cols-3">
              {(c.testimonials ?? []).map((item, index) => (
                <li key={index} {...ed(`testimonials.${index}`)}>
                  <p className="fd text-[1.35rem] leading-snug" dir="auto">
                    “{item.quote}”
                  </p>
                  <p className="mt-4 text-[14px] tm" dir="auto">
                    {item.name} · {item.role}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {has("gallery") && (c.gallery ?? []).some((item) => item.image) && (
          <section className="px-5 py-20 @3xl:px-12">
            <h2 className="fd text-[clamp(2rem,4.4cqw,3.2rem)] font-medium leading-none">
              {own("gallery", t.gallery)}
            </h2>
            <div className="mt-10 grid grid-cols-2 gap-4 @3xl:grid-cols-4">
              {(c.gallery ?? [])
                .filter((item) => item.image)
                .map((item, index) => (
                  <figure
                    key={index}
                    className={index % 3 === 0 ? "@3xl:row-span-2" : ""}
                    {...ed(`gallery.${index}`)}
                  >
                    <Picture
                      src={item.image}
                      alt={item.caption ?? ""}
                      className={`w-full rounded-t-full ${index % 3 === 0 ? "aspect-[3/5]" : "aspect-[4/5]"}`}
                    />
                    <figcaption className="mt-2 text-[13px] tm" dir="auto">
                      {item.caption}
                    </figcaption>
                  </figure>
                ))}
            </div>
          </section>
        )}

        {has("contact") && (
          <footer
            id="contact"
            className="relative isolate overflow-hidden px-5 py-24 text-center @3xl:px-12 @3xl:py-32"
          >
            <ShaderStage
              fallback={`radial-gradient(70% 90% at 50% 100%, ${accent}40, transparent 70%), ${bg}`}
              className="-z-10"
              opacity={0.5}
            >
              <Truchet
                colorA="transparent"
                colorB={accent}
                cells={26}
                thickness={1}
                softness={0.5}
                seed={21}
                opacity={0.18}
              />
            </ShaderStage>
            <h2 className="fd mx-auto max-w-[18ch] text-[clamp(2.6rem,7cqw,5.4rem)] font-medium leading-[1.02]">
              <Words key={lang} text={t.closing} />
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-3 text-[15px] font-medium">
              {chat && (
                <a
                  href={chat}
                  {...external(chat)}
                  className="rounded-full ba px-6 py-3.5 text-[var(--t-bg)]"
                  {...ed("phone")}
                >
                  {t.whatsapp}
                </a>
              )}
              {c.email && (
                <a
                  href={mail(c.email, lang === "ar" ? "استفسار" : "Enquiry")}
                  className="rounded-full border rule px-6 py-3.5 hover:border-[var(--t-accent)]"
                  {...ed("email")}
                >
                  {t.email}
                </a>
              )}
              {c.phone && (
                <a
                  href={tel(c.phone)}
                  className="rounded-full border rule px-6 py-3.5 hover:border-[var(--t-accent)]"
                >
                  {t.call}{" "}
                  <span dir="ltr" className="tabular-nums">
                    {c.phone}
                  </span>
                </a>
              )}
            </div>
            <p className="mt-6 flex flex-wrap justify-center gap-x-5 text-[13px] tm">
              {contactLinks(c)
                .filter((link) => !/^(mailto|tel):/.test(link.url))
                .map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    {...external(link.url)}
                    className="hover:text-[var(--t-fg)]"
                  >
                    {link.label}
                  </a>
                ))}
            </p>
            <p className="mt-16 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t rule pt-5 text-[13px] tm">
              <span dir="auto" {...ed("location")}>
                {c.location}
              </span>
              {(c.education ?? [])[0] && (
                <span dir="auto" {...ed("education.0")}>
                  {c.education![0]!.degree}
                </span>
              )}
              <span>{t.prices}</span>
            </p>
          </footer>
        )}
      </div>
    </StudioRoot>
  );
}

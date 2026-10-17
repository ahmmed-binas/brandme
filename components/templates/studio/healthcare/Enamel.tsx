"use client";

import "@fontsource-variable/figtree";
import "@fontsource-variable/manrope";
import { useEffect, useState } from "react";
import { Picture, Reveal, StudioRoot, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";
import { CountUp } from "../motion";
import { SHADES, Tooth3D } from "./tooth3d";

/**
 * Enamel: a dental clinic with a team. A 3D tooth turns in the hero with a
 * whitening-shade slider under it (VITA shades); three cards say why to
 * choose the clinic; treatments show prices with "Book this"; each dentist
 * has "Book with Dr …"; and the booking card offers real times from the
 * clinic's opening hours, then opens WhatsApp (or email) with the request
 * written. Nothing is stored. The hours table marks today and "open now".
 *
 * Content: dentists are projects (title = name, role = speciality,
 * description, image); the three cards are highlights; opening hours are the
 * availability line, written like "Sat–Thu 9:00–21:00 · Fri 14:00–21:00".
 *
 * Ported from the owner's standalone Enamel page (October 2026), keeping the
 * design and dropping what a static template can't do safely: patient
 * accounts, chat and a clinic dashboard (health data with no real security),
 * a Google Maps embed (a directions link instead) and Google Fonts.
 */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** Saturday first, as the UAE working week is shown. */
const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];

type Hours = Map<number, [open: number, close: number]>;

const dayIndex = (word: string) =>
  DAYS.findIndex((day) => day.toLowerCase() === word.slice(0, 3).toLowerCase());
const minutes = (hour: string, minute?: string) => Number(hour) * 60 + Number(minute ?? 0);
const clock = (total: number) => `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;

/**
 * Reads opening hours like "Sat–Thu 9:00–21:00 · Fri 14:00–21:00" or
 * "Daily 8:00–20:00". Days not mentioned are closed. Empty when the line
 * isn't written that way (it's then shown as plain text).
 */
function readHours(text?: string): Hours {
  const hours: Hours = new Map();
  const segment =
    /^(daily|every day|[a-z]{3,9})(?:\s*[–-]\s*([a-z]{3,9}))?\s+(\d{1,2})(?:[:.](\d{2}))?\s*[–-]\s*(\d{1,2})(?:[:.](\d{2}))?$/i;
  for (const part of (text ?? "").split(/[·;,|]/)) {
    const match = part.trim().match(segment);
    if (!match) continue;
    const [, first, last, openHour, openMinute, closeHour, closeMinute] = match;
    const span: [number, number] = [minutes(openHour!, openMinute), minutes(closeHour!, closeMinute)];
    if (/^(daily|every day)$/i.test(first!)) {
      for (let day = 0; day < 7; day++) hours.set(day, span);
      continue;
    }
    const from = dayIndex(first!);
    const to = last ? dayIndex(last) : from;
    if (from < 0 || to < 0) continue;
    // Ranges can wrap round the week: Sat–Thu is Saturday to Thursday.
    for (let day = from; ; day = (day + 1) % 7) {
      hours.set(day, span);
      if (day === to) break;
    }
  }
  return hours;
}

/** Hourly appointment times in a day's opening hours, grouped by part of the day. */
function slotsFor(span?: [number, number]) {
  if (!span) return [];
  const times: number[] = [];
  for (let time = span[0]; time + 60 <= span[1]; time += 60) times.push(time);
  return [
    { name: "Morning", times: times.filter((time) => time < 12 * 60) },
    { name: "Afternoon", times: times.filter((time) => time >= 12 * 60 && time < 17 * 60) },
    { name: "Evening", times: times.filter((time) => time >= 17 * 60) },
  ].filter((group) => group.times.length);
}

/** “2026-10-20” → the date at noon (no time-zone surprises). */
const asDate = (iso: string) => new Date(`${iso}T12:00:00`);
const isoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const readableDay = (iso: string) =>
  asDate(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

/** “+971 4 000 0000” → “97140000000”, for wa.me links. */
const digits = (phone?: string) => (phone ?? "").replace(/\D/g, "");

const initials = (name?: string) =>
  (name ?? "")
    .replace(/^dr\.?\s+/i, "")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function Enamel({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label, accent } = studio;
  const hours = readHours(c.availability);
  const team = c.projects ?? [];
  const services = c.services ?? [];
  const phoneDigits = digits(c.phone);
  const canBook = Boolean(phoneDigits || c.email);

  // Time-dependent parts (today, open now, past slots) are worked out in the
  // browser after loading, so the server and browser render the same page.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 60_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);
  const today = now?.getDay();
  const nowMinutes = now ? now.getHours() * 60 + now.getMinutes() : 0;
  const todaySpan = today === undefined ? undefined : hours.get(today);
  const openNow = Boolean(todaySpan && nowMinutes >= todaySpan[0] && nowMinutes < todaySpan[1]);

  const [shade, setShade] = useState(4);
  const [treatment, setTreatment] = useState("");
  const [dentist, setDentist] = useState("");
  const [day, setDay] = useState("");
  const [time, setTime] = useState<number | null>(null);
  const [name, setName] = useState("");
  const dayHours = day ? hours.get(asDate(day).getDay()) : undefined;
  const isToday = Boolean(now && day === isoDay(now));
  const groups = slotsFor(dayHours);

  const message = [
    `Hello ${c.name ?? "there"}, I’d like to book an appointment.`,
    treatment && `Treatment: ${treatment}`,
    dentist && `Dentist: ${dentist}`,
    day && `Day: ${readableDay(day)}`,
    time !== null && `Time: ${clock(time)}`,
    name && `Name: ${name}`,
  ]
    .filter(Boolean)
    .join("\n");
  const whatsapp = phoneDigits ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}` : "";
  const mail = c.email
    ? `mailto:${c.email}?subject=${encodeURIComponent("Appointment request")}&body=${encodeURIComponent(message)}`
    : "";

  /** Picks a treatment or dentist and scrolls to the booking card. */
  const bookWith = (choice: { treatment?: string; dentist?: string }) => {
    if (choice.treatment !== undefined) setTreatment(choice.treatment);
    if (choice.dentist !== undefined) setDentist(choice.dentist);
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const display = "font-[family-name:var(--t-display)]";
  const card =
    "rounded-[26px] bg-[var(--t-surface)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_7%,transparent),0_24px_48px_-34px_color-mix(in_oklab,var(--t-accent)_55%,transparent)]";
  const primary =
    "rounded-full bg-[var(--t-accent)] px-6 py-3.5 font-semibold text-[var(--t-surface)] transition-transform hover:-translate-y-0.5";
  const field =
    "mt-1.5 w-full rounded-2xl border border-[color-mix(in_oklab,var(--t-fg)_14%,transparent)] bg-[var(--t-bg)] px-4 py-3 text-[15px] outline-none focus:border-[var(--t-accent)]";
  const kicker = "text-[12px] font-bold uppercase tracking-[0.18em] text-[var(--t-accent)]";

  return (
    <StudioRoot studio={studio} className="text-[16px] leading-[1.6]">
      {/* ——— Header ——— */}
      <header className="mx-auto flex max-w-[76rem] items-center justify-between gap-4 px-5 py-5 @3xl:px-10">
        <div className="flex items-center gap-3">
          <span
            className={`${display} grid size-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--t-accent),color-mix(in_oklab,var(--t-accent)_55%,#34d1bf))] text-[1.2rem] font-bold text-[var(--t-surface)]`}
          >
            {(c.name ?? "D").charAt(0)}
          </span>
          <span className="leading-tight">
            <span className={`${display} block text-[1.05rem] font-bold`}>{c.name}</span>
            <span className="text-[12.5px] opacity-65">
              {[c.professional_title, c.location].filter(Boolean).join(" · ")}
            </span>
          </span>
        </div>
        <nav className="flex items-center gap-1 text-[14px]">
          {has("services") && (
            <a
              href="#treatments"
              className="hidden rounded-full px-3 py-2 opacity-75 hover:opacity-100 @3xl:inline"
            >
              Treatments
            </a>
          )}
          {has("projects") && (
            <a
              href="#team"
              className="hidden rounded-full px-3 py-2 opacity-75 hover:opacity-100 @3xl:inline"
            >
              Team
            </a>
          )}
          <a href="#hours" className="hidden rounded-full px-3 py-2 opacity-75 hover:opacity-100 @3xl:inline">
            Hours & contact
          </a>
          {canBook && (
            <a href="#book" className={`${primary} ml-2 hidden px-5 py-2.5 text-[14px] @3xl:inline-block`}>
              Book appointment
            </a>
          )}
        </nav>
      </header>

      {/* ——— Hero: words on the left, the turning tooth and the shade slider on the right ——— */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_80%_40%,color-mix(in_oklab,var(--t-accent)_14%,transparent),transparent),linear-gradient(180deg,var(--t-bg),color-mix(in_oklab,var(--t-accent)_5%,var(--t-bg)))]"
        />
        <div className="mx-auto grid max-w-[76rem] items-center gap-8 px-5 pb-16 pt-8 @3xl:px-10 @4xl:grid-cols-[1.15fr_1fr]">
          <div>
            <p className={kicker} {...ed("professional_title")}>
              <span className="mr-3 inline-block h-px w-8 bg-current align-middle" />
              {[c.professional_title, c.location].filter(Boolean).join(" · ")}
            </p>
            <h1
              className={`${display} mt-5 text-[clamp(2.8rem,7.4cqw,5.4rem)] font-extrabold leading-[0.98] tracking-[-0.035em]`}
              {...ed("name")}
            >
              {c.name}
            </h1>
            {c.tagline && (
              <p
                className={`${display} mt-4 text-[clamp(1.5rem,3.4cqw,2.3rem)] font-semibold leading-tight text-[var(--t-accent)]`}
                {...ed("tagline")}
              >
                {c.tagline}
              </p>
            )}
            {paragraphs(c)[0] && (
              <p className="mt-5 max-w-[34rem] text-[1.08rem] opacity-75" {...ed("summary.0")}>
                {paragraphs(c)[0]!.text}
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              {canBook && (
                <a href="#book" className={primary}>
                  Book an appointment
                </a>
              )}
              {phoneDigits && (
                <a
                  href={`https://wa.me/${phoneDigits}`}
                  {...external(`https://wa.me/${phoneDigits}`)}
                  className="rounded-full border-2 border-[var(--t-accent)] px-6 py-3 font-semibold text-[var(--t-accent)]"
                >
                  Chat on WhatsApp
                </a>
              )}
            </div>
            {has("skills") && (
              <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[14px] opacity-80" {...ed("skills")}>
                {(c.skills ?? []).slice(0, 3).map((skill) => (
                  <li key={skill} className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[color-mix(in_oklab,var(--t-accent)_60%,#34d1bf)]" />
                    {skill}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="relative mx-auto w-full max-w-[30rem]">
            <span className="absolute right-2 top-2 z-10 rounded-full bg-[color-mix(in_oklab,var(--t-fg)_60%,transparent)] px-3 py-1.5 text-[12px] text-[var(--t-surface)]">
              Drag to turn the tooth
            </span>
            <div className="aspect-square w-full">
              <Tooth3D shade={shade} accent={accent} />
            </div>
            <div className={`${card} relative -mt-10 mx-4 p-5`}>
              <div className="flex items-center justify-between text-[14px] font-semibold">
                <label htmlFor="enamel-shade">Try a whitening shade</label>
                <output htmlFor="enamel-shade" className="text-[var(--t-accent)]">
                  {SHADES[shade]![0]}
                </output>
              </div>
              <input
                id="enamel-shade"
                type="range"
                min={0}
                max={SHADES.length - 1}
                value={shade}
                onChange={(event) => setShade(Number(event.target.value))}
                className="mt-3 w-full accent-[var(--t-accent)]"
              />
              <div className="mt-2 flex gap-1" aria-hidden>
                {SHADES.map(([shadeName, colour]) => (
                  <span key={shadeName} className="h-2 flex-1 rounded-full" style={{ background: colour }} />
                ))}
              </div>
              <p className="mt-2 text-[12.5px] opacity-65">
                Drag to compare shades on the VITA guide. Your dentist will tell you what’s realistic for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ——— Three reasons, as coloured cards ——— */}
      {has("highlights") && (
        <section className="mx-auto grid max-w-[76rem] gap-4 px-5 pb-6 @3xl:grid-cols-3 @3xl:px-10">
          {(c.highlights ?? []).slice(0, 3).map((item, index) => (
            <Reveal key={index} delay={index * 80}>
              <article
                className="h-full rounded-[26px] p-7 text-[var(--t-surface)]"
                style={{
                  background: [
                    "color-mix(in oklab, var(--t-fg) 92%, var(--t-accent))",
                    "var(--t-accent)",
                    "color-mix(in oklab, var(--t-accent) 55%, #34d1bf)",
                  ][index],
                }}
                {...ed(`highlights.${index}`)}
              >
                <h3 className={`${display} text-[1.35rem] font-bold`}>{item.title}</h3>
                {item.detail && <p className="mt-2 opacity-85">{item.detail}</p>}
              </article>
            </Reveal>
          ))}
        </section>
      )}

      {/* ——— About, with numbers ——— */}
      {(has("about") || has("stats")) && (
        <section className="mx-auto grid max-w-[76rem] items-center gap-10 px-5 py-16 @3xl:px-10 @4xl:grid-cols-[1.2fr_1fr]">
          {has("about") && (
            <div>
              <p className={kicker}>About us</p>
              <h2 className={`${display} mt-3 text-[clamp(2rem,4.6cqw,3.1rem)] font-bold leading-tight`}>
                {label("about", "A clinic you’ll actually like visiting")}
              </h2>
              <div className="mt-5 space-y-4 opacity-80">
                {paragraphs(c)
                  .slice(1)
                  .map(({ text, index }) => (
                    <p key={index} className="pretty" {...ed(`summary.${index}`)}>
                      {text}
                    </p>
                  ))}
              </div>
            </div>
          )}
          {has("stats") && (
            <dl className="grid grid-cols-3 gap-3">
              {(c.stats ?? []).slice(0, 3).map((stat, index) => (
                <div key={index} className={`${card} px-4 py-6 text-center`} {...ed(`stats.${index}`)}>
                  <dd
                    className={`${display} text-[clamp(1.6rem,4cqw,2.5rem)] font-extrabold text-[var(--t-accent)]`}
                  >
                    <CountUp value={stat.value} />
                  </dd>
                  <dt className="mt-1 text-[13px] opacity-65">{stat.label}</dt>
                </div>
              ))}
            </dl>
          )}
        </section>
      )}

      {/* ——— Treatments ——— */}
      {has("services") && (
        <section id="treatments" className="scroll-mt-6 mx-auto max-w-[76rem] px-5 py-14 @3xl:px-10">
          <p className={kicker}>Treatments</p>
          <h2 className={`${display} mt-3 text-[clamp(2rem,4.6cqw,3.1rem)] font-bold`}>
            {label("services", "Treatments and starting prices")}
          </h2>
          <div className="mt-8 grid gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3">
            {services.map((service, index) => (
              <article key={index} className={`${card} flex flex-col p-6`} {...ed(`services.${index}`)}>
                <h3 className={`${display} text-[1.25rem] font-bold`}>{service.title}</h3>
                {service.description && (
                  <p className="mt-1.5 text-[15px] opacity-70">{service.description}</p>
                )}
                <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                  {service.price && (
                    <span className={`${display} text-[1.15rem] font-bold text-[var(--t-accent)]`}>
                      {service.price}
                    </span>
                  )}
                  {canBook && (
                    <button
                      type="button"
                      onClick={() => bookWith({ treatment: service.title ?? "" })}
                      className="rounded-full bg-[color-mix(in_oklab,var(--t-accent)_12%,transparent)] px-4 py-2 text-[13px] font-semibold"
                    >
                      Book this →
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ——— The team ——— */}
      {has("projects") && (
        <section id="team" className="scroll-mt-6 mx-auto max-w-[76rem] px-5 py-14 @3xl:px-10">
          <p className={kicker}>Our dentists</p>
          <h2 className={`${display} mt-3 text-[clamp(2rem,4.6cqw,3.1rem)] font-bold`}>
            {label("projects", "Meet the team")}
          </h2>
          <div className="mt-8 grid gap-4 @3xl:grid-cols-3">
            {team.map((member, index) => (
              <article key={index} className={`${card} flex flex-col p-6`} {...ed(`projects.${index}`)}>
                {member.image ? (
                  <Picture
                    src={member.image}
                    alt={member.title ?? ""}
                    embedded={embedded}
                    className="aspect-[4/3] w-full rounded-[18px]"
                  />
                ) : (
                  <span
                    className={`${display} grid size-16 place-items-center rounded-full bg-[color-mix(in_oklab,var(--t-accent)_14%,transparent)] text-[1.3rem] font-bold text-[var(--t-accent)]`}
                  >
                    {initials(member.title)}
                  </span>
                )}
                <h3 className={`${display} mt-4 text-[1.25rem] font-bold`}>{member.title}</h3>
                {member.role && (
                  <p className="text-[14px] font-semibold text-[var(--t-accent)]">{member.role}</p>
                )}
                {member.description && <p className="mt-2 text-[15px] opacity-70">{member.description}</p>}
                {canBook && (
                  <button
                    type="button"
                    onClick={() => bookWith({ dentist: member.title ?? "" })}
                    className="mt-auto self-start pt-5 text-[14px] font-semibold text-[var(--t-accent)] underline underline-offset-4"
                  >
                    Book with {member.title?.split(/\s+/).slice(0, 2).join(" ")} →
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ——— Booking ——— */}
      {canBook && (
        <section id="book" className="scroll-mt-6 px-5 py-14 @3xl:px-10">
          <div className={`${card} mx-auto max-w-[76rem] p-7 @3xl:p-12`}>
            <p className={kicker}>Book online</p>
            <h2 className={`${display} mt-3 text-[clamp(2rem,4.6cqw,3.1rem)] font-bold`}>
              Book an appointment
            </h2>
            <form onSubmit={(event) => event.preventDefault()} className="mt-8 grid gap-5 @3xl:grid-cols-2">
              <label className="text-[13px] font-semibold">
                Treatment
                <select
                  value={treatment}
                  onChange={(event) => setTreatment(event.target.value)}
                  className={field}
                >
                  <option value="">Not sure yet: a check-up</option>
                  {services.map((service, index) => (
                    <option key={index}>{service.title}</option>
                  ))}
                </select>
              </label>
              <label className="text-[13px] font-semibold">
                Dentist
                <select
                  value={dentist}
                  onChange={(event) => setDentist(event.target.value)}
                  className={field}
                >
                  <option value="">Any dentist</option>
                  {team.map((member, index) => (
                    <option key={index}>{member.title}</option>
                  ))}
                </select>
              </label>
              <label className="text-[13px] font-semibold">
                Day
                <input
                  type="date"
                  value={day}
                  min={now ? isoDay(now) : undefined}
                  onChange={(event) => {
                    setDay(event.target.value);
                    setTime(null);
                  }}
                  className={field}
                />
              </label>
              <label className="text-[13px] font-semibold">
                Your name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  className={field}
                />
              </label>

              {/* Times from the clinic's opening hours; past times today can't be chosen. */}
              {day && (
                <div className="@3xl:col-span-2" role="group" aria-label="Time">
                  {hours.size > 0 && !dayHours ? (
                    <p className="text-[15px] opacity-75">
                      Closed on {DAY_NAMES[asDate(day).getDay()]}. Please pick another day.
                    </p>
                  ) : (
                    groups.map((group) => (
                      <div key={group.name} className="mb-3">
                        <p className="text-[13px] font-semibold opacity-70">{group.name}</p>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {group.times.map((slot) => {
                            const past = isToday && slot <= nowMinutes;
                            return (
                              <button
                                key={slot}
                                type="button"
                                disabled={past}
                                onClick={() => setTime(slot)}
                                aria-pressed={time === slot}
                                className={`rounded-full px-4 py-2 text-[14px] font-medium transition-colors disabled:opacity-30 ${time === slot ? "bg-[var(--t-accent)] text-[var(--t-surface)]" : "bg-[color-mix(in_oklab,var(--t-fg)_6%,transparent)]"}`}
                              >
                                {clock(slot)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3 @3xl:col-span-2">
                {whatsapp && (
                  <a
                    href={whatsapp}
                    {...external(whatsapp)}
                    className="rounded-full bg-[#25d366] px-6 py-3.5 font-semibold text-[#0b2b17] transition-transform hover:-translate-y-0.5"
                  >
                    Send on WhatsApp
                  </a>
                )}
                {mail && (
                  <a
                    href={mail}
                    className="rounded-full border-2 border-[var(--t-fg)] px-6 py-3 font-semibold"
                  >
                    Send by email
                  </a>
                )}
              </div>
              <p className="text-[12.5px] opacity-60 @3xl:col-span-2">
                This opens your own WhatsApp or email with the request written for you. The clinic replies to
                confirm. Nothing is stored here.
              </p>
            </form>
          </div>
        </section>
      )}

      {/* ——— Reviews ——— */}
      {has("testimonials") && (
        <section className="mx-auto max-w-[76rem] px-5 py-14 @3xl:px-10">
          <h2 className={`${display} text-[clamp(2rem,4.6cqw,3.1rem)] font-bold`}>
            {label("testimonials", "What patients say")}
          </h2>
          <div className="mt-8 grid gap-4 @3xl:grid-cols-3">
            {(c.testimonials ?? []).map((item, index) => (
              <figure key={index} className={`${card} p-7`} {...ed(`testimonials.${index}`)}>
                <blockquote className="text-[1.08rem] leading-snug">“{item.quote}”</blockquote>
                <figcaption className="mt-4 text-[14px]">
                  <b>{item.name}</b>
                  {item.role && <span className="opacity-60"> · {item.role}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ——— Hours, contact and directions ——— */}
      {(c.availability || has("contact")) && (
        <section
          id="hours"
          className="scroll-mt-6 mx-auto grid max-w-[76rem] gap-6 px-5 py-14 @3xl:grid-cols-2 @3xl:px-10"
        >
          <div className={`${card} p-7`} {...ed("availability")}>
            <div className="flex items-center justify-between gap-3">
              <h2 className={`${display} text-[1.6rem] font-bold`}>Opening hours</h2>
              {now && hours.size > 0 && (
                <span
                  className={`rounded-full px-3 py-1 text-[13px] font-semibold ${openNow ? "bg-[#dcfce7] text-[#166534]" : "bg-[color-mix(in_oklab,var(--t-fg)_8%,transparent)]"}`}
                >
                  {openNow ? "Open now" : "Closed now"}
                </span>
              )}
            </div>
            {hours.size > 0 ? (
              <table className="mt-4 w-full text-[15px]">
                <tbody>
                  {WEEK_ORDER.map((weekday) => {
                    const span = hours.get(weekday);
                    return (
                      <tr
                        key={weekday}
                        className={`border-b border-[color-mix(in_oklab,var(--t-fg)_8%,transparent)] ${weekday === today ? "font-bold text-[var(--t-accent)]" : ""}`}
                      >
                        <td className="py-2">
                          {DAY_NAMES[weekday]}
                          {weekday === today && " (today)"}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {span ? `${clock(span[0])} – ${clock(span[1])}` : "Closed"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="mt-4 opacity-75">
                {c.availability ||
                  (embedded ? "Write your hours like: Sat–Thu 9:00–21:00 · Fri 14:00–21:00" : "")}
              </p>
            )}
          </div>
          <div className={`${card} flex flex-col p-7`}>
            <h2 className={`${display} text-[1.6rem] font-bold`}>Find us</h2>
            {c.location && (
              <p className="mt-3 text-[1.05rem]" {...ed("location")}>
                {c.location}
              </p>
            )}
            <div className="mt-auto flex flex-wrap gap-3 pt-6">
              {c.location && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.name ?? ""} ${c.location}`)}`}
                  {...external("https://www.google.com/maps")}
                  className={primary}
                >
                  Get directions
                </a>
              )}
              {c.phone && (
                <a
                  href={`tel:${c.phone.replace(/\s+/g, "")}`}
                  className="rounded-full border-2 border-[var(--t-fg)] px-5 py-3 font-semibold"
                  {...ed("phone")}
                >
                  Call {c.phone}
                </a>
              )}
              {c.email && (
                <a
                  href={`mailto:${c.email}`}
                  className="rounded-full border-2 border-[var(--t-fg)] px-5 py-3 font-semibold"
                  {...ed("email")}
                >
                  Email us
                </a>
              )}
            </div>
            {has("education") && (
              <ul className="mt-6 space-y-1 text-[13.5px] opacity-70">
                {(c.education ?? []).map((item, index) => (
                  <li key={index} {...ed(`education.${index}`)}>
                    ✓ {item.degree}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* A sticky booking bar on narrow screens */}
      {canBook && (
        <div className="sticky bottom-0 z-30 border-t border-[color-mix(in_oklab,var(--t-fg)_8%,transparent)] bg-[var(--t-surface)]/95 px-5 py-3 backdrop-blur @3xl:hidden">
          <a href="#book" className={`${primary} block text-center`}>
            Book appointment
          </a>
        </div>
      )}
    </StudioRoot>
  );
}

"use client";

import "@fontsource-variable/figtree";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/manrope";
import { useState } from "react";
import { Reveal, StudioRoot, ed, external, firstName, paragraphs, useStudio, type StudioProps } from "../kit";
import { CountUp, Words, useLookAt, usePointer } from "../motion";

/**
 * Smile: a dental clinic's site that gets the appointment. Molecules drift
 * behind the hero and a soft glow follows the pointer; a friendly tooth
 * watches the visitor. Every treatment shows its price with a "Book this"
 * button, and the booking card writes the request for the patient and opens
 * WhatsApp (or email) with it, so nothing is stored and the clinic answers in
 * the app it already uses. Opening hours sit in the availability line.
 *
 * Our own design. Left out on purpose: pop-ups that block the page, and AI
 * voice assistants (they cost money on every visit).
 */

/** “2026-10-20” → “Tuesday 20 October”, for the booking message. */
const readableDay = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

/** “+971 4 000 0000” → “97140000000”, for wa.me links. */
const digits = (phone?: string) => (phone ?? "").replace(/\D/g, "");

/** Molecules: circles joined by lines, drifting slowly. Drawn once; CSS moves them. */
const ATOMS: Array<[x: number, y: number, r: number]> = [
  [8, 18, 1.6],
  [16, 30, 1.1],
  [26, 14, 1.3],
  [70, 12, 1.4],
  [82, 26, 1.8],
  [92, 14, 1.1],
  [60, 70, 1.2],
  [74, 84, 1.6],
  [88, 72, 1.2],
  [12, 78, 1.4],
  [24, 90, 1.1],
];
const BONDS: Array<[from: number, to: number]> = [
  [0, 1],
  [1, 2],
  [3, 4],
  [4, 5],
  [6, 7],
  [7, 8],
  [9, 10],
];

function Molecules() {
  return (
    <div aria-hidden className="smile-drift absolute inset-0 -z-10 text-[var(--t-accent)] opacity-40">
      {/* Bonds stretch with the hero; the atoms are HTML dots so they stay round. */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
        {BONDS.map(([from, to], index) => (
          <line
            key={index}
            x1={ATOMS[from]![0]}
            y1={ATOMS[from]![1]}
            x2={ATOMS[to]![0]}
            y2={ATOMS[to]![1]}
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {ATOMS.map(([x, y, r], index) => (
        <span
          key={index}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-current"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: `${r * 14}px`,
            height: `${r * 14}px`,
            opacity: 0.25 + (index % 3) * 0.2,
          }}
        />
      ))}
    </div>
  );
}

/** A friendly tooth whose eyes follow the visitor (or the phone's tilt). */
function Tooth({ className = "" }: { className?: string }) {
  const ref = useLookAt<HTMLDivElement>();
  const eye = (cx: number) => (
    <g className="smile-eye">
      <circle cx={cx} cy="78" r="9" fill="var(--t-fg)" />
      <circle cx={cx + 3} cy="74" r="3" fill="#fff" />
    </g>
  );
  return (
    <div ref={ref} aria-hidden className={className}>
      <svg viewBox="0 0 200 200" className="size-full overflow-visible">
        <ellipse cx="100" cy="190" rx="50" ry="7" fill="var(--t-fg)" opacity="0.08" />
        <path
          d="M100 40 C80 22 34 24 32 70 C30 104 46 120 52 150 C56 172 62 184 72 184 C86 184 84 150 100 150 C116 150 114 184 128 184 C138 184 144 172 148 150 C154 120 170 104 168 70 C166 24 120 22 100 40 Z"
          fill="#fff"
          stroke="color-mix(in oklab, var(--t-accent) 45%, var(--t-fg))"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* A shine on the enamel */}
        <path
          d="M56 58 C58 46 68 40 78 40"
          fill="none"
          stroke="var(--t-accent)"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.35"
        />
        {eye(80)}
        {eye(120)}
        <ellipse cx="66" cy="100" rx="9" ry="5" fill="var(--t-accent)" opacity="0.25" />
        <ellipse cx="134" cy="100" rx="9" ry="5" fill="var(--t-accent)" opacity="0.25" />
        <path
          d="M86 104 Q100 118 114 104"
          fill="none"
          stroke="var(--t-fg)"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/** The booking card: the patient picks a treatment, a day and a time; we write the message. */
function Booking({
  services,
  clinic,
  phone,
  email,
  chosen,
  onChoose,
}: {
  services: string[];
  clinic: string;
  phone?: string;
  email?: string;
  chosen: string;
  onChoose: (value: string) => void;
}) {
  const [day, setDay] = useState("");
  const [time, setTime] = useState("Morning");
  const [name, setName] = useState("");
  const message = [
    `Hello ${clinic}, I’d like to book an appointment.`,
    chosen && `Treatment: ${chosen}`,
    day && `Preferred day: ${readableDay(day)}`,
    `Time: ${time}`,
    name && `Name: ${name}`,
  ]
    .filter(Boolean)
    .join("\n");
  const whatsapp = digits(phone) ? `https://wa.me/${digits(phone)}?text=${encodeURIComponent(message)}` : "";
  const mail = email
    ? `mailto:${email}?subject=${encodeURIComponent("Appointment request")}&body=${encodeURIComponent(message)}`
    : "";
  const field =
    "mt-1.5 w-full rounded-2xl border border-[color-mix(in_oklab,var(--t-fg)_14%,transparent)] bg-[var(--t-bg)] px-4 py-3 text-[15px] outline-none focus:border-[var(--t-accent)]";
  return (
    <form onSubmit={(event) => event.preventDefault()} className="grid gap-4 @3xl:grid-cols-2">
      <label className="text-[13px] font-semibold @3xl:col-span-2">
        Treatment
        <select value={chosen} onChange={(event) => onChoose(event.target.value)} className={field}>
          <option value="">Not sure yet: a check-up</option>
          {services.map((service) => (
            <option key={service}>{service}</option>
          ))}
        </select>
      </label>
      <label className="text-[13px] font-semibold">
        Preferred day
        <input type="date" value={day} onChange={(event) => setDay(event.target.value)} className={field} />
      </label>
      <label className="text-[13px] font-semibold">
        Time
        <select value={time} onChange={(event) => setTime(event.target.value)} className={field}>
          <option>Morning</option>
          <option>Afternoon</option>
          <option>Evening</option>
        </select>
      </label>
      <label className="text-[13px] font-semibold @3xl:col-span-2">
        Your name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          className={field}
        />
      </label>
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
            className="rounded-full border-2 border-[var(--t-fg)] px-6 py-3 font-semibold transition-transform hover:-translate-y-0.5"
          >
            Send by email
          </a>
        )}
      </div>
      <p className="text-[12.5px] opacity-60 @3xl:col-span-2">
        This opens your own WhatsApp or email with the request written for you. Nothing is stored here.
      </p>
    </form>
  );
}

export default function Smile({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const glow = usePointer<HTMLElement>();
  const [chosen, setChosen] = useState("");
  const services = c.services ?? [];
  const phoneDigits = digits(c.phone);
  const canBook = Boolean(phoneDigits || c.email);

  const display = "font-[family-name:var(--t-display)]";
  const card =
    "rounded-[28px] bg-[var(--t-surface)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_7%,transparent),0_24px_50px_-36px_color-mix(in_oklab,var(--t-accent)_70%,transparent)]";
  const button =
    "rounded-full bg-[var(--t-accent)] px-6 py-3.5 font-semibold text-[var(--t-surface)] transition-transform hover:-translate-y-0.5";

  /** “Book this” on a treatment: choose it in the card and go there. */
  const book = (title?: string) => {
    setChosen(title ?? "");
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <StudioRoot studio={studio} className="text-[16px] leading-[1.6]">
      <style>{`
        .smile-eye { transform: translate(calc(var(--lx, 0) * 6px), calc(var(--ly, 0) * 5px)); transition: transform 0.18s ease-out; }
        @media (prefers-reduced-motion: no-preference) {
          .smile-drift { animation: smile-drift 18s ease-in-out infinite alternate; }
          .smile-bob { animation: smile-bob 5s ease-in-out infinite; }
        }
        @keyframes smile-drift { to { transform: translate(2%, -3%) scale(1.04); } }
        @keyframes smile-bob { 50% { transform: translateY(-10px) rotate(-3deg); } }
        [data-static] .smile-drift, [data-static] .smile-bob { animation: none; }
      `}</style>

      {/* ——— Hero: molecules, a glow that follows the pointer, and the tooth ——— */}
      <section
        ref={glow}
        className="relative isolate overflow-hidden bg-[linear-gradient(180deg,color-mix(in_oklab,var(--t-accent)_10%,var(--t-bg)),var(--t-bg))]"
      >
        <Molecules />
        <div
          aria-hidden
          className="pointer-events-none absolute -z-10 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--t-accent)_28%,transparent),transparent)] transition-opacity duration-500"
          style={{
            left: "var(--mx, 70%)",
            top: "var(--my, 30%)",
            opacity: "calc(0.35 + var(--hover, 0) * 0.65)",
          }}
        />
        <header className="mx-auto flex max-w-[74rem] items-center justify-between gap-4 px-5 py-5 @3xl:px-10">
          <span className={`${display} text-[1.15rem] font-bold tracking-[-0.01em]`}>{c.name}</span>
          {canBook && (
            <a href="#book" className={`${button} px-5 py-2.5 text-[14px]`}>
              Book a visit
            </a>
          )}
        </header>

        <div className="mx-auto grid max-w-[74rem] items-center gap-10 px-5 pb-16 pt-8 @3xl:px-10 @4xl:grid-cols-[1.3fr_1fr] @4xl:pb-24">
          <div>
            {c.availability && (
              <p
                className="inline-flex items-center gap-2 rounded-full bg-[var(--t-surface)] px-4 py-1.5 text-[13px] font-medium shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_8%,transparent)]"
                {...ed("availability")}
              >
                <span className="size-2 rounded-full bg-[#22c55e]" />
                {c.availability}
              </p>
            )}
            <h1
              className={`${display} mt-6 text-[clamp(2.8rem,8cqw,5.6rem)] font-bold leading-[0.95] tracking-[-0.035em]`}
              {...ed("name")}
            >
              {c.name}
            </h1>
            <p
              className="mt-3 text-[15px] font-semibold text-[var(--t-accent)]"
              {...ed("professional_title")}
            >
              {c.professional_title}
              {c.location && <span className="font-normal opacity-70"> · {c.location}</span>}
            </p>
            {c.tagline && (
              <p
                className={`${display} mt-5 max-w-[34rem] text-[clamp(1.4rem,3cqw,2rem)] font-medium leading-snug`}
                {...ed("tagline")}
              >
                <Words text={c.tagline} step={45} />
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              {canBook && (
                <a href="#book" className={button}>
                  Book an appointment
                </a>
              )}
              {c.phone && (
                <a
                  href={`tel:${c.phone.replace(/\s+/g, "")}`}
                  className="rounded-full bg-[var(--t-surface)] px-6 py-3.5 font-semibold shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_10%,transparent)]"
                  {...ed("phone")}
                >
                  Call {c.phone}
                </a>
              )}
            </div>
          </div>
          <Tooth className="smile-bob mx-auto aspect-square w-[52%] max-w-[20rem] @4xl:w-[86%]" />
        </div>

        {has("stats") && (
          <dl className="mx-auto grid max-w-[74rem] grid-cols-3 gap-3 px-5 pb-14 @3xl:px-10">
            {(c.stats ?? []).slice(0, 3).map((stat, index) => (
              <div key={index} className={`${card} px-5 py-5 text-center`} {...ed(`stats.${index}`)}>
                <dd className={`${display} text-[clamp(1.6rem,4.4cqw,2.8rem)] font-bold leading-none`}>
                  <CountUp value={stat.value} />
                </dd>
                <dt className="mt-2 text-[13px] opacity-65">{stat.label}</dt>
              </div>
            ))}
          </dl>
        )}
      </section>

      {/* ——— Treatments and prices ——— */}
      {has("services") && (
        <section className="mx-auto max-w-[74rem] px-5 py-16 @3xl:px-10">
          <h2 className={`${display} text-[clamp(2.2rem,5cqw,3.4rem)] font-bold tracking-[-0.03em]`}>
            {label("services", "Treatments and prices")}
          </h2>
          <p className="mt-2 opacity-70">You’ll always know the price before we start.</p>
          <div className="mt-10 grid gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3">
            {services.map((service, index) => (
              <Reveal key={index} delay={(index % 3) * 70}>
                <article className={`${card} flex h-full flex-col p-6`} {...ed(`services.${index}`)}>
                  <h3 className={`${display} text-[1.3rem] font-bold leading-tight`}>{service.title}</h3>
                  {service.description && (
                    <p className="mt-2 text-[15px] opacity-75">{service.description}</p>
                  )}
                  <div className="mt-auto flex items-end justify-between gap-3 pt-6">
                    {service.price && (
                      <span className={`${display} text-[1.25rem] font-bold text-[var(--t-accent)]`}>
                        {service.price}
                      </span>
                    )}
                    {canBook && (
                      <button
                        type="button"
                        onClick={() => book(service.title)}
                        className="rounded-full bg-[color-mix(in_oklab,var(--t-accent)_12%,transparent)] px-4 py-2 text-[13px] font-semibold"
                      >
                        Book this →
                      </button>
                    )}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ——— About the clinic, and what we're good at ——— */}
      {(has("about") || has("skills")) && (
        <section className="mx-auto grid max-w-[74rem] gap-10 px-5 py-14 @3xl:px-10 @4xl:grid-cols-[1.3fr_1fr]">
          {has("about") && (
            <div>
              <h2 className={`${display} text-[clamp(2rem,4.6cqw,3rem)] font-bold tracking-[-0.03em]`}>
                {label("about", `Hello, I’m ${firstName(c.name) || "your dentist"}`)}
              </h2>
              <div className="mt-5 space-y-4 text-[1.06rem] opacity-85">
                {paragraphs(c).map(({ text, index }) => (
                  <p key={index} className="pretty" {...ed(`summary.${index}`)}>
                    {text}
                  </p>
                ))}
              </div>
            </div>
          )}
          {has("skills") && (
            <div className={`${card} self-start p-7`} {...ed("skills")}>
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] opacity-60">We can help with</p>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[15px]">
                {(c.skills ?? []).map((skill) => (
                  <li key={skill} className="flex items-center gap-2">
                    <span className="text-[var(--t-accent)]">✓</span>
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* ——— Booking ——— */}
      {canBook && (
        <section id="book" className="scroll-mt-6 px-5 py-14 @3xl:px-10">
          <div
            className={`${card} mx-auto grid max-w-[74rem] gap-10 p-7 @3xl:p-12 @4xl:grid-cols-[1fr_1.3fr]`}
          >
            <div>
              <h2
                className={`${display} text-[clamp(2.2rem,5cqw,3.4rem)] font-bold leading-[1] tracking-[-0.03em]`}
              >
                Book an appointment
              </h2>
              <p className="mt-4 opacity-75">
                Choose a treatment and a time that suits you. We’ll reply to confirm, usually within the hour.
              </p>
              {c.availability && (
                <p className="mt-6 text-[15px] font-semibold" {...ed("availability")}>
                  {c.availability}
                </p>
              )}
              {c.location && (
                <p className="mt-1 text-[15px] opacity-75" {...ed("location")}>
                  {c.location}
                </p>
              )}
            </div>
            <Booking
              services={services.map((service) => service.title ?? "").filter(Boolean)}
              clinic={c.name ?? "the clinic"}
              phone={c.phone}
              email={c.email}
              chosen={chosen}
              onChoose={setChosen}
            />
          </div>
        </section>
      )}

      {/* ——— What patients say ——— */}
      {has("testimonials") && (
        <section className="mx-auto max-w-[74rem] px-5 py-14 @3xl:px-10">
          <h2 className={`${display} text-[clamp(2rem,4.6cqw,3rem)] font-bold tracking-[-0.03em]`}>
            {label("testimonials", "What patients say")}
          </h2>
          <div className="mt-8 grid gap-4 @3xl:grid-cols-3">
            {(c.testimonials ?? []).map((item, index) => (
              <Reveal key={index} delay={index * 80}>
                <figure className={`${card} h-full p-7`} {...ed(`testimonials.${index}`)}>
                  <p className="text-[var(--t-accent)]">★★★★★</p>
                  <blockquote className="mt-3 text-[1.1rem] leading-snug">“{item.quote}”</blockquote>
                  <figcaption className="mt-4 text-[14px]">
                    <b>{item.name}</b>
                    {item.role && <span className="opacity-60"> · {item.role}</span>}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ——— Qualifications and experience ——— */}
      {(has("education") || has("experience")) && (
        <section className="mx-auto grid max-w-[74rem] gap-4 px-5 py-12 @3xl:grid-cols-2 @3xl:px-10">
          {has("education") &&
            (c.education ?? []).map((item, index) => (
              <div key={`e${index}`} className={`${card} p-6`} {...ed(`education.${index}`)}>
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] opacity-55">Qualified</p>
                <p className={`${display} mt-2 text-[1.15rem] font-bold`}>{item.degree}</p>
                <p className="text-[14px] opacity-70">
                  {[item.school, item.end_date].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))}
          {has("experience") &&
            (c.experience ?? []).map((job, index) => (
              <div key={`x${index}`} className={`${card} p-6`} {...ed(`experience.${index}`)}>
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] opacity-55">
                  {[job.start_date, job.end_date].filter(Boolean).join(" – ")}
                </p>
                <p className={`${display} mt-2 text-[1.15rem] font-bold`}>{job.job_title}</p>
                <p className="text-[14px] opacity-70">
                  {[job.company, job.location].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))}
        </section>
      )}

      {/* ——— Find us ——— */}
      {has("contact") && (
        <section className="px-5 pb-12 pt-6 @3xl:px-10">
          <div className="relative isolate mx-auto flex max-w-[74rem] flex-wrap items-center justify-between gap-6 overflow-hidden rounded-[36px] bg-[var(--t-accent)] px-7 py-12 text-[var(--t-surface)] @3xl:px-12">
            <div>
              <h2 className={`${display} text-[clamp(2rem,5cqw,3.4rem)] font-bold leading-[1]`}>
                See you soon.
              </h2>
              {c.location && <p className="mt-3 opacity-85">{c.location}</p>}
            </div>
            <div className="flex flex-wrap gap-3">
              {phoneDigits && (
                <a
                  href={`https://wa.me/${phoneDigits}`}
                  {...external(`https://wa.me/${phoneDigits}`)}
                  className="rounded-full bg-[var(--t-surface)] px-6 py-3.5 font-semibold text-[var(--t-fg)]"
                >
                  WhatsApp
                </a>
              )}
              {c.email && (
                <a
                  href={`mailto:${c.email}`}
                  className="rounded-full border-2 border-[var(--t-surface)] px-6 py-3 font-semibold"
                  {...ed("email")}
                >
                  {c.email}
                </a>
              )}
              {c.instagram && (
                <a
                  href={c.instagram}
                  {...external(c.instagram)}
                  className="rounded-full border-2 border-[var(--t-surface)] px-6 py-3 font-semibold"
                >
                  Instagram ↗
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </StudioRoot>
  );
}

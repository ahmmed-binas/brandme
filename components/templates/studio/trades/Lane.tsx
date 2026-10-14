"use client";

import "@fontsource-variable/inter-tight";
import "@fontsource-variable/jetbrains-mono";
import {
  Picture,
  Reveal,
  StudioRoot,
  contactLinks,
  ed,
  external,
  firstName,
  pad,
  paragraphs,
  useStudio,
  type StudioProps,
} from "../kit";
import { CountUp } from "../motion";
import { Vehicle3D, type VehicleKind } from "../vehicle3d";

/**
 * Lane, Throttle and Route: three instructor sites built on one layout, each
 * with its own 3D vehicle driving along an endless road in the hero (a car
 * for Lane, a motorbike for Throttle, a bus for Route). Visitors drag it
 * across the lanes and tap to park it. A huge outlined headline sits under
 * the road; a thin red-to-blue line runs down the page like a lane marking.
 * Then the pass rate, the road to the licence, packages, lessons in pictures,
 * areas covered, reviews and one-tap booking.
 */

type Variant = {
  kind: VehicleKind;
  /** Under the name in the side bar. */
  role: string;
  /** The vehicle's name in the drag hint. */
  noun: string;
  /** Used in the WhatsApp booking message and the email subject. */
  lesson: string;
  road: string[][];
};

const VARIANTS: Record<string, Variant> = {
  lane: {
    kind: "car",
    role: "Driving instructor",
    noun: "car",
    lesson: "a driving lesson",
    road: [
      ["Theory", "Road signs and rules, with practice tests until you’re scoring well every time."],
      ["Parking", "Parallel, angle and garage parking, on the same markings as the test centre."],
      ["Assessment", "Steady control in traffic: mirrors, signals, lane discipline, roundabouts."],
      ["Road test", "Mock tests on the real routes, then the test with a calm head."],
    ],
  },
  throttle: {
    kind: "bike",
    role: "Motorcycle instructor",
    noun: "bike",
    lesson: "a riding lesson",
    road: [
      ["Taster", "An hour off the road: balance, clutch and brakes, with the bike and helmet provided."],
      ["Cone course", "Slow control, figure of eight and emergency stops until they feel easy."],
      ["Road riding", "Junctions, roundabouts and highway speeds, with radio coaching in your helmet."],
      ["Road test", "Mock tests on the real routes, then the test with a calm head."],
    ],
  },
  route: {
    kind: "bus",
    role: "Bus & truck instructor",
    noun: "bus",
    lesson: "a bus or truck lesson",
    road: [
      ["Theory & medical", "The rules for heavy vehicles, the eye test and the paperwork, sorted first."],
      ["Yard skills", "Reversing, tight turns and kerb-side stops in the training yard."],
      ["On the road", "Space, mirrors and planning ahead in real traffic, on the test routes."],
      ["Road test", "Mock tests in the same vehicle you’ll be tested in, then the real thing."],
    ],
  },
};

const digits = (phone?: string) => (phone ?? "").replace(/[^\d]/g, "");

export default function Lane({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label, accent, palette } = studio;
  const variant = VARIANTS[template.id] ?? VARIANTS.lane!;
  const ROAD = variant.road;
  const phone = digits(c.phone);
  const whatsapp = phone ? `https://wa.me/${phone}` : undefined;
  const book = whatsapp
    ? `${whatsapp}?text=${encodeURIComponent(`Hi ${firstName(c.name)}, I'd like to book ${variant.lesson}.`)}`
    : c.email
      ? `mailto:${c.email}?subject=${encodeURIComponent(`Booking ${variant.lesson}`)}`
      : "#book";
  const display = "font-[family-name:var(--t-display)]";
  const mono = "font-[family-name:var(--t-mono)]";
  const line = "bg-[linear-gradient(180deg,#ff3d5a,var(--t-accent),#3d5aff)]";
  const card =
    "rounded-[22px] bg-[var(--t-surface)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_9%,transparent),0_30px_60px_-40px_rgb(0_0_0/0.6)]";

  return (
    <StudioRoot studio={studio} className="text-[16px] leading-[1.6]">
      {/* ——— Hero ——— */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_65%_45%,color-mix(in_oklab,var(--t-accent)_14%,transparent),transparent_70%)]"
        />
        <div className="mx-auto grid max-w-[84rem] @4xl:grid-cols-[15rem_minmax(0,1fr)]">
          {/* Vertical nav with the lane line */}
          <aside className="relative hidden flex-col px-8 py-10 @4xl:flex">
            <span aria-hidden className={`absolute right-0 top-0 h-full w-[3px] ${line}`} />
            <p className={`${display} text-[1.15rem] font-semibold uppercase tracking-[0.12em]`}>{c.name}</p>
            <p className={`${mono} mt-1 text-[11px] uppercase tracking-[0.18em] opacity-60`}>
              {variant.role}
            </p>
            <nav
              className={`${mono} mt-16 flex flex-col gap-5 text-[12px] uppercase tracking-[0.2em] opacity-75`}
            >
              <a href="#road" className="hover:opacity-100 hover:text-[var(--t-accent)]">
                The road
              </a>
              <a href="#packages" className="hover:text-[var(--t-accent)]">
                Packages
              </a>
              <a href="#lessons" className="hover:text-[var(--t-accent)]">
                Lessons
              </a>
              <a href="#reviews" className="hover:text-[var(--t-accent)]">
                Reviews
              </a>
              <a href={book} {...external(book)} className="text-[var(--t-fg)] hover:text-[var(--t-accent)]">
                Book ‹
              </a>
            </nav>
            <p className={`${mono} mt-auto text-[11px] opacity-50`} {...ed("location")}>
              {c.location}
            </p>
          </aside>

          <div className="relative min-w-0 px-5 pb-10 pt-8 @3xl:px-10 @4xl:pt-12">
            <header className="flex items-center justify-between @4xl:hidden">
              <span className={`${display} text-[1rem] font-semibold uppercase tracking-[0.12em]`}>
                {c.name}
              </span>
              <a
                href={book}
                {...external(book)}
                className="rounded-full bg-[var(--t-accent)] px-4 py-2 text-[13px] font-semibold text-white"
              >
                Book
              </a>
            </header>

            <div className="mt-6 grid gap-6 @4xl:mt-0 @4xl:grid-cols-[minmax(0,1fr)_17rem]">
              <div className="relative min-w-0">
                <div className="relative aspect-[4/3] w-full @4xl:aspect-[16/10]">
                  <Vehicle3D kind={variant.kind} accent={accent} background={palette?.bg ?? "#15161b"} />
                  <p
                    className={`${mono} pointer-events-none absolute left-2 top-2 rounded-full bg-[color-mix(in_oklab,var(--t-bg)_70%,transparent)] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] backdrop-blur`}
                  >
                    Drag the {variant.noun} across the road · tap to park
                  </p>
                </div>
                <h1
                  className={`${display} pointer-events-none relative -mt-[12%] text-[clamp(2.8rem,8.8cqw,7.4rem)] font-light uppercase italic leading-[0.92] tracking-[-0.02em] text-transparent [-webkit-text-stroke:1.5px_var(--t-fg)]`}
                  {...ed("name")}
                >
                  {c.name}
                </h1>
                <p
                  className={`${display} mt-3 text-[clamp(1.1rem,2.2cqw,1.5rem)] font-medium text-[var(--t-accent)]`}
                  {...ed("professional_title")}
                >
                  {c.professional_title}
                </p>
              </div>

              {/* Side panel: the promise and booking */}
              <div className="flex flex-col gap-4 @4xl:pt-16">
                {c.tagline && (
                  <div className={`${card} p-6`} {...ed("tagline")}>
                    <p className={`${mono} text-[11px] uppercase tracking-[0.2em] opacity-60`}>Manifest</p>
                    <p className="mt-3 text-[1.02rem] leading-snug">{c.tagline}</p>
                  </div>
                )}
                {c.availability && (
                  <p
                    className={`${mono} flex items-center gap-2 text-[12px] opacity-80`}
                    {...ed("availability")}
                  >
                    <span className="size-2 animate-pulse rounded-full bg-[#22c55e]" />
                    {c.availability}
                  </p>
                )}
                <a
                  href={book}
                  {...external(book)}
                  className="rounded-2xl bg-[linear-gradient(110deg,#ff3d5a,var(--t-accent))] px-5 py-4 text-center font-semibold text-white shadow-[0_18px_40px_-18px_var(--t-accent)] transition-transform hover:-translate-y-0.5"
                >
                  Book a lesson →
                </a>
                {c.phone && (
                  <a
                    href={`tel:${phone}`}
                    className={`${mono} text-center text-[14px] opacity-80 hover:opacity-100`}
                    {...ed("phone")}
                  >
                    {c.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— Numbers ——— */}
      {has("stats") && (
        <section className="mx-auto grid max-w-[84rem] gap-4 px-5 py-12 @3xl:grid-flow-col @3xl:auto-cols-fr @3xl:px-10">
          {(c.stats ?? []).map((stat, index) => (
            <div key={index} className={`${card} relative overflow-hidden p-7`} {...ed(`stats.${index}`)}>
              <span aria-hidden className={`absolute left-0 top-0 h-full w-[3px] ${line}`} />
              <p
                className={`${display} text-[clamp(2.6rem,6cqw,4rem)] font-semibold leading-none tracking-[-0.03em]`}
              >
                <CountUp value={stat.value} />
              </p>
              <p className={`${mono} mt-3 text-[12px] uppercase tracking-[0.16em] opacity-65`}>
                {stat.label}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* ——— The road to the licence ——— */}
      <section id="road" className="mx-auto max-w-[84rem] px-5 py-16 @3xl:px-10">
        <h2
          className={`${display} text-[clamp(2.2rem,5.4cqw,4rem)] font-light uppercase italic leading-none tracking-[-0.02em]`}
        >
          Your road to the licence
        </h2>
        <ol className="relative mt-12 grid gap-8 @3xl:grid-cols-4">
          <span
            aria-hidden
            className="absolute left-0 right-0 top-[11px] hidden h-[2px] bg-[repeating-linear-gradient(90deg,var(--t-fg)_0_18px,transparent_18px_34px)] opacity-25 @3xl:block"
          />
          {ROAD.map(([title, text], index) => (
            <li key={title} className="relative">
              <span className="relative grid size-6 place-items-center rounded-full bg-[var(--t-accent)] text-[11px] font-bold text-white shadow-[0_0_0_6px_var(--t-bg)]">
                {index + 1}
              </span>
              <p className={`${display} mt-4 text-[1.35rem] font-semibold`}>{title}</p>
              <p className="mt-1 text-[14.5px] opacity-75">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ——— Packages ——— */}
      {has("services") && (
        <section id="packages" className="mx-auto max-w-[84rem] px-5 py-16 @3xl:px-10">
          <h2
            className={`${display} text-[clamp(2.2rem,5.4cqw,4rem)] font-light uppercase italic leading-none tracking-[-0.02em]`}
          >
            {label("services", "Packages")}
          </h2>
          <div className="mt-10 grid gap-4 @3xl:grid-cols-2 @5xl:grid-cols-4">
            {(c.services ?? []).map((service, index) => (
              <Reveal key={index} delay={index * 80}>
                <div
                  className={`${card} group flex h-full flex-col p-6 transition-transform hover:-translate-y-1`}
                  {...ed(`services.${index}`)}
                >
                  <p className={`${mono} text-[11px] opacity-50`}>{pad(index + 1)}</p>
                  <h3 className={`${display} mt-2 text-[1.25rem] font-semibold leading-tight`}>
                    {service.title}
                  </h3>
                  <p className="mt-2 flex-1 text-[14.5px] opacity-70">{service.description}</p>
                  <p className={`${display} mt-5 text-[1.7rem] font-semibold text-[var(--t-accent)]`}>
                    {service.price}
                  </p>
                  <a
                    href={book}
                    {...external(book)}
                    className={`${mono} mt-3 text-[12px] uppercase tracking-[0.16em] opacity-70 group-hover:opacity-100`}
                  >
                    Book this →
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ——— Lessons in pictures ——— */}
      {has("projects") && (
        <section id="lessons" className="py-16">
          <h2
            className={`${display} mx-auto max-w-[84rem] px-5 text-[clamp(2.2rem,5.4cqw,4rem)] font-light uppercase italic leading-none tracking-[-0.02em] @3xl:px-10`}
          >
            {label("projects", "Inside the lessons")}
          </h2>
          <div className="mt-10 flex snap-x gap-5 overflow-x-auto px-5 pb-4 [scrollbar-width:none] @3xl:px-10">
            {(c.projects ?? []).map((lesson, index) => (
              <figure
                key={index}
                className="group w-[min(80%,26rem)] shrink-0 snap-start"
                {...ed(`projects.${index}`)}
              >
                <div className="relative overflow-hidden rounded-[22px]">
                  <Picture
                    src={lesson.image}
                    alt={lesson.title ?? ""}
                    embedded={embedded}
                    className="aspect-[4/5] w-full grayscale-[35%] transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
                  />
                  <span
                    className={`${mono} absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white backdrop-blur`}
                  >
                    {[lesson.client, lesson.category].filter(Boolean).join(" · ")}
                  </span>
                </div>
                <figcaption className="mt-4">
                  <p className={`${display} text-[1.25rem] font-semibold leading-tight`}>{lesson.title}</p>
                  {lesson.role && <p className="text-[14px] text-[var(--t-accent)]">{lesson.role}</p>}
                  {lesson.description && <p className="mt-1 text-[14px] opacity-70">{lesson.description}</p>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ——— Areas ——— */}
      {has("skills") && (
        <section className="mx-auto max-w-[84rem] px-5 py-10 @3xl:px-10" {...ed("skills")}>
          <p className={`${mono} text-[12px] uppercase tracking-[0.2em] opacity-60`}>Pick-up areas</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {(c.skills ?? []).map((area) => (
              <span
                key={area}
                className="rounded-full bg-[var(--t-surface)] px-4 py-2 text-[14px] shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_10%,transparent)]"
              >
                {area}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ——— Reviews ——— */}
      {has("testimonials") && (
        <section
          id="reviews"
          className="mx-auto grid max-w-[84rem] gap-5 px-5 py-16 @3xl:grid-cols-2 @3xl:px-10"
        >
          {(c.testimonials ?? []).map((item, index) => (
            <Reveal key={index} delay={index * 90}>
              <figure
                className={`${card} relative h-full overflow-hidden p-8`}
                {...ed(`testimonials.${index}`)}
              >
                <span aria-hidden className={`absolute left-0 top-0 h-full w-[3px] ${line}`} />
                <blockquote className={`${display} text-[1.3rem] font-medium leading-snug`}>
                  “{item.quote}”
                </blockquote>
                <figcaption className={`${mono} mt-5 text-[12px] uppercase tracking-[0.14em] opacity-65`}>
                  {item.name} · {item.role}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </section>
      )}

      {/* ——— The instructor ——— */}
      {(has("about") || has("highlights") || has("experience")) && (
        <section className="mx-auto grid max-w-[84rem] items-start gap-10 px-5 py-16 @3xl:px-10 @4xl:grid-cols-[20rem_1fr]">
          <div className={`${card} overflow-hidden p-2`} {...ed("avatar")}>
            <Picture
              src={c.avatar}
              alt={c.name ?? ""}
              embedded={embedded}
              prompt="Your photo"
              className="aspect-[4/5] w-full rounded-[16px]"
            />
          </div>
          <div>
            <h2
              className={`${display} text-[clamp(2rem,4.6cqw,3.4rem)] font-light uppercase italic leading-none tracking-[-0.02em]`}
            >
              {label("about", `Hi, I’m ${firstName(c.name)}`)}
            </h2>
            <div className="mt-6 space-y-4 text-[1.06rem] opacity-85">
              {paragraphs(c).map(({ text, index }) => (
                <p key={index} className="pretty" {...ed(`summary.${index}`)}>
                  {text}
                </p>
              ))}
            </div>
            {has("highlights") && (
              <ul className="mt-8 grid gap-3 @3xl:grid-cols-3">
                {(c.highlights ?? []).map((item, index) => (
                  <li key={index} className={`${card} p-5`} {...ed(`highlights.${index}`)}>
                    <span className="grid size-8 place-items-center rounded-full bg-[var(--t-accent)] text-[13px] font-bold text-white">
                      ✓
                    </span>
                    <p className="mt-3 font-semibold leading-tight">{item.title}</p>
                    <p className="text-[13px] opacity-65">
                      {[item.detail, item.year].filter(Boolean).join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* ——— Book ——— */}
      {has("contact") && (
        <section id="book" className="px-5 pb-12 pt-6 @3xl:px-10">
          <div className="relative isolate mx-auto max-w-[84rem] overflow-hidden rounded-[30px] bg-[var(--t-surface)] px-7 py-16 shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_9%,transparent)] @3xl:px-14">
            <span aria-hidden className={`absolute left-0 top-0 h-full w-[4px] ${line}`} />
            <h2
              className={`${display} max-w-[40rem] text-[clamp(2.4rem,6cqw,4.6rem)] font-light uppercase italic leading-[0.95] tracking-[-0.02em]`}
            >
              Ready when <span className="text-[var(--t-accent)]">you are.</span>
            </h2>
            <p className="mt-4 max-w-[30rem] opacity-75">
              Tell me your area and the times that suit you. I’ll reply with a slot and a pick-up point.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={book}
                {...external(book)}
                className="rounded-2xl bg-[linear-gradient(110deg,#ff3d5a,var(--t-accent))] px-7 py-4 font-semibold text-white"
              >
                Book on WhatsApp
              </a>
              {c.email && (
                <a
                  href={`mailto:${c.email}`}
                  className="rounded-2xl px-7 py-4 font-semibold shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--t-fg)_30%,transparent)]"
                  {...ed("email")}
                >
                  {c.email}
                </a>
              )}
            </div>
            <p
              className={`${mono} mt-6 flex flex-wrap gap-5 text-[12px] uppercase tracking-[0.14em] opacity-65`}
            >
              {contactLinks(c)
                .filter((link) => !/^(mailto|tel):/.test(link.url))
                .map((link) => (
                  <a key={link.url} href={link.url} {...external(link.url)} className="hover:opacity-100">
                    {link.label} ↗
                  </a>
                ))}
            </p>
          </div>
        </section>
      )}
    </StudioRoot>
  );
}

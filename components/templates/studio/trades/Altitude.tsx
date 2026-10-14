"use client";

import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/manrope";
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
import { Shader } from "../shader";
import { Vehicle3D } from "../vehicle3d";

/**
 * Altitude: a flight instructor's site. A 3D light aircraft flies over a slow
 * sky of drifting clouds (WebGL) and banks towards the pointer; the numbers
 * (hours flown, students sent solo) read like cockpit instruments; ratings sit
 * in a logbook; training is priced from a discovery flight to a full licence.
 * For flight instructors, flying schools and drone or glider instructors.
 */

/** A sky gradient with layers of soft clouds drifting past. */
const SKY = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv * vec2(u_res.x / u_res.y, 1.0);
  vec3 sky = mix(u_a, mix(u_a, u_b, 0.35), smoothstep(0.0, 1.0, uv.y));
  float clouds = 0.0;
  for (int i = 0; i < 3; i++) {
    float f = float(i);
    vec2 q = p * (1.2 + f * 0.8) + vec2(u_time * (0.012 + f * 0.01), f * 7.0);
    clouds += smoothstep(0.55, 0.85, fbm(q)) * (0.45 - f * 0.1);
  }
  vec3 colour = mix(sky, u_c, clamp(clouds, 0.0, 1.0) * 0.5);
  colour += u_b * 0.06 * smoothstep(0.6, 0.0, length(uv - vec2(0.75, 0.75)));
  gl_FragColor = vec4(colour, 1.0);
}
`;

/** A round cockpit instrument showing one number: a needle swings to a position based on the value. */
function Gauge({ value, label, index }: { value?: string; label?: string; index: number }) {
  const number = Number.parseFloat((value ?? "0").replace(/[^\d.]/g, "")) || 0;
  const angle = -120 + Math.min(1, Math.log10(number + 1) / 4) * 240;
  return (
    <div className="relative grid aspect-square w-full max-w-[13rem] place-items-center rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--t-surface)_70%,black),#050608)] shadow-[0_0_0_6px_color-mix(in_oklab,var(--t-fg)_10%,transparent),0_0_0_7px_color-mix(in_oklab,var(--t-fg)_22%,transparent),inset_0_10px_30px_rgb(0_0_0/0.8),0_30px_60px_-30px_black]">
      <svg viewBox="-100 -100 200 200" className="absolute inset-0 size-full" aria-hidden>
        {Array.from({ length: 13 }, (_, tick) => {
          const a = ((-120 + tick * 20) * Math.PI) / 180;
          return (
            <line
              key={tick}
              x1={Math.sin(a) * 78}
              y1={-Math.cos(a) * 78}
              x2={Math.sin(a) * (tick % 3 === 0 ? 64 : 70)}
              y2={-Math.cos(a) * (tick % 3 === 0 ? 64 : 70)}
              stroke="currentColor"
              strokeWidth={tick % 3 === 0 ? 2.5 : 1.2}
              opacity="0.7"
            />
          );
        })}
        <g
          style={{ transform: `rotate(${angle}deg)`, transition: "transform 1.6s cubic-bezier(.2,.8,.2,1)" }}
        >
          <line
            x1="0"
            y1="10"
            x2="0"
            y2="-66"
            stroke="var(--t-accent)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
        <circle r="6" fill="var(--t-accent)" />
      </svg>
      <div className="relative mt-16 text-center">
        <p className="font-[family-name:var(--t-mono)] text-[1.35rem] font-semibold leading-none">{value}</p>
        <p className="mt-1 font-[family-name:var(--t-mono)] text-[9.5px] uppercase tracking-[0.18em] opacity-60">
          {label}
        </p>
      </div>
      <span className="absolute left-1/2 top-[22%] -translate-x-1/2 font-[family-name:var(--t-mono)] text-[9px] opacity-40">
        {pad(index + 1)}
      </span>
    </div>
  );
}

const digits = (phone?: string) => (phone ?? "").replace(/[^\d]/g, "");

export default function Altitude({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label, palette, accent } = studio;
  const colours: [string, string, string] = [palette?.bg ?? "#071225", accent, palette?.fg ?? "#eef3fb"];
  const phone = digits(c.phone);
  const book = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${firstName(c.name)}, I'd like to book a discovery flight.`)}`
    : c.email
      ? `mailto:${c.email}?subject=${encodeURIComponent("Flight training")}`
      : "#book";
  const display = "font-[family-name:var(--t-display)]";
  const mono = "font-[family-name:var(--t-mono)]";
  const card =
    "rounded-[24px] bg-[color-mix(in_oklab,var(--t-surface)_88%,transparent)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_10%,transparent),0_30px_60px_-40px_black] backdrop-blur";

  return (
    <StudioRoot studio={studio} className="font-[family-name:var(--t-text)] text-[16px] leading-[1.6]">
      {/* ——— Hero: the plane in the sky ——— */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Shader fragment={SKY} colours={colours} />
        </div>
        <header className="mx-auto flex max-w-[80rem] items-center justify-between px-5 py-6 @3xl:px-10">
          <span className={`${mono} text-[13px] uppercase tracking-[0.22em]`}>{c.name}</span>
          <nav className={`${mono} flex items-center gap-2 text-[12px] uppercase tracking-[0.16em]`}>
            <a
              href="#training"
              className="hidden rounded-full px-3 py-2 opacity-70 hover:opacity-100 @2xl:inline"
            >
              Training
            </a>
            <a
              href="#logbook"
              className="hidden rounded-full px-3 py-2 opacity-70 hover:opacity-100 @2xl:inline"
            >
              Logbook
            </a>
            <a
              href={book}
              {...external(book)}
              className="rounded-full bg-[var(--t-accent)] px-4 py-2 font-semibold text-[var(--t-bg)]"
            >
              Fly with me
            </a>
          </nav>
        </header>

        <div className="mx-auto grid max-w-[80rem] items-center gap-6 px-5 pb-16 @3xl:px-10 @4xl:grid-cols-[1fr_1.15fr]">
          <div className="relative z-10">
            {c.availability && (
              <p
                className={`${mono} inline-flex items-center gap-2 rounded-full bg-[color-mix(in_oklab,var(--t-fg)_8%,transparent)] px-3.5 py-1.5 text-[12px] backdrop-blur`}
                {...ed("availability")}
              >
                <span className="size-2 animate-pulse rounded-full bg-[var(--t-accent)]" />
                {c.availability}
              </p>
            )}
            <h1
              className={`${display} mt-6 text-[clamp(3rem,8cqw,6.4rem)] font-semibold leading-[0.92] tracking-[-0.04em]`}
              {...ed("name")}
            >
              {c.name}
            </h1>
            <p
              className={`${mono} mt-4 text-[13px] uppercase tracking-[0.18em] text-[var(--t-accent)]`}
              {...ed("professional_title")}
            >
              {c.professional_title}
            </p>
            {c.tagline && (
              <p
                className="mt-6 max-w-[32rem] text-[clamp(1.2rem,2.2cqw,1.5rem)] leading-snug opacity-90"
                {...ed("tagline")}
              >
                {c.tagline}
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={book}
                {...external(book)}
                className="rounded-2xl bg-[var(--t-accent)] px-6 py-4 font-semibold text-[var(--t-bg)] shadow-[0_18px_40px_-16px_var(--t-accent)] transition-transform hover:-translate-y-0.5"
              >
                Book a discovery flight
              </a>
              <a
                href="#training"
                className="rounded-2xl px-6 py-4 font-semibold shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--t-fg)_30%,transparent)]"
              >
                See training
              </a>
            </div>
            {c.location && (
              <p
                className={`${mono} mt-6 text-[12px] uppercase tracking-[0.16em] opacity-60`}
                {...ed("location")}
              >
                Based at {c.location}
              </p>
            )}
          </div>
          <div className="relative aspect-[5/4] w-full">
            <Vehicle3D kind="plane" accent={accent} background={palette?.bg ?? "#071225"} />
            <p
              className={`${mono} pointer-events-none absolute right-2 top-2 text-[11px] uppercase tracking-[0.18em] opacity-50`}
            >
              Drag to fly · tap to roll
            </p>
          </div>
        </div>
      </section>

      {/* ——— Instruments ——— */}
      {has("stats") && (
        <section className="mx-auto max-w-[80rem] px-5 py-16 @3xl:px-10">
          <div className="grid grid-cols-1 justify-items-center gap-8 @2xl:grid-cols-3">
            {(c.stats ?? []).slice(0, 3).map((stat, index) => (
              <div key={index} className="w-full" {...ed(`stats.${index}`)}>
                <div className="flex justify-center">
                  <Gauge value={stat.value} label={stat.label} index={index} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ——— Training ——— */}
      {has("services") && (
        <section id="training" className="mx-auto max-w-[80rem] px-5 py-16 @3xl:px-10">
          <h2
            className={`${display} text-[clamp(2.2rem,5cqw,3.8rem)] font-semibold leading-none tracking-[-0.03em]`}
          >
            {label("services", "Training")}
          </h2>
          <div className="mt-10 grid gap-4 @3xl:grid-cols-2">
            {(c.services ?? []).map((service, index) => (
              <Reveal key={index} delay={(index % 2) * 90}>
                <div
                  className={`${card} group flex h-full items-start justify-between gap-6 p-7 transition-transform hover:-translate-y-1`}
                  {...ed(`services.${index}`)}
                >
                  <div>
                    <p className={`${mono} text-[11px] uppercase tracking-[0.18em] text-[var(--t-accent)]`}>
                      {index === 0 ? "Start here" : `Stage ${index}`}
                    </p>
                    <h3 className={`${display} mt-2 text-[1.45rem] font-semibold leading-tight`}>
                      {service.title}
                    </h3>
                    <p className="mt-2 text-[15px] opacity-75">{service.description}</p>
                  </div>
                  <p
                    className={`${mono} shrink-0 text-right text-[1.05rem] font-semibold text-[var(--t-accent)]`}
                  >
                    {service.price}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ——— Lessons in pictures ——— */}
      {has("projects") && (
        <section className="mx-auto max-w-[80rem] px-5 py-16 @3xl:px-10">
          <h2
            className={`${display} text-[clamp(2.2rem,5cqw,3.8rem)] font-semibold leading-none tracking-[-0.03em]`}
          >
            {label("projects", "A lesson, step by step")}
          </h2>
          <div className="mt-10 grid gap-5 @3xl:grid-cols-2 @5xl:grid-cols-4">
            {(c.projects ?? []).map((step, index) => (
              <Reveal key={index} delay={index * 80}>
                <figure className="group" {...ed(`projects.${index}`)}>
                  <div className="relative overflow-hidden rounded-[22px]">
                    <Picture
                      src={step.image}
                      alt={step.title ?? ""}
                      embedded={embedded}
                      className="aspect-[4/5] w-full transition-transform duration-700 group-hover:scale-105"
                    />
                    <span
                      className={`${mono} absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white backdrop-blur`}
                    >
                      {step.category}
                    </span>
                  </div>
                  <figcaption className="mt-4">
                    <p className={`${display} text-[1.2rem] font-semibold leading-tight`}>{step.title}</p>
                    {step.description && <p className="mt-1 text-[14px] opacity-70">{step.description}</p>}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ——— Logbook: ratings, career, education ——— */}
      {(has("highlights") || has("experience") || has("education")) && (
        <section id="logbook" className="mx-auto max-w-[80rem] px-5 py-16 @3xl:px-10">
          <h2
            className={`${display} text-[clamp(2.2rem,5cqw,3.8rem)] font-semibold leading-none tracking-[-0.03em]`}
          >
            Logbook
          </h2>
          <div className={`${card} mt-10 overflow-x-auto`}>
            <table className={`${mono} w-full min-w-[34rem] text-left text-[13px]`}>
              <thead className="uppercase tracking-[0.14em] opacity-60">
                <tr>
                  {["Year", "Entry", "Detail"].map((head) => (
                    <th
                      key={head}
                      className="border-b border-[color-mix(in_oklab,var(--t-fg)_12%,transparent)] px-5 py-3 font-medium"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(c.highlights ?? []).map((item, index) => (
                  <tr
                    key={`h${index}`}
                    className="border-b border-[color-mix(in_oklab,var(--t-fg)_8%,transparent)]"
                    {...ed(`highlights.${index}`)}
                  >
                    <td className="px-5 py-3 text-[var(--t-accent)]">{item.year}</td>
                    <td className="px-5 py-3 font-semibold">{item.title}</td>
                    <td className="px-5 py-3 opacity-70">{item.detail}</td>
                  </tr>
                ))}
                {(c.experience ?? []).map((job, index) => (
                  <tr
                    key={`x${index}`}
                    className="border-b border-[color-mix(in_oklab,var(--t-fg)_8%,transparent)]"
                    {...ed(`experience.${index}`)}
                  >
                    <td className="px-5 py-3 text-[var(--t-accent)]">
                      {[job.start_date, job.end_date].filter(Boolean).join("–")}
                    </td>
                    <td className="px-5 py-3 font-semibold">{job.job_title}</td>
                    <td className="px-5 py-3 opacity-70">{job.company}</td>
                  </tr>
                ))}
                {(c.education ?? []).map((item, index) => (
                  <tr key={`e${index}`} {...ed(`education.${index}`)}>
                    <td className="px-5 py-3 text-[var(--t-accent)]">
                      {[item.start_date, item.end_date].filter(Boolean).join("–")}
                    </td>
                    <td className="px-5 py-3 font-semibold">{item.degree}</td>
                    <td className="px-5 py-3 opacity-70">{item.school}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ——— About and reviews ——— */}
      {(has("about") || has("testimonials")) && (
        <section className="mx-auto grid max-w-[80rem] items-start gap-10 px-5 py-16 @3xl:px-10 @4xl:grid-cols-[18rem_1fr]">
          <div className={`${card} overflow-hidden p-2`} {...ed("avatar")}>
            <Picture
              src={c.avatar}
              alt={c.name ?? ""}
              embedded={embedded}
              prompt="Your photo"
              className="aspect-[4/5] w-full rounded-[18px]"
            />
          </div>
          <div>
            {has("about") && (
              <div className="space-y-4 text-[1.06rem] opacity-90">
                <h2
                  className={`${display} text-[clamp(2rem,4.4cqw,3.2rem)] font-semibold leading-none tracking-[-0.03em]`}
                >
                  {label("about", "From the right-hand seat")}
                </h2>
                {paragraphs(c).map(({ text, index }) => (
                  <p key={index} className="pretty" {...ed(`summary.${index}`)}>
                    {text}
                  </p>
                ))}
              </div>
            )}
            {has("testimonials") && (
              <div className="mt-10 grid gap-4 @3xl:grid-cols-2">
                {(c.testimonials ?? []).map((item, index) => (
                  <figure key={index} className={`${card} p-6`} {...ed(`testimonials.${index}`)}>
                    <blockquote className="leading-snug">“{item.quote}”</blockquote>
                    <figcaption
                      className={`${mono} mt-4 text-[11.5px] uppercase tracking-[0.14em] opacity-60`}
                    >
                      {item.name} · {item.role}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ——— Book ——— */}
      {has("contact") && (
        <section id="book" className="relative isolate overflow-hidden px-5 py-20 text-center @3xl:px-10">
          <div className="absolute inset-0 -z-10">
            <Shader fragment={SKY} colours={colours} speed={0.6} />
          </div>
          <h2
            className={`${display} mx-auto max-w-[42rem] text-[clamp(2.4rem,6cqw,4.6rem)] font-semibold leading-[0.95] tracking-[-0.04em]`}
          >
            Your first flight is <span className="text-[var(--t-accent)]">closer than you think.</span>
          </h2>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a
              href={book}
              {...external(book)}
              className="rounded-2xl bg-[var(--t-accent)] px-7 py-4 font-semibold text-[var(--t-bg)]"
            >
              Book a discovery flight
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
            className={`${mono} mt-6 flex flex-wrap justify-center gap-5 text-[12px] uppercase tracking-[0.14em] opacity-65`}
          >
            {contactLinks(c)
              .filter((link) => !/^(mailto|tel):/.test(link.url))
              .map((link) => (
                <a key={link.url} href={link.url} {...external(link.url)} className="hover:opacity-100">
                  {link.label} ↗
                </a>
              ))}
          </p>
        </section>
      )}
    </StudioRoot>
  );
}

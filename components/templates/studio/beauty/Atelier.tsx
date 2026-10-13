"use client";

import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/manrope";
import "@fontsource-variable/bodoni-moda";
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
import { Shader } from "../shader";

/**
 * Atelier: a beauty artist's studio site. A slow pearl shimmer moves behind
 * everything (a WebGL shader, domain-warped noise with a little iridescence),
 * the work sits in arched frames like a boutique window, looks are numbered
 * like a show, and the menu reads like a salon price card. Made for makeup
 * artists, hair stylists, nail and lash artists, barbers.
 */

/** Domain-warped noise in the palette, with a soft rainbow sheen where it folds. */
const PEARL = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv * vec2(u_res.x / u_res.y, 1.0) * 1.5;
  float t = u_time * 0.05;
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + t * 1.4), fbm(p + 3.0 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p + 3.0 * r + (u_pointer - 0.5) * 0.5);
  vec3 colour = mix(u_a, u_b, smoothstep(0.38, 0.95, f) * 0.55);
  vec3 sheen = 0.5 + 0.5 * cos(6.2831 * (f * 1.4 + vec3(0.0, 0.33, 0.67)) + u_time * 0.15);
  colour = mix(colour, mix(sheen, u_b, 0.55), 0.07 * smoothstep(0.6, 1.1, length(r)));
  colour += 0.07 * pow(f, 3.0);
  colour = mix(colour, u_c, 0.03);
  gl_FragColor = vec4(colour, 1.0);
}
`;

const digits = (phone?: string) => (phone ?? "").replace(/[^\d]/g, "");

export default function Atelier({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label, palette, accent } = studio;
  const phone = digits(c.phone);
  const book = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${firstName(c.name)}, I'd love to book a date.`)}`
    : c.email
      ? `mailto:${c.email}?subject=${encodeURIComponent("Booking enquiry")}`
      : "#book";
  const looks = c.projects ?? [];
  const colours: [string, string, string] = [palette?.bg ?? "#f6efe9", accent, palette?.fg ?? "#1f1714"];
  const serif = "font-[family-name:var(--t-display)]";

  return (
    <StudioRoot studio={studio} className="text-[16px] leading-[1.65]">
      <style>{`
        @keyframes atelier-drift { 50% { transform: translateY(-10px) rotate(-2deg); } }
        @keyframes atelier-marquee { to { transform: translateX(-50%); } }
      `}</style>

      {/* ——— Hero on pearl ——— */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Shader fragment={PEARL} colours={colours} />
        </div>
        <header className="mx-auto flex max-w-[80rem] items-center justify-between px-5 py-6 @3xl:px-10">
          <span className={`${serif} text-[1.5rem] italic`}>{c.name}</span>
          <nav className="flex items-center gap-1 text-[13px]">
            <a href="#looks" className="hidden rounded-full px-3 py-2 hover:bg-white/40 @2xl:inline">
              Looks
            </a>
            <a href="#menu" className="hidden rounded-full px-3 py-2 hover:bg-white/40 @2xl:inline">
              Menu
            </a>
            <a
              href={book}
              {...external(book)}
              className="rounded-full bg-[var(--t-fg)] px-5 py-2.5 font-medium text-[var(--t-bg)] transition-transform hover:-translate-y-0.5"
            >
              Book a date
            </a>
          </nav>
        </header>

        <div className="mx-auto grid max-w-[80rem] items-end gap-12 px-5 pb-20 pt-10 @3xl:px-10 @4xl:grid-cols-[1.15fr_1fr] @4xl:pb-28">
          <div className="order-2 @4xl:order-1">
            <p
              className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[var(--t-accent)]"
              {...ed("professional_title")}
            >
              {c.professional_title}
            </p>
            <h1
              className={`${serif} mt-5 text-[clamp(3.6rem,10.5cqw,9rem)] leading-[0.86] tracking-[-0.02em]`}
              {...ed("name")}
            >
              {firstName(c.name)}
              <span className="block italic text-[var(--t-accent)]">
                {c.name?.split(" ").slice(1).join(" ")}
              </span>
            </h1>
            {c.tagline && (
              <p
                className={`${serif} mt-7 max-w-[30rem] text-[clamp(1.4rem,2.6cqw,1.9rem)] italic leading-snug opacity-85`}
                {...ed("tagline")}
              >
                {c.tagline}
              </p>
            )}
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href={book}
                {...external(book)}
                className="rounded-full bg-[var(--t-accent)] px-7 py-4 font-semibold text-white shadow-[0_18px_40px_-16px_var(--t-accent)] transition-transform hover:-translate-y-0.5"
              >
                Check my dates
              </a>
              {c.availability && (
                <span
                  className="inline-flex items-center gap-2 rounded-full bg-white/55 px-4 py-2.5 text-[13px] shadow-[0_0_0_1px_rgb(255_255_255/0.7)] backdrop-blur-md"
                  {...ed("availability")}
                >
                  <span className="relative flex size-2">
                    <span className="absolute inset-0 animate-ping rounded-full bg-[var(--t-accent)] opacity-60" />
                    <span className="relative size-2 rounded-full bg-[var(--t-accent)]" />
                  </span>
                  {c.availability}
                </span>
              )}
            </div>
          </div>

          {/* The work in an arch, the artist in a circle */}
          <div className="relative order-1 mx-auto w-full max-w-[26rem] @4xl:order-2">
            <div
              className="overflow-hidden rounded-t-[999px] rounded-b-[28px] shadow-[0_0_0_10px_rgb(255_255_255/0.45),0_60px_100px_-50px_rgb(60_20_10/0.55)]"
              {...ed(c.cover ? "cover" : "projects.0")}
            >
              <Picture
                src={c.cover || looks[0]?.image}
                alt=""
                embedded={embedded}
                className="aspect-[3/4] w-full transition-transform duration-[2s] hover:scale-105"
              />
            </div>
            <div
              className="absolute -bottom-6 -left-6 size-28 overflow-hidden rounded-full shadow-[0_0_0_6px_var(--t-bg),0_20px_40px_-14px_rgb(0_0_0/0.45)] @3xl:size-32"
              {...ed("avatar")}
            >
              <Picture
                src={c.avatar}
                alt={c.name ?? ""}
                embedded={embedded}
                prompt="Your photo"
                className="size-full"
              />
            </div>
            {c.stats?.[0] && (
              <div
                className="absolute -right-4 top-10 rounded-full bg-white/70 px-5 py-3 text-center shadow-[0_20px_40px_-18px_rgb(0_0_0/0.4)] backdrop-blur-md [animation:atelier-drift_8s_ease-in-out_infinite]"
                {...ed("stats.0")}
              >
                <p className={`${serif} text-[1.8rem] leading-none`}>{c.stats[0].value}</p>
                <p className="text-[11px] uppercase tracking-[0.18em] opacity-70">{c.stats[0].label}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ——— Specialities ——— */}
      {has("skills") && (
        <div
          className="overflow-hidden border-y border-[color-mix(in_oklab,var(--t-fg)_10%,transparent)] py-5"
          {...ed("skills")}
        >
          <div
            className={`${serif} flex w-max gap-12 whitespace-nowrap text-[1.6rem] italic [animation:atelier-marquee_40s_linear_infinite]`}
          >
            {[...(c.skills ?? []), ...(c.skills ?? [])].map((skill, index) => (
              <span key={index} className="flex items-center gap-12">
                {skill}
                <span className="text-[1rem] not-italic text-[var(--t-accent)]">✦</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ——— Looks ——— */}
      {has("projects") && (
        <section id="looks" className="mx-auto max-w-[80rem] px-5 py-20 @3xl:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className={`${serif} text-[clamp(2.8rem,7cqw,5.4rem)] leading-none`}>
              {label("projects", "The looks")}
            </h2>
            <p className="max-w-[18rem] text-[14px] opacity-70">
              Every face here was done by me, start to finish.
            </p>
          </div>
          <div className="mt-12 grid gap-6 @2xl:grid-cols-2 @4xl:grid-cols-3">
            {looks.map((look, index) => (
              <Reveal
                key={index}
                delay={(index % 3) * 90}
                className={index % 3 === 1 ? "@4xl:translate-y-16" : ""}
              >
                <figure className="group" {...ed(`projects.${index}`)}>
                  <div className="relative overflow-hidden rounded-t-[999px] rounded-b-[22px] bg-[var(--t-surface)]">
                    <Picture
                      src={look.image}
                      alt={look.title ?? ""}
                      embedded={embedded}
                      className="aspect-[3/4] w-full transition-transform duration-[1.4s] ease-[cubic-bezier(.2,.7,.1,1)] group-hover:scale-[1.06]"
                    />
                    <span className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] backdrop-blur">
                      Look {pad(index + 1)}
                    </span>
                  </div>
                  <figcaption className="mt-4 px-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--t-accent)]">
                      {[look.category, look.client].filter(Boolean).join(" · ")}
                    </p>
                    <p className={`${serif} mt-1 text-[1.6rem] leading-tight`}>{look.title}</p>
                    {look.role && <p className="text-[14px] opacity-70">{look.role}</p>}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ——— Numbers ——— */}
      {has("stats") && (
        <section className="mx-auto grid max-w-[80rem] gap-8 px-5 py-16 text-center @3xl:grid-flow-col @3xl:auto-cols-fr @3xl:px-10">
          {(c.stats ?? []).map((stat, index) => (
            <div key={index} {...ed(`stats.${index}`)}>
              <p
                className={`${serif} text-[clamp(3.4rem,8cqw,6rem)] italic leading-none text-[var(--t-accent)]`}
              >
                <CountUp value={stat.value} />
              </p>
              <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.24em] opacity-70">
                {stat.label}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* ——— The menu, on pearl ——— */}
      {has("services") && (
        <section id="menu" className="relative isolate overflow-hidden px-5 py-24 @3xl:px-10">
          <div className="absolute inset-0 -z-10 opacity-90">
            <Shader fragment={PEARL} colours={colours} speed={0.6} />
          </div>
          <div className="mx-auto max-w-[46rem] rounded-[36px] bg-white/55 p-8 shadow-[0_0_0_1px_rgb(255_255_255/0.8),0_50px_100px_-50px_rgb(60_20_10/0.45)] backdrop-blur-xl @3xl:p-14">
            <p className="text-center text-[12px] font-semibold uppercase tracking-[0.3em] text-[var(--t-accent)]">
              Menu
            </p>
            <h2 className={`${serif} mt-3 text-center text-[clamp(2.4rem,6cqw,4rem)] leading-none`}>
              {label("services", "Prices & bookings")}
            </h2>
            <ul className="mt-10 space-y-7">
              {(c.services ?? []).map((service, index) => (
                <li key={index} {...ed(`services.${index}`)}>
                  <p className="flex items-baseline gap-3">
                    <span className={`${serif} text-[1.5rem] leading-tight`}>{service.title}</span>
                    <span
                      aria-hidden
                      className="mb-1.5 flex-1 border-b border-dotted border-[color-mix(in_oklab,var(--t-fg)_35%,transparent)]"
                    />
                    <span className={`${serif} shrink-0 text-[1.4rem] italic text-[var(--t-accent)]`}>
                      {service.price}
                    </span>
                  </p>
                  {service.description && (
                    <p className="mt-1 text-[14.5px] opacity-70">{service.description}</p>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-10 text-center">
              <a
                href={book}
                {...external(book)}
                className="inline-block rounded-full bg-[var(--t-fg)] px-8 py-4 font-semibold text-[var(--t-bg)] transition-transform hover:-translate-y-0.5"
              >
                Book on WhatsApp
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ——— Kind words ——— */}
      {has("testimonials") && (
        <section className="mx-auto grid max-w-[80rem] gap-10 px-5 py-20 @3xl:grid-cols-2 @3xl:px-10">
          {(c.testimonials ?? []).map((item, index) => (
            <Reveal key={index} delay={index * 100}>
              <figure {...ed(`testimonials.${index}`)}>
                <blockquote className={`${serif} text-[clamp(1.7rem,3.4cqw,2.5rem)] italic leading-[1.15]`}>
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-5 text-[13px] font-semibold uppercase tracking-[0.2em] opacity-70">
                  {item.name} · {item.role}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </section>
      )}

      {/* ——— About ——— */}
      {(has("about") || has("experience") || has("highlights") || has("education")) && (
        <section className="mx-auto grid max-w-[80rem] items-start gap-12 px-5 py-20 @3xl:px-10 @4xl:grid-cols-[22rem_1fr]">
          <div className="overflow-hidden rounded-t-[999px] rounded-b-[24px]" {...ed("avatar")}>
            <Picture
              src={c.avatar}
              alt={c.name ?? ""}
              embedded={embedded}
              prompt="Your photo"
              className="aspect-[4/5] w-full"
            />
          </div>
          <div>
            {has("about") && (
              <>
                <h2 className={`${serif} text-[clamp(2.4rem,5cqw,3.6rem)] leading-none`}>
                  {label("about", `Hello, I’m ${firstName(c.name)}`)}
                </h2>
                <div className="mt-6 space-y-4 text-[1.08rem]">
                  {paragraphs(c).map(({ text, index }) => (
                    <p key={index} className="pretty" {...ed(`summary.${index}`)}>
                      {text}
                    </p>
                  ))}
                </div>
              </>
            )}
            <div className="mt-10 grid gap-8 @3xl:grid-cols-2">
              {has("experience") && (
                <ul className="space-y-3">
                  {(c.experience ?? []).map((job, index) => (
                    <li key={index} {...ed(`experience.${index}`)}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--t-accent)]">
                        {[job.start_date, job.end_date].filter(Boolean).join(" – ")}
                      </p>
                      <p className={`${serif} text-[1.3rem] leading-tight`}>{job.job_title}</p>
                      <p className="text-[14px] opacity-70">{job.company}</p>
                    </li>
                  ))}
                </ul>
              )}
              <ul className="space-y-3">
                {has("highlights") &&
                  (c.highlights ?? []).map((item, index) => (
                    <li key={`h${index}`} {...ed(`highlights.${index}`)}>
                      <p className={`${serif} text-[1.3rem] italic leading-tight`}>{item.title}</p>
                      <p className="text-[14px] opacity-70">
                        {[item.detail, item.year].filter(Boolean).join(" · ")}
                      </p>
                    </li>
                  ))}
                {has("education") &&
                  (c.education ?? []).map((item, index) => (
                    <li key={`e${index}`} {...ed(`education.${index}`)}>
                      <p className={`${serif} text-[1.3rem] leading-tight`}>{item.degree}</p>
                      <p className="text-[14px] opacity-70">{item.school}</p>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* ——— Book ——— */}
      {has("contact") && (
        <section id="book" className="px-5 pb-12 @3xl:px-10">
          <div className="relative isolate mx-auto max-w-[80rem] overflow-hidden rounded-t-[400px] rounded-b-[40px] px-7 pb-16 pt-28 text-center @3xl:pt-36">
            <div className="absolute inset-0 -z-10">
              <Shader fragment={PEARL} colours={colours} speed={0.8} />
            </div>
            <h2 className={`${serif} mx-auto max-w-[44rem] text-[clamp(2.8rem,7.5cqw,6rem)] leading-[0.92]`}>
              Your day, <span className="italic text-[var(--t-accent)]">your face.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-[30rem] opacity-80">
              Send your date and venue; I’ll reply with availability and a quote the same day.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <a
                href={book}
                {...external(book)}
                className="rounded-full bg-[var(--t-fg)] px-8 py-4 font-semibold text-[var(--t-bg)] transition-transform hover:-translate-y-0.5"
              >
                Book a date
              </a>
              {c.email && (
                <a
                  href={`mailto:${c.email}`}
                  className="rounded-full bg-white/60 px-8 py-4 font-semibold backdrop-blur"
                  {...ed("email")}
                >
                  {c.email}
                </a>
              )}
            </div>
            <p className="mt-8 flex flex-wrap justify-center gap-6 text-[14px] opacity-75">
              {contactLinks(c)
                .filter((link) => !/^(mailto|tel):/.test(link.url))
                .map((link) => (
                  <a key={link.url} href={link.url} {...external(link.url)} className="hover:opacity-100">
                    {link.label}
                  </a>
                ))}
            </p>
          </div>
        </section>
      )}
    </StudioRoot>
  );
}

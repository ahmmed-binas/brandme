"use client";

import "@fontsource-variable/unbounded";
import "@fontsource-variable/manrope";
import "@fontsource-variable/space-grotesk";
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
import { Shader } from "../shader";

/**
 * Radar: a recruiter's site. The recruiter sits at the centre of a live radar
 * (a WebGL sweep with rings and blips that light up as it passes) with the
 * fields they hire in orbiting around them. Below: numbers, searches closed,
 * two doors (hiring / looking), prices and a career line. For recruiters,
 * talent partners and HR leads.
 */

/** Rings, a cross, a rotating sweep with a fading tail, and blips that flash as it passes. */
const SWEEP = `
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
  float r = length(uv);
  float a = atan(uv.y, uv.x);
  vec3 colour = u_a;
  float inside = 1.0 - smoothstep(0.47, 0.5, r);
  float ring = smoothstep(0.455, 0.5, abs(fract(r * 6.0) - 0.5)) * inside;
  float cross = smoothstep(0.0025, 0.0, min(abs(uv.x), abs(uv.y))) * inside;
  float turn = u_time * 0.8;
  float behind = mod(turn - a, 6.2831);
  float sweep = exp(-behind * 2.4) * inside;
  float blips = 0.0;
  for (int i = 0; i < 10; i++) {
    float f = float(i);
    float angle = hash(vec2(f, 1.0)) * 6.2831;
    vec2 at = vec2(cos(angle), sin(angle)) * (0.12 + 0.33 * hash(vec2(f, 2.0)));
    float since = mod(turn - angle, 6.2831);
    blips += smoothstep(0.016, 0.0, length(uv - at)) * (0.25 + 1.6 * exp(-since * 1.4));
  }
  colour = mix(colour, u_b, ring * 0.22 + cross * 0.12);
  colour = mix(colour, u_b, sweep * 0.38);
  colour += u_b * blips * inside;
  colour = mix(colour, u_b, 0.05 * smoothstep(0.5, 0.0, r));
  gl_FragColor = vec4(colour, 1.0);
}
`;

/** Where the orbiting labels sit around the radar (percent of its box). */
const ORBIT = [
  { left: "6%", top: "18%" },
  { left: "74%", top: "12%" },
  { left: "86%", top: "52%" },
  { left: "70%", top: "86%" },
  { left: "4%", top: "78%" },
  { left: "-2%", top: "48%" },
];

const digits = (phone?: string) => (phone ?? "").replace(/[^\d]/g, "");

export default function Radar({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label, palette, accent } = studio;
  const colours: [string, string, string] = [palette?.bg ?? "#070b0d", accent, palette?.fg ?? "#e7f3ef"];
  const display = "font-[family-name:var(--t-display)]";
  const mono = "font-[family-name:var(--t-mono)]";
  const panel =
    "rounded-[26px] bg-[var(--t-surface)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_9%,transparent),0_30px_60px_-40px_rgb(0_0_0/0.6)]";
  const phone = digits(c.phone);
  const email = c.email ? `mailto:${c.email}` : undefined;
  const hire = email
    ? `${email}?subject=${encodeURIComponent("Hiring brief")}`
    : phone
      ? `https://wa.me/${phone}`
      : undefined;
  const apply = email ? `${email}?subject=${encodeURIComponent("Looking for my next role")}` : hire;

  return (
    <StudioRoot studio={studio} className="text-[16px] leading-[1.6]">
      <style>{`@keyframes radar-bob { 50% { transform: translateY(-6px); } }`}</style>

      {/* ——— Hero: the recruiter at the centre of the radar ——— */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_75%_40%,color-mix(in_oklab,var(--t-accent)_12%,transparent),transparent_70%)]"
        />
        <header className="mx-auto flex max-w-[78rem] items-center justify-between gap-4 px-5 py-6 @3xl:px-10">
          <span className={`${display} text-[0.95rem] font-medium tracking-[0.02em]`}>{c.name}</span>
          <nav className="flex items-center gap-2 text-[13px]">
            <a
              href="#searches"
              className="hidden rounded-full px-3 py-2 opacity-70 hover:opacity-100 @2xl:inline"
            >
              Searches
            </a>
            <a
              href="#doors"
              className="hidden rounded-full px-3 py-2 opacity-70 hover:opacity-100 @2xl:inline"
            >
              Work with me
            </a>
            {hire && (
              <a
                href={hire}
                {...external(hire)}
                className="rounded-full bg-[var(--t-accent)] px-4 py-2 font-semibold text-[var(--t-bg)] shadow-[0_0_24px_-6px_var(--t-accent)]"
              >
                Hire with me
              </a>
            )}
          </nav>
        </header>

        <div className="mx-auto grid max-w-[78rem] items-center gap-10 px-5 pb-20 pt-6 @3xl:px-10 @4xl:grid-cols-[1.1fr_1fr]">
          <div>
            {c.availability && (
              <p
                className={`${mono} inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--t-accent)_45%,transparent)]`}
                {...ed("availability")}
              >
                <span className="size-2 animate-pulse rounded-full bg-[var(--t-accent)]" />
                {c.availability}
              </p>
            )}
            <h1
              className={`${display} mt-7 text-[clamp(2.6rem,7cqw,5.4rem)] font-semibold leading-[0.95] tracking-[-0.03em]`}
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
                className="mt-6 max-w-[34rem] text-[clamp(1.25rem,2.4cqw,1.6rem)] font-medium leading-snug"
                {...ed("tagline")}
              >
                {c.tagline}
              </p>
            )}
            <div className="mt-9 flex flex-wrap gap-3">
              {hire && (
                <a
                  href={hire}
                  {...external(hire)}
                  className="rounded-2xl bg-[var(--t-accent)] px-6 py-4 font-semibold text-[var(--t-bg)] shadow-[0_18px_40px_-16px_var(--t-accent)] transition-transform hover:-translate-y-0.5"
                >
                  I’m hiring →
                </a>
              )}
              {apply && (
                <a
                  href={apply}
                  {...external(apply)}
                  className="rounded-2xl px-6 py-4 font-semibold shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--t-fg)_30%,transparent)] hover:shadow-[inset_0_0_0_1.5px_var(--t-fg)]"
                >
                  I’m looking for a role
                </a>
              )}
            </div>
            {c.location && (
              <p
                className={`${mono} mt-6 text-[12px] uppercase tracking-[0.16em] opacity-55`}
                {...ed("location")}
              >
                {c.location}
              </p>
            )}
          </div>

          {/* Radar */}
          <div className="relative mx-auto aspect-square w-full max-w-[34rem]">
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <Shader fragment={SWEEP} colours={colours} />
            </div>
            <div
              className="absolute left-1/2 top-1/2 size-[34%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full shadow-[0_0_0_4px_var(--t-bg),0_0_0_5px_var(--t-accent),0_0_60px_-6px_var(--t-accent)]"
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
            {has("skills") &&
              (c.skills ?? []).slice(0, ORBIT.length).map((skill, index) => (
                <span
                  key={skill}
                  className={`${mono} absolute whitespace-nowrap rounded-full bg-[color-mix(in_oklab,var(--t-bg)_70%,transparent)] px-3 py-1.5 text-[11.5px] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--t-accent)_40%,transparent)] backdrop-blur [animation:radar-bob_6s_ease-in-out_infinite]`}
                  style={{ ...ORBIT[index], animationDelay: `${-index}s` }}
                  {...ed("skills")}
                >
                  <span className="mr-1.5 inline-block size-1.5 rounded-full bg-[var(--t-accent)]" />
                  {skill}
                </span>
              ))}
          </div>
        </div>
      </section>

      {/* ——— Numbers ——— */}
      {has("stats") && (
        <section className="mx-auto grid max-w-[78rem] gap-4 px-5 py-12 @3xl:grid-flow-col @3xl:auto-cols-fr @3xl:px-10">
          {(c.stats ?? []).map((stat, index) => (
            <Reveal key={index} delay={index * 90}>
              <div className={`${panel} p-7`} {...ed(`stats.${index}`)}>
                <p
                  className={`${display} text-[clamp(2.4rem,5.4cqw,3.6rem)] font-semibold leading-none tracking-[-0.03em] text-[var(--t-accent)]`}
                >
                  <CountUp value={stat.value} />
                </p>
                <p className={`${mono} mt-3 text-[12px] uppercase tracking-[0.14em] opacity-65`}>
                  {stat.label}
                </p>
              </div>
            </Reveal>
          ))}
        </section>
      )}

      {/* ——— Searches closed ——— */}
      {has("projects") && (
        <section id="searches" className="mx-auto max-w-[78rem] px-5 py-16 @3xl:px-10">
          <h2
            className={`${display} text-[clamp(2rem,5cqw,3.4rem)] font-semibold leading-none tracking-[-0.03em]`}
          >
            {label("projects", "Searches closed")}
          </h2>
          <div className="mt-10 grid gap-5 @3xl:grid-cols-3">
            {(c.projects ?? []).map((search, index) => (
              <Reveal key={index} delay={index * 90}>
                <article className={`${panel} group h-full overflow-hidden`} {...ed(`projects.${index}`)}>
                  <div className="relative overflow-hidden">
                    <Picture
                      src={search.image}
                      alt={search.title ?? ""}
                      embedded={embedded}
                      className="aspect-[4/3] w-full transition-transform duration-[1.2s] group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,var(--t-surface))]" />
                    {search.category && (
                      <span
                        className={`${mono} absolute bottom-3 left-4 rounded-full bg-[var(--t-accent)] px-3 py-1 text-[11.5px] font-semibold text-[var(--t-bg)]`}
                      >
                        {search.category}
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <p className={`${mono} text-[11px] uppercase tracking-[0.14em] opacity-55`}>
                      {pad(index + 1)} · {[search.client, search.year].filter(Boolean).join(" · ")}
                    </p>
                    <h3 className={`${display} mt-2 text-[1.25rem] font-semibold leading-tight`}>
                      {search.title}
                    </h3>
                    {search.role && <p className="text-[14px] text-[var(--t-accent)]">{search.role}</p>}
                    {search.description && (
                      <p className="mt-3 text-[14.5px] opacity-75">{search.description}</p>
                    )}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ——— Two doors ——— */}
      <section id="doors" className="mx-auto grid max-w-[78rem] gap-5 px-5 py-12 @3xl:grid-cols-2 @3xl:px-10">
        <div className={`${panel} relative overflow-hidden p-8 @3xl:p-10`}>
          <div
            aria-hidden
            className="absolute -right-20 -top-20 size-64 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--t-accent)_30%,transparent),transparent)]"
          />
          <p className={`${mono} text-[12px] uppercase tracking-[0.18em] text-[var(--t-accent)]`}>
            For companies
          </p>
          <h2
            className={`${display} mt-3 text-[clamp(1.7rem,3.6cqw,2.4rem)] font-semibold leading-tight tracking-[-0.02em]`}
          >
            Hiring someone who’ll stay?
          </h2>
          {has("services") && (
            <ul className="mt-6 space-y-4">
              {(c.services ?? []).map((service, index) => (
                <li
                  key={index}
                  className="flex items-baseline justify-between gap-4 border-b border-[color-mix(in_oklab,var(--t-fg)_10%,transparent)] pb-3"
                  {...ed(`services.${index}`)}
                >
                  <span>
                    <b className="font-semibold">{service.title}</b>
                    <span className="block text-[14px] opacity-65">{service.description}</span>
                  </span>
                  <span className={`${mono} shrink-0 text-right text-[13px] text-[var(--t-accent)]`}>
                    {service.price}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {hire && (
            <a
              href={hire}
              {...external(hire)}
              className="mt-7 inline-block rounded-2xl bg-[var(--t-accent)] px-6 py-3.5 font-semibold text-[var(--t-bg)]"
            >
              Send me the brief
            </a>
          )}
        </div>
        <div className={`${panel} relative overflow-hidden p-8 @3xl:p-10`}>
          <p className={`${mono} text-[12px] uppercase tracking-[0.18em] text-[var(--t-accent)]`}>
            For candidates
          </p>
          <h2
            className={`${display} mt-3 text-[clamp(1.7rem,3.6cqw,2.4rem)] font-semibold leading-tight tracking-[-0.02em]`}
          >
            Looking for your next role?
          </h2>
          <p className="mt-4 opacity-75">
            Send your CV and what you want next. You’ll hear back within 48 hours, even if it’s a no, with
            honest feedback.
          </p>
          {apply && (
            <a
              href={apply}
              {...external(apply)}
              className="mt-7 inline-block rounded-2xl px-6 py-3.5 font-semibold shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--t-fg)_30%,transparent)] hover:shadow-[inset_0_0_0_1.5px_var(--t-fg)]"
            >
              Send my CV
            </a>
          )}
          {c.cover && (
            <div className="mt-8 overflow-hidden rounded-2xl" {...ed("cover")}>
              <Picture src={c.cover} alt="" embedded={embedded} className="aspect-[16/8] w-full" />
            </div>
          )}
        </div>
      </section>

      {/* ——— Kind words ——— */}
      {has("testimonials") && (
        <section className="mx-auto grid max-w-[78rem] gap-5 px-5 py-12 @3xl:grid-cols-2 @3xl:px-10">
          {(c.testimonials ?? []).map((item, index) => (
            <Reveal key={index} delay={index * 90}>
              <figure className={`${panel} h-full p-8`} {...ed(`testimonials.${index}`)}>
                <blockquote className={`${display} text-[1.25rem] font-medium leading-snug`}>
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-5 text-[14px]">
                  <b className="font-semibold">{item.name}</b>
                  <span className="opacity-60"> · {item.role}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </section>
      )}

      {/* ——— About and career ——— */}
      {(has("about") || has("experience") || has("education")) && (
        <section className="mx-auto grid max-w-[78rem] gap-12 px-5 py-16 @3xl:px-10 @4xl:grid-cols-[1.3fr_1fr]">
          {has("about") && (
            <div>
              <h2
                className={`${display} text-[clamp(1.8rem,4.2cqw,2.8rem)] font-semibold tracking-[-0.03em]`}
              >
                {label("about", `How ${firstName(c.name)} works`)}
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
          <div className="space-y-6">
            {has("experience") && (
              <ol className="space-y-4 border-l border-[color-mix(in_oklab,var(--t-accent)_40%,transparent)] pl-6">
                {(c.experience ?? []).map((job, index) => (
                  <li key={index} className="relative" {...ed(`experience.${index}`)}>
                    <span className="absolute -left-[29px] top-1.5 size-2.5 rounded-full bg-[var(--t-accent)] shadow-[0_0_12px_var(--t-accent)]" />
                    <p className={`${mono} text-[11px] uppercase tracking-[0.14em] opacity-60`}>
                      {[job.start_date, job.end_date].filter(Boolean).join(" – ")}
                    </p>
                    <p className="font-semibold">{job.job_title}</p>
                    <p className="text-[14px] opacity-70">{job.company}</p>
                  </li>
                ))}
              </ol>
            )}
            {has("education") && (
              <ul className="space-y-2 text-[14px]">
                {(c.education ?? []).map((item, index) => (
                  <li key={index} {...ed(`education.${index}`)}>
                    <b className="font-semibold">{item.degree}</b>
                    <span className="block opacity-60">{item.school}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {has("contact") && (
        <footer className="mx-auto flex max-w-[78rem] flex-wrap items-center justify-between gap-6 border-t border-[color-mix(in_oklab,var(--t-fg)_10%,transparent)] px-5 py-10 @3xl:px-10">
          <a
            href={email ?? "#"}
            className={`${display} text-[clamp(1.4rem,3.4cqw,2.2rem)] font-semibold hover:text-[var(--t-accent)]`}
            {...ed("email")}
          >
            {c.email}
          </a>
          <p className="flex flex-wrap gap-5 text-[14px] opacity-75">
            {contactLinks(c)
              .filter((link) => !link.url.startsWith("mailto:"))
              .map((link) => (
                <a key={link.url} href={link.url} {...external(link.url)} className="hover:opacity-100">
                  {link.label} ↗
                </a>
              ))}
          </p>
        </footer>
      )}
    </StudioRoot>
  );
}

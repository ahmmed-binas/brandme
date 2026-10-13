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
  initials,
  pad,
  paragraphs,
  useStudio,
  type StudioProps,
} from "../kit";
import { CountUp } from "../motion";
import { Shader } from "../shader";

/**
 * Dispatch: a field engineer's site from a few years ahead. Live current runs
 * behind the hero (a WebGL shader in the palette's accent), the engineer's
 * photo carries floating status cards, prices sit on a board with a moving
 * edge, jobs read like a dispatch log and licences shimmer like holograms.
 * Built for electricians, AC engineers, plumbers and handymen; the WhatsApp and
 * call buttons are always one tap away.
 */

/** Six strands of current drifting across a faint grid; they lean towards the pointer. */
const CURRENT = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec3 colour = u_a;
  float glow = 0.0;
  for (int i = 0; i < 6; i++) {
    float f = float(i);
    float y = 0.18 + f * 0.13 + (fbm(vec2(uv.x * 1.6 * aspect + u_time * 0.22 + f * 3.1, f)) - 0.5) * 0.34;
    y += (u_pointer.y - 0.5) * 0.1 * sin(uv.x * 3.1416);
    float d = abs(uv.y - y);
    float spark = 0.4 + 0.6 * noise(vec2(uv.x * 9.0 - u_time * 2.4, f * 7.0));
    glow += 0.0018 / (d + 0.0018) * spark;
  }
  colour = mix(colour, u_b, clamp(glow * 0.5, 0.0, 1.0));
  colour += u_b * pow(glow, 2.0) * 0.08;
  vec2 cell = abs(fract(uv * vec2(aspect, 1.0) * 14.0) - 0.5);
  colour = mix(colour, u_c, smoothstep(0.485, 0.5, max(cell.x, cell.y)) * 0.05);
  colour *= 1.0 - 0.32 * length(uv - vec2(0.5, 0.55));
  gl_FragColor = vec4(colour, 1.0);
}
`;

const digits = (phone?: string) => (phone ?? "").replace(/[^\d]/g, "");

/** Glass card floating over the photo. */
function Float({
  className,
  children,
  edit,
}: {
  className: string;
  children: React.ReactNode;
  edit?: string;
}) {
  return (
    <div
      className={`absolute rounded-2xl bg-[color-mix(in_oklab,var(--t-bg)_62%,transparent)] px-4 py-3 shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_14%,transparent),0_20px_40px_-18px_rgb(0_0_0/0.6)] backdrop-blur-xl [animation:dispatch-float_7s_ease-in-out_infinite] ${className}`}
      {...(edit ? ed(edit) : {})}
    >
      {children}
    </div>
  );
}

export default function Dispatch({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label, palette, accent } = studio;
  const phone = digits(c.phone);
  const whatsapp = phone ? `https://wa.me/${phone}` : undefined;
  const stats = c.stats ?? [];
  const credentials = c.highlights ?? [];
  const colours: [string, string, string] = [palette?.bg ?? "#0b0d10", accent, palette?.fg ?? "#ffffff"];

  return (
    <StudioRoot studio={studio} className="font-[family-name:var(--t-text)] text-[16px] leading-[1.6]">
      <style>{`
        @keyframes dispatch-float { 50% { transform: translateY(-8px); } }
        @keyframes dispatch-scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(560%); } }
        @keyframes dispatch-marquee { to { transform: translateX(-50%); } }
        @keyframes dispatch-spin { to { --dispatch-angle: 360deg; } }
        @keyframes dispatch-sheen { from { background-position: 0% 50%; } to { background-position: 200% 50%; } }
        @property --dispatch-angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
        .dispatch-edge { border: 1px solid transparent; background:
          linear-gradient(var(--t-surface), var(--t-surface)) padding-box,
          conic-gradient(from var(--dispatch-angle), transparent 0 55%, var(--t-accent) 70%, transparent 85%) border-box,
          linear-gradient(color-mix(in oklab, var(--t-fg) 12%, transparent), color-mix(in oklab, var(--t-fg) 12%, transparent)) border-box; }
        .dispatch-edge:hover { animation: dispatch-spin 2.4s linear infinite; }
      `}</style>

      {/* ——— Hero over live current ——— */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Shader fragment={CURRENT} colours={colours} />
        </div>
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-[linear-gradient(transparent,var(--t-bg))]" />

        <header className="mx-auto flex max-w-[78rem] items-center justify-between gap-4 px-5 py-5 @3xl:px-10">
          <span className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--t-accent)] font-[family-name:var(--t-display)] text-[14px] font-bold text-[var(--t-bg)] shadow-[0_0_24px_-4px_var(--t-accent)]">
              {initials(c.name)}
            </span>
            <span className="hidden text-[14px] font-semibold @2xl:inline">{c.name}</span>
          </span>
          <nav className="flex items-center gap-2 text-[13px]">
            <a
              href="#prices"
              className="hidden rounded-full px-3 py-2 opacity-80 hover:opacity-100 @3xl:inline"
            >
              Prices
            </a>
            <a
              href="#jobs"
              className="hidden rounded-full px-3 py-2 opacity-80 hover:opacity-100 @3xl:inline"
            >
              Recent jobs
            </a>
            {c.phone && (
              <a
                href={`tel:${phone}`}
                className="rounded-full bg-[color-mix(in_oklab,var(--t-fg)_10%,transparent)] px-4 py-2 font-semibold backdrop-blur hover:bg-[color-mix(in_oklab,var(--t-fg)_16%,transparent)]"
              >
                Call
              </a>
            )}
          </nav>
        </header>

        <div className="mx-auto grid max-w-[78rem] items-center gap-12 px-5 pb-20 pt-8 @3xl:px-10 @4xl:grid-cols-[1.1fr_1fr] @4xl:pb-28 @4xl:pt-14">
          <div>
            {c.availability && (
              <p
                className="inline-flex items-center gap-2.5 rounded-full bg-[color-mix(in_oklab,var(--t-accent)_14%,transparent)] px-3.5 py-1.5 font-[family-name:var(--t-mono)] text-[12px] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--t-accent)_45%,transparent)]"
                {...ed("availability")}
              >
                <span className="relative flex size-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[var(--t-accent)] opacity-70" />
                  <span className="relative size-2 rounded-full bg-[var(--t-accent)]" />
                </span>
                {c.availability}
              </p>
            )}
            <h1
              className="mt-7 font-[family-name:var(--t-display)] text-[clamp(3rem,8.4cqw,6.6rem)] font-semibold leading-[0.9] tracking-[-0.045em]"
              {...ed("name")}
            >
              {c.name}
            </h1>
            <p
              className="mt-4 font-[family-name:var(--t-display)] text-[clamp(1.2rem,2.4cqw,1.7rem)] font-medium text-[var(--t-accent)]"
              {...ed("professional_title")}
            >
              {c.professional_title}
            </p>
            {c.tagline && (
              <p className="mt-5 max-w-[34rem] text-[1.15rem] leading-snug opacity-80" {...ed("tagline")}>
                {c.tagline}
              </p>
            )}
            <div className="mt-9 flex flex-wrap gap-3" {...ed("phone")}>
              {whatsapp && (
                <a
                  href={whatsapp}
                  {...external(whatsapp)}
                  className="group inline-flex items-center gap-2.5 rounded-2xl bg-[var(--t-accent)] px-6 py-4 font-[family-name:var(--t-display)] text-[1.05rem] font-semibold text-[var(--t-bg)] shadow-[0_18px_40px_-14px_var(--t-accent)] transition-transform hover:-translate-y-0.5"
                >
                  WhatsApp for a price
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </a>
              )}
              {c.phone && (
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center rounded-2xl px-6 py-4 font-[family-name:var(--t-mono)] text-[1rem] shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--t-fg)_30%,transparent)] hover:shadow-[inset_0_0_0_1.5px_var(--t-fg)]"
                >
                  {c.phone}
                </a>
              )}
            </div>
            {c.location && (
              <p
                className="mt-6 font-[family-name:var(--t-mono)] text-[12px] uppercase tracking-[0.16em] opacity-60"
                {...ed("location")}
              >
                Covering {c.location}
              </p>
            )}
          </div>

          {/* The engineer, with live status cards */}
          <div className="relative mx-auto w-full max-w-[30rem]">
            {/* Accent light behind the photo */}
            <div
              aria-hidden
              className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--t-accent)_38%,transparent),transparent)] blur-2xl"
            />
            <div
              className="relative overflow-hidden rounded-[30px] shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_12%,transparent),0_50px_90px_-40px_rgb(0_0_0/0.8)]"
              {...ed("avatar")}
            >
              <Picture
                src={c.avatar}
                alt={c.name ?? ""}
                embedded={embedded}
                prompt="Add your photo"
                className="aspect-[4/5] w-full scale-[1.02]"
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,color-mix(in_oklab,var(--t-bg)_70%,transparent))]" />
              <div className="pointer-events-none absolute inset-0 mix-blend-overlay [background:radial-gradient(70%_50%_at_80%_10%,color-mix(in_oklab,var(--t-accent)_45%,transparent),transparent)]" />
              {/* HUD: corner brackets and a slow scan line */}
              <div aria-hidden className="pointer-events-none absolute inset-4">
                {[
                  "left-0 top-0 border-l-2 border-t-2",
                  "right-0 top-0 border-r-2 border-t-2",
                  "bottom-0 left-0 border-b-2 border-l-2",
                  "bottom-0 right-0 border-b-2 border-r-2",
                ].map((corner) => (
                  <span key={corner} className={`absolute size-6 border-[var(--t-accent)] ${corner}`} />
                ))}
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,transparent,color-mix(in_oklab,var(--t-accent)_22%,transparent)_85%,var(--t-accent))] opacity-60 mix-blend-screen [animation:dispatch-scan_5.5s_cubic-bezier(.45,0,.55,1)_infinite]"
              />
            </div>
            {stats[1] && (
              <Float className="-left-4 top-8 @3xl:-left-10" edit="stats.1">
                <p className="font-[family-name:var(--t-mono)] text-[10px] uppercase tracking-[0.18em] opacity-70">
                  {stats[1].label}
                </p>
                <p className="font-[family-name:var(--t-display)] text-[1.7rem] font-semibold leading-none text-[var(--t-accent)]">
                  {stats[1].value}
                </p>
              </Float>
            )}
            {credentials[0] && (
              <Float className="-right-3 bottom-24 [animation-delay:-3s] @3xl:-right-8" edit="highlights.0">
                <p className="flex items-center gap-2 text-[13px] font-semibold">
                  <span className="grid size-6 place-items-center rounded-full bg-[var(--t-accent)] text-[11px] text-[var(--t-bg)]">
                    ✓
                  </span>
                  {credentials[0].title}
                </p>
              </Float>
            )}
            {stats[0] && (
              <Float className="bottom-6 left-6 [animation-delay:-5s]" edit="stats.0">
                <p className="font-[family-name:var(--t-display)] text-[1.4rem] font-semibold leading-none">
                  {stats[0].value}
                </p>
                <p className="text-[12px] opacity-70">{stats[0].label}</p>
              </Float>
            )}
          </div>
        </div>
      </section>

      {/* ——— Areas, scrolling past ——— */}
      {has("skills") && (
        <div
          className="overflow-hidden border-y border-[color-mix(in_oklab,var(--t-fg)_10%,transparent)] py-4"
          {...ed("skills")}
        >
          <div className="flex w-max gap-10 whitespace-nowrap font-[family-name:var(--t-display)] text-[1.15rem] [animation:dispatch-marquee_36s_linear_infinite]">
            {[...(c.skills ?? []), ...(c.skills ?? [])].map((area, index) => (
              <span key={index} className="flex items-center gap-10 opacity-80">
                {area}
                <span className="size-1.5 rounded-full bg-[var(--t-accent)]" />
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ——— Numbers ——— */}
      {has("stats") && (
        <section className="mx-auto grid max-w-[78rem] gap-4 px-5 py-16 @3xl:grid-flow-col @3xl:auto-cols-fr @3xl:px-10">
          {stats.map((stat, index) => (
            <Reveal key={index} delay={index * 90}>
              <div
                className="rounded-3xl bg-[var(--t-surface)] p-7 shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_8%,transparent)]"
                {...ed(`stats.${index}`)}
              >
                <p className="font-[family-name:var(--t-display)] text-[clamp(2.6rem,6cqw,4rem)] font-semibold leading-none tracking-[-0.04em]">
                  <CountUp value={stat.value} />
                </p>
                <div className="mt-4 h-px bg-[linear-gradient(90deg,var(--t-accent),transparent)]" />
                <p className="mt-3 font-[family-name:var(--t-mono)] text-[12px] uppercase tracking-[0.14em] opacity-70">
                  {stat.label}
                </p>
              </div>
            </Reveal>
          ))}
        </section>
      )}

      {/* ——— Price board ——— */}
      {has("services") && (
        <section id="prices" className="mx-auto max-w-[78rem] px-5 py-16 @3xl:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-[family-name:var(--t-display)] text-[clamp(2.2rem,5cqw,3.6rem)] font-semibold leading-none tracking-[-0.035em]">
              {label("services", "Prices, up front")}
            </h2>
            <p className="font-[family-name:var(--t-mono)] text-[12px] uppercase tracking-[0.16em] opacity-60">
              Fixed quote before we start
            </p>
          </div>
          <div className="mt-10 grid gap-4 @3xl:grid-cols-2">
            {(c.services ?? []).map((service, index) => (
              <Reveal key={index} delay={(index % 2) * 90}>
                <div
                  className="dispatch-edge group relative h-full overflow-hidden rounded-3xl p-7"
                  {...ed(`services.${index}`)}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="font-[family-name:var(--t-mono)] text-[11px] opacity-50">
                        {pad(index + 1)}
                      </p>
                      <h3 className="mt-2 font-[family-name:var(--t-display)] text-[1.4rem] font-semibold leading-tight">
                        {service.title}
                      </h3>
                      <p className="mt-2 text-[15px] opacity-70">{service.description}</p>
                    </div>
                    <p className="shrink-0 text-right font-[family-name:var(--t-display)] text-[1.6rem] font-semibold leading-none text-[var(--t-accent)]">
                      {service.price}
                    </p>
                  </div>
                  {whatsapp && (
                    <a
                      href={`${whatsapp}?text=${encodeURIComponent(`Hi ${c.name?.split(" ")[0] ?? ""}, I'd like a price for: ${service.title}`)}`}
                      {...external(whatsapp)}
                      className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--t-accent)] opacity-90 hover:opacity-100"
                    >
                      Book this on WhatsApp{" "}
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </a>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ——— Dispatch log of jobs ——— */}
      {has("projects") && (
        <section id="jobs" className="mx-auto max-w-[78rem] px-5 py-16 @3xl:px-10">
          <h2 className="font-[family-name:var(--t-display)] text-[clamp(2.2rem,5cqw,3.6rem)] font-semibold leading-none tracking-[-0.035em]">
            {label("projects", "Recent jobs")}
          </h2>
          <div className="mt-10 grid gap-5 @3xl:grid-cols-2">
            {(c.projects ?? []).map((job, index) => (
              <Reveal key={index} delay={(index % 2) * 90} className={index === 0 ? "@3xl:col-span-2" : ""}>
                <article
                  className="group relative overflow-hidden rounded-[28px] bg-[var(--t-surface)]"
                  {...ed(`projects.${index}`)}
                >
                  <Picture
                    src={job.image}
                    alt={job.title ?? ""}
                    embedded={embedded}
                    className={`w-full transition-transform duration-[1.2s] ease-[cubic-bezier(.2,.7,.1,1)] group-hover:scale-[1.04] ${index === 0 ? "aspect-[21/9]" : "aspect-[4/3]"}`}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgb(0_0_0/0.82))]" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white @3xl:p-8">
                    <p className="flex flex-wrap items-center gap-2 font-[family-name:var(--t-mono)] text-[11px] uppercase tracking-[0.14em]">
                      <span className="rounded-full bg-[var(--t-accent)] px-2.5 py-1 text-[var(--t-bg)]">
                        Job {pad(index + 1)}
                      </span>
                      {job.category && (
                        <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
                          {job.category}
                        </span>
                      )}
                      {job.client && <span className="opacity-80">{job.client}</span>}
                    </p>
                    <h3 className="mt-3 font-[family-name:var(--t-display)] text-[clamp(1.4rem,3cqw,2.1rem)] font-semibold leading-tight">
                      {job.title}
                    </h3>
                    {job.role && <p className="mt-1 text-[14px] opacity-80">{job.role}</p>}
                    {job.description && (
                      <p className="mt-3 max-w-[40rem] text-[14.5px] leading-snug opacity-90 @3xl:max-h-0 @3xl:overflow-hidden @3xl:opacity-0 @3xl:transition-all @3xl:duration-500 @3xl:group-hover:max-h-40 @3xl:group-hover:opacity-90">
                        {job.description}
                      </p>
                    )}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ——— Licences, as holograms ——— */}
      {has("highlights") && (
        <section className="mx-auto max-w-[78rem] px-5 py-16 @3xl:px-10">
          <h2 className="font-[family-name:var(--t-display)] text-[clamp(1.8rem,4cqw,2.6rem)] font-semibold tracking-[-0.03em]">
            {label("highlights", "Licensed & insured")}
          </h2>
          <ul className="mt-8 grid gap-4 @3xl:grid-cols-3">
            {credentials.map((item, index) => (
              <li
                key={index}
                className="relative overflow-hidden rounded-3xl bg-[var(--t-surface)] p-6 shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_10%,transparent)]"
                {...ed(`highlights.${index}`)}
              >
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-30 mix-blend-screen [animation:dispatch-sheen_6s_linear_infinite] [background-size:200%_100%]"
                  style={{
                    backgroundImage: `linear-gradient(110deg, transparent 20%, ${accent} 35%, #7cf7ff 45%, #ff7ce5 55%, transparent 70%)`,
                  }}
                />
                <span className="relative grid size-11 place-items-center rounded-2xl bg-[var(--t-accent)] text-[18px] font-bold text-[var(--t-bg)]">
                  ✓
                </span>
                <p className="relative mt-5 font-[family-name:var(--t-display)] text-[1.2rem] font-semibold leading-tight">
                  {item.title}
                </p>
                <p className="relative mt-1 text-[14px] opacity-70">
                  {[item.detail, item.year].filter(Boolean).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ——— What customers say ——— */}
      {has("testimonials") && (
        <section className="mx-auto grid max-w-[78rem] gap-5 px-5 py-16 @3xl:grid-cols-2 @3xl:px-10">
          {(c.testimonials ?? []).map((item, index) => (
            <Reveal key={index} delay={index * 90}>
              <figure
                className="h-full rounded-[28px] bg-[var(--t-surface)] p-8 shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_8%,transparent)]"
                {...ed(`testimonials.${index}`)}
              >
                <span
                  aria-hidden
                  className="font-[family-name:var(--t-display)] text-[4rem] font-semibold leading-[0.6] text-[var(--t-accent)]"
                >
                  “
                </span>
                <blockquote className="mt-2 font-[family-name:var(--t-display)] text-[1.3rem] font-medium leading-snug">
                  {item.quote}
                </blockquote>
                <figcaption className="mt-6 text-[14px]">
                  <b className="font-semibold">{item.name}</b>
                  <span className="opacity-60"> · {item.role}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </section>
      )}

      {/* ——— About, experience, training ——— */}
      {(has("about") || has("experience") || has("education")) && (
        <section className="mx-auto grid max-w-[78rem] gap-12 px-5 py-16 @3xl:px-10 @4xl:grid-cols-[1.3fr_1fr]">
          {has("about") && (
            <div>
              <h2 className="font-[family-name:var(--t-display)] text-[clamp(1.8rem,4cqw,2.6rem)] font-semibold tracking-[-0.03em]">
                {label("about", "Who turns up")}
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
          <div className="space-y-8">
            {has("experience") && (
              <ol className="space-y-4 border-l border-[color-mix(in_oklab,var(--t-fg)_18%,transparent)] pl-6">
                {(c.experience ?? []).map((job, index) => (
                  <li key={index} className="relative" {...ed(`experience.${index}`)}>
                    <span className="absolute -left-[29px] top-1.5 size-2.5 rounded-full bg-[var(--t-accent)] shadow-[0_0_12px_var(--t-accent)]" />
                    <p className="font-[family-name:var(--t-mono)] text-[11px] uppercase tracking-[0.14em] opacity-60">
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
                  <li
                    key={index}
                    className="flex justify-between gap-4 border-b border-[color-mix(in_oklab,var(--t-fg)_10%,transparent)] pb-2"
                    {...ed(`education.${index}`)}
                  >
                    <span>
                      <b className="font-semibold">{item.degree}</b>
                      <span className="block opacity-60">{item.school}</span>
                    </span>
                    <span className="font-[family-name:var(--t-mono)] opacity-60">{item.start_date}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* ——— Call to action, over the current again ——— */}
      {has("contact") && (
        <section className="px-5 pb-10 pt-6 @3xl:px-10">
          <div className="relative isolate mx-auto max-w-[78rem] overflow-hidden rounded-[36px] px-7 py-16 text-center shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_10%,transparent)] @3xl:py-24">
            <div className="absolute inset-0 -z-10">
              <Shader fragment={CURRENT} colours={colours} speed={0.7} />
            </div>
            <p className="font-[family-name:var(--t-mono)] text-[12px] uppercase tracking-[0.2em] opacity-70">
              Something not working?
            </p>
            <h2 className="mx-auto mt-4 max-w-[40rem] font-[family-name:var(--t-display)] text-[clamp(2.4rem,6cqw,4.6rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
              Send a photo. Get a price in minutes.
            </h2>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              {whatsapp && (
                <a
                  href={whatsapp}
                  {...external(whatsapp)}
                  className="rounded-2xl bg-[var(--t-accent)] px-7 py-4 font-[family-name:var(--t-display)] text-[1.05rem] font-semibold text-[var(--t-bg)] shadow-[0_18px_40px_-14px_var(--t-accent)]"
                >
                  WhatsApp {c.name?.split(" ")[0]}
                </a>
              )}
              {c.email && (
                <a
                  href={`mailto:${c.email}`}
                  className="rounded-2xl bg-[color-mix(in_oklab,var(--t-bg)_60%,transparent)] px-7 py-4 font-semibold backdrop-blur"
                  {...ed("email")}
                >
                  {c.email}
                </a>
              )}
            </div>
            <p className="mt-8 flex flex-wrap justify-center gap-5 text-[14px] opacity-75">
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

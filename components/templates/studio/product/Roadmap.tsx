"use client";

import "@fontsource-variable/inter-tight";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/syne";
import "@fontsource-variable/dm-sans";
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
 * Roadmap: a product manager's site that reads like the product they'd build.
 * A live contour field moves behind the hero and bends towards the pointer
 * (WebGL), results sit on KPI chips, each case study runs problem → what I did
 * → result with the metric drawn as a bar, and the career is a roadmap track
 * with a pulsing "now". For PMs, product owners and growth leads.
 */

/** Contour lines over a dot grid; the field rises around the pointer. */
const FIELD = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv * vec2(u_res.x / u_res.y, 1.0);
  float t = u_time * 0.07;
  float h = fbm(p * 2.1 + vec2(t, -t * 0.6)) - 0.45 * smoothstep(0.55, 0.0, length(uv - u_pointer));
  float band = abs(fract(h * 10.0) - 0.5);
  float line = smoothstep(0.07, 0.0, band);
  vec3 colour = u_a;
  colour = mix(colour, u_b, line * 0.16);
  vec2 cell = fract(p * 36.0) - 0.5;
  colour = mix(colour, u_c, smoothstep(0.1, 0.05, length(cell)) * 0.09);
  colour = mix(colour, u_b, 0.07 * smoothstep(0.45, 0.0, length(uv - u_pointer)));
  gl_FragColor = vec4(colour, 1.0);
}
`;

/** A metric like "+31% basket size" or "NPS 21 → 54" split into its number and its words. */
function metric(text?: string) {
  const match = (text ?? "").match(/^([^A-Za-z]*\d[\d.,%×x→ −+-]*)(.*)$/);
  return match ? { value: match[1]!.trim(), words: match[2]!.trim() } : { value: text ?? "", words: "" };
}

/** Capitalises the first letter, for text that followed a “Problem:” label. */
const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export default function Roadmap({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label, palette, accent } = studio;
  const colours: [string, string, string] = [palette?.bg ?? "#f5f6f8", accent, palette?.fg ?? "#0e1116"];
  const cases = c.projects ?? [];
  const career = [...(c.experience ?? [])].reverse();
  const primary = c.linkedin || (c.email ? `mailto:${c.email}` : undefined);
  const display = "font-[family-name:var(--t-display)]";
  const mono = "font-[family-name:var(--t-mono)]";
  const card =
    "rounded-[26px] bg-[var(--t-surface)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_8%,transparent),0_2px_4px_-2px_rgb(0_0_0/0.05),0_28px_56px_-36px_rgb(0_0_0/0.35)]";

  return (
    <StudioRoot studio={studio} className="text-[16px] leading-[1.6]">
      <style>{`
        @keyframes roadmap-float { 50% { transform: translateY(-7px); } }
        @keyframes roadmap-grow { from { transform: scaleX(0); } }
      `}</style>

      {/* ——— Hero on a live contour field ——— */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Shader fragment={FIELD} colours={colours} />
        </div>
        <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-[linear-gradient(transparent,var(--t-bg))]" />
        <header className="mx-auto flex max-w-[78rem] items-center justify-between gap-4 px-5 py-6 @3xl:px-10">
          <span className={`${display} text-[1.05rem] font-semibold tracking-[-0.01em]`}>{c.name}</span>
          <nav className="flex items-center gap-2 text-[13px]">
            <a
              href="#work"
              className="hidden rounded-full px-3 py-2 opacity-70 hover:opacity-100 @2xl:inline"
            >
              Case studies
            </a>
            <a
              href="#roadmap"
              className="hidden rounded-full px-3 py-2 opacity-70 hover:opacity-100 @2xl:inline"
            >
              Career
            </a>
            {primary && (
              <a
                href={primary}
                {...external(primary)}
                className="rounded-full bg-[var(--t-fg)] px-4 py-2 font-medium text-[var(--t-bg)] transition-transform hover:-translate-y-0.5"
              >
                Get in touch
              </a>
            )}
          </nav>
        </header>

        <div className="mx-auto grid max-w-[78rem] items-center gap-12 px-5 pb-20 pt-10 @3xl:px-10 @4xl:grid-cols-[1.25fr_1fr] @4xl:pb-24">
          <div>
            {c.availability && (
              <p
                className={`${mono} inline-flex items-center gap-2 rounded-full bg-[var(--t-surface)] px-3.5 py-1.5 text-[12px] shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_10%,transparent)]`}
                {...ed("availability")}
              >
                <span className="relative flex size-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#22c55e] opacity-60" />
                  <span className="relative size-2 rounded-full bg-[#22c55e]" />
                </span>
                {c.availability}
              </p>
            )}
            <h1
              className={`${display} mt-7 text-[clamp(3rem,8cqw,6.2rem)] font-semibold leading-[0.92] tracking-[-0.045em]`}
              {...ed("name")}
            >
              {c.name}
            </h1>
            <p
              className={`${mono} mt-4 text-[13px] uppercase tracking-[0.18em] text-[var(--t-accent)]`}
              {...ed("professional_title")}
            >
              {c.professional_title}
              {c.location && <span className="opacity-60"> · {c.location}</span>}
            </p>
            {c.tagline && (
              <p
                className={`${display} mt-6 max-w-[36rem] text-[clamp(1.35rem,2.6cqw,1.85rem)] font-medium leading-snug tracking-[-0.015em]`}
                {...ed("tagline")}
              >
                {c.tagline}
              </p>
            )}
            {has("stats") && (
              <dl className="mt-10 grid max-w-[38rem] grid-cols-3 gap-3">
                {(c.stats ?? []).slice(0, 3).map((stat, index) => (
                  <div key={index} className={`${card} px-4 py-4`} {...ed(`stats.${index}`)}>
                    <dd
                      className={`${display} text-[clamp(1.6rem,3.4cqw,2.3rem)] font-semibold leading-none tracking-[-0.03em]`}
                    >
                      <CountUp value={stat.value} />
                    </dd>
                    <dt className="mt-2 text-[12px] leading-snug opacity-65">{stat.label}</dt>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* Portrait with results floating beside it */}
          <div className="relative mx-auto w-full max-w-[25rem]">
            <div className={`${card} overflow-hidden p-2`} {...ed("avatar")}>
              <Picture
                src={c.avatar}
                alt={c.name ?? ""}
                embedded={embedded}
                prompt="Add your photo"
                className="aspect-[4/5] w-full rounded-[20px]"
              />
            </div>
            {cases.slice(0, 2).map((item, index) => {
              const { value, words } = metric(item.category);
              return value ? (
                <div
                  key={index}
                  className={`${card} absolute flex items-center gap-3 px-4 py-3 [animation:roadmap-float_6s_ease-in-out_infinite] ${index === 0 ? "-left-6 top-14 @3xl:-left-14" : "-right-4 bottom-16 [animation-delay:-3s] @3xl:-right-10"}`}
                  {...ed(`projects.${index}`)}
                >
                  <span className="grid size-9 place-items-center rounded-xl bg-[color-mix(in_oklab,var(--t-accent)_14%,transparent)] text-[var(--t-accent)]">
                    {index === 0 ? "↗" : "✦"}
                  </span>
                  <span>
                    <span className={`${display} block text-[1.25rem] font-semibold leading-none`}>
                      {value}
                    </span>
                    <span className="text-[12px] opacity-65">{words || item.title}</span>
                  </span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      </section>

      {/* ——— Case studies ——— */}
      {has("projects") && (
        <section id="work" className="mx-auto max-w-[78rem] px-5 py-20 @3xl:px-10">
          <p className={`${mono} text-[12px] uppercase tracking-[0.2em] text-[var(--t-accent)]`}>
            Case studies
          </p>
          <h2
            className={`${display} mt-3 text-[clamp(2.3rem,5.5cqw,4rem)] font-semibold leading-none tracking-[-0.04em]`}
          >
            {label("projects", "Problems I’ve solved")}
          </h2>
          <div className="mt-12 space-y-8">
            {cases.map((item, index) => {
              const { value, words } = metric(item.category);
              return (
                <Reveal key={index}>
                  <article
                    className={`${card} grid overflow-hidden @4xl:grid-cols-[1fr_1.1fr]`}
                    {...ed(`projects.${index}`)}
                  >
                    <div className={`relative ${index % 2 ? "@4xl:order-2" : ""}`}>
                      <Picture
                        src={item.image}
                        alt={item.title ?? ""}
                        embedded={embedded}
                        className="aspect-[16/11] size-full"
                      />
                      <span
                        className={`${mono} absolute left-4 top-4 rounded-full bg-[var(--t-surface)]/90 px-3 py-1 text-[11px] backdrop-blur`}
                      >
                        {pad(index + 1)} · {[item.client, item.year].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                    <div className="flex flex-col p-7 @3xl:p-10">
                      <h3
                        className={`${display} text-[clamp(1.6rem,3.2cqw,2.3rem)] font-semibold leading-tight tracking-[-0.03em]`}
                      >
                        {item.title}
                      </h3>
                      <dl className="mt-6 space-y-4 text-[15px]">
                        {item.role && (
                          <div className="grid grid-cols-[6.5rem_1fr] gap-3">
                            <dt
                              className={`${mono} pt-0.5 text-[11px] uppercase tracking-[0.16em] opacity-55`}
                            >
                              Problem
                            </dt>
                            <dd>{sentence(item.role.replace(/^Problem:\s*/i, ""))}</dd>
                          </div>
                        )}
                        {item.description && (
                          <div className="grid grid-cols-[6.5rem_1fr] gap-3">
                            <dt
                              className={`${mono} pt-0.5 text-[11px] uppercase tracking-[0.16em] opacity-55`}
                            >
                              What I did
                            </dt>
                            <dd className="opacity-85 pretty">{item.description}</dd>
                          </div>
                        )}
                      </dl>
                      {value && (
                        <div className="mt-auto pt-8">
                          <p className={`${mono} text-[11px] uppercase tracking-[0.16em] opacity-55`}>
                            Result
                          </p>
                          <p
                            className={`${display} mt-1 text-[clamp(2.4rem,5cqw,3.4rem)] font-semibold leading-none tracking-[-0.04em] text-[var(--t-accent)]`}
                          >
                            {value}
                          </p>
                          {words && <p className="text-[14px] opacity-70">{words}</p>}
                          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--t-fg)_8%,transparent)]">
                            <div className="h-full w-[78%] origin-left rounded-full bg-[linear-gradient(90deg,color-mix(in_oklab,var(--t-accent)_50%,transparent),var(--t-accent))] [animation:roadmap-grow_1.6s_cubic-bezier(.2,.8,.2,1)_both]" />
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {/* ——— Career as a roadmap ——— */}
      {has("experience") && (
        <section id="roadmap" className="mx-auto max-w-[78rem] px-5 py-16 @3xl:px-10">
          <h2 className={`${display} text-[clamp(2rem,4.6cqw,3.2rem)] font-semibold tracking-[-0.04em]`}>
            {label("experience", "Roadmap so far")}
          </h2>
          <ol className="relative mt-12 grid gap-8 @3xl:grid-flow-col @3xl:auto-cols-fr">
            <span
              aria-hidden
              className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-[2px] bg-[linear-gradient(var(--t-accent),color-mix(in_oklab,var(--t-accent)_20%,transparent))] @3xl:left-0 @3xl:top-[7px] @3xl:h-[2px] @3xl:w-full @3xl:bg-[linear-gradient(90deg,color-mix(in_oklab,var(--t-accent)_20%,transparent),var(--t-accent))]"
            />
            {career.map((job, index) => {
              const now = index === career.length - 1;
              return (
                <li
                  key={index}
                  className="relative pl-8 @3xl:pl-0 @3xl:pt-9"
                  {...ed(`experience.${career.length - 1 - index}`)}
                >
                  <span className="absolute left-0 top-1 flex size-4 @3xl:top-0">
                    {now && (
                      <span className="absolute inset-0 animate-ping rounded-full bg-[var(--t-accent)] opacity-50" />
                    )}
                    <span
                      className={`relative size-4 rounded-full ${now ? "bg-[var(--t-accent)]" : "border-2 border-[var(--t-accent)] bg-[var(--t-bg)]"}`}
                    />
                  </span>
                  <p className={`${mono} text-[11px] uppercase tracking-[0.16em] opacity-60`}>
                    {[job.start_date, job.end_date].filter(Boolean).join(" – ")}
                    {now && (
                      <span className="ml-2 rounded-full bg-[var(--t-accent)] px-2 py-0.5 text-[10px] text-[var(--t-bg)]">
                        Now
                      </span>
                    )}
                  </p>
                  <p className={`${display} mt-2 text-[1.3rem] font-semibold leading-tight`}>
                    {job.job_title}
                  </p>
                  <p className="text-[14px] opacity-70">
                    {[job.company, job.location].filter(Boolean).join(" · ")}
                  </p>
                  {job.description && <p className="mt-2 text-[14px] opacity-80">{job.description}</p>}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* ——— About and toolkit ——— */}
      {(has("about") || has("skills")) && (
        <section className="mx-auto grid max-w-[78rem] gap-12 px-5 py-16 @3xl:px-10 @4xl:grid-cols-[1.3fr_1fr]">
          {has("about") && (
            <div>
              <h2 className={`${display} text-[clamp(2rem,4.6cqw,3.2rem)] font-semibold tracking-[-0.04em]`}>
                {label("about", "How I work")}
              </h2>
              <div className="mt-6 space-y-4 text-[1.08rem] opacity-85">
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
              <p className={`${mono} text-[11px] uppercase tracking-[0.18em] opacity-60`}>Toolkit</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(c.skills ?? []).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-[color-mix(in_oklab,var(--t-accent)_10%,transparent)] px-3 py-1.5 text-[13.5px] font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ——— What colleagues say ——— */}
      {has("testimonials") && (
        <section className="mx-auto grid max-w-[78rem] gap-5 px-5 py-16 @3xl:grid-cols-2 @3xl:px-10">
          {(c.testimonials ?? []).map((item, index) => (
            <Reveal key={index} delay={index * 90}>
              <figure className={`${card} h-full p-8`} {...ed(`testimonials.${index}`)}>
                <blockquote
                  className={`${display} text-[1.35rem] font-medium leading-snug tracking-[-0.01em]`}
                >
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

      {/* ——— Education and talks ——— */}
      {(has("education") || has("highlights")) && (
        <section className="mx-auto grid max-w-[78rem] gap-5 px-5 py-10 @3xl:grid-cols-2 @3xl:px-10">
          {has("education") &&
            (c.education ?? []).map((item, index) => (
              <div key={`e${index}`} className={`${card} p-6`} {...ed(`education.${index}`)}>
                <p className={`${mono} text-[11px] uppercase tracking-[0.16em] opacity-55`}>Education</p>
                <p className={`${display} mt-2 text-[1.2rem] font-semibold`}>{item.degree}</p>
                <p className="text-[14px] opacity-70">
                  {[item.school, [item.start_date, item.end_date].filter(Boolean).join("–")]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            ))}
          {has("highlights") &&
            (c.highlights ?? []).map((item, index) => (
              <div key={`h${index}`} className={`${card} p-6`} {...ed(`highlights.${index}`)}>
                <p className={`${mono} text-[11px] uppercase tracking-[0.16em] opacity-55`}>{item.year}</p>
                <p className={`${display} mt-2 text-[1.2rem] font-semibold`}>{item.title}</p>
                {item.detail && <p className="text-[14px] opacity-70">{item.detail}</p>}
              </div>
            ))}
        </section>
      )}

      {/* ——— Contact on the field again ——— */}
      {has("contact") && (
        <section className="px-5 pb-12 pt-8 @3xl:px-10">
          <div className="relative isolate mx-auto max-w-[78rem] overflow-hidden rounded-[36px] px-7 py-16 shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_8%,transparent)] @3xl:px-14 @3xl:py-20">
            <div className="absolute inset-0 -z-10">
              <Shader fragment={FIELD} colours={colours} speed={0.7} />
            </div>
            <h2
              className={`${display} max-w-[40rem] text-[clamp(2.4rem,6cqw,4.6rem)] font-semibold leading-[0.95] tracking-[-0.045em]`}
            >
              Got a problem worth solving? <span className="text-[var(--t-accent)]">Let’s talk.</span>
            </h2>
            <div className="mt-9 flex flex-wrap gap-3">
              {c.email && (
                <a
                  href={`mailto:${c.email}`}
                  className="rounded-full bg-[var(--t-fg)] px-7 py-4 font-semibold text-[var(--t-bg)] transition-transform hover:-translate-y-0.5"
                  {...ed("email")}
                >
                  Email {firstName(c.name)}
                </a>
              )}
              {contactLinks(c)
                .filter((link) => !/^(mailto|tel):/.test(link.url))
                .map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    {...external(link.url)}
                    className="rounded-full bg-[var(--t-surface)] px-6 py-4 font-medium shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_10%,transparent)]"
                  >
                    {link.label} ↗
                  </a>
                ))}
            </div>
          </div>
        </section>
      )}
    </StudioRoot>
  );
}

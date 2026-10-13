"use client";

import "@fontsource-variable/playfair-display";
import "@fontsource-variable/playfair-display/wght-italic.css";
import "@fontsource/libre-caslon-text/400.css";
import "@fontsource/libre-caslon-text/400-italic.css";
import "@fontsource-variable/libre-franklin";
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

/** Gold foil: the accent with a highlight running through it, as on a printed cover. */
const FOIL =
  "linear-gradient(115deg, color-mix(in oklab, var(--t-accent) 70%, black) 0%, var(--t-accent) 30%, color-mix(in oklab, var(--t-accent) 45%, white) 48%, var(--t-accent) 62%, color-mix(in oklab, var(--t-accent) 75%, black) 100%)";

/** Fine linen texture for the cover. */
const LINEN = {
  backgroundImage:
    "repeating-linear-gradient(0deg, color-mix(in oklab, white 4%, transparent) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, color-mix(in oklab, black 6%, transparent) 0 1px, transparent 1px 4px)",
};

/** A rising bar chart drawn on the cover: decorative, in foil. */
function CoverChart() {
  const bars = [28, 36, 33, 48, 55, 52, 68, 80, 92];
  return (
    <div aria-hidden className="relative flex h-44 items-end gap-2">
      {bars.map((height, index) => (
        <span
          key={index}
          className="flex-1 rounded-t-[3px] shadow-[0_8px_18px_-8px_black]"
          style={{ height: `${height}%`, background: FOIL, opacity: 0.35 + index * 0.07 }}
        />
      ))}
      <svg
        className="absolute inset-0 size-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polyline
          points="5,78 16,70 27,72 38,56 49,48 60,50 71,34 82,22 95,8"
          fill="none"
          stroke="var(--t-bg)"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

export default function AnnualReport({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const year = new Date().getFullYear();

  return (
    <StudioRoot studio={studio} className="text-[16px] leading-[1.65]">
      <section className="relative isolate overflow-hidden bg-[var(--t-fg)] px-6 py-8 text-[var(--t-bg)] @3xl:px-14">
        <div aria-hidden className="absolute inset-0 -z-10" style={LINEN} />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(80%_70%_at_80%_10%,color-mix(in_oklab,var(--t-accent)_16%,transparent),transparent_60%),radial-gradient(120%_90%_at_50%_120%,color-mix(in_oklab,black_35%,transparent),transparent_60%)]"
        />
        <div className="flex justify-between text-[12px] uppercase tracking-[0.24em] opacity-80">
          <span>{c.name}</span>
          <span>Annual report {year}</span>
        </div>
        <div className="grid min-h-[70vh] items-end gap-12 pb-6 pt-20 @4xl:grid-cols-[1.4fr_1fr]">
          <div>
            <p
              className="fd bg-clip-text text-[clamp(4rem,12cqw,9rem)] leading-none text-transparent"
              style={{ backgroundImage: FOIL }}
            >
              {year}
            </p>
            <p className="mt-2 text-[13px] uppercase tracking-[0.3em] opacity-70">The year in review</p>
            {c.tagline && (
              <p
                className="fd mt-8 max-w-[40rem] text-[clamp(2rem,5cqw,3.8rem)] leading-[1.02] tracking-[-0.015em]"
                {...ed("tagline")}
              >
                {c.tagline}
              </p>
            )}
          </div>
          <div className="space-y-8">
            <CoverChart />
            <div className="border-t border-[color-mix(in_oklab,var(--t-bg)_30%,transparent)] pt-4">
              <h1 className="fd text-[1.9rem] leading-tight" {...ed("name")}>
                {c.name}
              </h1>
              <p className="opacity-80" {...ed("professional_title")}>
                {c.professional_title}
              </p>
              <p className="mt-1 opacity-60">{c.location}</p>
            </div>
            {/* Contents, as on the inside cover */}
            <ol className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12px] uppercase tracking-[0.16em] opacity-75">
              {[
                has("stats") && "The year in numbers",
                has("about") && "Letter",
                has("experience") && "Milestones",
                has("highlights") && "Highlights",
                has("contact") && "Contact",
              ]
                .filter(Boolean)
                .map((item, index) => (
                  <li key={String(item)} className="flex gap-2">
                    <span className="ta">{pad(index + 1)}</span>
                    {item}
                  </li>
                ))}
            </ol>
          </div>
        </div>
      </section>
      <div aria-hidden className="h-1.5" style={{ background: FOIL }} />

      {has("stats") && (
        <section className="border-b rule px-6 py-16 @3xl:px-14">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.24em] tm">
            {label("stats", "The year in numbers")}
          </h2>
          <dl className="mt-8 grid gap-4 @2xl:grid-cols-2 @4xl:grid-flow-col @4xl:auto-cols-fr">
            {(c.stats ?? []).map((stat, index) => (
              <Reveal key={index} delay={index * 90}>
                <div
                  className="rounded-xl bg-[color-mix(in_oklab,var(--t-bg)_70%,white)] p-6 shadow-[0_0_0_1px_var(--t-rule),0_14px_30px_-20px_rgb(0_0_0/0.35)]"
                  {...ed(`stats.${index}`)}
                >
                  <dd className="fd text-[clamp(2.8rem,6cqw,4.2rem)] leading-none">{stat.value}</dd>
                  <dt className="mt-2 text-[13px] uppercase tracking-[0.14em] tm">{stat.label}</dt>
                  <div aria-hidden className="mt-5 flex h-8 items-end gap-1">
                    {[30, 45, 40, 60, 72, 90].map((height, bar) => (
                      <span
                        key={bar}
                        className="flex-1 rounded-t-[2px]"
                        style={{
                          height: `${height - index * 4}%`,
                          background: bar === 5 ? FOIL : "color-mix(in oklab, var(--t-fg) 14%, transparent)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </dl>
        </section>
      )}

      {has("about") && (
        <section className="grid gap-10 px-6 py-20 @3xl:px-14 @4xl:grid-cols-[1fr_1.5fr]">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.24em] ta">
              {label("about", "Letter from the founder")}
            </p>
            <p className="fd mt-4 text-[2.2rem] italic leading-tight">Dear reader,</p>
          </div>
          <div className="space-y-5 rounded-sm bg-[color-mix(in_oklab,var(--t-bg)_55%,white)] p-8 text-[1.1rem] shadow-[0_1px_0_var(--t-rule),0_24px_50px_-28px_rgb(0_0_0/0.45)] @3xl:p-12">
            {paragraphs(c).map(({ text, index }, position) => (
              <p
                key={index}
                className={`pretty ${position === 0 ? "fd text-[1.45rem] leading-snug" : ""}`}
                {...ed(`summary.${index}`)}
              >
                {text}
              </p>
            ))}
            <p className="fd pt-4 text-[2.2rem] italic leading-none">{firstName(c.name)}</p>
            <p className="text-[13px] uppercase tracking-[0.16em] tm">{c.professional_title}</p>
          </div>
        </section>
      )}

      {has("experience") && (
        <section className="bs px-6 py-20 @3xl:px-14">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.24em] tm">
            {label("experience", "Milestones")}
          </h2>
          <ol className="relative mt-12 grid gap-10 before:absolute before:inset-x-0 before:top-[7px] before:hidden before:h-[2px] before:bg-[var(--t-rule-strong)] @3xl:grid-cols-3 @3xl:before:block">
            {(c.experience ?? []).map((role, index) => (
              <li key={index} className="relative pt-8" {...ed(`experience.${index}`)}>
                <span
                  className="absolute left-0 top-0 size-4 rounded-full shadow-[0_0_0_4px_var(--t-surface),0_4px_10px_-2px_rgb(0_0_0/0.4)]"
                  style={{ background: FOIL }}
                />
                <p
                  className="fd bg-clip-text text-[2.6rem] leading-none text-transparent"
                  style={{ backgroundImage: FOIL }}
                >
                  {role.start_date}
                </p>
                {role.end_date && <p className="mt-1 text-[13px] tm">to {role.end_date}</p>}
                <p className="mt-3 text-[1.15rem] font-semibold">{role.job_title}</p>
                <p className="tm">{role.company}</p>
                {role.description && <p className="mt-2 text-[15px] pretty">{role.description}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {has("highlights") && (
        <section className="px-6 py-20 @3xl:px-14">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.24em] tm">
            {label("highlights", "Highlights")}
          </h2>
          <ul className="mt-6 divide-y divide-[var(--t-rule)] border-y rule">
            {(c.highlights ?? []).map((item, index) => (
              <li
                key={index}
                className="grid gap-2 py-5 @3xl:grid-cols-[4rem_1fr_8rem]"
                {...ed(`highlights.${index}`)}
              >
                <span className="text-[13px] tm">{pad(index + 1)}</span>
                <span>
                  <span className="fd text-[1.4rem]">{item.title}</span>
                  {item.detail && <span className="block tm">{item.detail}</span>}
                </span>
                <span className="text-[14px] tm @3xl:text-right">{item.year}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {has("projects") && (
        <section className="grid gap-10 px-6 pb-20 @3xl:grid-cols-2 @3xl:px-14">
          {(c.projects ?? []).map((project, index) => (
            <article key={index} {...ed(`projects.${index}`)}>
              <Picture
                src={project.image}
                alt={project.title ?? ""}
                embedded={embedded}
                className="aspect-[16/10] w-full shadow-[0_0_0_1px_var(--t-rule),0_24px_44px_-26px_rgb(0_0_0/0.5)]"
              />
              <p className="mt-4 text-[12px] uppercase tracking-[0.2em] ta">
                {project.category} · {project.client} · {project.year}
              </p>
              <h3 className="fd mt-1 text-[1.8rem] leading-tight">{project.title}</h3>
              <p className="mt-2 tm">{project.description}</p>
            </article>
          ))}
        </section>
      )}

      {has("testimonials") && (
        <section className="relative isolate bg-[var(--t-fg)] px-6 py-24 text-center text-[var(--t-bg)] @3xl:px-14">
          <div aria-hidden className="absolute inset-0 -z-10" style={LINEN} />
          {(c.testimonials ?? []).slice(0, 1).map((item, index) => (
            <figure key={index} className="mx-auto max-w-[50rem]" {...ed(`testimonials.${index}`)}>
              <span
                aria-hidden
                className="fd block bg-clip-text text-[7rem] leading-[0.7] text-transparent"
                style={{ backgroundImage: FOIL }}
              >
                “
              </span>
              <blockquote className="fd text-[clamp(1.7rem,4cqw,2.8rem)] italic leading-snug balance">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-6 text-[13px] uppercase tracking-[0.2em] opacity-70">
                {item.name} · {item.role}
              </figcaption>
            </figure>
          ))}
        </section>
      )}

      <section className="grid gap-12 px-6 py-20 @3xl:grid-cols-2 @3xl:px-14">
        {has("services") && (
          <div>
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.24em] tm">
              {label("services", "Governance & giving back")}
            </h2>
            <ul className="mt-5 space-y-4">
              {(c.services ?? []).map((item, index) => (
                <li key={index} {...ed(`services.${index}`)}>
                  <p className="fd text-[1.3rem]">{item.title}</p>
                  <p className="tm">{item.description}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {has("education") && (
          <div>
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.24em] tm">
              {label("education", "Education")}
            </h2>
            <ul className="mt-5 space-y-3">
              {(c.education ?? []).map((item, index) => (
                <li key={index} {...ed(`education.${index}`)}>
                  <p className="fd text-[1.3rem]">{item.school}</p>
                  <p className="tm">
                    {item.degree}, {[item.start_date, item.end_date].filter(Boolean).join("–")}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {has("contact") && (
        <footer className="relative px-6 py-16 @3xl:px-14">
          <div aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: FOIL }} />
          <div className="grid gap-8 @3xl:grid-cols-[1fr_auto]">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.24em] tm">
                Investor & press relations
              </p>
              <a
                href={c.email ? `mailto:${c.email}` : "#"}
                className="fd mt-3 block text-[clamp(1.8rem,4.6cqw,3.2rem)] hover-a"
                {...ed("email")}
              >
                {c.email}
              </a>
              {c.availability && (
                <p className="mt-2 tm" {...ed("availability")}>
                  {c.availability}
                </p>
              )}
            </div>
            <ul className="self-end text-[14px] @3xl:text-right">
              {contactLinks(c)
                .filter((link) => !link.url.startsWith("mailto:"))
                .map((link) => (
                  <li key={link.url}>
                    <a href={link.url} {...external(link.url)} className="hover-a">
                      {link.label} ↗
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        </footer>
      )}
    </StudioRoot>
  );
}

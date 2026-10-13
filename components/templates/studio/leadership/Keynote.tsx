"use client";

import "@fontsource/dm-serif-display/400.css";
import "@fontsource/dm-serif-display/400-italic.css";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/bricolage-grotesque";
import { useState } from "react";
import {
  Picture,
  Reveal,
  StudioRoot,
  contactLinks,
  ed,
  external,
  initials,
  paragraphs,
  useStudio,
  type StudioProps,
} from "../kit";

/**
 * Keynote: a stage under lights. Spotlights and haze over the hero, the
 * speaker lit from above, a strip of venues, talks as event tickets, the
 * best quotes, and a booking panel for organisers.
 */

/** Three spotlight cones and a lit floor, in the accent colour. */
function Stage({ x }: { x: number }) {
  const cone = (left: number, tilt: number, strength: number) => (
    <div
      className="absolute top-[-10%] h-[120%] w-[38%] origin-top blur-2xl"
      style={{
        left: `${left}%`,
        transform: `translateX(-50%) rotate(${tilt}deg)`,
        background: `linear-gradient(180deg, color-mix(in oklab, var(--t-fg) ${strength}%, transparent), transparent 75%)`,
        clipPath: "polygon(45% 0, 55% 0, 100% 100%, 0 100%)",
      }}
    />
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {cone(18, -14, 10)}
      {cone(50 + (x - 50) * 0.15, 0, 16)}
      {cone(82, 14, 10)}
      {/* haze */}
      <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_35%,color-mix(in_oklab,var(--t-accent)_16%,transparent),transparent_70%)]" />
      {/* the lit floor */}
      <div className="absolute inset-x-[-10%] bottom-[-22%] h-[45%] rounded-[50%] bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--t-fg)_14%,transparent),transparent)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(transparent,var(--t-bg))]" />
    </div>
  );
}

/** A talk as an event ticket: a date stub, a perforation, then the talk. */
function Ticket({ year, title, detail }: { year?: string; title?: string; detail?: string }) {
  return (
    <div className="relative flex overflow-hidden rounded-2xl bg-[var(--t-surface)] shadow-[0_0_0_1px_var(--t-rule),0_20px_40px_-24px_rgb(0_0_0/0.6)]">
      <div className="grid w-24 shrink-0 place-items-center bg-[linear-gradient(160deg,var(--t-accent),color-mix(in_oklab,var(--t-accent)_60%,black))] px-2 py-6 text-center text-[var(--t-bg)]">
        <span className="fd text-[1.7rem] leading-none">{year ?? "—"}</span>
      </div>
      {/* perforation */}
      <div className="relative w-0 border-l-2 border-dashed border-[var(--t-rule-strong)]">
        <span className="absolute -left-[9px] -top-2 size-4 rounded-full bg-[var(--t-bg)]" />
        <span className="absolute -bottom-2 -left-[9px] size-4 rounded-full bg-[var(--t-bg)]" />
      </div>
      <div className="min-w-0 flex-1 px-6 py-5">
        <p className="fd text-[1.45rem] leading-tight">{title}</p>
        {detail && <p className="mt-1 text-[14px] tm">{detail}</p>}
      </div>
    </div>
  );
}

export default function Keynote({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const [light, setLight] = useState({ x: 50, y: 30 });
  const [first, ...more] = c.testimonials ?? [];
  const venues = (c.highlights ?? []).map((item) => item.title).filter(Boolean) as string[];

  return (
    <StudioRoot studio={studio} className="text-[16px] leading-[1.6]">
      <section
        className="relative isolate overflow-hidden px-6 pb-24 pt-8 @3xl:px-14"
        onMouseMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          setLight({
            x: ((event.clientX - box.left) / box.width) * 100,
            y: ((event.clientY - box.top) / box.height) * 100,
          });
        }}
      >
        <Stage x={light.x} />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 transition-[background] duration-300"
          style={{
            background: `radial-gradient(circle at ${light.x}% ${light.y}%, color-mix(in oklab, var(--t-accent) 14%, transparent), transparent 38%)`,
          }}
        />
        <header className="flex items-center justify-between text-[13px]">
          <span className="font-semibold tracking-wide">{c.name}</span>
          <a
            href="#book"
            className="rounded-full bg-[color-mix(in_oklab,var(--t-fg)_8%,transparent)] px-4 py-1.5 shadow-[inset_0_0_0_1px_var(--t-rule-strong)] backdrop-blur hover:bg-[color-mix(in_oklab,var(--t-fg)_14%,transparent)]"
          >
            Book {c.name?.split(" ")[0]} to speak
          </a>
        </header>

        <div className="mx-auto max-w-[64rem] pt-16 text-center @3xl:pt-24">
          {/* The speaker, lit from above */}
          <div
            className="relative mx-auto grid size-32 place-items-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_20%,color-mix(in_oklab,var(--t-fg)_22%,var(--t-surface)),var(--t-surface))] text-[2.4rem] shadow-[0_0_0_1px_var(--t-rule-strong),0_0_60px_-8px_color-mix(in_oklab,var(--t-accent)_55%,transparent),0_30px_60px_-20px_black] @3xl:size-40"
            {...ed("avatar")}
          >
            {c.avatar ? (
              <Picture src={c.avatar} alt={c.name ?? ""} className="size-full" />
            ) : (
              <span className="fd">{initials(c.name)}</span>
            )}
          </div>
          <p className="mt-8 text-[13px] uppercase tracking-[0.3em] ta" {...ed("professional_title")}>
            {c.professional_title}
          </p>
          <h1
            className="fd mt-3 text-[clamp(2.6rem,7.5cqw,6.2rem)] leading-[0.98] tracking-[-0.01em] balance"
            {...ed("name")}
          >
            {c.name}
          </h1>
          {c.tagline && (
            <p
              className="fd mx-auto mt-6 max-w-[46rem] text-[clamp(1.4rem,3cqw,2.2rem)] italic leading-[1.2] tm balance"
              {...ed("tagline")}
            >
              {c.tagline}
            </p>
          )}
          <p className="mt-8 flex flex-wrap items-center justify-center gap-3 text-[14px]">
            {c.location && <span className="tm">{c.location}</span>}
            {c.availability && (
              <span
                className="inline-flex items-center gap-2 rounded-full bg-[color-mix(in_oklab,var(--t-accent)_14%,transparent)] px-3 py-1 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--t-accent)_40%,transparent)]"
                {...ed("availability")}
              >
                <span className="size-1.5 rounded-full ba" />
                {c.availability}
              </span>
            )}
          </p>
        </div>
      </section>

      {/* Venues, scrolling past like a marquee */}
      {venues.length > 0 && (
        <div className="overflow-hidden border-y rule bg-[var(--t-surface)] py-4" aria-label="Recent stages">
          <div className="flex w-max gap-12 whitespace-nowrap [animation:keynote-marquee_40s_linear_infinite]">
            {[...venues, ...venues].map((venue, index) => (
              <span key={index} className="fd flex items-center gap-12 text-[1.3rem] tm">
                {venue}
                <span className="ta">✦</span>
              </span>
            ))}
          </div>
          <style>{`@keyframes keynote-marquee { to { transform: translateX(-50%); } }`}</style>
        </div>
      )}

      {has("stats") && (
        <section className="mx-auto max-w-[72rem] px-6 py-16 @3xl:px-14">
          <dl className="grid gap-4 @3xl:grid-flow-col @3xl:auto-cols-fr">
            {(c.stats ?? []).map((stat, index) => (
              <div
                key={index}
                className="rounded-2xl bg-[linear-gradient(180deg,var(--t-surface),color-mix(in_oklab,var(--t-surface)_60%,var(--t-bg)))] px-6 py-8 text-center shadow-[0_0_0_1px_var(--t-rule)]"
                {...ed(`stats.${index}`)}
              >
                <dd className="fd bg-[linear-gradient(180deg,var(--t-fg),color-mix(in_oklab,var(--t-accent)_70%,var(--t-fg)))] bg-clip-text text-[3.2rem] leading-none text-transparent">
                  {stat.value}
                </dd>
                <dt className="mt-3 text-[12px] uppercase tracking-[0.18em] tm">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </section>
      )}

      {has("highlights") && (
        <section className="mx-auto max-w-[72rem] px-6 py-12 @3xl:px-14">
          <h2 className="fd text-[clamp(2.2rem,5cqw,3.4rem)]">{label("highlights", "On stage")}</h2>
          <ul className="mt-8 grid gap-4 @3xl:grid-cols-2">
            {(c.highlights ?? []).map((item, index) => (
              <Reveal as="li" key={index} delay={index * 60}>
                <div {...ed(`highlights.${index}`)}>
                  <Ticket year={item.year} title={item.title} detail={item.detail} />
                </div>
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      {first && has("testimonials") && (
        <section className="relative isolate px-6 py-24 text-center @3xl:px-14">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_50%_50%,color-mix(in_oklab,var(--t-accent)_10%,transparent),transparent)]"
          />
          <figure className="mx-auto max-w-[56rem]" {...ed("testimonials.0")}>
            <span className="fd block text-[6rem] leading-[0.6] ta" aria-hidden>
              “
            </span>
            <blockquote className="fd mt-4 text-[clamp(2rem,5cqw,3.6rem)] italic leading-[1.1] balance">
              {first.quote}
            </blockquote>
            <figcaption className="mt-8 text-[13px] uppercase tracking-[0.2em] tm">
              {first.name} — {first.role}
            </figcaption>
          </figure>
          {more.length > 0 && (
            <div className="mx-auto mt-14 grid max-w-[64rem] gap-4 text-left @3xl:grid-cols-2">
              {more.map((item, index) => (
                <figure
                  key={index}
                  className="rounded-2xl bg-[var(--t-surface)] p-6 shadow-[0_0_0_1px_var(--t-rule)]"
                  {...ed(`testimonials.${index + 1}`)}
                >
                  <blockquote className="pretty">“{item.quote}”</blockquote>
                  <figcaption className="mt-4 text-[13px] tm">
                    {item.name} · {item.role}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </section>
      )}

      {has("about") && (
        <section className="mx-auto grid max-w-[72rem] gap-10 border-t rule px-6 py-20 @3xl:grid-cols-[1fr_1.5fr] @3xl:px-14">
          <h2 className="fd text-[2.4rem] leading-tight">{label("about", "Biography")}</h2>
          <div className="space-y-4 text-[1.1rem]">
            {paragraphs(c).map(({ text, index }) => (
              <p
                key={index}
                className="pretty first:text-[1.3rem] first:leading-snug"
                {...ed(`summary.${index}`)}
              >
                {text}
              </p>
            ))}
          </div>
        </section>
      )}

      {has("experience") && (
        <section className="mx-auto max-w-[72rem] px-6 pb-20 @3xl:px-14">
          <h2 className="fd text-[clamp(2rem,4.5cqw,3rem)]">{label("experience", "Career")}</h2>
          <ol className="mt-8 grid gap-4 @3xl:grid-cols-2">
            {(c.experience ?? []).map((job, index) => (
              <li
                key={index}
                className="rounded-2xl bg-[var(--t-surface)] p-6 shadow-[0_0_0_1px_var(--t-rule)]"
                {...ed(`experience.${index}`)}
              >
                <p className="text-[12px] uppercase tracking-[0.18em] ta">
                  {[job.start_date, job.end_date].filter(Boolean).join(" – ")}
                </p>
                <p className="fd mt-2 text-[1.5rem] leading-tight">{job.job_title}</p>
                <p className="text-[14px] tm">{[job.company, job.location].filter(Boolean).join(" · ")}</p>
                {job.description && <p className="mt-3 text-[15px] pretty">{job.description}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {has("projects") && (
        <section className="mx-auto max-w-[72rem] px-6 pb-20 @3xl:px-14">
          <div className="grid gap-8 @3xl:grid-cols-2">
            {(c.projects ?? []).map((project, index) => (
              <article key={index} className="group" {...ed(`projects.${index}`)}>
                <div className="relative overflow-hidden rounded-2xl shadow-[0_0_0_1px_var(--t-rule),0_30px_60px_-30px_black]">
                  <Picture
                    src={project.image}
                    alt={project.title ?? ""}
                    embedded={embedded}
                    className="aspect-video w-full transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_55%,color-mix(in_oklab,var(--t-bg)_70%,transparent))]" />
                </div>
                <p className="mt-4 text-[12px] uppercase tracking-[0.18em] ta">
                  {[project.category, project.client, project.year].filter(Boolean).join(" · ")}
                </p>
                <h3 className="fd mt-1 text-[1.8rem] leading-tight">{project.title}</h3>
                <p className="mt-1 tm pretty">{project.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {has("contact") && (
        <section id="book" className="px-6 pb-12 @3xl:px-14">
          <div className="relative isolate mx-auto grid max-w-[72rem] gap-10 overflow-hidden rounded-3xl bg-[var(--t-surface)] p-8 shadow-[0_0_0_1px_var(--t-rule),0_40px_80px_-40px_black] @3xl:grid-cols-2 @3xl:p-14">
            <div
              aria-hidden
              className="absolute -right-24 -top-24 -z-10 size-96 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--t-accent)_30%,transparent),transparent)] blur-xl"
            />
            <div>
              <p className="text-[12px] uppercase tracking-[0.24em] ta">For organisers</p>
              <h2 className="fd mt-3 text-[clamp(2rem,5cqw,3.2rem)] leading-tight">Booking enquiries</h2>
              <p className="mt-3 tm" {...ed("availability")}>
                {c.availability}
              </p>
              <a
                href={c.email ? `mailto:${c.email}?subject=${encodeURIComponent("Speaking enquiry")}` : "#"}
                className="mt-8 inline-flex items-center gap-2 rounded-full ba px-7 py-3.5 font-semibold text-[var(--t-bg)] shadow-[0_10px_30px_-10px_var(--t-accent)] transition-transform hover:-translate-y-0.5"
                {...ed("email")}
              >
                Send event details →
              </a>
              <p className="mt-6 flex flex-wrap gap-5 text-[14px] tm">
                {contactLinks(c)
                  .filter((link) => !link.url.startsWith("mailto:"))
                  .map((link) => (
                    <a key={link.url} href={link.url} {...external(link.url)} className="hover-a">
                      {link.label} ↗
                    </a>
                  ))}
              </p>
            </div>
            {has("services") && (
              <ul className="space-y-3">
                {(c.services ?? []).map((item, index) => (
                  <li
                    key={index}
                    className="rounded-2xl bg-[color-mix(in_oklab,var(--t-bg)_50%,transparent)] p-5 shadow-[inset_0_0_0_1px_var(--t-rule)]"
                    {...ed(`services.${index}`)}
                  >
                    <p className="flex items-baseline justify-between gap-4">
                      <span className="fd text-[1.35rem] leading-tight">{item.title}</span>
                      {item.price && <span className="shrink-0 text-[13px] ta">{item.price}</span>}
                    </p>
                    <p className="mt-1 text-[14px] tm">{item.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </StudioRoot>
  );
}

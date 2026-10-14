"use client";

import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/jetbrains-mono";
import { useState } from "react";
import {
  Picture,
  Reveal,
  StudioRoot,
  contactLinks,
  ed,
  external,
  pad,
  paragraphs,
  span,
  useStudio,
  type StudioProps,
} from "../kit";
import { ObjectHint, ObjectStage, objectFor, type ObjectKind } from "../objects3d";

/**
 * Control Room (3D, Pro): an operations manager's site laid out like a
 * command centre. The headline numbers sit on a live board; the projects
 * stand on a 3D turntable of pedestals, one object each (a parcel for the
 * warehouse, gears for automation, a truck for the fleet), and turning the
 * table or clicking an object brings its story to the front. For operations,
 * supply chain, logistics and facilities managers.
 */

const FALLBACK: ObjectKind[] = ["box", "gear", "truck", "coins", "monitor", "clipboard", "globe", "target"];

/** A small rising line for each number on the board, different for each. */
function Spark({ seed }: { seed: number }) {
  const points = Array.from({ length: 12 }, (_, i) => {
    const y = 26 - i * 1.6 - Math.sin(i * 1.7 + seed * 2.1) * 4;
    return `${i * 10},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 110 32" className="h-8 w-28" aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke="var(--t-accent)"
        strokeWidth="2"
        strokeLinejoin="round"
        className="cr-draw"
      />
    </svg>
  );
}

export default function ControlRoom({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label, palette, accent } = studio;
  const [chosen, setChosen] = useState(0);
  const projects = c.projects ?? [];
  const kinds = projects
    .slice(0, 8)
    .map((project, index) => objectFor(project.category || project.title, index, FALLBACK));
  const current = Math.min(chosen, Math.max(0, kinds.length - 1));
  const project = projects[current];
  const step = (by: number) => setChosen((current + by + kinds.length) % kinds.length);

  const display = "font-[family-name:var(--t-display)]";
  const mono = "font-[family-name:var(--t-mono)]";
  const line = "border-[color-mix(in_oklab,var(--t-fg)_12%,transparent)]";
  const panel =
    "rounded-[20px] bg-[color-mix(in_oklab,var(--t-surface)_92%,transparent)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_9%,transparent),0_30px_60px_-40px_black]";
  const email = c.email ? `mailto:${c.email}` : "#contact";

  return (
    <StudioRoot studio={studio} className="text-[16px] leading-[1.6]">
      <style>{`
        .cr-grid { background-image: linear-gradient(color-mix(in oklab, var(--t-fg) 6%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--t-fg) 6%, transparent) 1px, transparent 1px); background-size: 48px 48px; }
        .cr-draw { stroke-dasharray: 200; stroke-dashoffset: 200; animation: cr-draw 2.4s ease-out forwards; }
        @keyframes cr-draw { to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) { .cr-draw { animation: none; stroke-dashoffset: 0; } }
        [data-static] .cr-draw { animation: none; stroke-dashoffset: 0; }
      `}</style>

      {/* ——— Top bar ——— */}
      <header className={`border-b ${line}`}>
        <div className="mx-auto flex max-w-[84rem] items-center justify-between gap-4 px-5 py-4 @3xl:px-10">
          <div className={`${mono} flex items-center gap-3 text-[12px] uppercase tracking-[0.18em]`}>
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--t-accent)] opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-[var(--t-accent)]" />
            </span>
            <span>{c.name}</span>
          </div>
          <nav className={`${mono} flex items-center gap-1 text-[12px] uppercase tracking-[0.14em]`}>
            <a
              href="#floor"
              className="hidden rounded-full px-3 py-2 opacity-70 hover:opacity-100 @2xl:inline"
            >
              Projects
            </a>
            <a href="#log" className="hidden rounded-full px-3 py-2 opacity-70 hover:opacity-100 @2xl:inline">
              Log
            </a>
            <a
              href={email}
              className="rounded-full bg-[var(--t-accent)] px-4 py-2 font-semibold text-[var(--t-bg)]"
            >
              Contact
            </a>
          </nav>
        </div>
      </header>

      {/* ——— Hero and the board ——— */}
      <section className="cr-grid relative">
        <div className="mx-auto grid max-w-[84rem] gap-10 px-5 py-16 @3xl:px-10 items-center @4xl:grid-cols-[1fr_1.15fr] @4xl:py-16">
          <div>
            {c.availability && (
              <p
                className={`${mono} text-[12px] uppercase tracking-[0.16em] text-[var(--t-accent)]`}
                {...ed("availability")}
              >
                ● {c.availability}
              </p>
            )}
            <h1
              className={`${display} mt-5 text-[clamp(3rem,8.5cqw,7rem)] font-semibold leading-[0.9] tracking-[-0.045em]`}
              {...ed("name")}
            >
              {c.name}
            </h1>
            <p
              className={`${mono} mt-5 text-[13px] uppercase tracking-[0.16em] opacity-70`}
              {...ed("professional_title")}
            >
              {c.professional_title}
            </p>
            {c.tagline && (
              <p
                className="mt-6 max-w-[36rem] text-[clamp(1.2rem,2.2cqw,1.55rem)] leading-snug"
                {...ed("tagline")}
              >
                {c.tagline}
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#floor"
                className="rounded-xl bg-[var(--t-accent)] px-6 py-3.5 font-semibold text-[var(--t-bg)]"
              >
                See the projects ↓
              </a>
              <a
                href={email}
                className="rounded-xl px-6 py-3.5 font-semibold shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--t-fg)_28%,transparent)]"
              >
                Get in touch
              </a>
            </div>
          </div>

          {has("projects") && kinds.length > 0 && (
            <div className="relative aspect-square w-full">
              <ObjectStage
                kinds={kinds}
                selected={current}
                onSelect={setChosen}
                accent={accent}
                ink={palette?.fg ?? "#e8edf3"}
                layout="carousel"
              />
              <p
                className={`${mono} pointer-events-none absolute right-2 top-2 text-[11px] uppercase tracking-[0.16em] opacity-55`}
              >
                Drag to turn · click an object
              </p>
              {project && (
                <a
                  href="#floor"
                  className={`${panel} absolute bottom-3 left-1/2 flex w-[min(26rem,92%)] -translate-x-1/2 items-center gap-3 px-4 py-3`}
                >
                  <span className={`${mono} text-[11px] uppercase tracking-[0.16em] text-[var(--t-accent)]`}>
                    {pad(current + 1)}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{project.title}</span>
                  <span className={`${mono} text-[11px] uppercase tracking-[0.14em] opacity-60`}>Read ↓</span>
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ——— Operations board ——— */}
      {has("stats") && (
        <section className={`border-y ${line}`}>
          <div className="mx-auto grid max-w-[84rem] @2xl:grid-cols-3">
            {(c.stats ?? []).slice(0, 3).map((stat, index) => (
              <div
                key={index}
                className={`flex items-center justify-between gap-4 border-b ${line} px-5 py-7 last:border-b-0 @2xl:border-b-0 @2xl:border-r @2xl:last:border-r-0 @3xl:px-10`}
                {...ed(`stats.${index}`)}
              >
                <div>
                  <p
                    className={`${display} text-[clamp(1.9rem,4cqw,2.8rem)] font-semibold leading-none tracking-[-0.03em]`}
                  >
                    {stat.value}
                  </p>
                  <p className={`${mono} mt-2 text-[11px] uppercase tracking-[0.16em] opacity-60`}>
                    {stat.label}
                  </p>
                </div>
                <Spark seed={index} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ——— Project file ——— */}
      {has("projects") && kinds.length > 0 && (
        <section id="floor" className={`relative border-y ${line}`}>
          <div className="mx-auto max-w-[84rem] px-5 pt-14 @3xl:px-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2
                className={`${display} text-[clamp(2.2rem,5cqw,4rem)] font-semibold leading-none tracking-[-0.035em]`}
              >
                {label("projects", "On the floor")}
              </h2>
              <p className={`${mono} text-[12px] uppercase tracking-[0.16em] opacity-60`}>
                Pick one here or on the turntable
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-[84rem] items-start gap-6 px-5 pb-14 pt-10 @3xl:px-10 @4xl:grid-cols-[1.2fr_1fr]">
            {project && (
              <article key={current} className={`${panel} cr-card p-7`} {...ed(`projects.${current}`)}>
                <div
                  className={`${mono} flex items-center justify-between text-[11px] uppercase tracking-[0.18em]`}
                >
                  <span className="text-[var(--t-accent)]">{project.category || kinds[current]}</span>
                  <span className="opacity-60">
                    {pad(current + 1)} / {pad(kinds.length)}
                  </span>
                </div>
                <h3
                  className={`${display} mt-4 text-[clamp(1.6rem,3cqw,2.2rem)] font-semibold leading-[1.05] tracking-[-0.025em]`}
                >
                  {project.title}
                </h3>
                {project.description && <p className="mt-4 opacity-80">{project.description}</p>}
                {(project.technologies ?? []).length > 0 && (
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {(project.technologies ?? []).map((result) => (
                      <li
                        key={result}
                        className={`${mono} rounded-full bg-[color-mix(in_oklab,var(--t-accent)_16%,transparent)] px-3 py-1.5 text-[12px] font-semibold text-[var(--t-accent)]`}
                      >
                        {result}
                      </li>
                    ))}
                  </ul>
                )}
                <p className={`${mono} mt-6 text-[11.5px] uppercase tracking-[0.14em] opacity-55`}>
                  {[project.client, project.role, project.year].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-6 flex gap-2">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous project"
                    className="grid size-11 place-items-center rounded-full shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--t-fg)_25%,transparent)] hover:bg-[color-mix(in_oklab,var(--t-fg)_8%,transparent)]"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next project"
                    className="grid size-11 place-items-center rounded-full bg-[var(--t-accent)] font-semibold text-[var(--t-bg)]"
                  >
                    →
                  </button>
                </div>
              </article>
            )}
            <ol className={`${panel} overflow-hidden`}>
              {projects.slice(0, 8).map((item, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => setChosen(index)}
                    className={`flex w-full items-center gap-4 border-b ${line} px-5 py-4 text-left last:border-b-0 ${index === current ? "bg-[color-mix(in_oklab,var(--t-accent)_14%,transparent)]" : "hover:bg-[color-mix(in_oklab,var(--t-fg)_5%,transparent)]"}`}
                  >
                    <span className={`${mono} text-[12px] text-[var(--t-accent)]`}>{pad(index + 1)}</span>
                    <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
                    <span className={`${mono} text-[11px] uppercase tracking-[0.12em] opacity-55`}>
                      {kinds[index]}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
          {embedded && <ObjectHint />}
        </section>
      )}

      {/* ——— Services ——— */}
      {has("services") && (
        <section className="mx-auto max-w-[84rem] px-5 py-20 @3xl:px-10">
          <h2
            className={`${display} text-[clamp(2.2rem,5cqw,4rem)] font-semibold leading-none tracking-[-0.035em]`}
          >
            {label("services", "How I can help")}
          </h2>
          <div className="mt-10 grid gap-4 @3xl:grid-cols-3">
            {(c.services ?? []).map((service, index) => (
              <Reveal key={index} delay={index * 80}>
                <div className={`${panel} flex h-full flex-col p-7`} {...ed(`services.${index}`)}>
                  <p className={`${mono} text-[11px] uppercase tracking-[0.18em] opacity-55`}>
                    {pad(index + 1)}
                  </p>
                  <h3 className={`${display} mt-3 text-[1.4rem] font-semibold leading-tight`}>
                    {service.title}
                  </h3>
                  <p className="mt-2 flex-1 text-[15px] opacity-75">{service.description}</p>
                  <p className={`${mono} mt-6 text-[15px] font-semibold text-[var(--t-accent)]`}>
                    {service.price}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ——— Log: career, results, education ——— */}
      {(has("experience") || has("highlights") || has("education")) && (
        <section id="log" className={`border-t ${line}`}>
          <div className="mx-auto grid max-w-[84rem] gap-12 px-5 py-20 @3xl:px-10 @4xl:grid-cols-[1.3fr_1fr]">
            <div>
              <h2
                className={`${display} text-[clamp(2rem,4.4cqw,3.2rem)] font-semibold leading-none tracking-[-0.03em]`}
              >
                {label("experience", "Shift log")}
              </h2>
              <ol className="mt-8">
                {(c.experience ?? []).map((job, index) => (
                  <li
                    key={index}
                    className={`grid gap-1 border-t ${line} py-5 @2xl:grid-cols-[10rem_1fr]`}
                    {...ed(`experience.${index}`)}
                  >
                    <span
                      className={`${mono} text-[12px] uppercase tracking-[0.14em] text-[var(--t-accent)]`}
                    >
                      {span(job.start_date, job.end_date)}
                    </span>
                    <span>
                      <span className="block text-[1.12rem] font-semibold">{job.job_title}</span>
                      <span className="opacity-65">
                        {[job.company, job.location].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </li>
                ))}
                {(c.education ?? []).map((item, index) => (
                  <li
                    key={`e${index}`}
                    className={`grid gap-1 border-t ${line} py-5 @2xl:grid-cols-[10rem_1fr]`}
                    {...ed(`education.${index}`)}
                  >
                    <span className={`${mono} text-[12px] uppercase tracking-[0.14em] opacity-60`}>
                      {span(item.start_date, item.end_date)}
                    </span>
                    <span>
                      <span className="block font-semibold">{item.degree}</span>
                      <span className="opacity-65">{item.school}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            {has("highlights") && (
              <div>
                <h2
                  className={`${display} text-[clamp(2rem,4.4cqw,3.2rem)] font-semibold leading-none tracking-[-0.03em]`}
                >
                  {label("highlights", "Milestones")}
                </h2>
                <div className="mt-8 grid gap-3">
                  {(c.highlights ?? []).map((item, index) => (
                    <div
                      key={index}
                      className={`${panel} flex items-start gap-4 p-5`}
                      {...ed(`highlights.${index}`)}
                    >
                      <span className={`${mono} text-[12px] text-[var(--t-accent)]`}>{item.year}</span>
                      <span>
                        <span className="block font-semibold">{item.title}</span>
                        {item.detail && <span className="text-[14px] opacity-65">{item.detail}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ——— About and testimonials ——— */}
      {(has("about") || has("testimonials")) && (
        <section className={`border-t ${line}`}>
          <div className="mx-auto grid max-w-[84rem] items-start gap-10 px-5 py-20 @3xl:px-10 @4xl:grid-cols-[20rem_1fr]">
            <div className={`${panel} overflow-hidden p-2`} {...ed("avatar")}>
              <Picture
                src={c.avatar}
                alt={c.name ?? ""}
                embedded={embedded}
                prompt="Your photo"
                className="aspect-[4/5] w-full rounded-[14px]"
              />
            </div>
            <div>
              {has("about") && (
                <div className="space-y-4 text-[1.08rem]">
                  <h2
                    className={`${display} text-[clamp(2rem,4.4cqw,3.2rem)] font-semibold leading-none tracking-[-0.03em]`}
                  >
                    {label("about", "How I work")}
                  </h2>
                  {paragraphs(c).map(({ text, index }) => (
                    <p key={index} className="pretty opacity-85" {...ed(`summary.${index}`)}>
                      {text}
                    </p>
                  ))}
                </div>
              )}
              {has("skills") && (
                <ul className="mt-8 flex flex-wrap gap-2">
                  {(c.skills ?? []).map((skill, index) => (
                    <li
                      key={index}
                      className={`${mono} rounded-md px-3 py-1.5 text-[12px] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--t-fg)_18%,transparent)]`}
                      {...ed(`skills.${index}`)}
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              )}
              {has("testimonials") && (
                <div className="mt-10 grid gap-4 @3xl:grid-cols-2">
                  {(c.testimonials ?? []).map((item, index) => (
                    <figure key={index} className={`${panel} p-6`} {...ed(`testimonials.${index}`)}>
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
          </div>
        </section>
      )}

      {/* ——— Contact ——— */}
      {has("contact") && (
        <section id="contact" className={`cr-grid border-t ${line}`}>
          <div className="mx-auto max-w-[84rem] px-5 py-24 text-center @3xl:px-10">
            <h2
              className={`${display} mx-auto max-w-[46rem] text-[clamp(2.4rem,6cqw,4.8rem)] font-semibold leading-[0.95] tracking-[-0.04em]`}
            >
              Got an operation that needs <span className="text-[var(--t-accent)]">calm and numbers?</span>
            </h2>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              {c.email && (
                <a
                  href={`mailto:${c.email}`}
                  className="rounded-xl bg-[var(--t-accent)] px-7 py-4 font-semibold text-[var(--t-bg)]"
                  {...ed("email")}
                >
                  {c.email}
                </a>
              )}
              {c.phone && (
                <a
                  href={`tel:${c.phone.replace(/\s/g, "")}`}
                  className="rounded-xl px-7 py-4 font-semibold shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--t-fg)_28%,transparent)]"
                  {...ed("phone")}
                >
                  {c.phone}
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
          </div>
        </section>
      )}
    </StudioRoot>
  );
}

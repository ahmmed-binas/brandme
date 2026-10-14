"use client";

import "@fontsource-variable/fraunces";
import "@fontsource-variable/figtree";
import "@fontsource-variable/jetbrains-mono";
import { useState } from "react";
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
  span,
  useStudio,
  type StudioProps,
} from "../kit";
import { ObjectHint, ObjectStage, objectFor, type ObjectKind } from "../objects3d";

/**
 * Studio Desk (3D, Pro): a content marketer's site built around a 3D desk.
 * Each piece of work is an object on the desk (a camera for video, a mic
 * for the podcast, a stack of books for the newsletter, a phone for social);
 * click one, or a title in the index beside it, and it lifts into the light
 * while its story and results open. Warm, editorial and a little playful.
 * For content marketers, copywriters, social media and brand managers.
 */

const FALLBACK: ObjectKind[] = ["book", "camera", "mic", "megaphone", "phone", "chart", "bulb", "laptop"];

export default function StudioDesk({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label, palette, accent } = studio;
  const [chosen, setChosen] = useState(0);
  const projects = (c.projects ?? []).slice(0, 8);
  const kinds = projects.map((project, index) => objectFor(project.category || project.title, index, FALLBACK));
  const current = Math.min(chosen, Math.max(0, kinds.length - 1));
  const project = projects[current];

  const display = "font-[family-name:var(--t-display)]";
  const mono = "font-[family-name:var(--t-mono)]";
  const line = "border-[color-mix(in_oklab,var(--t-fg)_14%,transparent)]";
  const card =
    "rounded-[22px] bg-[var(--t-surface)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_8%,transparent),0_24px_50px_-34px_color-mix(in_oklab,var(--t-fg)_45%,transparent)]";
  const email = c.email ? `mailto:${c.email}` : "#contact";

  return (
    <StudioRoot
      studio={studio}
      className="text-[16.5px] leading-[1.6]"
    >
      {/* ——— Masthead ——— */}
      <header className="mx-auto flex max-w-[84rem] items-center justify-between gap-4 px-5 py-6 @3xl:px-10">
        <span className={`${display} text-[1.35rem] font-semibold italic tracking-[-0.02em]`}>{c.name}</span>
        <nav className="flex items-center gap-1 text-[14px] font-medium">
          <a
            href="#desk"
            className="hidden rounded-full px-3.5 py-2 hover:bg-[color-mix(in_oklab,var(--t-fg)_7%,transparent)] @2xl:inline"
          >
            Work
          </a>
          <a
            href="#services"
            className="hidden rounded-full px-3.5 py-2 hover:bg-[color-mix(in_oklab,var(--t-fg)_7%,transparent)] @2xl:inline"
          >
            Services
          </a>
          <a
            href={email}
            className="rounded-full bg-[var(--t-fg)] px-4 py-2 text-[var(--t-bg)]"
          >
            Say hello
          </a>
        </nav>
      </header>

      {/* ——— Hero ——— */}
      <section className="mx-auto grid max-w-[84rem] items-center gap-10 px-5 pb-14 pt-6 @3xl:px-10 @4xl:grid-cols-[1fr_1.2fr]">
        <div>
          {c.availability && (
            <p
              className={`${mono} inline-flex items-center gap-2 rounded-full bg-[color-mix(in_oklab,var(--t-accent)_16%,transparent)] px-3.5 py-1.5 text-[12px]`}
              {...ed("availability")}
            >
              <span className="size-2 rounded-full bg-[var(--t-accent)]" />
              {c.availability}
            </p>
          )}
          <h1
            className={`${display} mt-6 text-[clamp(3rem,7.4cqw,6.4rem)] font-medium leading-[0.88] tracking-[-0.045em]`}
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
              className={`${display} mt-6 max-w-[40rem] text-[clamp(1.35rem,2.6cqw,1.9rem)] italic leading-snug`}
              {...ed("tagline")}
            >
              {c.tagline}
            </p>
          )}
        </div>
        {has("projects") && kinds.length > 0 ? (
          <div className="relative aspect-[4/3] w-full">
            <ObjectStage
              kinds={kinds}
              selected={current}
              onSelect={setChosen}
              accent={accent}
              ink={palette?.fg ?? "#1d1a17"}
              layout="desk"
            />
            <p className={`${mono} pointer-events-none absolute right-2 top-2 text-[11px] uppercase tracking-[0.16em] opacity-55`}>
              Click anything on the desk
            </p>
            {project && (
              <a
                href="#desk"
                className={`${card} absolute bottom-2 left-1/2 flex w-[min(26rem,92%)] -translate-x-1/2 items-center gap-3 px-4 py-3`}
              >
                <span className={`${mono} text-[11px] uppercase tracking-[0.14em] text-[var(--t-accent)]`}>
                  {kinds[current]}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold">{project.title}</span>
                <span className="text-[13px] opacity-60">Read ↓</span>
              </a>
            )}
          </div>
        ) : (
        <div
          className="relative mx-auto w-full max-w-[20rem]"
          {...ed("avatar")}
        >
          <div className="absolute -inset-3 -z-10 rotate-3 rounded-[28px] bg-[var(--t-accent)]" />
          <Picture
            src={c.avatar}
            alt={c.name ?? ""}
            embedded={embedded}
            prompt="Your photo"
            className="aspect-[4/5] w-full -rotate-2 rounded-[24px] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.45)]"
          />
        </div>
        )}
      </section>

      {/* ——— Numbers as sticky notes ——— */}
      {has("stats") && (
        <section className="mx-auto max-w-[84rem] px-5 pb-16 @3xl:px-10">
          <div className="grid gap-4 @2xl:grid-cols-3">
            {(c.stats ?? []).map((stat, index) => (
              <Reveal
                key={index}
                delay={index * 90}
              >
                <div
                  className={`${card} p-6 ${["@2xl:-rotate-1", "@2xl:rotate-1", "@2xl:-rotate-[0.5deg]"][index % 3]}`}
                  {...ed(`stats.${index}`)}
                >
                  <p className={`${display} text-[clamp(2.4rem,5cqw,3.6rem)] font-medium leading-none tracking-[-0.03em]`}>
                    {stat.value}
                  </p>
                  <p className="mt-2 opacity-70">{stat.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ——— The desk ——— */}
      {has("projects") && kinds.length > 0 && (
        <section
          id="desk"
          className="bg-[color-mix(in_oklab,var(--t-accent)_9%,var(--t-bg))] py-16"
        >
          <div className="mx-auto max-w-[84rem] px-5 @3xl:px-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className={`${display} text-[clamp(2.4rem,5.5cqw,4.4rem)] font-medium leading-none tracking-[-0.035em]`}>
                {label("projects", "On my desk")}
              </h2>
              <p className={`${mono} text-[12px] uppercase tracking-[0.16em] opacity-60`}>Pick one here or on the desk above</p>
            </div>
            <div className="mt-8 grid items-start gap-6">
              <div className="grid items-start gap-4 @4xl:grid-cols-[1.2fr_1fr]">
                {project && (
                  <article
                    key={current}
                    className={`${card} p-7`}
                    {...ed(`projects.${current}`)}
                  >
                    <p className={`${mono} text-[11px] uppercase tracking-[0.18em] text-[var(--t-accent)]`}>
                      {project.category || kinds[current]} · {project.year}
                    </p>
                    <h3 className={`${display} mt-3 text-[clamp(1.7rem,3cqw,2.3rem)] font-medium leading-[1.05] tracking-[-0.02em]`}>
                      {project.title}
                    </h3>
                    {project.description && <p className="mt-4 opacity-80">{project.description}</p>}
                    {(project.technologies ?? []).length > 0 && (
                      <ul className="mt-5 flex flex-wrap gap-2">
                        {(project.technologies ?? []).map((result) => (
                          <li
                            key={result}
                            className="rounded-full bg-[var(--t-accent)] px-3 py-1.5 text-[13px] font-semibold text-[var(--t-bg)]"
                          >
                            {result}
                          </li>
                        ))}
                      </ul>
                    )}
                    {(project.client || project.role) && (
                      <p className="mt-5 text-[14px] opacity-60">{[project.client, project.role].filter(Boolean).join(" · ")}</p>
                    )}
                  </article>
                )}
                <ol className={`${card} overflow-hidden`}>
                  {projects.map((item, index) => (
                    <li key={index}>
                      <button
                        type="button"
                        onClick={() => setChosen(index)}
                        className={`flex w-full items-center gap-4 border-b ${line} px-5 py-3 text-left last:border-b-0 ${index === current ? "bg-[color-mix(in_oklab,var(--t-accent)_14%,transparent)]" : "hover:bg-[color-mix(in_oklab,var(--t-fg)_5%,transparent)]"}`}
                      >
                        <span className={`${mono} text-[12px] opacity-55`}>{pad(index + 1)}</span>
                        <span className="flex-1 truncate font-medium">{item.title}</span>
                        <span className={`${mono} text-[11px] uppercase tracking-[0.12em] opacity-55`}>{kinds[index]}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
          {embedded && (
            <div className="mt-6">
              <ObjectHint />
            </div>
          )}
        </section>
      )}

      {/* ——— About ——— */}
      {has("about") && (
        <section className="mx-auto grid max-w-[84rem] items-start gap-10 px-5 py-20 @3xl:px-10 @4xl:grid-cols-[20rem_1fr]">
          <div
            className="relative mx-auto w-full max-w-[20rem]"
            {...ed("avatar")}
          >
            <div className="absolute -inset-3 -z-10 rotate-3 rounded-[28px] bg-[var(--t-accent)]" />
            <Picture
              src={c.avatar}
              alt={c.name ?? ""}
              embedded={embedded}
              prompt="Your photo"
              className="aspect-[4/5] w-full -rotate-2 rounded-[24px] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.45)]"
            />
          </div>
          <div className="max-w-[44rem]">
          <h2 className={`${display} text-[clamp(2.2rem,5cqw,3.6rem)] font-medium leading-none tracking-[-0.03em]`}>
            {label("about", `Hi, I’m ${firstName(c.name)}`)}
          </h2>
          <div className="mt-6 space-y-4 text-[1.14rem]">
            {paragraphs(c).map(({ text, index }) => (
              <p
                key={index}
                className="pretty opacity-85"
                {...ed(`summary.${index}`)}
              >
                {text}
              </p>
            ))}
          </div>
          {has("skills") && (
            <ul className="mt-8 flex flex-wrap gap-2">
              {(c.skills ?? []).map((skill, index) => (
                <li
                  key={index}
                  className={`rounded-full border ${line} px-3.5 py-1.5 text-[14px]`}
                  {...ed(`skills.${index}`)}
                >
                  {skill}
                </li>
              ))}
            </ul>
          )}
          </div>
        </section>
      )}

      {/* ——— Services ——— */}
      {has("services") && (
        <section
          id="services"
          className="mx-auto max-w-[84rem] px-5 pb-20 @3xl:px-10"
        >
          <h2 className={`${display} text-[clamp(2.2rem,5cqw,3.6rem)] font-medium leading-none tracking-[-0.03em]`}>
            {label("services", "Ways to work together")}
          </h2>
          <div className="mt-10 grid gap-4 @3xl:grid-cols-3">
            {(c.services ?? []).map((service, index) => (
              <Reveal
                key={index}
                delay={index * 80}
              >
                <div
                  className={`${card} flex h-full flex-col p-7`}
                  {...ed(`services.${index}`)}
                >
                  <h3 className={`${display} text-[1.5rem] font-medium leading-tight`}>{service.title}</h3>
                  <p className="mt-2 flex-1 opacity-75">{service.description}</p>
                  <p className="mt-6 font-semibold text-[var(--t-accent)]">{service.price}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ——— Kind words ——— */}
      {has("testimonials") && (
        <section className="mx-auto max-w-[84rem] px-5 pb-20 @3xl:px-10">
          <div className="grid gap-4 @3xl:grid-cols-2">
            {(c.testimonials ?? []).map((item, index) => (
              <figure
                key={index}
                className={`${card} p-8`}
                {...ed(`testimonials.${index}`)}
              >
                <blockquote className={`${display} text-[1.45rem] italic leading-snug`}>“{item.quote}”</blockquote>
                <figcaption className="mt-5 text-[14px] opacity-65">
                  {item.name} · {item.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ——— Career and recognition ——— */}
      {(has("experience") || has("highlights") || has("education")) && (
        <section className={`border-t ${line}`}>
          <div className="mx-auto grid max-w-[84rem] gap-12 px-5 py-20 @3xl:px-10 @4xl:grid-cols-2">
            <div>
              <h2 className={`${display} text-[clamp(2rem,4.4cqw,3rem)] font-medium leading-none tracking-[-0.03em]`}>
                {label("experience", "Where I’ve worked")}
              </h2>
              <ol className="mt-6">
                {(c.experience ?? []).map((job, index) => (
                  <li
                    key={index}
                    className={`border-t ${line} py-4`}
                    {...ed(`experience.${index}`)}
                  >
                    <p className="font-semibold">{job.job_title}</p>
                    <p className="opacity-65">
                      {[job.company, job.location].filter(Boolean).join(" · ")} · {span(job.start_date, job.end_date)}
                    </p>
                  </li>
                ))}
                {(c.education ?? []).map((item, index) => (
                  <li
                    key={`e${index}`}
                    className={`border-t ${line} py-4`}
                    {...ed(`education.${index}`)}
                  >
                    <p className="font-semibold">{item.degree}</p>
                    <p className="opacity-65">
                      {item.school} · {span(item.start_date, item.end_date)}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
            {has("highlights") && (
              <div>
                <h2 className={`${display} text-[clamp(2rem,4.4cqw,3rem)] font-medium leading-none tracking-[-0.03em]`}>
                  {label("highlights", "Recognition")}
                </h2>
                <ul className="mt-6">
                  {(c.highlights ?? []).map((item, index) => (
                    <li
                      key={index}
                      className={`flex gap-4 border-t ${line} py-4`}
                      {...ed(`highlights.${index}`)}
                    >
                      <span className={`${mono} text-[13px] text-[var(--t-accent)]`}>{item.year}</span>
                      <span>
                        <span className="block font-semibold">{item.title}</span>
                        {item.detail && <span className="opacity-65">{item.detail}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ——— Contact ——— */}
      {has("contact") && (
        <section
          id="contact"
          className="bg-[var(--t-fg)] px-5 py-24 text-center text-[var(--t-bg)] @3xl:px-10"
        >
          <h2 className={`${display} mx-auto max-w-[46rem] text-[clamp(2.6rem,6.5cqw,5.2rem)] font-medium leading-[0.95] tracking-[-0.04em]`}>
            Let’s make something people <span className="italic text-[var(--t-accent)]">actually finish.</span>
          </h2>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {c.email && (
              <a
                href={`mailto:${c.email}`}
                className="rounded-full bg-[var(--t-accent)] px-7 py-4 font-semibold text-[var(--t-fg)]"
                {...ed("email")}
              >
                {c.email}
              </a>
            )}
          </div>
          <p className="mt-6 flex flex-wrap justify-center gap-5 text-[14px] opacity-75">
            {contactLinks(c)
              .filter((link) => !/^(mailto|tel):/.test(link.url))
              .map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  {...external(link.url)}
                  className="underline-offset-4 hover:underline"
                >
                  {link.label} ↗
                </a>
              ))}
          </p>
        </section>
      )}
    </StudioRoot>
  );
}

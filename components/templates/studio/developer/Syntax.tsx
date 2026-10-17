"use client";

import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/space-grotesk";
import { useEffect, useState } from "react";
import {
  Picture,
  Reveal,
  StudioRoot,
  contactLinks,
  ed,
  external,
  paragraphs,
  useStudio,
  type StudioProps,
} from "../kit";
import { motionOff, useSeen } from "../motion";

/**
 * Syntax: a developer's site laid out like a code editor in daylight. A
 * file-tree sidebar is the navigation; `$ whoami` types the name; a terminal
 * writes the profile line by line from the person's own content; skills are
 * installed packages; projects have Live and Code buttons; experience reads
 * as a commit log; certificates and talks are a changelog.
 *
 * Our own design. The owner's "Syntax" page imitated a specific developer's
 * personal site (no licence), so only the general ideas were kept: typed
 * name, terminal intro, skills, project links, timeline, certificates. Left
 * out: a robot chat helper, a custom cursor, a contact form that sends from
 * the page, and anything fixed to the screen.
 */

/** Types the text out once it's on screen; shows it whole when motion is off. */
function Typed({ text, className = "" }: { text: string; className?: string }) {
  const [ref, seen] = useSeen<HTMLSpanElement>("0px");
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (!seen || motionOff()) return;
    let shown = 0;
    const timer = window.setInterval(() => {
      shown += 1;
      setCount(shown);
      if (shown >= text.length) window.clearInterval(timer);
    }, 70);
    return () => window.clearInterval(timer);
  }, [seen, text]);
  const visible = count === null ? text : text.slice(0, count);
  return (
    <span ref={ref} className={className}>
      {/* The whole name is always in the page for search engines and screen readers. */}
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {visible}
        <span className="syntax-caret">▍</span>
      </span>
    </span>
  );
}

/** Profile lines that appear one after another, like output in a terminal. */
function Terminal({ lines }: { lines: Array<[key: string, value: string]> }) {
  const [ref, seen] = useSeen<HTMLDivElement>();
  const [shown, setShown] = useState<number | null>(null);
  useEffect(() => {
    if (!seen || motionOff()) return;
    let count = 0;
    const timer = window.setInterval(() => {
      count += 1;
      setShown(count);
      if (count >= lines.length) window.clearInterval(timer);
    }, 260);
    return () => window.clearInterval(timer);
  }, [seen, lines.length]);
  const visible = shown === null ? lines.length : shown;
  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-[18px] bg-[var(--t-fg)] text-[var(--t-bg)] shadow-[0_30px_60px_-38px_rgb(0_0_0/0.6)]"
    >
      <div className="flex items-center gap-2 border-b border-[color-mix(in_oklab,var(--t-bg)_14%,transparent)] px-4 py-3 font-[family-name:var(--t-mono)] text-[12px] opacity-75">
        <span className="size-2.5 rounded-full bg-[var(--t-accent)]" />
        profile.json
      </div>
      <pre className="whitespace-pre-wrap break-words px-5 py-5 font-[family-name:var(--t-mono)] text-[13px] leading-[1.9]">
        <span className="opacity-50">{"{"}</span>
        {"\n"}
        {lines.slice(0, visible).map(([key, value], index) => (
          <span key={key} className="block pl-4">
            <span className="text-[color-mix(in_oklab,var(--t-accent)_70%,var(--t-bg))]">
              &quot;{key}&quot;
            </span>
            <span className="opacity-50">: </span>
            <span>&quot;{value}&quot;</span>
            {index < lines.length - 1 && <span className="opacity-50">,</span>}
          </span>
        ))}
        <span className="opacity-50">{visible >= lines.length ? "}" : ""}</span>
      </pre>
    </div>
  );
}

export default function Syntax({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const mono = "font-[family-name:var(--t-mono)]";
  const display = "font-[family-name:var(--t-display)]";
  const card =
    "rounded-[18px] border border-[color-mix(in_oklab,var(--t-fg)_10%,transparent)] bg-[var(--t-surface)]";
  const comment = `${mono} text-[13px] text-[var(--t-muted)]`;

  const files: Array<[id: string, file: string, shown: boolean]> = [
    ["about", "README.md", has("about")],
    ["skills", "package.json", has("skills")],
    ["projects", "projects/", has("projects")],
    ["experience", "git log", has("experience")],
    ["education", "education.md", has("education") || has("highlights")],
    ["contact", "contact.sh", has("contact")],
  ];
  const profile: Array<[string, string]> = [
    ["name", c.name ?? ""],
    ["role", c.professional_title ?? ""],
    ["location", c.location ?? ""],
    ["stack", (c.skills ?? []).slice(0, 4).join(", ")],
    ["status", c.availability ?? ""],
  ].filter(([, value]) => value) as Array<[string, string]>;

  return (
    <StudioRoot studio={studio} className="text-[16px] leading-[1.65]">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .syntax-caret { animation: syntax-blink 1s steps(1) infinite; }
        }
        @keyframes syntax-blink { 50% { opacity: 0; } }
        [data-static] .syntax-caret { display: none; }
      `}</style>
      {/* A faint dotted paper behind everything */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background-image:radial-gradient(color-mix(in_oklab,var(--t-fg)_14%,transparent)_1px,transparent_1px)] [background-size:22px_22px]"
      />

      <div className="mx-auto grid max-w-[80rem] gap-0 @4xl:grid-cols-[15rem_1fr]">
        {/* ——— File tree: the navigation (sticky, not fixed) ——— */}
        <aside className="border-b border-[color-mix(in_oklab,var(--t-fg)_10%,transparent)] px-5 py-4 @4xl:sticky @4xl:top-0 @4xl:self-start @4xl:border-b-0 @4xl:border-r @4xl:py-8">
          <p className={`${mono} text-[12px] uppercase tracking-[0.18em] text-[var(--t-muted)]`}>
            {(c.name ?? "portfolio").toLowerCase().replace(/\s+/g, "-")}/
          </p>
          <nav
            aria-label="Sections"
            className={`${mono} mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] @4xl:block`}
          >
            {files
              .filter(([, , shown]) => shown)
              .map(([id, file]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="block rounded-md px-1 py-1 opacity-75 transition hover:bg-[color-mix(in_oklab,var(--t-accent)_12%,transparent)] hover:opacity-100 @4xl:px-2"
                >
                  <span className="text-[var(--t-accent)]">›</span> {file}
                </a>
              ))}
          </nav>
          {c.availability && (
            <p
              className={`${mono} mt-6 hidden rounded-xl bg-[color-mix(in_oklab,var(--t-accent)_10%,transparent)] px-3 py-2 text-[12px] leading-snug @4xl:block`}
              {...ed("availability")}
            >
              <span className="mr-1.5 inline-block size-2 rounded-full bg-[#22c55e]" />
              {c.availability}
            </p>
          )}
        </aside>

        <div className="min-w-0 px-5 pb-16 @3xl:px-10">
          {/* ——— Hero: whoami, the name typed, and the terminal ——— */}
          <section className="grid items-center gap-10 pb-14 pt-10 @3xl:pt-16 @5xl:grid-cols-[1.15fr_1fr]">
            <div>
              <p className={comment}>$ whoami</p>
              <h1
                className={`${display} mt-2 text-[clamp(2.8rem,7.4cqw,5.6rem)] font-bold leading-[0.95] tracking-[-0.04em]`}
                {...ed("name")}
              >
                <Typed text={c.name ?? ""} />
              </h1>
              <p className={`${mono} mt-4 text-[15px] text-[var(--t-accent)]`} {...ed("professional_title")}>
                {c.professional_title}
                {c.location && <span className="text-[var(--t-muted)]"> @ {c.location}</span>}
              </p>
              {c.tagline && (
                <p
                  className="mt-5 max-w-[36rem] text-[clamp(1.2rem,2.4cqw,1.5rem)] leading-snug"
                  {...ed("tagline")}
                >
                  {c.tagline}
                </p>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                {has("projects") && (
                  <a
                    href="#projects"
                    className="rounded-xl bg-[var(--t-fg)] px-5 py-3 font-semibold text-[var(--t-bg)] transition-transform hover:-translate-y-0.5"
                  >
                    See my work
                  </a>
                )}
                {c.github && (
                  <a
                    href={c.github}
                    {...external(c.github)}
                    className={`${mono} rounded-xl border border-[color-mix(in_oklab,var(--t-fg)_18%,transparent)] px-5 py-3 text-[14px]`}
                    {...ed("github")}
                  >
                    GitHub ↗
                  </a>
                )}
                {c.linkedin && (
                  <a
                    href={c.linkedin}
                    {...external(c.linkedin)}
                    className={`${mono} rounded-xl border border-[color-mix(in_oklab,var(--t-fg)_18%,transparent)] px-5 py-3 text-[14px]`}
                    {...ed("linkedin")}
                  >
                    LinkedIn ↗
                  </a>
                )}
              </div>
            </div>
            {profile.length > 0 && <Terminal lines={profile} />}
          </section>

          {/* ——— README ——— */}
          {has("about") && (
            <section
              id="about"
              className="scroll-mt-6 border-t border-[color-mix(in_oklab,var(--t-fg)_10%,transparent)] py-12"
            >
              <p className={comment}># README.md</p>
              <h2 className={`${display} mt-2 text-[clamp(1.9rem,4cqw,2.8rem)] font-bold tracking-[-0.03em]`}>
                {label("about", "About me")}
              </h2>
              <div className="mt-5 max-w-[44rem] space-y-4 text-[1.06rem] opacity-90">
                {paragraphs(c).map(({ text, index }) => (
                  <p key={index} className="pretty" {...ed(`summary.${index}`)}>
                    {text}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* ——— Skills as installed packages ——— */}
          {has("skills") && (
            <section
              id="skills"
              className="scroll-mt-6 border-t border-[color-mix(in_oklab,var(--t-fg)_10%,transparent)] py-12"
            >
              <p className={comment}>$ npm ls --depth=0</p>
              <h2 className={`${display} mt-2 text-[clamp(1.9rem,4cqw,2.8rem)] font-bold tracking-[-0.03em]`}>
                {label("skills", "Stack")}
              </h2>
              <ul
                className={`${mono} mt-6 grid gap-2 text-[14px] @2xl:grid-cols-2 @4xl:grid-cols-3`}
                {...ed("skills")}
              >
                {(c.skills ?? []).map((skill, index) => (
                  <li key={skill} className={`${card} flex items-center justify-between px-4 py-2.5`}>
                    <span>
                      <span className="text-[var(--t-muted)]">
                        {index === (c.skills ?? []).length - 1 ? "└─" : "├─"}
                      </span>{" "}
                      {skill}
                    </span>
                    <span className="text-[11px] text-[var(--t-accent)]">installed</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ——— Projects ——— */}
          {has("projects") && (
            <section
              id="projects"
              className="scroll-mt-6 border-t border-[color-mix(in_oklab,var(--t-fg)_10%,transparent)] py-12"
            >
              <p className={comment}>$ ls projects/</p>
              <h2 className={`${display} mt-2 text-[clamp(1.9rem,4cqw,2.8rem)] font-bold tracking-[-0.03em]`}>
                {label("projects", "Projects")}
              </h2>
              <div className="mt-6 grid gap-5 @3xl:grid-cols-2">
                {(c.projects ?? []).map((project, index) => (
                  <Reveal key={index} delay={(index % 2) * 80}>
                    <article
                      className={`${card} flex h-full flex-col overflow-hidden`}
                      {...ed(`projects.${index}`)}
                    >
                      {project.image ? (
                        <Picture
                          src={project.image}
                          alt={project.title ?? ""}
                          embedded={embedded}
                          className="aspect-[16/9] w-full"
                        />
                      ) : (
                        // A gradient card with the project's initials until a screenshot is added.
                        <div
                          aria-hidden
                          className={`${display} grid aspect-[16/9] place-items-center text-[3rem] font-bold text-[var(--t-bg)]`}
                          style={{
                            background: `linear-gradient(${120 + index * 40}deg, var(--t-accent), color-mix(in oklab, var(--t-accent) 40%, var(--t-fg)))`,
                          }}
                        >
                          {(project.title ?? "").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-1 flex-col p-6">
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className={`${display} text-[1.35rem] font-bold leading-tight`}>
                            {project.title}
                          </h3>
                          {project.year && (
                            <span className={`${mono} text-[12px] text-[var(--t-muted)]`}>
                              {project.year}
                            </span>
                          )}
                        </div>
                        {project.description && (
                          <p className="mt-2 text-[15px] opacity-80">{project.description}</p>
                        )}
                        {(project.technologies ?? []).length > 0 && (
                          <p className={`${mono} mt-3 text-[12px] text-[var(--t-accent)]`}>
                            {(project.technologies ?? []).join(" · ")}
                          </p>
                        )}
                        <div className="mt-auto flex gap-2 pt-5">
                          {project.live_url && (
                            <a
                              href={project.live_url}
                              {...external(project.live_url)}
                              className="rounded-lg bg-[var(--t-fg)] px-4 py-2 text-[13px] font-semibold text-[var(--t-bg)]"
                            >
                              Live ↗
                            </a>
                          )}
                          {project.github && (
                            <a
                              href={project.github}
                              {...external(project.github)}
                              className={`${mono} rounded-lg border border-[color-mix(in_oklab,var(--t-fg)_18%,transparent)] px-4 py-2 text-[13px]`}
                            >
                              Code ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          {/* ——— Experience as a commit log ——— */}
          {has("experience") && (
            <section
              id="experience"
              className="scroll-mt-6 border-t border-[color-mix(in_oklab,var(--t-fg)_10%,transparent)] py-12"
            >
              <p className={comment}>$ git log --career</p>
              <h2 className={`${display} mt-2 text-[clamp(1.9rem,4cqw,2.8rem)] font-bold tracking-[-0.03em]`}>
                {label("experience", "Experience")}
              </h2>
              <ol className="relative mt-6 space-y-6 border-l-2 border-dashed border-[color-mix(in_oklab,var(--t-accent)_45%,transparent)] pl-6">
                {(c.experience ?? []).map((job, index) => (
                  <li key={index} className="relative" {...ed(`experience.${index}`)}>
                    <span className="absolute -left-[33px] top-1.5 size-4 rounded-full border-[3px] border-[var(--t-bg)] bg-[var(--t-accent)]" />
                    <p className={`${mono} text-[12px] text-[var(--t-muted)]`}>
                      {[job.start_date, job.end_date].filter(Boolean).join(" → ")}
                    </p>
                    <p className={`${display} text-[1.2rem] font-bold`}>
                      {job.job_title}
                      {job.company && (
                        <span className="font-normal text-[var(--t-muted)]"> @ {job.company}</span>
                      )}
                    </p>
                    {job.description && (
                      <p className="mt-1 max-w-[46rem] text-[15px] opacity-80">{job.description}</p>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* ——— Education, certificates and talks ——— */}
          {(has("education") || has("highlights")) && (
            <section
              id="education"
              className="scroll-mt-6 border-t border-[color-mix(in_oklab,var(--t-fg)_10%,transparent)] py-12"
            >
              <p className={comment}># education.md · CHANGELOG</p>
              <h2 className={`${display} mt-2 text-[clamp(1.9rem,4cqw,2.8rem)] font-bold tracking-[-0.03em]`}>
                {label("education", "Education & certificates")}
              </h2>
              <div className="mt-6 grid gap-4 @3xl:grid-cols-2">
                {(c.education ?? []).map((item, index) => (
                  <div key={`e${index}`} className={`${card} p-5`} {...ed(`education.${index}`)}>
                    <p className={`${mono} text-[12px] text-[var(--t-muted)]`}>
                      {[item.start_date, item.end_date].filter(Boolean).join(" → ")}
                    </p>
                    <p className={`${display} mt-1 text-[1.1rem] font-bold`}>{item.degree}</p>
                    <p className="text-[14px] opacity-75">{item.school}</p>
                  </div>
                ))}
                {(c.highlights ?? []).map((item, index) => {
                  const inner = (
                    <>
                      <p className={`${mono} text-[12px] text-[var(--t-accent)]`}>v{item.year}</p>
                      <p className={`${display} mt-1 text-[1.1rem] font-bold`}>{item.title}</p>
                      {item.detail && <p className="text-[14px] opacity-75">{item.detail}</p>}
                    </>
                  );
                  return item.url ? (
                    <a
                      key={`h${index}`}
                      href={item.url}
                      {...external(item.url)}
                      className={`${card} block p-5 transition hover:-translate-y-0.5`}
                      {...ed(`highlights.${index}`)}
                    >
                      {inner}
                    </a>
                  ) : (
                    <div key={`h${index}`} className={`${card} p-5`} {...ed(`highlights.${index}`)}>
                      {inner}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ——— Contact ——— */}
          {has("contact") && (
            <section
              id="contact"
              className="scroll-mt-6 border-t border-[color-mix(in_oklab,var(--t-fg)_10%,transparent)] py-12"
            >
              <p className={comment}>$ ./contact.sh</p>
              <h2
                className={`${display} mt-2 text-[clamp(2.2rem,5cqw,3.6rem)] font-bold leading-none tracking-[-0.04em]`}
              >
                Let’s build something.
              </h2>
              <div className="mt-8 flex flex-wrap gap-3">
                {c.email && (
                  <a
                    href={`mailto:${c.email}`}
                    className="rounded-xl bg-[var(--t-accent)] px-6 py-3.5 font-semibold text-[var(--t-bg)] transition-transform hover:-translate-y-0.5"
                    {...ed("email")}
                  >
                    {c.email}
                  </a>
                )}
                {contactLinks(c)
                  .filter((link) => !/^mailto:/.test(link.url))
                  .map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      {...external(link.url)}
                      className={`${mono} rounded-xl border border-[color-mix(in_oklab,var(--t-fg)_18%,transparent)] px-5 py-3.5 text-[14px]`}
                    >
                      {link.label} ↗
                    </a>
                  ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </StudioRoot>
  );
}

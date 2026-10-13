"use client";

import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/inter-tight";
import "@fontsource/vt323";
import "@fontsource/ibm-plex-mono/400.css";
import { useState } from "react";
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

/**
 * Terminal: the portfolio as a real desktop terminal window. A soft, shaded
 * desktop behind a window with a title bar, tabs, a file explorer, and a
 * status bar; inside, each section is a command and its output.
 * Light by default (Daylight); the dark CRT palettes still work.
 */

/** A deterministic short hash, so each job gets a stable commit id. */
const hash = (text: string) => {
  let h = 2166136261;
  for (const char of text) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 7);
};

const handle = (name?: string) =>
  (name ?? "you")
    .toLowerCase()
    .split(/\s+/)[0]!
    .replace(/[^a-z0-9]/g, "") || "you";

const slug = (text: string) => text.toLowerCase().replace(/\s+/g, "-");

const initials = (name?: string) =>
  (name ?? "?")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* Shading shared by the window and its panels: a hairline, a lift and a long soft shadow. */
const WINDOW_SHADOW =
  "shadow-[0_0_0_1px_var(--t-rule),0_1px_0_0_color-mix(in_oklab,white_60%,transparent)_inset,0_2px_4px_-2px_rgb(0_0_0/0.08),0_24px_60px_-18px_rgb(0_0_0/0.28),0_60px_120px_-40px_rgb(0_0_0/0.22)]";
const PANEL_SHADOW =
  "shadow-[0_0_0_1px_var(--t-rule),0_1px_2px_rgb(0_0_0/0.05),0_12px_28px_-14px_rgb(0_0_0/0.22)]";

function Prompt({ user, host, command }: { user: string; host: string; command: string }) {
  return (
    <p className="fm text-[0.88rem]">
      <span className="ta font-semibold">{user}</span>
      <span className="tm">@{host}</span>
      <span className="tm"> ~/portfolio </span>
      <span className="ta">❯</span> <span>{command}</span>
    </p>
  );
}

/** One section of the session: a prompt, then its output. */
function Block({
  id,
  user,
  host,
  command,
  children,
}: {
  id?: string;
  user: string;
  host: string;
  command: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-16 border-t rule pt-8 first:border-t-0 first:pt-0">
      <Prompt user={user} host={host} command={command} />
      <div className="mt-5">{children}</div>
    </section>
  );
}

function TrafficLights() {
  return (
    <span className="flex gap-2">
      {["#ff5f57", "#febc2e", "#28c840"].map((colour) => (
        <span
          key={colour}
          className="size-3 rounded-full shadow-[inset_0_-1px_1px_rgb(0_0_0/0.18),inset_0_1px_1px_rgb(255_255_255/0.55),0_0_0_0.5px_rgb(0_0_0/0.18)]"
          style={{ background: colour }}
        />
      ))}
    </span>
  );
}

export default function Terminal({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const [active, setActive] = useState(0);
  const user = handle(c.name);
  const host =
    (c.location ?? "home")
      .split(/[,·]/)[0]!
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, "") || "home";
  const projects = c.projects ?? [];
  const current = projects[Math.min(active, Math.max(projects.length - 1, 0))];
  const skills = c.skills ?? [];
  const jobs = c.experience ?? [];

  // The explorer and the tabs: one file per section that has content.
  const files = [
    has("about") && { href: "#about", name: `${slug(label("about", "about"))}.md`, icon: "M" },
    has("projects") && { href: "#work", name: `${slug(label("projects", "projects"))}/`, icon: "▸" },
    has("experience") && { href: "#log", name: "career.log", icon: "≡" },
    has("skills") && { href: "#stack", name: "stack.json", icon: "{}" },
    has("highlights") && { href: "#talks", name: `${slug(label("highlights", "talks"))}.log`, icon: "≡" },
    has("contact") && { href: "#contact", name: "contact.sh", icon: "$" },
  ].filter(Boolean) as Array<{ href: string; name: string; icon: string }>;

  // The neofetch-style card beside the name.
  const facts = [
    ["role", c.professional_title],
    ["based", c.location],
    ["uptime", jobs.length ? `${jobs.length} roles` : undefined],
    ["stack", skills.slice(0, 3).join(", ") || undefined],
    ["status", c.availability],
  ].filter(([, value]) => value) as Array<[string, string]>;

  return (
    <StudioRoot studio={studio} className="text-[15px] leading-relaxed">
      {/* The desktop: soft light from the top left, a faint tint of the accent. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 700px at 12% -10%, color-mix(in oklab, var(--t-accent) 14%, transparent), transparent 60%), radial-gradient(900px 600px at 100% 0%, color-mix(in oklab, var(--t-surface) 70%, transparent), transparent 70%), linear-gradient(180deg, color-mix(in oklab, var(--t-bg) 92%, white) 0%, var(--t-bg) 55%, color-mix(in oklab, var(--t-bg) 94%, black) 100%)",
        }}
      />

      <div className="mx-auto max-w-[78rem] px-3 py-6 @3xl:px-8 @3xl:py-14">
        <div className={`overflow-hidden rounded-[14px] bg-[var(--t-surface)] ${WINDOW_SHADOW}`}>
          {/* Title bar */}
          <div className="relative flex h-11 items-center gap-3 border-b rule bg-[linear-gradient(180deg,color-mix(in_oklab,var(--t-surface)_96%,white),color-mix(in_oklab,var(--t-surface)_92%,var(--t-fg)))] px-4">
            <TrafficLights />
            <span className="fm pointer-events-none absolute inset-x-0 hidden text-center text-[12px] tm @lg:block">
              {user}@{host} — ~/portfolio — zsh
            </span>
          </div>

          {/* Tabs */}
          <nav
            aria-label="Sections"
            className="fm flex overflow-x-auto border-b rule bg-[color-mix(in_oklab,var(--t-surface)_94%,var(--t-fg))] text-[12px] [scrollbar-width:none]"
          >
            {files.map((file, index) => (
              <a
                key={file.href}
                href={file.href}
                className={`shrink-0 border-r rule px-4 py-2 hover-a ${index === 0 ? "bg-[var(--t-surface)] text-[var(--t-fg)] shadow-[inset_0_2px_0_var(--t-accent)]" : "tm"}`}
              >
                {file.name}
              </a>
            ))}
          </nav>

          <div className="grid @4xl:grid-cols-[13.5rem_minmax(0,1fr)]">
            {/* Explorer */}
            <aside className="fm hidden border-r rule bg-[color-mix(in_oklab,var(--t-surface)_96%,var(--t-fg))] px-3 py-5 text-[12.5px] @4xl:block">
              <p className="px-2 text-[10.5px] uppercase tracking-[0.16em] tm">Explorer</p>
              <p className="mt-3 px-2 font-semibold">▾ portfolio</p>
              <ul className="mt-1 space-y-0.5">
                {files.map((file) => (
                  <li key={file.href}>
                    <a
                      href={file.href}
                      className="flex items-center gap-2 rounded-md py-1 pl-6 pr-2 hover:bg-[color-mix(in_oklab,var(--t-accent)_10%,transparent)]"
                    >
                      <span className="w-4 text-center text-[10px] ta">{file.icon}</span>
                      {file.name}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>

            <main className="min-w-0 space-y-12 px-5 py-8 @3xl:px-10 @3xl:py-10">
              {/* whoami */}
              <section>
                <Prompt user={user} host={host} command="whoami" />
                <div className="mt-6 grid gap-8 @4xl:grid-cols-[minmax(0,1fr)_19rem] @4xl:items-start">
                  <div className="min-w-0">
                    <h1
                      className="fd text-[clamp(2.6rem,7.5cqw,5.4rem)] font-semibold leading-[0.98] tracking-[-0.035em]"
                      {...ed("name")}
                    >
                      {c.name}
                    </h1>
                    <p className="fm mt-4 text-[0.98rem]">
                      <span className="ta"># </span>
                      <span {...ed("professional_title")}>{c.professional_title}</span>
                    </p>
                    {c.tagline && (
                      <p
                        className="mt-5 max-w-[40rem] text-[1.2rem] leading-snug pretty tm"
                        {...ed("tagline")}
                      >
                        {c.tagline}
                      </p>
                    )}
                    {c.availability && (
                      <p
                        className="fm mt-6 inline-flex items-center gap-2 rounded-full bg-[color-mix(in_oklab,var(--t-accent)_12%,transparent)] px-3 py-1 text-[12px] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--t-accent)_30%,transparent)]"
                        {...ed("availability")}
                      >
                        <span className="relative flex size-2">
                          <span className="absolute inset-0 animate-ping rounded-full ba opacity-60" />
                          <span className="relative size-2 rounded-full ba" />
                        </span>
                        {c.availability}
                      </p>
                    )}
                  </div>

                  {/* neofetch */}
                  <div
                    className={`fm rounded-xl bg-[color-mix(in_oklab,var(--t-surface)_92%,var(--t-fg))] p-4 text-[12px] ${PANEL_SHADOW}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 place-items-center rounded-lg bg-[linear-gradient(135deg,var(--t-accent),color-mix(in_oklab,var(--t-accent)_55%,black))] text-[15px] font-bold text-[var(--t-surface)] shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_6px_14px_-6px_var(--t-accent)]">
                        {initials(c.name)}
                      </span>
                      <span>
                        <span className="ta font-semibold">{user}</span>
                        <span className="tm">@{host}</span>
                        <span className="block tm">
                          {"-".repeat(Math.min(18, user.length + host.length + 1))}
                        </span>
                      </span>
                    </div>
                    <dl className="mt-3 grid grid-cols-[4.5rem_minmax(0,1fr)] gap-y-1">
                      {facts.map(([key, value]) => (
                        <div key={key} className="contents">
                          <dt className="ta">{key}</dt>
                          <dd className="truncate">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-3 flex gap-1" aria-hidden>
                      {[100, 80, 60, 40, 25, 12].map((mix) => (
                        <span
                          key={mix}
                          className="h-3 flex-1 rounded-[3px]"
                          style={{
                            background: `color-mix(in oklab, var(--t-accent) ${mix}%, var(--t-surface))`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {has("about") && (
                <Block id="about" user={user} host={host} command={`cat ${files[0]?.name ?? "about.md"}`}>
                  <div className="max-w-[44rem] space-y-4 text-[1.02rem]">
                    {paragraphs(c).map(({ text, index }) => (
                      <p key={index} className="pretty" {...ed(`summary.${index}`)}>
                        {text}
                      </p>
                    ))}
                  </div>
                </Block>
              )}

              {has("projects") && (
                <Block
                  id="work"
                  user={user}
                  host={host}
                  command={`ls -la ~/${slug(label("projects", "projects"))}`}
                >
                  <p className="fm text-[12.5px] tm">total {projects.length}</p>
                  <div className="mt-3 grid gap-6 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
                    <ul className="min-w-0 space-y-1.5">
                      {projects.map((project, index) => (
                        <li key={index}>
                          <button
                            type="button"
                            onMouseEnter={() => setActive(index)}
                            onFocus={() => setActive(index)}
                            onClick={() => setActive(index)}
                            className={`w-full rounded-lg px-3 py-2.5 text-left transition-[background,box-shadow] ${index === active ? `bg-[color-mix(in_oklab,var(--t-accent)_9%,var(--t-surface))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--t-accent)_35%,transparent)]` : "hover:bg-[color-mix(in_oklab,var(--t-fg)_4%,transparent)]"}`}
                            {...ed(`projects.${index}`)}
                          >
                            <span className="fm flex items-baseline gap-3 text-[13px]">
                              <span className="hidden tm @xl:inline">drwxr-xr-x</span>
                              <span className="tm">{project.year ?? "----"}</span>
                              <span
                                className={`min-w-0 truncate font-semibold ${index === active ? "ta" : ""}`}
                              >
                                {project.title}/
                              </span>
                            </span>
                            {project.description && (
                              <span className="mt-1 block text-[13.5px] leading-snug tm pretty">
                                {project.description}
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>

                    {current && (
                      <Reveal className="min-w-0 self-start @4xl:sticky @4xl:top-6">
                        {/* The selected project, in its own small window */}
                        <div className={`overflow-hidden rounded-xl bg-[var(--t-surface)] ${PANEL_SHADOW}`}>
                          <div className="flex h-8 items-center gap-3 border-b rule bg-[color-mix(in_oklab,var(--t-surface)_93%,var(--t-fg))] px-3">
                            <TrafficLights />
                            <span className="fm truncate text-[11px] tm">{current.title}</span>
                          </div>
                          <Picture
                            src={current.image}
                            alt={current.title ?? "Project"}
                            embedded={embedded}
                            className="aspect-[16/10] w-full"
                            edit={`projects.${active}`}
                          />
                        </div>
                        <dl className="fm mt-4 grid grid-cols-[5rem_1fr] gap-y-1 text-[12.5px]">
                          {current.role && (
                            <>
                              <dt className="tm">role</dt>
                              <dd>{current.role}</dd>
                            </>
                          )}
                          {current.client && (
                            <>
                              <dt className="tm">client</dt>
                              <dd>{current.client}</dd>
                            </>
                          )}
                          {!!current.technologies?.length && (
                            <>
                              <dt className="tm">stack</dt>
                              <dd className="flex flex-wrap gap-1.5">
                                {current.technologies.map((tech) => (
                                  <span
                                    key={tech}
                                    className="rounded-md bg-[color-mix(in_oklab,var(--t-fg)_6%,transparent)] px-1.5 py-px"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </dd>
                            </>
                          )}
                        </dl>
                        <p className="fm mt-3 flex gap-5 text-[12.5px]">
                          {current.live_url && (
                            <a
                              href={current.live_url}
                              {...external(current.live_url)}
                              className="ta underline"
                            >
                              open ↗
                            </a>
                          )}
                          {current.github && (
                            <a href={current.github} {...external(current.github)} className="ta underline">
                              source ↗
                            </a>
                          )}
                        </p>
                      </Reveal>
                    )}
                  </div>
                </Block>
              )}

              {has("experience") && (
                <Block id="log" user={user} host={host} command="git log --graph --oneline career">
                  <ol>
                    {jobs.map((job, index) => (
                      <li
                        key={index}
                        className="grid grid-cols-[1.5rem_1fr] gap-x-3"
                        {...ed(`experience.${index}`)}
                      >
                        <span className="relative flex justify-center">
                          <span className="absolute inset-y-0 w-[2px] bg-[linear-gradient(var(--t-accent),color-mix(in_oklab,var(--t-accent)_25%,transparent))]" />
                          <span
                            className={`relative mt-[7px] size-3 rounded-full ${index === 0 ? "ba shadow-[0_0_0_4px_color-mix(in_oklab,var(--t-accent)_22%,transparent)]" : "border-2 border-[var(--t-accent)] bg-[var(--t-surface)]"}`}
                          />
                        </span>
                        <div className="pb-8">
                          <p className="fm text-[13.5px]">
                            <span className="ta">{hash(`${job.company}${job.job_title}`)}</span>{" "}
                            {index === 0 && (
                              <span className="rounded bg-[color-mix(in_oklab,var(--t-accent)_14%,transparent)] px-1.5 text-[11px] ta">
                                HEAD → main
                              </span>
                            )}
                          </p>
                          <p className="mt-1 text-[1.05rem]">
                            <span className="font-semibold">{job.job_title}</span>
                            <span className="tm"> @ </span>
                            {job.company}
                          </p>
                          <p className="fm text-[12px] tm">
                            {[job.start_date, job.end_date].filter(Boolean).join(" → ")}
                            {job.location && ` · ${job.location}`}
                          </p>
                          {job.description && (
                            <p className="mt-2 max-w-[44rem] text-[14px] pretty tm">{job.description}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </Block>
              )}

              {has("skills") && (
                <Block id="stack" user={user} host={host} command="cat stack.json">
                  {/* Skills as a syntax-highlighted file, with line numbers */}
                  <pre
                    className={`fm overflow-x-auto rounded-xl bg-[color-mix(in_oklab,var(--t-surface)_93%,var(--t-fg))] py-4 text-[13px] leading-[1.75] ${PANEL_SHADOW}`}
                    {...ed("skills")}
                  >
                    <code className="grid grid-cols-[2.5rem_1fr]">
                      {[
                        <>{"{"}</>,
                        <>
                          {"  "}
                          <span className="ta">&quot;stack&quot;</span>: [
                        </>,
                        ...skills.map((skill, index) => (
                          <>
                            {"    "}
                            <span className="text-[color-mix(in_oklab,var(--t-accent)_55%,var(--t-fg))]">
                              &quot;{skill}&quot;
                            </span>
                            {index < skills.length - 1 ? "," : ""}
                          </>
                        )),
                        <>{"  ]"}</>,
                        <>{"}"}</>,
                      ].map((line, index) => (
                        <span key={index} className="contents">
                          <span className="select-none pr-4 text-right tm opacity-60">{index + 1}</span>
                          <span className="whitespace-pre">{line}</span>
                        </span>
                      ))}
                    </code>
                  </pre>
                </Block>
              )}

              {has("highlights") && (
                <Block
                  id="talks"
                  user={user}
                  host={host}
                  command={`tail -n ${(c.highlights ?? []).length} ${slug(label("highlights", "talks"))}.log`}
                >
                  <ul className="space-y-2 text-[14px]">
                    {(c.highlights ?? []).map((item, index) => (
                      <li key={index} className="flex gap-3" {...ed(`highlights.${index}`)}>
                        <span className="fm shrink-0 rounded bg-[color-mix(in_oklab,var(--t-accent)_12%,transparent)] px-1.5 text-[11.5px] leading-[1.6rem] ta">
                          {item.year ?? "INFO"}
                        </span>
                        <span className="pt-px">
                          {item.url ? (
                            <a href={item.url} {...external(item.url)} className="underline hover-a">
                              {item.title}
                            </a>
                          ) : (
                            item.title
                          )}
                          {item.detail && <span className="tm"> — {item.detail}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Block>
              )}

              {has("contact") && (
                <Block id="contact" user={user} host={host} command="./contact.sh">
                  <ul className="flex flex-wrap gap-3" {...ed("email")}>
                    {contactLinks(c).map((link) => (
                      <li key={link.url}>
                        <a
                          href={link.url}
                          {...external(link.url)}
                          className={`fm inline-flex items-center gap-2 rounded-lg bg-[var(--t-surface)] px-4 py-2.5 text-[13px] transition-transform hover:-translate-y-0.5 ${PANEL_SHADOW}`}
                        >
                          <span className="ta">→</span>
                          <span className="tm">{link.label.toLowerCase()}</span>
                          <span>{link.url.replace(/^mailto:/, "").replace(/^https?:\/\//, "")}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  <p className="fm mt-10 text-[0.88rem]">
                    <span className="ta font-semibold">{user}</span>
                    <span className="tm">@{host} ~/portfolio </span>
                    <span className="ta">❯ </span>
                    <span className="inline-block h-[1.1em] w-[0.55em] translate-y-[3px] bg-[var(--t-accent)] [animation:studio-blink_1.1s_steps(1)_infinite]" />
                  </p>
                </Block>
              )}
            </main>
          </div>

          {/* Status bar */}
          <div className="fm flex h-7 items-center gap-4 overflow-hidden whitespace-nowrap ba px-3 text-[11px] text-[var(--t-surface)]">
            <span>⎇ main</span>
            <span className="opacity-80">✓ {projects.length} projects</span>
            <span className="ml-auto hidden opacity-80 @xl:inline">{c.location}</span>
            <span className="opacity-80">UTF-8</span>
            <span className="opacity-80">zsh</span>
          </div>
        </div>
      </div>
    </StudioRoot>
  );
}

"use client";

import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/figtree";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/jetbrains-mono";
import { useEffect, useId, useRef, useState } from "react";
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
import { CountUp, Words, motionOff, scrollParent } from "../motion";

/**
 * Peek: a playful product manager's site with a mascot that watches you.
 * A short opening screen with the name, then a soft grid with glowing colour
 * and floating blocks; the mascot's eyes follow the pointer (or the phone's
 * tilt). A reading bar fills as you scroll, the numbers count up, and the work
 * sits in tabs: case studies as little browser windows that "play" on hover,
 * writing and talks, and the career so far.
 *
 * Our own design and drawing; the idea of a pointer-following mascot is
 * common on personal sites. Everything moving stops for reduced motion and in
 * still captures, and the opening screen never shows in the editor.
 */

/** Writes the scroll position of the page (0–1) to `--read` on the bar, without re-rendering. */
function useReadingProgress<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const parent = scrollParent(node);
    const update = () => {
      const top = parent instanceof Window ? window.scrollY : parent.scrollTop;
      const height =
        parent instanceof Window
          ? document.documentElement.scrollHeight - window.innerHeight
          : parent.scrollHeight - parent.clientHeight;
      node.style.setProperty("--read", String(height > 0 ? Math.min(1, top / height) : 0));
    };
    update();
    parent.addEventListener("scroll", update, { passive: true });
    return () => parent.removeEventListener("scroll", update);
  }, []);
  return ref;
}

/**
 * Points the mascot's eyes at the pointer, or follows the phone's tilt where
 * the browser shares it without asking. Writes `--lx`/`--ly` (−1 to 1).
 */
function useLookAt<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || motionOff()) return;
    const clamp = (value: number) => Math.max(-1, Math.min(1, value));
    const look = (x: number, y: number) => {
      node.style.setProperty("--lx", x.toFixed(3));
      node.style.setProperty("--ly", y.toFixed(3));
    };
    const onPointer = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy) || 1;
      // Full strength beyond 260px away; a little less when the pointer is close.
      const strength = Math.min(1, distance / 260);
      look((dx / distance) * strength, (dy / distance) * strength);
    };
    const onTilt = (event: DeviceOrientationEvent) => {
      if (event.gamma === null || event.beta === null) return;
      look(clamp(event.gamma / 30), clamp((event.beta - 45) / 30));
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("deviceorientation", onTilt);
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, []);
  return ref;
}

/**
 * The mascot: a soft round creature in the accent colour, with eyes that look
 * around and blink. `light` draws it in the page colour, for accent backgrounds.
 */
function Mascot({ className = "", light = false }: { className?: string; light?: boolean }) {
  const body = light ? "var(--t-bg)" : "var(--t-accent)";
  const ref = useLookAt<HTMLDivElement>();
  const gradient = useId();
  const eye = (cx: number) => (
    <g className="peek-eye">
      <ellipse
        cx={cx}
        cy="92"
        rx="17"
        ry="19"
        fill="#fff"
        stroke="color-mix(in oklab, var(--t-fg) 22%, transparent)"
        strokeWidth="2"
      />
      <g className="peek-pupil">
        <circle cx={cx} cy="94" r="8.5" fill="var(--t-fg)" />
        <circle cx={cx + 3} cy="90" r="2.6" fill="#fff" />
      </g>
    </g>
  );
  return (
    <div ref={ref} aria-hidden className={`peek-mascot ${className}`}>
      <svg viewBox="0 0 200 200" className="size-full overflow-visible">
        <defs>
          <radialGradient id={gradient} cx="35%" cy="30%" r="80%">
            <stop offset="0" stopColor={`color-mix(in oklab, ${body} 55%, white)`} />
            <stop offset="1" stopColor={body} />
          </radialGradient>
        </defs>
        {/* A little shadow, the ears and the body */}
        <ellipse cx="100" cy="186" rx="58" ry="8" fill="var(--t-fg)" opacity="0.08" />
        {/* Round ears, like a little bear: friendly, never horns. */}
        <circle cx="56" cy="58" r="22" fill={`url(#${gradient})`} />
        <circle cx="144" cy="58" r="22" fill={`url(#${gradient})`} />
        <circle cx="56" cy="58" r="11" fill="#fff" opacity="0.3" />
        <circle cx="144" cy="58" r="11" fill="#fff" opacity="0.3" />
        <path
          d="M100 34 C150 34 176 70 176 112 C176 156 142 178 100 178 C58 178 24 156 24 112 C24 70 50 34 100 34 Z"
          fill={`url(#${gradient})`}
        />
        {eye(76)}
        {eye(124)}
        {/* Cheeks and mouth */}
        <ellipse cx="58" cy="122" rx="10" ry="6" fill="#fff" opacity="0.35" />
        <ellipse cx="142" cy="122" rx="10" ry="6" fill="#fff" opacity="0.35" />
        <path
          d="M90 126 Q100 134 110 126"
          fill="none"
          stroke="var(--t-fg)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/** A metric like "+31% basket size" or "NPS 21 → 54" split into its number and its words. */
function metric(text?: string) {
  const match = (text ?? "").match(/^([^A-Za-z]*\d[\d.,%×x→ −+-]*)(.*)$/);
  return match ? { value: match[1]!.trim(), words: match[2]!.trim() } : { value: text ?? "", words: "" };
}

type Tab = "work" | "writing" | "career";

export default function Peek({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const progress = useReadingProgress<HTMLDivElement>();
  const tabs = (
    [
      ["work", label("projects", "Work"), has("projects")],
      ["writing", label("highlights", "Writing & talks"), has("highlights")],
      ["career", label("experience", "Career"), has("experience") || has("education")],
    ] as Array<[Tab, string, boolean]>
  ).filter(([, , shown]) => shown);
  const [tab, setTab] = useState<Tab | null>(null);
  const current = tab ?? tabs[0]?.[0] ?? null;
  const tabsId = useId();

  const display = "font-[family-name:var(--t-display)]";
  const mono = "font-[family-name:var(--t-mono)]";
  const card =
    "rounded-[28px] bg-[var(--t-surface)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_8%,transparent),0_30px_60px_-40px_color-mix(in_oklab,var(--t-accent)_60%,transparent)]";
  const primary = c.email ? `mailto:${c.email}` : c.linkedin;

  return (
    <StudioRoot studio={studio} className="text-[16px] leading-[1.6]">
      <style>{`
        .peek-pupil { transform: translate(calc(var(--lx, 0) * 7px), calc(var(--ly, 0) * 6px)); transition: transform 0.18s ease-out; }
        .peek-eye { transform-box: fill-box; transform-origin: center; }
        @media (prefers-reduced-motion: no-preference) {
          .peek-eye { animation: peek-blink 5.5s infinite; }
          .peek-float { animation: peek-float 9s ease-in-out infinite; }
          .peek-glow { animation: peek-glow 12s ease-in-out infinite alternate; }
          .peek-intro { animation: peek-intro 1.9s cubic-bezier(.7,0,.2,1) forwards; }
          .peek-intro-name { animation: peek-rise 0.9s cubic-bezier(.2,.8,.2,1) both; }
          .peek-demo img { transition: object-position 4.5s ease-in-out; }
          .peek-demo:hover img { object-position: 50% 100%; }
        }
        @keyframes peek-blink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
        @keyframes peek-float { 50% { transform: translateY(-18px) rotate(6deg); } }
        @keyframes peek-glow { to { transform: translate(8%, 6%) scale(1.15); } }
        @keyframes peek-intro { 0%, 55% { opacity: 1; visibility: visible; } 100% { opacity: 0; visibility: hidden; } }
        @keyframes peek-rise { from { transform: translateY(40%); opacity: 0; } }
        /* Without motion, and in still captures, there's no opening screen. */
        .peek-intro { opacity: 0; visibility: hidden; }
        @media (prefers-reduced-motion: no-preference) { .peek-intro { opacity: 1; visibility: visible; } }
        [data-static] .peek-intro { display: none; }
        [data-static] .peek-float, [data-static] .peek-glow, [data-static] .peek-eye { animation: none; }
      `}</style>

      {/* Opening screen: the name, then it lifts away (CSS only, so it never blocks the page). */}
      {!embedded && (
        <div
          aria-hidden
          className="peek-intro pointer-events-none absolute inset-x-0 top-0 z-50 grid h-[min(100svh,100%)] place-items-center bg-[var(--t-accent)] text-[var(--t-bg)]"
        >
          <span
            className={`peek-intro-name ${display} text-[clamp(2.4rem,9cqw,6rem)] font-bold tracking-[-0.04em]`}
          >
            {c.name}
          </span>
        </div>
      )}

      {/* Reading progress */}
      <div
        ref={progress}
        aria-hidden
        className="sticky top-0 z-40 h-[3px] w-full origin-left bg-[var(--t-accent)]"
        style={{ transform: "scaleX(var(--read, 0))" }}
      />

      {/* ——— Hero: grid, glows, floating blocks and the mascot ——— */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-60 [background-image:linear-gradient(color-mix(in_oklab,var(--t-fg)_7%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_oklab,var(--t-fg)_7%,transparent)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(black,transparent_92%)]"
        />
        <div
          aria-hidden
          className="peek-glow absolute -left-[15%] -top-[25%] -z-10 size-[70cqw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--t-accent)_35%,transparent),transparent)] blur-2xl"
        />
        <div
          aria-hidden
          className="peek-glow absolute -right-[10%] top-[10%] -z-10 size-[55cqw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--t-accent)_18%,#8fd3ff_22%),transparent)] blur-2xl [animation-delay:-6s]"
        />
        <span
          aria-hidden
          className="peek-float absolute left-[6%] top-[62%] -z-10 size-10 rounded-xl bg-[var(--t-accent)] opacity-70"
        />
        <span
          aria-hidden
          className="peek-float absolute right-[38%] top-[14%] -z-10 size-6 rounded-full bg-[#ffd166] [animation-delay:-3s]"
        />
        <span
          aria-hidden
          className="peek-float absolute bottom-[12%] right-[8%] -z-10 size-14 rotate-12 rounded-2xl border-[3px] border-[var(--t-fg)] opacity-15 [animation-delay:-5s]"
        />

        <header className="mx-auto flex max-w-[76rem] items-center justify-between gap-4 px-5 py-6 @3xl:px-10">
          <span className={`${display} text-[1.05rem] font-bold tracking-[-0.02em]`}>
            {firstName(c.name) || c.name}
            <span className="text-[var(--t-accent)]">.</span>
          </span>
          {primary && (
            <a
              href={primary}
              {...external(primary)}
              className="rounded-full bg-[var(--t-fg)] px-4 py-2 text-[13px] font-medium text-[var(--t-bg)] transition-transform hover:-translate-y-0.5"
            >
              Say hello
            </a>
          )}
        </header>

        <div className="mx-auto grid max-w-[76rem] items-center gap-10 px-5 pb-20 pt-8 @3xl:px-10 @4xl:grid-cols-[1.4fr_1fr] @4xl:pb-28">
          <div>
            {c.availability && (
              <p
                className={`${mono} inline-flex items-center gap-2 rounded-full bg-[var(--t-surface)] px-3.5 py-1.5 text-[12px] shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_10%,transparent)]`}
                {...ed("availability")}
              >
                <span className="size-2 rounded-full bg-[#22c55e]" />
                {c.availability}
              </p>
            )}
            <h1
              className={`${display} mt-6 text-[clamp(3rem,9cqw,6.6rem)] font-bold leading-[0.92] tracking-[-0.05em]`}
              {...ed("name")}
            >
              <Words text={c.name} />
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
                className={`${display} mt-6 max-w-[36rem] text-[clamp(1.35rem,2.8cqw,1.9rem)] font-medium leading-snug tracking-[-0.02em]`}
                {...ed("tagline")}
              >
                <Words text={c.tagline} delay={250} step={45} />
              </p>
            )}
          </div>
          <div className="relative mx-auto w-full max-w-[22rem]">
            <Mascot className="mx-auto aspect-square w-[58%] @3xl:w-[78%]" />
            {c.avatar && (
              <div
                className={`${card} absolute -bottom-4 -left-2 size-24 overflow-hidden p-1.5 @3xl:size-28`}
                {...ed("avatar")}
              >
                <Picture
                  src={c.avatar}
                  alt={c.name ?? ""}
                  embedded={embedded}
                  className="size-full rounded-[22px]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Numbers that count up */}
        {has("stats") && (
          <dl className="mx-auto grid max-w-[76rem] grid-cols-2 gap-3 px-5 pb-16 @3xl:grid-cols-3 @3xl:px-10">
            {(c.stats ?? []).slice(0, 3).map((stat, index) => (
              <div key={index} className={`${card} px-6 py-5`} {...ed(`stats.${index}`)}>
                <dd
                  className={`${display} text-[clamp(2rem,4.6cqw,3.2rem)] font-bold leading-none tracking-[-0.04em]`}
                >
                  <CountUp value={stat.value} />
                </dd>
                <dt className="mt-2 text-[13px] opacity-65">{stat.label}</dt>
              </div>
            ))}
          </dl>
        )}
      </section>

      {/* ——— About and toolkit ——— */}
      {(has("about") || has("skills")) && (
        <section className="mx-auto grid max-w-[76rem] gap-10 px-5 py-14 @3xl:px-10 @4xl:grid-cols-[1.4fr_1fr]">
          {has("about") && (
            <Reveal>
              <h2 className={`${display} text-[clamp(2rem,4.8cqw,3.2rem)] font-bold tracking-[-0.04em]`}>
                {label("about", "Hi, nice to meet you")}
              </h2>
              <div className="mt-5 space-y-4 text-[1.08rem] opacity-85">
                {paragraphs(c).map(({ text, index }) => (
                  <p key={index} className="pretty" {...ed(`summary.${index}`)}>
                    {text}
                  </p>
                ))}
              </div>
            </Reveal>
          )}
          {has("skills") && (
            <div className={`${card} self-start p-7`} {...ed("skills")}>
              <p className={`${mono} text-[11px] uppercase tracking-[0.18em] opacity-60`}>Good at</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(c.skills ?? []).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-[color-mix(in_oklab,var(--t-accent)_12%,transparent)] px-3 py-1.5 text-[13.5px] font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ——— Tabs: work, writing, career ——— */}
      {tabs.length > 0 && current && (
        <section id="work" className="mx-auto max-w-[76rem] px-5 py-14 @3xl:px-10">
          <div
            role="tablist"
            aria-label="Portfolio"
            className="inline-flex flex-wrap gap-1 rounded-full bg-[var(--t-surface)] p-1.5 shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_8%,transparent)]"
          >
            {tabs.map(([id, name]) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`${tabsId}-${id}`}
                aria-selected={current === id}
                aria-controls={`${tabsId}-${id}-panel`}
                onClick={() => setTab(id)}
                className={`rounded-full px-5 py-2 text-[14px] font-medium transition-colors ${current === id ? "bg-[var(--t-fg)] text-[var(--t-bg)]" : "opacity-70 hover:opacity-100"}`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Case studies as little browser windows that "play" on hover */}
          {has("projects") && (
            <div
              role="tabpanel"
              id={`${tabsId}-work-panel`}
              aria-labelledby={`${tabsId}-work`}
              hidden={current !== "work"}
              className="mt-10 grid gap-6 @3xl:grid-cols-2"
            >
              {(c.projects ?? []).map((item, index) => {
                const { value, words } = metric(item.category);
                const link = item.live_url || item.github;
                return (
                  <article key={index} className={`${card} overflow-hidden`} {...ed(`projects.${index}`)}>
                    <div className="peek-demo m-3 overflow-hidden rounded-[20px] bg-[var(--t-bg)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_10%,transparent)]">
                      <div className="flex items-center gap-1.5 px-3 py-2.5">
                        <span className="size-2.5 rounded-full bg-[#ff6b6b]" />
                        <span className="size-2.5 rounded-full bg-[#ffd166]" />
                        <span className="size-2.5 rounded-full bg-[#06d6a0]" />
                        <span className={`${mono} ml-2 truncate text-[11px] opacity-50`}>
                          {pad(index + 1)} · {item.client || item.title}
                        </span>
                      </div>
                      <Picture
                        src={item.image}
                        alt={item.title ?? ""}
                        embedded={embedded}
                        className="aspect-[16/10] w-full object-top"
                      />
                    </div>
                    <div className="px-6 pb-7 pt-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <h3 className={`${display} text-[1.5rem] font-bold leading-tight tracking-[-0.03em]`}>
                          {item.title}
                        </h3>
                        {item.year && <span className={`${mono} text-[12px] opacity-55`}>{item.year}</span>}
                      </div>
                      {item.role && <p className="mt-1 text-[14px] opacity-65">{item.role}</p>}
                      {item.description && <p className="pretty mt-3 opacity-85">{item.description}</p>}
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                        {value && (
                          <span className="rounded-full bg-[color-mix(in_oklab,var(--t-accent)_14%,transparent)] px-3.5 py-1.5 text-[14px]">
                            <b className={`${display} text-[var(--t-accent)]`}>{value}</b> {words}
                          </span>
                        )}
                        {link && (
                          <a
                            href={link}
                            {...external(link)}
                            className="text-[14px] font-medium underline underline-offset-4"
                          >
                            See it live ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Writing and talks */}
          {has("highlights") && (
            <ul
              role="tabpanel"
              id={`${tabsId}-writing-panel`}
              aria-labelledby={`${tabsId}-writing`}
              hidden={current !== "writing"}
              className="mt-10 divide-y divide-[color-mix(in_oklab,var(--t-fg)_10%,transparent)] border-y border-[color-mix(in_oklab,var(--t-fg)_10%,transparent)]"
            >
              {(c.highlights ?? []).map((item, index) => {
                const inner = (
                  <>
                    <span className={`${mono} w-14 shrink-0 text-[12px] opacity-55`}>{item.year}</span>
                    <span className="min-w-0 flex-1">
                      <span className={`${display} block text-[1.3rem] font-semibold leading-snug`}>
                        {item.title}
                      </span>
                      {item.detail && <span className="text-[14px] opacity-65">{item.detail}</span>}
                    </span>
                    {item.url && <span className="text-[1.2rem] text-[var(--t-accent)]">↗</span>}
                  </>
                );
                return (
                  <li key={index} {...ed(`highlights.${index}`)}>
                    {item.url ? (
                      <a
                        href={item.url}
                        {...external(item.url)}
                        className="flex items-start gap-4 py-5 transition-transform hover:translate-x-1"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="flex items-start gap-4 py-5">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Career and education */}
          {(has("experience") || has("education")) && (
            <div
              role="tabpanel"
              id={`${tabsId}-career-panel`}
              aria-labelledby={`${tabsId}-career`}
              hidden={current !== "career"}
              className="mt-10 grid gap-4 @3xl:grid-cols-2"
            >
              {(c.experience ?? []).map((job, index) => (
                <div key={`x${index}`} className={`${card} p-6`} {...ed(`experience.${index}`)}>
                  <p className={`${mono} text-[11px] uppercase tracking-[0.16em] opacity-55`}>
                    {[job.start_date, job.end_date].filter(Boolean).join(" – ")}
                  </p>
                  <p className={`${display} mt-2 text-[1.3rem] font-bold leading-tight`}>{job.job_title}</p>
                  <p className="text-[14px] opacity-70">
                    {[job.company, job.location].filter(Boolean).join(" · ")}
                  </p>
                  {job.description && <p className="mt-2 text-[14px] opacity-80">{job.description}</p>}
                </div>
              ))}
              {(c.education ?? []).map((item, index) => (
                <div key={`e${index}`} className={`${card} p-6`} {...ed(`education.${index}`)}>
                  <p className={`${mono} text-[11px] uppercase tracking-[0.16em] opacity-55`}>Education</p>
                  <p className={`${display} mt-2 text-[1.2rem] font-bold`}>{item.degree}</p>
                  <p className="text-[14px] opacity-70">
                    {[item.school, item.end_date].filter(Boolean).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ——— Kind words ——— */}
      {has("testimonials") && (
        <section className="mx-auto grid max-w-[76rem] gap-5 px-5 py-14 @3xl:grid-cols-2 @3xl:px-10">
          {(c.testimonials ?? []).map((item, index) => (
            <Reveal key={index} delay={index * 90}>
              <figure className={`${card} h-full p-8`} {...ed(`testimonials.${index}`)}>
                <blockquote className={`${display} text-[1.35rem] font-medium leading-snug`}>
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

      {/* ——— Contact, with the mascot again ——— */}
      {has("contact") && (
        <section className="px-5 pb-12 pt-6 @3xl:px-10">
          <div className="relative isolate mx-auto grid max-w-[76rem] items-center gap-8 overflow-hidden rounded-[40px] bg-[var(--t-accent)] px-7 py-14 text-[var(--t-bg)] @3xl:grid-cols-[1fr_auto] @3xl:px-14">
            <div>
              <h2
                className={`${display} max-w-[36rem] text-[clamp(2.4rem,6.4cqw,4.6rem)] font-bold leading-[0.95] tracking-[-0.05em]`}
              >
                Got something to build? Let’s talk.
              </h2>
              <div className="mt-8 flex flex-wrap gap-3">
                {c.email && (
                  <a
                    href={`mailto:${c.email}`}
                    className="rounded-full bg-[var(--t-bg)] px-7 py-4 font-semibold text-[var(--t-fg)] transition-transform hover:-translate-y-0.5"
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
                      className="rounded-full border-2 border-[var(--t-bg)] px-6 py-[0.85rem] font-medium"
                    >
                      {link.label} ↗
                    </a>
                  ))}
              </div>
            </div>
            <Mascot light className="mx-auto size-40 @3xl:size-48" />
          </div>
        </section>
      )}
    </StudioRoot>
  );
}

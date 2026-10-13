"use client";

import "@fontsource/gloock/400.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource-variable/readex-pro";
import "@fontsource-variable/jetbrains-mono";
import { useId, useState } from "react";
import {
  Picture,
  Reveal,
  StudioRoot,
  contactLinks,
  ed,
  external,
  firstName,
  paragraphs,
  useStudio,
  type StudioProps,
} from "../kit";
import { CountUp } from "../motion";
import { Shader } from "../shader";

/**
 * Duet: a translator's site where two scripts share the page. Ink spreads
 * slowly through paper behind the hero (a WebGL shader), English and Arabic
 * sit side by side, a quote calculator turns pages into a price from the
 * person's own per-page fees, and credentials read like official seals.
 * For translators, interpreters and language specialists; the Arabic is
 * decorative, the person's content stays in their own words.
 */

/** Ink blooming in water on paper: thresholded, slowly moving noise with a soft edge. */
const INK = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv * vec2(u_res.x / u_res.y, 1.0) * 1.8;
  float t = u_time * 0.035;
  float n = fbm(p + vec2(t, t * 0.4) + fbm(p * 1.6 - t) * 1.3 + (u_pointer - 0.5) * 0.4);
  float ink = smoothstep(0.52, 0.78, n);
  vec3 colour = mix(u_a, u_b, ink * 0.22);
  float edge = smoothstep(0.018, 0.0, abs(n - 0.56));
  colour = mix(colour, u_b, edge * 0.12);
  colour *= 0.985 + 0.03 * hash(floor(gl_FragCoord.xy));
  gl_FragColor = vec4(colour, 1.0);
}
`;

/** Words that move between languages in the hero. Decorative only. */
const WORDS = [
  ["Contract", "عقد"],
  ["Witness", "شاهد"],
  ["Agreement", "اتفاقية"],
  ["Court", "محكمة"],
];

/** "AED 120 / page" → 120; anything not priced per page → null. */
function perPage(price?: string) {
  if (!price || !/page/i.test(price)) return null;
  const number = Number.parseFloat(price.replace(/,/g, "").match(/\d+(\.\d+)?/)?.[0] ?? "");
  return Number.isFinite(number) ? number : null;
}

/** A circular seal with its text running round the edge. */
function Seal({ text }: { text: string }) {
  const id = `seal-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 120 120"
      className="size-24 shrink-0 text-[var(--t-accent)] [animation:duet-turn_40s_linear_infinite]"
      aria-hidden
    >
      <defs>
        <path id={id} d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
      </defs>
      <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle
        cx="60"
        cy="60"
        r="34"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      <text fontSize="9.5" letterSpacing="2.4" fill="currentColor" fontFamily="var(--t-mono)">
        <textPath href={`#${id}`}>{`${text.toUpperCase()} · `.repeat(2).slice(0, 64)}</textPath>
      </text>
      <text x="60" y="66" textAnchor="middle" fontSize="18" fill="currentColor">
        ✓
      </text>
    </svg>
  );
}

export default function Duet({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label, palette, accent } = studio;
  const colours: [string, string, string] = [palette?.bg ?? "#f6f2ea", accent, palette?.fg ?? "#1b1a17"];
  const display = "font-[family-name:var(--t-display)]";
  const mono = "font-[family-name:var(--t-mono)]";
  const priced = (c.services ?? [])
    .map((service, index) => ({ service, index, rate: perPage(service.price) }))
    .filter((item) => item.rate !== null);
  const [choice, setChoice] = useState(0);
  const [pages, setPages] = useState(10);
  const chosen = priced[Math.min(choice, Math.max(priced.length - 1, 0))];
  const currency = chosen?.service.price?.match(/^[^\d]*/)?.[0]?.trim() || "";
  const phone = (c.phone ?? "").replace(/[^\d]/g, "");
  const quote = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(`Hello ${firstName(c.name)}, I need ${pages} pages translated (${chosen?.service.title ?? "legal"}).`)}`
    : c.email
      ? `mailto:${c.email}?subject=${encodeURIComponent("Translation quote")}`
      : undefined;

  return (
    <StudioRoot studio={studio} className="text-[16.5px] leading-[1.65]">
      <style>{`
        @keyframes duet-turn { to { transform: rotate(360deg); } }
        @keyframes duet-swap { 0%, 22% { opacity: 1; transform: none; filter: none; } 25%, 97% { opacity: 0; transform: translateY(8px); filter: blur(6px); } 100% { opacity: 1; transform: none; filter: none; } }
      `}</style>

      {/* ——— Hero on paper with spreading ink ——— */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Shader fragment={INK} colours={colours} />
        </div>
        <header className="mx-auto flex max-w-[78rem] items-center justify-between gap-4 px-5 py-6 @3xl:px-10">
          <span className={`${display} text-[1.2rem]`}>{c.name}</span>
          <nav className="flex items-center gap-2 text-[13px]">
            <a
              href="#quote"
              className="hidden rounded-full px-3 py-2 opacity-70 hover:opacity-100 @2xl:inline"
            >
              Get a price
            </a>
            {quote && (
              <a
                href={quote}
                {...external(quote)}
                className="rounded-full bg-[var(--t-fg)] px-4 py-2 font-medium text-[var(--t-bg)]"
              >
                Send a document
              </a>
            )}
          </nav>
        </header>

        <div className="mx-auto grid max-w-[78rem] items-center gap-12 px-5 pb-20 pt-8 @3xl:px-10 @4xl:grid-cols-[1.3fr_1fr]">
          <div>
            <p
              className={`${mono} text-[12px] uppercase tracking-[0.2em] text-[var(--t-accent)]`}
              {...ed("professional_title")}
            >
              {c.professional_title}
            </p>
            <h1
              className={`${display} mt-5 text-[clamp(3rem,8cqw,6.4rem)] leading-[0.95] tracking-[-0.02em]`}
              {...ed("name")}
            >
              {c.name}
            </h1>
            {c.tagline && (
              <p
                className="mt-6 max-w-[36rem] text-[clamp(1.2rem,2.3cqw,1.5rem)] leading-snug opacity-85"
                {...ed("tagline")}
              >
                {c.tagline}
              </p>
            )}

            {/* Two scripts, one meaning (decorative) */}
            <div aria-hidden className="relative mt-10 h-[4.5rem] max-w-[34rem]">
              {WORDS.map(([english, arabic], index) => (
                <div
                  key={english}
                  className="absolute inset-0 flex items-center justify-between gap-6 opacity-0 [animation:duet-swap_12s_ease-in-out_infinite]"
                  style={{ animationDelay: `${index * 3}s` }}
                >
                  <span className={`${display} text-[clamp(1.6rem,6cqw,2.4rem)] italic`}>{english}</span>
                  <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,var(--t-accent),transparent)]" />
                  <span
                    dir="rtl"
                    lang="ar"
                    className="text-[clamp(1.7rem,6.4cqw,2.6rem)] font-medium text-[var(--t-accent)]"
                  >
                    {arabic}
                  </span>
                </div>
              ))}
            </div>

            {c.availability && (
              <p
                className={`${mono} mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--t-surface)] px-4 py-2 text-[12px] shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_10%,transparent)]`}
                {...ed("availability")}
              >
                <span className="size-2 animate-pulse rounded-full bg-[var(--t-accent)]" />
                {c.availability}
              </p>
            )}
          </div>

          <div className="relative mx-auto w-full max-w-[24rem]">
            <div
              className="rotate-[1.5deg] rounded-[6px] bg-[var(--t-surface)] p-3 pb-14 shadow-[0_2px_3px_rgb(0_0_0/0.06),0_40px_70px_-30px_rgb(0_0_0/0.45)]"
              {...ed("avatar")}
            >
              <Picture
                src={c.avatar}
                alt={c.name ?? ""}
                embedded={embedded}
                prompt="Add your photo"
                className="aspect-[4/5] w-full rounded-[3px]"
              />
              <p className={`${display} absolute bottom-4 left-5 text-[1.1rem] italic opacity-80`}>
                {firstName(c.name)}
              </p>
            </div>
            {has("highlights") && c.highlights?.[0] && (
              <div
                className="absolute -bottom-8 -right-6 rounded-full bg-[var(--t-bg)] p-1 shadow-[0_20px_40px_-18px_rgb(0_0_0/0.4)]"
                {...ed("highlights.0")}
              >
                <Seal text={c.highlights[0].title ?? "Certified"} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ——— Language pairs ——— */}
      {has("skills") && (
        <section className="mx-auto max-w-[78rem] px-5 py-12 @3xl:px-10" {...ed("skills")}>
          <div className="flex flex-wrap gap-3">
            {(c.skills ?? []).map((skill, index) => (
              <span
                key={skill}
                className={`rounded-full px-5 py-2.5 text-[1rem] ${index < 3 ? "bg-[var(--t-accent)] text-[var(--t-bg)]" : "bg-[var(--t-surface)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_10%,transparent)]"}`}
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ——— Numbers ——— */}
      {has("stats") && (
        <section className="mx-auto grid max-w-[78rem] gap-10 border-y border-[color-mix(in_oklab,var(--t-fg)_10%,transparent)] px-5 py-14 @3xl:grid-flow-col @3xl:auto-cols-fr @3xl:px-10">
          {(c.stats ?? []).map((stat, index) => (
            <div key={index} {...ed(`stats.${index}`)}>
              <p className={`${display} text-[clamp(3rem,7cqw,5rem)] leading-none`}>
                <CountUp value={stat.value} />
              </p>
              <p className={`${mono} mt-3 text-[12px] uppercase tracking-[0.16em] opacity-65`}>
                {stat.label}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* ——— Fees with a live calculator ——— */}
      {has("services") && (
        <section
          id="quote"
          className="mx-auto grid max-w-[78rem] gap-10 px-5 py-20 @3xl:px-10 @4xl:grid-cols-[1.2fr_1fr]"
        >
          <div>
            <h2 className={`${display} text-[clamp(2.2rem,5cqw,3.6rem)] leading-none`}>
              {label("services", "Fees")}
            </h2>
            <ul className="mt-8">
              {(c.services ?? []).map((service, index) => (
                <li
                  key={index}
                  className="border-b border-[color-mix(in_oklab,var(--t-fg)_12%,transparent)] py-5"
                  {...ed(`services.${index}`)}
                >
                  <p className="flex items-baseline justify-between gap-6">
                    <span className={`${display} text-[1.35rem] leading-tight`}>{service.title}</span>
                    <span className={`${mono} shrink-0 text-[14px] text-[var(--t-accent)]`}>
                      {service.price}
                    </span>
                  </p>
                  {service.description && (
                    <p className="mt-1 text-[15px] opacity-70">{service.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
          {chosen && (
            <Reveal>
              <div className="rounded-[28px] bg-[var(--t-surface)] p-7 shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_8%,transparent),0_40px_80px_-50px_rgb(0_0_0/0.5)] @3xl:p-9">
                <p className={`${mono} text-[12px] uppercase tracking-[0.18em] text-[var(--t-accent)]`}>
                  Estimate your price
                </p>
                <label className="mt-5 block text-[14px] opacity-75">
                  Document type
                  <select
                    value={choice}
                    onChange={(event) => setChoice(Number(event.target.value))}
                    className="mt-2 w-full rounded-xl border border-[color-mix(in_oklab,var(--t-fg)_15%,transparent)] bg-[var(--t-bg)] px-4 py-3 text-[15px] text-[var(--t-fg)]"
                  >
                    {priced.map((item, index) => (
                      <option key={item.index} value={index}>
                        {item.service.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mt-5 block text-[14px] opacity-75">
                  Pages: <b className={`${mono} text-[var(--t-fg)]`}>{pages}</b>
                  <input
                    type="range"
                    min={1}
                    max={200}
                    value={pages}
                    onChange={(event) => setPages(Number(event.target.value))}
                    className="mt-3 w-full accent-[var(--t-accent)]"
                  />
                </label>
                <p className={`${display} mt-6 text-[clamp(2.6rem,6cqw,3.8rem)] leading-none`}>
                  {currency} {((chosen.rate ?? 0) * pages).toLocaleString("en-GB")}
                </p>
                <p className="mt-1 text-[13px] opacity-60">
                  Estimate only. The final price is confirmed when I see the document.
                </p>
                {quote && (
                  <a
                    href={quote}
                    {...external(quote)}
                    className="mt-6 inline-block rounded-full bg-[var(--t-fg)] px-6 py-3.5 font-semibold text-[var(--t-bg)] transition-transform hover:-translate-y-0.5"
                  >
                    Send the document →
                  </a>
                )}
              </div>
            </Reveal>
          )}
        </section>
      )}

      {/* ——— Work ——— */}
      {has("projects") && (
        <section className="mx-auto max-w-[78rem] px-5 py-16 @3xl:px-10">
          <h2 className={`${display} text-[clamp(2.2rem,5cqw,3.6rem)] leading-none`}>
            {label("projects", "Recent work")}
          </h2>
          <div className="mt-10 grid gap-6 @3xl:grid-cols-2">
            {(c.projects ?? []).map((item, index) => (
              <Reveal key={index} delay={index * 90}>
                <article className="group" {...ed(`projects.${index}`)}>
                  <div className="overflow-hidden rounded-[22px]">
                    <Picture
                      src={item.image}
                      alt={item.title ?? ""}
                      embedded={embedded}
                      className="aspect-[16/10] w-full transition-transform duration-[1.2s] group-hover:scale-105"
                    />
                  </div>
                  <p
                    className={`${mono} mt-4 text-[11px] uppercase tracking-[0.16em] text-[var(--t-accent)]`}
                  >
                    {[item.category, item.client, item.year].filter(Boolean).join(" · ")}
                  </p>
                  <h3 className={`${display} mt-1 text-[1.6rem] leading-tight`}>{item.title}</h3>
                  {item.role && <p className="text-[14px] opacity-70">{item.role}</p>}
                  {item.description && <p className="mt-2 opacity-80">{item.description}</p>}
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ——— Credentials as seals ——— */}
      {has("highlights") && (
        <section className="mx-auto grid max-w-[78rem] gap-5 px-5 py-12 @3xl:grid-cols-2 @3xl:px-10">
          {(c.highlights ?? []).map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-6 rounded-[24px] bg-[var(--t-surface)] p-6 shadow-[0_0_0_1px_color-mix(in_oklab,var(--t-fg)_8%,transparent)]"
              {...ed(`highlights.${index}`)}
            >
              <Seal text={item.title ?? ""} />
              <div>
                <p className={`${display} text-[1.3rem] leading-tight`}>{item.title}</p>
                <p className="text-[14px] opacity-70">
                  {[item.detail, item.year].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ——— Kind words ——— */}
      {has("testimonials") && (
        <section className="mx-auto grid max-w-[78rem] gap-10 px-5 py-16 @3xl:grid-cols-2 @3xl:px-10">
          {(c.testimonials ?? []).map((item, index) => (
            <figure key={index} {...ed(`testimonials.${index}`)}>
              <blockquote className={`${display} text-[clamp(1.5rem,3cqw,2.1rem)] leading-[1.2]`}>
                “{item.quote}”
              </blockquote>
              <figcaption className={`${mono} mt-4 text-[12px] uppercase tracking-[0.16em] opacity-65`}>
                {item.name} · {item.role}
              </figcaption>
            </figure>
          ))}
        </section>
      )}

      {/* ——— About ——— */}
      {(has("about") || has("experience") || has("education")) && (
        <section className="mx-auto grid max-w-[78rem] gap-12 px-5 py-16 @3xl:px-10 @4xl:grid-cols-[1.3fr_1fr]">
          {has("about") && (
            <div className="space-y-4 text-[1.08rem]">
              <h2 className={`${display} text-[clamp(2rem,4.4cqw,3rem)] leading-none`}>
                {label("about", "About my work")}
              </h2>
              {paragraphs(c).map(({ text, index }) => (
                <p key={index} className="pretty opacity-85" {...ed(`summary.${index}`)}>
                  {text}
                </p>
              ))}
            </div>
          )}
          <div className="space-y-6">
            {has("experience") &&
              (c.experience ?? []).map((job, index) => (
                <div key={`x${index}`} {...ed(`experience.${index}`)}>
                  <p className={`${mono} text-[11px] uppercase tracking-[0.14em] opacity-60`}>
                    {[job.start_date, job.end_date].filter(Boolean).join(" – ")}
                  </p>
                  <p className={`${display} text-[1.2rem]`}>{job.job_title}</p>
                  <p className="text-[14px] opacity-70">{job.company}</p>
                </div>
              ))}
            {has("education") &&
              (c.education ?? []).map((item, index) => (
                <div key={`e${index}`} {...ed(`education.${index}`)}>
                  <p className={`${display} text-[1.2rem]`}>{item.degree}</p>
                  <p className="text-[14px] opacity-70">{item.school}</p>
                </div>
              ))}
          </div>
        </section>
      )}

      {has("contact") && (
        <footer className="relative isolate overflow-hidden px-5 py-16 @3xl:px-10">
          <div className="absolute inset-0 -z-10">
            <Shader fragment={INK} colours={colours} speed={0.7} />
          </div>
          <div className="mx-auto flex max-w-[78rem] flex-wrap items-end justify-between gap-6">
            <div>
              <p className={`${mono} text-[12px] uppercase tracking-[0.18em] opacity-60`}>Send a document</p>
              <a
                href={c.email ? `mailto:${c.email}` : "#"}
                className={`${display} mt-2 block text-[clamp(1.8rem,4.6cqw,3.4rem)] hover:text-[var(--t-accent)]`}
                {...ed("email")}
              >
                {c.email}
              </a>
            </div>
            <p className="flex flex-wrap gap-5 text-[14px] opacity-80">
              {contactLinks(c)
                .filter((link) => !link.url.startsWith("mailto:"))
                .map((link) => (
                  <a key={link.url} href={link.url} {...external(link.url)} className="hover:opacity-100">
                    {link.label} ↗
                  </a>
                ))}
            </p>
          </div>
        </footer>
      )}
    </StudioRoot>
  );
}

"use client";

import "@fontsource-variable/familjen-grotesk";
import "@fontsource-variable/literata";
import "@fontsource-variable/literata/wght-italic.css";
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

/** One hundred dots, the share filled in: “94 of every 100”. */
function DotShare({ percent }: { percent: number }) {
  const filled = Math.round(Math.max(0, Math.min(100, percent)));
  return (
    <div aria-hidden className="grid w-full max-w-[16rem] grid-cols-10 gap-1.5">
      {Array.from({ length: 100 }, (_, index) => (
        <span
          key={index}
          className={`aspect-square rounded-full ${index < filled ? "ba" : "bg-[color-mix(in_oklab,var(--t-fg)_14%,transparent)]"}`}
          style={{ transitionDelay: `${index * 8}ms` }}
        />
      ))}
    </div>
  );
}

/**
 * Contour lines of an imaginary landscape, for covers without a photo:
 * rings of wobbly closed paths around two hills, like a field map.
 */
function contours() {
  const hills = [
    { x: 700, y: 260, rings: 11, size: 34 },
    { x: 260, y: 470, rings: 7, size: 30 },
  ];
  const paths: string[] = [];
  for (const hill of hills) {
    for (let ring = 1; ring <= hill.rings; ring++) {
      const radius = ring * hill.size;
      const points: string[] = [];
      for (let step = 0; step <= 72; step++) {
        const angle = (step / 72) * Math.PI * 2;
        const wobble = 1 + 0.12 * Math.sin(angle * 3 + ring * 0.7) + 0.06 * Math.sin(angle * 7 + hill.x);
        const x = hill.x + Math.cos(angle) * radius * 1.35 * wobble;
        const y = hill.y + Math.sin(angle) * radius * wobble;
        points.push(`${step ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
      }
      paths.push(`${points.join(" ")}Z`);
    }
  }
  return paths;
}
const CONTOURS = contours();

/** The cover without a photo: a dark field map with contours, a grid and a pin. */
function MapCover({ place }: { place?: string }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 -z-10 bg-[radial-gradient(90%_80%_at_70%_30%,color-mix(in_oklab,var(--t-accent)_30%,#1d1a16),#14120f)]"
    >
      <svg viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid slice" className="size-full">
        <g
          fill="none"
          stroke="color-mix(in oklab, var(--t-accent) 55%, white)"
          strokeWidth="1"
          opacity="0.32"
        >
          {CONTOURS.map((d, index) => (
            <path key={index} d={d} strokeWidth={index % 4 === 0 ? 1.6 : 0.8} />
          ))}
        </g>
        <g stroke="white" strokeWidth="0.5" opacity="0.12">
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="640" />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 100} x2="1000" y2={i * 100} />
          ))}
        </g>
        {/* the pin, on the top of the bigger hill */}
        <g transform="translate(700 236)">
          <circle r="34" fill="var(--t-accent)" opacity="0.18" />
          <circle r="16" fill="var(--t-accent)" opacity="0.35" />
          <circle r="6" fill="var(--t-accent)" stroke="white" strokeWidth="2" />
        </g>
        {place && (
          <text
            x="724"
            y="214"
            fill="white"
            opacity="0.8"
            fontSize="15"
            letterSpacing="3"
            fontFamily="var(--t-text)"
          >
            {place.toUpperCase()}
          </text>
        )}
      </svg>
    </div>
  );
}

const Kicker = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] ta">{children}</p>
);

export default function FieldReport({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const cover = c.cover || c.gallery?.[0]?.image || (c.projects ?? []).find((item) => item.image)?.image;
  const stats = c.stats ?? [];
  const shareIndex = stats.findIndex((stat) => /%\s*$/.test(stat.value ?? ""));
  const share = shareIndex >= 0 ? stats[shareIndex] : undefined;

  return (
    <StudioRoot studio={studio} className="text-[16.5px] leading-[1.65]">
      <section className="relative isolate min-h-[34rem] overflow-hidden text-white">
        {cover ? (
          <Picture
            src={cover}
            alt=""
            embedded={embedded}
            className="absolute inset-0 -z-10 size-full"
            edit={c.cover ? "cover" : undefined}
          />
        ) : (
          <MapCover place={c.location?.split(",")[0]} />
        )}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/25 to-black/10"
        />
        <div className="flex min-h-[34rem] flex-col justify-between px-5 py-6 @3xl:px-10 @3xl:py-10">
          <div className="flex justify-between text-[12px] font-semibold uppercase tracking-[0.2em]">
            <span>Field report</span>
            <span {...ed("location")}>{c.location}</span>
          </div>
          <div className="max-w-[46rem]">
            <p
              className="text-[13px] font-semibold uppercase tracking-[0.18em] opacity-85"
              {...ed("professional_title")}
            >
              {c.professional_title}
            </p>
            <h1
              className="fd mt-3 text-[clamp(2.8rem,7.4cqw,5.6rem)] font-[600] leading-[0.95] tracking-[-0.025em]"
              {...ed("name")}
            >
              {c.name}
            </h1>
            <p
              className="mt-5 max-w-[34rem] font-[family-name:var(--t-text)] text-[1.35rem] italic leading-snug opacity-95"
              {...ed("tagline")}
            >
              {c.tagline}
            </p>
          </div>
        </div>
      </section>

      {has("stats") && (
        <section className="border-b rule px-5 py-16 @3xl:px-10">
          <Kicker>{label("stats", "At a glance")}</Kicker>
          <div className={`mt-8 grid gap-12 ${share ? "@4xl:grid-cols-[1fr_auto]" : ""}`}>
            <dl className="grid items-start gap-4 @3xl:grid-cols-3">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="rounded-xl border-t-4 border-[var(--t-accent)] bg-[color-mix(in_oklab,var(--t-bg)_60%,white)] p-5 shadow-[0_0_0_1px_var(--t-rule),0_16px_32px_-22px_rgb(0_0_0/0.4)]"
                  {...ed(`stats.${index}`)}
                >
                  <dd className="fd text-[clamp(2.8rem,6cqw,4.6rem)] font-[600] leading-none tracking-[-0.03em] tabular-nums">
                    {stat.value}
                  </dd>
                  <dt className="mt-2 text-[15px] tm">{stat.label}</dt>
                </div>
              ))}
            </dl>
            {share && (
              <figure
                className="self-end rounded-xl bg-[color-mix(in_oklab,var(--t-bg)_60%,white)] p-5 shadow-[0_0_0_1px_var(--t-rule),0_16px_32px_-22px_rgb(0_0_0/0.4)]"
                {...ed(`stats.${shareIndex}`)}
              >
                <DotShare percent={Number.parseFloat(share.value ?? "0")} />
                <figcaption className="mt-3 max-w-[16rem] text-[13px] tm">
                  {Number.parseFloat(share.value ?? "0")} of every 100 · {share.label}
                </figcaption>
              </figure>
            )}
          </div>
        </section>
      )}

      {has("about") && (
        <section className="grid gap-10 px-5 py-20 @3xl:px-10 @4xl:grid-cols-[1fr_2fr]">
          <div>
            <Kicker>{label("about", `A letter from ${firstName(c.name)}`)}</Kicker>
          </div>
          <div className="max-w-[42rem] rounded-sm bg-[color-mix(in_oklab,var(--t-bg)_50%,white)] p-8 shadow-[0_1px_0_var(--t-rule),0_26px_50px_-30px_rgb(0_0_0/0.5)] @3xl:p-12">
            <div className="space-y-5 text-[1.12rem]">
              {paragraphs(c).map(({ text, index }) => (
                <p key={index} className="pretty" {...ed(`summary.${index}`)}>
                  {text}
                </p>
              ))}
            </div>
            <p className="fd mt-8 text-[1.8rem] italic">{firstName(c.name)}</p>
            {c.availability && (
              <p
                className="mt-6 inline-block border-l-4 border-[var(--t-accent)] pl-3 text-[15px]"
                {...ed("availability")}
              >
                {c.availability}
              </p>
            )}
          </div>
        </section>
      )}

      {has("projects") && (
        <section className="bs px-5 py-20 @3xl:px-10">
          <Kicker>{label("projects", "Programmes")}</Kicker>
          <div className="mt-10 space-y-16">
            {(c.projects ?? []).map((item, index) => (
              <Reveal key={index}>
                <article
                  className={`grid items-center gap-8 ${item.image ? "@4xl:grid-cols-2" : ""}`}
                  {...ed(`projects.${index}`)}
                >
                  {item.image && (
                    <Picture
                      src={item.image}
                      alt={item.title ?? ""}
                      embedded={embedded}
                      className={`aspect-[3/2] w-full ${index % 2 ? "@4xl:order-2" : ""}`}
                    />
                  )}
                  <div>
                    <p className="text-[13px] font-semibold uppercase tracking-[0.14em] tm">
                      {[item.category, item.year, item.role].filter(Boolean).join(" · ")}
                    </p>
                    <h3 className="fd mt-2 text-[clamp(1.8rem,3.6cqw,2.5rem)] font-[600] leading-[1.05] tracking-[-0.02em]">
                      {item.title}
                    </h3>
                    <p className="mt-4 max-w-[34rem] pretty">{item.description}</p>
                    {item.client && (
                      <p className="mt-6 inline-flex items-baseline gap-3 border-t-2 border-[var(--t-accent)] pt-3">
                        <span className="text-[12px] font-semibold uppercase tracking-[0.16em] tm">
                          Outcome
                        </span>
                        <span className="fd text-[1.5rem] font-[600] ta">{item.client}</span>
                      </p>
                    )}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {has("testimonials") && (
        <section className="px-5 py-20 @3xl:px-10">
          <Kicker>{label("testimonials", "Voices")}</Kicker>
          <div className="mt-8 grid gap-10 @3xl:grid-cols-2">
            {(c.testimonials ?? []).map((item, index) => (
              <figure
                key={index}
                className="relative rounded-2xl bg-[color-mix(in_oklab,var(--t-bg)_60%,white)] p-7 pt-10 shadow-[0_0_0_1px_var(--t-rule),0_20px_40px_-28px_rgb(0_0_0/0.45)]"
                {...ed(`testimonials.${index}`)}
              >
                <span aria-hidden className="fd absolute left-6 top-1 text-[4.5rem] leading-none ta">
                  “
                </span>
                <blockquote className="text-[1.3rem] italic leading-snug">{item.quote}</blockquote>
                <figcaption className="mt-4 text-[14px] font-semibold">
                  {item.name}
                  <span className="block font-normal tm">{item.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {(has("experience") || has("education") || has("skills")) && (
        <section className="grid gap-12 border-t rule px-5 py-16 @3xl:px-10 @4xl:grid-cols-3">
          {has("experience") && (
            <div className="@4xl:col-span-2">
              <Kicker>{label("experience", "Career")}</Kicker>
              <ul className="relative mt-6 space-y-6 border-l-2 border-[var(--t-rule-strong)] pl-6">
                {(c.experience ?? []).map((role, index) => (
                  <li
                    key={index}
                    className="relative grid gap-1 @3xl:grid-cols-[8rem_1fr] @3xl:gap-6"
                    {...ed(`experience.${index}`)}
                  >
                    <span
                      aria-hidden
                      className="absolute -left-[31px] top-1.5 size-3 rounded-full ba shadow-[0_0_0_4px_var(--t-bg)]"
                    />
                    <span className="text-[14px] tabular-nums tm">
                      {[role.start_date, role.end_date].filter(Boolean).join("–")}
                    </span>
                    <span>
                      <b className="fd font-[600]">{role.job_title}</b>, {role.company}
                      {role.description && <span className="block text-[15px] tm">{role.description}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="space-y-10">
            {has("education") && (
              <div>
                <Kicker>{label("education", "Education")}</Kicker>
                <ul className="mt-4 space-y-2 text-[15px]">
                  {(c.education ?? []).map((item, index) => (
                    <li key={index} {...ed(`education.${index}`)}>
                      {item.degree}
                      <span className="block tm">{item.school}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {has("skills") && (
              <div>
                <Kicker>{label("skills", "Strengths")}</Kicker>
                <p className="mt-4 text-[15px]" {...ed("skills")}>
                  {(c.skills ?? []).join(" · ")}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {has("highlights") && (
        <section className="border-t rule px-5 py-16 @3xl:px-10">
          <Kicker>{label("highlights", "Reports & speaking")}</Kicker>
          <ul className="mt-6 grid gap-4 @3xl:grid-cols-2">
            {(c.highlights ?? []).map((item, index) => (
              <li
                key={index}
                className="border-l-2 border-[var(--t-rule-strong)] pl-4"
                {...ed(`highlights.${index}`)}
              >
                {item.url ? (
                  <a
                    href={item.url}
                    {...external(item.url)}
                    className="fd font-[600] underline underline-offset-4 hover-a"
                  >
                    {item.title}
                  </a>
                ) : (
                  <b className="fd font-[600]">{item.title}</b>
                )}
                <span className="block text-[14px] tm">
                  {[item.detail, item.year].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {has("contact") && (
        <footer className="relative isolate overflow-hidden ba px-5 py-20 text-[var(--t-bg)] @3xl:px-10">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(70%_120%_at_90%_0%,rgb(255_255_255/0.22),transparent_60%),radial-gradient(60%_90%_at_0%_100%,rgb(0_0_0/0.25),transparent_70%)]"
          />
          <h2 className="fd max-w-[40rem] text-[clamp(2.2rem,5cqw,3.6rem)] font-[600] leading-[1.02] tracking-[-0.02em]">
            Partner, fund or just ask a question.
          </h2>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-[1.1rem]">
            <a
              href={c.email ? `mailto:${c.email}` : "#"}
              className="break-all font-semibold underline decoration-2 underline-offset-4"
              {...ed("email")}
            >
              {c.email}
            </a>
            {c.phone && (
              <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="tabular-nums" {...ed("phone")}>
                {c.phone}
              </a>
            )}
            {contactLinks(c)
              .filter((link) => !/^(mailto|tel):/.test(link.url))
              .map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  {...external(link.url)}
                  className="opacity-85 hover:opacity-100"
                >
                  {link.label} ↗
                </a>
              ))}
          </div>
        </footer>
      )}
    </StudioRoot>
  );
}

"use client";

import "@fontsource/young-serif/400.css";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/figtree";
import {
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

const CARD =
  "rounded-2xl bg-[color-mix(in_oklab,var(--t-bg)_55%,white)] shadow-[0_0_0_1px_var(--t-rule),0_2px_4px_-2px_rgb(0_0_0/0.06),0_22px_44px_-26px_rgb(0_0_0/0.35)]";

export default function Practice({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const book = c.email ? `mailto:${c.email}?subject=${encodeURIComponent("Introductory call")}` : "#contact";

  return (
    <StudioRoot studio={studio} className="text-[16.5px] leading-[1.65]">
      <header className="mx-auto flex max-w-[72rem] items-center justify-between px-5 py-5">
        <span className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full ba text-[13px] font-semibold text-[var(--t-bg)]">
            {initials(c.name)}
          </span>
          <span className="font-semibold">{c.name}</span>
        </span>
        <nav className="flex items-center gap-6 text-[14px]">
          <a href="#services" className="hidden tm hover-a @2xl:inline">
            Services
          </a>
          <a href="#proof" className="hidden tm hover-a @2xl:inline">
            Clients
          </a>
          <a
            href={book}
            className="rounded-full bg-[var(--t-fg)] px-4 py-2 font-medium text-[var(--t-bg)] transition-opacity hover:opacity-85"
          >
            Book a call
          </a>
        </nav>
      </header>

      <section className="relative isolate">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 overflow-hidden [mask-image:linear-gradient(black_60%,transparent)]"
        >
          <div className="absolute -right-32 -top-40 size-[34rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--t-accent)_22%,transparent),transparent)]" />
          <div className="absolute -left-40 top-40 size-[28rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--t-accent)_12%,transparent),transparent)]" />
          <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(var(--t-rule)_1px,transparent_1px)] [background-size:22px_22px]" />
        </div>
        <div className="mx-auto grid max-w-[72rem] items-center gap-12 px-5 pb-20 pt-16 @4xl:grid-cols-[1.4fr_1fr] @4xl:pt-24">
          <div>
            <h1 className="flex flex-wrap items-center gap-x-2 text-[14px] font-medium">
              <span {...ed("name")}>{c.name}</span>
              <span className="tm">·</span>
              <span className="ta" {...ed("professional_title")}>
                {c.professional_title}
              </span>
            </h1>
            <p
              className="fd mt-5 text-[clamp(2.6rem,6.4cqw,4.8rem)] leading-[1.04] tracking-[-0.015em] balance"
              {...ed("tagline")}
            >
              {c.tagline}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href={book}
                className="rounded-full ba px-6 py-3 font-semibold text-[var(--t-bg)] shadow-[0_8px_24px_-12px_var(--t-accent)] transition-transform hover:-translate-y-0.5"
              >
                Book a free 20-minute call
              </a>
              {c.availability && (
                <span className="flex items-center gap-2 text-[14px] tm" {...ed("availability")}>
                  <span className="size-2 rounded-full bg-[#3fb27f]" />
                  {c.availability}
                </span>
              )}
            </div>
          </div>
          {/* A profile card: who, results, and one line from a client */}
          <aside className={`${CARD} relative p-7`}>
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-full bg-[linear-gradient(135deg,var(--t-accent),color-mix(in_oklab,var(--t-accent)_55%,black))] text-[1.1rem] font-semibold text-[var(--t-bg)] shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_8px_18px_-8px_var(--t-accent)]">
                {initials(c.name)}
              </span>
              <span>
                <span className="fd block text-[1.3rem] leading-tight">{c.name}</span>
                <span className="text-[14px] tm">{c.location}</span>
              </span>
            </div>
            {has("stats") && (
              <dl className="mt-6 grid grid-cols-3 gap-3 border-t rule pt-6">
                {(c.stats ?? []).slice(0, 3).map((stat, index) => (
                  <div key={index} {...ed(`stats.${index}`)}>
                    <dd className="fd text-[1.9rem] leading-none">{stat.value}</dd>
                    <dt className="mt-1 text-[12.5px] leading-snug tm">{stat.label}</dt>
                  </div>
                ))}
              </dl>
            )}
            {c.testimonials?.[1] && (
              <figure className="mt-6 rounded-xl bs p-4" {...ed("testimonials.1")}>
                <blockquote className="text-[14.5px] italic leading-snug">
                  “{c.testimonials[1].quote}”
                </blockquote>
                <figcaption className="mt-2 text-[12.5px] tm">— {c.testimonials[1].name}</figcaption>
              </figure>
            )}
          </aside>
        </div>
      </section>

      {has("services") && (
        <section id="services" className="bs py-20">
          <div className="mx-auto max-w-[72rem] px-5">
            <h2 className="fd text-[2.2rem]">{label("services", "How I can help")}</h2>
            <div className="mt-10 grid gap-5 @3xl:grid-cols-2">
              {(c.services ?? []).map((service, index) => (
                <Reveal
                  key={index}
                  delay={(index % 2) * 90}
                  className={`${CARD} flex flex-col p-7 transition-transform duration-300 hover:-translate-y-1`}
                >
                  <div {...ed(`services.${index}`)} className="flex flex-1 flex-col">
                    <span className="mb-5 grid size-10 place-items-center rounded-xl bg-[color-mix(in_oklab,var(--t-accent)_14%,transparent)] text-[14px] font-semibold ta">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="flex items-start justify-between gap-6">
                      <h3 className="fd text-[1.5rem] leading-tight">{service.title}</h3>
                      {service.price && (
                        <span className="shrink-0 rounded-full border rule px-3 py-1 text-[14px] font-semibold">
                          {service.price}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 flex-1 tm pretty">{service.description}</p>
                    <a href={book} className="mt-6 text-[14px] font-semibold ta">
                      Ask about this →
                    </a>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {has("about") && (
        <section className="mx-auto grid max-w-[72rem] gap-10 px-5 py-20 @3xl:grid-cols-[1fr_1.6fr]">
          <h2 className="fd text-[2.2rem]">{label("about", "About me")}</h2>
          <div className="space-y-4 text-[1.1rem]">
            {paragraphs(c).map(({ text, index }) => (
              <p key={index} className="pretty" {...ed(`summary.${index}`)}>
                {text}
              </p>
            ))}
          </div>
        </section>
      )}

      {has("projects") && (
        <section id="proof" className="border-t rule">
          <div className="mx-auto max-w-[72rem] px-5 py-20">
            <h2 className="fd text-[2.2rem]">{label("projects", "Recent work")}</h2>
            <ul className="mt-8 divide-y divide-[var(--t-rule)] border-y rule">
              {(c.projects ?? []).map((project, index) => (
                <li
                  key={index}
                  className="grid gap-2 py-6 @3xl:grid-cols-[14rem_1fr_6rem] @3xl:gap-8"
                  {...ed(`projects.${index}`)}
                >
                  <span className="text-[14px] tm">{project.client}</span>
                  <div>
                    <h3 className="fd text-[1.35rem]">{project.title}</h3>
                    <p className="mt-1 tm pretty">{project.description}</p>
                  </div>
                  <span className="text-[14px] tm @3xl:text-right">{project.year}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {has("testimonials") && (
        <section className="bs py-20">
          <div className="mx-auto grid max-w-[72rem] gap-6 px-5 @3xl:grid-cols-2">
            {(c.testimonials ?? []).map((item, index) => (
              <figure key={index} className={`${CARD} p-8`} {...ed(`testimonials.${index}`)}>
                <p className="fd text-[3rem] leading-none ta">“</p>
                <blockquote className="fd -mt-3 text-[1.35rem] leading-snug">{item.quote}</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 text-[14px]">
                  <span className="grid size-9 place-items-center rounded-full bs font-semibold">
                    {initials(item.name)}
                  </span>
                  <span>
                    <b className="font-semibold">{item.name}</b>
                    <span className="block tm">{item.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {(has("experience") || has("highlights")) && (
        <section className="mx-auto grid max-w-[72rem] gap-12 px-5 py-20 @3xl:grid-cols-2">
          {has("experience") && (
            <div>
              <h2 className="fd text-[1.6rem]">{label("experience", "Background")}</h2>
              <ul className="mt-6 space-y-5 border-l-2 border-[var(--t-rule-strong)] pl-6">
                {(c.experience ?? []).map((role, index) => (
                  <li
                    key={index}
                    className="relative flex justify-between gap-4"
                    {...ed(`experience.${index}`)}
                  >
                    <span
                      aria-hidden
                      className="absolute -left-[31px] top-1.5 size-3 rounded-full ba shadow-[0_0_0_4px_var(--t-bg)]"
                    />
                    <span>
                      <b className="font-semibold">{role.job_title}</b>
                      <span className="block text-[14px] tm">{role.company}</span>
                    </span>
                    <span className="shrink-0 text-[14px] tm">
                      {[role.start_date, role.end_date].filter(Boolean).join("–")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {has("highlights") && (
            <div>
              <h2 className="fd text-[1.6rem]">{label("highlights", "Credentials")}</h2>
              <ul className="mt-5 space-y-3">
                {(c.highlights ?? []).map((item, index) => (
                  <li
                    key={index}
                    className="flex justify-between gap-4 border-b rule pb-3"
                    {...ed(`highlights.${index}`)}
                  >
                    <span>{item.title}</span>
                    <span className="text-[14px] tm">{item.year}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {has("contact") && (
        <footer id="contact" className="px-5 pb-10">
          <div className="relative isolate mx-auto max-w-[72rem] overflow-hidden rounded-3xl bg-[var(--t-fg)] px-8 py-16 text-center text-[var(--t-bg)] shadow-[0_40px_80px_-40px_rgb(0_0_0/0.6)] @3xl:py-20">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_0%,color-mix(in_oklab,var(--t-accent)_45%,transparent),transparent_70%)]"
            />
            <h2 className="fd mx-auto max-w-[30rem] text-[clamp(2rem,4.6cqw,3.2rem)] leading-tight balance">
              Not sure where to start? Let’s talk it through.
            </h2>
            <a
              href={book}
              className="mt-8 inline-block rounded-full ba px-7 py-3.5 font-semibold text-[var(--t-bg)] shadow-[0_10px_30px_-10px_var(--t-accent)] transition-transform hover:-translate-y-0.5"
            >
              Book a free call
            </a>
            <p className="mt-6 text-[14px] opacity-75">
              or write to{" "}
              <a href={c.email ? `mailto:${c.email}` : "#"} className="underline" {...ed("email")}>
                {c.email}
              </a>
            </p>
            <p className="mt-6 flex justify-center gap-6 text-[14px] opacity-75">
              {contactLinks(c)
                .filter((link) => !link.url.startsWith("mailto:"))
                .map((link) => (
                  <a key={link.url} href={link.url} {...external(link.url)} className="hover:opacity-100">
                    {link.label}
                  </a>
                ))}
            </p>
          </div>
        </footer>
      )}
    </StudioRoot>
  );
}

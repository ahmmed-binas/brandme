import type { Metadata } from "next";
import Link from "next/link";
import { designsForRole, templatePageHref } from "@/lib/templates/links";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { availableTemplates } from "@/lib/templates/approval";
import { ROLES, roleById } from "@/lib/templates/roles";
import { PROFESSIONS } from "@/lib/templates/types";
import { faqSchema, roleBreadcrumbs, roleFaq, roleSteps } from "@/lib/gallery/role-seo";
import { RoleEssentials } from "@/components/gallery/RoleEssentials";
import PreviewFrame from "@/components/templates/PreviewFrame";
import { TemplateBadges } from "@/components/templates/TemplateBadges";
import { ROLE_SEARCH } from "@/lib/gallery/role-search";

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }): Promise<Metadata> {
  const role = roleById((await params).role);
  if (!role) return {};
  // Jobs people already find us with get their own wording (lib/gallery/role-search.ts).
  const search = ROLE_SEARCH[role.id];
  return {
    // Words people search: "portfolio website for nurses", "nurse portfolio examples", "free template".
    title: search?.title ?? `${role.label} Portfolio Website: Free Templates & Examples`,
    description:
      search?.description ??
      `How to make a ${role.label.toLowerCase()} portfolio website in five steps: what to include, live examples written for ${role.plural}, and free designs you can edit without code.`,
    alternates: { canonical: `/for/${role.id}` },
  };
}

/** A landing page per job title: what the portfolio says, and the designs that suit it. */
export default async function RolePage({ params }: { params: Promise<{ role: string }> }) {
  const role = roleById((await params).role);
  if (!role) notFound();
  const available = await availableTemplates();
  const designs = designsForRole(role, available);
  const profession = PROFESSIONS.find((item) => item.id === role.profession);
  const faq = roleFaq(role);
  const heading = ROLE_SEARCH[role.id]?.heading ?? [
    `${role.label} portfolio`,
    "templates and a live example",
  ];
  // Up to three designs fanned out beside the heading, the first on top.
  const fan = designs.slice(0, 3);
  const schema = {
    "@context": "https://schema.org",
    "@graph": [roleBreadcrumbs(role), faqSchema(faq)],
  };
  const related = ROLES.filter((item) => item.profession === role.profession && item.id !== role.id).slice(
    0,
    12,
  );

  return (
    <div className="mx-auto max-w-[1320px] px-5 pb-24 pt-10 sm:px-8 lg:pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
      <nav className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
        <Link href="/for" className="hover:text-ink">
          Job titles
        </Link>{" "}
        / {profession?.label}
      </nav>
      <header className="mt-8 grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <h1 className="font-display text-[clamp(2.6rem,6vw,4.8rem)] font-[400] leading-[0.95] tracking-[-0.03em] text-ink [font-variation-settings:'opsz'_48]">
            {heading[0]} <em className="block font-[300] text-signal">{heading[1]}</em>
          </h1>
          <p className="mt-6 max-w-[38rem] text-[1.08rem] leading-[1.7] text-ink-soft">
            A free personal website for {role.plural}: your services, fees, results and reviews in one place.
            Below is a real example written for the job, what to include, and the designs that suit it. Edit
            without code and publish in minutes.
          </p>
          {designs[0] && (
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                href={`/editor/${designs[0].id}?role=${role.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[0.98rem] font-medium text-paper transition-colors hover:bg-signal hover:text-signal-ink"
              >
                Make yours free <ArrowRight size={16} />
              </Link>
              <a
                href="#designs"
                className="text-[0.95rem] text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
              >
                See all {designs.length} designs
              </a>
            </div>
          )}
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
            <li>✓ Free to publish</li>
            <li>✓ No code</li>
            <li>✓ Live in ten minutes</li>
          </ul>
        </div>

        {fan.length > 0 && (
          <div
            className="relative mx-auto h-[300px] w-full max-w-[560px] overflow-x-clip sm:h-[380px] lg:overflow-visible"
            aria-label={`Designs for ${role.plural}`}
          >
            {fan
              .slice()
              .reverse()
              .map((template, back) => {
                // The first design sits in front; the others fan out behind it.
                const index = fan.length - 1 - back;
                const turn = [0, -7, 7][index] ?? 0;
                const shift = [0, -22, 22][index] ?? 0;
                return (
                  <div
                    key={template.id}
                    className="absolute left-1/2 top-1/2 w-[78%] hover:z-10"
                    style={{
                      transform: `translate(calc(-50% + ${shift}%), -50%) rotate(${turn}deg)`,
                      zIndex: fan.length - index,
                    }}
                  >
                    <Link
                      href={`/editor/${template.id}?role=${role.id}`}
                      aria-label={`Start with ${template.name}`}
                      className="block overflow-hidden rounded-2xl border border-rule bg-paper shadow-[0_30px_70px_-35px_rgba(0,0,0,.55)] transition-transform duration-500 hover:-translate-y-4"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- static thumbnails, already sized */}
                      <img
                        src={`/templates/${template.id}.webp`}
                        alt={`${template.name} design for a ${role.label.toLowerCase()} website`}
                        className="aspect-[3/2] w-full object-cover object-top"
                      />
                      <span className="flex items-center justify-between px-4 py-2.5 text-[0.85rem] text-ink">
                        <span className="font-medium">{template.name}</span>
                        <span className="text-ink-soft">Use this →</span>
                      </span>
                    </Link>
                  </div>
                );
              })}
          </div>
        )}
      </header>

      {designs[0] && (
        <section className="mt-16" aria-labelledby="example">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="example" className="font-display text-[2.2rem] tracking-[-0.02em] text-ink">
              Example: a {role.label.toLowerCase()} portfolio
            </h2>
            <p className="text-[0.95rem] text-ink-soft">
              {designs[0].name} design · sample content for {role.plural} · scroll inside it
            </p>
          </div>
          <div className="mt-6 h-[78vh] max-h-[860px] overflow-hidden rounded-2xl border border-rule shadow-[0_40px_100px_-60px_rgba(0,0,0,.6)]">
            <PreviewFrame
              src={`/templates/${designs[0].id}?sample=1&role=${role.id}`}
              title={`${designs[0].name} as a ${role.label.toLowerCase()} portfolio, live preview`}
              className="h-full"
            />
          </div>
        </section>
      )}

      <RoleEssentials role={role} className="mt-24" />

      <section className="mt-20 max-w-[52rem]" aria-labelledby="how-to">
        <h2 id="how-to" className="font-display text-[2.2rem] tracking-[-0.02em] text-ink">
          How to make a {role.label.toLowerCase()} portfolio website
        </h2>
        <ol className="mt-6 space-y-4">
          {roleSteps(role).map((step, index) => (
            <li key={index} className="flex gap-4 leading-relaxed text-ink-soft">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-rule font-mono text-[0.85rem] text-ink">
                {index + 1}
              </span>
              <span className="pt-1">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {designs.length > 0 && (
        <section className="mt-20" aria-labelledby="designs">
          <h2 id="designs" className="font-display text-[2.2rem] tracking-[-0.02em] text-ink">
            {designs.length} free {role.label.toLowerCase()} portfolio designs
          </h2>
          <p className="mt-2 text-ink-soft">
            Each one opens with sample content written for {role.plural}. The pictures show the design.
          </p>
          <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
            {designs.map((template) => (
              <li key={template.id}>
                <Link
                  href={templatePageHref(template.id, { role: role.id })}
                  className="group relative block overflow-hidden rounded-xl border border-rule"
                  aria-label={`Preview ${template.name} for ${role.plural}`}
                >
                  <TemplateBadges
                    threeD={template.threeD}
                    pro={template.proOnly}
                    className="absolute right-3 top-3 z-10"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element -- static thumbnails, already sized */}
                  <img
                    src={`/templates/${template.id}.webp`}
                    alt=""
                    loading="lazy"
                    className="aspect-[3/2] w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </Link>
                <div className="mt-4 flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-[1.6rem] leading-none text-ink">{template.name}</h3>
                  <Link
                    href={templatePageHref(template.id, { role: role.id })}
                    className="inline-flex items-center gap-1 text-[0.9rem] text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
                  >
                    Preview <ArrowUpRight size={13} />
                  </Link>
                </div>
                <p className="mt-2 text-[0.96rem] leading-relaxed text-ink-soft">{template.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-20 max-w-[52rem]" aria-labelledby="questions">
        <h2 id="questions" className="font-display text-[2.2rem] tracking-[-0.02em] text-ink">
          Questions {role.plural} ask
        </h2>
        <div className="mt-6 divide-y divide-rule border-y border-rule">
          {faq.map((entry) => (
            <details key={entry.question} className="py-4" open>
              <summary className="cursor-pointer list-none font-medium text-ink">{entry.question}</summary>
              <p className="mt-2 leading-relaxed text-ink-soft">{entry.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-20 border-t border-rule pt-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            Other {profession?.label.toLowerCase()} roles
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {related.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/for/${item.id}`}
                  className="inline-block rounded-full border border-rule px-3.5 py-1.5 text-[0.9rem] text-ink-soft hover:border-ink hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

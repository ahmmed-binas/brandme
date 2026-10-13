import type { Metadata } from "next";
import Link from "next/link";
import { designsForRole, templatePageHref } from "@/lib/templates/links";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { availableTemplates } from "@/lib/templates/approval";
import { ROLES, roleById } from "@/lib/templates/roles";
import { PROFESSIONS } from "@/lib/templates/types";
import { faqSchema, roleBreadcrumbs, roleFaq } from "@/lib/gallery/role-seo";
import { RoleEssentials } from "@/components/gallery/RoleEssentials";
import PreviewFrame from "@/components/templates/PreviewFrame";

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }): Promise<Metadata> {
  const role = roleById((await params).role);
  if (!role) return {};
  return {
    // Words people search: "portfolio website for nurses", "nurse portfolio examples", "free template".
    title: `${role.label} Portfolio Website: Free Templates & a Live Example`,
    description: `How to make a ${role.label.toLowerCase()} portfolio: what to include, a live example with sample content written for ${role.plural}, and free designs you can edit without code.`,
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
      <header className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <h1 className="font-display text-[clamp(2.6rem,6vw,4.8rem)] font-[400] leading-[0.95] tracking-[-0.03em] text-ink [font-variation-settings:'opsz'_48]">
          {role.label} portfolio{" "}
          <em className="block font-[300] text-signal">templates and a live example</em>
        </h1>
        <div>
          <p className="text-[1.08rem] leading-[1.7] text-ink-soft">
            A free personal website for {role.plural}: your services, fees, results and reviews in one place.
            Below is a real example written for the job, what to include, and the designs that suit it. Edit
            without code and publish in minutes.
          </p>
          {designs[0] && (
            <Link
              href={`/editor/${designs[0].id}?role=${role.id}`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[0.95rem] font-medium text-paper transition-colors hover:bg-signal hover:text-signal-ink"
            >
              Start with {designs[0].name} <ArrowRight size={16} />
            </Link>
          )}
        </div>
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
                  className="group block overflow-hidden rounded-xl border border-rule"
                  aria-label={`Preview ${template.name} for ${role.plural}`}
                >
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

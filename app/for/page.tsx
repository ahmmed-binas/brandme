import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ROLES, roleById, rolesByProfession } from "@/lib/templates/roles";
import { FIELDS } from "@/lib/templates/types";
import { brand } from "@/lib/brand";
import { siteUrl } from "@/lib/site";
import { faqSchema, roleBreadcrumbs, type FaqEntry } from "@/lib/gallery/role-seo";

export const metadata: Metadata = {
  // Search Console showed this page's first impressions (October 2026); the title uses the
  // words people search for: "portfolio website examples", "for every job", "free".
  title: `Portfolio Website Examples for ${ROLES.length} Jobs: Free Templates`,
  description: `Free portfolio website templates and examples for ${ROLES.length} jobs: real estate agents, nurses, doctors, accountants, lawyers, developers, designers, trainers and more. Pick your job and see a portfolio written for it.`,
  alternates: { canonical: "/for" },
};

/** The job pages people look for most, shown first (ids must exist in lib/templates/roles). */
const POPULAR = [
  "real-estate-agent",
  "nurse",
  "doctor",
  "accountant",
  "corporate-lawyer",
  "full-stack-developer",
  "graphic-designer",
  "photographer",
  "personal-trainer",
  "marketing-manager",
  "language-teacher",
  "electrician",
];

const FAQ: FaqEntry[] = [
  {
    question: "What is a portfolio website?",
    answer:
      "A personal website that shows what you do: your services, experience, credentials, reviews and how to contact you. It’s one link you can share instead of a CV, and it shows up when people search your name.",
  },
  {
    question: "Do I need a portfolio if I’m not a designer?",
    answer: `Yes. Nurses, agents, accountants, lawyers and trainers all win work and jobs from being easy to find and easy to trust. ${brand.name} has a sample portfolio written for ${ROLES.length} jobs, so you start from words that fit your work.`,
  },
  {
    question: "Are these portfolio templates free?",
    answer: `Yes. The standard designs are free to use, and your website stays online for free at a ${brand.name} address. Pro unlocks the 3D designs, adds your own domain and removes the ${brand.name} link.`,
  },
  {
    question: "How long does it take?",
    answer:
      "Most people publish in under an hour: pick your job, choose a design, click any text to change it, and publish.",
  },
];

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      name: "Portfolio websites by job",
      url: `${siteUrl}/for`,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: ROLES.length,
        itemListElement: ROLES.map((role, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `Portfolio website for ${role.plural}`,
          url: `${siteUrl}/for/${role.id}`,
        })),
      },
    },
    roleBreadcrumbs(),
    faqSchema(FAQ),
  ],
};

/** Every job title we have sample content for, grouped by field and profession. */
export default function JobTitles() {
  const groups = rolesByProfession();
  return (
    <div className="mx-auto max-w-[1320px] px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
        {ROLES.length} job titles
      </p>
      <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(2.6rem,6vw,4.8rem)] font-[400] leading-[0.95] tracking-[-0.03em] text-ink [font-variation-settings:'opsz'_48]">
        Find your job. <em className="font-[300] text-signal">See your portfolio.</em>
      </h1>
      <p className="mt-6 max-w-[38rem] text-[1.08rem] leading-[1.7] text-ink-soft">
        Free portfolio website templates for {ROLES.length} jobs. Pick what you do and every design previews
        with a portfolio written for that job: the right services, credentials and wording. Then make it
        yours, without code.
      </p>

      <section className="mt-10" aria-labelledby="popular">
        <h2 id="popular" className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          Popular
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {POPULAR.map((id) => roleById(id))
            .filter((role) => role !== undefined)
            .map((role) => (
              <li key={role.id}>
                <Link
                  href={`/for/${role.id}`}
                  className="inline-block rounded-full border border-rule px-3.5 py-1.5 text-[0.92rem] text-ink hover:border-ink"
                >
                  Portfolio for {role.plural}
                </Link>
              </li>
            ))}
        </ul>
      </section>
      <div className="mt-16 space-y-16">
        {FIELDS.map((field) => {
          const inField = groups.filter((group) => group.profession.field === field.id);
          if (!inField.length) return null;
          return (
            <section key={field.id} aria-labelledby={`field-${field.id}`}>
              <h2
                id={`field-${field.id}`}
                className="border-b border-ink pb-3 font-display text-[2rem] tracking-[-0.02em] text-ink"
              >
                {field.label}
              </h2>
              <div className="mt-8 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {inField.map(({ profession, roles }) => (
                  <div key={profession.id}>
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
                      {profession.label}
                    </h3>
                    <ul className="mt-3 space-y-1.5">
                      {roles.map((role) => (
                        <li key={role.id}>
                          <Link
                            href={`/for/${role.id}`}
                            className="group inline-flex items-center gap-1.5 text-[1rem] text-ink hover:text-signal"
                          >
                            {role.label}
                            <ArrowRight
                              size={13}
                              className="opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <section className="mt-24 max-w-[52rem]" aria-labelledby="questions">
        <h2 id="questions" className="font-display text-[2.2rem] tracking-[-0.02em] text-ink">
          Questions about portfolio websites
        </h2>
        <div className="mt-6 divide-y divide-rule border-y border-rule">
          {FAQ.map((entry) => (
            <details key={entry.question} className="py-4">
              <summary className="cursor-pointer list-none font-medium text-ink">{entry.question}</summary>
              <p className="mt-2 leading-relaxed text-ink-soft">{entry.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

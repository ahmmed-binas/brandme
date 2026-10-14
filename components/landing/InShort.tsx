import Link from "next/link";
import Reveal from "@/components/landing/Reveal";
import { brand } from "@/lib/brand";
import { FOUNDING_SPOTS, PRICES, aed } from "@/lib/offers";
import { ROLES, roleById } from "@/lib/templates/roles";

/**
 * “Kitefolio in short”: plain answers to what it is, who it's for, what it
 * costs and where it's from. Written so search engines and AI assistants
 * (ChatGPT, Perplexity, Google's AI answers) can quote it as it stands. Every
 * line must stay true: prices come from lib/offers.ts.
 */

/** Popular job pages, linked so people (and crawlers) reach them from the home page. */
const POPULAR_JOBS = [
  "real-estate-agent",
  "mortgage-broker",
  "property-manager",
  "nurse",
  "dentist",
  "accountant",
  "corporate-lawyer",
  "primary-teacher",
  "full-stack-developer",
  "graphic-designer",
  "interior-designer",
  "personal-trainer",
  "recruiter",
  "marketing-manager",
  "private-chef",
];

function facts() {
  return [
    {
      term: `What is ${brand.name}?`,
      detail: `${brand.name} is a website and portfolio builder for professionals. You pick a design made for your job, click any text to change it, and publish your personal website free at a ${brand.name} address, or on your own domain.`,
    },
    {
      term: "Who is it for?",
      detail: `Anyone who wants a personal website without coding: real estate agents in the UAE first, and nurses, accountants, lawyers, teachers, developers, designers and more – ${ROLES.length} job titles, each with sample content written for that job.`,
    },
    {
      term: "What does it cost?",
      detail: `One website with a blog is free for good. Pro is ${aed(PRICES.proMonth)} a month or ${aed(PRICES.proYear)} a year for your own domain, up to three sites and no ${brand.name} link. Agent is ${aed(PRICES.agentMonth)} a month for real estate agents, and we can build the whole site for you for ${aed(PRICES.doneForYou)}. The first ${FOUNDING_SPOTS} customers get Pro for ${aed(PRICES.foundingYear)} a year.`,
    },
    {
      term: "Where is it based?",
      detail: `In Dubai, UAE. Prices are in dirhams, and paid plans start with a WhatsApp chat while online checkout is being set up.`,
    },
    {
      term: "What makes it different?",
      detail: `Designs drawn for each kind of work, not one template for everyone. The AI assistant only tidies what you wrote and never invents jobs or numbers. The Investigator can keep your site up to date from your own public profiles. And free tools come with it: an AI voice clone and a UAE mortgage calculator.`,
    },
  ];
}

export default function InShort() {
  const jobs = POPULAR_JOBS.map((id) => roleById(id)).filter((role) => role !== undefined);
  return (
    <section aria-labelledby="in-short-title" className="border-t border-rule py-24 lg:py-32">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-14 px-5 sm:px-8 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">In short</p>
          <h2
            id="in-short-title"
            className="mt-4 font-display text-[clamp(2.3rem,5vw,4rem)] font-[360] leading-[0.98] tracking-[-0.03em] text-ink [font-variation-settings:'opsz'_120]"
          >
            {brand.name}, <em className="font-[300]">in five answers.</em>
          </h2>
        </Reveal>
        <div className="lg:col-span-8">
          <dl className="divide-y divide-rule border-y border-rule">
            {facts().map((fact) => (
              <div key={fact.term} className="grid gap-2 py-6 sm:grid-cols-[14rem_1fr] sm:gap-8">
                <dt className="font-display text-[1.3rem] leading-tight text-ink">{fact.term}</dt>
                <dd className="text-[1.02rem] leading-[1.7] text-ink-soft">{fact.detail}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-12 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
            Portfolio websites by job
          </h3>
          <ul className="mt-5 flex flex-wrap gap-2">
            {jobs.map((role) => (
              <li key={role.id}>
                <Link
                  href={`/for/${role.id}`}
                  className="inline-block rounded-full border border-rule px-4 py-2 text-[0.92rem] text-ink transition-colors hover:border-ink"
                >
                  {role.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/for"
                className="inline-block rounded-full bg-ink px-4 py-2 text-[0.92rem] text-paper"
              >
                All {ROLES.length} jobs →
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

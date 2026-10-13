import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import PreviewFrame from "@/components/templates/PreviewFrame";
import type { GalleryArticle } from "@/lib/gallery/items";
import { faqSchema, roleFaq, roleTemplateBreadcrumbs, type FaqEntry } from "@/lib/gallery/role-seo";
import { availableTemplates } from "@/lib/templates/approval";
import { designsForRole } from "@/lib/templates/links";
import type { Role } from "@/lib/templates/roles";
import { brand } from "@/lib/brand";

/**
 * /for/<job>/<template>: the page people land on from a search like
 * “content marketer portfolio”. It is about their job first: what a portfolio
 * for that job needs (from the job's sample content), how this design shows
 * it, other designs for the same job, and the job's own questions. The
 * design's story and the code download live on /gallery/<template>.
 */

/** What each section of a design does for someone in this job. */
const SECTION_JOBS: Record<string, (plural: string) => string> = {
  projects: () => "your best work as case studies, each with the result it got",
  stats: () => "your numbers up front, where a hiring manager or client sees them first",
  services: () => "what you offer and what it costs, so the right people get in touch",
  testimonials: () => "what clients and colleagues say about you, in their words",
  experience: () => "where you’ve worked, in a clean timeline",
  highlights: (plural) => `the talks, awards and press that matter to ${plural}`,
  skills: () => "the skills and tools people search for",
  education: () => "your qualifications and certificates",
  about: () => "a short, human introduction in your own voice",
};

const list = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

export async function RoleTemplateArticle({
  item,
  role,
  previewSrc,
  editorHref,
}: {
  item: GalleryArticle;
  role: Role;
  previewSrc: string | null;
  editorHref: string;
}) {
  const s = role.starter;
  const skills = s.skills.split(" · ").slice(0, 6);
  const others = designsForRole(role, await availableTemplates().catch(() => []), 7)
    .filter((template) => template.id !== item.slug)
    .slice(0, 3);
  const jobLabel = role.label.toLowerCase();

  // What a portfolio for this job needs, shown with the job's own sample content.
  const needs = [
    { title: "What you do, in one line", example: s.tagline },
    {
      title: "Services and prices",
      example: s.services
        .map(([title]) => title)
        .slice(0, 3)
        .join(" · "),
    },
    {
      title: "Results in numbers",
      example: s.stats.map(([value, label]) => `${value} ${label}`).join(" · "),
    },
    { title: "Proof from people you’ve worked with", example: `“${s.quote[0]}”` },
    { title: "Skills people search for", example: skills.join(" · ") },
    { title: "One clear way to contact you", example: "Email, WhatsApp or a booking link, on every screen" },
  ];

  const shows = item.sections
    .map((section) => SECTION_JOBS[section.toLowerCase()]?.(role.plural))
    .filter((line): line is string => Boolean(line))
    .slice(0, 5);

  const faq: FaqEntry[] = [
    ...roleFaq(role),
    {
      question: `Why use ${item.title} for a ${jobLabel} portfolio?`,
      answer: `${item.title} shows ${list(shows.slice(0, 3))}. It opens with sample content written for ${role.plural}, so you replace words rather than start from a blank page.`,
    },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [roleTemplateBreadcrumbs(role, item.title, item.slug), faqSchema(faq)],
  };

  return (
    <article className="pb-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
      <div className="mx-auto max-w-[1240px] px-5 pt-10 sm:px-8 lg:pt-14">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft"
        >
          <Link href="/for" className="inline-flex items-center gap-2 hover:text-ink">
            <ArrowLeft size={13} /> By job
          </Link>
          <span aria-hidden>/</span>
          <Link href={`/for/${role.id}`} className="hover:text-ink">
            {role.label}
          </Link>
          <span aria-hidden>/</span>
          <span className="text-ink">{item.title}</span>
        </nav>

        <header className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
              Free template · {item.title} design
            </p>
            <h1 className="mt-4 font-display text-[clamp(2.8rem,6.6vw,5.6rem)] font-[400] leading-[0.95] tracking-[-0.035em] text-ink [font-variation-settings:'opsz'_72]">
              {role.label} portfolio
              <span className="block italic text-ink-soft">in the {item.title} style</span>
            </h1>
            <p className="mt-6 max-w-[40rem] text-[1.2rem] leading-[1.55] text-ink-soft">
              A free personal website for {role.plural}. It opens with sample content written for your job,{" "}
              {list(s.services.map(([title]) => title.toLowerCase()).slice(0, 2))} included, so you change the
              words, add your photo and publish. No code.
            </p>
          </div>
          <div className="space-y-4 lg:pb-2">
            <Link
              href={editorHref}
              className="flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 text-[1.02rem] font-medium text-paper transition-colors hover:bg-signal hover:text-signal-ink"
            >
              Start with this design, free <ArrowRight size={17} />
            </Link>
            <Link
              href={`/for/${role.id}`}
              className="flex items-center justify-center rounded-full border border-rule px-6 py-3.5 text-[0.98rem] text-ink hover:border-ink"
            >
              See every design for {role.plural}
            </Link>
            <p className="text-center text-[0.88rem] text-ink-soft">
              No card needed · your own domain with Pro
            </p>
          </div>
        </header>

        {previewSrc && (
          <figure className="mx-auto mt-14 max-w-[760px] overflow-hidden rounded-[1.6rem] border border-rule bg-ink/5 shadow-[0_50px_120px_-60px_rgba(0,0,0,.6)]">
            <div className="flex items-center gap-1.5 border-b border-rule bg-card px-4 py-3" aria-hidden>
              <span className="size-2.5 rounded-full bg-ink/15" />
              <span className="size-2.5 rounded-full bg-ink/15" />
              <span className="size-2.5 rounded-full bg-ink/15" />
              <span className="ml-3 truncate font-mono text-[11px] text-ink-faint">yourname.com</span>
            </div>
            <div className="aspect-[4/5] w-full sm:aspect-square">
              <PreviewFrame
                src={previewSrc}
                title={`${item.title} as a ${jobLabel} portfolio, live preview`}
                className="h-full"
              />
            </div>
            <figcaption className="border-t border-rule bg-card px-4 py-3 text-center text-[0.88rem] text-ink-soft">
              Live preview with sample {jobLabel} content. Scroll inside it.
            </figcaption>
          </figure>
        )}
      </div>

      {/* What the portfolio needs, with the job's own examples */}
      <section className="mx-auto mt-24 max-w-[1240px] px-5 sm:px-8" aria-labelledby="needs">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">The essentials</p>
        <h2
          id="needs"
          className="mt-3 max-w-[44rem] font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.02] tracking-[-0.02em] text-ink"
        >
          What a {jobLabel} portfolio should include
        </h2>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {needs.map((need, index) => (
            <li key={need.title} className="rounded-2xl border border-rule bg-card p-6">
              <p className="font-mono text-[11px] text-ink-soft">{String(index + 1).padStart(2, "0")}</p>
              <h3 className="mt-2 font-display text-[1.35rem] leading-tight text-ink">{need.title}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.16em]">Example · </span>
                {need.example}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* How this design shows it */}
      {shows.length > 0 && (
        <section className="mx-auto mt-24 grid max-w-[1240px] gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Why {item.title}</p>
            <h2 className="mt-3 font-display text-[clamp(2rem,4.2vw,3.2rem)] leading-[1.02] tracking-[-0.02em] text-ink">
              How {item.title} presents a {jobLabel}
            </h2>
            <p className="mt-4 text-ink-soft">{item.summary}</p>
          </div>
          <ul className="space-y-3">
            {shows.map((line) => (
              <li
                key={line}
                className="flex gap-3 rounded-2xl border border-rule bg-card px-5 py-4 text-[1.02rem] text-ink"
              >
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-signal" />
                <span>It shows {line}.</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Steps */}
      <section className="mx-auto mt-24 max-w-[1240px] px-5 sm:px-8" aria-labelledby="steps">
        <div className="rounded-[2rem] bg-ink px-7 py-12 text-paper sm:px-12">
          <h2 id="steps" className="font-display text-[clamp(1.9rem,4vw,3rem)] leading-tight">
            Your {jobLabel} website in three steps
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              ["Open it", `${item.title} opens with sample content for ${role.plural}.`],
              ["Make it yours", "Click any text or photo to change it, or import your CV or LinkedIn."],
              ["Publish", `Go live at a free ${brand.name} address, or on your own domain with Pro.`],
            ].map(([title, text], index) => (
              <li key={title}>
                <p className="font-mono text-[12px] text-paper/50">0{index + 1}</p>
                <p className="mt-1 font-display text-[1.4rem]">{title}</p>
                <p className="mt-1 text-[0.95rem] text-paper/75">{text}</p>
              </li>
            ))}
          </ol>
          <Link
            href={editorHref}
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-paper px-6 py-3.5 font-medium text-ink hover:bg-signal hover:text-signal-ink"
          >
            Start with {item.title} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Other designs for the same job */}
      {others.length > 0 && (
        <section className="mx-auto mt-24 max-w-[1240px] px-5 sm:px-8" aria-labelledby="others">
          <h2
            id="others"
            className="font-display text-[clamp(1.9rem,4vw,3rem)] leading-none tracking-[-0.02em] text-ink"
          >
            More {jobLabel} portfolio designs
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-3">
            {others.map((template) => (
              <li key={template.id}>
                <Link href={`/for/${role.id}/${template.id}`} className="group block">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static thumbnail */}
                  <img
                    src={`/templates/${template.id}.webp`}
                    alt=""
                    loading="lazy"
                    className="aspect-[3/2] w-full rounded-2xl border border-rule object-cover object-top transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                  <span className="mt-3 block font-display text-[1.4rem] leading-none text-ink">
                    {template.name}
                  </span>
                  <span className="mt-1 block text-[0.9rem] text-ink-soft">{template.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mx-auto mt-24 max-w-[52rem] px-5 sm:px-8" aria-labelledby="faq">
        <h2
          id="faq"
          className="font-display text-[clamp(2rem,4vw,3rem)] leading-none tracking-[-0.02em] text-ink"
        >
          {role.label} portfolio questions
        </h2>
        <dl className="mt-8 divide-y divide-rule border-y border-rule">
          {faq.map((entry) => (
            <div key={entry.question} className="py-6">
              <dt className="font-medium text-ink">{entry.question}</dt>
              <dd className="mt-2 leading-relaxed text-ink-soft">{entry.answer}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-[0.92rem] text-ink-soft">
          Developer? The {item.title} code is free to download from its{" "}
          <Link href={`/gallery/${item.slug}`} className="underline underline-offset-4">
            gallery page
          </Link>
          . More about the design is there too.
        </p>
      </section>
    </article>
  );
}

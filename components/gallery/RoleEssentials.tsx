import { MessageCircle, Mail, Star } from "lucide-react";
import type { Role } from "@/lib/templates/roles";

/**
 * “What a <job> portfolio should include”: six essentials, each drawn as a
 * small piece of a real page (a headline, price tags, big numbers, a review,
 * skill tags, a WhatsApp button) filled with the job's own sample content.
 * Used on /for/<job> and /for/<job>/<template>, the pages people land on from
 * searches like “content marketer portfolio”. The text stays in the page for
 * search engines; the pictures make it quick to take in.
 */

const card =
  "group relative overflow-hidden rounded-3xl border border-rule bg-card p-6 transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-40px_rgba(0,0,0,.45)]";

function Count({ index }: { index: number }) {
  return <p className="font-mono text-[11px] text-ink-soft">{String(index).padStart(2, "0")}</p>;
}

function Title({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-2 font-display text-[1.35rem] leading-tight text-ink">{children}</h3>;
}

/** A short caption under each picture, so the example reads as text too. */
function Note({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-[0.92rem] leading-relaxed text-ink-soft">{children}</p>;
}

export function RoleEssentials({ role, className = "" }: { role: Role; className?: string }) {
  const s = role.starter;
  const jobLabel = role.label.toLowerCase();
  const services = s.services.slice(0, 3);
  const skills = s.skills.split(" · ").slice(0, 7);

  return (
    <section className={className} aria-labelledby="essentials">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">The essentials</p>
      <h2
        id="essentials"
        className="mt-3 max-w-[44rem] font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.02] tracking-[-0.02em] text-ink"
      >
        What a {jobLabel} portfolio should include
      </h2>
      <ol className="mt-10 grid gap-4 md:grid-cols-6">
        {/* 01: one line on what you do, as the top of a page. */}
        <li className={`${card} md:col-span-4`}>
          <Count index={1} />
          <Title>What you do, in one line</Title>
          <div className="mt-5 rounded-2xl border border-rule bg-paper p-5">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
            </div>
            <p className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-signal">{s.title}</p>
            <p className="mt-2 font-display text-[clamp(1.4rem,2.6vw,2.1rem)] leading-[1.08] tracking-[-0.02em] text-ink">
              {s.tagline}
            </p>
            <span className="mt-4 block h-1 w-0 rounded-full bg-signal transition-[width] duration-700 group-hover:w-24" />
          </div>
        </li>

        {/* 02: services with prices, as tags. */}
        <li className={`${card} md:col-span-2`}>
          <Count index={2} />
          <Title>Services and prices</Title>
          <ul className="mt-5 space-y-2.5">
            {services.map(([title, , price], index) => (
              <li
                key={title}
                className="flex items-center justify-between gap-3 rounded-xl border border-rule bg-paper px-3.5 py-2.5 text-[0.9rem] transition-transform duration-500 group-hover:translate-x-1"
                style={{ transitionDelay: `${index * 70}ms` }}
              >
                <span className="truncate text-ink">{title}</span>
                <span className="shrink-0 rounded-full bg-signal px-2.5 py-1 font-mono text-[11px] text-signal-ink">
                  {price}
                </span>
              </li>
            ))}
          </ul>
        </li>

        {/* 03: results as big numbers. */}
        <li className={`${card} md:col-span-2`}>
          <Count index={3} />
          <Title>Results in numbers</Title>
          <div className="mt-5 grid gap-3">
            {s.stats.map(([value, label]) => (
              <div key={label} className="flex items-baseline gap-3">
                <span className="font-display text-[2.2rem] leading-none tracking-[-0.03em] text-ink transition-colors duration-500 group-hover:text-signal">
                  {value}
                </span>
                <span className="text-[0.88rem] text-ink-soft">{label}</span>
              </div>
            ))}
          </div>
        </li>

        {/* 04: a review, as a quote card. */}
        <li className={`${card} md:col-span-4`}>
          <Count index={4} />
          <Title>Proof from people you’ve worked with</Title>
          <figure className="mt-5 rounded-2xl bg-ink p-6 text-paper">
            <div className="flex gap-1 text-[#f5c451]" aria-label="5 out of 5">
              {[0, 1, 2, 3, 4].map((star) => (
                <Star
                  key={star}
                  size={16}
                  fill="currentColor"
                  className="transition-transform duration-300 group-hover:scale-125"
                  style={{ transitionDelay: `${star * 60}ms` }}
                />
              ))}
            </div>
            <blockquote className="mt-3 font-display text-[1.25rem] leading-snug">“{s.quote[0]}”</blockquote>
            <figcaption className="mt-3 text-[0.85rem] text-paper/70">
              {s.quote[1]} · {s.quote[2]}
            </figcaption>
          </figure>
        </li>

        {/* 05: skills people search for, as tags. */}
        <li className={`${card} md:col-span-3`}>
          <Count index={5} />
          <Title>Skills people search for</Title>
          <ul className="mt-5 flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <li
                key={skill}
                className="rounded-full border border-rule bg-paper px-3 py-1.5 text-[0.85rem] text-ink transition-[transform,background-color,color] duration-500 group-hover:-translate-y-0.5 group-hover:bg-ink group-hover:text-paper"
                style={{ transitionDelay: `${index * 40}ms` }}
              >
                {skill}
              </li>
            ))}
          </ul>
          <Note>Use the words people type into Google, so they find you.</Note>
        </li>

        {/* 06: one clear way to get in touch. */}
        <li className={`${card} md:col-span-3`}>
          <Count index={6} />
          <Title>One clear way to contact you</Title>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="relative inline-flex items-center gap-2 rounded-full bg-[#1f8f55] px-5 py-3 text-[0.95rem] font-medium text-white">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#1f8f55] opacity-25 motion-reduce:animate-none" />
              <MessageCircle size={18} />
              WhatsApp me
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-rule bg-paper px-5 py-3 text-[0.95rem] text-ink">
              <Mail size={17} />
              Email
            </span>
          </div>
          <Note>Email, WhatsApp or a booking link, on every screen.</Note>
        </li>
      </ol>
    </section>
  );
}

import type { Role } from "@/lib/templates/roles";

/**
 * “What a <job> portfolio should include”: six essentials, each with an
 * example taken from the job's own sample content. Used on /for/<job> and
 * /for/<job>/<template>, the pages people land on from searches like
 * “content marketer portfolio”.
 */
export function RoleEssentials({ role, className = "" }: { role: Role; className?: string }) {
  const s = role.starter;
  const jobLabel = role.label.toLowerCase();
  const needs = [
    { title: "What you do, in one line", example: s.tagline },
    {
      title: "Services and prices",
      example: s.services
        .map(([title, , price]) => `${title} (${price})`)
        .slice(0, 3)
        .join(" · "),
    },
    {
      title: "Results in numbers",
      example: s.stats.map(([value, label]) => `${value} ${label}`).join(" · "),
    },
    { title: "Proof from people you’ve worked with", example: `“${s.quote[0]}”` },
    { title: "Skills people search for", example: s.skills.split(" · ").slice(0, 6).join(" · ") },
    { title: "One clear way to contact you", example: "Email, WhatsApp or a booking link, on every screen" },
  ];

  return (
    <section className={className} aria-labelledby="essentials">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">The essentials</p>
      <h2
        id="essentials"
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
  );
}

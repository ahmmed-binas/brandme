import { BadgeCheck, LayoutTemplate, MessageCircle, PenLine, Rocket } from "lucide-react";
import { roleSteps } from "@/lib/gallery/role-seo";
import type { Role } from "@/lib/templates/roles";

/**
 * “How to make a <job> portfolio website”: the five steps as a timeline of
 * cards with an icon each, joined by a line (across on wide screens, down on
 * phones). The step text comes from roleSteps, so it stays in the page for
 * search engines and AI answers.
 */
const ICONS = [LayoutTemplate, PenLine, BadgeCheck, MessageCircle, Rocket];
const NAMES = ["Pick a design", "Write your words", "Add proof", "Make contact easy", "Publish free"];

export function RoleSteps({ role, className = "" }: { role: Role; className?: string }) {
  const steps = roleSteps(role);
  return (
    <section className={className} aria-labelledby="how-to">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
        Five steps · about ten minutes
      </p>
      <h2
        id="how-to"
        className="mt-3 max-w-[44rem] font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.02] tracking-[-0.02em] text-ink"
      >
        How to make a {role.label.toLowerCase()} portfolio website
      </h2>
      <ol className="relative mt-10 grid gap-4 lg:grid-cols-5">
        {/* The line joining the steps. */}
        <span
          aria-hidden
          className="absolute bottom-6 left-[27px] top-6 w-px bg-rule lg:bottom-auto lg:left-6 lg:right-6 lg:top-[27px] lg:h-px lg:w-auto"
        />
        {steps.map((step, index) => {
          const Icon = ICONS[index] ?? Rocket;
          return (
            <li key={index} className="group relative flex gap-4 lg:flex-col">
              <span className="relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl border border-rule bg-paper text-ink transition-[transform,background-color,color] duration-500 group-hover:-rotate-6 group-hover:bg-ink group-hover:text-paper">
                <Icon size={22} />
              </span>
              <div className="rounded-2xl border border-rule bg-card p-5 transition-[transform,box-shadow] duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_24px_50px_-36px_rgba(0,0,0,.45)] lg:min-h-[13rem]">
                <p className="font-mono text-[11px] text-signal">Step {index + 1}</p>
                <h3 className="mt-1 font-display text-[1.25rem] leading-tight text-ink">{NAMES[index]}</h3>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft">{step}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

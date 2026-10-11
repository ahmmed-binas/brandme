import Link from "next/link";
import type { ReactNode } from "react";
import { Check, X } from "lucide-react";
import { RateTemplate, type RatingSummary } from "@/components/templates/Rating";

export interface AgentProfileProps {
  slug: string;
  role: string;
  greeting: string;
  title: ReactNode;
  intro: ReactNode;
  avatar: ReactNode;
  actions: Array<{ href: string; label: string; primary?: boolean }>;
  rating: RatingSummary;
  steps: ReadonlyArray<readonly [string, string]>;
  never: { intro: string; items: string[]; promise: string };
  faq: ReadonlyArray<readonly [string, string]>;
}

/** The page layout every agent shares: who they are, how they work, what they never do, questions. */
export function AgentProfile({
  slug,
  role,
  greeting,
  title,
  intro,
  avatar,
  actions,
  rating,
  steps,
  never,
  faq,
}: AgentProfileProps) {
  return (
    <div className="mx-auto max-w-[1100px] px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
        <Link href="/agents" className="hover:text-ink">
          Agents
        </Link>{" "}
        / {role}
      </p>
      <div className="mt-6 grid items-center gap-10 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="font-display text-[1.4rem] italic text-ink-soft">{greeting}</p>
          <h1 className="mt-2 max-w-[18ch] font-display text-[clamp(2.4rem,5.4vw,4.4rem)] leading-[1] tracking-[-0.02em]">
            {title}
          </h1>
          <p className="mt-6 max-w-[40rem] text-[1.08rem] leading-[1.7] text-ink-soft">{intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={
                  action.primary
                    ? "rounded-full bg-ink px-6 py-3 text-paper hover:bg-signal hover:text-signal-ink"
                    : "rounded-full border border-rule px-6 py-3 hover:border-ink"
                }
              >
                {action.label}
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <RateTemplate
              templateId={`agent-${slug}`}
              initial={rating}
              endpoint={`/api/agents/${slug}/rating`}
              returnTo={`/agents/${slug}`}
            />
          </div>
        </div>
        <div className="mx-auto">{avatar}</div>
      </div>

      <section className="mt-20 border-t border-rule pt-12">
        <h2 className="font-display text-[2.2rem]">How it works</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {steps.map(([heading, body], index) => (
            <li key={heading} className="border-t border-ink pt-4">
              <p className="font-mono text-[12px] text-ink-faint">0{index + 1}</p>
              <h3 className="mt-2 font-display text-[1.4rem]">{heading}</h3>
              <p className="mt-2 text-ink-soft">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-20 grid gap-10 rounded-2xl border border-rule p-8 lg:grid-cols-2 lg:p-12">
        <div>
          <h2 className="font-display text-[2rem] leading-tight">What it never does</h2>
          <p className="mt-3 text-ink-soft">{never.intro}</p>
        </div>
        <ul className="space-y-3">
          {never.items.map((line) => (
            <li key={line} className="flex gap-3">
              <X size={18} className="mt-0.5 shrink-0 text-[color:var(--destructive)]" />
              {line}
            </li>
          ))}
          <li className="flex gap-3">
            <Check size={18} className="mt-0.5 shrink-0 text-emerald-700" />
            {never.promise}
          </li>
        </ul>
      </section>

      <section className="mx-auto mt-20 max-w-[48rem]">
        <h2 className="font-display text-[2.2rem] leading-tight">Questions</h2>
        <dl className="mt-8 divide-y divide-rule border-y border-rule">
          {faq.map(([question, answer]) => (
            <div key={question} className="py-6">
              <dt className="font-medium">{question}</dt>
              <dd className="mt-2 leading-relaxed text-ink-soft">{answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

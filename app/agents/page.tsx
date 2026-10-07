import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { InspectorAvatar } from "@/components/agents/InspectorAvatar";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Agents",
  description: `Helpers that keep your ${brand.name} website up to date, so you don’t have to remember to.`,
  alternates: { canonical: "/agents" },
};

const AGENTS = [
  { href: "/agents/investigator", name: "Inspector Iqbal", role: "The Investigator", summary: "Checks your own public profiles on the schedule you choose, finds your professional news and keeps your website up to date. Your first check is free." },
];

export default function AgentsPage() {
  return <div className="mx-auto max-w-[1100px] px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Agents</p>
    <h1 className="mt-4 max-w-[20ch] font-display text-[clamp(2.4rem,5.4vw,4.4rem)] leading-[1] tracking-[-0.02em]">Your website, kept up to date <em className="font-[300] text-signal">for you.</em></h1>
    <p className="mt-6 max-w-[40rem] text-[1.08rem] leading-[1.7] text-ink-soft">Most people build a portfolio once and never touch it again. Our agents do the remembering: they notice what’s new in your career and bring it to your site, and nothing changes without the rules you set.</p>
    <ul className="mt-14 grid gap-5 md:grid-cols-2">{AGENTS.map(({ href, name, role, summary }) => <li key={href}>
      <Link href={href} className="group flex h-full flex-col rounded-2xl border border-rule bg-white/50 p-7 transition-colors hover:border-ink">
        <InspectorAvatar size={84} title={null} />
        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">{role}</p>
        <h2 className="mt-1 font-display text-[1.8rem] leading-none">{name}</h2>
        <p className="mt-3 flex-1 text-ink-soft">{summary}</p>
        <span className="mt-6 inline-flex items-center gap-1.5 text-[0.95rem] text-ink underline-offset-4 group-hover:underline">Meet Inspector Iqbal <ArrowRight size={15} /></span>
      </Link>
    </li>)}</ul>
  </div>;
}

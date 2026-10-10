import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { InspectorAvatar } from "@/components/agents/InspectorAvatar";
import { EllisAvatar, RowanAvatar } from "@/components/agents/AgentAvatars";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Agents",
  description: `Helpers that write, review and update your ${brand.name} website for you, and custom AI agents for SEO, AEO and marketing.`,
  alternates: { canonical: "/agents" },
};

const AGENTS: Array<{ href: string; name: string; role: string; summary: string; cta: string; avatar: ReactNode }> = [
  { href: "/agents/investigator", name: "Inspector Iqbal", role: "The Investigator", cta: "Meet Inspector Iqbal", avatar: <InspectorAvatar size={84} title={null} />, summary: "Checks your own public profiles on the schedule you choose, finds your professional news and keeps your website up to date. Your first check is free." },
  { href: "/agents/editor", name: "Ellis", role: "The Editor", cta: "Meet Ellis", avatar: <EllisAvatar size={84} title={null} />, summary: "Change your website by asking. Ellis rewrites your text in your voice, keeps every fact, and turns a CV or LinkedIn export into a first draft." },
  { href: "/agents/reviewer", name: "Rowan", role: "The Reviewer", cta: "Meet Rowan", avatar: <RowanAvatar size={84} title={null} />, summary: "Reads your blog post before it goes live: spelling, clarity, the title and any claim that needs a source. You choose what to change." },
];

export default function AgentsPage() {
  return <div className="mx-auto max-w-[1100px] px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Agents</p>
    <h1 className="mt-4 max-w-[20ch] font-display text-[clamp(2.4rem,5.4vw,4.4rem)] leading-[1] tracking-[-0.02em]">Your website, written, checked and kept up to date <em className="font-[300] text-signal">for you.</em></h1>
    <p className="mt-6 max-w-[40rem] text-[1.08rem] leading-[1.7] text-ink-soft">Most people build a website once and never touch it again. Our agents do the work you put off: they write, they check, they notice what’s new, and nothing changes without the rules you set.</p>
    <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{AGENTS.map(({ href, name, role, summary, cta, avatar }) => <li key={href}>
      <Link href={href} className="group flex h-full flex-col rounded-2xl border border-rule bg-[color-mix(in_oklab,var(--ink)_3%,transparent)] p-7 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-ink">
        {avatar}
        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">{role}</p>
        <h2 className="mt-1 font-display text-[1.8rem] leading-none">{name}</h2>
        <p className="mt-3 flex-1 text-ink-soft">{summary}</p>
        <span className="mt-6 inline-flex items-center gap-1.5 text-[0.95rem] text-ink underline-offset-4 group-hover:underline">{cta} <ArrowRight size={15} /></span>
      </Link>
    </li>)}</ul>

    <Link href="/agents/custom" className="group relative mt-5 block overflow-hidden rounded-2xl bg-[#0b0a09] p-8 text-[#f4f0e8] lg:p-12">
      <span aria-hidden className="absolute -right-20 -top-28 size-80 rounded-full bg-[#e0a43a] opacity-30 blur-3xl transition-opacity duration-700 group-hover:opacity-50" />
      <span aria-hidden className="absolute -bottom-32 left-1/3 size-80 rounded-full bg-[#6b3fa0] opacity-30 blur-3xl" />
      <div className="relative grid items-end gap-8 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#e0a43a]">New · Build your own agent</p>
          <h2 className="mt-4 max-w-[20ch] font-display text-[clamp(2rem,4vw,3.4rem)] leading-[1] tracking-[-0.02em]">An agent for your business: SEO, AI answers and marketing.</h2>
          <p className="mt-4 max-w-[36rem] text-white/70">Get found on Google and in ChatGPT, keep your social media and email going, follow up every lead. Built for your website, from $10.</p>
        </div>
        <span className="inline-flex items-center gap-2 self-end rounded-full bg-[#f4f0e8] px-6 py-3.5 font-medium text-[#15140f] transition-transform group-hover:-translate-y-0.5">Build your agent <ArrowRight size={17} /></span>
      </div>
    </Link>
  </div>;
}

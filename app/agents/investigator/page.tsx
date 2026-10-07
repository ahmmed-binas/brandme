import type { Metadata } from "next";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { CHECK_CREDITS_ESTIMATE } from "@/lib/investigator/schedule";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "The Investigator: your website, kept up to date",
  description: `The ${brand.name} Investigator checks your own public profiles on the schedule you choose, double-checks what it finds, and keeps your website up to date. Your first check is free.`,
  alternates: { canonical: "/agents/investigator" },
};

const usd = (credits: number) => `$${(credits / 100).toFixed(2)}`;

const STEPS = [
  ["You add your own profiles", "Your website, GitHub, blog or newsletter feed, YouTube, Medium, Substack, LinkedIn and more. You tick a box to confirm they’re yours."],
  ["It checks on your schedule", "Every day, week, month, six months, once a year, or every so many days. You can also press “Check now” whenever you like."],
  ["It reads and searches", "It reads your public pages (in a real browser, so modern sites are understood) and searches the web around you for professional news: a new role, a talk, an award, an article."],
  ["It double-checks", "Every finding is checked against the page it came from. If that page doesn’t mention you, it’s dropped; if it’s not sure, it waits for you."],
  ["You stay in charge", "Choose “Ask me first” and updates wait in your editor until you add them. Or let confident updates go straight onto your site, with an email and 30 days to undo."],
] as const;

const NEVER = [
  "Log in anywhere, or ask for your passwords",
  "Look at anyone but you, or without your consent",
  "Read private messages, private posts or anything behind a login",
  "Change your site without the rules you chose",
];

const FAQ: Array<[string, string]> = [
  ["What does it cost?", `Your first check is free. After that, reading GitHub and blog feeds is free, and the AI step costs about ${CHECK_CREDITS_ESTIMATE.low}–${CHECK_CREDITS_ESTIMATE.high} credits per check (${usd(CHECK_CREDITS_ESTIMATE.low)}–${usd(CHECK_CREDITS_ESTIMATE.high)}), from credits sold at cost or nothing extra with your own Claude API key. It works on every plan, including free Basic.`],
  ["Why can’t it read my LinkedIn properly?", "LinkedIn, Instagram, Facebook, X and TikTok show very little to visitors who aren’t logged in, and we never log in as you. Those links still help it be sure it has found you. For LinkedIn job changes, upload your LinkedIn data export in the editor."],
  ["What if it gets something wrong?", "Anything it isn’t sure about waits for you. Automatic changes are emailed to you and can be undone for 30 days from the Investigator page, which puts your site back exactly as it was."],
  ["Does it update my PDF CV?", "No, only your website."],
];

export default function InvestigatorPage() {
  return <div className="mx-auto max-w-[1100px] px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft"><Link href="/agents" className="hover:text-ink">Agents</Link> / The Investigator</p>
    <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(2.4rem,5.4vw,4.4rem)] leading-[1] tracking-[-0.02em]">It notices your news, <em className="font-[300] text-signal">so your site does too.</em></h1>
    <p className="mt-6 max-w-[40rem] text-[1.08rem] leading-[1.7] text-ink-soft">People rarely update their portfolio by hand. The Investigator watches your own public profiles, finds what’s new in your working life, checks it, and brings it to your website. Your first check is free, on every plan.</p>
    <div className="mt-8 flex flex-wrap gap-3"><Link href="/account/investigator" className="rounded-full bg-ink px-6 py-3 text-paper hover:bg-signal hover:text-signal-ink">Try your free check</Link><Link href="/pricing" className="rounded-full border border-rule px-6 py-3 hover:border-ink">See pricing</Link></div>

    <section className="mt-20 border-t border-rule pt-12">
      <h2 className="font-display text-[2.2rem]">How it works</h2>
      <ol className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">{STEPS.map(([title, body], index) => <li key={title} className="border-t border-ink pt-4"><p className="font-mono text-[12px] text-ink-faint">0{index + 1}</p><h3 className="mt-2 font-display text-[1.4rem]">{title}</h3><p className="mt-2 text-ink-soft">{body}</p></li>)}</ol>
    </section>

    <section className="mt-20 grid gap-10 rounded-2xl border border-rule p-8 lg:grid-cols-2 lg:p-12">
      <div><h2 className="font-display text-[2rem] leading-tight">What it never does</h2><p className="mt-3 text-ink-soft">Your data is yours. The Investigator only looks at you, only at what anyone can see without logging in, and only with your say-so.</p></div>
      <ul className="space-y-3">{NEVER.map((line) => <li key={line} className="flex gap-3"><X size={18} className="mt-0.5 shrink-0 text-[color:var(--destructive)]" />{line}</li>)}
        <li className="flex gap-3"><Check size={18} className="mt-0.5 shrink-0 text-emerald-700" />Tell you which profiles it couldn’t read, and why</li></ul>
    </section>

    <section className="mx-auto mt-20 max-w-[48rem]">
      <h2 className="font-display text-[2.2rem] leading-tight">Questions</h2>
      <dl className="mt-8 divide-y divide-rule border-y border-rule">{FAQ.map(([question, answer]) => <div key={question} className="py-6"><dt className="font-medium">{question}</dt><dd className="mt-2 leading-relaxed text-ink-soft">{answer}</dd></div>)}</dl>
    </section>
  </div>;
}

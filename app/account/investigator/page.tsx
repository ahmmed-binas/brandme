import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import InvestigatorPanel from "@/components/investigator/InvestigatorPanel";
import { InspectorAvatar } from "@/components/agents/InspectorAvatar";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

export const metadata: Metadata = { title: "Inspector Iqbal, the Investigator", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function InvestigatorPage() {
  const user = databaseConfigured() ? await getCurrentUser().catch(() => null) : null;
  if (!user) redirect("/login?callbackUrl=/account/investigator");
  return <main className="px-5 pb-24 pt-14"><div className="mx-auto max-w-3xl">
    <Link href="/account" className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft hover:text-ink">← Account</Link>
    <div className="mt-6 flex items-center gap-5">
      <InspectorAvatar size={88} className="shrink-0" />
      <div><p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">The Investigator</p>
        <p className="mt-1 font-display text-[1.6rem] leading-none text-ink">Inspector Iqbal</p></div>
    </div>
    <h1 className="mt-6 font-display text-[clamp(2.4rem,5.6vw,3.8rem)] leading-[0.98] tracking-[-0.02em] text-ink">Your website keeps up with your career.</h1>
    <p className="mt-5 text-[1.08rem] leading-[1.7] text-ink-soft">Give Inspector Iqbal your profiles. On the schedule you choose, he reads them, searches the web for your professional news, and compares what he finds with your website. New job, talk, award or article? He tells you, or updates your site for you. <Link href="/agents/investigator" className="text-ink underline underline-offset-4">How he works</Link></p>
    <InvestigatorPanel />
  </div></main>;
}

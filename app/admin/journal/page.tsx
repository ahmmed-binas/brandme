import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JournalEditor from "@/components/blog/JournalEditor";
import { isModeratorEmail } from "@/lib/community/rules";
import { JOURNAL_CATEGORIES, listJournal } from "@/lib/content/journal";
import { getCurrentUser } from "@/utils/user-account";

export const metadata: Metadata = { title: "Journal editor", robots: { index: false } };

/** Admins write, edit, publish and hide Journal posts here. */
export default async function JournalAdmin() {
  const viewer = await getCurrentUser().catch(() => null);
  if (!isModeratorEmail(viewer?.email)) notFound();
  return <div className="mx-auto max-w-[1320px] px-5 pb-24 pt-12 sm:px-8">
    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Admin · Journal</p>
    <h1 className="mt-3 font-display text-[clamp(2.2rem,4.4vw,3.4rem)] leading-[1] tracking-[-0.02em]">Write for the Journal</h1>
    <p className="mt-3 max-w-[44rem] text-ink-soft">Posts appear at <Link href="/blog" className="underline">/blog</Link>, in the sitemap and the RSS feed as soon as you publish. Articles that shipped with the site can be edited or hidden too; deleting your edit restores the original.</p>
    <JournalEditor initial={await listJournal({ drafts: true })} categories={[...JOURNAL_CATEGORIES]} />
  </div>;
}

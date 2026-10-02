import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReviewActions from "@/components/gallery/ReviewActions";
import { isModeratorEmail } from "@/lib/community/rules";
import { listSubmissions, LICENSES, type SubmissionStatus } from "@/lib/gallery/submissions";
import { getCurrentUser } from "@/utils/user-account";

export const metadata: Metadata = { title: "Gallery submissions", robots: { index: false } };
export const dynamic = "force-dynamic";

const FILTERS: [SubmissionStatus, string][] = [["pending", "Waiting"], ["changes", "Changes requested"], ["approved", "Approved"], ["rejected", "Declined"]];
const kb = (bytes: number) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`);

/** Admin review of community templates: read the story, download and run the ZIP, then decide. */
export default async function GalleryReview({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const viewer = await getCurrentUser().catch(() => null);
  if (!isModeratorEmail(viewer?.email)) notFound();
  const wanted = (await searchParams).show;
  const show = (FILTERS.find(([id]) => id === wanted)?.[0] ?? "pending") as SubmissionStatus;
  const submissions = await listSubmissions({ status: show });
  return <div className="mx-auto max-w-[1100px] px-5 pb-24 pt-12 sm:px-8">
    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft"><Link href="/admin" className="hover:text-ink">Admin</Link> · gallery submissions</p>
    <h1 className="mt-3 font-display text-[clamp(2.2rem,4.4vw,3.4rem)] leading-[1] tracking-[-0.02em]">{show === "pending" ? (submissions.length ? `${submissions.length} waiting for review` : "Nothing waiting") : FILTERS.find(([id]) => id === show)![1]}</h1>
    <p className="mt-3 max-w-[44rem] text-ink-soft">Download each ZIP and run it before approving: check it works, looks finished on a phone, and contains nothing you wouldn’t want to give away (trackers, someone else’s work). Approved templates appear in the gallery straight away.</p>
    <nav className="mt-6 flex flex-wrap gap-2">{FILTERS.map(([id, label]) => <Link key={id} href={`?show=${id}`} aria-current={id === show ? "page" : undefined} className={`rounded-full border px-3.5 py-1.5 text-[0.9rem] ${id === show ? "border-ink bg-ink text-paper" : "border-rule"}`}>{label}</Link>)}</nav>
    <ul className="mt-10 space-y-10">{submissions.map((submission) => <li key={submission.id} className="grid gap-6 rounded-2xl border border-rule bg-card p-6 md:grid-cols-[16rem_minmax(0,1fr)]">
      <div className="space-y-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- submission cover */}
        <img src={`/api/gallery/submissions/${submission.id}/cover`} alt="" className="aspect-square w-full rounded-xl object-cover" />
        {submission.hasClip && <video src={`/api/gallery/submissions/${submission.id}/clip`} controls muted className="aspect-square w-full rounded-xl bg-black object-cover" />}
        <a href={`/api/gallery/submissions/${submission.id}/zip`} className="block rounded-full border border-ink px-4 py-2 text-center text-[0.9rem]">Download ZIP ({kb(submission.zipBytes)})</a>
        {submission.liveUrl && <a href={submission.liveUrl} target="_blank" rel="noopener noreferrer nofollow" className="block text-center text-[0.88rem] underline">Live demo</a>}
      </div>
      <div className="min-w-0 space-y-4 text-[0.95rem]">
        <div><h2 className="font-display text-[1.8rem] leading-tight">{submission.title}</h2><p className="text-ink-soft">{submission.summary}</p>
          <p className="mt-1 text-[0.85rem] text-ink-faint">@{submission.owner.username} · {submission.owner.email} · {new Date(submission.createdAt).toLocaleDateString("en-GB")} · {LICENSES[submission.license]} · {submission.tags.join(", ")}</p></div>
        {([["The idea", submission.idea], ["How it was made", submission.process], ["Inspired by", submission.inspiration], ["Who it’s for", submission.audience]] as const).map(([title, text]) => <div key={title}><p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-soft">{title}</p><p className="mt-1 whitespace-pre-line text-ink">{text}</p></div>)}
        <details className="rounded-lg border border-rule p-3"><summary className="cursor-pointer text-[0.88rem]">ZIP contents: {submission.zip.files} files, {kb(submission.zip.bytes)} unpacked, starts at <code>{submission.zip.entry}</code></summary><pre className="mt-2 max-h-60 overflow-auto text-[0.78rem] text-ink-soft">{submission.zip.list.join("\n")}</pre></details>
        {submission.reviewNote && <p className="text-[0.88rem] text-ink-soft">Last note: “{submission.reviewNote}”</p>}
        {submission.status === "approved" && <p className="text-[0.9rem]"><Link href={`/gallery/${submission.slug}`} className="underline">View in gallery</Link> · you can still take it down below.</p>}
        <ReviewActions id={submission.id} />
      </div>
    </li>)}</ul>
  </div>;
}

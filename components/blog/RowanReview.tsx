"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { RowanAvatar } from "@/components/agents/AgentAvatars";
import type { PostReview } from "@/lib/ai/post-reviewer";

const VERDICT: Record<PostReview["verdict"], { label: string; tone: string }> = {
  ready: { label: "Ready to publish", tone: "bg-emerald-50 text-emerald-900 border-emerald-200" },
  almost: { label: "Almost there", tone: "bg-amber-50 text-amber-900 border-amber-200" },
  "needs-work": { label: "Needs work first", tone: "bg-rose-50 text-rose-900 border-rose-200" },
};
const KIND: Record<PostReview["issues"][number]["kind"], string> = { spelling: "Spelling", clarity: "Clarity", structure: "Structure", title: "Title", claims: "Needs a source", links: "Link", tone: "Tone" };

/**
 * Asks Rowan, the Reviewer, to read the post before it goes out. Nothing
 * changes until the owner applies a suggestion.
 */
export function RowanReview({ post, onApply }: { post: { title: string; body: string; excerpt: string }; onApply: (patch: { title?: string; excerpt?: string }) => void }) {
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<PostReview | null>(null);
  const [error, setError] = useState("");
  const [needsCredits, setNeedsCredits] = useState(false);

  async function ask() {
    setBusy(true); setError(""); setNeedsCredits(false);
    try {
      const response = await fetch("/api/ai/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(post) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) { setNeedsCredits(response.status === 402); throw new Error(body.error ?? "The review couldn’t be completed."); }
      setReview(body.review);
    } catch (problem) { setError((problem as Error).message); }
    setBusy(false);
  }

  return <section className="rounded-xl border border-rule bg-white/60 p-3 text-[13px]" aria-label="Review by Rowan">
    <div className="flex items-center gap-3">
      <RowanAvatar size={40} title={null} />
      <div className="min-w-0 flex-1"><p className="font-medium">Rowan, the Reviewer</p><p className="text-[12px] text-ink-soft">Checks spelling, clarity, the title and claims before you publish.</p></div>
      <button type="button" onClick={() => void ask()} disabled={busy} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink px-3 py-1.5 font-medium transition-colors hover:bg-ink hover:text-paper disabled:opacity-60">{busy && <Loader2 size={13} className="animate-spin" />}{review ? "Review again" : "Review my post"}</button>
    </div>
    {error && <p role="alert" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-900">{error}{needsCredits && <> <Link href="/account" className="underline">Add credits or your own AI key</Link>.</>}</p>}
    {review && <div className="mt-3 space-y-3" aria-live="polite">
      <p className={`inline-block rounded-full border px-3 py-1 text-[12px] font-medium ${VERDICT[review.verdict].tone}`}>{VERDICT[review.verdict].label}</p>
      <p className="leading-relaxed">{review.summary}</p>
      {review.strengths.length > 0 && <ul className="space-y-1 text-[12px] text-emerald-800">{review.strengths.map((item) => <li key={item}>✓ {item}</li>)}</ul>}
      {review.issues.length > 0 && <ol className="space-y-2">{review.issues.map((issue, index) => <li key={index} className="rounded-lg border border-rule bg-white p-2.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft">{KIND[issue.kind]}</p>
        {issue.quote && <p className="mt-1 border-l-2 border-rose-300 pl-2 italic text-ink-soft">“{issue.quote}”</p>}
        <p className="mt-1 leading-relaxed">{issue.fix}</p>
      </li>)}</ol>}
      {(review.better_title || review.better_summary) && <div className="space-y-2 border-t border-rule pt-3">
        {review.better_title && review.better_title !== post.title && <p className="flex items-start justify-between gap-3"><span><span className="text-ink-soft">Title idea:</span> {review.better_title}</span><button type="button" onClick={() => onApply({ title: review.better_title })} className="shrink-0 underline underline-offset-4">Use it</button></p>}
        {review.better_summary && review.better_summary !== post.excerpt && <p className="flex items-start justify-between gap-3"><span><span className="text-ink-soft">Summary for search:</span> {review.better_summary}</span><button type="button" onClick={() => onApply({ excerpt: review.better_summary })} className="shrink-0 underline underline-offset-4">Use it</button></p>}
      </div>}
    </div>}
  </section>;
}

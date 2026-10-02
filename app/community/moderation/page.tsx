import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusNote, formatDate } from "@/components/community/Parts";
import { ModeratePost } from "@/components/community/Interactive";
import { moderationQueue } from "@/lib/community/repository";
import { KIND_LABELS } from "@/lib/community/rules";
import { getViewer } from "@/lib/community/viewer";

export const metadata: Metadata = { title: "Moderation", robots: { index: false, follow: false } };

/** Moderators only (ADMIN_EMAILS). Everyone else gets a 404, so the page's existence isn't advertised. */
export default async function ModerationPage() {
  const viewer = await getViewer();
  if (!viewer?.isModerator) notFound();
  const { pending, recent } = await moderationQueue(viewer.id);
  return <div className="mx-auto max-w-[960px] px-5 pb-24 pt-12 sm:px-8">
    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Community</p>
    <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,3.6rem)] font-[360] leading-none tracking-[-0.03em] text-ink">Moderation</h1>
    <p className="mt-4 text-ink-soft">{pending.length ? `${pending.length} waiting, oldest first.` : "Nothing is waiting. Nice."}</p>

    <ul className="mt-10 space-y-6">{pending.map((post) => <li key={post.id} className="rounded-xl border border-rule bg-card p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">{KIND_LABELS[post.kind].singular} · {post.author.name} · {formatDate(post.createdAt)}</p>
      <h2 className="mt-2 font-display text-[1.5rem] leading-snug text-ink"><Link href={`/community/${post.id}`} className="hover:underline">{post.title}</Link></h2>
      <p className="mt-2 text-ink-soft">{post.excerpt}</p>
      {post.moderationNote && <p className="mt-3 text-[0.88rem] text-ink-faint">Held because: {post.moderationNote}</p>}
      <div className="mt-4"><ModeratePost postId={post.id} status={post.status} /></div>
    </li>)}</ul>

    {recent.length > 0 && <section className="mt-16">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Recently refused or removed</h2>
      <ul className="mt-4 divide-y divide-rule border-y border-rule">{recent.map((post) => <li key={post.id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 space-y-2"><p className="font-display text-[1.15rem] text-ink"><Link href={`/community/${post.id}`} className="hover:underline">{post.title}</Link></p><StatusNote status={post.status} note={post.moderationNote} /></div>
        <ModeratePost postId={post.id} status={post.status} />
      </li>)}</ul>
    </section>}
  </div>;
}

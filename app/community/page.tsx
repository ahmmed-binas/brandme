import type { Metadata } from "next";
import Link from "next/link";
import { PostRow, StatusNote, formatDate } from "@/components/community/Parts";
import { OwnPostActions, WriteButton } from "@/components/community/Interactive";
import { listPosts, myUnpublished, reviewStats } from "@/lib/community/repository";
import { KIND_LABELS, POST_KINDS, isPostKind } from "@/lib/community/rules";
import { getViewer } from "@/lib/community/viewer";
import { databaseConfigured } from "@/utils/db-schema";

export const metadata: Metadata = {
  title: "Community: suggestions, reviews and designs",
  description: "Suggest features, read honest reviews, and see portfolio designs submitted by the Formora community.",
  alternates: { canonical: "/community" },
};

const PAGE_SIZE = 20;

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ kind?: string; sort?: string; page?: string }> }) {
  const params = await searchParams;
  const kind = isPostKind(params.kind) ? params.kind : undefined;
  const sort = params.sort === "new" ? "new" : "top";
  const page = Math.max(1, Math.min(500, Number(params.page) || 1));
  const viewer = await getViewer();
  const configured = databaseConfigured();
  const [{ posts, total }, stats, mine] = configured
    ? await Promise.all([listPosts({ kind, sort, limit: PAGE_SIZE * page, offset: 0, viewerId: viewer?.id }), reviewStats(), viewer ? myUnpublished(viewer) : Promise.resolve([])])
    : [{ posts: [], total: 0 }, { count: 0, average: null }, []];
  const href = (next: { kind?: string | null; sort?: string; page?: number }) => {
    const query = new URLSearchParams();
    const nextKind = next.kind === undefined ? kind : next.kind;
    if (nextKind) query.set("kind", nextKind);
    if ((next.sort ?? sort) !== "top") query.set("sort", next.sort ?? sort);
    if (next.page && next.page > 1) query.set("page", String(next.page));
    const value = query.toString();
    return value ? `/community?${value}` : "/community";
  };

  return <div className="mx-auto max-w-[1320px] px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
    <header className="grid grid-cols-1 gap-10 border-b border-rule pb-12 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Community</p>
        <h1 className="mt-4 font-display text-[clamp(2.8rem,6.4vw,5.2rem)] font-[400] leading-[0.95] tracking-[-0.03em] text-ink [font-variation-settings:'opsz'_36]">Help shape <em className="font-[300] text-signal">what we build.</em></h1>
        <p className="mt-6 max-w-[36rem] text-[1.08rem] leading-[1.7] text-ink-soft">Suggest a feature, review the templates, or submit a design of your own. Every post is read, and the most-wanted ideas get built first.</p>
      </div>
      <div className="flex flex-col items-start gap-5 lg:col-span-4 lg:items-end">
        {stats.count > 0 && stats.average !== null && <p className="text-right text-[0.95rem] text-ink-soft"><span className="font-display text-[2.4rem] leading-none text-ink">{stats.average.toFixed(1)}</span> / 5 from {stats.count} {stats.count === 1 ? "review" : "reviews"}</p>}
        <WriteButton signedIn={Boolean(viewer)} label={viewer ? "Write a post" : "Sign in to post"} />
        <Link href="/community/support" className="text-[0.95rem] text-ink underline decoration-rule underline-offset-[5px] hover:decoration-ink">Need help? Contact support →</Link>
      </div>
    </header>

    {mine.length > 0 && <section aria-labelledby="mine-title" className="mt-10 rounded-xl border border-rule bg-card p-6">
      <h2 id="mine-title" className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Your posts that aren’t public</h2>
      <ul className="mt-4 divide-y divide-rule">{mine.map((post) => <li key={post.id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0 space-y-2">
          <p className="font-display text-[1.2rem] leading-snug text-ink"><Link href={`/community/${post.id}`} className="hover:underline">{post.title}</Link> <span className="font-sans text-[0.85rem] text-ink-faint">· {KIND_LABELS[post.kind].singular} · {formatDate(post.createdAt)}</span></p>
          <StatusNote status={post.status} note={post.moderationNote} />
        </div>
        {post.status !== "removed" && <OwnPostActions post={{ id: post.id, kind: post.kind, title: post.title, body: post.body, rating: post.rating, link: post.link }} />}
      </li>)}</ul>
    </section>}

    <nav aria-label="Filter posts" className="sticky top-16 z-20 -mx-5 mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-rule bg-paper/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8">
      <ul className="flex flex-wrap gap-1">
        {[{ value: null, label: "All" }, ...POST_KINDS.map((value) => ({ value, label: KIND_LABELS[value].plural }))].map((item) => {
          const active = (item.value ?? undefined) === kind;
          return <li key={item.label}><Link href={href({ kind: item.value, page: 1 })} aria-current={active ? "page" : undefined} className={`rounded-full px-3.5 py-1.5 text-[0.92rem] transition-colors ${active ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}>{item.label}</Link></li>;
        })}
      </ul>
      <p className="flex items-center gap-3 text-[0.9rem] text-ink-faint">Sort
        {(["top", "new"] as const).map((value) => <Link key={value} href={href({ sort: value, page: 1 })} aria-current={sort === value ? "true" : undefined} className={sort === value ? "text-ink underline underline-offset-4" : "hover:text-ink"}>{value === "top" ? "Most wanted" : "Newest"}</Link>)}
      </p>
    </nav>

    {!configured ? <p className="py-20 text-center text-ink-soft">The community board isn’t set up on this server yet.</p>
      : posts.length === 0 ? <div className="py-24 text-center">
        <p className="font-display text-[2rem] text-ink">Nothing here yet.</p>
        <p className="mt-3 text-ink-soft">Be the first to {kind === "review" ? "leave a review" : kind === "design" ? "submit a design" : "start the conversation"}.</p>
        <div className="mt-8"><WriteButton signedIn={Boolean(viewer)} kind={kind} label={viewer ? "Write a post" : "Sign in to post"} /></div>
      </div>
      : <>
        <ul className="mt-2">{posts.map((post) => <PostRow key={post.id} post={post} signedIn={Boolean(viewer)} viewerId={viewer?.id ?? null} />)}</ul>
        {posts.length < total && <div className="mt-10 text-center"><Link href={href({ page: page + 1 })} scroll={false} className="inline-flex rounded-full border border-ink px-6 py-3 text-[0.95rem] text-ink transition-colors hover:bg-ink hover:text-paper">Show more</Link></div>}
      </>}

    {viewer?.isModerator && <p className="mt-16 text-center text-[0.9rem]"><Link href="/community/moderation" className="text-ink underline underline-offset-4">Open the moderation queue</Link></p>}
  </div>;
}

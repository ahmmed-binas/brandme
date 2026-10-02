import Link from "next/link";
import type { PostSummary } from "@/lib/community/repository";
import { KIND_LABELS } from "@/lib/community/rules";
import { VoteButton } from "./Interactive";

export function Stars({ rating, size = "text-[15px]" }: { rating: number; size?: string }) {
  return <span className={`tracking-[0.12em] ${size}`} aria-label={`${rating} out of 5 stars`}><span className="text-ink">{"★".repeat(rating)}</span><span className="text-ink-faint/50">{"★".repeat(5 - rating)}</span></span>;
}

export function formatDate(iso: string) {
  const date = new Date(iso);
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days < 2) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Why a post isn't public, in the author's own view. */
export function StatusNote({ status, note }: { status: string; note: string | null }) {
  if (status === "published") return null;
  const tone = status === "pending" ? "border-ink/20 bg-paper-deep text-ink" : "border-[color:var(--destructive)]/30 bg-[color:var(--destructive)]/[0.05] text-ink";
  const label = { pending: "Waiting for review", refused: "Not published", removed: "Removed by a moderator" }[status] ?? status;
  return <div className={`rounded-lg border px-4 py-3 text-[0.92rem] leading-relaxed ${tone}`}>
    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">{label}</p>
    {note && <p className="mt-1">{note}</p>}
    {status === "refused" && <p className="mt-1 text-ink-soft">Edit your post to address this and it will be resubmitted.</p>}
  </div>;
}

export function PostRow({ post, signedIn, viewerId }: { post: PostSummary; signedIn: boolean; viewerId: string | null }) {
  return <li className="group grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 border-b border-rule py-7 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
    <div className="self-start"><VoteButton postId={post.id} votes={post.votes} voted={post.viewerVoted} signedIn={signedIn} own={post.author.id === viewerId} /></div>
    <div className="min-w-0">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
        <span className={post.kind === "design" ? "text-signal" : ""}>{KIND_LABELS[post.kind].singular}</span>
        {post.rating && <Stars rating={post.rating} size="text-[12px]" />}
      </p>
      <h3 className="mt-2 font-display text-[1.45rem] leading-[1.15] tracking-[-0.015em] text-ink"><Link href={`/community/${post.id}`} className="decoration-rule decoration-1 underline-offset-[5px] group-hover:underline">{post.title}</Link></h3>
      <p className="mt-2 line-clamp-2 max-w-[44rem] text-[0.98rem] leading-relaxed text-ink-soft">{post.excerpt}</p>
      <p className="mt-3 text-[0.85rem] text-ink-faint">{post.author.name} · {formatDate(post.createdAt)} · {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}</p>
    </div>
    {post.coverImageId && <Link href={`/community/${post.id}`} className="col-span-2 mt-4 block overflow-hidden rounded-lg border border-rule sm:col-span-1 sm:mt-0 sm:w-44">
      {/* eslint-disable-next-line @next/next/no-img-element -- served from our own image route */}
      <img src={`/api/community/images/${post.coverImageId}`} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
    </Link>}
  </li>;
}

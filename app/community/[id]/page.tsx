import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Stars, StatusNote, formatDate } from "@/components/community/Parts";
import { CommentForm, DeleteCommentButton, ModerateComment, ModeratePost, OwnPostActions, VoteButton } from "@/components/community/Interactive";
import { getPost } from "@/lib/community/repository";
import { KIND_LABELS } from "@/lib/community/rules";
import { getViewer } from "@/lib/community/viewer";
import { databaseConfigured } from "@/utils/db-schema";

const load = cache(async (id: string) => {
  if (!databaseConfigured()) return { post: null, viewer: null };
  const viewer = await getViewer().catch(() => null);
  // A database outage shows "not found" rather than an error screen.
  return { post: await getPost(id, viewer).catch(() => null), viewer };
});

// Depends on who is signed in; never pre-render at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { post } = await load(id);
  if (!post) return { title: "Post not found", robots: { index: false } };
  return {
    title: post.title,
    description: post.excerpt.slice(0, 160),
    alternates: { canonical: `/community/${post.id}` },
    robots: post.status === "published" ? undefined : { index: false },
  };
}

export default async function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { post, viewer } = await load(id);
  if (!post) notFound();
  const own = viewer?.id === post.author.id;
  const jsonLd = post.status === "published" && post.kind === "review" && post.rating
    ? { "@context": "https://schema.org", "@type": "Review", name: post.title, reviewBody: post.body, datePublished: post.createdAt, author: { "@type": "Person", name: post.author.name }, reviewRating: { "@type": "Rating", ratingValue: post.rating, bestRating: 5 }, itemReviewed: { "@type": "SoftwareApplication", name: "Formora", applicationCategory: "DesignApplication" } }
    : null;

  return <article className="mx-auto max-w-[860px] px-5 pb-24 pt-12 sm:px-8 lg:pt-16">
    {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
    <Link href="/community" className="inline-flex items-center gap-2 text-[0.92rem] text-ink-soft hover:text-ink"><ArrowLeft size={15} /> Community</Link>

    <header className="mt-10">
      <p className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint"><span className={post.kind === "design" ? "text-signal" : ""}>{KIND_LABELS[post.kind].singular}</span>{post.rating && <Stars rating={post.rating} />}</p>
      <h1 className="mt-4 font-display text-[clamp(2.2rem,5vw,3.6rem)] font-[380] leading-[1.02] tracking-[-0.03em] text-ink">{post.title}</h1>
      <p className="mt-5 text-[0.95rem] text-ink-faint">{post.author.name} · {formatDate(post.createdAt)}</p>
    </header>

    {(own || viewer?.isModerator) && post.status !== "published" && <div className="mt-8"><StatusNote status={post.status} note={post.moderationNote} /></div>}

    {post.imageIds.length > 0 && <div className={`mt-10 grid gap-3 ${post.imageIds.length > 1 ? "sm:grid-cols-2" : ""}`}>
      {post.imageIds.map((imageId, index) => (
        // eslint-disable-next-line @next/next/no-img-element -- served from our own image route
        <img key={imageId} src={`/api/community/images/${imageId}`} alt={`${post.title}, image ${index + 1}`} className={`w-full rounded-xl border border-rule object-cover ${index === 0 && post.imageIds.length === 3 ? "sm:col-span-2" : ""}`} />
      ))}
    </div>}

    <div className="mt-10 whitespace-pre-line text-[1.1rem] leading-[1.75] text-ink">{post.body}</div>
    {post.link && <a href={post.link} target="_blank" rel="noopener noreferrer nofollow ugc" className="mt-6 inline-flex items-center gap-1.5 text-[0.98rem] text-signal underline underline-offset-4">{new URL(post.link).hostname} <ArrowUpRight size={15} /></a>}

    <div className="mt-10 flex flex-wrap items-center gap-6 border-y border-rule py-5">
      {post.status === "published" && <VoteButton postId={post.id} votes={post.votes} voted={post.viewerVoted} signedIn={Boolean(viewer)} own={own} />}
      {own && post.status !== "removed" && <OwnPostActions post={{ id: post.id, kind: post.kind, title: post.title, body: post.body, rating: post.rating, link: post.link }} redirectTo="/community" />}
    </div>
    {viewer?.isModerator && <div className="mt-6"><ModeratePost postId={post.id} status={post.status} /></div>}

    {post.status === "published" && <section aria-labelledby="comments-title" className="mt-14">
      <h2 id="comments-title" className="font-display text-[1.7rem] tracking-[-0.02em] text-ink">{post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}</h2>
      <ol className="mt-6 divide-y divide-rule border-y border-rule">
        {post.comments.map((comment) => <li key={comment.id} className="py-5">
          <p className="flex flex-wrap items-center gap-3 text-[0.88rem] text-ink-faint"><span className="text-ink">{comment.author.name}</span>{formatDate(comment.createdAt)}
            {comment.author.id === viewer?.id && <DeleteCommentButton commentId={comment.id} />}
            {viewer?.isModerator && <ModerateComment commentId={comment.id} status={comment.status} />}
          </p>
          {comment.status !== "published" ? <div className="mt-2"><StatusNote status={comment.status} note={comment.moderationNote} /></div> : null}
          <p className="mt-2 whitespace-pre-line text-[1rem] leading-relaxed text-ink">{comment.body}</p>
        </li>)}
      </ol>
      <div className="mt-8"><CommentForm postId={post.id} signedIn={Boolean(viewer)} /></div>
    </section>}
  </article>;
}

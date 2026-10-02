"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2, Plus } from "lucide-react";
import type { PortfolioPost } from "@/lib/portfolio/posts";
import { prepareImage } from "@/lib/images";
import { PostBodyEditor } from "@/components/blog/PostBodyEditor";
import { Field, ImageField, TextArea } from "./fields";

type Status = { kind: "idle" | "saving" | "saved" } | { kind: "error"; message: string };

const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Draft");

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "That didn’t save. Check your connection and try again.");
  return body as T;
}

/**
 * The editor’s Blog tab: write posts for this portfolio. Changes save as you
 * type; a post appears on the site when it’s published and the portfolio is live.
 */
export function BlogPanel({ templateId, signedIn, liveUrl }: { templateId: string; signedIn: boolean; liveUrl: string | null }) {
  const base = `/api/portfolios/${templateId}/posts`;
  const [posts, setPosts] = useState<PortfolioPost[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<PortfolioPost | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const timer = useRef<number | undefined>(undefined);
  const pending = useRef<Partial<PortfolioPost> | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    call<{ posts: PortfolioPost[] }>(base).then((body) => setPosts(body.posts)).catch((problem: Error) => setError(problem.message));
  }, [base, signedIn]);

  const replace = (post: PortfolioPost) => setPosts((current) => (current ?? []).some((item) => item.id === post.id) ? (current ?? []).map((item) => (item.id === post.id ? post : item)) : [post, ...(current ?? [])]);

  /** Sends whatever has changed since the last save. */
  const flush = useCallback(async (id: string, extra: Record<string, unknown> = {}) => {
    window.clearTimeout(timer.current);
    const patch = { ...pending.current, ...extra };
    pending.current = null;
    if (!Object.keys(patch).length) return;
    setStatus({ kind: "saving" });
    try {
      const { post } = await call<{ post: PortfolioPost }>(`${base}/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      replace(post);
      setOpen((current) => (current?.id === post.id ? { ...current, slug: post.slug, publishedAt: post.publishedAt, updatedAt: post.updatedAt } : current));
      setStatus({ kind: "saved" });
    } catch (problem) {
      setStatus({ kind: "error", message: (problem as Error).message });
      if ("publish" in extra) throw problem;
    }
  }, [base]);

  // Save before leaving the page or switching posts.
  useEffect(() => {
    const id = open?.id;
    if (!id) return;
    const onHide = () => { if (pending.current) void flush(id); };
    window.addEventListener("pagehide", onHide);
    return () => { window.removeEventListener("pagehide", onHide); onHide(); };
  }, [open?.id, flush]);

  const edit = (patch: Partial<PortfolioPost>) => {
    if (!open) return;
    setOpen({ ...open, ...patch });
    pending.current = { ...pending.current, ...patch };
    setStatus({ kind: "idle" });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush(open.id), 900);
  };

  const create = async () => {
    setError("");
    try {
      const { post } = await call<{ post: PortfolioPost }>(base, { method: "POST", body: JSON.stringify({ title: "", body: "" }) });
      replace(post);
      setOpen(post);
      setStatus({ kind: "idle" });
    } catch (problem) { setError((problem as Error).message); }
  };

  const setPublished = async (publish: boolean) => {
    if (!open) return;
    try { await flush(open.id, { publish }); } catch { /* shown in status */ }
  };

  const remove = async () => {
    if (!open || !window.confirm("Delete this post? This can’t be undone.")) return;
    pending.current = null;
    window.clearTimeout(timer.current);
    try {
      await call(`${base}/${open.id}`, { method: "DELETE" });
      setPosts((current) => (current ?? []).filter((item) => item.id !== open.id));
      setOpen(null);
    } catch (problem) { setStatus({ kind: "error", message: (problem as Error).message }); }
  };

  if (!signedIn) return <div className="p-5 text-[13px] leading-relaxed text-ink-soft">
    <p className="font-display text-[1.4rem] leading-tight text-ink">Write a blog on your site</p>
    <p className="mt-2">Share news, case studies and what you’ve learned. Posts appear at <b>/blog</b> on your portfolio and on your own domain.</p>
    <Link href={`/login?callbackUrl=${encodeURIComponent(`/editor/${templateId}`)}`} className="mt-4 inline-block rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-paper">Sign in to start writing</Link>
  </div>;

  if (open) {
    const view = liveUrl && open.publishedAt ? `${liveUrl}/blog/${open.slug}` : null;
    return <div className="space-y-4 p-5" data-section="blog-post">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => { if (pending.current) void flush(open.id); setOpen(null); }} className="inline-flex items-center gap-1 text-[13px] text-ink-soft hover:text-ink"><ArrowLeft size={14} /> All posts</button>
        <span className="ml-auto text-[12px] text-ink-faint" role="status">{status.kind === "saving" ? "Saving…" : status.kind === "saved" ? "Saved" : status.kind === "error" ? "" : ""}</span>
      </div>
      {status.kind === "error" && <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-900">{status.message}</p>}
      <Field label="Title" value={open.title === "Untitled post" && !open.publishedAt ? "" : open.title} onChange={(title) => edit({ title })} path="post.title" placeholder="What’s this post about?" />
      <PostBodyEditor value={open.body} onChange={(body) => edit({ body })} rows={14} />
      <details className="rounded-xl border border-rule bg-white/60 p-3 text-[13px]">
        <summary className="cursor-pointer font-medium">Cover image, summary and address</summary>
        <div className="mt-3 space-y-3">
          <ImageField label="Cover image (optional)" value={open.cover ?? undefined} onChange={(cover) => edit({ cover: cover || null })} upload={(file) => prepareImage(file, true)} />
          <TextArea label="Summary for lists and search results" value={open.excerpt} onChange={(excerpt) => edit({ excerpt })} rows={2} placeholder="Leave empty to use the first lines of the post." />
          <Field label="Address" value={open.slug} onChange={(slug) => edit({ slug })} hint={`Your post’s link ends in /blog/${open.slug || "…"}`} />
        </div>
      </details>
      <div className="flex flex-wrap items-center gap-2 border-t border-rule pt-4">
        {open.publishedAt
          ? <button type="button" onClick={() => void setPublished(false)} className="rounded-full border border-ink px-4 py-1.5 text-[13px] font-medium">Unpublish</button>
          : <button type="button" onClick={() => void setPublished(true)} className="rounded-full bg-ink px-4 py-1.5 text-[13px] font-medium text-paper hover:bg-signal">Publish post</button>}
        {view && <a href={view} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] underline">View <ExternalLink size={12} /></a>}
        <button type="button" onClick={() => void remove()} className="ml-auto text-[12px] text-ink-faint hover:text-[color:var(--destructive)]">Delete</button>
      </div>
      {open.publishedAt && !liveUrl && <p className="text-[12px] text-ink-soft">Published. It will appear on your site once you publish your portfolio.</p>}
    </div>;
  }

  return <div className="p-5">
    <div className="flex items-center justify-between gap-3">
      <div><p className="font-display text-[1.3rem] leading-tight">Blog</p><p className="text-[12px] text-ink-soft">{liveUrl ? <>Live at <a href={`${liveUrl}/blog`} target="_blank" rel="noreferrer" className="underline">{liveUrl.replace(/^https?:\/\//, "")}/blog</a></> : "Appears at /blog once your portfolio is published."}</p></div>
      <button type="button" onClick={() => void create()} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[13px] font-medium text-paper hover:bg-signal"><Plus size={14} /> New post</button>
    </div>
    {error && <p role="alert" className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-900">{error}</p>}
    {posts === null && !error && <p className="mt-6 flex items-center gap-2 text-[13px] text-ink-soft"><Loader2 size={14} className="animate-spin" /> Loading posts…</p>}
    {posts?.length === 0 && <div className="mt-6 rounded-xl border border-dashed border-ink/25 p-5 text-[13px] leading-relaxed text-ink-soft">
      <p className="font-medium text-ink">No posts yet.</p>
      <p className="mt-1">Ideas: a project you’re proud of and how it went, an answer to a question clients often ask, a lesson from this year, or news about your work.</p>
    </div>}
    {posts && posts.length > 0 && <ul className="mt-5 divide-y divide-rule rounded-xl border border-rule bg-white/60">{posts.map((post) => <li key={post.id}>
      <button type="button" onClick={() => { setOpen(post); setStatus({ kind: "idle" }); }} className="block w-full px-4 py-3 text-left hover:bg-white">
        <span className="block text-[14px] text-ink">{post.title}</span>
        <span className={`mt-0.5 block text-[11px] ${post.publishedAt ? "text-emerald-700" : "text-amber-700"}`}>{post.publishedAt ? `Published ${formatDate(post.publishedAt)}` : "Draft"} · {post.readMinutes} min read</span>
      </button>
    </li>)}</ul>}
  </div>;
}

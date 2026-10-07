"use client";

import { useState } from "react";
import { ExternalLink, Plus } from "lucide-react";
import type { JournalPost } from "@/lib/content/journal";
import { slugify } from "@/lib/content/markdown";
import { PostBodyEditor } from "./PostBodyEditor";
import { MediaField } from "./MediaField";
import { prepareImage } from "@/lib/images";
import type { PostMedia } from "@/lib/content/media";

interface Draft { originalSlug?: string; slug: string; title: string; description: string; category: string; body: string; cover: string | null; media: PostMedia | null; published: boolean; origin: JournalPost["origin"] | "new" }

const toDraft = (post: JournalPost): Draft => ({ originalSlug: post.slug, slug: post.slug, title: post.title, description: post.description, category: post.category, body: post.body, cover: post.cover, media: post.media, published: post.publishedAt !== null, origin: post.origin });
const ORIGIN = { "built-in": "Shipped with the site", edited: "Edited", written: "Written here", new: "New" } as const;
const input = "w-full rounded-lg border border-rule bg-white px-3 py-2 text-[14px] outline-none focus:border-ink";

/** List of posts on the left, the selected post on the right. */
export default function JournalEditor({ initial, categories }: { initial: JournalPost[]; categories: string[] }) {
  const [posts, setPosts] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const open = (next: Draft) => {
    if (dirty && !window.confirm("Discard your unsaved changes?")) return;
    setDraft(next); setDirty(false); setMessage(null);
  };
  const change = (patch: Partial<Draft>) => { setDraft((current) => current && { ...current, ...patch }); setDirty(true); };
  const reload = async () => { const response = await fetch("/api/admin/journal"); if (response.ok) setPosts((await response.json()).posts); };

  async function save(publish: boolean) {
    if (!draft) return;
    setBusy(true); setMessage(null);
    const response = await fetch("/api/admin/journal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, publish }) }).catch(() => null);
    const body = await response?.json().catch(() => null);
    setBusy(false);
    if (!response?.ok) { setMessage({ kind: "error", text: body?.error ?? "That didn’t save. Check your connection and try again." }); return; }
    setDraft(toDraft(body.post)); setDirty(false);
    setMessage({ kind: "ok", text: publish ? "Published." : draft.published ? "Unpublished; it’s a draft again." : "Draft saved." });
    await reload();
  }

  async function remove() {
    if (!draft?.originalSlug) { setDraft(null); setDirty(false); return; }
    const restoring = draft.origin === "edited";
    if (!window.confirm(restoring ? "Discard your edits and restore the original article?" : "Delete this post? This can’t be undone.")) return;
    setBusy(true);
    await fetch(`/api/admin/journal?slug=${encodeURIComponent(draft.originalSlug)}`, { method: "DELETE" });
    setBusy(false); setDirty(false);
    await reload();
    setDraft(null);
    setMessage({ kind: "ok", text: restoring ? "Original restored." : "Deleted." });
  }

  return <div className="mt-10 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
    <aside>
      <button type="button" onClick={() => open({ slug: "", title: "", description: "", category: categories[0] ?? "News", body: "", cover: null, media: null, published: false, origin: "new" })} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[0.92rem] font-medium text-paper hover:bg-signal hover:text-signal-ink"><Plus size={16} /> New post</button>
      <ul className="mt-5 divide-y divide-rule rounded-xl border border-rule bg-card">{posts.map((post) => <li key={post.slug}>
        <button type="button" onClick={() => open(toDraft(post))} aria-current={draft?.originalSlug === post.slug ? "true" : undefined} className={`block w-full px-4 py-3 text-left hover:bg-ink/[0.03] ${draft?.originalSlug === post.slug ? "bg-ink/[0.05]" : ""}`}>
          <span className="block text-[0.95rem] leading-snug text-ink">{post.title}</span>
          <span className="mt-1 flex gap-2 text-[11px] text-ink-faint"><span className={post.publishedAt ? "text-emerald-700" : "text-amber-700"}>{post.publishedAt ? "Published" : "Draft"}</span>· {ORIGIN[post.origin]}</span>
        </button>
      </li>)}</ul>
    </aside>

    {draft ? <section className="min-w-0 space-y-4" aria-label="Post editor">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-rule px-2.5 py-0.5 text-[12px] text-ink-soft">{draft.published ? "Published" : "Draft"} · {ORIGIN[draft.origin]}</span>
        {draft.published && draft.originalSlug && <a href={`/blog/${draft.originalSlug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] underline">View <ExternalLink size={12} /></a>}
        {dirty && <span className="text-[12px] text-amber-700">Unsaved changes</span>}
        <span className="ml-auto flex flex-wrap gap-2">
          {draft.origin !== "built-in" && <button type="button" disabled={busy} onClick={() => void remove()} className="rounded-full px-3 py-1.5 text-[13px] text-ink-soft hover:text-[color:var(--destructive)] disabled:opacity-50">{draft.origin === "edited" ? "Restore original" : "Delete"}</button>}
          <button type="button" disabled={busy} onClick={() => void save(false)} className="rounded-full border border-ink px-4 py-1.5 text-[13px] font-medium disabled:opacity-50">{draft.published ? "Unpublish" : "Save draft"}</button>
          <button type="button" disabled={busy} onClick={() => void save(true)} className="rounded-full bg-ink px-4 py-1.5 text-[13px] font-medium text-paper hover:bg-signal hover:text-signal-ink disabled:opacity-50">{draft.published ? "Update" : "Publish"}</button>
        </span>
      </div>
      {message && <p role={message.kind === "error" ? "alert" : "status"} className={`rounded-lg px-3 py-2 text-[13px] ${message.kind === "error" ? "bg-red-50 text-red-900" : "bg-emerald-50 text-emerald-900"}`}>{message.text}</p>}
      <label className="block"><span className="mb-1 block text-[12px] font-medium text-ink-soft">Title</span>
        <input value={draft.title} onChange={(event) => change({ title: event.target.value, ...(draft.origin === "new" || draft.origin === "written" ? { slug: draft.published ? draft.slug : slugify(event.target.value) } : {}) })} className={`${input} font-display text-[1.4rem]`} placeholder="A clear, specific title" /></label>
      <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
        <label className="block"><span className="mb-1 block text-[12px] font-medium text-ink-soft">Address</span>
          <span className="flex items-center rounded-lg border border-rule bg-white pl-3 text-[14px] text-ink-faint focus-within:border-ink">/blog/<input value={draft.slug} disabled={draft.origin === "built-in" || draft.origin === "edited"} onChange={(event) => change({ slug: slugify(event.target.value) || event.target.value.toLowerCase() })} className="min-w-0 flex-1 bg-transparent py-2 pr-3 text-ink outline-none disabled:text-ink-faint" /></span></label>
        <label className="block"><span className="mb-1 block text-[12px] font-medium text-ink-soft">Category</span>
          <select value={draft.category} onChange={(event) => change({ category: event.target.value })} className={input}>{[...new Set([...categories, draft.category])].map((category) => <option key={category}>{category}</option>)}</select></label>
      </div>
      <label className="block"><span className="mb-1 flex justify-between text-[12px] font-medium text-ink-soft"><span>Summary <span className="font-normal">(shown in lists and search results)</span></span><span className={draft.description.length > 160 ? "text-amber-700" : "font-normal text-ink-faint"}>{draft.description.length}/160</span></span>
        <textarea value={draft.description} rows={2} maxLength={300} onChange={(event) => change({ description: event.target.value })} className={`${input} resize-y`} /></label>
      <div className="rounded-xl border border-rule bg-white/60 p-4">
        <MediaField value={draft.media} onChange={(media) => change({ media })} upload={(file) => prepareImage(file, true)} />
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-rule pt-4 text-[13px]">
          <span className="font-medium text-ink">Cover picture for lists and sharing</span>
          {draft.cover && <>
        {/* eslint-disable-next-line @next/next/no-img-element -- an uploaded cover */}
        <img src={draft.cover} alt="" className="h-12 w-20 rounded object-cover" /></>}
          <label className="cursor-pointer rounded-lg border border-dashed border-ink/30 px-3 py-1.5 hover:border-ink">{draft.cover ? "Replace" : "Upload"}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={async (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) { try { change({ cover: await prepareImage(file, true) }); } catch (problem) { setMessage({ kind: "error", text: (problem as Error).message }); } } }} /></label>
          {draft.cover && <button type="button" onClick={() => change({ cover: null })} className="text-ink-faint hover:text-ink">Remove</button>}
        </div>
      </div>
      <PostBodyEditor value={draft.body} onChange={(body) => change({ body })} rows={22} />
    </section> : <div className="grid min-h-[20rem] place-items-center rounded-xl border border-dashed border-rule text-center text-ink-soft"><p>Choose a post to edit, or write a new one.{message && <span className="mt-2 block text-[13px] text-emerald-700">{message.text}</span>}</p></div>}
  </div>;
}

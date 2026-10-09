"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import type { AgentComment } from "@/lib/agents/comments";

const when = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** Comments on an agent's page: read by everyone, written by signed-in people. */
export function AgentComments({ endpoint, returnTo }: { endpoint: string; returnTo: string }) {
  const [comments, setComments] = useState<AgentComment[] | null>(null);
  const [viewer, setViewer] = useState<{ id: string; isModerator: boolean } | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(10);

  useEffect(() => {
    let live = true;
    fetch(endpoint).then((response) => (response.ok ? response.json() : { comments: [], viewer: null }), () => ({ comments: [], viewer: null })).then((body: { comments: AgentComment[]; viewer: { id: string; isModerator: boolean } | null }) => {
      if (!live) return;
      setComments(body.comments); setViewer(body.viewer);
    });
    return () => { live = false; };
  }, [endpoint]);

  async function post() {
    setBusy(true); setError("");
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text }) });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setError(body.error ?? "That comment couldn’t be posted."); return; }
    setText(""); setComments((current) => [body.comment, ...(current ?? [])]);
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this comment?")) return;
    const response = await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) setComments((current) => (current ?? []).filter((comment) => comment.id !== id));
  }

  return <div>
    {viewer ? <form onSubmit={(event) => { event.preventDefault(); void post(); }} className="space-y-2">
      <label htmlFor="agent-comment" className="sr-only">Your comment</label>
      <textarea id="agent-comment" value={text} onChange={(event) => setText(event.target.value)} rows={3} maxLength={2000} placeholder="What did Inspector Iqbal find for you? Questions welcome too." className="w-full resize-y rounded-xl border border-rule bg-white/70 p-3 text-[0.98rem] outline-none focus:border-ink" />
      <div className="flex items-center gap-3"><button disabled={busy || text.trim().length < 2} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.92rem] text-paper disabled:opacity-50">{busy && <Loader2 size={14} className="animate-spin" />}Post comment</button>
        {error && <p role="alert" className="text-[0.9rem] text-[color:var(--destructive)]">{error}</p>}</div>
    </form> : <p className="text-ink-soft"><Link href={`/login?callbackUrl=${encodeURIComponent(returnTo)}`} className="text-ink underline underline-offset-4">Sign in</Link> to leave a comment.</p>}
    {comments === null ? <p className="mt-6 flex items-center gap-2 text-ink-soft"><Loader2 size={15} className="animate-spin" /> Loading comments…</p>
      : comments.length === 0 ? <p className="mt-6 text-ink-soft">No comments yet. Be the first.</p>
      : <ul className="mt-6 divide-y divide-rule border-y border-rule">{comments.slice(0, visible).map((comment) => <li key={comment.id} className="flex gap-3 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- small profile pictures from sign-in providers */}
        {comment.author.image ? <img src={comment.author.image} alt="" className="size-9 shrink-0 rounded-full object-cover" /> : <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-ink/10 text-[0.85rem]">{comment.author.name[0]?.toUpperCase()}</span>}
        <div className="min-w-0 flex-1">
          <p className="text-[0.9rem]"><span className="font-medium text-ink">{comment.author.name}</span> <span className="text-ink-faint">· {when(comment.createdAt)}</span></p>
          <p className="mt-1 whitespace-pre-line break-words text-ink-soft">{comment.body}</p>
        </div>
        {viewer && (viewer.id === comment.author.id || viewer.isModerator) && <button type="button" onClick={() => void remove(comment.id)} aria-label="Delete comment" className="self-start rounded p-1.5 text-ink-faint hover:bg-red-50 hover:text-red-700"><Trash2 size={15} /></button>}
      </li>)}</ul>}
    {comments && comments.length > visible && <button type="button" onClick={() => setVisible((count) => count + 10)} className="mt-5 rounded-full border border-rule px-5 py-2 text-[0.92rem] hover:border-ink">Show more comments ({comments.length - visible})</button>}
  </div>;
}

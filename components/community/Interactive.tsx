"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUp, Loader2 } from "lucide-react";
import Composer, { type EditablePost } from "./Composer";
import type { PostKind } from "@/lib/community/rules";

const signInHref = (path: string) => `/login?callbackUrl=${encodeURIComponent(path)}`;

async function send(url: string, method: string, body?: unknown) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? "Something went wrong. Please try again.");
  return result;
}

/** Opens the composer, or sends visitors to sign in first. */
export function WriteButton({ signedIn, kind, label = "Write a post", className }: { signedIn: boolean; kind?: PostKind; label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const style = className ?? "inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[0.95rem] font-medium text-paper transition-colors hover:bg-signal hover:text-signal-ink";
  if (!signedIn) return <Link href={signInHref("/community")} className={style}>{label}</Link>;
  return <>
    <button type="button" onClick={() => setOpen(true)} className={style}>{label}</button>
    <Composer open={open} onClose={() => setOpen(false)} initialKind={kind} />
  </>;
}

/** Upvote with an optimistic count. */
export function VoteButton({ postId, votes, voted, signedIn, own }: { postId: string; votes: number; voted: boolean; signedIn: boolean; own: boolean }) {
  const [state, setState] = useState({ votes, voted });
  const [error, setError] = useState<string | null>(null);
  const toggle = async () => {
    const previous = state;
    setState({ voted: !state.voted, votes: state.votes + (state.voted ? -1 : 1) });
    try { const result = await send(`/api/community/posts/${postId}/vote`, "POST"); setState({ voted: result.voted, votes: result.votes }); }
    catch (caught) { setState(previous); setError((caught as Error).message); }
  };
  const body = <>
    <motion.span animate={state.voted ? { y: [0, -3, 0] } : {}} transition={{ duration: 0.3 }}><ArrowUp size={16} strokeWidth={1.8} /></motion.span>
    <span className="font-mono text-[13px] tabular-nums">{state.votes}</span>
  </>;
  const style = `flex w-12 flex-col items-center gap-0.5 rounded-lg border py-2 transition-colors ${state.voted ? "border-ink bg-ink text-paper" : "border-rule text-ink-soft hover:border-ink hover:text-ink"}`;
  if (!signedIn) return <Link href={signInHref(`/community/${postId}`)} className={style} aria-label={`Sign in to upvote. ${state.votes} votes`}>{body}</Link>;
  if (own) return <span className={`${style} cursor-default opacity-70`} title="You can’t vote for your own post" aria-label={`${state.votes} votes`}>{body}</span>;
  return <span className="relative">
    <button type="button" onClick={() => void toggle()} aria-pressed={state.voted} aria-label={`${state.voted ? "Remove upvote" : "Upvote"}. ${state.votes} votes`} className={style}>{body}</button>
    {error && <span role="alert" className="absolute left-14 top-1 w-48 text-xs text-[color:var(--destructive)]">{error}</span>}
  </span>;
}

/** Edit-and-resubmit and delete, for the author's own post. */
export function OwnPostActions({ post, redirectTo }: { post: EditablePost; redirectTo?: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    if (!window.confirm("Delete this post? This can’t be undone.")) return;
    setBusy(true);
    try { await send(`/api/community/posts/${post.id}`, "DELETE"); if (redirectTo) router.push(redirectTo); router.refresh(); }
    catch (caught) { window.alert((caught as Error).message); setBusy(false); }
  };
  return <span className="inline-flex items-center gap-4 text-[0.88rem]">
    <button type="button" onClick={() => setEditing(true)} className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink">Edit</button>
    <button type="button" disabled={busy} onClick={() => void remove()} className="text-ink-soft underline decoration-rule underline-offset-4 hover:text-[color:var(--destructive)]">Delete</button>
    <Composer open={editing} onClose={() => setEditing(false)} editing={post} />
  </span>;
}

export function CommentForm({ postId, signedIn }: { postId: string; signedIn: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!signedIn) return <p className="text-[0.95rem] text-ink-soft"><Link href={signInHref(`/community/${postId}`)} className="text-ink underline underline-offset-4">Sign in</Link> to join the conversation.</p>;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(null);
    const sent = body;
    // Only clear what was sent, so anything typed meanwhile survives.
    try { await send(`/api/community/posts/${postId}/comments`, "POST", { body: sent }); setBody((current) => (current === sent ? "" : current)); router.refresh(); }
    catch (caught) { setError((caught as Error).message); }
    finally { setBusy(false); }
  };
  return <form onSubmit={submit} className="space-y-3">
    <label htmlFor="comment" className="sr-only">Add a comment</label>
    <textarea id="comment" value={body} readOnly={busy} aria-busy={busy} onChange={(event) => setBody(event.target.value)} rows={3} placeholder="Add to the conversation…" className="w-full resize-y rounded-lg border border-rule bg-card px-3.5 py-3 text-[1rem] leading-relaxed outline-none focus:border-ink" />
    {error && <p role="alert" className="text-[0.92rem] text-[color:var(--destructive)]">{error}</p>}
    <button disabled={busy || !body.trim()} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper disabled:opacity-50">{busy && <Loader2 size={14} className="animate-spin" />}Comment</button>
  </form>;
}

export function DeleteCommentButton({ commentId }: { commentId: string }) {
  const router = useRouter();
  return <button type="button" onClick={async () => { if (!window.confirm("Delete this comment?")) return; try { await send(`/api/community/comments/${commentId}`, "DELETE"); router.refresh(); } catch (caught) { window.alert((caught as Error).message); } }} className="text-[0.82rem] text-ink-faint underline-offset-4 hover:text-[color:var(--destructive)] hover:underline">Delete</button>;
}

/** Moderator controls for a post: approve, refuse with a reason, or remove with a reason. */
export function ModeratePost({ postId, status }: { postId: string; status: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"refuse" | "remove" | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const act = async (action: "approve" | "refuse" | "remove") => {
    setBusy(true); setError(null);
    try { await send(`/api/community/posts/${postId}/moderate`, "POST", { action, note }); setMode(null); setNote(""); router.refresh(); }
    catch (caught) { setError((caught as Error).message); }
    finally { setBusy(false); }
  };
  return <div className="rounded-lg border border-dashed border-ink/30 p-3">
    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">Moderation · {status}</p>
    <div className="mt-2 flex flex-wrap gap-2">
      {status !== "published" && <button type="button" disabled={busy} onClick={() => void act("approve")} className="rounded-full bg-ink px-3.5 py-1.5 text-[0.85rem] text-paper">{status === "pending" ? "Approve" : "Restore"}</button>}
      {status === "pending" && <button type="button" onClick={() => setMode(mode === "refuse" ? null : "refuse")} className="rounded-full border border-rule px-3.5 py-1.5 text-[0.85rem]">Refuse…</button>}
      {status === "published" && <button type="button" onClick={() => setMode(mode === "remove" ? null : "remove")} className="rounded-full border border-rule px-3.5 py-1.5 text-[0.85rem]">Remove…</button>}
    </div>
    {mode && <div className="mt-3 space-y-2">
      <label className="block text-[0.85rem] text-ink-soft">Reason the author will see
        <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-rule bg-card px-3 py-2 text-[0.92rem] text-ink outline-none focus:border-ink" placeholder={mode === "refuse" ? "e.g. Please add screenshots of the mobile layout." : "e.g. Contains personal information about someone else."} />
      </label>
      <button type="button" disabled={busy} onClick={() => void act(mode)} className="rounded-full bg-[color:var(--destructive)] px-3.5 py-1.5 text-[0.85rem] text-white">{mode === "refuse" ? "Refuse post" : "Remove post"}</button>
    </div>}
    {error && <p role="alert" className="mt-2 text-[0.85rem] text-[color:var(--destructive)]">{error}</p>}
  </div>;
}

export function ModerateComment({ commentId, status }: { commentId: string; status: string }) {
  const router = useRouter();
  const act = async () => {
    const note = status === "published" ? window.prompt("Reason the author will see:") : null;
    if (status === "published" && !note) return;
    try { await send(`/api/community/comments/${commentId}/moderate`, "POST", { action: status === "published" ? "remove" : "approve", note }); router.refresh(); }
    catch (caught) { window.alert((caught as Error).message); }
  };
  return <button type="button" onClick={() => void act()} className="text-[0.82rem] text-ink-faint underline-offset-4 hover:underline">{status === "published" ? "Remove" : "Restore"}</button>;
}

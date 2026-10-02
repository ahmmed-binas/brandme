"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Ticket } from "@/lib/support/repository";

async function post(url: string, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? "That didn’t send. Your text is still here; please try again.");
  return result;
}

const field = "w-full rounded-lg border border-rule bg-white/70 px-3.5 py-2.5 text-[0.98rem] outline-none focus:border-ink";

export function NewTicket({ categories }: { categories: string[] }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(null);
    try { const result = await post("/api/support", { subject, category, message }); setSent(true); setSubject(""); setMessage(""); setCategory(""); router.push(`/community/support?ticket=${result.id}#${result.id}`); router.refresh(); }
    catch (caught) { setError((caught as Error).message); }
    finally { setBusy(false); }
  };
  return <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-rule p-6 lg:grid-cols-2" noValidate>
    <h2 className="font-display text-[1.8rem] lg:col-span-2">New request</h2>
    <label className="block"><span className="mb-1 block text-[0.85rem] text-ink-soft">Subject</span><input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={140} className={field} placeholder="e.g. My domain isn’t connecting" /></label>
    <label className="block"><span className="mb-1 block text-[0.85rem] text-ink-soft">About</span><select value={category} onChange={(event) => setCategory(event.target.value)} className={field}><option value="">Choose one…</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="block lg:col-span-2"><span className="mb-1 block text-[0.85rem] text-ink-soft">What’s happening?</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} maxLength={5000} className={`${field} resize-y`} placeholder="What you were doing, what you expected, and what happened instead." /></label>
    <div className="flex flex-wrap items-center gap-4 lg:col-span-2">
      <button disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-paper disabled:opacity-50">{busy && <Loader2 size={15} className="animate-spin" />}Send to support</button>
      {sent && <span role="status" className="text-[0.92rem] text-emerald-800">Sent. We’ve emailed you a copy.</span>}
      {error && <p role="alert" className="text-[0.92rem] text-[color:var(--destructive)]">{error}</p>}
    </div>
  </form>;
}

export function TicketThread({ ticket, staff }: { ticket: Ticket; staff: boolean }) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (body: unknown, clear = false) => {
    setBusy(true); setError(null);
    try { await post(`/api/support/${ticket.id}`, body); if (clear) setReply(""); router.refresh(); }
    catch (caught) { setError((caught as Error).message); }
    finally { setBusy(false); }
  };
  return <div className="border-t border-rule px-5 pb-5">
    <ol className="mt-4 space-y-3">{ticket.messages.map((message) => <li key={message.id} className={`max-w-[46rem] rounded-xl p-4 ${message.fromStaff ? "ml-auto bg-ink text-paper" : "bg-paper"}`}>
      <p className={`text-[0.8rem] ${message.fromStaff ? "text-paper/70" : "text-ink-faint"}`}>{message.authorName ?? "You"} · {new Date(message.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
      <p className="mt-1 whitespace-pre-line text-[0.98rem] leading-relaxed">{message.body}</p>
    </li>)}</ol>
    {ticket.status !== "closed" ? <form onSubmit={(event) => { event.preventDefault(); void run({ message: reply }, true); }} className="mt-4 space-y-3">
      <label className="block"><span className="sr-only">Reply</span><textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={3} className={`${field} resize-y`} placeholder={staff ? "Reply to the customer (they’ll get an email)…" : "Add a reply…"} /></label>
      <div className="flex flex-wrap items-center gap-3"><button disabled={busy || !reply.trim()} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[0.92rem] text-paper disabled:opacity-40">{busy && <Loader2 size={14} className="animate-spin" />}{staff ? "Send reply" : "Reply"}</button>
        <button type="button" disabled={busy} onClick={() => void run({ status: "closed" })} className="text-[0.9rem] text-ink-soft underline">{staff ? "Close request" : "This is solved, close it"}</button></div>
    </form> : <button type="button" disabled={busy} onClick={() => void run({ status: "open" })} className="mt-4 text-[0.9rem] underline">Reopen</button>}
    {error && <p role="alert" className="mt-2 text-[0.9rem] text-[color:var(--destructive)]">{error}</p>}
  </div>;
}

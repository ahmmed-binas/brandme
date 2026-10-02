"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

async function send(body: unknown) {
  const response = await fetch("/api/templates/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? "That didn’t save. Please try again.");
}

export function ReviewActions({ templateId, status, note }: { templateId: string; status: string; note: string | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<"changes" | null>(null);
  const [text, setText] = useState(note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const act = async (next: "approved" | "changes" | "rejected") => {
    setBusy(true); setError(null);
    try { await send({ templateId, status: next, note: next === "changes" ? text : undefined }); setMode(null); router.refresh(); }
    catch (caught) { setError((caught as Error).message); }
    finally { setBusy(false); }
  };
  return <div>
    {status !== "pending" && <p className="mb-3 text-[0.85rem] text-ink-soft">Current: <b className="font-medium text-ink">{status === "changes" ? "changes requested" : status}</b>{note && ` — “${note}”`}</p>}
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={busy} onClick={() => void act("approved")} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[0.88rem] font-medium text-paper disabled:opacity-50">{busy && <Loader2 size={13} className="animate-spin" />}Approve</button>
      <button type="button" disabled={busy} onClick={() => setMode(mode ? null : "changes")} className="rounded-full border border-ink/30 px-4 py-2 text-[0.88rem] hover:border-ink">Request changes…</button>
      <button type="button" disabled={busy} onClick={() => void act("rejected")} className="rounded-full px-3 py-2 text-[0.88rem] text-ink-soft hover:text-[color:var(--destructive)]">Reject</button>
    </div>
    {mode && <div className="mt-3 space-y-2"><label className="block text-[0.85rem] text-ink-soft">What should change?<textarea value={text} onChange={(event) => setText(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-rule bg-white px-3 py-2 text-[0.92rem] text-ink outline-none focus:border-ink" placeholder="e.g. Make the hero name smaller on phones." /></label>
      <button type="button" disabled={busy} onClick={() => void act("changes")} className="rounded-full bg-ink px-4 py-2 text-[0.88rem] text-paper">Save request</button></div>}
    {error && <p role="alert" className="mt-2 text-[0.85rem] text-[color:var(--destructive)]">{error}</p>}
  </div>;
}

export function ApproveRemaining({ count }: { count: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <button type="button" disabled={busy} onClick={async () => { if (!window.confirm(`Approve all ${count} waiting templates?`)) return; setBusy(true); await send({ bulk: "approve-pending" }).catch(() => undefined); setBusy(false); router.refresh(); }} className="ml-auto rounded-full border border-ink/30 px-3.5 py-1.5 text-[0.9rem] hover:border-ink">Approve all {count}</button>;
}

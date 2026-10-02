"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Approve, ask for changes, or decline a gallery submission. The designer gets an email either way. */
export default function ReviewActions({ id }: { id: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function decide(status: "approved" | "changes" | "rejected") {
    setBusy(true); setError("");
    const response = await fetch(`/api/admin/gallery/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, note }) });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setError(body.error ?? "That didn’t save."); return; }
    router.refresh();
  }
  return <div className="space-y-3">
    <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Note to the designer (required for changes or declining)" className="w-full rounded-lg border border-rule bg-paper px-3 py-2 text-[0.92rem] outline-none focus:border-ink" />
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={busy} onClick={() => void decide("approved")} className="rounded-full bg-emerald-700 px-4 py-2 text-[0.9rem] font-medium text-white disabled:opacity-50">Approve</button>
      <button type="button" disabled={busy} onClick={() => void decide("changes")} className="rounded-full border border-ink px-4 py-2 text-[0.9rem] disabled:opacity-50">Ask for changes</button>
      <button type="button" disabled={busy} onClick={() => void decide("rejected")} className="rounded-full px-4 py-2 text-[0.9rem] text-red-800 hover:bg-red-50 disabled:opacity-50">Decline</button>
    </div>
    {error && <p role="alert" className="text-[0.88rem] text-red-800">{error}</p>}
  </div>;
}

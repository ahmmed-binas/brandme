"use client";

import { useState } from "react";

export default function RenewButton({ orderId, label }: { orderId: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function renew() {
    setBusy(true); setError("");
    const response = await fetch("/api/domains/renew", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId }) }).catch(() => null);
    const body = await response?.json().catch(() => null);
    if (response?.ok && body?.url) { window.location.href = body.url; return; }
    setBusy(false);
    setError(body?.error ?? "That didn’t work. Please try again.");
  }
  return <div className="text-right">
    <button type="button" onClick={() => void renew()} disabled={busy} className="rounded-full bg-ink px-4 py-2 text-[0.9rem] font-medium text-paper hover:bg-signal disabled:opacity-60">{busy ? "One moment…" : label}</button>
    {error && <p role="alert" className="mt-2 max-w-[18rem] text-[0.85rem] text-red-700">{error}</p>}
  </div>;
}

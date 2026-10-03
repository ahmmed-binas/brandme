"use client";

import { useState } from "react";

/** Sends a test email through the SMTP settings and shows exactly what the mail server said. */
export default function EmailTest({ defaultTo, configured }: { defaultTo: string; configured: boolean }) {
  const [to, setTo] = useState(defaultTo);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function send() {
    setBusy(true); setResult(null);
    const response = await fetch("/api/admin/email/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to }) });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    setResult(response.ok ? { ok: true, text: `Sent to ${body.to}. Check that inbox (and its spam folder).` } : { ok: false, text: body.error ?? "That didn’t work." });
  }

  return <div className="mt-4">
    <div className="flex flex-wrap gap-2">
      <label className="min-w-0 flex-1"><span className="sr-only">Send the test to</span>
        <input type="email" value={to} onChange={(event) => setTo(event.target.value)} className="w-full rounded-lg border border-rule bg-paper px-3 py-2.5 outline-none focus:border-ink" /></label>
      <button type="button" onClick={() => void send()} disabled={busy || !configured} className="rounded-full bg-ink px-5 py-2.5 font-medium text-paper hover:bg-signal hover:text-signal-ink disabled:opacity-50">{busy ? "Sending…" : "Send a test email"}</button>
    </div>
    {result && <p role={result.ok ? "status" : "alert"} className={`mt-3 rounded-xl px-4 py-3 text-[0.95rem] ${result.ok ? "bg-emerald-50 text-emerald-950" : "bg-red-50 text-red-900"}`}>{result.text}</p>}
  </div>;
}

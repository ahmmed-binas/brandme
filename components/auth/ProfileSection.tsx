"use client";

import { useEffect, useState } from "react";

interface Status { username: string | null; emailVerified: boolean }

/** Username (shown on your gallery submissions) and email verification, on the account page. */
export function ProfileSection() {
  const [status, setStatus] = useState<Status | null>(null);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [verified] = useState(() => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("verified")));

  useEffect(() => {
    fetch("/api/account/status").then((response) => response.json()).then((body) => { if (body.account) { setStatus(body.account); setUsername(body.account.username ?? ""); } }).catch(() => undefined);
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const response = await fetch("/api/account/username", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage({ tone: "error", text: body.error ?? "That didn’t save." }); return; }
    setStatus((current) => current && { ...current, username: body.username });
    setUsername(body.username);
    setMessage({ tone: "ok", text: "Saved." });
  }
  async function resend() {
    const response = await fetch("/api/account/verify/resend", { method: "POST" });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? { tone: "ok", text: "Sent. Check your inbox (and spam folder)." } : { tone: "error", text: body.error ?? "That didn’t send." });
  }

  if (!status) return null;
  return <section className="mt-10" id="profile">
    {verified === "1" && <p role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-[0.95rem] text-emerald-950">Thanks, your email is confirmed.</p>}
    {verified === "expired" && <p role="alert" className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-[0.95rem] text-amber-950">That confirmation link has expired or was already used.</p>}
    {!status.emailVerified && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[0.95rem] text-amber-950"><span>Please confirm your email address. We sent you a link when you signed up.</span><button type="button" onClick={() => void resend()} className="rounded-full border border-amber-900/30 px-3 py-1 text-[0.85rem] hover:border-amber-900">Send it again</button></div>}
    <form onSubmit={(event) => void save(event)} className="flex flex-wrap items-end gap-3">
      <label className="block text-sm font-medium text-ink">Username <span className="font-normal text-ink-soft">(shown on designs you share in the gallery)</span>
        <span className="relative mt-1 block"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">@</span><input value={username} maxLength={24} onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} className="w-64 rounded-lg border border-rule bg-paper py-2 pl-7 pr-3 text-[0.95rem] outline-none focus:border-ink" /></span></label>
      <button disabled={!username || username === status.username} className="rounded-full bg-ink px-4 py-2 text-[0.9rem] text-paper disabled:opacity-40">Save</button>
    </form>
    {message && <p role={message.tone === "error" ? "alert" : "status"} className={`mt-2 text-[0.9rem] ${message.tone === "error" ? "text-[color:var(--destructive)]" : "text-emerald-800"}`}>{message.text}</p>}
  </section>;
}

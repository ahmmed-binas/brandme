"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, ShieldCheck } from "lucide-react";

/** The superadmin's sign-in. Only works at the console's secret address. */
export default function ConsoleLogin() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(null);
    const result = await signIn("console", { login, password, redirect: false }).catch(() => null);
    setBusy(false);
    if (!result || result.error) { setError("That didn’t work. Check the email and password. After a few tries, sign-in pauses for 15 minutes."); return; }
    router.refresh();
  }

  return <main className="grid min-h-dvh place-items-center px-4">
    <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-[var(--c-line)] bg-[var(--c-panel)] p-7 shadow-2xl">
      <p className="flex items-center gap-2 text-[12px] uppercase tracking-[0.18em] text-[var(--c-muted)]"><ShieldCheck size={15} /> Console</p>
      <h1 className="mt-3 text-[1.6rem] font-semibold tracking-tight text-[var(--c-text)]">Sign in</h1>
      <p className="mt-1 text-[13px] text-[var(--c-text2)]">For the site owner only.</p>
      <label className="mt-6 block text-[13px] text-[var(--c-text2)]">Email
        <input name="login" type="email" autoComplete="username" required value={login} onChange={(event) => setLogin(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[var(--c-line)] bg-[var(--c-bg)] px-3 py-2.5 text-[var(--c-text)] outline-none focus:border-[var(--c-accent)]" /></label>
      <label className="mt-4 block text-[13px] text-[var(--c-text2)]">Password
        <input name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[var(--c-line)] bg-[var(--c-bg)] px-3 py-2.5 text-[var(--c-text)] outline-none focus:border-[var(--c-accent)]" /></label>
      {error && <p role="alert" className="mt-4 rounded-lg bg-[#3a1d1d] px-3 py-2 text-[13px] text-[#f3c4c4]">{error}</p>}
      <button type="submit" disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--c-accent)] px-4 py-2.5 font-medium text-white hover:brightness-110 disabled:opacity-60">{busy && <Loader2 size={16} className="animate-spin" />}Sign in to the console</button>
    </form>
  </main>;
}

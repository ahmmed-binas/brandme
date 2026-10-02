"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const field = "mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2.5 text-[0.95rem] text-ink outline-none transition focus:border-ink";
const label = "block text-sm font-medium text-ink";
const errorText = "mt-1 block text-[0.82rem] text-[color:var(--destructive)]";

function PasswordInput({ value, onChange, autoComplete, name = "password" }: { value: string; onChange: (value: string) => void; autoComplete: string; name?: string }) {
  const [shown, setShown] = useState(false);
  return <span className="relative block">
    <input required type={shown ? "text" : "password"} name={name} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} className={`${field} pr-10`} />
    <button type="button" onClick={() => setShown(!shown)} aria-label={shown ? "Hide password" : "Show password"} className="absolute right-2.5 top-1/2 mt-0.5 -translate-y-1/2 p-1 text-ink-faint hover:text-ink">{shown ? <EyeOff size={16} /> : <Eye size={16} />}</button>
  </span>;
}

/** Email-or-username and password sign-in. */
export function PasswordSignIn({ callbackUrl }: { callbackUrl: string }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    const result = await signIn("password", { login, password, redirect: false });
    if (result?.error || !result?.ok) { setBusy(false); setError("That email or username and password don’t match. Check them, or reset your password."); return; }
    window.location.assign(callbackUrl);
  }
  return <form onSubmit={(event) => void submit(event)} className="space-y-4">
    <label className={label}>Email or username<input required name="login" autoComplete="username" value={login} onChange={(event) => setLogin(event.target.value)} className={field} /></label>
    <label className={label}><span className="flex justify-between">Password<Link href="/forgot-password" className="text-[0.82rem] font-normal text-ink-soft underline underline-offset-4">Forgot it?</Link></span><PasswordInput value={password} onChange={setPassword} autoComplete="current-password" /></label>
    {error && <p role="alert" className="text-[0.88rem] text-[color:var(--destructive)]">{error}</p>}
    <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-paper transition hover:bg-signal disabled:opacity-60">{busy && <Loader2 size={15} className="animate-spin" />}Sign in</button>
  </form>;
}

const maxBirth = () => { const date = new Date(); date.setFullYear(date.getFullYear() - 16); return date.toISOString().slice(0, 10); };

/** Create an account: username, email, password, date of birth. */
export function SignUpForm({ callbackUrl }: { callbackUrl: string }) {
  const [values, setValues] = useState({ name: "", username: "", email: "", password: "", birthDate: "", agree: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof values) => (value: string | boolean) => setValues((current) => ({ ...current, [key]: value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setErrors({});
    const response = await fetch("/api/account/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) }).catch(() => null);
    const body = await response?.json().catch(() => null);
    if (!response?.ok) { setBusy(false); setErrors({ [body?.field ?? "form"]: body?.error ?? "That didn’t work. Check your connection and try again." }); return; }
    const result = await signIn("password", { login: values.email, password: values.password, redirect: false });
    if (!result?.ok) { setBusy(false); setErrors({ form: "Your account was created. Please sign in." }); return; }
    window.location.assign(`${callbackUrl}${callbackUrl.includes("?") ? "&" : "?"}welcome=1`);
  }
  return <form onSubmit={(event) => void submit(event)} className="space-y-4" noValidate>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className={label}>Your name<input name="name" autoComplete="name" value={values.name} onChange={(event) => set("name")(event.target.value)} className={field} /></label>
      <label className={label}>Username<span className="relative block"><span className="pointer-events-none absolute left-3 top-1/2 mt-0.5 -translate-y-1/2 text-ink-faint">@</span><input required name="username" autoComplete="username" value={values.username} onChange={(event) => set("username")(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} maxLength={24} className={`${field} pl-7`} /></span>{errors.username && <span className={errorText}>{errors.username}</span>}</label>
    </div>
    <label className={label}>Email<input required type="email" name="email" autoComplete="email" value={values.email} onChange={(event) => set("email")(event.target.value)} className={field} />{errors.email && <span className={errorText}>{errors.email}</span>}</label>
    <label className={label}>Password <span className="font-normal text-ink-soft">(at least 10 characters)</span><PasswordInput value={values.password} onChange={set("password")} autoComplete="new-password" />{errors.password && <span className={errorText}>{errors.password}</span>}</label>
    <label className={label}>Date of birth <span className="font-normal text-ink-soft">(you must be 16 or over; never shown)</span><input required type="date" name="birthDate" max={maxBirth()} value={values.birthDate} onChange={(event) => set("birthDate")(event.target.value)} className={field} />{errors.birthDate && <span className={errorText}>{errors.birthDate}</span>}</label>
    <label className="flex items-start gap-2.5 text-[0.88rem] text-ink-soft"><input type="checkbox" checked={values.agree} onChange={(event) => set("agree")(event.target.checked)} className="mt-1" /><span>I agree to the <Link href="/about" className="underline">terms and privacy policy</Link>.</span></label>
    {errors.agree && <span className={errorText}>{errors.agree}</span>}
    {errors.form && <p role="alert" className="text-[0.88rem] text-[color:var(--destructive)]">{errors.form}</p>}
    <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-paper transition hover:bg-signal disabled:opacity-60">{busy && <Loader2 size={15} className="animate-spin" />}Create account</button>
  </form>;
}

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    await fetch("/api/account/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => null);
    setBusy(false); setSent(true);
  }
  if (sent) return <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-[0.95rem] text-emerald-950">If there’s an account for <b>{email}</b>, a reset link is on its way. It works for one hour. Check your spam folder if it doesn’t arrive.</p>;
  return <form onSubmit={(event) => void submit(event)} className="space-y-4">
    <label className={label}>Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={field} /></label>
    <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-paper hover:bg-signal disabled:opacity-60">{busy && <Loader2 size={15} className="animate-spin" />}Send reset link</button>
  </form>;
}

export function ResetForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "busy" | "done" } | { kind: "error"; message: string }>({ kind: "idle" });
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState({ kind: "busy" });
    const response = await fetch("/api/account/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) }).catch(() => null);
    const body = await response?.json().catch(() => null);
    setState(response?.ok ? { kind: "done" } : { kind: "error", message: body?.error ?? "That didn’t work. Try again." });
  }
  if (state.kind === "done") return <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-[0.95rem] text-emerald-950">Your password is changed. <Link href="/login" className="font-medium underline">Sign in</Link></p>;
  return <form onSubmit={(event) => void submit(event)} className="space-y-4">
    <label className={label}>New password <span className="font-normal text-ink-soft">(at least 10 characters)</span><PasswordInput value={password} onChange={setPassword} autoComplete="new-password" /></label>
    {state.kind === "error" && <p role="alert" className="text-[0.88rem] text-[color:var(--destructive)]">{state.message}</p>}
    <button disabled={state.kind === "busy"} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-paper hover:bg-signal disabled:opacity-60">Save new password</button>
  </form>;
}

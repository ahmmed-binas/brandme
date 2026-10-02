"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

/** Local test sign-in (DEV_LOGIN=true on localhost only). Any email works; no password. */
export default function DevSignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  return <form className="mt-8 border-t border-dashed border-rule pt-6" onSubmit={(event) => { event.preventDefault(); void signIn("dev", { email, name, callbackUrl }); }}>
    <p className="text-xs font-mono uppercase tracking-[0.18em] text-ink-soft">Local test account</p>
    <p className="mt-2 text-sm leading-6 text-ink-soft">Only shown on localhost with DEV_LOGIN=true. Use an email listed in ADMIN_EMAILS to be an admin.</p>
    <label className="mt-4 block text-sm font-medium text-ink">Email<input required type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2" /></label>
    <label className="mt-3 block text-sm font-medium text-ink">Name <span className="font-normal text-ink-soft">(optional)</span><input type="text" name="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2" /></label>
    <button type="submit" className="mt-4 rounded-xl border border-ink px-5 py-2.5 text-sm font-bold text-ink hover:bg-ink hover:text-paper">Sign in for testing</button>
  </form>;
}

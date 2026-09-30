"use client";

import { LogIn } from "lucide-react";
import { signIn } from "next-auth/react";

export default function GoogleSignInButton({ callbackUrl = "/account" }: { callbackUrl?: string }) {
  return <button type="button" onClick={() => void signIn("google", { callbackUrl })} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800 dark:bg-white dark:text-slate-950"><LogIn size={17} /> Continue with Google</button>;
}

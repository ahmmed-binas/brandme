"use client";

import { LogIn } from "lucide-react";
import { signIn } from "next-auth/react";

export default function GoogleSignInButton({ callbackUrl = "/account" }: { callbackUrl?: string }) {
  return <button type="button" onClick={() => void signIn("google", { callbackUrl })} className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-paper transition hover:bg-signal"><LogIn size={17} /> Continue with Google</button>;
}

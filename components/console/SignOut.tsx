"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function SignOut({ to }: { to: string }) {
  return <button type="button" onClick={() => void signOut({ callbackUrl: to })} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-[var(--c-text2)] hover:bg-white/5 hover:text-[var(--c-text)]"><LogOut size={15} /> Sign out</button>;
}

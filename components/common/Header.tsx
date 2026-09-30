"use client";

import Link from "next/link";
import { LogOut, Menu, Moon, Sparkles, Sun, UserRound, X } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { brand, primaryNavigation } from "@/lib/brand";

export default function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const isDark = resolvedTheme === "dark";
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-[color:var(--background)]/90 backdrop-blur-xl dark:border-white/10">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-5 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5" aria-label={`${brand.name} home`}>
          <span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-white shadow-sm transition-transform group-hover:rotate-[-5deg] dark:bg-white dark:text-slate-950"><Sparkles size={17} strokeWidth={2.4} /></span>
          <span className="text-lg font-semibold tracking-[-0.045em] text-slate-950 dark:text-white">{brand.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {primaryNavigation.map((item) => <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200/60 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">{item.label}</Link>)}
        </nav>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setTheme(isDark ? "light" : "dark")} className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10" aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}>
            {mounted && (isDark ? <Sun size={17} /> : <Moon size={17} />)}
          </button>
          {status !== "loading" && (session?.user ? <><Link href="/account" className="hidden items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-px hover:bg-slate-800 sm:inline-flex dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"><UserRound size={16} /> Account</Link><button type="button" onClick={() => void signOut({ callbackUrl: "/" })} className="hidden rounded-xl border border-slate-200 px-3 py-2.5 text-slate-600 sm:inline-flex dark:border-white/10 dark:text-slate-300" aria-label="Sign out"><LogOut size={16} /></button></> : <Link href="/login" className="hidden rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-px hover:bg-slate-800 sm:inline-flex dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">Sign in</Link>)}
          <button type="button" className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-700 md:hidden dark:border-white/10 dark:text-slate-200" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation menu" aria-expanded={menuOpen}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {menuOpen && <div className="border-t border-slate-200 bg-[color:var(--background)] px-5 py-4 shadow-xl md:hidden dark:border-white/10"><nav className="mx-auto grid max-w-7xl gap-1" aria-label="Mobile navigation">{primaryNavigation.map((item) => <Link key={item.href} href={item.href} onClick={closeMenu} className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-200/60 dark:text-slate-200 dark:hover:bg-white/10">{item.label}</Link>)}{session?.user ? <><Link href="/account" onClick={closeMenu} className="mt-2 rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white dark:bg-white dark:text-slate-950">My account</Link><button type="button" onClick={() => void signOut({ callbackUrl: "/" })} className="rounded-xl border px-4 py-3 text-sm font-semibold">Sign out</button></> : <Link href="/login" onClick={closeMenu} className="mt-2 rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white dark:bg-white dark:text-slate-950">Sign in</Link>}</nav></div>}
    </header>
  );
}

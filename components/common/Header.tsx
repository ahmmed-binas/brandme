"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { brand, primaryNavigation } from "@/lib/brand";

export default function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.clearTimeout(timer); window.removeEventListener("scroll", onScroll); };
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const isDark = resolvedTheme === "dark";
  const isActive = (href: string) => !href.includes("#") && (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-300 ${scrolled || menuOpen ? "border-b border-rule bg-paper/92 backdrop-blur-md" : "border-b border-transparent bg-paper/0"}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-ink focus:px-3 focus:py-2 focus:text-paper">Skip to content</a>
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-baseline gap-2" aria-label={`${brand.name}, home`}>
          <span className="font-display text-[1.6rem] leading-none tracking-[-0.03em] text-ink [font-variation-settings:'opsz'_72]">{brand.name}</span>
          <span aria-hidden className="size-1.5 translate-y-[-0.2rem] rounded-full bg-signal transition-transform duration-300 group-hover:scale-150" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {primaryNavigation.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={`relative text-[0.94rem] text-ink-soft transition-colors hover:text-ink after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-ink after:transition-transform after:duration-300 hover:after:scale-x-100 ${isActive(item.href) ? "text-ink after:scale-x-100" : ""}`}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setTheme(isDark ? "light" : "dark")} className="grid size-9 place-items-center rounded-full text-ink-soft transition hover:bg-ink/5 hover:text-ink" aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}>
            {mounted && (isDark ? <Sun size={16} /> : <Moon size={16} />)}
          </button>
          {status !== "loading" && (session?.user
            ? <Link href="/account" className="hidden rounded-full border border-rule px-4 py-2 text-sm text-ink transition hover:border-ink sm:inline-flex">Your portfolios</Link>
            : <Link href="/login" className="hidden px-3 py-2 text-sm text-ink-soft transition hover:text-ink sm:inline-flex">Sign in</Link>)}
          <Link href="/templatechooser" className="hidden rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-signal hover:text-signal-ink sm:inline-flex">Start free</Link>
          <button type="button" className="relative grid size-9 place-items-center md:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="mobile-menu">
            <span className={`absolute h-px w-5 bg-ink transition-transform duration-300 ${menuOpen ? "rotate-45" : "-translate-y-1"}`} />
            <span className={`absolute h-px w-5 bg-ink transition-transform duration-300 ${menuOpen ? "-rotate-45" : "translate-y-1"}`} />
          </button>
        </div>
      </div>

      {menuOpen && <nav id="mobile-menu" aria-label="Mobile" className="border-t border-rule bg-paper px-5 pb-6 pt-2 md:hidden">
        {primaryNavigation.map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="block border-b border-rule py-4 font-display text-2xl text-ink">{item.label}</Link>)}
        <div className="mt-5 flex gap-2">
          <Link href="/templatechooser" onClick={() => setMenuOpen(false)} className="flex-1 rounded-full bg-ink px-4 py-3 text-center text-sm font-medium text-paper">Start free</Link>
          {session?.user
            ? <><Link href="/account" onClick={() => setMenuOpen(false)} className="flex-1 rounded-full border border-rule px-4 py-3 text-center text-sm">Your portfolios</Link><button type="button" onClick={() => void signOut({ callbackUrl: "/" })} className="rounded-full border border-rule px-4 py-3 text-sm">Sign out</button></>
            : <Link href="/login" onClick={() => setMenuOpen(false)} className="flex-1 rounded-full border border-rule px-4 py-3 text-center text-sm">Sign in</Link>}
        </div>
      </nav>}
    </header>
  );
}

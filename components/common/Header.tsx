"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { AccountMenu, Avatar } from "@/components/common/AccountMenu";
import { Logo } from "@/components/common/Logo";
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
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const isDark = resolvedTheme === "dark";
  const isActive = (href: string) =>
    !href.includes("#") && (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-300 ${scrolled || menuOpen ? "border-b border-rule bg-paper/92 backdrop-blur-md" : "border-b border-transparent bg-paper/0"}`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center text-ink" aria-label={`${brand.name}, home`}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {primaryNavigation.map((item) => {
            const link = (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`relative text-[0.94rem] text-ink-soft transition-colors hover:text-ink after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-ink after:transition-transform after:duration-300 hover:after:scale-x-100 ${isActive(item.href) ? "text-ink after:scale-x-100" : ""}`}
              >
                {item.label}
              </Link>
            );
            if (!("children" in item)) return link;
            return <NavDropdown key={item.href} trigger={link} items={item.children} />;
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="grid size-9 place-items-center rounded-full text-ink-soft transition hover:bg-ink/5 hover:text-ink"
            aria-label={mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Switch colour theme"}
          >
            {mounted && (isDark ? <Sun size={16} /> : <Moon size={16} />)}
          </button>
          {status !== "loading" &&
            (session?.user ? (
              <div className="hidden sm:block">
                <AccountMenu user={session.user} />
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden px-3 py-2 text-sm text-ink-soft transition hover:text-ink sm:inline-flex"
              >
                Sign in
              </Link>
            ))}
          <Link
            href="/templatechooser"
            className="hidden rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-signal hover:text-signal-ink sm:inline-flex"
          >
            Start free
          </Link>
          <button
            type="button"
            className="relative grid size-9 place-items-center md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <span
              className={`absolute h-px w-5 bg-ink transition-transform duration-300 ${menuOpen ? "rotate-45" : "-translate-y-1"}`}
            />
            <span
              className={`absolute h-px w-5 bg-ink transition-transform duration-300 ${menuOpen ? "-rotate-45" : "translate-y-1"}`}
            />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="border-t border-rule bg-paper px-5 pb-6 pt-2 md:hidden"
        >
          {primaryNavigation.map((item) => (
            <div key={item.href} className="border-b border-rule">
              <Link
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block py-4 font-display text-2xl text-ink"
              >
                {item.label}
              </Link>
              {"children" in item &&
                item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={() => setMenuOpen(false)}
                    className="-mt-2 block pb-4 pl-4 text-ink-soft"
                  >
                    {child.label}
                  </Link>
                ))}
            </div>
          ))}
          {session?.user && (
            <div className="mt-5 flex items-center gap-3">
              <Avatar user={session.user} size={40} />
              <div className="min-w-0">
                {session.user.name && <p className="truncate font-medium text-ink">{session.user.name}</p>}
                {session.user.email && (
                  <p className="truncate text-[0.85rem] text-ink-soft">{session.user.email}</p>
                )}
              </div>
            </div>
          )}
          <div className="mt-5 flex gap-2">
            <Link
              href="/templatechooser"
              onClick={() => setMenuOpen(false)}
              className="flex-1 rounded-full bg-ink px-4 py-3 text-center text-sm font-medium text-paper"
            >
              Start free
            </Link>
            {session?.user ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 rounded-full border border-rule px-4 py-3 text-center text-sm"
                >
                  Your portfolios
                </Link>
                <button
                  type="button"
                  onClick={() => void signOut({ callbackUrl: "/" })}
                  className="rounded-full border border-rule px-4 py-3 text-sm"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex-1 rounded-full border border-rule px-4 py-3 text-center text-sm"
              >
                Sign in
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

/**
 * A menu item with a small panel underneath (e.g. Tools). The panel opens on
 * hover and on keyboard focus; the item itself still links to its own page.
 */
function NavDropdown({
  trigger,
  items,
}: {
  trigger: ReactNode;
  items: ReadonlyArray<{ href: string; label: string; hint: string }>;
}) {
  return (
    <div className="group relative">
      {trigger}
      <div className="invisible absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-4 opacity-0 transition duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <ul className="rounded-2xl border border-rule bg-paper p-2 shadow-xl">
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block rounded-xl px-3 py-2.5 transition hover:bg-ink/5">
                <span className="block text-[0.94rem] font-medium text-ink">{item.label}</span>
                <span className="block text-[0.82rem] text-ink-soft">{item.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

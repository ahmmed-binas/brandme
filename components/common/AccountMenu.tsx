"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import { signOut } from "next-auth/react";

export interface SignedInUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  /** True for a superadmin signed in through the console. */
  console?: boolean;
}

interface ConsoleLink {
  href: string;
  label: string;
}

/**
 * The console's links, fetched only for a console session. The server answers
 * only the superadmin, so the secret console address never reaches anyone else.
 */
function useConsoleLinks(enabled: boolean) {
  const [links, setLinks] = useState<ConsoleLink[]>([]);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    fetch("/api/console/links")
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { links?: ConsoleLink[] } | null) => {
        if (active && body?.links) setLinks(body.links);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [enabled]);
  return links;
}

/** Links in the account menu, in the order they appear. */
const ACCOUNT_LINKS = [
  { href: "/account", label: "Your portfolios" },
  { href: "/account/domains", label: "Your domains" },
];

/** "Sara Khan" → "SK"; falls back to the first letter of the email. */
function initialsOf(user: SignedInUser): string {
  const fromName = (user.name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
  return fromName || (user.email?.[0] ?? "?").toUpperCase();
}

/** The person's picture from Google or GitHub, or their initials when there isn't one (or it fails to load). */
export function Avatar({ user, size = 32 }: { user: SignedInUser; size?: number }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size };

  if (user.image && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- profile pictures come from Google and GitHub
      <img
        src={user.image}
        alt=""
        style={style}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden
      style={style}
      className="grid shrink-0 place-items-center rounded-full bg-signal text-[0.75rem] font-semibold text-signal-ink"
    >
      {initialsOf(user)}
    </span>
  );
}

/**
 * The signed-in person in the top right: their picture and first name; click to
 * see their email, their account pages and Sign out.
 */
export function AccountMenu({ user }: { user: SignedInUser }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement | null>(null);
  const firstName = user.name?.split(/\s+/)[0] || user.email?.split("@")[0] || "Account";
  const consoleLinks = useConsoleLinks(Boolean(user.console));

  // Close when clicking outside the menu or pressing Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${user.name || user.email || "you"}`}
        className="flex items-center gap-2 rounded-full border border-rule py-1 pl-1 pr-3 text-sm text-ink transition hover:border-ink"
      >
        <Avatar user={user} size={28} />
        <span className="max-w-[9rem] truncate">{firstName}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-2xl border border-rule bg-paper shadow-[0_20px_50px_-20px_rgb(0_0_0/0.45)]"
        >
          <div className="flex items-center gap-3 border-b border-rule p-4">
            <Avatar user={user} size={40} />
            <div className="min-w-0">
              {user.name && <p className="truncate font-medium text-ink">{user.name}</p>}
              {user.email && <p className="truncate text-[0.85rem] text-ink-soft">{user.email}</p>}
            </div>
          </div>

          {consoleLinks.length > 0 && (
            <div className="border-b border-rule py-1">
              <p className="flex items-center gap-1.5 px-4 pb-1 pt-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-signal">
                <ShieldCheck size={13} /> Superadmin
              </p>
              {consoleLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  role="menuitem"
                  className="block px-4 py-2.5 text-sm text-ink transition hover:bg-ink/5"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          <div className="py-1">
            {ACCOUNT_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-ink transition hover:bg-ink/5"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => void signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2 border-t border-rule px-4 py-3 text-left text-sm text-ink-soft transition hover:bg-ink/5 hover:text-ink"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

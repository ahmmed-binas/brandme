"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { X } from "lucide-react";
import { LogoMark } from "@/components/common/Logo";

/**
 * Visitors couldn't find “Sign in” (owner's report, October 2026), so new
 * visitors are asked, the way Google's own “Continue as…” card does it:
 *
 * - SignInNudge: a small card top right, after 15 seconds on the site, for
 *   people who aren't signed in. “Not now” hides it for three days.
 * - EditorGuestBar: a slim bar in the editor for guests, since their work is
 *   only kept in this browser until they sign in.
 *
 * Both are one click to Google, with email as the other way in.
 */

const KEY = "fuccura:signin-nudge";
const QUIET_DAYS = 3;
const AFTER_SECONDS = 15;
/** Phones get more time first: the card covers more of a small screen. */
const AFTER_SECONDS_PHONE = 30;
/** Pages where asking makes no sense: signing in already, the console, published sites. */
const SKIP = /^\/(login|signup|console|p\/|sites\/|editor|templates\/)/;

function snoozed() {
  try {
    const until = Number(localStorage.getItem(KEY) ?? 0);
    return Date.now() < until;
  } catch {
    return false;
  }
}

function snooze() {
  try {
    localStorage.setItem(KEY, String(Date.now() + QUIET_DAYS * 86_400_000));
  } catch {
    /* private mode: it just asks again next time */
  }
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"
      />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"
      />
    </svg>
  );
}

export function SignInNudge() {
  const { status } = useSession();
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (status !== "unauthenticated" || SKIP.test(pathname) || snoozed()) return;
    const phone = window.matchMedia("(max-width: 640px)").matches;
    const timer = window.setTimeout(
      () => setOpen(true),
      (phone ? AFTER_SECONDS_PHONE : AFTER_SECONDS) * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [status, pathname]);

  if (!open || status !== "unauthenticated") return null;
  const close = () => {
    snooze();
    setOpen(false);
  };

  return (
    <aside
      aria-labelledby="nudge-title"
      className="fixed inset-x-3 bottom-[5.5rem] z-[60] rounded-[18px] bg-card p-4 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-20 sm:w-[21rem] sm:rounded-[20px] sm:p-5 text-ink shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_24px_60px_-20px_rgb(0_0_0/0.45)] [animation:nudge-in_.45s_cubic-bezier(.2,.8,.2,1)]"
    >
      <style>{`@keyframes nudge-in { from { opacity: 0; transform: translateY(12px) scale(.98); } }`}</style>
      <button
        type="button"
        onClick={close}
        aria-label="Not now"
        className="absolute right-3 top-3 grid size-7 place-items-center rounded-full text-ink-soft hover:bg-ink/[0.06] hover:text-ink"
      >
        <X size={15} />
      </button>
      <div className="flex items-center gap-2.5 pr-6">
        <LogoMark size={26} />
        <p id="nudge-title" className="text-[15px] font-semibold leading-tight">
          Sign in to Kitefolio
        </p>
      </div>
      <p className="mt-2 hidden text-[13.5px] leading-snug text-ink-soft sm:block">
        Save the designs you like, build your free website and publish it. It takes one click.
      </p>
      <button
        type="button"
        onClick={() => void signIn("google", { callbackUrl: pathname })}
        className="mt-3 flex w-full items-center justify-center gap-2.5 rounded-xl bg-ink px-4 py-2.5 sm:mt-4 sm:py-3 text-[14px] font-semibold text-paper transition-transform hover:-translate-y-0.5"
      >
        <span className="grid size-6 place-items-center rounded-full bg-white">
          <GoogleIcon />
        </span>
        Continue with Google
      </button>
      <div className="mt-3 flex items-center justify-between text-[12.5px]">
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
          className="text-ink underline underline-offset-4"
        >
          Use email instead
        </Link>
        <button type="button" onClick={close} className="text-ink-soft hover:text-ink">
          Not now
        </button>
      </div>
    </aside>
  );
}

/** In the editor, for guests: their changes live in this browser until they sign in. */
export function EditorGuestBar({ signedIn }: { signedIn: boolean }) {
  const { status } = useSession();
  const pathname = usePathname() ?? "/";
  const [hidden, setHidden] = useState(false);
  if (signedIn || status !== "unauthenticated" || hidden) return null;
  const search = typeof window !== "undefined" ? window.location.search : "";

  return (
    <div
      role="status"
      className="flex shrink-0 flex-wrap items-center gap-3 bg-signal px-4 py-2 text-[13px] text-signal-ink"
    >
      <span className="min-w-0 flex-1">
        <b className="font-semibold">You’re editing as a guest.</b>
        <span className="hidden sm:inline">
          {" "}
          Sign in to save your website to your account and publish it. Your changes so far come with you.
        </span>
      </span>
      <button
        type="button"
        onClick={() => void signIn("google", { callbackUrl: `${pathname}${search}` })}
        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-[#15140f]"
      >
        <GoogleIcon /> Continue with Google
      </button>
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(`${pathname}${search}`)}`}
        className="shrink-0 underline underline-offset-4"
      >
        Email
      </Link>
      <button
        type="button"
        onClick={() => setHidden(true)}
        aria-label="Hide"
        className="shrink-0 opacity-80 hover:opacity-100"
      >
        <X size={15} />
      </button>
    </div>
  );
}

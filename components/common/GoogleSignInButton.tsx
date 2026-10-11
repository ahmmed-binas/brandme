"use client";

import { signIn } from "next-auth/react";

const button =
  "inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-rule bg-white px-5 py-3 text-sm font-bold text-[#15140f] transition hover:border-ink";

/** Google and GitHub sign-in, showing only the ones this server has keys for. */
export default function GoogleSignInButton({
  callbackUrl = "/account",
  google = true,
  github = false,
}: {
  callbackUrl?: string;
  google?: boolean;
  github?: boolean;
}) {
  if (!google && !github) return null;
  return (
    <div className="grid gap-2.5">
      {google && (
        <button type="button" onClick={() => void signIn("google", { callbackUrl })} className={button}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
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
          Continue with Google
        </button>
      )}
      {github && (
        <button type="button" onClick={() => void signIn("github", { callbackUrl })} className={button}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path
              fill="currentColor"
              d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.1 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"
            />
          </svg>
          Continue with GitHub
        </button>
      )}
    </div>
  );
}

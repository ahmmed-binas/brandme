"use client";

import { useState } from "react";

/**
 * Console > Feedback: puts a review of Kitefolio on the home page, or takes it
 * off. Reviews only appear there once switched on; an edited review comes off
 * again until it's switched back on.
 */
export default function HomeReviewToggle({
  userId,
  ratingKey,
  initial,
}: {
  userId: string;
  ratingKey: string;
  initial: boolean;
}) {
  const [onHome, setOnHome] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggle = async () => {
    setBusy(true);
    setError("");
    const response = await fetch("/api/console/ratings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, key: ratingKey, onHome: !onHome }),
    }).catch(() => null);
    if (response?.ok) setOnHome(!onHome);
    else setError("Didn’t save");
    setBusy(false);
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium ${onHome ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-[var(--c-text2)] hover:bg-white/15"}`}
      >
        {busy ? "…" : onHome ? "On home page ✓" : "Show on home page"}
      </button>
      {error && <span className="text-[11px] text-red-300">{error}</span>}
    </span>
  );
}

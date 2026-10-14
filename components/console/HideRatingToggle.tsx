"use client";

import { useState } from "react";

/** Console > Feedback: takes a rating's comment off its public page, or puts it back. */
export default function HideRatingToggle({
  userId,
  ratingKey,
  initial,
}: {
  userId: string;
  ratingKey: string;
  initial: boolean;
}) {
  const [hidden, setHidden] = useState(initial);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    const response = await fetch("/api/console/ratings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, key: ratingKey, hidden: !hidden }),
    }).catch(() => null);
    if (response?.ok) setHidden(!hidden);
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium ${hidden ? "bg-red-500/15 text-red-300" : "bg-white/10 text-[var(--c-text2)] hover:bg-white/15"}`}
    >
      {busy ? "…" : hidden ? "Hidden · show again" : "Hide from page"}
    </button>
  );
}

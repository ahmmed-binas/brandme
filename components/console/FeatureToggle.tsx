"use client";

import { useState } from "react";

/** Console > Feedback: shows or hides one shared note on the home page. */
export default function FeatureToggle({
  userId,
  templateId,
  initial,
}: {
  userId: string;
  templateId: string;
  initial: boolean;
}) {
  const [featured, setFeatured] = useState(initial);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    const response = await fetch("/api/console/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, templateId, featured: !featured }),
    }).catch(() => null);
    if (response?.ok) setFeatured(!featured);
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium ${featured ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-[var(--c-text2)] hover:bg-white/15"}`}
    >
      {busy ? "…" : featured ? "On home page ✓" : "Show on home page"}
    </button>
  );
}

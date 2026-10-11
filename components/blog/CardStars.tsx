"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import type { RatingSummary } from "@/components/templates/Rating";

/**
 * Five stars on a Journal card that fill as you hover. A click rates the post;
 * signed-out readers go to sign in and come back. Shows the average once
 * anyone has rated, and an invitation until then.
 */
export function CardStars({ slug, initial }: { slug: string; initial: RatingSummary }) {
  const router = useRouter();
  const [summary, setSummary] = useState(initial);
  const [mine, setMine] = useState<number | null>(null);
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);

  async function rate(stars: number) {
    if (busy) return;
    setBusy(true);
    const response = await fetch(`/api/blog/${slug}/rating`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stars }),
    }).catch(() => null);
    setBusy(false);
    if (response?.status === 401) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const data = await response?.json().catch(() => null);
    if (response?.ok && data) {
      setMine(stars);
      setSummary({ average: data.average, count: data.count });
    }
  }

  const shown = hover || mine || 0;
  const label = mine
    ? "Thanks for rating"
    : summary.count && summary.average !== null
      ? `${summary.average.toFixed(1)} · ${summary.count} ${summary.count === 1 ? "rating" : "ratings"}`
      : "Be the first to rate";
  return (
    <div className="flex items-center gap-3">
      <span
        className="inline-flex"
        role="radiogroup"
        aria-label="Rate this article"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((stars) => (
          <button
            key={stars}
            type="button"
            role="radio"
            aria-checked={mine === stars}
            aria-label={`${stars} star${stars > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(stars)}
            onFocus={() => setHover(stars)}
            onBlur={() => setHover(0)}
            onClick={() => void rate(stars)}
            className="p-0.5 transition-transform duration-200 hover:scale-125 focus-visible:scale-125"
          >
            <Star
              size={17}
              className={`transition-colors duration-200 ${stars <= shown ? "fill-amber-400 text-amber-400" : summary.average !== null && stars <= Math.round(summary.average) && !hover ? "fill-amber-400/40 text-amber-400/60" : "text-ink-faint"}`}
            />
          </button>
        ))}
      </span>
      <span className="text-[0.82rem] text-ink-soft" aria-live="polite">
        {label}
      </span>
    </div>
  );
}

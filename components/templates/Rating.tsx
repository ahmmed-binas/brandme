"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";

export interface RatingSummary { average: number | null; count: number }

/** “★ 4.6 (12 ratings)”, or “No ratings yet” when nobody has rated it. */
export function RatingBadge({ rating, className = "" }: { rating?: RatingSummary; className?: string }) {
  if (!rating || rating.count === 0 || rating.average === null) return <span className={`text-[0.84rem] text-ink-faint ${className}`}>No ratings yet</span>;
  return <span className={`inline-flex items-center gap-1 text-[0.84rem] text-ink-soft ${className}`} aria-label={`Rated ${rating.average.toFixed(1)} out of 5 by ${rating.count} ${rating.count === 1 ? "person" : "people"}`}>
    <Star size={14} className="fill-amber-400 text-amber-400" aria-hidden />
    <span className="font-medium text-ink">{rating.average.toFixed(1)}</span>
    <span>({rating.count})</span>
  </span>;
}

/** Lets a signed-in person give a template 1–5 stars, and change or clear it. */
export function RateTemplate({ templateId, initial, endpoint = `/api/templates/${templateId}/rating`, returnTo = `/templatepreview?template=${templateId}` }: { templateId: string; initial: RatingSummary; endpoint?: string; returnTo?: string }) {
  const [summary, setSummary] = useState<RatingSummary>(initial);
  const [mine, setMine] = useState<number | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [hover, setHover] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    fetch(endpoint).then((response) => response.ok ? response.json() : null).then((data) => {
      if (!live || !data) return;
      setSummary({ average: data.average, count: data.count });
      setMine(data.mine);
      setSignedIn(data.signedIn);
    }).catch(() => {});
    return () => { live = false; };
  }, [endpoint]);

  async function rate(stars: number | null) {
    setError("");
    const previous = mine;
    setMine(stars);
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stars }) }).catch(() => null);
    const data = await response?.json().catch(() => null);
    if (!response?.ok) { setMine(previous); setError(data?.error ?? "That didn’t save. Try again."); return; }
    setSummary({ average: data.average, count: data.count });
  }

  const shown = hover || mine || 0;
  return <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
    <RatingBadge rating={summary} />
    {signedIn === false && <Link href={`/login?callbackUrl=${encodeURIComponent(returnTo)}`} className="text-[0.84rem] text-ink underline underline-offset-4">Sign in to rate</Link>}
    {signedIn && <span className="inline-flex items-center gap-2">
      <span className="text-[0.84rem] text-ink-soft">{mine ? "Your rating" : "Rate it"}</span>
      <span className="inline-flex" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((stars) => <button key={stars} type="button" role="radio" aria-checked={mine === stars} aria-label={`${stars} star${stars > 1 ? "s" : ""}`} onMouseEnter={() => setHover(stars)} onClick={() => rate(stars)} className="p-0.5">
          <Star size={18} className={stars <= shown ? "fill-amber-400 text-amber-400" : "text-ink-faint"} />
        </button>)}
      </span>
      {mine && <button type="button" onClick={() => rate(null)} className="text-[0.8rem] text-ink-faint underline underline-offset-4 hover:text-ink">Clear</button>}
    </span>}
    {error && <span role="alert" className="text-[0.84rem] text-red-700">{error}</span>}
  </div>;
}

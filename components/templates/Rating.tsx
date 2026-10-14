"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { templatePageHref } from "@/lib/templates/links";

export interface RatingSummary {
  average: number | null;
  count: number;
}

/** “★ 4.6 (12 ratings)”, or “No ratings yet” when nobody has rated it. */
export function RatingBadge({ rating, className = "" }: { rating?: RatingSummary; className?: string }) {
  if (!rating || rating.count === 0 || rating.average === null)
    return <span className={`text-[0.84rem] text-ink-faint ${className}`}>No ratings yet</span>;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[0.84rem] text-ink-soft ${className}`}
      aria-label={`Rated ${rating.average.toFixed(1)} out of 5 by ${rating.count} ${rating.count === 1 ? "person" : "people"}`}
    >
      <Star size={14} className="fill-amber-400 text-amber-400" aria-hidden />
      <span className="font-medium text-ink">{rating.average.toFixed(1)}</span>
      <span>({rating.count})</span>
    </span>
  );
}

/** Lets a signed-in person give a template 1–5 stars, and change or clear it. */
export function RateTemplate({
  templateId,
  initial,
  endpoint = `/api/templates/${templateId}/rating`,
  returnTo = templatePageHref(templateId),
}: {
  templateId: string;
  initial: RatingSummary;
  endpoint?: string;
  returnTo?: string;
}) {
  const [summary, setSummary] = useState<RatingSummary>(initial);
  const [mine, setMine] = useState<number | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [hover, setHover] = useState(0);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [note, setNote] = useState<"closed" | "open" | "saving" | "saved">("closed");

  useEffect(() => {
    let live = true;
    fetch(endpoint)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!live || !data) return;
        setSummary({ average: data.average, count: data.count });
        setMine(data.mine);
        setSignedIn(data.signedIn);
        setComment(data.comment ?? "");
        setIsPublic(Boolean(data.public));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [endpoint]);

  async function rate(stars: number | null) {
    setError("");
    const previous = mine;
    setMine(stars);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stars }),
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    if (!response?.ok) {
      setMine(previous);
      setError(data?.error ?? "That didn’t save. Try again.");
      return;
    }
    setSummary({ average: data.average, count: data.count });
    // After choosing stars, offer the optional comment box.
    if (stars !== null && note === "closed") setNote("open");
  }

  /** Saves the optional comment and whether it may be shown with the person's name and photo. */
  async function saveNote() {
    if (!mine) return;
    setError("");
    setNote("saving");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stars: mine, comment, public: isPublic }),
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    if (!response?.ok) {
      setNote("open");
      setError(data?.error ?? "That didn’t save. Try again.");
      return;
    }
    setNote("saved");
  }

  const shown = hover || mine || 0;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <RatingBadge rating={summary} />
      {signedIn === false && (
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(returnTo)}`}
          className="text-[0.84rem] text-ink underline underline-offset-4"
        >
          Sign in to rate
        </Link>
      )}
      {signedIn && (
        <span className="inline-flex items-center gap-2">
          <span className="text-[0.84rem] text-ink-soft">{mine ? "Your rating" : "Rate it"}</span>
          <span
            className="inline-flex"
            role="radiogroup"
            aria-label="Your rating"
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
                onClick={() => rate(stars)}
                className="p-0.5"
              >
                <Star
                  size={18}
                  className={stars <= shown ? "fill-amber-400 text-amber-400" : "text-ink-faint"}
                />
              </button>
            ))}
          </span>
          {mine && note === "closed" && (
            <button
              type="button"
              onClick={() => setNote("open")}
              className="text-[0.8rem] text-ink underline underline-offset-4"
            >
              {comment ? "Edit comment" : "Add a comment"}
            </button>
          )}
          {mine && (
            <button
              type="button"
              onClick={() => rate(null)}
              className="text-[0.8rem] text-ink-faint underline underline-offset-4 hover:text-ink"
            >
              Clear
            </button>
          )}
        </span>
      )}
      {signedIn && mine && note !== "closed" && (
        <div className="w-full max-w-[28rem] rounded-xl border border-rule bg-card p-3">
          {note === "saved" ? (
            <p className="text-[0.86rem] text-ink-soft">
              Saved.{" "}
              <button type="button" onClick={() => setNote("open")} className="underline underline-offset-4">
                Edit
              </button>
            </p>
          ) : (
            <>
              <label className="block text-[0.82rem] font-medium text-ink">
                What did you think? <span className="font-normal text-ink-soft">(optional)</span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  maxLength={500}
                  rows={2}
                  className="mt-1.5 w-full resize-none rounded-lg border border-rule bg-paper px-3 py-2 text-[0.9rem] font-normal text-ink outline-none focus:border-ink"
                />
              </label>
              <label className="mt-2 flex cursor-pointer items-start gap-2 text-[0.8rem] text-ink-soft">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(event) => setIsPublic(event.target.checked)}
                  className="mt-0.5"
                />
                Show my name and profile photo with my comment on this page
              </label>
              <div className="mt-2.5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={saveNote}
                  disabled={note === "saving"}
                  className="rounded-full bg-ink px-4 py-1.5 text-[0.82rem] font-medium text-paper disabled:opacity-50"
                >
                  {note === "saving" ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setNote("closed")}
                  className="text-[0.8rem] text-ink-soft hover:text-ink"
                >
                  Not now
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {error && (
        <span role="alert" className="text-[0.84rem] text-red-700">
          {error}
        </span>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Star, X } from "lucide-react";
import { FEEDBACK_TAGS } from "@/lib/templates/feedback-tags";

/**
 * Asks a signed-in person, once per template, how the design is working for
 * them: stars, a few quick tags, an optional note, or Skip. It appears after
 * they have spent a little while editing (so they have an opinion), never on
 * arrival. Answers and skips are stored and shown in the console.
 * Add ?rate=now to the editor's address to see it straight away.
 */

/** Time in the editor, with the tab visible, before asking. */
const ASK_AFTER_SECONDS = 90;

const MOODS = ["Not for me", "It’s okay", "Good", "Really good", "Love it"];

export function RatePrompt({
  templateId,
  templateName,
  signedIn,
}: {
  templateId: string;
  templateName: string;
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"asking" | "sending" | "done" | "error">("asking");
  const seconds = useRef(0);

  // Count visible seconds; when it's time, ask the server whether this person was already asked.
  useEffect(() => {
    if (!signedIn) return;
    const now = new URLSearchParams(window.location.search).get("rate") === "now";
    let asked = false;
    const tick = window.setInterval(async () => {
      if (document.visibilityState === "visible") seconds.current += 1;
      if (asked || (!now && seconds.current < ASK_AFTER_SECONDS)) return;
      asked = true;
      window.clearInterval(tick);
      if (now) return setOpen(true);
      try {
        const response = await fetch(`/api/templates/${templateId}/feedback`);
        const body = (await response.json()) as { due?: boolean };
        if (body.due) setOpen(true);
      } catch {
        /* never get in the way of editing */
      }
    }, 1000);
    return () => window.clearInterval(tick);
  }, [signedIn, templateId]);

  const send = async (skipped: boolean) => {
    setState("sending");
    try {
      const response = await fetch(`/api/templates/${templateId}/feedback`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          skipped
            ? { skipped: true, secondsEditing: seconds.current }
            : { stars, tags, comment, secondsEditing: seconds.current },
        ),
      });
      if (!response.ok) throw new Error();
      if (skipped) return setOpen(false);
      setState("done");
      window.setTimeout(() => setOpen(false), 2200);
    } catch {
      if (skipped) return setOpen(false);
      setState("error");
    }
  };

  // Escape counts as Skip.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") void send(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- send reads the latest state when called
  }, [open]);

  if (!open) return null;
  const shown = hover || stars;

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-[rgb(17_17_17/0.45)] p-4 backdrop-blur-sm [animation:rate-fade_.3s_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rate-title"
    >
      <style>{`
        @keyframes rate-fade { from { opacity: 0 } }
        @keyframes rate-rise { from { opacity: 0; transform: translateY(18px) scale(.97) } }
        @keyframes rate-pop { 50% { transform: scale(1.25) } }
      `}</style>
      <div className="relative w-full max-w-[30rem] overflow-hidden rounded-[28px] bg-paper text-ink shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_40px_100px_-30px_rgb(0_0_0/0.6)] [animation:rate-rise_.45s_cubic-bezier(.2,.8,.2,1)]">
        {/* The design they're editing, as a banner */}
        <div className="relative h-36 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element -- static thumbnail */}
          <img
            src={`/templates/${templateId}.webp`}
            alt=""
            className="size-full scale-110 object-cover object-top blur-[1px]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.05),rgb(0_0_0/0.55))]" />
          <button
            type="button"
            onClick={() => void send(true)}
            className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/85 text-ink shadow hover:bg-white"
            aria-label="Skip"
          >
            <X size={16} />
          </button>
          <p className="absolute bottom-3 left-5 rounded-full bg-white/90 px-3 py-1 text-[12px] font-medium shadow">
            {templateName}
          </p>
        </div>

        {state === "done" ? (
          <div className="grid place-items-center px-7 py-12 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-signal text-signal-ink [animation:rate-pop_.5s_ease-out]">
              <Check size={26} />
            </span>
            <p className="mt-4 font-display text-[1.5rem] leading-tight">Got it</p>
            <p className="mt-1 text-[14px] text-ink-soft">
              Your answer goes straight to the people who design {templateName}.
            </p>
          </div>
        ) : (
          <div className="px-7 pb-6 pt-6">
            <h2 id="rate-title" className="font-display text-[1.6rem] leading-tight tracking-[-0.01em]">
              How’s {templateName} working for you?
            </h2>
            <p className="mt-1 text-[14px] text-ink-soft">Two seconds, and it helps us make it better.</p>

            {/* Stars */}
            <div className="mt-5 flex items-center gap-1.5" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onMouseEnter={() => setHover(value)}
                  onFocus={() => setHover(value)}
                  onClick={() => setStars(value)}
                  aria-label={`${value} star${value > 1 ? "s" : ""}: ${MOODS[value - 1]}`}
                  aria-pressed={stars === value}
                  className="rounded-lg p-1 transition-transform duration-150 hover:scale-110"
                >
                  <Star
                    size={38}
                    strokeWidth={1.5}
                    className={`transition-colors duration-150 ${value <= shown ? "fill-amber-400 text-amber-500 drop-shadow-[0_4px_10px_rgb(245_158_11/0.45)]" : "text-ink/25"} ${stars === value ? "[animation:rate-pop_.35s_ease-out]" : ""}`}
                  />
                </button>
              ))}
              <span className="ml-2 min-w-[6rem] text-[14px] font-medium">
                {shown ? MOODS[shown - 1] : ""}
              </span>
            </div>

            {/* Quick tags and a note, once they've chosen */}
            {stars > 0 && (
              <div className="[animation:rate-rise_.35s_ease-out]">
                <p className="mt-5 text-[13px] font-medium">What stood out? (optional)</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {FEEDBACK_TAGS.map((tag) => {
                    const on = tags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() =>
                          setTags((list) => (on ? list.filter((id) => id !== tag.id) : [...list, tag.id]))
                        }
                        aria-pressed={on}
                        className={`rounded-full px-3 py-1.5 text-[13px] transition-colors ${on ? "bg-ink text-paper" : "bg-ink/[0.06] hover:bg-ink/[0.1]"}`}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  maxLength={600}
                  rows={2}
                  placeholder="Anything we should change?"
                  className="mt-4 w-full resize-none rounded-2xl border border-rule bg-white px-4 py-3 text-[14px] outline-none focus:border-ink"
                />
              </div>
            )}

            {state === "error" && (
              <p className="mt-3 text-[13px] text-red-700" role="alert">
                That didn’t send. Try again, or skip.
              </p>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => void send(true)}
                className="rounded-full px-4 py-2.5 text-[14px] text-ink-soft hover:text-ink"
              >
                Skip
              </button>
              <button
                type="button"
                disabled={!stars || state === "sending"}
                onClick={() => void send(false)}
                className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-medium text-paper shadow-[0_10px_24px_-10px_rgb(0_0_0/0.6)] transition-[transform,opacity] hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40"
              >
                {state === "sending" ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

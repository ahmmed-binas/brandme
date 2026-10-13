"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Star, X } from "lucide-react";
import { FEEDBACK_TAGS } from "@/lib/templates/feedback-tags";

/**
 * A small card in the corner asking a signed-in person how the design is
 * working for them: stars, a few quick tags, an optional note, or Skip.
 * Made not to annoy: it never blocks the editor, waits until they've edited
 * for a few minutes and paused typing, and the server asks at most once a
 * day and never again after two skips (lib/templates/feedback.ts feedbackDue).
 * Answers and skips are shown in the console. ?rate=now shows it straight away.
 */

/** Time in the editor, with the tab visible, before asking. */
const ASK_AFTER_SECONDS = 180;
/** Only appear when they haven't typed or clicked for this long. */
const QUIET_SECONDS = 8;

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
  const [shareOk, setShareOk] = useState(false);
  const [state, setState] = useState<"asking" | "sending" | "done" | "error">("asking");
  const seconds = useRef(0);
  const lastInput = useRef(0);

  // Remember when they last typed or clicked, so the card never interrupts them mid-edit.
  useEffect(() => {
    const busy = () => {
      lastInput.current = Date.now();
    };
    busy();
    window.addEventListener("keydown", busy, true);
    window.addEventListener("pointerdown", busy, true);
    return () => {
      window.removeEventListener("keydown", busy, true);
      window.removeEventListener("pointerdown", busy, true);
    };
  }, []);

  // Count visible seconds; when it's time, ask the server whether this person was already asked.
  useEffect(() => {
    if (!signedIn) return;
    const now = new URLSearchParams(window.location.search).get("rate") === "now";
    let asked = false;
    const tick = window.setInterval(async () => {
      if (document.visibilityState === "visible") seconds.current += 1;
      const quiet = Date.now() - lastInput.current > QUIET_SECONDS * 1000;
      if (asked || (!now && (seconds.current < ASK_AFTER_SECONDS || !quiet))) return;
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
            : { stars, tags, comment, shareOk, secondsEditing: seconds.current },
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

  if (!open) return null;
  const shown = hover || stars;

  return (
    <aside
      aria-labelledby="rate-title"
      onKeyDown={(event) => {
        if (event.key === "Escape") void send(true);
      }}
      className="fixed bottom-4 right-4 z-[70] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[22px] bg-paper text-ink shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_24px_60px_-20px_rgb(0_0_0/0.45)] [animation:rate-rise_.45s_cubic-bezier(.2,.8,.2,1)]"
    >
      <style>{`
        @keyframes rate-rise { from { opacity: 0; transform: translateY(16px) scale(.98) } }
        @keyframes rate-pop { 50% { transform: scale(1.25) } }
      `}</style>
      <button
        type="button"
        onClick={() => void send(true)}
        className="absolute right-2.5 top-2.5 z-10 grid size-7 place-items-center rounded-full text-ink-soft hover:bg-ink/[0.06] hover:text-ink"
        aria-label="Skip"
      >
        <X size={15} />
      </button>

      {state === "done" ? (
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-signal text-signal-ink [animation:rate-pop_.5s_ease-out]">
            <Check size={20} />
          </span>
          <p className="text-[14px] leading-snug">
            <b className="font-semibold">Got it.</b>{" "}
            <span className="text-ink-soft">It goes straight to the people who design {templateName}.</span>
          </p>
        </div>
      ) : (
        <div className="px-5 pb-4 pt-4">
          <div className="flex items-center gap-3 pr-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- static thumbnail */}
            <img
              src={`/templates/${templateId}-phone.webp`}
              alt=""
              className="h-12 w-9 shrink-0 rounded-md object-cover object-top shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_6px_14px_-8px_rgb(0_0_0/0.5)]"
            />
            <h2 id="rate-title" className="font-display text-[1.15rem] leading-tight">
              How’s {templateName} working for you?
            </h2>
          </div>

          {/* Stars */}
          <div className="mt-3 flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onMouseEnter={() => setHover(value)}
                onFocus={() => setHover(value)}
                onClick={() => setStars(value)}
                aria-label={`${value} star${value > 1 ? "s" : ""}: ${MOODS[value - 1]}`}
                aria-pressed={stars === value}
                className="rounded-md p-0.5 transition-transform duration-150 hover:scale-110"
              >
                <Star
                  size={30}
                  strokeWidth={1.5}
                  className={`transition-colors duration-150 ${value <= shown ? "fill-amber-400 text-amber-500 drop-shadow-[0_3px_8px_rgb(245_158_11/0.45)]" : "text-ink/25"} ${stars === value ? "[animation:rate-pop_.35s_ease-out]" : ""}`}
                />
              </button>
            ))}
            <span className="ml-2 text-[13px] font-medium">{shown ? MOODS[shown - 1] : ""}</span>
          </div>

          {/* Quick tags and a note, once they've chosen */}
          {stars > 0 && (
            <div className="[animation:rate-rise_.3s_ease-out]">
              <div className="mt-3 flex flex-wrap gap-1.5">
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
                      className={`rounded-full px-2.5 py-1 text-[12px] transition-colors ${on ? "bg-ink text-paper" : "bg-ink/[0.06] hover:bg-ink/[0.1]"}`}
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
                placeholder="Anything we should change? (optional)"
                className="mt-3 w-full resize-none rounded-xl border border-rule bg-white px-3 py-2 text-[13px] outline-none focus:border-ink"
              />
              {comment.trim() && (
                <label className="mt-2 flex cursor-pointer items-start gap-2 text-[12px] leading-snug text-ink-soft">
                  <input
                    type="checkbox"
                    checked={shareOk}
                    onChange={(event) => setShareOk(event.target.checked)}
                    className="mt-0.5 size-3.5 accent-[var(--color-ink)]"
                  />
                  Fuccura may show my note with my name and profile photo on its website.
                </label>
              )}
            </div>
          )}

          {state === "error" && (
            <p className="mt-2 text-[12px] text-red-700" role="alert">
              That didn’t send. Try again, or skip.
            </p>
          )}

          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => void send(true)}
              className="rounded-full py-1.5 text-[13px] text-ink-soft hover:text-ink"
            >
              Skip
            </button>
            {stars > 0 && (
              <button
                type="button"
                disabled={state === "sending"}
                onClick={() => void send(false)}
                className="rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-paper shadow-[0_8px_20px_-10px_rgb(0_0_0/0.6)] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {state === "sending" ? "Sending…" : "Send"}
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

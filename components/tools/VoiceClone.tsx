"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, Download, Loader2, Mic, Square, Trash2, Upload } from "lucide-react";
import {
  decodeToMono,
  durationOf,
  joinSounds,
  speechSeconds,
  startRecording,
  toWav,
  type Recording,
  type Sound,
} from "@/lib/tools/browser-audio";
import {
  CONSENT_SENTENCE,
  READING_SCRIPT,
  VOICE_PLANS,
  VOICE_STYLES,
  type VoiceClip,
  type VoicePlan,
  type VoiceState,
  type VoiceStyle,
} from "@/lib/tools/voice-config";

/**
 * The voice tool, all on one page. Left: make your voice (consent line, then
 * record or upload). Right: type text, pick a style, get clips. The work runs on
 * our voice engine; when it's off, requests wait in a queue and the page says so.
 */

/** Speech needed before the voice can be made, and the amount that gives the best result. */
const MIN_SPEECH = 10;
const GOOD_SPEECH = 30;
/** The most of an upload or recording we use (the engine needs far less). */
const MAX_SECONDS = 120;
/** How often the page checks on queued work. */
const POLL_MS = 4000;

type Load = "loading" | "signed-out" | "ready" | "error";

export function VoiceClone() {
  const [load, setLoad] = useState<Load>("loading");
  const [state, setState] = useState<VoiceState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/tools/voice", { cache: "no-store" });
    if (response.status === 401) return setLoad("signed-out");
    if (!response.ok) return setLoad("error");
    setState((await response.json()) as VoiceState);
    setLoad("ready");
  }, []);

  useEffect(() => {
    // The first load is kicked off after mount so the page itself stays static.
    const timer = window.setTimeout(() => void refresh().catch(() => setLoad("error")), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  // Keep checking while anything is waiting or being made.
  const busy =
    state?.voice?.status === "queued" ||
    state?.voice?.status === "working" ||
    state?.clips.some((clip) => clip.status === "queued" || clip.status === "working");
  useEffect(() => {
    if (!busy) return;
    const timer = window.setInterval(() => void refresh().catch(() => undefined), POLL_MS);
    return () => window.clearInterval(timer);
  }, [busy, refresh]);

  /** Sends a request and shows the new state, or the server's error message. */
  const send = async (request: Promise<Response>) => {
    setError(null);
    try {
      const response = await request;
      const body = (await response.json()) as VoiceState & { error?: string };
      if (!response.ok) return setError(body.error ?? "Something went wrong. Please try again.");
      setState(body);
      return true;
    } catch {
      setError("We couldn’t reach Fuccura. Check your connection and try again.");
    }
  };

  if (load === "loading")
    return (
      <Panel>
        <p className="flex items-center gap-2 text-ink-soft">
          <Loader2 size={16} className="animate-spin" />
          Loading…
        </p>
      </Panel>
    );
  if (load === "signed-out") return <SignInFirst />;
  if (load === "error" || !state)
    return (
      <Panel>
        <p className="text-ink-soft">The voice tool couldn’t load. Please refresh the page.</p>
      </Panel>
    );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel>
        <StepTitle number={1}>Make your voice</StepTitle>
        {state.voice?.status === "ready" ? (
          <VoiceReady
            onRemake={() => void send(fetch("/api/tools/voice", { method: "DELETE" }))}
            onDelete={() => void send(fetch("/api/tools/voice", { method: "DELETE" }))}
          />
        ) : state.voice?.status === "queued" || state.voice?.status === "working" ? (
          <Training working={state.voice.status === "working"} engineOnline={state.engineOnline} />
        ) : (
          <MakeVoice
            failure={state.voice?.status === "failed" ? state.voice.error : null}
            onSubmit={(form) => send(fetch("/api/tools/voice", { method: "POST", body: form }))}
          />
        )}
      </Panel>

      <Panel>
        <StepTitle number={2}>Type what your voice says</StepTitle>
        <Speak
          ready={state.voice?.status === "ready"}
          engineOnline={state.engineOnline}
          plan={state.plan}
          clipsToday={state.clipsToday}
          onSpeak={(text, style) =>
            send(
              fetch("/api/tools/voice/clips", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, style }),
              }),
            )
          }
        />
        <ClipList clips={state.clips} engineOnline={state.engineOnline} />
        {state.clips.some((clip) => clip.status === "done") && <UseYourVoice />}
      </Panel>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[0.92rem] text-red-900 lg:col-span-2"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: making the voice
// ---------------------------------------------------------------------------

function MakeVoice({
  failure,
  onSubmit,
}: {
  failure: string | null;
  onSubmit: (form: FormData) => Promise<true | void>;
}) {
  const [consent, setConsent] = useState<Sound | null>(null);
  const [takes, setTakes] = useState<Sound[]>([]);
  const [upload, setUpload] = useState<{ name: string; sound: Sound } | null>(null);
  const [mode, setMode] = useState<"record" | "upload">("record");
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const voice = useMemo(
    () => (mode === "upload" ? (upload?.sound ?? null) : takes.length ? joinSounds(takes) : null),
    [mode, upload, takes],
  );
  // Counting speech walks every sample, so only redo it when the sound changes.
  const speech = useMemo(() => Math.min(speechSeconds(voice), MAX_SECONDS), [voice]);
  const consentSpeech = useMemo(() => speechSeconds(consent), [consent]);
  const consentOk = consentSpeech >= 3;
  const canTrain = consentOk && speech >= MIN_SPEECH && agreed && !sending;

  const readFile = async (file: File) => {
    setProblem(null);
    try {
      setUpload({ name: file.name, sound: await decodeToMono(file, MAX_SECONDS) });
    } catch {
      setProblem("Your browser couldn’t read that file. Try an MP4, MOV, MP3, M4A or WAV.");
    }
  };

  const train = async () => {
    if (!voice || !consent) return;
    setSending(true);
    const form = new FormData();
    form.set("agree", "yes");
    form.set("source", toWav(voice), "voice.wav");
    form.set("consent", toWav(consent), "consent.wav");
    await onSubmit(form);
    setSending(false);
  };

  return (
    <div className="mt-5 space-y-7">
      {failure && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[0.92rem] text-amber-950">
          {failure}
        </p>
      )}

      <section>
        <h3 className="font-medium text-ink">a. Read this line aloud</h3>
        <p className="mt-1 text-[0.88rem] text-ink-soft">
          It confirms the voice is yours. We check it matches the voice you give below.
        </p>
        <blockquote className="mt-3 rounded-xl bg-ink/5 px-4 py-3 font-display text-[1.05rem] leading-snug text-ink">
          “{CONSENT_SENTENCE}”
        </blockquote>
        <div className="mt-3">
          <Recorder
            label={consent ? "Record again" : "Record the line"}
            maxSeconds={40}
            onDone={(sound) => setConsent(sound)}
          />
          {consent && (
            <p className={`mt-2 text-[0.88rem] ${consentOk ? "text-emerald-700" : "text-amber-800"}`}>
              {consentOk
                ? `Got it (${durationOf(consent).toFixed(0)} s).`
                : "We could hardly hear you. Try again a little closer to the microphone."}
            </p>
          )}
        </div>
      </section>

      <section>
        <h3 className="font-medium text-ink">b. Give it your voice</h3>
        <div className="mt-3 inline-flex rounded-full border border-rule p-1 text-[0.88rem]" role="tablist">
          {(
            [
              ["record", "Record live"],
              ["upload", "Upload a video or audio"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={`rounded-full px-4 py-1.5 transition ${mode === value ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "record" ? (
          <div className="mt-4">
            <p className="text-[0.88rem] text-ink-soft">
              Read this naturally, as if talking to a friend. Record it in one go or in parts.
            </p>
            <p className="mt-3 rounded-xl bg-ink/5 px-4 py-3 text-[0.98rem] leading-relaxed text-ink">
              {READING_SCRIPT}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Recorder
                label={takes.length ? "Record more" : "Start recording"}
                maxSeconds={MAX_SECONDS}
                onDone={(sound) => setTakes((current) => [...current, sound])}
              />
              {takes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTakes([])}
                  className="text-[0.88rem] text-ink-soft underline-offset-4 hover:underline"
                >
                  Start over
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-[0.88rem] text-ink-soft">
              A video or recording of just you talking: a reel, a voice note, a talk. No music. The first two
              minutes are used, and only the sound leaves your device.
            </p>
            <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-rule px-4 py-4 transition hover:border-ink">
              <Upload size={18} />
              <span className="text-[0.95rem]">{upload ? upload.name : "Choose a file"}</span>
              <input
                type="file"
                accept="audio/*,video/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void readFile(file);
                }}
              />
            </label>
            {problem && <p className="mt-2 text-[0.88rem] text-red-800">{problem}</p>}
          </div>
        )}

        <VoiceMeter seconds={speech} />
      </section>

      <section>
        <label className="flex items-start gap-3 text-[0.92rem] text-ink">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="mt-1 size-4 accent-current"
          />
          <span>
            This is my own voice. I won’t use the copy to pretend to be someone else. Every clip carries an
            inaudible AI watermark.
          </span>
        </label>
        <button
          type="button"
          disabled={!canTrain}
          onClick={() => void train()}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition hover:bg-signal hover:text-signal-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending && <Loader2 size={16} className="animate-spin" />}
          Train my voice
        </button>
        {!canTrain && !sending && (
          <p className="mt-2 text-[0.85rem] text-ink-soft">
            {!consentOk
              ? "First record the line in a."
              : speech < MIN_SPEECH
                ? `Then give at least ${MIN_SPEECH} seconds of your voice in b.`
                : "Tick the box to confirm it’s your voice."}
          </p>
        )}
      </section>
    </div>
  );
}

/** How much voice we have: needs MIN_SPEECH, best at GOOD_SPEECH. */
function VoiceMeter({ seconds }: { seconds: number }) {
  const percent = Math.min(100, (seconds / GOOD_SPEECH) * 100);
  const message =
    seconds === 0
      ? "No voice yet."
      : seconds < MIN_SPEECH
        ? "Keep going…"
        : seconds < GOOD_SPEECH
          ? "Enough to train. A little more makes it even closer."
          : "Plenty. Your voice is ready to train.";
  return (
    <div className="mt-5">
      <div className="flex justify-between text-[0.85rem]">
        <span className="font-medium text-ink">Voice collected</span>
        <span className="tabular-nums text-ink-soft">
          {seconds.toFixed(0)} s of {GOOD_SPEECH} s
        </span>
      </div>
      <div
        className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={GOOD_SPEECH}
        aria-valuenow={Math.round(seconds)}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${seconds >= MIN_SPEECH ? "bg-emerald-600" : "bg-amber-500"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-[0.85rem] text-ink-soft">{message}</p>
    </div>
  );
}

/** A record/stop button with a timer and a level meter. */
function Recorder({
  label,
  maxSeconds,
  onDone,
}: {
  label: string;
  maxSeconds: number;
  onDone: (sound: Sound) => void;
}) {
  const recording = useRef<Recording | null>(null);
  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [problem, setProblem] = useState<string | null>(null);

  const stop = useCallback(async () => {
    const current = recording.current;
    if (!current) return;
    recording.current = null;
    setActive(false);
    try {
      onDone(await decodeToMono(await current.stop(), maxSeconds));
    } catch {
      setProblem("That recording couldn’t be read. Please try again.");
    }
  }, [maxSeconds, onDone]);

  useEffect(() => {
    if (!active) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      const seconds = (Date.now() - started) / 1000;
      setElapsed(seconds);
      setLevel(recording.current?.level() ?? 0);
      if (seconds >= maxSeconds) void stop();
    }, 100);
    return () => window.clearInterval(timer);
  }, [active, maxSeconds, stop]);

  const start = async () => {
    setProblem(null);
    try {
      recording.current = await startRecording();
      setElapsed(0);
      setActive(true);
    } catch {
      setProblem("We couldn’t use your microphone. Allow it in the browser’s address bar, or upload a file.");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void (active ? stop() : start())}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${active ? "bg-red-600 text-white" : "border border-ink text-ink hover:bg-ink hover:text-paper"}`}
        >
          {active ? <Square size={14} /> : <Mic size={15} />}
          {active ? "Stop" : label}
        </button>
        {active && (
          <span className="flex items-center gap-2 text-[0.88rem] tabular-nums text-ink-soft">
            <span className="relative block h-2 w-20 overflow-hidden rounded-full bg-ink/10">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-red-500 transition-[width] duration-100"
                style={{ width: `${Math.min(100, level * 160)}%` }}
              />
            </span>
            {elapsed.toFixed(0)} s
          </span>
        )}
      </div>
      {problem && <p className="mt-2 text-[0.88rem] text-red-800">{problem}</p>}
    </div>
  );
}

function Training({ working, engineOnline }: { working: boolean; engineOnline: boolean }) {
  return (
    <div className="mt-5 space-y-4">
      <p className="flex items-center gap-2 text-ink">
        <Loader2 size={18} className="animate-spin" />
        {working ? "Training your voice…" : "Your voice is next in line…"}
      </p>
      {!engineOnline && <NotAvailable what="Training starts" />}
      <p className="text-[0.88rem] text-ink-soft">
        It usually takes under a minute. You can leave this page; your voice is saved.
      </p>
    </div>
  );
}

function VoiceReady({ onRemake, onDelete }: { onRemake: () => void; onDelete: () => void }) {
  return (
    <div className="mt-5 space-y-4">
      <p className="flex items-center gap-2 font-medium text-emerald-700">
        <Check size={18} /> Your voice is ready.
      </p>
      <p className="text-[0.9rem] text-ink-soft">
        Type anything in step 2 and pick a style. Not quite you? Make it again with a clearer or longer
        recording.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Make your voice again? Your current voice and its clips will be deleted."))
              onRemake();
          }}
          className="rounded-full border border-rule px-4 py-2 text-sm transition hover:border-ink"
        >
          Make it again
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Delete your voice and every clip made with it?")) onDelete();
          }}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-red-800 transition hover:bg-red-50"
        >
          <Trash2 size={14} /> Delete my voice
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: speaking
// ---------------------------------------------------------------------------

function Speak({
  ready,
  engineOnline,
  plan,
  clipsToday,
  onSpeak,
}: {
  ready: boolean;
  engineOnline: boolean;
  plan: VoicePlan;
  clipsToday: number;
  onSpeak: (text: string, style: VoiceStyle) => Promise<true | void>;
}) {
  const [text, setText] = useState("");
  const [style, setStyle] = useState<VoiceStyle>("natural");
  const [sending, setSending] = useState(false);
  const [queuedOffline, setQueuedOffline] = useState(false);
  const limits = VOICE_PLANS[plan];
  const left = Math.max(0, limits.clipsPerDay - clipsToday);

  const speak = async () => {
    setSending(true);
    if (await onSpeak(text.trim(), style)) {
      setText("");
      setQueuedOffline(!engineOnline);
    }
    setSending(false);
  };

  return (
    <div className={`mt-5 ${ready ? "" : "opacity-60"}`}>
      {!ready && (
        <p className="mb-4 rounded-xl bg-ink/5 px-4 py-3 text-[0.9rem] text-ink-soft">
          Make your voice first (step 1). Then type here and it reads it aloud in your voice.
        </p>
      )}
      <label htmlFor="voice-text" className="sr-only">
        Text to read aloud
      </label>
      <textarea
        id="voice-text"
        value={text}
        disabled={!ready}
        maxLength={limits.maxChars}
        onChange={(event) => setText(event.target.value)}
        rows={6}
        placeholder="Welcome to this stunning two-bedroom apartment in Dubai Marina, with views across the water…"
        className="w-full resize-y rounded-xl border border-rule bg-paper px-4 py-3 text-[0.98rem] leading-relaxed text-ink outline-none transition focus:border-ink disabled:cursor-not-allowed"
      />
      <p className="mt-1 text-right text-[0.8rem] tabular-nums text-ink-soft">
        {text.length} / {limits.maxChars}
      </p>

      <fieldset className="mt-3">
        <legend className="text-[0.9rem] font-medium text-ink">Style</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(Object.entries(VOICE_STYLES) as Array<[VoiceStyle, (typeof VOICE_STYLES)[VoiceStyle]]>).map(
            ([id, option]) => (
              <label
                key={id}
                className={`cursor-pointer rounded-xl border px-3 py-2.5 transition ${style === id ? "border-ink bg-ink/5" : "border-rule hover:border-ink/50"}`}
              >
                <input
                  type="radio"
                  name="voice-style"
                  value={id}
                  checked={style === id}
                  disabled={!ready}
                  onChange={() => setStyle(id)}
                  className="sr-only"
                />
                <span className="block text-[0.92rem] font-medium text-ink">{option.label}</span>
                <span className="block text-[0.8rem] text-ink-soft">{option.hint}</span>
              </label>
            ),
          )}
        </div>
      </fieldset>

      <button
        type="button"
        disabled={!ready || !text.trim() || sending || left === 0}
        onClick={() => void speak()}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition hover:bg-signal hover:text-signal-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        {sending && <Loader2 size={16} className="animate-spin" />}
        Read it in my voice
      </button>
      {queuedOffline && <NotAvailable what="Your clip is made" />}
      <Allowance plan={plan} left={left} />
    </div>
  );
}

/** Today's clips left, and what Pro adds (limits in VOICE_PLANS). */
function Allowance({ plan, left }: { plan: VoicePlan; left: number }) {
  const limits = VOICE_PLANS[plan];
  const pro = VOICE_PLANS.pro;
  return (
    <div className="mt-4 text-[0.85rem] text-ink-soft">
      <p>
        <span className="font-medium text-ink">
          {left} of {limits.clipsPerDay}
        </span>{" "}
        {plan === "pro" ? "Pro" : "free"} clips left today · up to {limits.maxChars} characters each
      </p>
      {plan === "free" && (
        <p className="mt-1">
          <Link href="/pricing" className="font-medium text-ink underline underline-offset-4">
            Pro
          </Link>{" "}
          gets {pro.clipsPerDay} clips a day, {pro.maxChars} characters each (about a minute), first place in
          the queue, and clips kept {pro.keepDays} days.
        </p>
      )}
    </div>
  );
}

/**
 * After the first finished clip: the free tool's job is to bring people to
 * Fuccura's websites, so show where their new voice can work for them.
 */
function UseYourVoice() {
  return (
    <div className="mt-6 rounded-2xl bg-ink p-5 text-paper">
      <p className="font-display text-xl">Let your voice market you.</p>
      <p className="mt-2 text-[0.9rem] text-paper/75">
        Put these clips on your reels, TikToks and listing tours, and send people to one place: your own
        website. Pick a free design, click to edit, and it’s live in minutes.
      </p>
      <Link
        href="/templatechooser"
        className="mt-4 inline-flex rounded-full bg-paper px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-signal hover:text-signal-ink"
      >
        Make my free website
      </Link>
    </div>
  );
}

function ClipList({ clips, engineOnline }: { clips: VoiceClip[]; engineOnline: boolean }) {
  if (!clips.length) return null;
  return (
    <ul className="mt-8 space-y-3 border-t border-rule pt-6">
      {clips.map((clip) => (
        <li key={clip.id} className="rounded-xl border border-rule px-4 py-3">
          <p className="line-clamp-2 text-[0.92rem] text-ink">{clip.text}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
            {VOICE_STYLES[clip.style]?.label ?? "Natural"}
          </p>
          <div className="mt-2">
            {clip.status === "done" ? (
              <div className="flex flex-wrap items-center gap-3">
                <audio
                  controls
                  preload="none"
                  src={`/api/tools/voice/clips/${clip.id}`}
                  className="h-9 max-w-full"
                />
                <a
                  href={`/api/tools/voice/clips/${clip.id}?download=1`}
                  className="inline-flex items-center gap-1.5 text-[0.88rem] text-ink underline-offset-4 hover:underline"
                >
                  <Download size={14} /> Download
                </a>
              </div>
            ) : clip.status === "failed" ? (
              <p className="text-[0.88rem] text-red-800">{clip.error ?? "This clip couldn’t be made."}</p>
            ) : (
              <p className="flex items-center gap-2 text-[0.88rem] text-ink-soft">
                <Loader2 size={14} className="animate-spin" />
                {clip.status === "working"
                  ? "Speaking…"
                  : !engineOnline
                    ? "Waiting: currently not available, it starts automatically"
                    : clip.ahead
                      ? `In the queue (${clip.ahead} ahead)`
                      : "Next up…"}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

/** Shown only when someone asks for work while the voice engine is off. */
function NotAvailable({ what }: { what: string }) {
  return (
    <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[0.9rem] text-amber-950">
      <strong>Currently not available.</strong> The voice engine is busy or resting. {what} automatically as
      soon as it’s back, and you can close this page in the meantime.
    </p>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl border border-rule bg-paper p-5 shadow-sm sm:p-7">{children}</div>;
}

function StepTitle({ number, children }: { number: number; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 font-display text-2xl text-ink">
      <span className="grid size-8 place-items-center rounded-full bg-ink text-sm text-paper">{number}</span>
      {children}
    </h2>
  );
}

function SignInFirst() {
  return (
    <Panel>
      <h2 className="font-display text-2xl text-ink">Sign in to make your voice</h2>
      <p className="mt-2 max-w-prose text-ink-soft">
        It’s free. We ask you to sign in so your voice stays private to you, and so nobody else can use it.
      </p>
      <Link
        href={`/login?callbackUrl=${encodeURIComponent("/tools/voice")}`}
        className="mt-5 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition hover:bg-signal hover:text-signal-ink"
      >
        Sign in free
      </Link>
    </Panel>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

/**
 * The voice page's hero demo: the founder's real voice next to their AI clone,
 * made with this tool. While a sample plays, the portrait's ring and the bars
 * move with the sound (Web Audio analyser), so the character "speaks".
 * Samples live in public/tools/voice/ and are unedited tool output, levelled
 * to the same loudness so the comparison is fair.
 */

export interface DemoSample {
  id: string;
  label: string;
  note: string;
  src: string;
  /** What the clip says; shown for the clones so visitors can follow along. */
  transcript?: string;
}

const BARS = 28;

export function VoiceDemo({
  name,
  portrait,
  samples,
}: {
  name: string;
  portrait: string;
  samples: DemoSample[];
}) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const frame = useRef<number>(0);
  const [current, setCurrent] = useState(samples[0]!.id);
  const [playing, setPlaying] = useState(false);
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0));

  const sample = samples.find((item) => item.id === current) ?? samples[0]!;
  const loudness = levels.reduce((sum, level) => sum + level, 0) / BARS;

  /** Connects the <audio> element to an analyser the first time something plays. */
  const connect = () => {
    if (analyser.current || !audio.current) return;
    const context = new AudioContext();
    const node = context.createAnalyser();
    node.fftSize = 128;
    context.createMediaElementSource(audio.current).connect(node);
    node.connect(context.destination);
    analyser.current = node;
  };

  // Reads the sound ~60 times a second while playing (not at all with reduced motion).
  useEffect(() => {
    if (!playing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const data = new Uint8Array(64);
    const tick = () => {
      analyser.current?.getByteFrequencyData(data);
      // Speech lives in the lower bins. Mirror them from the middle out, so the
      // loudest (lowest) frequencies are in the centre, like a classic waveform.
      setLevels(
        Array.from({ length: BARS }, (_, index) => {
          const fromCentre = Math.abs(index - (BARS - 1) / 2);
          return (data[2 + Math.round(fromCentre * 2)] ?? 0) / 255;
        }),
      );
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame.current);
      setLevels(Array(BARS).fill(0));
    };
  }, [playing]);

  const play = async (id: string) => {
    const element = audio.current;
    if (!element) return;
    if (id === current && playing) {
      element.pause();
      return;
    }
    const next = samples.find((item) => item.id === id);
    if (!next) return;
    if (id !== current) {
      element.src = next.src;
      setCurrent(id);
    }
    connect();
    await element.play().catch(() => undefined);
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-rule bg-paper p-6 shadow-xl sm:p-8">
      {/* A soft glow behind the portrait that grows with the voice. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl transition-transform duration-100"
        style={{ transform: `translateX(-50%) scale(${1 + loudness * 0.8})` }}
      />

      <div className="relative flex flex-col items-center text-center">
        <div className="relative">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full border-4 border-emerald-500/60 transition-transform duration-75"
            style={{ transform: `scale(${1.04 + loudness * 0.35})`, opacity: playing ? 1 : 0.35 }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- small static portrait, already optimised */}
          <img
            src={portrait}
            alt={`${name}, whose voice is in these samples`}
            width={160}
            height={200}
            className="relative size-36 rounded-full object-cover object-top sm:size-40"
          />
          {playing && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[0.72rem] font-medium text-white">
              Speaking
            </span>
          )}
        </div>

        <p className="mt-5 font-display text-2xl text-ink">{name}</p>
        <p className="text-[0.88rem] text-ink-soft">Founder, Dubai</p>

        <div aria-hidden className="mt-6 flex h-14 items-end justify-center gap-[3px]">
          {levels.map((level, index) => (
            <span
              key={index}
              className="w-1.5 rounded-full bg-ink/70 transition-[height] duration-75"
              style={{ height: `${Math.max(8, level * 100)}%` }}
            />
          ))}
        </div>
      </div>

      <div className="relative mt-6 grid gap-2" role="list">
        {samples.map((item) => {
          const active = item.id === current;
          return (
            <button
              key={item.id}
              type="button"
              role="listitem"
              onClick={() => void play(item.id)}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${active ? "border-ink bg-ink/5" : "border-rule hover:border-ink/50"}`}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-paper">
                {active && playing ? <Pause size={15} /> : <Play size={15} className="translate-x-px" />}
              </span>
              <span className="min-w-0">
                <span className="block text-[0.95rem] font-medium text-ink">{item.label}</span>
                <span className="block text-[0.8rem] text-ink-soft">{item.note}</span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="relative mt-4 min-h-[3rem] text-[0.88rem] italic leading-snug text-ink-soft">
        {sample.transcript ? `“${sample.transcript}”` : "Listen to the real voice first, then the clones."}
      </p>

      <audio
        ref={audio}
        src={samples[0]!.src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
}

"use client";

import { useState } from "react";

/**
 * Console > Catalog: one template's labels and Pro switch. Tick a preset
 * ("Most popular", "New"…) or type your own (up to 4). Pro: as in the
 * catalogue, or forced on or off. Saves as soon as something changes.
 */
export default function TemplateTags({
  templateId,
  presets,
  catalogPro,
  initialBadges,
  initialPro,
}: {
  templateId: string;
  presets: readonly string[];
  /** Whether the catalogue marks it Pro (used when the switch is "as catalogue"). */
  catalogPro: boolean;
  initialBadges: string[];
  initialPro: boolean | null;
}) {
  const [badges, setBadges] = useState(initialBadges);
  const [pro, setPro] = useState<boolean | null>(initialPro);
  const [custom, setCustom] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const save = async (nextBadges: string[], nextPro: boolean | null) => {
    setBadges(nextBadges);
    setPro(nextPro);
    setState("saving");
    const response = await fetch("/api/console/templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ templateId, badges: nextBadges, proOnly: nextPro }),
    }).catch(() => null);
    if (!response?.ok) return setState("error");
    const saved = (await response.json()) as { badges: string[] };
    setBadges(saved.badges);
    setState("saved");
  };

  const has = (label: string) => badges.some((badge) => badge.toLowerCase() === label.toLowerCase());
  const toggle = (label: string) =>
    save(
      has(label) ? badges.filter((badge) => badge.toLowerCase() !== label.toLowerCase()) : [...badges, label],
      pro,
    );
  const customs = badges.filter(
    (badge) => !presets.some((preset) => preset.toLowerCase() === badge.toLowerCase()),
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {presets.map((label) => (
        <button
          key={label}
          type="button"
          onClick={() => toggle(label)}
          aria-pressed={has(label)}
          className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium ${has(label) ? "bg-[var(--c-accent)] text-white" : "bg-white/5 text-[var(--c-text2)] hover:bg-white/10"}`}
        >
          {label}
        </button>
      ))}
      {customs.map((label) => (
        <button
          key={label}
          type="button"
          onClick={() => toggle(label)}
          title="Remove"
          className="rounded-full bg-[var(--c-accent)] px-2.5 py-1 text-[11.5px] font-medium text-white"
        >
          {label} ×
        </button>
      ))}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (custom.trim()) save([...badges, custom.trim()], pro);
          setCustom("");
        }}
      >
        <input
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          maxLength={20}
          placeholder="+ own tag"
          className="w-24 rounded-full border border-[var(--c-line)] bg-transparent px-2.5 py-1 text-[11.5px] outline-none focus:border-[var(--c-accent)]"
        />
      </form>
      <select
        value={pro === null ? "catalog" : pro ? "on" : "off"}
        onChange={(event) =>
          save(badges, event.target.value === "catalog" ? null : event.target.value === "on")
        }
        className="rounded-full border border-[var(--c-line)] bg-[var(--c-bg)] px-2 py-1 text-[11.5px]"
        title="Pro: only paid plans can save and publish it"
      >
        <option value="catalog">Pro: as built ({catalogPro ? "on" : "off"})</option>
        <option value="on">Pro: on</option>
        <option value="off">Pro: off</option>
      </select>
      {state === "saving" && <span className="text-[11px] text-[var(--c-muted)]">…</span>}
      {state === "saved" && <span className="text-[11px] text-emerald-300">✓</span>}
      {state === "error" && <span className="text-[11px] text-red-300">Didn’t save</span>}
    </div>
  );
}

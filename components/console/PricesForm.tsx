"use client";

import { useState } from "react";

/** Console > Catalog: the plan prices. Saving updates every page at once. */
export default function PricesForm({
  fields,
  initial,
}: {
  fields: Array<{ key: string; label: string; min: number; max: number; unit: string }>;
  initial: Record<string, number>;
}) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((field) => [field.key, String(initial[field.key] ?? "")])),
  );
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setState("saving");
    const response = await fetch("/api/console/prices", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(fields.map((field) => [field.key, Number(values[field.key])]))),
    }).catch(() => null);
    if (!response?.ok) return setState("error");
    const { prices } = (await response.json()) as { prices: Record<string, number> };
    setValues(Object.fromEntries(fields.map((field) => [field.key, String(prices[field.key])])));
    setState("saved");
  };

  return (
    <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <label key={field.key} className="text-[12.5px] text-[var(--c-text2)]">
          {field.label}
          <span className="mt-1 flex items-center gap-2">
            <input
              type="number"
              min={field.min}
              max={field.max}
              step={1}
              required
              value={values[field.key]}
              onChange={(event) => {
                setValues({ ...values, [field.key]: event.target.value });
                setState("idle");
              }}
              className="w-28 rounded-lg border border-[var(--c-line)] bg-[var(--c-bg)] px-3 py-2 text-[14px] text-[var(--c-text)] outline-none focus:border-[var(--c-accent)]"
            />
            <span className="text-[12px] text-[var(--c-muted)]">{field.unit}</span>
          </span>
        </label>
      ))}
      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={state === "saving"}
          className="rounded-lg bg-[var(--c-accent)] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
        >
          {state === "saving" ? "Saving…" : "Save prices"}
        </button>
        {state === "saved" && (
          <span className="text-[12.5px] text-emerald-300">Saved. The site shows the new prices now.</span>
        )}
        {state === "error" && (
          <span className="text-[12.5px] text-red-300">Didn’t save. Check the numbers.</span>
        )}
      </div>
    </form>
  );
}

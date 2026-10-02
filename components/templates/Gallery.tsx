"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Search, X } from "lucide-react";
import { PROFESSIONS, STYLES, type ProfessionId, type StyleTag } from "@/lib/templates/types";

export interface GalleryTemplate {
  id: string; name: string; description: string; professions: ProfessionId[]; styles: StyleTag[]; mood: "light" | "dark"; idealFor: string[];
  palettes: string[]; status?: "approved" | "changes" | "rejected" | "pending";
}

const STATUS_LABEL = { approved: "Approved", changes: "Changes requested", rejected: "Rejected", pending: "Awaiting your review" } as const;

/**
 * The template gallery with filters for profession, style and light or dark.
 * Filters live in the URL, so a filtered view can be shared or bookmarked.
 */
export default function Gallery({ templates, initial, moderator }: { templates: GalleryTemplate[]; initial: { profession?: string; style?: string; mood?: string; q?: string }; moderator: boolean }) {
  const [profession, setProfession] = useState<string>(initial.profession ?? "");
  const [style, setStyle] = useState<string>(initial.style ?? "");
  const [mood, setMood] = useState<string>(initial.mood ?? "");
  const [query, setQuery] = useState(initial.q ?? "");

  const sync = (next: Record<string, string>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ for: profession, style, mood, q: query, ...next })) if (value) params.set(key, value);
    window.history.replaceState(null, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
  };
  const choose = (setter: (value: string) => void, key: string) => (value: string) => { setter(value); sync({ [key]: value }); };

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return templates.filter((template) =>
      (!profession || template.professions.includes(profession as ProfessionId))
      && (!style || template.styles.includes(style as StyleTag))
      && (!mood || template.mood === mood)
      && (!needle || [template.name, template.description, ...template.idealFor].join(" ").toLowerCase().includes(needle)));
  }, [templates, profession, style, mood, query]);
  const count = (id: string) => templates.filter((template) => template.professions.includes(id as ProfessionId)).length;
  const clear = () => { setProfession(""); setStyle(""); setMood(""); setQuery(""); window.history.replaceState(null, "", window.location.pathname); };
  const filtered = Boolean(profession || style || mood || query);

  const chip = (active: boolean) => `shrink-0 rounded-full border px-3.5 py-1.5 text-[0.88rem] transition-colors ${active ? "border-ink bg-ink text-paper" : "border-rule text-ink-soft hover:border-ink hover:text-ink"}`;

  return <>
    <div className="sticky top-16 z-20 -mx-5 mt-12 border-y border-rule bg-paper/92 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative w-full sm:w-64"><span className="sr-only">Search templates</span><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input value={query} onChange={(event) => { setQuery(event.target.value); sync({ q: event.target.value }); }} placeholder="Search, e.g. “architect”" className="w-full rounded-full border border-rule bg-white/60 py-2 pl-9 pr-3 text-[0.92rem] outline-none focus:border-ink" /></label>
        <div className="flex gap-1.5" role="group" aria-label="Light or dark">{[["", "Any"], ["light", "Light"], ["dark", "Dark"]].map(([value, text]) => <button key={value} type="button" onClick={() => choose(setMood, "mood")(value!)} aria-pressed={mood === value} className={chip(mood === value)}>{text}</button>)}</div>
        <select value={style} onChange={(event) => choose(setStyle, "style")(event.target.value)} aria-label="Style" className="rounded-full border border-rule bg-white/60 px-3 py-2 text-[0.92rem] outline-none focus:border-ink"><option value="">Any style</option>{STYLES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        {filtered && <button type="button" onClick={clear} className="inline-flex items-center gap-1 text-[0.88rem] text-ink-soft underline underline-offset-4 hover:text-ink"><X size={13} /> Clear</button>}
        <span className="ml-auto text-[0.88rem] text-ink-faint" aria-live="polite">{matches.length} template{matches.length === 1 ? "" : "s"}</span>
      </div>
      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Profession">
        <button type="button" onClick={() => choose(setProfession, "for")("")} aria-pressed={!profession} className={chip(!profession)}>Everyone</button>
        {PROFESSIONS.filter((item) => count(item.id)).map((item) => <button key={item.id} type="button" onClick={() => choose(setProfession, "for")(item.id)} aria-pressed={profession === item.id} className={chip(profession === item.id)}>{item.label} <span className="opacity-60">{count(item.id)}</span></button>)}
      </div>
    </div>

    {matches.length ? <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2 xl:grid-cols-3">
      {matches.map((template) => <li key={template.id} className="flex flex-col">
        <Link href={`/templatepreview?template=${template.id}`} className="group relative block aspect-[3/2] overflow-hidden rounded-xl border border-rule bg-ink/5" aria-label={`Preview ${template.name}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static thumbnails, already sized */}
          <img src={`/templates/${template.id}.webp`} alt="" loading="lazy" decoding="async" className="size-full object-cover object-top transition-transform duration-[900ms] ease-[cubic-bezier(.2,.7,.1,1)] group-hover:scale-[1.03]" />
          {/* eslint-disable-next-line @next/next/no-img-element -- static thumbnails, already sized */}
          <img src={`/templates/${template.id}-phone.webp`} alt="" loading="lazy" decoding="async" className="absolute bottom-3 right-3 w-[22%] translate-y-3 rounded-lg border-[3px] border-ink object-cover object-top opacity-0 shadow-xl transition duration-500 group-hover:translate-y-0 group-hover:opacity-100" />
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[0.85rem] text-paper opacity-0 transition duration-300 group-hover:opacity-100">Preview <ArrowUpRight size={14} /></span>
          {moderator && template.status && <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-medium ${template.status === "approved" ? "bg-emerald-100 text-emerald-900" : template.status === "pending" ? "bg-amber-100 text-amber-900" : "bg-red-100 text-red-900"}`}>{STATUS_LABEL[template.status]}</span>}
        </Link>
        <div className="mt-5 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-[1.7rem] leading-none tracking-[-0.02em] text-ink">{template.name}</h2>
          <span className="flex gap-1" aria-label="Colour options">{template.palettes.slice(0, 3).map((colour, index) => <span key={index} className="size-3.5 rounded-full border border-black/10" style={{ background: colour }} />)}</span>
        </div>
        <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-soft">{template.description}</p>
        <p className="mt-3 text-[0.86rem] text-ink-faint">For {template.idealFor.join(", ").toLowerCase()}</p>
        <div className="mt-auto flex items-center gap-5 pt-6">
          <Link href={`/editor/${template.id}`} className="group/cta inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.92rem] font-medium text-paper transition-colors hover:bg-signal hover:text-signal-ink">Use this template <ArrowRight size={15} className="transition-transform group-hover/cta:translate-x-0.5" /></Link>
          <Link href={`/templatepreview?template=${template.id}`} className="text-[0.92rem] text-ink underline decoration-rule underline-offset-[5px] hover:decoration-ink">Preview</Link>
        </div>
      </li>)}
    </ul> : <div className="mt-20 text-center"><p className="font-display text-[2rem]">Nothing matches yet.</p><p className="mt-2 text-ink-soft">Try another style, or <button type="button" onClick={clear} className="underline">see every template</button>.</p></div>}
  </>;
}

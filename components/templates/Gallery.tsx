"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Search, X } from "lucide-react";
import { FIELDS, PROFESSIONS, STYLES, type ProfessionId, type StyleTag } from "@/lib/templates/types";
import { rankRoles, type RoleSummary } from "@/lib/templates/roles/search";

export interface GalleryTemplate {
  id: string; name: string; description: string; professions: ProfessionId[]; styles: StyleTag[]; mood: "light" | "dark"; idealFor: string[];
  palettes: string[]; status?: "approved" | "changes" | "rejected" | "pending";
}

const STATUS_LABEL = { approved: "Approved", changes: "Changes requested", rejected: "Rejected", pending: "Awaiting your review" } as const;

/**
 * The template gallery with filters for field and profession, style and light or dark.
 * Filters live in the URL, so a filtered view can be shared or bookmarked.
 */
const fieldOf = (id: string) => PROFESSIONS.find((item) => item.id === id)?.field ?? "";
const professionLabel = (id: string) => PROFESSIONS.find((item) => item.id === id)?.label ?? "";

export default function Gallery({ templates, roles, initial, moderator }: { templates: GalleryTemplate[]; roles: RoleSummary[]; initial: { profession?: string; field?: string; style?: string; mood?: string; q?: string; role?: string }; moderator: boolean }) {
  const [role, setRole] = useState<string>(roles.some((item) => item.id === initial.role) ? initial.role! : "");
  const [finding, setFinding] = useState(false);
  const selectedRole = roles.find((item) => item.id === role);
  const [profession, setProfession] = useState<string>(initial.profession ?? "");
  const [field, setField] = useState<string>(initial.field ?? (initial.profession ? fieldOf(initial.profession) : ""));
  const [style, setStyle] = useState<string>(initial.style ?? "");
  const [mood, setMood] = useState<string>(initial.mood ?? "");
  const [query, setQuery] = useState(initial.q ?? "");

  const sync = (next: Record<string, string>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ role, field, for: profession, style, mood, q: query, ...next })) if (value) params.set(key, value);
    window.history.replaceState(null, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
  };
  const choose = (setter: (value: string) => void, key: string) => (value: string) => { setter(value); sync({ [key]: value }); };

  // Typing a job title (“nurse”, “plumber”) also finds templates made for that profession.
  const suggestions = useMemo(() => rankRoles(roles, query, 6), [roles, query]);
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const roleProfessions = new Set(rankRoles(roles, query, 20).map((item) => item.profession));
    const preferred = selectedRole?.templates ?? [];
    const rank = (id: string) => { const at = preferred.indexOf(id); return at < 0 ? preferred.length : at; };
    return templates.filter((template) =>
      (!profession || template.professions.includes(profession as ProfessionId))
      && (!field || template.professions.some((id) => fieldOf(id) === field))
      && (!style || template.styles.includes(style as StyleTag))
      && (!mood || template.mood === mood)
      && (!needle || [template.name, template.description, ...template.idealFor, ...template.professions.map(professionLabel)].join(" ").toLowerCase().includes(needle) || template.professions.some((id) => roleProfessions.has(id))))
      .sort((a, b) => rank(a.id) - rank(b.id));
  }, [templates, roles, selectedRole, profession, field, style, mood, query]);
  const chooseRole = (next: RoleSummary) => {
    const nextField = fieldOf(next.profession);
    setRole(next.id); setQuery(""); setField(nextField); setProfession(next.profession); setFinding(false);
    sync({ role: next.id, q: "", field: nextField, for: next.profession });
  };
  const clearRole = () => { setRole(""); sync({ role: "" }); };
  const withRole = (url: string) => (selectedRole ? `${url}${url.includes("?") ? "&" : "?"}role=${selectedRole.id}` : url);
  const count = (id: string) => templates.filter((template) => template.professions.includes(id as ProfessionId)).length;
  const fieldCount = (id: string) => templates.filter((template) => template.professions.some((item) => fieldOf(item) === id)).length;
  const chooseField = (id: string) => { setField(id); setProfession(""); sync({ field: id, for: "" }); };
  const clear = () => { setRole(""); setField(""); setProfession(""); setStyle(""); setMood(""); setQuery(""); window.history.replaceState(null, "", window.location.pathname); };
  const filtered = Boolean(role || field || profession || style || mood || query);

  const chip = (active: boolean) => `shrink-0 rounded-full border px-3.5 py-1.5 text-[0.88rem] transition-colors ${active ? "border-ink bg-ink text-paper" : "border-rule text-ink-soft hover:border-ink hover:text-ink"}`;

  return <>
    <div className="sticky top-16 z-20 -mx-5 mt-12 border-y border-rule bg-paper/92 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-[22rem]">
          <label><span className="sr-only">What do you do?</span><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input value={query} role="combobox" aria-expanded={finding && suggestions.length > 0} aria-controls="role-suggestions" aria-autocomplete="list"
              onFocus={() => setFinding(true)} onBlur={() => window.setTimeout(() => setFinding(false), 150)}
              onKeyDown={(event) => { if (event.key === "Enter" && suggestions[0]) { event.preventDefault(); chooseRole(suggestions[0]); } if (event.key === "Escape") setFinding(false); }}
              onChange={(event) => { setQuery(event.target.value); setFinding(true); sync({ q: event.target.value }); }}
              placeholder="What do you do? e.g. paediatrician, plumber" className="w-full rounded-full border border-rule bg-white/60 py-2 pl-9 pr-3 text-[0.92rem] outline-none focus:border-ink" /></label>
          {finding && suggestions.length > 0 && <ul id="role-suggestions" role="listbox" aria-label="Job titles" className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-rule bg-paper py-1.5 shadow-[0_24px_48px_-24px_rgb(21_20_15/0.45)]">
            {suggestions.map((item) => <li key={item.id} role="option" aria-selected={false}><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => chooseRole(item)} className="flex w-full items-baseline justify-between gap-4 px-4 py-2 text-left text-[0.92rem] hover:bg-ink/5"><span className="text-ink">{item.label}</span><span className="shrink-0 text-[0.78rem] text-ink-faint">{professionLabel(item.profession)}</span></button></li>)}
          </ul>}
        </div>
        <div className="flex gap-1.5" role="group" aria-label="Light or dark">{[["", "Any"], ["light", "Light"], ["dark", "Dark"]].map(([value, text]) => <button key={value} type="button" onClick={() => choose(setMood, "mood")(value!)} aria-pressed={mood === value} className={chip(mood === value)}>{text}</button>)}</div>
        <select value={style} onChange={(event) => choose(setStyle, "style")(event.target.value)} aria-label="Style" className="rounded-full border border-rule bg-white/60 px-3 py-2 text-[0.92rem] outline-none focus:border-ink"><option value="">Any style</option>{STYLES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        {filtered && <button type="button" onClick={clear} className="inline-flex items-center gap-1 text-[0.88rem] text-ink-soft underline underline-offset-4 hover:text-ink"><X size={13} /> Clear</button>}
        <Link href="/for" className="text-[0.88rem] text-ink-soft underline decoration-rule underline-offset-4 hover:text-ink">All {roles.length} job titles</Link>
        <span className="ml-auto text-[0.88rem] text-ink-faint" aria-live="polite">{matches.length} template{matches.length === 1 ? "" : "s"}</span>
      </div>
      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Field">
        <button type="button" onClick={() => chooseField("")} aria-pressed={!field} className={chip(!field)}>Everyone</button>
        {FIELDS.filter((item) => fieldCount(item.id)).map((item) => <button key={item.id} type="button" onClick={() => chooseField(item.id)} aria-pressed={field === item.id} className={chip(field === item.id)}>{item.label} <span className="opacity-60">{fieldCount(item.id)}</span></button>)}
      </div>
      {field && <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Profession">
        <button type="button" onClick={() => choose(setProfession, "for")("")} aria-pressed={!profession} className={`${chip(!profession)} !py-1 text-[0.82rem]`}>All {FIELDS.find((item) => item.id === field)?.label.toLowerCase()}</button>
        {PROFESSIONS.filter((item) => item.field === field && count(item.id)).map((item) => <button key={item.id} type="button" onClick={() => choose(setProfession, "for")(item.id)} aria-pressed={profession === item.id} className={`${chip(profession === item.id)} !py-1 text-[0.82rem]`}>{item.label} <span className="opacity-60">{count(item.id)}</span></button>)}
      </div>}
      {selectedRole && <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9rem] text-ink-soft"><span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-paper">{selectedRole.label}<button type="button" onClick={clearRole} aria-label={`Stop showing templates for ${selectedRole.plural}`} className="opacity-70 hover:opacity-100"><X size={13} /></button></span>Best designs for {selectedRole.plural} first. Previews and the editor start with a {selectedRole.label.toLowerCase()}’s sample portfolio.</p>}
    </div>

    {matches.length ? <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2 xl:grid-cols-3">
      {matches.map((template) => <li key={template.id} className="flex flex-col">
        <Link href={withRole(`/templatepreview?template=${template.id}`)} className="group relative block aspect-[3/2] overflow-hidden rounded-xl border border-rule bg-ink/5" aria-label={`Preview ${template.name}`}>
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
          <Link href={withRole(`/editor/${template.id}`)} className="group/cta inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.92rem] font-medium text-paper transition-colors hover:bg-signal hover:text-signal-ink">Use this template <ArrowRight size={15} className="transition-transform group-hover/cta:translate-x-0.5" /></Link>
          <Link href={withRole(`/templatepreview?template=${template.id}`)} className="text-[0.92rem] text-ink underline decoration-rule underline-offset-[5px] hover:decoration-ink">Preview</Link>
        </div>
      </li>)}
    </ul> : <div className="mt-20 text-center"><p className="font-display text-[2rem]">Nothing matches yet.</p><p className="mt-2 text-ink-soft">Try another style, or <button type="button" onClick={clear} className="underline">see every template</button>.</p></div>}
  </>;
}

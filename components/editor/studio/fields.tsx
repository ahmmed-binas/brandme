"use client";

import { useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Copy, Eye, EyeOff, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";

/**
 * Form controls for the studio editor. Every control carries `data-field`
 * with its content path, so clicking an element in the preview can scroll to
 * and focus the matching control.
 */

const inputClass = "w-full rounded-lg border border-rule bg-white/70 px-3 py-2 text-[14px] text-ink outline-none transition placeholder:text-ink-faint focus:border-ink focus:bg-white";

export function Field({ label, value, onChange, path, type = "text", placeholder, hint }: { label: string; value?: string; onChange: (value: string) => void; path?: string; type?: string; placeholder?: string; hint?: string }) {
  return <label className="block">
    <span className="mb-1 block text-[12px] font-medium text-ink-soft">{label}</span>
    <input data-field={path} type={type} value={value ?? ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={inputClass} />
    {hint && <span className="mt-1 block text-[11px] text-ink-faint">{hint}</span>}
  </label>;
}

export function TextArea({ label, value, onChange, path, rows = 3, placeholder }: { label: string; value?: string; onChange: (value: string) => void; path?: string; rows?: number; placeholder?: string }) {
  return <label className="block">
    <span className="mb-1 flex justify-between text-[12px] font-medium text-ink-soft"><span>{label}</span><span className="font-normal text-ink-faint">{(value ?? "").trim() ? `${(value ?? "").trim().split(/\s+/).length} words` : ""}</span></span>
    <textarea data-field={path} value={value ?? ""} rows={rows} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={`${inputClass} resize-y leading-relaxed`} />
  </label>;
}

/** Comma-separated list that lets people type commas and spaces naturally. */
export function TagsField({ label, value, onChange, path, max = 40 }: { label: string; value?: string[]; onChange: (value: string[]) => void; path?: string; max?: number }) {
  const joined = (value ?? []).join(", ");
  const [draft, setDraft] = useState(joined);
  const [focused, setFocused] = useState(false);
  return <label className="block">
    <span className="mb-1 block text-[12px] font-medium text-ink-soft">{label}</span>
    <input data-field={path} value={focused ? draft : joined} onFocus={() => { setDraft(joined); setFocused(true); }} onBlur={() => setFocused(false)}
      onChange={(event) => { setDraft(event.target.value); onChange(event.target.value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, max)); }} className={inputClass} />
    <span className="mt-1 block text-[11px] text-ink-faint">Separate with commas.</span>
  </label>;
}

export function ImageField({ label, value, onChange, upload, path }: { label: string; value?: string; onChange: (value: string) => void; upload: (file: File) => Promise<string>; path?: string }) {
  const input = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true); setError(null);
    try { onChange(await upload(file)); } catch (caught) { setError((caught as Error).message); } finally { setBusy(false); }
  };
  return <div data-field={path}>
    <span className="mb-1 block text-[12px] font-medium text-ink-soft">{label}</span>
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => input.current?.click()} className="relative grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-ink/30 bg-white/60 text-ink-soft transition hover:border-ink" aria-label={value ? `Replace ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}
        onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void pick(event.dataTransfer.files[0]); }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the owner's image */}
        {value ? <img src={value} alt="" className="size-full object-cover" /> : busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
        {busy && value && <span className="absolute inset-0 grid place-items-center bg-white/70"><Loader2 size={16} className="animate-spin" /></span>}
      </button>
      <div className="text-[12px] leading-relaxed">
        <button type="button" onClick={() => input.current?.click()} className="font-medium text-ink underline decoration-rule underline-offset-2 hover:decoration-ink">{value ? "Replace" : "Upload"}</button>
        {value && <> · <button type="button" onClick={() => onChange("")} className="text-ink-soft hover:text-[color:var(--destructive)]">Remove</button></>}
        <span className="block text-ink-faint">or drop a file here</span>
      </div>
    </div>
    {error && <p className="mt-1 text-[12px] text-[color:var(--destructive)]">{error}</p>}
    <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(event) => { void pick(event.target.files?.[0]); event.target.value = ""; }} />
  </div>;
}

/** A collapsible editor section with an optional show/hide switch and a custom title. */
export function Section({ id, title, open, onToggle, hidden, onHidden, label, onLabel, count, children, action }: {
  id: string; title: string; open: boolean; onToggle: () => void; hidden?: boolean; onHidden?: (hidden: boolean) => void;
  label?: string; onLabel?: (label: string) => void; count?: number; children: ReactNode; action?: ReactNode;
}) {
  return <section data-section={id} className="border-b border-rule">
    <div className="flex items-center gap-2 px-5 py-3.5">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <ChevronDown size={15} className={`shrink-0 text-ink-faint transition-transform ${open ? "" : "-rotate-90"}`} />
        <span className={`truncate text-[14px] font-semibold ${hidden ? "text-ink-faint line-through" : "text-ink"}`}>{title}</span>
        {count !== undefined && <span className="rounded-full bg-ink/5 px-1.5 text-[11px] text-ink-soft">{count}</span>}
      </button>
      {onHidden && <button type="button" onClick={() => onHidden(!hidden)} className="rounded-md p-1.5 text-ink-faint hover:bg-ink/5 hover:text-ink" title={hidden ? "Show this section" : "Hide this section"} aria-label={hidden ? `Show ${title}` : `Hide ${title}`}>{hidden ? <EyeOff size={15} /> : <Eye size={15} />}</button>}
    </div>
    {open && <div className="space-y-4 px-5 pb-6">
      {onLabel && <Field label="Section title on your site" value={label} onChange={onLabel} placeholder={title} />}
      {children}
      {action}
    </div>}
  </section>;
}

export interface ListSpec<T> {
  noun: string;
  max: number;
  blank: () => T;
  title: (item: T, index: number) => string;
  render: (item: T, update: (patch: Partial<T>) => void, path: string) => ReactNode;
}

/** Repeating items (projects, roles, services…) with add, reorder, duplicate and delete. */
export function ListEditor<T>({ items, onChange, spec, path, openItem, setOpenItem }: { items: T[]; onChange: (items: T[], checkpoint?: boolean) => void; spec: ListSpec<T>; path: string; openItem: string | null; setOpenItem: (key: string | null) => void }) {
  const move = (from: number, to: number) => { if (to < 0 || to >= items.length) return; const next = [...items]; const [item] = next.splice(from, 1); next.splice(to, 0, item!); onChange(next, true); setOpenItem(`${path}.${to}`); };
  return <div className="space-y-2">
    {items.map((item, index) => {
      const key = `${path}.${index}`;
      const open = openItem === key;
      return <div key={index} data-field={key} className={`rounded-xl border bg-white/60 transition ${open ? "border-ink/40 shadow-[0_8px_24px_-16px_rgba(0,0,0,.35)]" : "border-rule"}`}>
        <div className="flex items-center gap-1 py-1 pl-3 pr-1">
          <button type="button" onClick={() => setOpenItem(open ? null : key)} className="min-w-0 flex-1 truncate py-1.5 text-left text-[13.5px] text-ink">{spec.title(item, index) || <span className="text-ink-faint">Untitled {spec.noun}</span>}</button>
          <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0} className="rounded p-1.5 text-ink-faint hover:bg-ink/5 hover:text-ink disabled:opacity-30" aria-label={`Move ${spec.noun} up`}><ArrowUp size={14} /></button>
          <button type="button" onClick={() => move(index, index + 1)} disabled={index === items.length - 1} className="rounded p-1.5 text-ink-faint hover:bg-ink/5 hover:text-ink disabled:opacity-30" aria-label={`Move ${spec.noun} down`}><ArrowDown size={14} /></button>
          <button type="button" onClick={() => { if (items.length < spec.max) { const next = [...items]; next.splice(index + 1, 0, structuredClone(item)); onChange(next, true); } }} className="rounded p-1.5 text-ink-faint hover:bg-ink/5 hover:text-ink" aria-label={`Duplicate ${spec.noun}`}><Copy size={14} /></button>
          <button type="button" onClick={() => { onChange(items.filter((_, i) => i !== index), true); setOpenItem(null); }} className="rounded p-1.5 text-ink-faint hover:bg-[color:var(--destructive)]/10 hover:text-[color:var(--destructive)]" aria-label={`Delete ${spec.noun}`}><Trash2 size={14} /></button>
        </div>
        {open && <div className="space-y-3 border-t border-rule p-3">{spec.render(item, (patch) => onChange(items.map((current, i) => (i === index ? { ...current, ...patch } : current))), key)}</div>}
      </div>;
    })}
    {items.length < spec.max && <button type="button" onClick={() => { onChange([...items, spec.blank()], true); setOpenItem(`${path}.${items.length}`); }} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink/25 py-2.5 text-[13px] font-medium text-ink-soft transition hover:border-ink hover:text-ink"><Plus size={14} /> Add {spec.noun}</button>}
  </div>;
}

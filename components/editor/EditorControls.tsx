"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, Cloud, CloudOff, Copy, ExternalLink, Globe, HardDrive, Loader2, X } from "lucide-react";
import type { PublishInfo, SaveState } from "./usePortfolioPersistence";
import { normaliseSlug, slugError } from "@/lib/portfolio/schema";
import { DomainPanel } from "./DomainPanel";

/** Shows where the work is saved, so people never wonder whether they will lose it. */
export function SaveStatus({ save, signedIn }: { save: SaveState; signedIn: boolean }) {
  const view = {
    loading: { icon: <Loader2 size={14} className="animate-spin" />, text: "Loading…", tone: "text-slate-500" },
    local: { icon: <HardDrive size={14} />, text: signedIn ? "Saved on this device" : "Saved on this device only", tone: "text-slate-500" },
    saving: { icon: <Loader2 size={14} className="animate-spin" />, text: "Saving…", tone: "text-slate-500" },
    cloud: { icon: <Cloud size={14} />, text: "Saved to your account", tone: "text-emerald-700" },
    error: { icon: <CloudOff size={14} />, text: "Not saved to your account", tone: "text-amber-700" },
  }[save.kind];
  return <span role="status" title={save.kind === "error" ? save.message : undefined} className={`inline-flex items-center gap-1.5 text-xs font-semibold ${view.tone}`}>{view.icon}<span className="hidden md:inline">{view.text}</span></span>;
}

/** A comma-separated list input that lets people type commas and spaces naturally. */
export function ListField({ label, value, onChange, max = 30, className = "" }: { label: string; value: string[] | undefined; onChange: (value: string[]) => void; max?: number; className?: string }) {
  const joined = (value ?? []).join(", ");
  const [draft, setDraft] = useState(joined);
  const [focused, setFocused] = useState(false);
  const shown = focused ? draft : joined;
  return <label className={`block ${className}`}>
    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
    <input
      value={shown}
      onFocus={() => { setDraft(joined); setFocused(true); }}
      onBlur={() => setFocused(false)}
      onChange={(event) => {
        setDraft(event.target.value);
        onChange(event.target.value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, max));
      }}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
    />
    <span className="mt-1 block text-[11px] text-slate-400">Separate items with commas.</span>
  </label>;
}

/** Publish / update / unpublish flow. Requires an account so the page has an owner. */
export function PublishDialog({ open, onClose, signedIn, templateId, info, suggestedSlug, publish, unpublish }: {
  open: boolean;
  onClose: () => void;
  signedIn: boolean;
  templateId: string;
  info: PublishInfo;
  suggestedSlug: string;
  publish: (slug: string) => Promise<string>;
  unpublish: () => Promise<void>;
}) {
  // Follows the saved address (which may load after the dialog opens) until the user types their own.
  const [typedSlug, setSlug] = useState<string | null>(null);
  const slug = typedSlug ?? info.slug ?? normaliseSlug(suggestedSlug);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => { const timer = window.setTimeout(() => setOrigin(window.location.origin), 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;

  const live = Boolean(info.publishedAt && info.slug);
  const liveUrl = info.slug ? `${origin}/p/${info.slug}` : "";
  const localError = slug ? slugError(slug) : "Choose an address.";
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true); setError(null);
    try { await action(); } catch (caught) { setError((caught as Error).message); } finally { setBusy(false); }
  };

  return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/50 p-4" onClick={onClose}>
    <div role="dialog" aria-modal="true" aria-labelledby="publish-title" className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 text-slate-900 shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700"><Globe size={14} /> {live ? "Live portfolio" : "Publish"}</p>
          <h2 id="publish-title" className="mt-1 text-xl font-black">{live ? "Your portfolio is live" : "Put your portfolio online"}</h2>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
      </div>

      {!signedIn ? <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
        <p>Sign in to publish. Your portfolio is saved to your account, gets its own address, and you can update or take it down at any time.</p>
        <Link href={`/login?callbackUrl=${encodeURIComponent(`/editor/${templateId}`)}`} className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700">Sign in to publish</Link>
        <p className="text-xs text-slate-500">Your current work stays on this device and is added to your account after you sign in.</p>
      </div> : <div className="mt-5 space-y-4">
        {live && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <a href={`/p/${info.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 break-all font-bold text-emerald-800 hover:underline">{liveUrl} <ExternalLink size={14} className="shrink-0" /></a>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            <button onClick={() => { void navigator.clipboard.writeText(liveUrl).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1500); }); }} className="inline-flex items-center gap-1 font-bold text-emerald-800">{copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy link"}</button>
            {info.hasUnpublishedChanges ? <span className="inline-flex items-center gap-1 font-semibold text-amber-700"><AlertCircle size={13} /> You have changes that aren’t live yet</span> : <span className="text-emerald-700">Visitors see your latest version</span>}
          </div>
        </div>}
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Your address</span>
          <div className="flex items-center rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
            <span className="pl-3 text-sm text-slate-400">/p/</span>
            <input value={slug} onChange={(event) => setSlug(normaliseSlug(event.target.value))} className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-sm outline-none" placeholder="your-name" aria-invalid={Boolean(localError)} />
          </div>
          {localError && slug && <span className="mt-1 block text-xs text-red-600">{localError}</span>}
        </label>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={busy || Boolean(localError)} onClick={() => void run(() => publish(slug))} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
          {busy && <Loader2 size={16} className="animate-spin" />}{live ? (info.slug === slug ? "Publish latest changes" : "Move to this address") : "Publish portfolio"}
        </button>
        {live && <button disabled={busy} onClick={() => void run(unpublish)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Unpublish</button>}
        <p className="text-xs leading-5 text-slate-500">Edits stay private until you publish them. Only you can change this portfolio.</p>
        <div className="border-t border-slate-100 pt-4"><DomainPanel templateId={templateId} personName={suggestedSlug} published={live} /></div>
      </div>}
    </div>
  </div>;
}

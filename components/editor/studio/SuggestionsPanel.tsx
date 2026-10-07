"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ExternalLink, GitBranch, Loader2, RefreshCw, Search } from "lucide-react";
import { applySuggestion, type Suggestion } from "@/lib/autoupdate/apply";
import type { StandardContent } from "@/lib/portfolio/schema";

interface State {
  suggestions: Suggestion[];
  settings: { githubUsername: string | null; autoUpdate: boolean; lastSyncedAt: string | null; lastResearchAt: string | null };
  features: { autoSync: boolean; researchEveryDays: number | null; planName: string };
}

const ago = (iso: string | null) => {
  if (!iso) return "never";
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  return days < 1 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
};

/**
 * Keeps a portfolio current without the owner having to remember: GitHub
 * checks and a web research pass turn into suggestions the owner applies with
 * one click. Nothing changes on the site until they do (and publish).
 */
export function SuggestionsPanel({ signedIn, templateId, content, onApply }: { signedIn: boolean; templateId: string; content: StandardContent; onApply: (next: StandardContent) => void }) {
  const [state, setState] = useState<State | null>(null);
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState<"github" | "research" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => fetch("/api/suggestions").then((response) => (response.ok ? response.json() as Promise<State> : null)).then((body) => {
    if (!body) return;
    setState(body);
    setUsername((current) => current || body.settings.githubUsername || "");
  }).catch(() => undefined), []);
  useEffect(() => { if (signedIn) void load(); }, [signedIn, load]);

  if (!signedIn) return <div className="m-4 rounded-xl border border-rule bg-white/60 p-4 text-[13px] leading-relaxed text-ink-soft">Sign in and your portfolio can keep itself up to date: new GitHub projects, talks, awards and roles appear here for you to add with one click.</div>;
  if (!state) return null;

  const run = async (kind: "github" | "research") => {
    setBusy(kind); setNotice(null);
    try {
      if (kind === "github" && username !== (state.settings.githubUsername ?? "")) {
        const saved = await fetch("/api/suggestions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ githubUsername: username }) });
        if (!saved.ok) { setNotice(((await saved.json().catch(() => ({}))) as { error?: string }).error ?? "That username couldn’t be saved."); return; }
      }
      const response = await fetch("/api/suggestions/refresh", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, templateId }) });
      const body = await response.json().catch(() => ({})) as { added?: number; error?: string; charged?: number };
      if (!response.ok) { setNotice(body.error ?? "That check didn’t work. Please try again."); return; }
      setNotice(body.added ? `Found ${body.added} thing${body.added === 1 ? "" : "s"} to review below.${body.charged ? ` Used ${body.charged} credits.` : ""}` : `Nothing new this time.${body.charged ? ` Used ${body.charged} credits.` : ""}`);
      await load();
    } finally {
      setBusy(null);
    }
  };

  const decide = async (suggestion: Suggestion, action: "applied" | "dismissed") => {
    if (action === "applied") onApply(applySuggestion(content, suggestion.payload));
    setState((current) => current && { ...current, suggestions: current.suggestions.filter((item) => item.id !== suggestion.id) });
    await fetch(`/api/suggestions/${suggestion.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }).catch(() => undefined);
  };

  const toggleAuto = async () => {
    const autoUpdate = !state.settings.autoUpdate;
    setState({ ...state, settings: { ...state.settings, autoUpdate } });
    await fetch("/api/suggestions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ autoUpdate }) }).catch(() => undefined);
  };

  const scheduled = state.features.autoSync || state.features.researchEveryDays;
  return <section className="border-b border-rule p-4">
    <Link href="/account/investigator" className="mb-4 block rounded-xl bg-ink p-4 text-paper hover:bg-ink/90"><span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-paper/60">New</span><span className="mt-1 block font-display text-[1.15rem] leading-tight">The Investigator</span><span className="mt-1 block text-[12.5px] leading-relaxed text-paper/75">Give it your profiles and it keeps this site up to date with your career, on the schedule you choose. Set it up →</span></Link>
    <h3 className="font-display text-[1.25rem] leading-tight">Keep it up to date</h3>
    <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">We look for new work and news about you. You decide what goes on your site.</p>

    <div className="mt-4 space-y-2">
      <div className="flex gap-2">
        <label className="relative flex-1"><span className="sr-only">GitHub username</span><GitBranch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="GitHub username" className="w-full rounded-lg border border-rule bg-white/70 py-2 pl-8 pr-2 text-[13px] outline-none focus:border-ink" /></label>
        <button type="button" disabled={busy !== null || !username.trim()} onClick={() => void run("github")} className="inline-flex items-center gap-1.5 rounded-lg border border-ink/25 px-3 text-[12.5px] font-medium hover:border-ink disabled:opacity-40">{busy === "github" ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Check</button>
      </div>
      <button type="button" disabled={busy !== null} onClick={() => void run("research")} className="flex w-full items-center justify-between gap-2 rounded-lg border border-ink/25 px-3 py-2 text-left text-[12.5px] hover:border-ink disabled:opacity-40">
        <span className="flex items-center gap-2 font-medium">{busy === "research" ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />} Search the web for my news</span><span className="text-ink-faint">uses AI credits</span>
      </button>
      {busy === "research" && <p className="text-[12px] text-ink-soft">Searching… this can take a minute.</p>}
      {notice && <p role="status" className="text-[12px] text-ink">{notice}</p>}
    </div>

    {scheduled ? <label className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-ink-soft">
      <input type="checkbox" checked={state.settings.autoUpdate} onChange={() => void toggleAuto()} className="mt-0.5 accent-[color:var(--ink,#15140f)]" />
      <span>Check for me automatically{state.features.autoSync ? " (GitHub weekly" : " ("}{state.features.researchEveryDays ? `${state.features.autoSync ? ", " : ""}news every ${state.features.researchEveryDays} days` : ""}) and email me when there’s something new. Last checked {ago(state.settings.lastSyncedAt ?? state.settings.lastResearchAt)}.</span>
    </label> : <p className="mt-4 text-[12px] text-ink-faint">For regular checks of all your profiles, switch on <a href="/account/investigator" className="underline">the Investigator</a>.</p>}

    {state.suggestions.length > 0 && <ul className="mt-4 space-y-2">{state.suggestions.map((suggestion) => <li key={suggestion.id} className="rounded-xl border border-rule bg-white/70 p-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">{suggestion.source === "github" ? "From GitHub" : suggestion.source === "investigator" ? "Found by the Investigator" : "Found on the web"}</p>
      <p className="mt-1 text-[13px] font-medium leading-snug">{suggestion.title}</p>
      {suggestion.detail && <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">{suggestion.detail}</p>}
      {suggestion.sourceUrl && <a href={suggestion.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[12px] text-ink-soft underline">Source <ExternalLink size={11} /></a>}
      <div className="mt-2 flex gap-2"><button type="button" onClick={() => void decide(suggestion, "applied")} className="rounded-full bg-ink px-3 py-1 text-[12px] font-medium text-paper">Add to portfolio</button><button type="button" onClick={() => void decide(suggestion, "dismissed")} className="rounded-full px-3 py-1 text-[12px] text-ink-soft hover:text-ink">Dismiss</button></div>
    </li>)}</ul>}
  </section>;
}

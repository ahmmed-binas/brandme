"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleAlert, CircleSlash, Loader2, Lock, Plus, Search, Trash2, Undo2 } from "lucide-react";
import type { InvestigatorLink, LinkKind, LinkKindInfo } from "@/lib/investigator/links";
import type { Frequency, InvestigatorAccess, InvestigatorSettings, Mode } from "@/lib/investigator/settings";
import type { RunView, SourceResult } from "@/lib/investigator/run";

interface State {
  settings: InvestigatorSettings;
  access: InvestigatorAccess;
  runs: RunView[];
  portfolios: { templateId: string; label: string }[];
  kinds: LinkKindInfo[];
  frequencies: { id: Frequency; label: string }[];
}

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "");
const card = "rounded-2xl border border-rule bg-card p-6";
const STATUS_ICON: Record<SourceResult["status"], React.ReactNode> = {
  read: <CheckCircle2 size={15} className="text-emerald-600" aria-label="Read" />,
  partly: <CircleAlert size={15} className="text-amber-600" aria-label="Partly readable" />,
  blocked: <CircleSlash size={15} className="text-ink-faint" aria-label="Not readable without logging in" />,
  not_found: <CircleSlash size={15} className="text-red-600" aria-label="Not found" />,
  skipped: <CircleAlert size={15} className="text-amber-600" aria-label="Skipped" />,
  error: <CircleAlert size={15} className="text-red-600" aria-label="Couldn’t read" />,
};
const STATUS_TEXT: Record<SourceResult["status"], string> = { read: "Read", partly: "Partly readable", blocked: "Needs a login (we never log in)", not_found: "Not found", skipped: "Skipped", error: "Couldn’t read" };

/** The Investigator's settings and history: the owner's own profiles, how often, and what happens to findings. */
export default function InvestigatorPanel() {
  const [state, setState] = useState<State | null>(null);
  const [links, setLinks] = useState<InvestigatorLink[]>([]);
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [mode, setMode] = useState<Mode>("ask");
  const [enabled, setEnabled] = useState(false);
  const [templateId, setTemplateId] = useState<string>("");
  const [own, setOwn] = useState(false);
  const [busy, setBusy] = useState<"save" | "run" | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const apply = useCallback((body: State) => {
    setState(body);
    setLinks(body.settings.links.length ? body.settings.links : [{ kind: "linkedin", value: "" }]);
    setFrequency(body.access.frequencies.includes(body.settings.frequency) ? body.settings.frequency : body.access.frequencies[0] ?? "monthly");
    setMode(body.settings.mode);
    setEnabled(body.settings.enabled);
    setTemplateId(body.settings.templateId ?? body.portfolios[0]?.templateId ?? "");
    setOwn(body.settings.links.length > 0);
  }, []);
  const fetchState = () => fetch("/api/investigator").then(async (response) => {
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error ?? "The Investigator couldn’t load.");
    return body as State;
  });
  const load = async () => { try { apply(await fetchState()); } catch (error) { setMessage({ tone: "error", text: (error as Error).message }); } };
  useEffect(() => {
    let live = true;
    fetchState().then((body) => { if (live) apply(body); }, (error: Error) => { if (live) setMessage({ tone: "error", text: error.message }); });
    return () => { live = false; };
  }, [apply]);

  async function save(next?: { enabled?: boolean }) {
    setBusy("save"); setMessage(null);
    const response = await fetch("/api/investigator", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ links: links.filter((link) => link.value.trim()), frequency, mode, enabled: next?.enabled ?? enabled, templateId: templateId || undefined, ownProfiles: own }) });
    const body = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) { setMessage({ tone: "error", text: body.error ?? "That didn’t save." }); return false; }
    if (next?.enabled !== undefined) setEnabled(next.enabled);
    setMessage({ tone: "ok", text: body.settings.enabled ? `Saved. Next check: ${date(body.settings.nextRunAt) || "within the hour"}.` : "Saved." });
    await load();
    return true;
  }

  async function runNow() {
    if (!(await save())) return;
    setBusy("run"); setMessage({ tone: "ok", text: "Checking your profiles. This usually takes a minute or two…" });
    const response = await fetch("/api/investigator/run", { method: "POST" });
    const body = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) { setMessage({ tone: "error", text: body.error ?? "The check didn’t finish." }); return; }
    setMessage(body.error ? { tone: "error", text: body.error } : { tone: "ok", text: body.found ? `Done: ${body.found} update${body.found === 1 ? "" : "s"} found${body.applied ? `, ${body.applied} added to your site` : ". Review them in the editor’s AI tab"}.` : "Done: nothing new this time. We’ll keep watching." });
    await load();
  }

  async function undo(run: RunView) {
    if (!window.confirm("Put your portfolio back as it was before this check?")) return;
    const response = await fetch(`/api/investigator/runs/${run.id}/undo`, { method: "POST" });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? { tone: "ok", text: "Undone. Those updates are back in your list to review." } : { tone: "error", text: body.error ?? "That couldn’t be undone." });
    await load();
  }

  if (!state) return <p className="mt-10 flex items-center gap-2 text-ink-soft">{message ? message.text : <><Loader2 size={16} className="animate-spin" /> Loading…</>}</p>;
  const { access } = state;
  const canUse = access.scheduled || access.trialRunAvailable;
  const kind = (id: LinkKind) => state.kinds.find((item) => item.id === id)!;
  const limited = links.some((link) => kind(link.kind)?.limited && link.value.trim());

  return <div className="mt-10 space-y-6">
    {!access.scheduled && <div className={`${card} ${access.trialRunAvailable ? "border-signal/40" : "border-amber-300 bg-amber-50"}`}>
      {access.trialRunAvailable
        ? <p className="text-[0.98rem] text-ink"><b className="font-medium">Your free trial includes one check.</b> Add your profiles below and press <b className="font-medium">Check now</b> to see what the Investigator finds. Regular checks come with Pro and Premium.</p>
        : <p className="text-[0.98rem] text-amber-950">{access.reason} <Link href="/pricing" className="font-medium underline">See plans</Link></p>}
    </div>}

    {message && <p role={message.tone === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-[0.95rem] ${message.tone === "error" ? "bg-red-50 text-red-900" : "bg-emerald-50 text-emerald-950"}`}>{message.text}</p>}

    <section className={card} aria-labelledby="profiles">
      <h2 id="profiles" className="font-display text-[1.6rem] text-ink">Your profiles</h2>
      <p className="mt-1 text-[0.95rem] text-ink-soft">Add your own public profiles. The Investigator reads them, searches the web around them, and spots professional news: a new job, a talk, an award, an article.</p>
      <ul className="mt-5 space-y-3">{links.map((link, index) => <li key={index} className="grid gap-2 sm:grid-cols-[14rem_minmax(0,1fr)_auto]">
        <select aria-label="Profile type" value={link.kind} onChange={(event) => setLinks(links.map((item, i) => (i === index ? { ...item, kind: event.target.value as LinkKind } : item)))} className="rounded-lg border border-rule bg-paper px-3 py-2.5 text-[0.95rem] outline-none focus:border-ink">
          {state.kinds.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <input aria-label={`${kind(link.kind)?.label} link or username`} value={link.value} placeholder={kind(link.kind)?.placeholder} onChange={(event) => setLinks(links.map((item, i) => (i === index ? { ...item, value: event.target.value } : item)))} className="min-w-0 rounded-lg border border-rule bg-paper px-3 py-2.5 text-[0.95rem] outline-none focus:border-ink" />
        <button type="button" onClick={() => setLinks(links.filter((_, i) => i !== index))} aria-label="Remove" className="justify-self-start rounded-lg p-2.5 text-ink-faint hover:bg-red-50 hover:text-red-700"><Trash2 size={16} /></button>
      </li>)}</ul>
      {links.length < 12 && <button type="button" onClick={() => setLinks([...links, { kind: "website", value: "" }])} className="mt-3 inline-flex items-center gap-1.5 text-[0.92rem] text-ink underline underline-offset-4"><Plus size={15} /> Add a profile</button>}
      {limited && <p className="mt-4 rounded-lg bg-ink/[0.04] px-3 py-2 text-[0.88rem] text-ink-soft">LinkedIn, Instagram, Facebook, X and TikTok show very little to visitors who aren’t logged in, and we never log in as you. Those links still help the Investigator be sure it has found <i>you</i>, and anything public is used. For LinkedIn job changes, you can also upload your LinkedIn export in the editor.</p>}
      <label className="mt-5 flex items-start gap-2.5 text-[0.95rem] text-ink"><input type="checkbox" checked={own} onChange={(event) => setOwn(event.target.checked)} className="mt-1 size-4" /><span>These are my own profiles, and I’m happy for the Investigator to read their public pages and search for my professional news.</span></label>
    </section>

    <section className={card} aria-labelledby="often">
      <h2 id="often" className="font-display text-[1.6rem] text-ink">How often</h2>
      <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="How often to check">{state.frequencies.map((option) => {
        const allowed = access.frequencies.includes(option.id);
        return <button key={option.id} type="button" role="radio" aria-checked={frequency === option.id} disabled={!allowed} onClick={() => setFrequency(option.id)} title={allowed ? undefined : "Included in Premium"} className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[0.92rem] transition ${frequency === option.id && allowed ? "border-ink bg-ink text-paper" : "border-rule text-ink-soft hover:border-ink"} disabled:cursor-not-allowed disabled:opacity-50`}>{!allowed && <Lock size={12} />}{option.label}</button>;
      })}</div>
      {access.scheduled && !access.frequencies.includes("daily") && <p className="mt-3 text-[0.88rem] text-ink-soft">Weekly and daily checks come with <Link href="/pricing" className="underline">Premium</Link>.</p>}
      <p className="mt-3 text-[0.88rem] text-ink-faint">Each check uses a few AI credits from your plan’s monthly allowance (or your own Claude key).</p>
    </section>

    <section className={card} aria-labelledby="changes">
      <h2 id="changes" className="font-display text-[1.6rem] text-ink">When something changes</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="What happens to updates">
        {([["ask", "Ask me first", "Updates wait in the editor’s AI tab. We email you; nothing changes on your site until you add them."], ["auto", "Update my website automatically", "Updates we’re sure about go straight onto your site (and live, if it’s published). We email you what changed, and you can undo it for 30 days. Anything we’re less sure about still waits for you."]] as const).map(([id, title, text]) => <button key={id} type="button" role="radio" aria-checked={mode === id} onClick={() => setMode(id)} className={`rounded-xl border p-4 text-left transition ${mode === id ? "border-ink bg-paper shadow-[inset_0_0_0_1px_var(--color-ink,#15140f)]" : "border-rule hover:border-ink/50"}`}>
          <span className="block font-medium text-ink">{title}</span><span className="mt-1 block text-[0.88rem] leading-relaxed text-ink-soft">{text}</span>
        </button>)}
      </div>
      {state.portfolios.length > 1 && <label className="mt-5 block text-[0.95rem] text-ink">Keep this portfolio up to date
        <select value={templateId} onChange={(event) => setTemplateId(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-rule bg-paper px-3 py-2.5 outline-none focus:border-ink sm:w-96">{state.portfolios.map((portfolio) => <option key={portfolio.templateId} value={portfolio.templateId}>{portfolio.label}</option>)}</select></label>}
      {state.portfolios.length === 0 && <p className="mt-5 text-[0.92rem] text-amber-900">Make your portfolio first: <Link href="/templatechooser" className="underline">choose a design</Link>.</p>}
    </section>

    <div className="flex flex-wrap items-center gap-3">
      {access.scheduled && <button type="button" role="switch" aria-checked={enabled} onClick={() => void save({ enabled: !enabled })} disabled={busy !== null} className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-[0.95rem] font-medium transition disabled:opacity-60 ${enabled ? "bg-emerald-700 text-white" : "border border-ink text-ink"}`}><span className={`size-2.5 rounded-full ${enabled ? "bg-white" : "bg-ink/30"}`} />{enabled ? "Investigator is on" : "Switch the Investigator on"}</button>}
      <button type="button" onClick={() => void save()} disabled={busy !== null || !canUse} className="rounded-full border border-rule px-5 py-3 text-[0.95rem] hover:border-ink disabled:opacity-50">{busy === "save" ? "Saving…" : "Save"}</button>
      <button type="button" onClick={() => void runNow()} disabled={busy !== null || !canUse || state.portfolios.length === 0} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[0.95rem] font-medium text-paper hover:bg-signal hover:text-signal-ink disabled:opacity-50">{busy === "run" ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}{busy === "run" ? "Checking…" : "Check now"}</button>
      {state.settings.enabled && state.settings.nextRunAt && <span className="text-[0.9rem] text-ink-soft">Next check {date(state.settings.nextRunAt)}</span>}
    </div>

    <section aria-labelledby="history" className="pt-6">
      <h2 id="history" className="font-display text-[1.6rem] text-ink">What it found</h2>
      {state.runs.length === 0 ? <p className="mt-3 text-ink-soft">No checks yet.</p>
        : <ul className="mt-4 space-y-4">{state.runs.map((run) => <li key={run.id} className={card}>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="font-medium text-ink">{date(run.startedAt)} <span className="font-normal text-ink-soft">· {run.trigger === "manual" ? "checked by you" : "scheduled check"}</span></p>
            <p className="text-[0.9rem] text-ink-soft">{run.status === "failed" ? <span className="text-red-800">{run.error}</span> : run.found ? `${run.found} found${run.applied ? `, ${run.applied} added to your site` : ""}` : "Nothing new"}{run.undoneAt && " · undone"}</p>
          </div>
          {run.changes.length > 0 && <ul className="mt-3 space-y-1.5 text-[0.95rem]">{run.changes.map((change, index) => <li key={index} className="flex items-start gap-2"><span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[0.72rem] ${change.status === "applied" ? "bg-emerald-100 text-emerald-900" : change.status === "dismissed" ? "bg-ink/5 text-ink-faint" : "bg-amber-100 text-amber-900"}`}>{change.status === "applied" ? "On your site" : change.status === "dismissed" ? "Dismissed" : "Waiting for you"}</span><span className="text-ink">{change.title}</span></li>)}</ul>}
          {run.sources.length > 0 && <details className="mt-3 text-[0.88rem]"><summary className="cursor-pointer text-ink-soft">Sources checked ({run.sources.length})</summary>
            <ul className="mt-2 space-y-1">{run.sources.map((source, index) => <li key={index} className="flex items-start gap-2">{STATUS_ICON[source.status]}<span><span className="text-ink">{source.label}</span> <span className="text-ink-faint">— {STATUS_TEXT[source.status]}{source.note ? `: ${source.note}` : ""}</span></span></li>)}</ul></details>}
          <div className="mt-3 flex flex-wrap gap-3 text-[0.9rem]">
            {run.changes.some((change) => change.status === "pending") && <Link href={`/editor/${state.settings.templateId ?? state.portfolios[0]?.templateId ?? ""}`} className="underline">Review in the editor</Link>}
            {run.canUndo && <button type="button" onClick={() => void undo(run)} className="inline-flex items-center gap-1 underline"><Undo2 size={14} /> Undo these changes</button>}
          </div>
        </li>)}</ul>}
    </section>
  </div>;
}

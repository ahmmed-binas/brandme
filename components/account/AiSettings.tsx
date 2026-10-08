"use client";

import { useState } from "react";
import { Check, ExternalLink, KeyRound, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { cardFeeCents } from "@/lib/plans";

export interface AiBilling {
  credits: number;
  ownKey: { provider: "anthropic" | "openai"; hint: string; model: string | null; savedAt: string | null } | null;
  platformAi: boolean;
  packs: Array<{ id: string; credits: number; cents: number; label: string }>;
  history: Array<{ delta: number; balance: number; reason: string; at: string }>;
}

type Choice = "credits" | "anthropic" | "openai";

const PROVIDERS = {
  anthropic: {
    name: "Claude", company: "Anthropic", placeholder: "sk-ant-…", console: "https://console.anthropic.com/settings/keys", consoleLabel: "console.anthropic.com",
    steps: ["Sign in at console.anthropic.com and add a payment method under Billing.", "Open API keys and choose Create key. Name it “Formora”.", "Copy the key (it starts with sk-ant-) and paste it below."],
    note: null as string | null,
  },
  openai: {
    name: "OpenAI", company: "OpenAI", placeholder: "sk-proj-…", console: "https://platform.openai.com/api-keys", consoleLabel: "platform.openai.com",
    steps: ["Sign in at platform.openai.com (the same login as ChatGPT) and add credit under Billing.", "Open API keys and choose Create new secret key. Name it “Formora”.", "Copy the key (it starts with sk-) and paste it below."],
    note: "For ChatGPT and Codex users. A ChatGPT Plus, Pro or Codex subscription doesn’t include API access: OpenAI bills API use separately, from the credit you add on the platform. We use the newest GPT model your key can reach.",
  },
} as const;

const usd = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const json = async (url: string, init?: RequestInit) => { const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error ?? "Something went wrong."); return body; };

/** How the owner pays for AI: Formora credits, or their own Claude or OpenAI key. */
export function AiSettings({ ai, payments, reload }: { ai: AiBilling; payments: boolean; reload: () => void }) {
  const active: Choice | null = ai.ownKey?.provider ?? (ai.platformAi ? "credits" : null);
  const [choice, setChoice] = useState<Choice>(active ?? "openai");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const run = async (name: string, action: () => Promise<void>) => { setBusy(name); setMessage(null); try { await action(); } catch (error) { setMessage({ tone: "error", text: (error as Error).message }); } finally { setBusy(null); } };
  const buy = (pack: string) => run(pack, async () => { const body = await json("/api/billing/checkout", { method: "POST", body: JSON.stringify({ credits: pack }) }); window.location.assign(body.url); });
  const save = (provider: "anthropic" | "openai") => run("key", async () => {
    const body = await json("/api/account/ai-key", { method: "PUT", body: JSON.stringify({ provider, key: key.trim() }) });
    setKey("");
    setMessage({ tone: "ok", text: `Key checked with ${PROVIDERS[provider].company} and saved. AI now runs on your ${PROVIDERS[provider].name} account${body.model ? ` (${body.model})` : ""}.` });
    reload();
  });
  const remove = () => run("remove", async () => { await json("/api/account/ai-key", { method: "DELETE" }); setChoice("credits"); setMessage({ tone: "ok", text: "Key removed and deleted from our database. AI uses your credits again." }); reload(); });
  const option = (id: Choice, title: string, detail: string) => <button key={id} type="button" role="radio" aria-checked={choice === id} onClick={() => { setChoice(id); setKey(""); setMessage(null); }}
    className={`relative rounded-2xl border p-4 text-left transition-colors ${choice === id ? "border-ink bg-white shadow-[0_1px_0_0_var(--ink)]" : "border-rule bg-white/40 hover:border-ink/50"}`}>
    <span className="flex items-center justify-between gap-2 font-medium">{title}{active === id && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[0.72rem] font-medium text-emerald-900"><Check size={11} /> In use</span>}</span>
    <span className="mt-1 block text-[0.84rem] leading-snug text-ink-soft">{detail}</span>
  </button>;
  const provider = choice === "credits" ? null : PROVIDERS[choice];

  return <section className="mt-12">
    <div id="ai" className="flex scroll-mt-24 flex-wrap items-end justify-between gap-3 border-t border-rule pt-10"><h2 className="font-display text-[1.7rem] leading-none tracking-[-0.02em]">AI help</h2></div>
    <p className="mt-4 max-w-[42rem] text-[0.98rem] leading-relaxed text-ink-soft">The assistant, imports and the Investigator are paid for separately from your plan, at the same price on every plan. Use Formora credits, or connect your own Claude or OpenAI account and pay them directly.</p>

    <p className="mt-6 flex flex-wrap items-center gap-2 rounded-xl bg-ink px-4 py-3 text-[0.92rem] text-paper">
      <Sparkles size={15} className="shrink-0" />
      {ai.ownKey ? <>AI runs on <b className="font-medium">your {PROVIDERS[ai.ownKey.provider].name} key</b><span className="font-mono text-[0.85rem] text-paper/70">{ai.ownKey.hint}</span>{ai.ownKey.model && <span className="text-paper/70">· {ai.ownKey.model}</span>}{ai.ownKey.savedAt && <span className="text-paper/70">· added {date(ai.ownKey.savedAt)}</span>}</>
        : ai.platformAi ? <>AI runs on <b className="font-medium">Formora credits</b><span className="text-paper/70">· {ai.credits.toLocaleString("en")} left</span></>
        : <>AI isn’t switched on yet. Connect your own Claude or OpenAI key to use it.</>}
    </p>

    <div role="radiogroup" aria-label="How AI is paid for" className="mt-5 grid gap-3 md:grid-cols-3">
      {option("credits", "Formora credits", "Pay as you go. Sold at what the AI costs us plus 5%. Nothing to set up.")}
      {option("anthropic", "Your Claude key", "Use your Anthropic account. No credits used.")}
      {option("openai", "Your OpenAI key", "For ChatGPT and Codex users. No credits used.")}
    </div>

    <div className="mt-4 rounded-2xl border border-rule bg-white/60 p-5 md:p-6">
      {choice === "credits" && <>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-[0.85rem] text-ink-soft">Credits</p><p className="font-display text-[3rem] leading-none">{ai.credits.toLocaleString("en")}</p></div>
          <p className="max-w-[22rem] text-[0.85rem] text-ink-faint">A rewrite costs about 3–7 credits; an Investigator check about 20–60. Your first Investigator check is free.</p>
        </div>
        {!ai.platformAi && <p className="mt-3 text-[0.88rem] text-ink-soft">Credits aren’t switched on for this site yet. Connect your own key instead.</p>}
        {ai.ownKey && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[0.88rem] text-amber-900">While a key is connected, credits aren’t used. <button type="button" disabled={busy !== null} onClick={() => void remove()} className="underline">Remove the key</button> to go back to credits.</p>}
        {payments && ai.platformAi && <div className="mt-5 flex flex-wrap gap-2">{ai.packs.map((pack) => <button key={pack.id} type="button" disabled={busy !== null} onClick={() => void buy(pack.id)} className="inline-flex items-center gap-1.5 rounded-full border border-ink/30 px-3 py-1.5 text-[0.88rem] hover:border-ink disabled:opacity-50">{busy === pack.id && <Loader2 size={13} className="animate-spin" />}{pack.label} · {usd(pack.cents)} + {usd(cardFeeCents(pack.cents))} card fee</button>)}</div>}
        {payments && ai.platformAi && <p className="mt-2 text-[0.8rem] text-ink-faint">Credits never expire. Unused credits can be refunded, minus the card fee, which Stripe keeps.</p>}
        {ai.history.length > 0 && <details className="mt-4 text-[0.85rem]"><summary className="cursor-pointer text-ink-soft">Recent use</summary><ul className="mt-2 space-y-1">{ai.history.map((entry, index) => <li key={index} className="flex justify-between gap-3"><span>{entry.reason}<span className="ml-2 text-ink-faint">{date(entry.at)}</span></span><span className={entry.delta > 0 ? "text-emerald-800" : ""}>{entry.delta > 0 ? "+" : ""}{entry.delta}</span></li>)}</ul></details>}
      </>}

      {provider && choice !== "credits" && (ai.ownKey?.provider === choice ? <div>
        <p className="flex items-center gap-2 font-medium"><KeyRound size={15} /> Your {provider.name} key is connected</p>
        <p className="mt-2 font-mono text-[0.95rem]">{ai.ownKey.hint}{ai.ownKey.model && <span className="ml-2 font-sans text-[0.85rem] text-ink-soft">using {ai.ownKey.model}</span>}</p>
        <p className="mt-1 text-[0.88rem] text-ink-soft">Everything AI does for you is billed by {provider.company}. Set a monthly spending limit there if you’d like one.</p>
        <div className="mt-4 flex flex-wrap gap-3 text-[0.88rem]">
          <a href={provider.console} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">Usage and limits at {provider.consoleLabel} <ExternalLink size={12} /></a>
          <button type="button" disabled={busy !== null} onClick={() => void remove()} className="inline-flex items-center gap-1 text-[color:var(--destructive)] underline">{busy === "remove" && <Loader2 size={12} className="animate-spin" />}Remove key</button>
        </div>
        <p className="mt-3 text-[0.82rem] text-ink-faint">To use a different key, paste it after removing this one.</p>
      </div> : <div>
        {ai.ownKey && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-[0.88rem] text-amber-900">Saving this replaces your {PROVIDERS[ai.ownKey.provider].name} key ({ai.ownKey.hint}). You can only use one key at a time.</p>}
        {provider.note && <p className="mb-4 rounded-lg bg-[color-mix(in_oklab,var(--ink)_5%,transparent)] px-3 py-2.5 text-[0.88rem] leading-relaxed text-ink-soft">{provider.note}</p>}
        <ol className="space-y-2 text-[0.92rem]">{provider.steps.map((step, index) => <li key={index} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-[0.75rem] text-paper">{index + 1}</span><span className="pt-0.5">{index === 0 ? <>{step.split(provider.consoleLabel)[0]}<a href={provider.console} target="_blank" rel="noreferrer" className="underline">{provider.consoleLabel}</a>{step.split(provider.consoleLabel)[1]}</> : step}</span></li>)}</ol>
        <form className="mt-5 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); void save(choice); }}>
          <label className="sr-only" htmlFor="ai-key">{provider.name} API key</label>
          <input id="ai-key" value={key} onChange={(event) => setKey(event.target.value)} type="password" autoComplete="off" spellCheck={false} placeholder={provider.placeholder} className="min-w-0 flex-1 rounded-lg border border-rule bg-white px-3 py-2.5 font-mono text-[0.88rem] outline-none focus:border-ink" />
          <button disabled={!key.trim() || busy !== null} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-[0.9rem] text-paper disabled:opacity-40">{busy === "key" ? <><Loader2 size={14} className="animate-spin" /> Checking with {provider.company}…</> : "Check and save"}</button>
        </form>
        <ul className="mt-4 grid gap-1.5 text-[0.84rem] text-ink-soft md:grid-cols-2">
          <li className="flex gap-2"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-700" />Checked with {provider.company} before it’s saved.</li>
          <li className="flex gap-2"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-700" />Encrypted (AES-256-GCM) and never shown again, even to you.</li>
          <li className="flex gap-2"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-700" />Used only for AI requests you or your Investigator make.</li>
          <li className="flex gap-2"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-700" />Remove it here, or revoke it at {provider.consoleLabel}, any time.</li>
        </ul>
      </div>)}
    </div>
    {message && <p role={message.tone === "error" ? "alert" : "status"} className={`mt-3 text-[0.92rem] ${message.tone === "error" ? "text-[color:var(--destructive)]" : "text-emerald-800"}`}>{message.text}</p>}
  </section>;
}

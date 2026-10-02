"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Globe, KeyRound, Loader2, LogOut, PencilLine } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import GoogleSignInButton from "@/components/common/GoogleSignInButton";
import { getTemplate } from "@/lib/templates/catalog";
import type { TemplateId } from "@/lib/templates/types";

interface AccountPortfolio { templateId: TemplateId; name: string; slug: string | null; publishedAt: string | null; updatedAt: string; hasUnpublishedChanges: boolean }
interface Billing {
  plan: { id: string; name: string; standing: "trial" | "active" | "grace" | "paused"; daysLeft: number; endsAt: string; autoRenew: boolean; hasCard: boolean };
  ai: { credits: number; keyHint: string | null; platformAi: boolean; packs: Array<{ id: string; credits: number; cents: number; label: string }>; history: Array<{ delta: number; balance: number; reason: string; at: string }> };
  emailsOptOut: boolean;
  payments: boolean;
  orders: Array<{ id: string; kind: string; plan: string | null; term_years: number | null; credits: number | null; amount_cents: number; status: string; created_at: string }>;
}

const usd = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const json = async (url: string, init?: RequestInit) => { const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error ?? "Something went wrong."); return body; };

function Heading({ id, title, children }: { id: string; title: string; children?: React.ReactNode }) {
  return <div id={id} className="flex scroll-mt-24 flex-wrap items-end justify-between gap-3 border-t border-rule pt-10"><h2 className="font-display text-[1.7rem] leading-none tracking-[-0.02em]">{title}</h2>{children}</div>;
}

function Plan({ billing, reload }: { billing: Billing; reload: () => void }) {
  const { plan } = billing;
  const [busy, setBusy] = useState(false);
  const line = {
    trial: `Free trial, ${plan.daysLeft} day${plan.daysLeft === 1 ? "" : "s"} left. Everything in Pro is switched on.`,
    active: `${plan.name} plan until ${date(plan.endsAt)}.`,
    grace: `Your ${plan.id === "trial" ? "trial" : `${plan.name} plan`} has ended. Your site stays online for ${plan.daysLeft} more day${plan.daysLeft === 1 ? "" : "s"}.`,
    paused: "Your site is resting. Choose a plan to bring it back; everything is saved.",
  }[plan.standing];
  return <section className="mt-10">
    <Heading id="plan" title="Plan"><Link href="/pricing" className="rounded-full bg-ink px-4 py-2 text-[0.9rem] text-paper hover:bg-signal">{plan.id === "trial" || plan.standing !== "active" ? "Choose a plan" : "Change plan"}</Link></Heading>
    <p className="mt-4 text-[1.05rem]">{line}</p>
    {plan.id !== "trial" && plan.hasCard && <label className="mt-4 flex items-start gap-3 text-[0.95rem] text-ink-soft">
      <input type="checkbox" checked={plan.autoRenew} disabled={busy} onChange={async (event) => { setBusy(true); await json("/api/account/settings", { method: "PUT", body: JSON.stringify({ autoRenew: event.target.checked }) }).catch(() => undefined); setBusy(false); reload(); }} className="mt-1" />
      <span>Renew automatically for one year at a time with the card you used. We email you two weeks before.</span>
    </label>}
    {billing.orders.length > 0 && <details className="mt-5 text-[0.92rem]"><summary className="cursor-pointer text-ink-soft">Payment history</summary>
      <ul className="mt-3 divide-y divide-rule rounded-xl border border-rule">{billing.orders.map((order) => <li key={order.id} className="flex justify-between gap-4 px-4 py-2.5"><span>{order.kind === "credits" ? `${order.credits?.toLocaleString("en")} credits` : `${order.plan?.[0]?.toUpperCase()}${order.plan?.slice(1)} ${order.kind === "renewal" ? "renewal" : `· ${order.term_years} yr`}`}<span className="ml-2 text-ink-faint">{date(order.created_at)}</span></span><span className={order.status === "paid" ? "" : "text-[color:var(--destructive)]"}>{usd(order.amount_cents)}{order.status !== "paid" && ` · ${order.status}`}</span></li>)}</ul></details>}
  </section>;
}

function Portfolios() {
  const [items, setItems] = useState<AccountPortfolio[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/portfolios").then(async (response) => { const body = await response.json().catch(() => ({})); if (cancelled) return; if (response.ok) setItems(body.portfolios); else setError(body.error ?? "Your portfolios could not be loaded."); }).catch(() => { if (!cancelled) setError("Your portfolios could not be loaded."); });
    return () => { cancelled = true; };
  }, []);
  return <section className="mt-12">
    <Heading id="portfolios" title="Portfolios"><Link href="/templatechooser" className="text-[0.92rem] underline underline-offset-4">New portfolio</Link></Heading>
    {error ? <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{error}</p> : !items ? <p className="mt-5 text-sm text-ink-soft">Loading…</p>
      : items.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-rule p-6 text-[0.95rem] text-ink-soft">Nothing saved yet. <Link href="/templatechooser" className="text-ink underline">Choose a template</Link> and it saves here as you edit.</p>
      : <ul className="mt-5 divide-y divide-rule rounded-xl border border-rule">{items.map((item) => <li key={item.templateId} className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0"><p className="truncate font-medium">{item.name || "Untitled portfolio"}</p><p className="text-[0.82rem] text-ink-soft">{getTemplate(item.templateId)?.name ?? item.templateId} · edited {date(item.updatedAt)}</p>
          {item.publishedAt && item.slug ? <p className="mt-1 flex items-center gap-1 text-[0.82rem] text-emerald-800"><Globe size={12} /> Live at /p/{item.slug}{item.hasUnpublishedChanges && <span className="text-amber-800"> · unpublished changes</span>}</p> : <p className="mt-1 text-[0.82rem] text-ink-faint">Not published</p>}</div>
        <div className="flex gap-2">{item.publishedAt && item.slug && <a href={`/p/${item.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-rule px-3 py-1.5 text-[0.88rem] hover:border-ink"><ExternalLink size={13} /> View</a>}
          <Link href={`/editor/${item.templateId}`} className="inline-flex items-center gap-1 rounded-full bg-ink px-4 py-1.5 text-[0.88rem] text-paper"><PencilLine size={13} /> Edit</Link></div>
      </li>)}</ul>}
  </section>;
}

function Ai({ billing, reload }: { billing: Billing; reload: () => void }) {
  const { ai } = billing;
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const run = async (name: string, action: () => Promise<void>) => { setBusy(name); setMessage(null); try { await action(); } catch (error) { setMessage({ tone: "error", text: (error as Error).message }); } finally { setBusy(null); } };
  const buy = (pack: string) => run(pack, async () => { const body = await json("/api/billing/checkout", { method: "POST", body: JSON.stringify({ credits: pack }) }); window.location.assign(body.url); });
  return <section className="mt-12">
    <Heading id="ai" title="AI help" />
    <p className="mt-4 max-w-[40rem] text-[0.98rem] leading-relaxed text-ink-soft">The AI assistant, imports and career research are paid separately from your plan, so you only pay for what you use. Buy credits, or connect your own Claude API key and pay Anthropic directly.</p>
    <div className="mt-6 grid gap-5 md:grid-cols-2">
      <div className="rounded-2xl border border-rule bg-white/50 p-5">
        <p className="text-[0.85rem] text-ink-soft">Credits</p>
        <p className="font-display text-[3rem] leading-none">{ai.credits.toLocaleString("en")}</p>
        <p className="mt-2 text-[0.85rem] text-ink-faint">A rewrite costs about 5–10 credits; a full career search about 30–60.{!ai.platformAi && " (Credits aren’t switched on for this site yet.)"}</p>
        {billing.payments && ai.platformAi && <div className="mt-4 flex flex-wrap gap-2">{ai.packs.map((pack) => <button key={pack.id} type="button" disabled={busy !== null} onClick={() => void buy(pack.id)} className="inline-flex items-center gap-1.5 rounded-full border border-ink/30 px-3 py-1.5 text-[0.88rem] hover:border-ink disabled:opacity-50">{busy === pack.id && <Loader2 size={13} className="animate-spin" />}{pack.label} · {usd(pack.cents)}</button>)}</div>}
        {ai.history.length > 0 && <details className="mt-4 text-[0.85rem]"><summary className="cursor-pointer text-ink-soft">Recent use</summary><ul className="mt-2 space-y-1">{ai.history.map((entry, index) => <li key={index} className="flex justify-between gap-3"><span>{entry.reason}<span className="ml-2 text-ink-faint">{date(entry.at)}</span></span><span className={entry.delta > 0 ? "text-emerald-800" : ""}>{entry.delta > 0 ? "+" : ""}{entry.delta}</span></li>)}</ul></details>}
      </div>
      <div className="rounded-2xl border border-rule bg-white/50 p-5">
        <p className="flex items-center gap-2 text-[0.85rem] text-ink-soft"><KeyRound size={14} /> Your own Claude API key</p>
        {ai.keyHint ? <>
          <p className="mt-2 font-mono text-[0.95rem]">{ai.keyHint}</p><p className="mt-1 text-[0.85rem] text-ink-faint">AI runs on your Anthropic account. No credits are used.</p>
          <button type="button" disabled={busy !== null} onClick={() => void run("remove", async () => { await json("/api/account/ai-key", { method: "DELETE" }); reload(); })} className="mt-4 text-[0.88rem] underline">Remove key</button>
        </> : <>
          <p className="mt-2 text-[0.85rem] leading-relaxed text-ink-faint">Create one at console.anthropic.com → API keys. It’s checked, encrypted, and never shown again.</p>
          <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); void run("key", async () => { await json("/api/account/ai-key", { method: "PUT", body: JSON.stringify({ key }) }); setKey(""); setMessage({ tone: "ok", text: "Key saved. AI now runs on your account." }); reload(); }); }}>
            <input value={key} onChange={(event) => setKey(event.target.value)} type="password" autoComplete="off" placeholder="sk-ant-…" aria-label="Claude API key" className="min-w-0 flex-1 rounded-lg border border-rule bg-white px-3 py-2 font-mono text-[0.88rem] outline-none focus:border-ink" />
            <button disabled={!key.trim() || busy !== null} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 text-[0.88rem] text-paper disabled:opacity-40">{busy === "key" && <Loader2 size={13} className="animate-spin" />}Save</button>
          </form>
        </>}
      </div>
    </div>
    {message && <p role={message.tone === "error" ? "alert" : "status"} className={`mt-3 text-[0.92rem] ${message.tone === "error" ? "text-[color:var(--destructive)]" : "text-emerald-800"}`}>{message.text}</p>}
  </section>;
}

function Emails({ billing, reload }: { billing: Billing; reload: () => void }) {
  return <section className="mt-12">
    <Heading id="emails" title="Emails" />
    <label className="mt-4 flex items-start gap-3 text-[0.95rem] text-ink-soft"><input type="checkbox" checked={!billing.emailsOptOut} onChange={async (event) => { await json("/api/account/settings", { method: "PUT", body: JSON.stringify({ emailsOptOut: !event.target.checked }) }).catch(() => undefined); reload(); }} className="mt-1" />
      <span>Send me reminders about my trial and plan, and a weekly note when there are updates for my portfolio. Receipts are always sent.</span></label>
  </section>;
}

function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remove = async () => {
    setBusy(true); setError(null);
    const response = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: typed }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setError(body.error ?? "Your account could not be deleted."); setBusy(false); return; }
    await signOut({ callbackUrl: "/" });
  };
  return <section className="mt-12">
    <Heading id="delete" title="Delete account" />
    <p className="mt-4 text-[0.92rem] text-ink-soft">Removes your profile, every portfolio (published pages go offline), images, domain connections and community posts. This can’t be undone. Domains you bought stay registered in your name; unused credits and prepaid time are not refunded automatically, so <Link href="/community/support" className="underline">ask us</Link> first if that matters.</p>
    {!open ? <button onClick={() => setOpen(true)} className="mt-3 rounded-full border border-[color:var(--destructive)]/40 px-4 py-2 text-[0.88rem] text-[color:var(--destructive)]">Delete my account…</button>
      : <div className="mt-3 flex flex-wrap items-center gap-2">
        <input value={typed} onChange={(event) => setTyped(event.target.value)} placeholder="Type DELETE" aria-label="Type DELETE to confirm" className="rounded-lg border border-rule bg-transparent px-3 py-2 text-sm" />
        <button disabled={typed !== "DELETE" || busy} onClick={() => void remove()} className="rounded-full bg-[color:var(--destructive)] px-4 py-2 text-sm text-white disabled:opacity-40">{busy ? "Deleting…" : "Permanently delete"}</button>
        <button onClick={() => { setOpen(false); setTyped(""); }} className="px-2 text-sm text-ink-soft">Cancel</button>
        {error && <p className="w-full text-sm text-[color:var(--destructive)]">{error}</p>}
      </div>}
  </section>;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [billing, setBilling] = useState<Billing | null>(null);
  // Returning from Stripe: ?paid=plan or ?paid=credits.
  const [paid] = useState<string | null>(() => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("paid")));
  const load = useCallback(() => { fetch("/api/account/billing").then((response) => response.ok ? response.json() : null).then(setBilling).catch(() => undefined); }, []);
  useEffect(() => { if (status === "authenticated") load(); }, [status, load]);
  useEffect(() => {
    if (!paid) return;
    // The webhook usually lands within seconds; refresh once more to pick it up.
    const timer = window.setTimeout(load, 3000);
    return () => window.clearTimeout(timer);
  }, [paid, load]);

  if (status === "loading") return <main className="px-5 py-16"><p className="mx-auto max-w-3xl text-ink-soft">Loading your account…</p></main>;
  if (!session?.user) return <main className="px-5 py-16"><div className="mx-auto max-w-md rounded-2xl border border-rule bg-card p-8"><h1 className="font-display text-[2.2rem] leading-[1.05] tracking-[-0.02em]">Sign in to your account</h1><p className="mt-3 text-ink-soft">Use Google to continue.</p><div className="mt-6"><GoogleSignInButton /></div></div></main>;
  return <main className="px-5 pb-24 pt-14">
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Account</p><h1 className="mt-2 font-display text-[clamp(2.2rem,5vw,3.2rem)] leading-none tracking-[-0.02em]">{session.user.name || "Your account"}</h1><p className="mt-2 text-ink-soft">{session.user.email}</p></div>
        <button onClick={() => void signOut({ callbackUrl: "/" })} className="inline-flex items-center gap-2 rounded-full border border-rule px-4 py-2 text-[0.9rem] hover:border-ink"><LogOut size={15} /> Sign out</button>
      </div>
      {paid && <p role="status" className="mt-8 rounded-xl bg-emerald-50 px-4 py-3 text-[0.95rem] text-emerald-950">Thank you, your payment went through. {paid === "credits" ? "Your credits are on their way." : "Your plan is active."} A receipt is in your inbox.</p>}
      {billing ? <Plan billing={billing} reload={load} /> : <p className="mt-10 text-sm text-ink-soft">Loading your plan…</p>}
      <Portfolios />
      {billing && <Ai billing={billing} reload={load} />}
      <section className="mt-12"><Heading id="updates" title="Automatic updates" /><p className="mt-4 text-[0.95rem] text-ink-soft">New GitHub projects, talks, awards and roles we find for you appear in the editor under the <b className="font-medium text-ink">AI</b> tab, ready to add with one click. Nothing changes on your site until you add it.</p></section>
      {billing && <Emails billing={billing} reload={load} />}
      <section className="mt-12"><Heading id="domains" title="Domains" /><p className="mt-4 text-[0.95rem] text-ink-soft">See when the domains you bought here expire, and renew them. <Link href="/account/domains" className="text-ink underline underline-offset-4">Your domains</Link></p></section>
      <section className="mt-12"><Heading id="help" title="Help" /><p className="mt-4 text-[0.95rem] text-ink-soft">Questions about billing, domains or anything else? <Link href="/community/support" className="text-ink underline underline-offset-4">Open a support request</Link>; a person replies, usually within a working day.</p></section>
      <DeleteAccount />
    </div>
  </main>;
}

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Check, Loader2 } from "lucide-react";

export interface PlanCard { id: "basic" | "pro" | "premium"; name: string; summary: string; yearlyCents: number; terms: number[]; prices: Record<number, number>; features: string[]; highlight?: boolean }

const usd = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
const TERMS = [1, 2, 5];

/** Term toggle and plan cards. Checkout opens Stripe; signed-out visitors sign in first and come back here. */
export default function PlanPicker({ plans, paymentsReady }: { plans: PlanCard[]; paymentsReady: boolean }) {
  const { status } = useSession();
  const [years, setYears] = useState(2);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = async (plan: PlanCard) => {
    if (status !== "authenticated") { window.location.assign(`/login?callbackUrl=${encodeURIComponent("/pricing")}`); return; }
    const term = plan.terms.includes(years) ? years : Math.max(...plan.terms.filter((value) => value <= years));
    setBusy(plan.id); setError(null);
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: plan.id, years: term }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "The payment page couldn’t be opened.");
      window.location.assign(body.url);
    } catch (caught) {
      setError((caught as Error).message);
      setBusy(null);
    }
  };

  return <>
    <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
      <div role="radiogroup" aria-label="Pay for" className="inline-flex rounded-full border border-rule p-1">{TERMS.map((term) => <button key={term} type="button" role="radio" aria-checked={years === term} onClick={() => setYears(term)} className={`rounded-full px-4 py-1.5 text-[0.92rem] transition-colors ${years === term ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}>{term} year{term > 1 ? "s" : ""}{term === 2 ? " · save 10%" : term === 5 ? " · save 25%" : ""}</button>)}</div>
    </div>
    <ul className="mt-10 grid gap-5 lg:grid-cols-3">{plans.map((plan) => {
      const term = plan.terms.includes(years) ? years : Math.max(...plan.terms.filter((value) => value <= years));
      const total = plan.prices[term]!;
      return <li key={plan.id} className={`relative flex flex-col rounded-2xl border p-7 ${plan.highlight ? "border-ink bg-ink text-paper" : "border-rule bg-white/50"}`}>
        {plan.highlight && <span className="absolute -top-3 left-7 rounded-full bg-signal px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-signal-ink">Most chosen</span>}
        <h2 className="font-display text-[2rem] leading-none">{plan.name}</h2>
        <p className={`mt-2 min-h-[3rem] text-[0.95rem] ${plan.highlight ? "text-paper/75" : "text-ink-soft"}`}>{plan.summary}</p>
        <p className="mt-6 flex items-baseline gap-2"><span className="font-display text-[3.4rem] leading-none tracking-[-0.03em]">{usd(Math.round(total / term))}</span><span className={plan.highlight ? "text-paper/70" : "text-ink-soft"}>a year</span></p>
        <p className={`mt-1 text-[0.88rem] ${plan.highlight ? "text-paper/70" : "text-ink-faint"}`}>{usd(total)} paid once for {term} year{term > 1 ? "s" : ""}{term !== years && ` (${plan.name} goes up to ${Math.max(...plan.terms)} years)`}</p>
        <button type="button" disabled={!paymentsReady || busy !== null} onClick={() => void choose(plan)} className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[0.95rem] font-medium transition-colors disabled:opacity-50 ${plan.highlight ? "bg-paper text-ink hover:bg-signal hover:text-signal-ink" : "bg-ink text-paper hover:bg-signal hover:text-signal-ink"}`}>{busy === plan.id && <Loader2 size={15} className="animate-spin" />}{paymentsReady ? `Choose ${plan.name}` : "Coming soon"}</button>
        <ul className="mt-7 space-y-2.5 text-[0.93rem]">{plan.features.map((feature) => <li key={feature} className="flex gap-2.5"><Check size={16} className={`mt-0.5 shrink-0 ${plan.highlight ? "text-signal" : "text-ink"}`} />{feature}</li>)}</ul>
      </li>;
    })}</ul>
    {error && <p role="alert" className="mt-4 text-center text-[0.95rem] text-[color:var(--destructive)]">{error}</p>}
  </>;
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Check, Loader2 } from "lucide-react";

export interface PlanCard { id: "basic" | "pro"; name: string; summary: string; prices: { year?: number; month?: number }; features: string[]; highlight?: boolean }

const usd = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;

/** Monthly/yearly toggle and the plan cards. Checkout opens Stripe; signed-out visitors sign in first and come back here. */
export default function PlanPicker({ plans, paymentsReady, bookingHref }: { plans: PlanCard[]; paymentsReady: boolean; bookingHref: string }) {
  const { status } = useSession();
  const [interval, setInterval] = useState<"year" | "month">("year");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = async (plan: PlanCard) => {
    if (status !== "authenticated") { window.location.assign(`/login?callbackUrl=${encodeURIComponent("/pricing")}`); return; }
    setBusy(plan.id); setError(null);
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: plan.id, interval }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "The payment page couldn’t be opened.");
      window.location.assign(body.url);
    } catch (caught) {
      setError((caught as Error).message);
      setBusy(null);
    }
  };

  const pro = plans.find((plan) => plan.id === "pro");
  const yearlySaving = pro?.prices.year && pro.prices.month ? Math.round((1 - pro.prices.year / (pro.prices.month * 12)) * 100) : 0;

  return <>
    <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
      <div role="radiogroup" aria-label="Pay for Pro" className="inline-flex rounded-full border border-rule p-1">{(["year", "month"] as const).map((option) => <button key={option} type="button" role="radio" aria-checked={interval === option} onClick={() => setInterval(option)} className={`rounded-full px-4 py-1.5 text-[0.92rem] transition-colors ${interval === option ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}>{option === "year" ? `Yearly${yearlySaving > 0 ? ` · save ${yearlySaving}%` : ""}` : "Monthly"}</button>)}</div>
    </div>
    <ul className="mt-10 grid gap-5 lg:grid-cols-3">
      {plans.map((plan) => {
        const free = plan.id === "basic";
        const price = plan.prices[interval];
        return <li key={plan.id} className={`relative flex flex-col rounded-2xl border p-7 ${plan.highlight ? "border-ink bg-ink text-paper" : "border-rule bg-white/50"}`}>
          <h2 className="font-display text-[2rem] leading-none">{plan.name}</h2>
          <p className={`mt-2 min-h-[3rem] text-[0.95rem] ${plan.highlight ? "text-paper/75" : "text-ink-soft"}`}>{plan.summary}</p>
          <p className="mt-6 flex items-baseline gap-2"><span className="font-display text-[3.4rem] leading-none tracking-[-0.03em]">{free ? "Free" : usd(price!)}</span>{!free && <span className={plan.highlight ? "text-paper/70" : "text-ink-soft"}>a {interval}</span>}</p>
          <p className={`mt-1 text-[0.88rem] ${plan.highlight ? "text-paper/70" : "text-ink-faint"}`}>{free ? "No card needed, for as long as you like." : interval === "year" ? "Paid once a year. Renews until you switch it off." : "Paid each month. Renews until you switch it off."}</p>
          {free ? <Link href="/templatechooser" className="mt-6 inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-[0.95rem] font-medium text-paper transition-colors hover:bg-signal hover:text-signal-ink">Start free</Link>
            : <button type="button" disabled={!paymentsReady || busy !== null} onClick={() => void choose(plan)} className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-paper px-5 py-3 text-[0.95rem] font-medium text-ink transition-colors hover:bg-signal hover:text-signal-ink disabled:opacity-50">{busy === plan.id && <Loader2 size={15} className="animate-spin" />}{paymentsReady ? `Choose ${plan.name}` : "Coming soon"}</button>}
          <ul className="mt-7 space-y-2.5 text-[0.93rem]">{plan.features.map((feature) => <li key={feature} className="flex gap-2.5"><Check size={16} className={`mt-0.5 shrink-0 ${plan.highlight ? "text-signal" : "text-ink"}`} />{feature}</li>)}</ul>
        </li>;
      })}
      <li className="flex flex-col rounded-2xl border border-dashed border-rule p-7">
        <h2 className="font-display text-[2rem] leading-none">Need more?</h2>
        <p className="mt-2 min-h-[3rem] text-[0.95rem] text-ink-soft">More than three sites, a team, a custom website, or someone to look after your site for you.</p>
        <p className="mt-6 font-display text-[2.2rem] leading-none tracking-[-0.02em]">Let’s talk</p>
        <p className="mt-1 text-[0.88rem] text-ink-faint">A free 20-minute call. We agree a price before any work starts.</p>
        <Link href={bookingHref} className="mt-6 inline-flex items-center justify-center rounded-full border border-ink px-5 py-3 text-[0.95rem] font-medium text-ink transition-colors hover:bg-ink hover:text-paper">Book a free call</Link>
        <ul className="mt-7 space-y-2.5 text-[0.93rem]">{["Done for you: we build and keep your site up to date", "More than three portfolios", "Teams and agencies", "Help moving an existing site"].map((feature) => <li key={feature} className="flex gap-2.5"><Check size={16} className="mt-0.5 shrink-0 text-ink" />{feature}</li>)}</ul>
      </li>
    </ul>
    {error && <p role="alert" className="mt-4 text-center text-[0.95rem] text-[color:var(--destructive)]">{error}</p>}
  </>;
}

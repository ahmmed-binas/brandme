"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

interface Account { plan: string; planName: string; standing: "trial" | "active" | "grace" | "paused"; daysLeft: number }

const KEY = "formora:banner-dismissed";

/**
 * A friendly note about the trial or plan, only when it matters: the last days
 * of the trial, the grace period after it, or a resting site. Never blocks editing.
 */
export function TrialBanner({ signedIn }: { signedIn: boolean }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [dismissed, setDismissed] = useState(() => { try { return typeof window !== "undefined" && sessionStorage.getItem(KEY) === "1"; } catch { return false; } });
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    fetch("/api/account/status").then((response) => response.json()).then((body: { account: Account | null }) => { if (!cancelled) setAccount(body.account); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [signedIn]);
  if (!account) return null;

  const days = (n: number) => `${n} day${n === 1 ? "" : "s"}`;
  const message =
    account.standing === "trial" && account.daysLeft <= 5 ? <>Your free trial has {days(account.daysLeft)} left. Plans start at $10 a year, about the price of one coffee.</>
    : account.standing === "grace" ? <>Your {account.plan === "trial" ? "free trial" : `${account.planName} plan`} has ended, but your site stays online for {days(account.daysLeft)} more. Pick a plan whenever you’re ready.</>
    : account.standing === "paused" ? <>Your site is resting while there’s no active plan. Everything is saved; choose a plan to bring it back online straight away.</>
    : null;
  if (!message || (dismissed && account.standing !== "paused")) return null;

  return <div role="status" className={`flex shrink-0 items-center gap-3 px-4 py-2 text-[13px] ${account.standing === "paused" ? "bg-ink text-paper" : "bg-[#f6e7c8] text-ink"}`}>
    <span className="min-w-0 flex-1">{message}</span>
    <Link href="/pricing" className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-medium ${account.standing === "paused" ? "bg-paper text-ink" : "bg-ink text-paper"}`}>See plans</Link>
    {account.standing !== "paused" && <button type="button" onClick={() => { setDismissed(true); try { sessionStorage.setItem(KEY, "1"); } catch { /* ignore */ } }} className="shrink-0 rounded p-1 opacity-60 hover:opacity-100" aria-label="Dismiss"><X size={14} /></button>}
  </div>;
}

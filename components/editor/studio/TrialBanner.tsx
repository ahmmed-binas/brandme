"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

interface Account { plan: string; planName: string; standing: "active" | "grace"; daysLeft: number }

const KEY = "formora:banner-dismissed";

/**
 * A friendly note when Pro has ended and the 14-day grace period is running,
 * before the account moves to free Basic. Never blocks editing.
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
  if (!account || account.standing !== "grace" || dismissed) return null;

  const days = `${account.daysLeft} day${account.daysLeft === 1 ? "" : "s"}`;
  return <div role="status" className="flex shrink-0 items-center gap-3 bg-[#f6e7c8] px-4 py-2 text-[13px] text-ink">
    <span className="min-w-0 flex-1">Your {account.planName} plan has ended. It keeps working for {days} more, then your account moves to free Basic: your first site stays online and nothing is deleted.</span>
    <Link href="/pricing" className="shrink-0 rounded-full bg-ink px-3 py-1 text-[12px] font-medium text-paper">Renew {account.planName}</Link>
    <button type="button" onClick={() => { setDismissed(true); try { sessionStorage.setItem(KEY, "1"); } catch { /* ignore */ } }} className="shrink-0 rounded p-1 opacity-60 hover:opacity-100" aria-label="Dismiss"><X size={14} /></button>
  </div>;
}

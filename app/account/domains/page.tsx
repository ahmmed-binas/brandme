import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import RenewButton from "./RenewButton";
import { ownedDomains } from "@/lib/domains/service";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

export const metadata: Metadata = { title: "Your domains", robots: { index: false } };
// Per visitor; never pre-render (a build without DATABASE_URL would bake in the sign-in redirect).
export const dynamic = "force-dynamic";

const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** Domains the owner bought through us: when each expires, and renewing it. */
export default async function DomainsPage({ searchParams }: { searchParams: Promise<{ renewed?: string }> }) {
  const user = databaseConfigured() ? await getCurrentUser().catch(() => null) : null;
  if (!user) redirect("/login?callbackUrl=/account/domains");
  const domains = await ownedDomains(user);
  const renewed = Boolean((await searchParams).renewed);

  return <main className="px-5 pb-24 pt-14"><div className="mx-auto max-w-3xl">
    <Link href="/account" className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft hover:text-ink">← Account</Link>
    <h1 className="mt-4 font-display text-[clamp(2.2rem,5vw,3.2rem)] leading-none tracking-[-0.02em]">Your domains</h1>
    <p className="mt-4 text-ink-soft">Domains you bought here are registered in your name for a year at a time. They never renew without you saying so; we email you a month before each one expires.</p>
    {renewed && <p role="status" className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-[0.95rem] text-emerald-900">Thank you. Your renewal is being processed; the new expiry date shows here within a few minutes, and we’ll email you when it’s done.</p>}
    {domains.length === 0 ? <p className="mt-10 rounded-xl border border-dashed border-rule p-6 text-ink-soft">You haven’t bought a domain yet. You can buy one from the editor: open your portfolio, choose <b className="font-medium text-ink">Publish</b>, then <b className="font-medium text-ink">Get a domain</b>. Domains you connected from another registrar are renewed there.</p>
      : <ul className="mt-10 divide-y divide-rule rounded-xl border border-rule bg-card">{domains.map((item) => {
        const days = item.daysLeft;
        return <li key={item.orderId} className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="font-display text-[1.4rem] leading-tight">{item.domain}</p>
            <p className={`mt-1 text-[0.92rem] ${days <= 30 ? "text-amber-800" : "text-ink-soft"}`}>{days < 0 ? `Expired on ${date(item.expiresAt)}` : `Registered until ${date(item.expiresAt)}${days <= 30 ? ` · ${days} day${days === 1 ? "" : "s"} left` : ""}`}</p>
          </div>
          {item.renewing ? <span className="text-[0.92rem] text-ink-soft">Renewing…</span>
            : item.manual ? <span className="text-[0.92rem] text-ink-soft">Renewal paid; we’re finishing it by hand.</span>
            : days > 90 ? <span className="text-[0.92rem] text-ink-soft">Renewal opens 90 days before expiry</span>
            : item.renewalCents === null ? <span className="text-[0.92rem] text-ink-soft">Renewal price unavailable right now</span>
            : <RenewButton orderId={item.orderId} label={item.included ? "Renew (included in Premium)" : `Renew for $${(item.renewalCents / 100).toFixed(0)}`} />}
        </li>;
      })}</ul>}
  </div></main>;
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Globe, LogOut, PencilLine, UserRound } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import GoogleSignInButton from "@/components/common/GoogleSignInButton";
import { getTemplate } from "@/lib/templates/catalog";
import type { TemplateId } from "@/lib/templates/types";

interface AccountPortfolio { templateId: TemplateId; name: string; slug: string | null; publishedAt: string | null; updatedAt: string; hasUnpublishedChanges: boolean }
interface AccountData { plan: { id: string; name: string; publishedPortfolios: number; aiEditsPerDay: number }; portfolios: AccountPortfolio[] }

function Portfolios() {
  const [data, setData] = useState<AccountData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/portfolios").then(async (response) => {
      const body = await response.json().catch(() => ({}));
      if (cancelled) return;
      if (response.ok) setData(body as AccountData); else setError(body.error ?? "Your portfolios could not be loaded.");
    }).catch(() => { if (!cancelled) setError("Your portfolios could not be loaded."); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <p className="mt-8 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{error}</p>;
  if (!data) return <p className="mt-8 text-sm text-ink-soft">Loading your portfolios…</p>;
  const live = data.portfolios.filter((item) => item.publishedAt).length;
  return <section className="mt-10">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="font-display text-[1.6rem] font-[400] leading-none tracking-[-0.02em]">Your portfolios</h2><p className="mt-1 text-sm text-ink-soft">{data.plan.name} plan · {live} of {data.plan.publishedPortfolios} live · {data.plan.aiEditsPerDay} AI edits a day</p></div>
      <Link href="/templatechooser" className="rounded-xl border px-3 py-2 text-sm font-bold">New portfolio</Link>
    </div>
    {data.portfolios.length === 0 ? <p className="mt-5 rounded-2xl border border-dashed border-rule p-6 text-sm text-ink-soft">You haven’t saved a portfolio yet. Choose a template, edit it while signed in, and it is saved here automatically.</p>
      : <ul className="mt-5 divide-y divide-rule rounded-2xl border border-rule">{data.portfolios.map((item) => <li key={item.templateId} className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate font-bold">{item.name || "Untitled portfolio"}</p>
          <p className="text-xs text-ink-soft">{getTemplate(item.templateId)?.name ?? item.templateId} · edited {new Date(item.updatedAt).toLocaleDateString()}</p>
          {item.publishedAt && item.slug ? <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-700"><Globe size={12} /> Live at /p/{item.slug}{item.hasUnpublishedChanges && <span className="text-amber-700"> · unpublished changes</span>}</p> : <p className="mt-1 text-xs text-ink-soft">Not published</p>}
        </div>
        <div className="flex gap-2">
          {item.publishedAt && item.slug && <a href={`/p/${item.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-bold"><ExternalLink size={14} /> View</a>}
          <Link href={`/editor/${item.templateId}`} className="inline-flex items-center gap-1 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper"><PencilLine size={14} /> Edit</Link>
        </div>
      </li>)}</ul>}
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
  return <section className="mt-12 border-t border-rule pt-6">
    <h2 className="text-sm font-bold text-ink">Delete account</h2>
    <p className="mt-1 text-sm text-ink-soft">Removes your profile, every portfolio (published pages go offline), domain connections, and community posts. This can’t be undone. Domains you bought stay registered in your name.</p>
    {!open ? <button onClick={() => setOpen(true)} className="mt-3 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50">Delete my account…</button>
      : <div className="mt-3 flex flex-wrap items-center gap-2">
        <input value={typed} onChange={(event) => setTyped(event.target.value)} placeholder="Type DELETE" aria-label="Type DELETE to confirm" className="rounded-xl border border-rule bg-transparent px-3 py-2 text-sm" />
        <button disabled={typed !== "DELETE" || busy} onClick={() => void remove()} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-paper disabled:opacity-40">{busy ? "Deleting…" : "Permanently delete"}</button>
        <button onClick={() => { setOpen(false); setTyped(""); }} className="px-2 text-sm text-ink-soft">Cancel</button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </div>}
  </section>;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  if (status === "loading") return <main className="min-h-screen  p-10"><p className="mx-auto max-w-3xl text-ink-soft">Loading your account…</p></main>;
  if (!session?.user) return <main className="min-h-screen  px-5 py-16"><div className="mx-auto max-w-md rounded-2xl border border-rule bg-card p-8"><h1 className="font-display text-[2.2rem] font-[400] leading-[1.05] tracking-[-0.02em] [font-variation-settings:'opsz'_48]">Sign in to your account</h1><p className="mt-3 text-ink-soft">Use Google to continue.</p><div className="mt-6"><GoogleSignInButton /></div></div></main>;
  return <main className="min-h-screen  px-5 py-16">
    <div className="mx-auto max-w-3xl rounded-2xl border border-rule bg-card p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4"><span className="grid size-14 place-items-center rounded-full bg-signal-soft text-signal"><UserRound /></span><div><p className="text-sm font-mono font-normal uppercase tracking-[0.2em] text-signal">Signed in</p><h1 className="font-display text-[1.9rem] font-[400] leading-none tracking-[-0.02em]">{session.user.name || "Formora user"}</h1><p className="text-ink-soft">{session.user.email}</p></div></div>
        <button onClick={() => void signOut({ callbackUrl: "/" })} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold"><LogOut size={16} /> Sign out</button>
      </div>
      <Portfolios />
      <DeleteAccount />
    </div>
  </main>;
}

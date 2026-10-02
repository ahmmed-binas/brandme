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
  if (!data) return <p className="mt-8 text-sm text-slate-500">Loading your portfolios…</p>;
  const live = data.portfolios.filter((item) => item.publishedAt).length;
  return <section className="mt-10">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-xl font-black">Your portfolios</h2><p className="mt-1 text-sm text-slate-500">{data.plan.name} plan · {live} of {data.plan.publishedPortfolios} live · {data.plan.aiEditsPerDay} AI edits a day</p></div>
      <Link href="/templatechooser" className="rounded-xl border px-3 py-2 text-sm font-bold">New portfolio</Link>
    </div>
    {data.portfolios.length === 0 ? <p className="mt-5 rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-white/15 dark:text-slate-400">You haven’t saved a portfolio yet. Choose a template, edit it while signed in, and it is saved here automatically.</p>
      : <ul className="mt-5 divide-y divide-slate-200 rounded-2xl border border-slate-200 dark:divide-white/10 dark:border-white/10">{data.portfolios.map((item) => <li key={item.templateId} className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate font-bold">{item.name || "Untitled portfolio"}</p>
          <p className="text-xs text-slate-500">{getTemplate(item.templateId)?.name ?? item.templateId} · edited {new Date(item.updatedAt).toLocaleDateString()}</p>
          {item.publishedAt && item.slug ? <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-700"><Globe size={12} /> Live at /p/{item.slug}{item.hasUnpublishedChanges && <span className="text-amber-700"> · unpublished changes</span>}</p> : <p className="mt-1 text-xs text-slate-500">Not published</p>}
        </div>
        <div className="flex gap-2">
          {item.publishedAt && item.slug && <a href={`/p/${item.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-bold"><ExternalLink size={14} /> View</a>}
          <Link href={`/editor/${item.templateId}`} className="inline-flex items-center gap-1 rounded-lg bg-violet-700 px-3 py-2 text-sm font-bold text-white"><PencilLine size={14} /> Edit</Link>
        </div>
      </li>)}</ul>}
  </section>;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  if (status === "loading") return <main className="min-h-screen bg-slate-50 p-10 dark:bg-slate-950"><p className="mx-auto max-w-3xl text-slate-600 dark:text-slate-300">Loading your account…</p></main>;
  if (!session?.user) return <main className="min-h-screen bg-slate-50 px-5 py-16 dark:bg-slate-950"><div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 dark:border-white/10 dark:bg-slate-900"><h1 className="text-3xl font-black">Sign in to your account</h1><p className="mt-3 text-slate-600 dark:text-slate-400">Use Google to continue.</p><div className="mt-6"><GoogleSignInButton /></div></div></main>;
  return <main className="min-h-screen bg-slate-50 px-5 py-16 dark:bg-slate-950">
    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4"><span className="grid size-14 place-items-center rounded-full bg-violet-100 text-violet-700"><UserRound /></span><div><p className="text-sm font-bold uppercase tracking-[.14em] text-violet-700">Signed in</p><h1 className="text-2xl font-black">{session.user.name || "Formora user"}</h1><p className="text-slate-500">{session.user.email}</p></div></div>
        <button onClick={() => void signOut({ callbackUrl: "/" })} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold"><LogOut size={16} /> Sign out</button>
      </div>
      <Portfolios />
    </div>
  </main>;
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewActions, ApproveRemaining } from "./ReviewActions";
import { availableTemplates } from "@/lib/templates/approval";
import { PROFESSIONS } from "@/lib/templates/types";
import { getCurrentUser } from "@/utils/user-account";

export const metadata: Metadata = { title: "Review templates", robots: { index: false } };

const FILTERS = [["pending", "Waiting"], ["changes", "Changes requested"], ["approved", "Approved"], ["rejected", "Rejected"], ["all", "All"]] as const;

// Depends on who is signed in; never pre-render at build time.
export const dynamic = "force-dynamic";

/** The owner's approval desk: nothing reaches customers until it's approved here. */
export default async function ReviewTemplates({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const viewer = await getCurrentUser().catch(() => null);
  if (!Boolean(viewer?.isAdmin)) notFound();
  const show = (await searchParams).show ?? "pending";
  const all = (await availableTemplates(true)).filter((template) => template.collection === "studio");
  const counts = Object.fromEntries(FILTERS.map(([id]) => [id, id === "all" ? all.length : all.filter((template) => template.review.status === id).length]));
  const shown = show === "all" ? all : all.filter((template) => template.review.status === show);
  const label = (id: string) => PROFESSIONS.find((item) => item.id === id)?.label ?? id;

  return <div className="mx-auto max-w-[1320px] px-5 pb-24 pt-12 sm:px-8">
    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Admin · template approval</p>
    <h1 className="mt-3 font-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.98] tracking-[-0.02em]">{counts.pending ? `${counts.pending} templates are waiting for you` : "Every template has been reviewed"}</h1>
    <p className="mt-4 max-w-[44rem] text-[1.02rem] leading-relaxed text-ink-soft">Open each one, try it in the editor, and approve it, ask for changes, or reject it. Customers only see approved templates. You can change your mind at any time.</p>
    <nav className="mt-8 flex flex-wrap gap-2" aria-label="Filter">{FILTERS.map(([id, text]) => <Link key={id} href={`?show=${id}`} aria-current={show === id ? "page" : undefined} className={`rounded-full border px-3.5 py-1.5 text-[0.9rem] ${show === id ? "border-ink bg-ink text-paper" : "border-rule text-ink-soft hover:border-ink"}`}>{text} <span className="opacity-60">{counts[id]}</span></Link>)}
      {show === "pending" && counts.pending > 1 && <ApproveRemaining count={counts.pending} />}</nav>

    <ul className="mt-10 space-y-6">{shown.map((template) => <li key={template.id} className="grid gap-6 rounded-2xl border border-rule bg-white/50 p-5 lg:grid-cols-[1fr_auto_22rem]">
      <a href={`/templates/${template.id}?sample=1`} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-rule">
        {/* eslint-disable-next-line @next/next/no-img-element -- static thumbnails */}
        <img src={`/templates/${template.id}.webp`} alt={`${template.name} on desktop`} loading="lazy" className="aspect-[3/2] w-full object-cover object-top" />
      </a>
      <a href={`/templates/${template.id}?sample=1`} target="_blank" rel="noreferrer" className="hidden w-[150px] overflow-hidden rounded-[18px] border-[4px] border-ink lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element -- static thumbnails */}
        <img src={`/templates/${template.id}-phone.webp`} alt={`${template.name} on a phone`} loading="lazy" className="aspect-[1/2] w-full object-cover object-top" />
      </a>
      <div className="flex flex-col">
        <h2 className="font-display text-[1.8rem] leading-none">{template.name}</h2>
        <p className="mt-2 text-[0.92rem] text-ink-soft">{template.description}</p>
        <p className="mt-3 text-[0.82rem] text-ink-faint">{(template.professions ?? []).map(label).join(" · ")} — {template.mood}, {(template.styles ?? []).join(", ").toLowerCase()}</p>
        <p className="mt-3 flex gap-1.5">{(template.palettes ?? []).map((palette) => <span key={palette.id} title={palette.name} className="flex overflow-hidden rounded border border-black/10">{[palette.bg, palette.fg, palette.accent].map((colour, index) => <span key={index} className="h-4 w-3" style={{ background: colour }} />)}</span>)}</p>
        <p className="mt-3 flex gap-4 text-[0.9rem]"><a href={`/templates/${template.id}?sample=1`} target="_blank" rel="noreferrer" className="underline underline-offset-4">Open live</a><Link href={`/editor/${template.id}`} className="underline underline-offset-4">Try in editor</Link></p>
        <div className="mt-auto pt-5"><ReviewActions templateId={template.id} status={template.review.status} note={template.review.note} /></div>
      </div>
    </li>)}</ul>
    {!shown.length && <p className="mt-16 text-center text-ink-soft">Nothing here.</p>}
  </div>;
}

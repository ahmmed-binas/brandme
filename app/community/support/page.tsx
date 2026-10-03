import type { Metadata } from "next";
import Link from "next/link";
import { NewTicket, TicketThread } from "./SupportForms";
import { getViewer } from "@/lib/community/viewer";
import { listTickets, SUPPORT_CATEGORIES } from "@/lib/support/repository";
import { formatDate } from "@/components/community/Parts";
import { databaseConfigured } from "@/utils/db-schema";

export const metadata: Metadata = { title: "Support", description: "Get help with your portfolio, domain, plan or the editor. A person replies, usually within one working day.", alternates: { canonical: "/community/support" } };

// Depends on who is signed in; never pre-render at build time.
export const dynamic = "force-dynamic";

const STATUS = { open: "Waiting for us", answered: "We replied", closed: "Closed" } as const;

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ view?: string; ticket?: string }> }) {
  const params = await searchParams;
  const viewer = await getViewer().catch(() => null);
  const queue = Boolean(viewer?.isModerator && params.view === "queue");
  const tickets = viewer && databaseConfigured() ? await listTickets({ id: viewer.id, isStaff: viewer.isModerator }, queue ? "queue" : "mine") : [];

  return <div className="mx-auto max-w-[1100px] px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
    <Link href="/community" className="text-[0.92rem] text-ink-soft hover:text-ink">← Community</Link>
    <header className="mt-6 grid gap-8 border-b border-rule pb-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
      <div><p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Support</p>
        <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,4.6rem)] leading-[0.95] tracking-[-0.03em]">Ask a person.</h1></div>
      <p className="text-[1.05rem] leading-[1.7] text-ink-soft">Billing, domains, the editor, anything. Requests here are private between you and us, and someone replies, usually within one working day.</p>
    </header>

    {!viewer ? <div className="mt-12 rounded-2xl border border-rule p-8"><p className="text-[1.05rem]">Sign in so we know which account you’re asking about.</p><Link href={`/login?callbackUrl=${encodeURIComponent("/community/support")}`} className="mt-5 inline-block rounded-full bg-ink px-5 py-2.5 text-paper">Sign in</Link>
      <p className="mt-6 text-[0.92rem] text-ink-soft">Can’t sign in? Use the <Link href="/contact" className="underline">contact form</Link> instead.</p></div>
    : <>
      {viewer.isModerator && <nav className="mt-8 flex gap-2" aria-label="Support views"><Link href="/community/support" className={`rounded-full border px-3.5 py-1.5 text-[0.9rem] ${!queue ? "border-ink bg-ink text-paper" : "border-rule"}`}>My requests</Link><Link href="/community/support?view=queue" className={`rounded-full border px-3.5 py-1.5 text-[0.9rem] ${queue ? "border-ink bg-ink text-paper" : "border-rule"}`}>Support desk (staff)</Link></nav>}
      {!queue && <section className="mt-10"><NewTicket categories={[...SUPPORT_CATEGORIES]} /></section>}
      <section className="mt-12">
        <h2 className="font-display text-[1.8rem]">{queue ? "All requests" : "Your requests"}</h2>
        {!tickets.length ? <p className="mt-4 text-ink-soft">{queue ? "No requests yet." : "Nothing yet. Your conversations with us will appear here."}</p>
          : <ul className="mt-6 space-y-4">{tickets.map((ticket) => <li key={ticket.id} id={ticket.id} className="rounded-2xl border border-rule bg-white/50">
            <details open={params.ticket === ticket.id || (ticket.status !== "closed" && tickets.length <= 3)}>
              <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-3 p-5">
                <span><span className="font-display text-[1.3rem]">{ticket.subject}</span><span className="ml-2 text-[0.85rem] text-ink-faint">{ticket.category} · {formatDate(ticket.updatedAt)}{queue && ` · ${ticket.owner.name ?? "Customer"} (${ticket.owner.email}, ${ticket.owner.plan})`}</span></span>
                <span className={`rounded-full px-2.5 py-0.5 text-[12px] ${ticket.status === "open" ? "bg-amber-100 text-amber-950" : ticket.status === "answered" ? "bg-emerald-100 text-emerald-950" : "bg-ink/5 text-ink-soft"}`}>{queue && ticket.status === "open" ? "Needs a reply" : STATUS[ticket.status]}</span>
              </summary>
              <TicketThread ticket={ticket} staff={queue} />
            </details>
          </li>)}</ul>}
      </section>
    </>}
  </div>;
}

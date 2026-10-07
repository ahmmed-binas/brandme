import Link from "next/link";
import ConsoleLogin from "@/components/console/ConsoleLogin";
import Shell from "@/components/console/Shell";
import { consoleHref } from "@/lib/console/path";
import { standingOf } from "@/lib/plans";
import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

export const dynamic = "force-dynamic";

const PAGE = 50;
const FILTERS = { all: "Everyone", paying: "Pro", free: "Basic (free)", lapsed: "Pro ended" } as const;
type Filter = keyof typeof FILTERS;

const WHERE: Record<Filter, string> = {
  all: "TRUE",
  paying: "plan = 'pro' AND plan_expires_at > NOW() - INTERVAL '14 days'",
  free: "NOT (plan = 'pro' AND plan_expires_at > NOW() - INTERVAL '14 days')",
  lapsed: "plan = 'pro' AND plan_expires_at <= NOW()",
};

interface Row { id: string; email: string | null; name: string | null; username: string | null; provider: string; plan: string; plan_interval: string; plan_expires_at: Date | null; created_at: Date; credits: number; portfolios: number; published: number; paid_cents: number; verified: boolean }

/** Every customer account, searchable, with what they've paid. */
export default async function ConsoleUsers({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string; page?: string }> }) {
  const user = await getCurrentUser().catch(() => null);
  if (!user?.isSuperadmin) return <ConsoleLogin />;
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 120);
  const filter: Filter = params.filter && params.filter in FILTERS ? params.filter as Filter : "all";
  const page = Math.max(1, Math.min(1000, Number(params.page) || 1));
  await ensureSchema();
  const search = q ? "AND (lower(u.email) LIKE $1 OR lower(u.name) LIKE $1 OR lower(u.username) LIKE $1)" : "AND $1::text IS NULL";
  const like = q ? `%${q.toLowerCase().replace(/[%_\\]/g, "\\$&")}%` : null;
  const [rows, total] = await Promise.all([
    db.query<Row>(`SELECT u.id, u.email, u.name, u.username, u.provider, u.plan, u.plan_interval, u.plan_expires_at, u.created_at, u.credits,
        (u.provider <> 'password' OR u.email_verified_at IS NOT NULL) AS verified,
        (SELECT COUNT(*) FROM portfolios p WHERE p.owner_id = u.id)::int AS portfolios,
        (SELECT COUNT(*) FROM portfolios p WHERE p.owner_id = u.id AND p.published_at IS NOT NULL)::int AS published,
        ((SELECT COALESCE(SUM(amount_cents), 0) FROM billing_orders o WHERE o.owner_id = u.id AND o.status = 'paid')
          + (SELECT COALESCE(SUM(charged_cents), 0) FROM domain_orders d WHERE d.owner_id = u.id AND d.status IN ('purchasing', 'registering', 'configuring', 'completed', 'renewal_manual', 'refund_failed')))::int AS paid_cents
      FROM app_users u WHERE NOT u.is_superadmin AND ${WHERE[filter].replace(/\b(plan|plan_expires_at)\b/g, "u.$1")} ${search}
      ORDER BY u.created_at DESC LIMIT ${PAGE} OFFSET ${(page - 1) * PAGE}`, [like]).then((result) => result.rows),
    db.query<{ count: string }>(`SELECT COUNT(*) AS count FROM app_users u WHERE NOT u.is_superadmin AND ${WHERE[filter].replace(/\b(plan|plan_expires_at)\b/g, "u.$1")} ${search}`, [like]).then((result) => Number(result.rows[0]?.count ?? 0)),
  ]);
  const href = (next: { filter?: Filter; page?: number }) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    const f = next.filter ?? filter;
    if (f !== "all") query.set("filter", f);
    if (next.page && next.page > 1) query.set("page", String(next.page));
    const value = query.toString();
    return consoleHref(`/users${value ? `?${value}` : ""}`);
  };
  const date = (value: Date | null) => (value ? value.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "–");

  return <Shell active="Users" email={user.email}>
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-[12px] uppercase tracking-[0.16em] text-[var(--c-muted)]">Users</p><h1 className="mt-1 text-[1.5rem] font-semibold tracking-tight">{total.toLocaleString("en-US")} {total === 1 ? "account" : "accounts"}</h1></div>
      <form action={consoleHref("/users")} className="flex gap-2">
        {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
        <label className="sr-only" htmlFor="q">Search users</label>
        <input id="q" name="q" defaultValue={q} placeholder="Email, name or username" className="w-64 rounded-lg border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-2 text-[13px] outline-none focus:border-[var(--c-accent)]" />
        <button className="rounded-lg bg-[var(--c-accent)] px-4 py-2 text-[13px] font-medium text-white">Search</button>
      </form>
    </header>
    <nav aria-label="Filter users" className="mt-5 flex flex-wrap gap-1">{(Object.keys(FILTERS) as Filter[]).map((id) => <Link key={id} href={href({ filter: id, page: 1 })} aria-current={id === filter ? "true" : undefined} className={`rounded-md px-3 py-1.5 text-[13px] ${id === filter ? "bg-white/10 text-[var(--c-text)]" : "text-[var(--c-text2)] hover:text-[var(--c-text)]"}`}>{FILTERS[id]}</Link>)}</nav>
    <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--c-line)] bg-[var(--c-panel)]">
      <table className="w-full min-w-[820px] text-left text-[12.5px]">
        <thead className="text-[var(--c-muted)]"><tr>{["Joined", "Email", "Name", "Sign-in", "Plan", "Until", "Portfolios", "Credits", "Paid"].map((head) => <th key={head} className={`px-4 py-3 font-medium ${["Portfolios", "Credits", "Paid"].includes(head) ? "text-right" : ""}`}>{head}</th>)}</tr></thead>
        <tbody>{rows.length === 0 ? <tr><td colSpan={9} className="px-4 py-8 text-center text-[var(--c-muted)]">No accounts match.</td></tr> : rows.map((row) => {
          const standing = standingOf(row);
          return <tr key={row.id} className="border-t border-[var(--c-line)]">
            <td className="whitespace-nowrap px-4 py-2.5 text-[var(--c-muted)]">{date(row.created_at)}</td>
            <td className="max-w-[16rem] truncate px-4 py-2.5">{row.email ?? "–"}{!row.verified && <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-[var(--c-muted)]">unconfirmed</span>}</td>
            <td className="max-w-[12rem] truncate px-4 py-2.5 text-[var(--c-text2)]">{row.name ?? ""}{row.username && <span className="text-[var(--c-muted)]"> @{row.username}</span>}</td>
            <td className="px-4 py-2.5 text-[var(--c-text2)]">{row.provider === "password" ? "Email" : "Google"}</td>
            <td className="px-4 py-2.5">{standing.plan.name}{standing.plan.id === "pro" && <span className="text-[var(--c-muted)]"> ({standing.standing === "grace" ? "ending" : standing.interval === "month" ? "monthly" : "yearly"})</span>}</td>
            <td className="whitespace-nowrap px-4 py-2.5 text-[var(--c-muted)]">{standing.endsAt ? date(standing.endsAt) : "–"}</td>
            <td className="px-4 py-2.5 text-right tabular-nums">{row.portfolios}{row.published ? <span className="text-[var(--c-muted)]"> ({row.published} live)</span> : null}</td>
            <td className="px-4 py-2.5 text-right tabular-nums">{row.credits}</td>
            <td className="px-4 py-2.5 text-right tabular-nums">{row.paid_cents ? `$${(row.paid_cents / 100).toFixed(2)}` : "–"}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    {total > PAGE && <p className="mt-4 flex items-center gap-4 text-[13px] text-[var(--c-text2)]">{page > 1 && <Link href={href({ page: page - 1 })} className="underline underline-offset-4">← Newer</Link>}Page {page} of {Math.ceil(total / PAGE)}{page * PAGE < total && <Link href={href({ page: page + 1 })} className="underline underline-offset-4">Older →</Link>}</p>}
  </Shell>;
}

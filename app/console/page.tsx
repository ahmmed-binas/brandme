import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import ConsoleLogin from "@/components/console/ConsoleLogin";
import Shell from "@/components/console/Shell";
import { LineChart, RankedBars, StackedColumns } from "@/components/console/Charts";
import { consoleHref } from "@/lib/console/path";
import { isRange, loadDashboard, RANGES, type RangeId } from "@/lib/console/metrics";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

export const dynamic = "force-dynamic";

const usd = (value: number, digits = 0) => value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits });
const compactUsd = (value: number) => (Math.abs(value) >= 10_000 ? `$${(value / 1000).toFixed(value >= 100_000 ? 0 : 1)}K` : usd(value, value % 1 ? 2 : 0));
const count = (value: number) => (value >= 10_000 ? `${(value / 1000).toFixed(1)}K` : Math.round(value).toLocaleString("en-US"));
const percent = (value: number) => `${(value * 100).toFixed(value < 0.1 ? 1 : 0)}%`;
const when = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const RANGE_LABEL: Record<RangeId, string> = { "7d": "7 days", "30d": "30 days", "90d": "90 days", "12m": "12 months" };

function Delta({ now, before, label }: { now: number; before: number; label: string }) {
  if (!before && !now) return <p className="mt-1 text-[12px] text-[var(--c-muted)]">No change {label}</p>;
  if (!before) return <p className="mt-1 text-[12px] text-[var(--c-muted)]">New {label}</p>;
  const change = (now - before) / before;
  const up = change >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return <p className="mt-1 flex items-center gap-1 text-[12px] text-[var(--c-text2)]"><Icon size={13} className={up ? "text-[#4cc38a]" : "text-[#e66767]"} aria-hidden />{up ? "Up" : "Down"} {percent(Math.abs(change))} {label}</p>;
}

function Tile({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return <div className="rounded-xl border border-[var(--c-line)] bg-[var(--c-panel)] p-5"><p className="text-[12.5px] text-[var(--c-muted)]">{label}</p><p className="mt-2 text-[1.7rem] font-semibold tracking-tight tabular-nums">{value}</p>{children}</div>;
}

export default async function ConsoleHome({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const user = await getCurrentUser().catch(() => null);
  if (!user?.isSuperadmin) return <ConsoleLogin />;
  const range: RangeId = (await searchParams).range && isRange((await searchParams).range) ? (await searchParams).range as RangeId : "30d";
  if (!databaseConfigured()) return <Shell active="Dashboard" email={user.email}><p className="text-[var(--c-text2)]">The dashboard needs the database.</p></Shell>;
  const d = await loadDashboard(range);
  const labels = d.buckets.map((bucket) => bucket.label);
  const vs = `vs the previous ${RANGE_LABEL[range]}`;

  return <Shell active="Dashboard" email={user.email}>
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-[12px] uppercase tracking-[0.16em] text-[var(--c-muted)]">Dashboard</p><h1 className="mt-1 text-[1.5rem] font-semibold tracking-tight">How the business is doing</h1></div>
      <nav aria-label="Time range" className="flex rounded-lg border border-[var(--c-line)] bg-[var(--c-panel)] p-1">{(Object.keys(RANGES) as RangeId[]).map((id) => <Link key={id} href={consoleHref(`?range=${id}`)} aria-current={id === range ? "true" : undefined} className={`rounded-md px-3 py-1.5 text-[13px] ${id === range ? "bg-white/10 text-[var(--c-text)]" : "text-[var(--c-text2)] hover:text-[var(--c-text)]"}`}>{RANGE_LABEL[id]}</Link>)}</nav>
    </header>

    {(d.inbox.support > 0 || d.inbox.submissions > 0 || d.inbox.moderation > 0) && <p className="mt-6 flex flex-wrap gap-x-5 gap-y-1 rounded-xl border border-[#5a4a1f] bg-[#241f12] px-4 py-3 text-[13px] text-[#f1dfae]">
      Waiting for you:
      {d.inbox.support > 0 && <Link href="/community/support" className="underline underline-offset-4">{d.inbox.support} support {d.inbox.support === 1 ? "request" : "requests"}</Link>}
      {d.inbox.submissions > 0 && <Link href="/admin/gallery" className="underline underline-offset-4">{d.inbox.submissions} gallery {d.inbox.submissions === 1 ? "submission" : "submissions"}</Link>}
      {d.inbox.moderation > 0 && <Link href="/community/moderation" className="underline underline-offset-4">{d.inbox.moderation} {d.inbox.moderation === 1 ? "post" : "posts"} to moderate</Link>}
    </p>}

    <section aria-label="Headline figures" className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <div className="rounded-xl border border-[var(--c-line)] bg-[var(--c-panel)] p-5">
        <p className="text-[12.5px] text-[var(--c-muted)]">Revenue, last {RANGE_LABEL[range]}</p>
        <p className="mt-2 text-[3rem] font-semibold leading-none tracking-tight tabular-nums">{usd(d.revenue.total, d.revenue.total % 1 ? 2 : 0)}</p>
        <Delta now={d.revenue.total} before={d.revenue.previous} label={vs} />
        <p className="mt-3 text-[12px] text-[var(--c-muted)]">Yearly run rate from active plans: <span className="text-[var(--c-text2)]">{usd(d.revenue.runRate)}</span></p>
      </div>
      <Tile label="Paying subscribers" value={count(d.subscribers.paying)}><p className="mt-1 text-[12px] text-[var(--c-text2)]">{count(d.subscribers.trials)} on a free trial</p></Tile>
      <Tile label="Users" value={count(d.users.total)}><Delta now={d.users.added} before={d.users.previousAdded} label={`new users ${vs}`} /></Tile>
      <Tile label="Visitors" value={count(d.visitors.total)}><Delta now={d.visitors.total} before={d.visitors.previous} label={vs} /></Tile>
    </section>

    <section className="mt-4 grid gap-4 xl:grid-cols-2">
      <StackedColumns title="Revenue by source" subtitle={`Per ${d.bucket}, US dollars`} labels={labels} format="usd" series={[{ name: "Plans", values: d.series.plans }, { name: "AI credits", values: d.series.credits }, { name: "Domains", values: d.series.domains }]} />
      <LineChart title="Visitors and page views" subtitle={`Per ${d.bucket}, the marketing site (not customers’ portfolios)`} labels={labels} format="count" series={[{ name: "Page views", values: d.series.views }, { name: "Visitors", values: d.series.visitors }]} />
      <LineChart title="New sign-ups" subtitle={`Per ${d.bucket}`} labels={labels} format="count" area series={[{ name: "Sign-ups", values: d.series.signups }]} />
      <RankedBars title="Plans" subtitle="Accounts by plan right now" format="count" items={d.plans.map((plan) => ({ label: plan.name, value: plan.count }))} />
    </section>

    <section aria-label="More figures" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Tile label="Sign-up to paid" value={d.subscribers.conversion === null ? "–" : percent(d.subscribers.conversion)}><p className="mt-1 text-[12px] text-[var(--c-text2)]">Of people who joined in this range</p></Tile>
      <Tile label="Revenue mix" value={compactUsd(d.revenue.plans)}><p className="mt-1 text-[12px] text-[var(--c-text2)]">plans · {compactUsd(d.revenue.credits)} credits · {compactUsd(d.revenue.domains)} domains</p></Tile>
      <Tile label="Domain margin" value={compactUsd(d.revenue.domains - d.revenue.domainCost)}><p className="mt-1 text-[12px] text-[var(--c-text2)]">{compactUsd(d.revenue.domains)} charged, {compactUsd(d.revenue.domainCost)} to the registrar</p></Tile>
      <Tile label="AI cost to you" value={usd(d.product.aiCost, 2)}><p className="mt-1 text-[12px] text-[var(--c-text2)]">{count(d.product.aiRequests)} requests on your key · {compactUsd(d.revenue.credits)} credits sold</p></Tile>
      <Tile label="Portfolios" value={count(d.product.portfolios)}><p className="mt-1 text-[12px] text-[var(--c-text2)]">{count(d.product.published)} published · {count(d.product.domains)} on own domains</p></Tile>
      <Tile label="Portfolio views" value={count(d.visitors.portfolioViews)}><p className="mt-1 text-[12px] text-[var(--c-text2)]">Visits to customers’ sites</p></Tile>
      <Tile label="Investigator switched on" value={count(d.product.investigatorOn)} />
      <Tile label="Accounts" value={count(d.users.verified)}><p className="mt-1 text-[12px] text-[var(--c-text2)]">confirmed · {count(d.users.google)} Google · {count(d.users.password)} email</p></Tile>
    </section>

    <section className="mt-4 grid gap-4 xl:grid-cols-3">
      <RankedBars title="Top pages" subtitle="Marketing site" format="count" items={d.visitors.pages} empty="No visits recorded yet." />
      <RankedBars title="Where visitors come from" subtitle="Other websites that sent people" format="count" items={d.visitors.referrers} empty="No referrals yet." />
      <RankedBars title="Most-viewed portfolios" format="count" items={d.visitors.portfolios} empty="No portfolio visits yet." />
    </section>

    <section className="mt-4 grid gap-4 xl:grid-cols-2">
      <div className="rounded-xl border border-[var(--c-line)] bg-[var(--c-panel)] p-5">
        <p className="text-[14px] font-medium">Latest payments</p>
        {d.recentPayments.length === 0 ? <p className="py-6 text-[13px] text-[var(--c-muted)]">No payments yet.</p>
          : <table className="mt-3 w-full text-left text-[12.5px]"><tbody>{d.recentPayments.map((payment, i) => <tr key={i} className="border-t border-[var(--c-line)]"><td className="py-2 pr-3 text-[var(--c-muted)]">{when(payment.at)}</td><td className="max-w-[12rem] truncate py-2 pr-3 text-[var(--c-text2)]">{payment.email}</td><td className="py-2 pr-3">{payment.what}</td><td className="py-2 text-right tabular-nums">{usd(payment.cents / 100, 2)}</td></tr>)}</tbody></table>}
      </div>
      <div className="rounded-xl border border-[var(--c-line)] bg-[var(--c-panel)] p-5">
        <div className="flex items-baseline justify-between"><p className="text-[14px] font-medium">Newest users</p><Link href={consoleHref("/users")} className="text-[12px] text-[var(--c-muted)] hover:text-[var(--c-text)]">All users →</Link></div>
        {d.recentSignups.length === 0 ? <p className="py-6 text-[13px] text-[var(--c-muted)]">No users yet.</p>
          : <table className="mt-3 w-full text-left text-[12.5px]"><tbody>{d.recentSignups.map((signup, i) => <tr key={i} className="border-t border-[var(--c-line)]"><td className="py-2 pr-3 text-[var(--c-muted)]">{when(signup.at)}</td><td className="max-w-[14rem] truncate py-2 pr-3 text-[var(--c-text2)]">{signup.email}</td><td className="py-2 pr-3 capitalize">{signup.plan}</td><td className="py-2 text-right text-[var(--c-muted)]">{signup.provider === "password" ? "Email" : "Google"}</td></tr>)}</tbody></table>}
      </div>
    </section>

    <p className="mt-8 text-[12px] text-[var(--c-muted)]">Visitors are counted without cookies: a visitor is unique per day and no IP addresses are stored. Bots and admin pages aren’t counted. All amounts are in US dollars, at the time of payment.</p>
  </Shell>;
}

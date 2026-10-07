import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import { PLANS } from "@/lib/plans";

/**
 * Figures for the superadmin console. Everything is in US dollars (all prices
 * are charged in USD). The superadmin's own account is left out of user counts.
 * Visitors are unique per day (see lib/analytics/track.ts), so a range's
 * "visitors" is the sum of daily visitors.
 */

export const RANGES = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 } as const;
export type RangeId = keyof typeof RANGES;
export const isRange = (value: unknown): value is RangeId => typeof value === "string" && value in RANGES;

/** Paid domain orders: money taken and not refunded. */
const PAID_DOMAIN = "status IN ('purchasing', 'registering', 'configuring', 'completed', 'renewal_manual', 'refund_failed')";
const CUSTOMER = "NOT is_superadmin";

export interface Bucket { start: string; label: string }
export interface Series { plans: number[]; credits: number[]; domains: number[]; signups: number[]; visitors: number[]; views: number[] }
export interface Ranked { label: string; value: number }

export interface Dashboard {
  range: RangeId;
  bucket: "day" | "week";
  buckets: Bucket[];
  series: Series;
  revenue: { total: number; previous: number; plans: number; credits: number; domains: number; domainCost: number; runRate: number };
  users: { total: number; added: number; previousAdded: number; verified: number; google: number; password: number };
  plans: { id: string; name: string; count: number }[];
  subscribers: { paying: number; free: number; lapsed: number; conversion: number | null };
  visitors: { total: number; previous: number; views: number; portfolioViews: number; devices: Ranked[]; pages: Ranked[]; referrers: Ranked[]; portfolios: Ranked[] };
  product: { portfolios: number; published: number; domains: number; investigatorOn: number; aiCost: number; aiRequests: number };
  inbox: { support: number; submissions: number; moderation: number };
  recentPayments: { at: string; email: string; what: string; cents: number }[];
  recentSignups: { at: string; email: string; name: string; plan: string; provider: string }[];
}

const n = (value: unknown) => Number(value ?? 0);
const dollars = (cents: unknown) => n(cents) / 100;

export async function loadDashboard(range: RangeId): Promise<Dashboard> {
  await ensureSchema();
  const days = RANGES[range];
  const bucket = days > 90 ? "week" : "day";
  const since = `NOW() - INTERVAL '${days} days'`;
  const before = `NOW() - INTERVAL '${days * 2} days'`;
  const trunc = (column: string) => `date_trunc('${bucket}', ${column})`;

  const bucketRows = (await db.query<{ start: Date }>(
    `SELECT generate_series(${trunc(since)}, ${trunc("NOW()")}, INTERVAL '1 ${bucket}') AS start`,
  )).rows;
  const keys = bucketRows.map((row) => row.start.toISOString());
  const index = new Map(keys.map((key, i) => [key, i]));
  const zeros = () => keys.map(() => 0);
  const fill = (rows: { start: Date; value: unknown }[], into: number[], scale = 1) => {
    for (const row of rows) { const i = index.get(new Date(row.start).toISOString()); if (i !== undefined) into[i] = n(row.value) * scale; }
    return into;
  };
  const per = (sql: string, params: unknown[] = []) => db.query<{ start: Date; value: unknown }>(sql, params).then((result) => result.rows);

  const [plansRows, creditsRows, domainRows, signupRows, visitorRows, viewRows] = await Promise.all([
    per(`SELECT ${trunc("paid_at")} AS start, SUM(amount_cents) AS value FROM billing_orders WHERE status = 'paid' AND kind = 'plan' AND paid_at >= ${trunc(since)} GROUP BY 1`),
    per(`SELECT ${trunc("paid_at")} AS start, SUM(amount_cents) AS value FROM billing_orders WHERE status = 'paid' AND kind = 'credits' AND paid_at >= ${trunc(since)} GROUP BY 1`),
    per(`SELECT ${trunc("created_at")} AS start, SUM(charged_cents) AS value FROM domain_orders WHERE ${PAID_DOMAIN} AND created_at >= ${trunc(since)} GROUP BY 1`),
    per(`SELECT ${trunc("created_at")} AS start, COUNT(*) AS value FROM app_users WHERE ${CUSTOMER} AND created_at >= ${trunc(since)} GROUP BY 1`),
    // Daily uniques, then summed into the bucket.
    per(`SELECT ${trunc("day")} AS start, SUM(visitors) AS value FROM (SELECT date_trunc('day', at) AS day, COUNT(DISTINCT visitor) AS visitors FROM page_views WHERE kind = 'site' AND at >= ${trunc(since)} GROUP BY 1) daily GROUP BY 1`),
    per(`SELECT ${trunc("at")} AS start, COUNT(*) AS value FROM page_views WHERE kind = 'site' AND at >= ${trunc(since)} GROUP BY 1`),
  ]);
  const series: Series = {
    plans: fill(plansRows, zeros(), 0.01), credits: fill(creditsRows, zeros(), 0.01), domains: fill(domainRows, zeros(), 0.01),
    signups: fill(signupRows, zeros()), visitors: fill(visitorRows, zeros()), views: fill(viewRows, zeros()),
  };

  const one = async <T extends Record<string, unknown>>(sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows[0] ?? ({} as T);
  const many = async (sql: string, params: unknown[] = []) => (await db.query<{ label: string; value: unknown }>(sql, params)).rows.map((row) => ({ label: row.label, value: n(row.value) }));

  const [money, moneyBefore, users, planRows, subs, visits, visitsBefore, devices, pages, referrers, portfolioRanks, product, inbox, payments, signups] = await Promise.all([
    one<{ plans: unknown; credits: unknown; domains: unknown; domain_cost: unknown }>(`SELECT
      (SELECT COALESCE(SUM(amount_cents), 0) FROM billing_orders WHERE status = 'paid' AND kind = 'plan' AND paid_at >= ${since}) AS plans,
      (SELECT COALESCE(SUM(amount_cents), 0) FROM billing_orders WHERE status = 'paid' AND kind = 'credits' AND paid_at >= ${since}) AS credits,
      (SELECT COALESCE(SUM(charged_cents), 0) FROM domain_orders WHERE ${PAID_DOMAIN} AND created_at >= ${since}) AS domains,
      (SELECT COALESCE(SUM(registrar_price), 0) * 100 FROM domain_orders WHERE ${PAID_DOMAIN} AND created_at >= ${since}) AS domain_cost`),
    one<{ total: unknown }>(`SELECT
      (SELECT COALESCE(SUM(amount_cents), 0) FROM billing_orders WHERE status = 'paid' AND paid_at >= ${before} AND paid_at < ${since})
      + (SELECT COALESCE(SUM(charged_cents), 0) FROM domain_orders WHERE ${PAID_DOMAIN} AND created_at >= ${before} AND created_at < ${since}) AS total`),
    one<{ total: unknown; added: unknown; previous: unknown; verified: unknown; google: unknown; password: unknown }>(`SELECT COUNT(*) AS total,
      COUNT(*) FILTER (WHERE created_at >= ${since}) AS added,
      COUNT(*) FILTER (WHERE created_at >= ${before} AND created_at < ${since}) AS previous,
      COUNT(*) FILTER (WHERE provider <> 'password' OR email_verified_at IS NOT NULL) AS verified,
      COUNT(*) FILTER (WHERE provider = 'google') AS google,
      COUNT(*) FILTER (WHERE provider = 'password') AS password
      FROM app_users WHERE ${CUSTOMER}`),
    db.query<{ plan: string; count: unknown }>(`SELECT CASE
        WHEN plan = 'pro' AND plan_expires_at > NOW() THEN CASE WHEN plan_interval = 'month' THEN 'pro-month' ELSE 'pro-year' END
        WHEN plan = 'pro' AND plan_expires_at > NOW() - INTERVAL '14 days' THEN 'grace'
        WHEN plan = 'pro' THEN 'lapsed'
        ELSE 'basic' END AS plan, COUNT(*) AS count
      FROM app_users WHERE ${CUSTOMER} GROUP BY 1`).then((result) => result.rows),
    // Of the people who signed up in the range, how many have paid for a plan since.
    one<{ cohort: unknown; paid: unknown }>(`SELECT COUNT(DISTINCT u.id) AS cohort, COUNT(DISTINCT o.owner_id) AS paid
      FROM app_users u LEFT JOIN billing_orders o ON o.owner_id = u.id AND o.status = 'paid' AND o.kind = 'plan'
      WHERE ${CUSTOMER.replace("is_superadmin", "u.is_superadmin")} AND u.created_at >= ${since}`),
    one<{ visitors: unknown; views: unknown; portfolio_views: unknown }>(`SELECT
      (SELECT COALESCE(SUM(v), 0) FROM (SELECT COUNT(DISTINCT visitor) AS v FROM page_views WHERE kind = 'site' AND at >= ${since} GROUP BY date_trunc('day', at)) d) AS visitors,
      (SELECT COUNT(*) FROM page_views WHERE kind = 'site' AND at >= ${since}) AS views,
      (SELECT COUNT(*) FROM page_views WHERE kind = 'portfolio' AND at >= ${since}) AS portfolio_views`),
    one<{ visitors: unknown }>(`SELECT COALESCE(SUM(v), 0) AS visitors FROM (SELECT COUNT(DISTINCT visitor) AS v FROM page_views WHERE kind = 'site' AND at >= ${before} AND at < ${since} GROUP BY date_trunc('day', at)) d`),
    many(`SELECT device AS label, COUNT(*) AS value FROM page_views WHERE at >= ${since} GROUP BY 1 ORDER BY 2 DESC`),
    many(`SELECT path AS label, COUNT(*) AS value FROM page_views WHERE kind = 'site' AND at >= ${since} GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 8`),
    many(`SELECT referrer AS label, COUNT(*) AS value FROM page_views WHERE referrer IS NOT NULL AND at >= ${since} GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 8`),
    many(`SELECT portfolio_slug AS label, COUNT(*) AS value FROM page_views WHERE kind = 'portfolio' AND at >= ${since} GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 8`),
    one<{ portfolios: unknown; published: unknown; domains: unknown; investigator: unknown; ai_cost: unknown; ai_requests: unknown }>(`SELECT
      (SELECT COUNT(*) FROM portfolios) AS portfolios,
      (SELECT COUNT(*) FROM portfolios WHERE published_at IS NOT NULL AND slug IS NOT NULL) AS published,
      (SELECT COUNT(*) FROM custom_domains WHERE verified_at IS NOT NULL) AS domains,
      (SELECT COUNT(*) FROM investigator_settings WHERE enabled) AS investigator,
      (SELECT COALESCE(SUM(micro_usd), 0) FROM ai_spend WHERE day >= (${since})::date) AS ai_cost,
      (SELECT COALESCE(SUM(requests), 0) FROM ai_spend WHERE day >= (${since})::date) AS ai_requests`),
    one<{ support: unknown; submissions: unknown; moderation: unknown }>(`SELECT
      (SELECT COUNT(*) FROM support_tickets WHERE status = 'open') AS support,
      (SELECT COUNT(*) FROM gallery_submissions WHERE status = 'pending') AS submissions,
      (SELECT COUNT(*) FROM community_posts WHERE status = 'pending') AS moderation`),
    db.query<{ at: Date; email: string | null; what: string; cents: number }>(`SELECT * FROM (
        SELECT o.paid_at AS at, u.email, CASE WHEN o.kind IN ('plan', 'renewal') THEN initcap(o.plan) || CASE WHEN o.term_months = 1 THEN ' plan, monthly' ELSE ' plan, yearly' END ELSE o.credits || ' AI credits' END AS what, o.amount_cents AS cents
          FROM billing_orders o JOIN app_users u ON u.id = o.owner_id WHERE o.status = 'paid'
        UNION ALL
        SELECT d.created_at, u.email, 'Domain ' || d.domain, d.charged_cents FROM domain_orders d JOIN app_users u ON u.id = d.owner_id WHERE d.${PAID_DOMAIN} AND d.charged_cents > 0
      ) p ORDER BY at DESC LIMIT 8`).then((result) => result.rows),
    db.query<{ at: Date; email: string | null; name: string | null; plan: string; provider: string }>(`SELECT created_at AS at, email, name, plan, provider FROM app_users WHERE ${CUSTOMER} ORDER BY created_at DESC LIMIT 8`).then((result) => result.rows),
  ]);

  const count = (id: string) => n(planRows.find((row) => row.plan === id)?.count);
  const paying = count("pro-year") + count("pro-month") + count("grace");
  const cohort = n(subs.cohort);
  const label = (date: Date) => date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

  return {
    range, bucket,
    buckets: bucketRows.map((row) => ({ start: row.start.toISOString(), label: bucket === "week" ? `w/c ${label(row.start)}` : label(row.start) })),
    series,
    revenue: {
      plans: dollars(money.plans), credits: dollars(money.credits), domains: dollars(money.domains), domainCost: dollars(money.domain_cost),
      total: dollars(n(money.plans) + n(money.credits) + n(money.domains)), previous: dollars(moneyBefore.total),
      runRate: (count("pro-year") * PLANS.pro.prices.year! + count("pro-month") * PLANS.pro.prices.month! * 12) / 100,
    },
    users: { total: n(users.total), added: n(users.added), previousAdded: n(users.previous), verified: n(users.verified), google: n(users.google), password: n(users.password) },
    plans: [{ id: "pro-year", name: "Pro, yearly", count: count("pro-year") }, { id: "pro-month", name: "Pro, monthly", count: count("pro-month") }, { id: "grace", name: "Pro ending", count: count("grace") }, { id: "basic", name: "Basic (free)", count: count("basic") + count("lapsed") }],
    subscribers: { paying, free: count("basic") + count("lapsed"), lapsed: count("lapsed"), conversion: cohort ? n(subs.paid) / cohort : null },
    visitors: {
      total: n(visits.visitors), previous: n(visitsBefore.visitors), views: n(visits.views), portfolioViews: n(visits.portfolio_views),
      devices, pages, referrers, portfolios: portfolioRanks,
    },
    product: { portfolios: n(product.portfolios), published: n(product.published), domains: n(product.domains), investigatorOn: n(product.investigator), aiCost: n(product.ai_cost) / 1_000_000, aiRequests: n(product.ai_requests) },
    inbox: { support: n(inbox.support), submissions: n(inbox.submissions), moderation: n(inbox.moderation) },
    recentPayments: payments.map((row) => ({ at: row.at.toISOString(), email: row.email ?? "—", what: row.what, cents: n(row.cents) })),
    recentSignups: signups.map((row) => ({ at: row.at.toISOString(), email: row.email ?? "—", name: row.name ?? "", plan: row.plan, provider: row.provider })),
  };
}

import { jsonError, route } from "@/lib/api/http";
import { creditHistory } from "@/lib/billing/credits";
import { CREDIT_PACKS } from "@/lib/billing/credits";
import { platformAiConfigured } from "@/lib/ai/metering";
import { stripeConfigured } from "@/lib/payments/stripe";
import { db } from "@/utils/db";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

/** Plan, renewal, credits and payment history for the account page. */
export const GET = route(async () => {
  if (!databaseConfigured()) return jsonError(503, "Accounts are not configured on this server.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in first.");
  const settings = (await db.query<{ auto_renew: boolean; emails_opt_out: boolean; anthropic_key_hint: string | null; has_card: boolean }>(
    "SELECT auto_renew, emails_opt_out, anthropic_key_hint, stripe_payment_method IS NOT NULL AS has_card FROM app_users WHERE id = $1", [user.id])).rows[0]!;
  const orders = await db.query<{ id: string; kind: string; plan: string | null; term_years: number | null; credits: number | null; amount_cents: number; status: string; created_at: Date }>(
    "SELECT id, kind, plan, term_years, credits, amount_cents, status, created_at FROM billing_orders WHERE owner_id = $1 AND status <> 'awaiting_payment' ORDER BY created_at DESC LIMIT 20", [user.id]);
  return Response.json({
    plan: { id: user.plan.id, name: user.plan.name, standing: user.standing.standing, daysLeft: user.standing.daysLeft, endsAt: user.standing.endsAt.toISOString(), autoRenew: settings.auto_renew, hasCard: settings.has_card },
    ai: { credits: user.credits, keyHint: settings.anthropic_key_hint, platformAi: platformAiConfigured(), packs: CREDIT_PACKS, history: await creditHistory(user.id) },
    emailsOptOut: settings.emails_opt_out,
    payments: stripeConfigured(),
    orders: orders.rows.map((row) => ({ ...row, created_at: row.created_at.toISOString() })),
  });
});

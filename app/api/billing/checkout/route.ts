import { jsonError, readJson, route } from "@/lib/api/http";
import { BillingError, startCreditsCheckout, startPlanCheckout } from "@/lib/billing/service";
import { appOrigin, stripeConfigured } from "@/lib/payments/stripe";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

/** Starts Stripe Checkout for Pro ({ plan, interval: "year" | "month" }) or a credit pack ({ credits }). */
export const POST = route(async (request: Request) => {
  if (!databaseConfigured() || !stripeConfigured()) return jsonError(503, "Payments aren’t switched on for this site yet.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to continue.");
  const body = await readJson(request, 500);
  if (body instanceof Response) return body;
  const { plan, interval, credits } = (body ?? {}) as { plan?: unknown; interval?: unknown; credits?: unknown };
  try {
    const url = credits !== undefined ? await startCreditsCheckout(user, credits, appOrigin(request)) : await startPlanCheckout(user, plan, interval ?? "year", appOrigin(request));
    return Response.json({ url });
  } catch (error) {
    if (error instanceof BillingError) return jsonError(error.status, error.message);
    if ((error as { type?: string }).type?.startsWith?.("Stripe")) { console.error("Stripe checkout failed", error); return jsonError(502, "The payment page couldn’t be opened. Please try again."); }
    throw error;
  }
});


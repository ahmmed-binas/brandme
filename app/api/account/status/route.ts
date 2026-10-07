import { route } from "@/lib/api/http";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

/** Where the signed-in account stands (plan, Pro grace period…), for banners. Signed-out visitors get null. */
export const GET = route(async () => {
  if (!databaseConfigured()) return Response.json({ account: null });
  const user = await getCurrentUser();
  if (!user) return Response.json({ account: null });
  return Response.json({ account: {
    plan: user.plan.id, planName: user.plan.name, standing: user.standing.standing,
    daysLeft: user.standing.daysLeft, endsAt: user.standing.endsAt?.toISOString() ?? null, interval: user.standing.interval, credits: user.credits, ownKey: user.hasOwnKey,
    username: user.username, emailVerified: user.emailVerified,
  } });
});

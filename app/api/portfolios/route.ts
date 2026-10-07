import { jsonError, route } from "@/lib/api/http";
import { listDrafts } from "@/lib/portfolio/repository";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

/** The signed-in user's portfolios and plan, for the account page. Content is omitted to keep it small. */
export const GET = route(async () => {
  if (!databaseConfigured()) return jsonError(503, "Account saving is not configured on this server.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to see your portfolios.");
  const drafts = await listDrafts(user.id);
  return Response.json({
    plan: user.plan,
    standing: { state: user.standing.standing, daysLeft: user.standing.daysLeft, endsAt: user.standing.endsAt?.toISOString() ?? null },
    credits: user.credits,
    ownKey: user.hasOwnKey,
    portfolios: drafts.map(({ content, ...draft }) => ({ ...draft, name: (content.name ?? (content.personal as { name?: string } | undefined)?.name ?? "") as string })),
  });
});

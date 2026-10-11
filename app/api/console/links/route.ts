import { jsonError, route } from "@/lib/api/http";
import { consoleHref } from "@/lib/console/path";
import { getCurrentUser } from "@/utils/user-account";

/**
 * The console's links, for the superadmin's account menu. Answers only a
 * superadmin signed in through the console; everyone else gets "not found",
 * so the secret console address is never shown to anyone else.
 */
export const GET = route(async () => {
  const user = await getCurrentUser().catch(() => null);
  if (!user?.isSuperadmin) return jsonError(404, "Not found.");
  return Response.json(
    {
      links: [
        { href: consoleHref(), label: "Console dashboard" },
        { href: consoleHref("/activity"), label: "Visitor activity" },
        { href: consoleHref("/users"), label: "Users" },
        { href: "/templates/review", label: "Template approvals" },
      ],
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
});

import { hasInternalCookie, internalCookieHeader } from "@/lib/accounts/internal";
import { isLeadKind, recordLead } from "@/lib/analytics/leads";
import { recordView } from "@/lib/analytics/track";
import { tooManyAttempts } from "@/lib/accounts/passwords";
import { getCurrentUser } from "@/utils/user-account";

/**
 * Page-view and lead-click beacon (components/common/VisitBeacon.tsx).
 * Always answers 204; counting never breaks a page.
 */
export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "local";
    // Cheap in-memory cap so a script can't fill the visits table: 300 views an hour per visitor.
    if (tooManyAttempts(`view:${ip}`, 300, 60 * 60_000)) return new Response(null, { status: 204 });
    const raw = await request.text();
    if (raw.length > 2_000) return new Response(null, { status: 204 });
    const body = JSON.parse(raw) as {
      path?: unknown;
      referrer?: unknown;
      timeZone?: unknown;
      lead?: unknown;
    };
    // The owner's and team's own visits aren't counted (lib/accounts/internal.ts).
    if (hasInternalCookie(request)) return new Response(null, { status: 204 });
    const viewer = await getCurrentUser().catch(() => null);
    if (viewer?.internal)
      return new Response(null, { status: 204, headers: { "Set-Cookie": internalCookieHeader() } });
    // A click on one of Fuccura's own WhatsApp or email buttons (VisitBeacon), not a page view.
    if (typeof body.path === "string" && isLeadKind(body.lead) && body.lead !== "contact") {
      const user = viewer;
      if (!user?.isSuperadmin)
        await recordLead({
          kind: body.lead,
          page: body.path,
          ip,
          userAgent: request.headers.get("user-agent") ?? "",
          userId: user?.id ?? null,
        });
    } else if (typeof body.path === "string" && body.timeZone === "UTC") {
      // Real phones and laptops report a place ("Asia/Dubai"); a bare "UTC" comes from
      // crawlers rendering the page and link previews (WhatsApp, Facebook), seen in pairs
      // of one-page visits. Not counted, so the console shows people.
    } else if (typeof body.path === "string") {
      // Signed-in visitors are linked to their account so the owner can see their journey.
      const user = viewer;
      await recordView({
        host: request.headers.get("host") ?? "",
        path: body.path,
        referrer: typeof body.referrer === "string" ? body.referrer : null,
        ip,
        userAgent: request.headers.get("user-agent") ?? "",
        userId: user && !user.isSuperadmin ? user.id : null,
        timeZone: typeof body.timeZone === "string" ? body.timeZone : null,
      });
    }
  } catch (error) {
    console.error("Visit not recorded", (error as Error).message);
  }
  return new Response(null, { status: 204 });
}

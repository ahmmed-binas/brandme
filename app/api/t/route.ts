import { recordView } from "@/lib/analytics/track";

/** Page-view beacon (components/common/VisitBeacon.tsx). Always answers 204; counting never breaks a page. */
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 2_000) return new Response(null, { status: 204 });
    const body = JSON.parse(raw) as { path?: unknown; referrer?: unknown };
    if (typeof body.path === "string") {
      await recordView({
        host: request.headers.get("host") ?? "",
        path: body.path,
        referrer: typeof body.referrer === "string" ? body.referrer : null,
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local",
        userAgent: request.headers.get("user-agent") ?? "",
      });
    }
  } catch (error) {
    console.error("Visit not recorded", (error as Error).message);
  }
  return new Response(null, { status: 204 });
}

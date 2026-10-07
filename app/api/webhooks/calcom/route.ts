import { route } from "@/lib/api/http";
import { bookingWebhookConfigured, recordBooking, validSignature } from "@/lib/booking";

/**
 * Cal.com webhook. In Cal.com: Settings → Developer → Webhooks → New, with the
 * URL https://<your domain>/api/webhooks/calcom, the same secret as
 * CALCOM_WEBHOOK_SECRET, and the events Booking created, rescheduled and cancelled.
 */
export const POST = route(async (request: Request) => {
  if (!bookingWebhookConfigured()) return new Response("Bookings are not configured.", { status: 503 });
  const body = await request.text();
  if (body.length > 100_000) return new Response("Too large.", { status: 413 });
  if (!validSignature(body, request.headers.get("x-cal-signature-256"))) return new Response("Invalid signature.", { status: 401 });
  let event: { triggerEvent?: unknown; payload?: unknown };
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON.", { status: 400 });
  }
  const stored = typeof event.triggerEvent === "string" && event.payload && typeof event.payload === "object"
    ? await recordBooking(event.triggerEvent, event.payload as Parameters<typeof recordBooking>[1]) : false;
  return Response.json({ received: true, stored });
});

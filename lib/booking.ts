import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";

/**
 * "Book a free call" with the owner, through Cal.com (free plan).
 *
 * - BOOKING_URL is the owner's Cal.com event, e.g. https://cal.com/yourname/free-call.
 *   Cal.com shows the free times, takes the booking and emails both sides a
 *   confirmation with a calendar invite. Every "Book a free call" button links
 *   to /book, which sends people to the contact page until it's set.
 * - CALCOM_WEBHOOK_SECRET (optional) lets Cal.com tell us about each booking,
 *   so the console can list upcoming calls. Cal.com signs every webhook with
 *   HMAC-SHA256 of the raw body in the X-Cal-Signature-256 header.
 */

export function bookingUrl(): string | null {
  const value = process.env.BOOKING_URL?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export const bookingWebhookConfigured = () => Boolean(process.env.CALCOM_WEBHOOK_SECRET);

export function validSignature(body: string, signature: string | null): boolean {
  const secret = process.env.CALCOM_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(body).digest("hex"));
  const given = Buffer.from(signature.trim());
  return expected.length === given.length && timingSafeEqual(expected, given);
}

interface CalPayload {
  uid?: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  attendees?: { name?: string; email?: string; timeZone?: string }[];
  responses?: Record<string, { value?: unknown } | unknown>;
  additionalNotes?: string;
}

const STATUS: Record<string, "booked" | "rescheduled" | "cancelled"> = { BOOKING_CREATED: "booked", BOOKING_RESCHEDULED: "rescheduled", BOOKING_CANCELLED: "cancelled" };

/** Stores or updates one booking from a Cal.com webhook. Returns false for events we don't track. */
export async function recordBooking(trigger: string, payload: CalPayload): Promise<boolean> {
  const status = STATUS[trigger];
  const start = payload.startTime ? new Date(payload.startTime) : null;
  if (!status || !payload.uid || !start || Number.isNaN(start.getTime())) return false;
  const attendee = payload.attendees?.[0];
  const notes = typeof payload.additionalNotes === "string" ? payload.additionalNotes : null;
  const clip = (value: unknown, length: number) => (typeof value === "string" ? value.slice(0, length) : null);
  await ensureSchema();
  await db.query(
    `INSERT INTO call_bookings (uid, status, title, starts_at, ends_at, name, email, time_zone, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (uid) DO UPDATE SET status = EXCLUDED.status, title = EXCLUDED.title, starts_at = EXCLUDED.starts_at, ends_at = EXCLUDED.ends_at,
       name = EXCLUDED.name, email = EXCLUDED.email, time_zone = EXCLUDED.time_zone, notes = COALESCE(EXCLUDED.notes, call_bookings.notes), updated_at = NOW()`,
    [payload.uid.slice(0, 200), status, clip(payload.title, 300) ?? "Call", start, payload.endTime ? new Date(payload.endTime) : null,
      clip(attendee?.name, 200), clip(attendee?.email, 320), clip(attendee?.timeZone, 80), notes?.slice(0, 2000) ?? null],
  );
  return true;
}

export interface CallBooking { uid: string; status: string; title: string; startsAt: Date; name: string | null; email: string | null; timeZone: string | null; notes: string | null }

export async function listBookings(upcoming: boolean, limit = 50): Promise<CallBooking[]> {
  await ensureSchema();
  const result = await db.query<{ uid: string; status: string; title: string; starts_at: Date; name: string | null; email: string | null; time_zone: string | null; notes: string | null }>(
    `SELECT uid, status, title, starts_at, name, email, time_zone, notes FROM call_bookings WHERE ${upcoming ? "starts_at >= NOW() - INTERVAL '1 hour' ORDER BY starts_at" : "starts_at < NOW() - INTERVAL '1 hour' ORDER BY starts_at DESC"} LIMIT $1`,
    [limit],
  );
  return result.rows.map((row) => ({ uid: row.uid, status: row.status, title: row.title, startsAt: row.starts_at, name: row.name, email: row.email, timeZone: row.time_zone, notes: row.notes }));
}

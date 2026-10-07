import ConsoleLogin from "@/components/console/ConsoleLogin";
import Shell from "@/components/console/Shell";
import { bookingUrl, bookingWebhookConfigured, listBookings, type CallBooking } from "@/lib/booking";
import { getCurrentUser } from "@/utils/user-account";

export const dynamic = "force-dynamic";

const when = (date: Date) => date.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";

function Table({ rows, empty }: { rows: CallBooking[]; empty: string }) {
  return <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--c-line)] bg-[var(--c-panel)]">
    <table className="w-full min-w-[720px] text-left text-[12.5px]">
      <thead className="text-[var(--c-muted)]"><tr>{["When", "Who", "Email", "Their time zone", "Status", "Notes"].map((head) => <th key={head} className="px-4 py-3 font-medium">{head}</th>)}</tr></thead>
      <tbody>{rows.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--c-muted)]">{empty}</td></tr> : rows.map((row) => <tr key={row.uid} className="border-t border-[var(--c-line)]">
        <td className="whitespace-nowrap px-4 py-2.5">{when(row.startsAt)}</td>
        <td className="px-4 py-2.5">{row.name ?? "–"}</td>
        <td className="px-4 py-2.5">{row.email ? <a href={`mailto:${row.email}`} className="underline">{row.email}</a> : "–"}</td>
        <td className="px-4 py-2.5 text-[var(--c-text2)]">{row.timeZone ?? "–"}</td>
        <td className={`px-4 py-2.5 ${row.status === "cancelled" ? "text-[var(--c-muted)] line-through" : ""}`}>{row.status}</td>
        <td className="max-w-[18rem] truncate px-4 py-2.5 text-[var(--c-text2)]" title={row.notes ?? undefined}>{row.notes ?? ""}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

/** Free calls people booked with the owner through Cal.com. */
export default async function ConsoleCalls() {
  const user = await getCurrentUser().catch(() => null);
  if (!user?.isSuperadmin) return <ConsoleLogin />;
  const [upcoming, past] = await Promise.all([listBookings(true), listBookings(false, 20)]);
  const ready = Boolean(bookingUrl());

  return <Shell active="Calls" email={user.email}>
    <header><p className="text-[12px] uppercase tracking-[0.16em] text-[var(--c-muted)]">Calls</p><h1 className="mt-1 text-[1.5rem] font-semibold tracking-tight">Booked calls</h1></header>
    {(!ready || !bookingWebhookConfigured()) && <p className="mt-5 rounded-lg border border-[var(--c-line)] bg-[var(--c-panel)] px-4 py-3 text-[13px] text-[var(--c-text2)]">
      {!ready ? "Set BOOKING_URL to your Cal.com event link so “Book a free call” opens your calendar. Until then it opens the contact page. " : ""}
      {!bookingWebhookConfigured() ? "To list bookings here, add a webhook in Cal.com (Settings → Developer → Webhooks) to /api/webhooks/calcom and put the same secret in CALCOM_WEBHOOK_SECRET. Cal.com emails you every booking either way." : ""}
    </p>}
    <h2 className="mt-8 text-[14px] font-semibold">Coming up</h2>
    <Table rows={upcoming} empty="No calls booked yet." />
    <h2 className="mt-8 text-[14px] font-semibold">Earlier</h2>
    <Table rows={past} empty="None yet." />
  </Shell>;
}

import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import { emails } from "@/lib/email/templates";
import { sendMail, supportInbox } from "@/lib/email/mailer";
import { findBlockedTerm } from "@/lib/community/rules";

/**
 * Private support conversations between a customer and the team. Unlike
 * community posts, nothing here is public. Staff are the ADMIN_EMAILS accounts.
 */

export const SUPPORT_CATEGORIES = ["Billing & plans", "Domains", "The editor", "AI & credits", "My account", "Something else"] as const;
export const SUPPORT_LIMITS = { subject: { min: 4, max: 140 }, body: { min: 10, max: 5000 }, ticketsPerDay: 5, messagesPerHour: 20 } as const;

export interface TicketMessage { id: string; body: string; fromStaff: boolean; authorName: string | null; createdAt: string }
export interface Ticket { id: string; subject: string; category: string; status: "open" | "answered" | "closed"; createdAt: string; updatedAt: string; owner: { id: string; name: string | null; email: string | null; plan: string }; messages: TicketMessage[] }

type Refusal = { ok: false; status: 404 | 422 | 429; error: string };

function checkBody(body: string): Refusal | null {
  const text = body.trim();
  if (text.length < SUPPORT_LIMITS.body.min) return { ok: false, status: 422, error: "Tell us a little more so we can help." };
  if (text.length > SUPPORT_LIMITS.body.max) return { ok: false, status: 422, error: "Please keep messages under 5,000 characters." };
  if (findBlockedTerm(text)) return { ok: false, status: 422, error: "That message looks like spam, so it wasn’t sent." };
  return null;
}

export async function createTicket(owner: { id: string; name: string | null; email: string | null }, input: { subject: string; category: string; body: string }): Promise<{ ok: true; id: string } | Refusal> {
  await ensureSchema();
  const subject = input.subject.trim();
  if (subject.length < SUPPORT_LIMITS.subject.min || subject.length > SUPPORT_LIMITS.subject.max) return { ok: false, status: 422, error: "Give your request a short subject (4–140 characters)." };
  if (!SUPPORT_CATEGORIES.includes(input.category as (typeof SUPPORT_CATEGORIES)[number])) return { ok: false, status: 422, error: "Choose what your request is about." };
  const invalid = checkBody(input.body);
  if (invalid) return invalid;
  const recent = await db.query<{ count: string }>("SELECT COUNT(*) AS count FROM support_tickets WHERE owner_id = $1 AND created_at > NOW() - INTERVAL '1 day'", [owner.id]);
  if (Number(recent.rows[0]?.count ?? 0) >= SUPPORT_LIMITS.ticketsPerDay) return { ok: false, status: 429, error: "You’ve opened several requests today. Please add to an existing one instead." };
  const ticket = await db.query<{ id: string }>("INSERT INTO support_tickets (owner_id, subject, category) VALUES ($1, $2, $3) RETURNING id", [owner.id, subject, input.category]);
  const id = ticket.rows[0]!.id;
  await db.query("INSERT INTO support_messages (ticket_id, author_id, from_staff, body) VALUES ($1, $2, FALSE, $3)", [id, owner.id, input.body.trim()]);
  const inbox = supportInbox();
  await Promise.allSettled([
    inbox ? sendMail({ to: inbox, replyTo: owner.email ?? undefined, ...emails.supportNew(`${owner.name ?? "Someone"} <${owner.email ?? "no email"}>`, subject, input.category, input.body.trim()) }) : Promise.resolve(),
    owner.email ? sendMail({ to: owner.email, ...emails.supportReceived(owner.name, subject) }) : Promise.resolve(),
  ]);
  return { ok: true, id };
}

export async function addMessage(ticketId: string, author: { id: string; name: string | null; email: string | null; isStaff: boolean }, body: string): Promise<{ ok: true } | Refusal> {
  await ensureSchema();
  const invalid = checkBody(body);
  if (invalid) return invalid;
  const ticket = (await db.query<{ owner_id: string; subject: string; status: string; email: string | null; name: string | null }>(
    "SELECT t.owner_id, t.subject, t.status, u.email, u.name FROM support_tickets t JOIN app_users u ON u.id = t.owner_id WHERE t.id = $1", [ticketId])).rows[0];
  if (!ticket || (!author.isStaff && ticket.owner_id !== author.id)) return { ok: false, status: 404, error: "That request wasn’t found." };
  const fromStaff = author.isStaff && ticket.owner_id !== author.id;
  if (!fromStaff) {
    const recent = await db.query<{ count: string }>("SELECT COUNT(*) AS count FROM support_messages WHERE author_id = $1 AND created_at > NOW() - INTERVAL '1 hour'", [author.id]);
    if (Number(recent.rows[0]?.count ?? 0) >= SUPPORT_LIMITS.messagesPerHour) return { ok: false, status: 429, error: "Please wait a little before sending more messages." };
  }
  await db.query("INSERT INTO support_messages (ticket_id, author_id, from_staff, body) VALUES ($1, $2, $3, $4)", [ticketId, author.id, fromStaff, body.trim()]);
  await db.query("UPDATE support_tickets SET status = $2, updated_at = NOW() WHERE id = $1", [ticketId, fromStaff ? "answered" : "open"]);
  if (fromStaff && ticket.email) await sendMail({ to: ticket.email, ...emails.supportReply(ticket.name, ticket.subject, body.trim()) }).catch((error) => console.error("Support reply email failed", error));
  if (!fromStaff) { const inbox = supportInbox(); if (inbox) await sendMail({ to: inbox, replyTo: author.email ?? undefined, ...emails.supportNew(`${author.name ?? "Customer"} <${author.email ?? ""}>`, `Re: ${ticket.subject}`, "Reply", body.trim()) }).catch(() => undefined); }
  return { ok: true };
}

export async function setTicketStatus(ticketId: string, actor: { id: string; isStaff: boolean }, status: "open" | "closed"): Promise<boolean> {
  await ensureSchema();
  const result = await db.query("UPDATE support_tickets SET status = $2, updated_at = NOW() WHERE id = $1 AND ($3 OR owner_id = $4)", [ticketId, status, actor.isStaff, actor.id]);
  return Boolean(result.rowCount);
}

/** The owner's own tickets, or for staff every ticket (open first). */
export async function listTickets(viewer: { id: string; isStaff: boolean }, scope: "mine" | "queue"): Promise<Ticket[]> {
  await ensureSchema();
  const staffQueue = scope === "queue" && viewer.isStaff;
  const tickets = await db.query<{ id: string; subject: string; category: string; status: Ticket["status"]; created_at: Date; updated_at: Date; owner_id: string; name: string | null; email: string | null; plan: string }>(
    `SELECT t.id, t.subject, t.category, t.status, t.created_at, t.updated_at, t.owner_id, u.name, u.email, u.plan FROM support_tickets t JOIN app_users u ON u.id = t.owner_id
     WHERE ${staffQueue ? "TRUE" : "t.owner_id = $1"} ORDER BY ${staffQueue ? "(t.status = 'open') DESC, t.updated_at" : "t.updated_at DESC"} LIMIT 100`,
    staffQueue ? [] : [viewer.id],
  );
  if (!tickets.rowCount) return [];
  const messages = await db.query<{ id: string; ticket_id: string; body: string; from_staff: boolean; name: string | null; created_at: Date }>(
    "SELECT m.id, m.ticket_id, m.body, m.from_staff, u.name, m.created_at FROM support_messages m LEFT JOIN app_users u ON u.id = m.author_id WHERE m.ticket_id = ANY($1) ORDER BY m.created_at",
    [tickets.rows.map((row) => row.id)],
  );
  return tickets.rows.map((row) => ({
    id: row.id, subject: row.subject, category: row.category, status: row.status, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
    owner: { id: row.owner_id, name: row.name, email: staffQueue ? row.email : null, plan: row.plan },
    messages: messages.rows.filter((message) => message.ticket_id === row.id).map((message) => ({ id: message.id, body: message.body, fromStaff: message.from_staff, authorName: message.from_staff ? "Formora support" : message.name, createdAt: message.created_at.toISOString() })),
  }));
}

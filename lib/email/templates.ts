import { siteUrl } from "@/lib/site";
import { brand } from "@/lib/brand";

/**
 * Lifecycle emails. Short, warm and specific: what's happening, what it means
 * for their site, and one thing they can do. Each returns a subject, plain
 * text (always) and a simple HTML version with the same words.
 */

interface Built { subject: string; text: string; html: string }

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

function layout(subject: string, paragraphs: string[], cta?: { label: string; url: string }, footer?: string): Built {
  const text = [...paragraphs, cta ? `${cta.label}: ${cta.url}` : "", "", `— ${brand.name}`, footer ?? ""].filter((line, index, all) => line || all[index - 1]).join("\n\n").trim();
  const html = `<!doctype html><html><body style="margin:0;background:#f4f0e8;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#15140f">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:520px;background:#fffdf8;border:1px solid #e3ddd0;border-radius:14px" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 32px 28px">
<p style="margin:0 0 24px;font-family:Georgia,serif;font-size:20px">${escape(brand.name)}</p>
${paragraphs.map((paragraph) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6">${escape(paragraph)}</p>`).join("")}
${cta ? `<p style="margin:24px 0 8px"><a href="${escape(cta.url)}" style="display:inline-block;background:#15140f;color:#f4f0e8;text-decoration:none;padding:12px 20px;border-radius:999px;font-size:14px">${escape(cta.label)}</a></p>` : ""}
</td></tr></table>
<p style="max-width:520px;margin:16px auto 0;font-size:12px;line-height:1.5;color:#7a766c">${escape(footer ?? `You’re receiving this because you have a ${brand.name} account.`)} <a href="${siteUrl}/account#emails" style="color:#7a766c">Email preferences</a></p>
</td></tr></table></body></html>`;
  return { subject, text, html };
}

const first = (name: string | null) => (name ?? "").split(/\s+/)[0] || "there";
const date = (value: Date) => value.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export const emails = {
  welcome: (name: string | null) => layout(`Welcome to ${brand.name}`, [
    `Hi ${first(name)},`,
    `Your account is ready, and Basic is free for as long as you like: every template, a free address for your site and a blog. Most people publish in under an hour.`,
    `A good first step is importing what you already have: a CV, your LinkedIn export or your GitHub. We’ll lay it out for you.`,
  ], { label: "Open the editor", url: `${siteUrl}/templatechooser` }),

  proEnding: (name: string | null, days: number) => layout(`Your Pro plan ends in ${days} day${days === 1 ? "" : "s"}`, [
    `Hi ${first(name)},`,
    `Your Pro plan has ended, and we’ve kept everything working for another ${days} day${days === 1 ? "" : "s"} while you decide.`,
    `After that your account moves to Basic, which is free. Your first published site stays online; any others rest (visitors see a short holding page) and nothing is deleted. Renew whenever you like and they come straight back.`,
  ], { label: "Renew Pro", url: `${siteUrl}/pricing` }),

  investigatorReport: (name: string | null, changes: { title: string; applied: boolean }[], unreadable: string[], liveUrl: string | null) => {
    const applied = changes.filter((change) => change.applied);
    const waiting = changes.filter((change) => !change.applied);
    return layout(applied.length ? `Your website is up to date: ${applied.length} change${applied.length === 1 ? "" : "s"}` : `The Investigator found ${waiting.length} update${waiting.length === 1 ? "" : "s"} for you`, [
      `Hi ${first(name)},`,
      applied.length ? `The Investigator checked your profiles and updated your website:` : `The Investigator checked your profiles and found something new. Nothing changes on your site until you add it:`,
      ...[...applied, ...waiting].slice(0, 8).map((change) => `• ${change.title}${change.applied ? "" : " (waiting for you)"}`),
      ...(applied.length && waiting.length ? [`${waiting.length} more ${waiting.length === 1 ? "is" : "are"} waiting for you to check, because we weren’t completely sure.`] : []),
      ...(applied.length ? ["Not right? You can undo any automatic change for 30 days from the Investigator page."] : []),
      ...(unreadable.length ? [`We couldn’t read ${unreadable.join(", ")} without logging in, which we never do. If something changed there, add it in the editor or upload your export.`] : []),
    ], applied.length && liveUrl ? { label: "See your website", url: liveUrl } : { label: "Review the updates", url: `${siteUrl}/account/investigator` });
  },

  domainRenewalDue: (name: string | null, domain: string, expires: Date, price: string) => layout(`${domain} needs renewing by ${date(expires)}`, [
    `Hi ${first(name)},`,
    `Your domain ${domain} is registered until ${date(expires)}. Renew it before then to keep your portfolio at that address.`,
    `Renewing costs ${price} for another year (the registrar’s price plus the card fee). Domains don’t renew on their own, so you’re never charged without saying yes.`,
    `If it expires, the address stops working and someone else could register it.`,
  ], { label: `Renew ${domain}`, url: `${siteUrl}/account/domains` }),

  domainRenewed: (name: string | null, domain: string, expires: Date) => layout(`${domain} is renewed`, [
    `Hi ${first(name)},`,
    `${domain} is renewed and now registered until ${date(expires)}. Nothing else changes; your portfolio stays at the same address.`,
  ], { label: "Your domains", url: `${siteUrl}/account/domains` }),

  receipt: (name: string | null, item: string, amount: string, until?: Date) => layout(`Receipt: ${item}`, [
    `Hi ${first(name)},`,
    `Thanks, your payment of ${amount} for ${item} went through.`,
    ...(until ? [`Your plan now runs until ${date(until)}.`] : []),
    `Changed your mind? Unused credits, and Pro within 14 days of paying, can be refunded: reply to this email. Stripe keeps its card fee on a refund, so you get back the payment minus that fee.`,
    `Your card statement will show the payment from ${brand.name}. Reply to this email if anything looks wrong.`,
  ], { label: "Your account", url: `${siteUrl}/account` }),

  renewalSoon: (name: string | null, plan: string, amount: string, on: Date, autoRenew: boolean, interval = "year") => layout(autoRenew ? `Your ${plan} plan renews on ${date(on)}` : `Your ${plan} plan ends on ${date(on)}`, [
    `Hi ${first(name)},`,
    autoRenew ? `Your ${plan} plan renews on ${date(on)} for ${amount} for another ${interval}, using the card you paid with last time. You don’t need to do anything.` : `Your ${plan} plan ends on ${date(on)}. Renew for ${amount} a ${interval} to keep Pro without a break.`,
    autoRenew ? `If you’d rather not renew, you can switch it off in your account at any time before then.` : `If it ends, your account moves to free Basic after 14 days and nothing is deleted.`,
  ], { label: autoRenew ? "Manage renewal" : "Renew now", url: autoRenew ? `${siteUrl}/account` : `${siteUrl}/pricing` }),

  renewalFailed: (name: string | null, plan: string) => layout("We couldn’t renew your plan", [
    `Hi ${first(name)},`,
    `We tried to renew your ${plan} plan, but the card was declined. Pro keeps working for the next 14 days; after that your account moves to free Basic and nothing is deleted.`,
    `You can renew with another card in a minute.`,
  ], { label: "Renew now", url: `${siteUrl}/pricing` }),

  suggestions: (name: string | null, count: number) => layout(`${count} update${count === 1 ? "" : "s"} for your portfolio`, [
    `Hi ${first(name)},`,
    `We found ${count} new thing${count === 1 ? "" : "s"} you might want on your portfolio: new projects, talks, awards or roles.`,
    `Nothing has been changed. Have a look and add the ones you like with one click.`,
  ], { label: "Review updates", url: `${siteUrl}/account#updates` }),

  supportReceived: (name: string | null, subject: string) => layout(`We got your message: ${subject}`, [
    `Hi ${first(name)},`,
    `Thanks for getting in touch. A real person reads every message, and we usually reply within one working day.`,
  ], { label: "View your conversation", url: `${siteUrl}/community/support` }),

  supportReply: (name: string | null, subject: string, excerpt: string) => layout(`Re: ${subject}`, [
    `Hi ${first(name)},`,
    `We’ve replied to your support request:`,
    excerpt.length > 600 ? `${excerpt.slice(0, 600)}…` : excerpt,
  ], { label: "Read and reply", url: `${siteUrl}/community/support` }),

  supportNew: (from: string, subject: string, category: string, body: string) => layout(`[Support · ${category}] ${subject}`, [`From: ${from}`, body], { label: "Open support desk", url: `${siteUrl}/community/support` }, "Sent to the support inbox."),
};

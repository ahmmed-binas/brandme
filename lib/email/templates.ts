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
    `Your 14-day trial is on: every template, a free address for your site, and AI help to write it. Most people publish in under an hour.`,
    `A good first step is importing what you already have: a CV, your LinkedIn export or your GitHub. We’ll lay it out for you.`,
  ], { label: "Open the editor", url: `${siteUrl}/templatechooser` }),

  trialEndingSoon: (name: string | null, days: number) => layout(`Your trial ends in ${days} day${days === 1 ? "" : "s"}`, [
    `Hi ${first(name)},`,
    `Your free trial ends in ${days} day${days === 1 ? "" : "s"}. Nothing changes straight away: your site stays online for another 14 days after that, so there’s no rush.`,
    `When you’re ready, plans start at $10 a year, about the price of one coffee, and you can pay for two years at once and forget about it.`,
  ], { label: "See plans", url: `${siteUrl}/pricing` }),

  trialEnded: (name: string | null, graceEnds: Date) => layout("Your trial has ended (your site is still online)", [
    `Hi ${first(name)},`,
    `Your free trial has ended, but we’ve kept your site online until ${date(graceEnds)} so nobody visiting it notices.`,
    `Choose a plan before then and nothing changes at all. If you decide not to, your site will rest quietly; everything you made stays saved and comes back the moment you pick a plan.`,
  ], { label: "Keep my site online", url: `${siteUrl}/pricing` }),

  graceEnding: (name: string | null, days: number) => layout(`Your site goes offline in ${days} day${days === 1 ? "" : "s"}`, [
    `Hi ${first(name)},`,
    `Just a friendly reminder: your portfolio will rest in ${days} day${days === 1 ? "" : "s"} unless you choose a plan. Visitors would see a short “taking a break” page instead of your work.`,
    `It takes a minute, and Basic is $10 a year.`,
  ], { label: "Choose a plan", url: `${siteUrl}/pricing` }),

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

  domainRenewalDue: (name: string | null, domain: string, expires: Date, price: string, included: boolean) => layout(`${domain} needs renewing by ${date(expires)}`, [
    `Hi ${first(name)},`,
    `Your domain ${domain} is registered until ${date(expires)}. Renew it before then to keep your portfolio at that address.`,
    included ? `Your Premium plan includes the renewal, so there’s nothing to pay; just confirm it.` : `Renewing costs ${price} for another year. Domains don’t renew on their own, so you’re never charged without saying yes.`,
    `If it expires, the address stops working and someone else could register it.`,
  ], { label: `Renew ${domain}`, url: `${siteUrl}/account/domains` }),

  domainRenewed: (name: string | null, domain: string, expires: Date) => layout(`${domain} is renewed`, [
    `Hi ${first(name)},`,
    `${domain} is renewed and now registered until ${date(expires)}. Nothing else changes; your portfolio stays at the same address.`,
  ], { label: "Your domains", url: `${siteUrl}/account/domains` }),

  paused: (name: string | null) => layout("Your portfolio is resting", [
    `Hi ${first(name)},`,
    `Your portfolio is now resting. Nothing has been deleted: your content, images and address are all kept.`,
    `Whenever you’d like it back, choose a plan and it goes live again immediately.`,
  ], { label: "Bring it back", url: `${siteUrl}/pricing` }),

  receipt: (name: string | null, item: string, amount: string, until?: Date) => layout(`Receipt: ${item}`, [
    `Hi ${first(name)},`,
    `Thanks, your payment of ${amount} for ${item} went through.`,
    ...(until ? [`Your plan now runs until ${date(until)}. We’ll remind you two weeks before it renews.`] : []),
    `Your card statement will show the payment from ${brand.name}. Reply to this email if anything looks wrong.`,
  ], { label: "Your account", url: `${siteUrl}/account` }),

  renewalSoon: (name: string | null, plan: string, amount: string, on: Date, autoRenew: boolean) => layout(autoRenew ? `Your ${plan} plan renews on ${date(on)}` : `Your ${plan} plan ends on ${date(on)}`, [
    `Hi ${first(name)},`,
    autoRenew ? `Your ${plan} plan renews on ${date(on)} for ${amount} for another year, using the card you paid with last time. You don’t need to do anything.` : `Your ${plan} plan ends on ${date(on)}. Renew for ${amount} a year to keep your site online without a break.`,
    autoRenew ? `If you’d rather not renew, you can switch it off in your account at any time before then.` : `Your site stays up for 14 days after the end date either way.`,
  ], { label: autoRenew ? "Manage renewal" : "Renew now", url: autoRenew ? `${siteUrl}/account` : `${siteUrl}/pricing` }),

  renewalFailed: (name: string | null, plan: string) => layout("We couldn’t renew your plan", [
    `Hi ${first(name)},`,
    `We tried to renew your ${plan} plan, but the card was declined. Your site is still online for the next 14 days.`,
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

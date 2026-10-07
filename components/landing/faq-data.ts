import { PLANS, formatUsd } from "@/lib/plans";

/** Shared by the FAQ section and its FAQPage structured data, so they never drift apart. */
export const FAQ = [
  { q: "How much does it cost?", a: `One portfolio with a blog is free for as long as you like, with no card needed. Pro is ${formatUsd(PLANS.pro.prices.year!)} a year (or ${formatUsd(PLANS.pro.prices.month!)} a month) for up to three sites on your own domain without our link. AI is sold at what it costs us plus 5%, or you can use your own Claude key.` },
  { q: "Will my portfolio stay up to date?", a: "Yes, on every plan. The Investigator checks your own profiles on the schedule you choose, looks for new roles, talks, awards and articles, and either asks you first or updates your site for you. Your first check is free." },
  { q: "Can I use a domain I already own?", a: "Yes. Add two DNS records at your domain provider. The editor shows you exactly which ones, checks them for you, and switches the domain on with HTTPS as soon as they’re in place." },
  { q: "Will the AI make things up about me?", a: "No. The assistant only rewrites text you’ve written or imported, and it isn’t allowed to change your name, dates, links or skills. If a request needs facts it doesn’t have, it tells you what to add." },
  { q: "What can I import?", a: "A CV (PDF, Word, image or text), your public GitHub profile, or LinkedIn’s own data export. LinkedIn doesn’t let apps read work history directly, so the editor walks you through downloading it, and the file is read on your device." },
  { q: "Do I need to know how to code or design?", a: "No. You edit words, links and images; the template handles layout, type and spacing on every screen size." },
  { q: "Can I delete everything later?", a: "Yes. Deleting your account removes your portfolios and takes your pages offline straight away. A domain you bought stays registered in your name." },
];

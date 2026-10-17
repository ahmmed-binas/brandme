import { DEFAULT_PRICES, aed, type Prices } from "@/lib/offers";

/**
 * Shared by the FAQ section and its FAQPage structured data, so they never drift
 * apart. Built from the live prices (lib/settings/prices.ts).
 */
export const faqFor = (prices: Prices = DEFAULT_PRICES) => [
  {
    q: "How much does it cost?",
    a: `One portfolio with a blog is free for as long as you like, with no card needed. Pro is ${aed(prices.proMonth)} a month, or ${aed(prices.proYear)} a year with the first year’s domain free (up to ${aed(prices.freeDomainUpTo)}), for up to three sites on your own domain without our link. AI is sold at what it costs us plus 5%, or you can use your own Claude key.`,
  },
  {
    q: "Can real estate agents in the UAE use Kitefolio?",
    a: `Yes; they're who we built it for first. There are five real estate designs (Skyline, Manor, Front Door, Shoreline and Off Plan) with room for listings, areas and reviews. The Agent plan, ${aed(prices.agentMonth)} a month, adds listing pages, a WhatsApp button on your site and listings, your voice on listing videos, and ${prices.agentEditsPerMonth} changes a month done for you.`,
  },
  {
    q: "Can recruiters find my portfolio on Google?",
    a: "Yes. Published portfolios can be found on Google, titled with your name and job (for example “Sara Khan, Graphic Designer: Portfolio”). Switch on “Open to work” in the editor and your page shows a badge and says so in its Google title.",
  },
  {
    q: "Can you build my website for me?",
    a: `Yes. Our Done for you service is ${aed(prices.doneForYou)} once: we write and design your site from your CV, listings and photos, and it's live in 48 hours, with one round of changes before it goes live.`,
  },
  {
    q: "Will my portfolio stay up to date?",
    a: "Yes, on every plan. The Investigator checks your own profiles on the schedule you choose, looks for new roles, talks, awards and articles, and either asks you first or updates your site for you. Your first check is free.",
  },
  {
    q: "Can I use a domain I already own?",
    a: "Yes. Add two DNS records at your domain provider. The editor shows you exactly which ones, checks them for you, and switches the domain on with HTTPS as soon as they’re in place.",
  },
  {
    q: "Will the AI make things up about me?",
    a: "No. The assistant only rewrites text you’ve written or imported, and it isn’t allowed to change your name, dates, links or skills. If a request needs facts it doesn’t have, it tells you what to add.",
  },
  {
    q: "What can I import?",
    a: "A CV (PDF, Word, image or text), your public GitHub profile, or LinkedIn’s own data export. LinkedIn doesn’t let apps read work history directly, so the editor walks you through downloading it, and the file is read on your device.",
  },
  {
    q: "Do I need to know how to code or design?",
    a: "No. You edit words, links and images; the template handles layout, type and spacing on every screen size.",
  },
  {
    q: "Can I delete everything later?",
    a: "Yes. Deleting your account removes your portfolios and takes your pages offline straight away. A domain you bought stays registered in your name.",
  },
];

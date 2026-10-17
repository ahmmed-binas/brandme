import { brand } from "@/lib/brand";

/**
 * What Kitefolio sells and for how much, in UAE dirhams, as shown to customers.
 * Set with the owner on 12 October 2026, replacing "Pro $10 a year". Change
 * prices here: the pricing page, home page, terms and template FAQs read them.
 *
 *   Free          AED 0      the hook: one site, voice clone, calculators, CV import
 *   Pro           AED 35/mo  or AED 299/yr: own domain, no branding, 3 sites
 *   Agent         AED 99/mo  for real estate agents: Pro + listings, leads, 2 changes done a month
 *   Done for you  AED 499    one-off: we build the whole site in 48 hours
 *   Founding      AED 99/yr  Pro for the first 20 customers, price locked for good
 *
 * Until online checkout is live, every paid option starts on WhatsApp, where
 * the owner closes the sale (whatsappLink).
 */

export const AED_PER_USD = 3.6725;

export const PRICES = {
  proMonth: 35,
  proYear: 299,
  agentMonth: 99,
  doneForYou: 499,
  foundingYear: 99,
} as const;

/**
 * Yearly Pro (and founding members) get their first year's domain free, up to this
 * value, to match Wix and Squarespace. Never on monthly plans. We buy it only after
 * the customer has paid; renewals after the first year are the customer's.
 */
export const FREE_DOMAIN_UP_TO = 60;

/** How many customers get the founding price. */
export const FOUNDING_SPOTS = 20;
/** Changes the team makes each month for an Agent customer, on request. */
export const AGENT_EDITS_PER_MONTH = 2;

/**
 * Everything the superadmin can change in Console > Catalog. The values above
 * are the defaults; the live ones come from getPrices() in
 * lib/settings/prices.ts, which pages should use.
 */
export interface Prices {
  proMonth: number;
  proYear: number;
  agentMonth: number;
  doneForYou: number;
  foundingYear: number;
  foundingSpots: number;
  freeDomainUpTo: number;
  agentEditsPerMonth: number;
}

export const DEFAULT_PRICES: Prices = {
  ...PRICES,
  foundingSpots: FOUNDING_SPOTS,
  freeDomainUpTo: FREE_DOMAIN_UP_TO,
  agentEditsPerMonth: AGENT_EDITS_PER_MONTH,
};

/**
 * Competitors' cheapest paid plans, for the "Why Kitefolio" comparison on /pricing.
 * From their own pricing pages (yearly billing, before tax), converted at the
 * dirham peg. Re-check before changing, and update COMPETITORS_CHECKED.
 *   wix.com/plans: Light $17/month · squarespace.com/pricing: Basic $12/month
 */
export const COMPETITORS_CHECKED = "12 October 2026";
export const COMPETITORS = [
  { name: "Wix Light", usdPerMonth: 17, source: "https://www.wix.com/plans" },
  { name: "Squarespace Basic", usdPerMonth: 12, source: "https://www.squarespace.com/pricing" },
] as const;

/** A USD monthly price in whole dirhams, e.g. 17 → 62. */
export const usdToAed = (usd: number) => Math.round(usd * AED_PER_USD);

/** "AED 299" */
export const aed = (amount: number) => `AED ${amount.toLocaleString("en-GB")}`;

/** A WhatsApp chat with Kitefolio, with the customer's first message typed in for them. */
export const whatsappLink = (message: string) =>
  `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(message)}`;

export interface Offer {
  id: "free" | "pro" | "agent" | "done";
  name: string;
  price: string;
  per: string;
  /** A second way to pay, e.g. the yearly price. */
  alternative?: string;
  pitch: string;
  features: string[];
  cta: { label: string; href: string };
  highlight?: boolean;
}

/** The plans as shown to customers, for the given prices (lib/settings/prices.ts has the live ones). */
export function offersFor(prices: Prices): Offer[] {
  return [
    {
      id: "free",
      name: "Free",
      price: aed(0),
      per: "for good",
      pitch: "Your website online today, at a free Kitefolio address.",
      features: [
        "Every standard template, colour and font",
        "One live website with a blog",
        "AI voice clone: 5 clips a day",
        "UAE mortgage calculator and free tools",
        "A small “Made with Kitefolio” link",
      ],
      cta: { label: "Start free", href: "/templatechooser" },
    },
    {
      id: "pro",
      name: "Pro",
      price: aed(prices.proMonth),
      per: "a month",
      alternative: `or ${aed(prices.proYear)} a year, with a free domain for the first year`,
      pitch: "Your own domain and a site that looks fully yours.",
      features: [
        "Everything in Free",
        // The domain itself is the customer's (about AED 45 a year from any registrar, or through us at cost).
        "Your own domain with HTTPS (free for the first year on yearly Pro)",
        "No Kitefolio link on your site",
        "Up to three websites, all live",
        "AI voice clone: 50 clips a day, first in the queue",
        "1 GB of images",
      ],
      cta: { label: "Get Pro on WhatsApp", href: whatsappLink("Hi! I’d like Kitefolio Pro.") },
    },
    {
      id: "agent",
      name: "Agent",
      price: aed(prices.agentMonth),
      per: "a month",
      pitch: "For real estate agents in the UAE: a site that brings you leads.",
      features: [
        "Everything in Pro",
        "Listing pages for your properties",
        "A WhatsApp button on your site and listings",
        "Your voice narrating your listing videos",
        `${prices.agentEditsPerMonth} changes done for you every month`,
        "Priority help on WhatsApp",
      ],
      cta: {
        label: "Get Agent on WhatsApp",
        href: whatsappLink("Hi! I’m an agent and I’d like the Kitefolio Agent plan."),
      },
      highlight: true,
    },
    {
      id: "done",
      name: "Done for you",
      price: aed(prices.doneForYou),
      per: "one-off",
      pitch: "Too busy? We build your whole site for you in 48 hours.",
      features: [
        "We write and design it from your CV, listings and photos",
        "Live in 48 hours",
        "One round of changes before it goes live",
        "Then keep it on Free, or add Pro for your own domain",
      ],
      cta: {
        label: "Order on WhatsApp",
        href: whatsappLink("Hi! I’d like Kitefolio to build my website for me."),
      },
    },
  ];
}

/** The plans at the default prices, for places that can't read the live ones. */
export const OFFERS: Offer[] = offersFor(DEFAULT_PRICES);

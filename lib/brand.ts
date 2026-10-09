/** The single source of truth for the public-facing product identity. */
export const brand = {
  name: "Formora",
  tagline: "Portfolios at your own address.",
  description: "Turn your CV, GitHub or LinkedIn into a well-designed portfolio and publish it at your own domain.",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@formora.example",
  /** WhatsApp for sales and support, in international form without “+” (UAE 052 833 8003). */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "971528338003",
} as const;

export const primaryNavigation = [
  { href: "/templatechooser", label: "Templates" },
  { href: "/gallery", label: "Gallery" },
  { href: "/agents", label: "Agents" },
  { href: "/community", label: "Community" },
  { href: "/blog", label: "Journal" },
] as const;

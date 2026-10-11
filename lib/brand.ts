/** The single source of truth for the public-facing product identity. */
export const brand = {
  name: "Fuccura",
  tagline: "Portfolios at your own address.",
  description:
    "Turn your CV, GitHub or LinkedIn into a well-designed portfolio and publish it at your own domain.",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@fuccura.example",
  /** WhatsApp for sales and support, in international form without “+” (UAE 052 833 8003). */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "971528338003",
} as const;

/** Free tools, listed under “Tools” in the menu and on /tools. Add new ones here. */
export const toolsNavigation = [
  { href: "/tools/voice", label: "AI Voice Clone", hint: "Text to speech in your own voice, free" },
] as const;

export const primaryNavigation = [
  { href: "/templatechooser", label: "Templates" },
  { href: "/agents", label: "Agents" },
  { href: "/tools", label: "Tools", children: toolsNavigation },
  { href: "/blog", label: "Journal" },
  { href: "/about", label: "About" },
] as const;

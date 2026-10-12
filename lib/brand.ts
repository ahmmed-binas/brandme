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

export interface NavLink {
  href: string;
  label: string;
  /** One short line under the label in the menu. */
  hint: string;
}

/**
 * Free tools, in the groups shown under “Tools” in the menu. Add new ones here.
 * The first group is Fuccura's own (featured); the second holds the everyday
 * utilities, kept for now while the owner decides which earn their place.
 */
export const toolGroups: Array<{ title: string; items: NavLink[] }> = [
  {
    title: "For agents and creators",
    items: [
      { href: "/tools/voice", label: "AI Voice Clone", hint: "Text to speech in your own voice, free" },
      {
        href: "/tools/uae-mortgage-calculator",
        label: "UAE Mortgage Calculator",
        hint: "Monthly payment and every upfront cost",
      },
    ],
  },
  {
    title: "Documents and everyday",
    items: [
      { href: "/tools#convert", label: "PDF to PNG", hint: "Turn PDF pages into images" },
      { href: "/tools/pdf-editor", label: "PDF editor", hint: "Edit text, draw and annotate" },
      { href: "/tools/merge-pdf", label: "Merge PDF", hint: "Combine PDFs into one file" },
      { href: "/tools/extract-pdf-pages", label: "Extract PDF pages", hint: "Keep only the pages you need" },
      { href: "/tools/image-tools", label: "Image tools", hint: "Remove backgrounds, enlarge images" },
      { href: "/DetailExtractorPage", label: "CV extractor", hint: "Pull details out of a CV" },
      { href: "/tools/everyday-toolbox", label: "Everyday toolbox", hint: "Counters, passwords, dates" },
      { href: "/tools/developer-tools", label: "Developer tools", hint: "JSON, JWT, Base64, regex" },
    ],
  },
];

/** Every tool in one list (for pages that don't need the groups). */
export const toolsNavigation: NavLink[] = toolGroups.flatMap((group) => group.items);

export const primaryNavigation = [
  { href: "/templatechooser", label: "Templates" },
  { href: "/tools", label: "Tools", groups: toolGroups },
  { href: "/blog", label: "Journal" },
  { href: "/about", label: "About" },
] as const;

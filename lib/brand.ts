/** The single source of truth for the public-facing product identity. */
export const brand = {
  name: "Formora",
  tagline: "Make your work and documents work harder.",
  description: "A thoughtful workspace for polished portfolios and practical document tools.",
  contactEmail: "hello@formora.example",
} as const;

export const primaryNavigation = [
  { href: "/templatechooser", label: "Portfolios" },
  { href: "/domains", label: "Domains" },
  { href: "/blog", label: "Journal" },
] as const;

/**
 * Search wording for job pages that people already find us with (Search
 * Console, October 2026). Google shows the title and description as the result
 * “card”, so each one uses the searcher's own words (“profile website design”,
 * “portfolio sample”) and says what they get. Job pages not listed here use the
 * standard wording in app/for/[role]/page.tsx.
 *
 * Add a job when a new search for it shows up; keep titles under about 60
 * characters and descriptions under about 155, so Google doesn't cut them.
 */
export type RoleSearch = {
  /** The <title>, without the “· Kitefolio” suffix the layout adds. */
  title: string;
  description: string;
  /** The page's big heading: a plain part and an italic part. */
  heading: [plain: string, italic: string];
};

export const ROLE_SEARCH: Record<string, RoleSearch> = {
  "project-manager": {
    title: "Project Manager Portfolio: Free Templates & a Real Example",
    description:
      "See a finished project manager portfolio, then make yours free in ten minutes: projects delivered, budgets, PMP or PRINCE2, and reviews. No code.",
    heading: ["Project manager portfolio", "that shows what you delivered"],
  },
  "ml-engineer": {
    title: "Machine Learning Engineer Portfolio Website: Free Templates",
    description:
      "A machine learning engineer portfolio website in ten minutes: models in production, metrics, papers and GitHub, in a free design you edit without code.",
    heading: ["Machine learning engineer", "portfolio website, ready to publish"],
  },
  "event-planner": {
    title: "Event Planner Portfolio Samples: Free Templates",
    description:
      "Event planner portfolio samples you can use: weddings, corporate events and launches, with photos, packages and an enquiry button. Free, no code.",
    heading: ["Event planner portfolio", "samples you can make your own"],
  },
  barrister: {
    title: "Barrister Profile Website Design: Free Templates",
    description:
      "A barrister profile website with your call year, chambers, practice areas, notable cases and direct access details. Free designs, edit without code.",
    heading: ["Barrister profile", "website design, done properly"],
  },
  tiler: {
    title: "Tiler Website Design: Free Templates with Photos & Quotes",
    description:
      "A tiler website that wins jobs: before-and-after photos, areas you cover, prices and a WhatsApp quote button. Free design, live in ten minutes.",
    heading: ["Tiler website design", "that shows your finish"],
  },
};

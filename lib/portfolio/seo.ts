/**
 * How a published portfolio introduces itself to Google and AI search:
 * its page title, description and ProfilePage schema. Used by both
 * addresses a portfolio can live at (/p/<slug> and the owner's own domain).
 *
 * Titles follow “<Name>, <Job>: Portfolio” because that's what recruiters
 * search for, e.g. intitle:portfolio "graphic designer" "open to work".
 */

type Person = {
  name?: string;
  job?: string;
  summary?: string;
  openToWork: boolean;
  image?: string;
  profiles: string[];
};

const clean = (value: unknown) => (typeof value === "string" ? value.trim() : "") || undefined;

/** Only real web addresses go into schema (never uploaded base64 images). */
const webAddress = (value: unknown) => {
  const text = clean(value);
  return text && /^https?:\/\//i.test(text) ? text : undefined;
};

const SOCIAL_HOST = /(^|\.)(linkedin|github|instagram|x|twitter|facebook|tiktok|youtube)\.com$/i;

/** A profile link, but not a bare social homepage such as https://www.linkedin.com/ (left from samples). */
const profileAddress = (value: unknown) => {
  const address = webAddress(value);
  if (!address) return undefined;
  try {
    const parsed = new URL(address);
    return SOCIAL_HOST.test(parsed.hostname) && parsed.pathname.length <= 1 ? undefined : address;
  } catch {
    return undefined;
  }
};

/** Reads the facts we need from either content model (standard or Editorial Developer). */
export function describePortfolio(content: Record<string, unknown>): Person {
  const personal = content.personal as Record<string, unknown> | undefined;
  if (personal) {
    const social = (content.social ?? {}) as Record<string, unknown>;
    return {
      name: clean(personal.name),
      job: clean(personal.title),
      summary: clean(personal.positioning),
      openToWork: false,
      image: webAddress(personal.avatar),
      profiles: Object.values(social).map(profileAddress).filter(Boolean) as string[],
    };
  }
  const summary = Array.isArray(content.summary) ? content.summary[0] : undefined;
  return {
    name: clean(content.name),
    job: clean(content.professional_title),
    summary: clean(content.tagline) ?? clean(summary),
    openToWork: content.open_to_work === true,
    image: webAddress(content.avatar),
    profiles: [content.linkedin, content.github, content.instagram, content.website]
      .map(profileAddress)
      .filter(Boolean) as string[],
  };
}

/** “Sara Khan, Graphic Designer: Portfolio”, plus “(Open to work)” when switched on. */
export function portfolioTitle(person: Person): string {
  const who = [person.name, person.job].filter(Boolean).join(", ");
  const title = who ? `${who}: Portfolio` : "Portfolio";
  return person.openToWork ? `${title} (Open to work)` : title;
}

/** Up to 160 characters, starting with “Open to work.” when switched on. */
export function portfolioDescription(person: Person): string | undefined {
  const parts = [person.openToWork ? "Open to work." : "", person.summary ?? ""];
  const text = parts.filter(Boolean).join(" ");
  if (!text) return undefined;
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text;
}

/** schema.org ProfilePage about the owner. Only facts from their own content. */
export function portfolioSchema(person: Person, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url,
    mainEntity: {
      "@type": "Person",
      name: person.name,
      jobTitle: person.job,
      description: person.summary,
      image: person.image,
      sameAs: person.profiles.length ? person.profiles : undefined,
    },
  };
}

/** JSON for a <script type="application/ld+json">, with “<” escaped. */
export const jsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

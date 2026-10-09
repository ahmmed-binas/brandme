import type { Metadata } from "next";

/**
 * Search-engine rules for paginated lists (the gallery, the template chooser,
 * customers' blogs):
 * - every page is its own canonical URL (“/gallery?page=3”), never pointed at
 *   page 1, so the items on later pages are found and indexed;
 * - later pages say which page they are in the title and description;
 * - searches and filtered views are “noindex, follow”: crawlers still follow
 *   their links but don't index endless combinations of the same items.
 */

/** ?page= as a whole number from 1 (anything else is page 1). */
export function pageNumber(raw: string | string[] | undefined): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(value) && value > 1 ? Math.min(value, 1000) : 1;
}

export const pageSuffix = (page: number) => (page > 1 ? `, page ${page}` : "");

export function pagedMetadata({ base, title, description, page, filtered = false }: { base: string; title: string; description: string; page: number; filtered?: boolean }): Metadata {
  const url = page > 1 ? `${base}?page=${page}` : base;
  return {
    title: `${title}${pageSuffix(page)}`,
    description: page > 1 ? `Page ${page}. ${description}` : description,
    alternates: { canonical: filtered ? base : url },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title: `${title}${pageSuffix(page)}`, description, url },
  };
}

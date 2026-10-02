import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { availableTemplates } from "@/lib/templates/approval";
import { ROLES } from "@/lib/templates/roles";
import { db } from "@/utils/db";
import { databaseConfigured, ensureSchema } from "@/utils/db-schema";

export const revalidate = 3600;

/** Public pages plus every published portfolio, refreshed hourly. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/templatechooser`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/community`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${siteUrl}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${siteUrl}/tools`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/for`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    ...ROLES.map((role) => ({ url: `${siteUrl}/for/${role.id}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...(await availableTemplates()).map((template) => ({ url: `${siteUrl}/templates/${template.id}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
  if (!databaseConfigured()) return pages;
  try {
    await ensureSchema();
    const published = await db.query<{ slug: string; published_at: Date }>("SELECT slug, published_at FROM portfolios WHERE published_at IS NOT NULL AND slug IS NOT NULL ORDER BY published_at DESC LIMIT 45000");
    return [...pages, ...published.rows.map((row) => ({ url: `${siteUrl}/p/${row.slug}`, lastModified: row.published_at, changeFrequency: "monthly" as const, priority: 0.4 }))];
  } catch {
    return pages; // A database outage shouldn't break the sitemap.
  }
}

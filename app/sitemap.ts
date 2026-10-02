import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { availableTemplates } from "@/lib/templates/approval";
import { ROLES } from "@/lib/templates/roles";
import { listJournal } from "@/lib/content/journal";
import { galleryItems } from "@/lib/gallery/items";
import { isLive, standingOf } from "@/lib/plans";
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
    { url: `${siteUrl}/gallery`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...(await galleryItems()).map((item) => ({ url: `${siteUrl}/gallery/${item.slug}`, lastModified: new Date(item.createdAt), changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: `${siteUrl}/tools`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/for`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    ...(await listJournal()).map((post) => ({ url: `${siteUrl}/blog/${post.slug}`, lastModified: new Date(post.updatedAt ?? post.publishedAt!), changeFrequency: "monthly" as const, priority: 0.5 })),
    ...ROLES.map((role) => ({ url: `${siteUrl}/for/${role.id}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...(await availableTemplates()).map((template) => ({ url: `${siteUrl}/templates/${template.id}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
  if (!databaseConfigured()) return pages;
  try {
    await ensureSchema();
    const published = await db.query<{ slug: string; published_at: Date }>("SELECT slug, published_at FROM portfolios WHERE published_at IS NOT NULL AND slug IS NOT NULL ORDER BY published_at DESC LIMIT 45000");
    const posts = await db.query<{ slug: string; post_slug: string; published_at: Date; plan: string; trial_ends_at: Date; plan_expires_at: Date | null }>(
      `SELECT p.slug, b.slug AS post_slug, b.published_at, u.plan, u.trial_ends_at, u.plan_expires_at FROM portfolio_posts b
       JOIN portfolios p ON p.owner_id = b.owner_id AND p.template_id = b.template_id
       JOIN app_users u ON u.id = b.owner_id
       WHERE b.published_at IS NOT NULL AND p.published_at IS NOT NULL AND p.slug IS NOT NULL ORDER BY b.published_at DESC LIMIT 4000`,
    );
    return [
      ...pages,
      ...published.rows.map((row) => ({ url: `${siteUrl}/p/${row.slug}`, lastModified: row.published_at, changeFrequency: "monthly" as const, priority: 0.4 })),
      ...posts.rows.filter((row) => { const standing = standingOf(row); return standing.plan.blog && isLive(standing.standing); }).map((row) => ({ url: `${siteUrl}/p/${row.slug}/blog/${row.post_slug}`, lastModified: row.published_at, changeFrequency: "yearly" as const, priority: 0.3 })),
    ];
  } catch {
    return pages; // A database outage shouldn't break the sitemap.
  }
}

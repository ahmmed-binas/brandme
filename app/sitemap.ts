import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { availableTemplates } from "@/lib/templates/approval";
import { ROLES } from "@/lib/templates/roles";
import { listJournal, POSTS_PER_PAGE } from "@/lib/content/journal";
import { galleryItems } from "@/lib/gallery/items";
import { db } from "@/utils/db";
import { databaseConfigured, ensureSchema } from "@/utils/db-schema";

export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

/** Pages that change rarely. No lastModified: a made-up “now” teaches search engines to ignore our dates. */
const STATIC: Array<[path: string, priority: number]> = [
  ["/", 1], ["/templatechooser", 0.9], ["/gallery", 0.9], ["/pricing", 0.8], ["/for", 0.8],
  ["/agents", 0.6], ["/agents/investigator", 0.7], ["/community", 0.6], ["/blog", 0.6], ["/book", 0.5],
  ["/about", 0.4], ["/contact", 0.4], ["/domains", 0.4],
  ["/tools", 0.5], ["/tools/developer-tools", 0.4], ["/tools/everyday-toolbox", 0.4], ["/tools/extract-pdf-pages", 0.4],
  ["/tools/image-tools", 0.4], ["/tools/merge-pdf", 0.4], ["/tools/pdf-editor", 0.4], ["/DetailExtractorPage", 0.4],
  ["/privacy", 0.2], ["/terms", 0.2],
];

const at = (path: string, extra: Omit<Entry, "url"> = {}): Entry => ({ url: `${siteUrl}${path}`, ...extra });
/** Pages 2… of a paginated list, as their own canonical URLs (see lib/seo/paging.ts). */
const laterPages = (count: number, perPage: number, href: (page: number) => string, priority: number): Entry[] =>
  Array.from({ length: Math.max(0, Math.ceil(count / perPage) - 1) }, (_, index) => at(href(index + 2), { priority }));
const latest = (dates: Array<Date | null | undefined>) => dates.filter((date): date is Date => date instanceof Date && !Number.isNaN(date.getTime())).sort((a, b) => b.getTime() - a.getTime())[0];

/**
 * Every public page of the main site, with real modification dates where we
 * have them: templates, job-title pages, the gallery, the Journal, community
 * posts, and published portfolios with their blogs. Portfolios served on the
 * owner's own domain are left out here: their canonical address is that
 * domain, which has its own sitemap (app/sites/[host]/sitemap.xml).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [templates, gallery, journal] = await Promise.all([availableTemplates(), galleryItems(), listJournal()]);
  const entries: Entry[] = [
    ...STATIC.map(([path, priority]) => at(path, { priority })),
    ...laterPages(templates.length, 18, (page) => `/templatechooser?page=${page}`, 0.6),
    ...laterPages(gallery.length, 12, (page) => `/gallery?page=${page}`, 0.6),
    ...laterPages(journal.length, POSTS_PER_PAGE, (page) => `/blog/page/${page}`, 0.4),
    ...templates.map((template) => at(`/templates/${template.id}`, { lastModified: new Date(template.createdAt), priority: 0.7 })),
    ...ROLES.map((role) => at(`/for/${role.id}`, { priority: 0.7 })),
    ...gallery.map((item) => at(`/gallery/${item.slug}`, { lastModified: new Date(item.createdAt), priority: 0.6 })),
    ...journal.map((post) => at(`/blog/${post.slug}`, { lastModified: new Date(post.updatedAt ?? post.publishedAt!), priority: 0.6 })),
  ];
  if (!databaseConfigured()) return entries;
  try {
    await ensureSchema();
    const [community, portfolios, posts] = await Promise.all([
      db.query<{ id: string; updated_at: Date }>("SELECT id, updated_at FROM community_posts WHERE status = 'published' ORDER BY created_at DESC LIMIT 5000"),
      db.query<{ slug: string; published_at: Date }>(
        `SELECT p.slug, p.published_at FROM portfolios p
         WHERE p.published_at IS NOT NULL AND p.slug IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM custom_domains d WHERE d.owner_id = p.owner_id AND d.template_id = p.template_id AND d.verified_at IS NOT NULL)
         ORDER BY p.published_at DESC LIMIT 30000`),
      db.query<{ slug: string; post_slug: string; published_at: Date; updated_at: Date }>(
        `SELECT p.slug, b.slug AS post_slug, b.published_at, b.updated_at FROM portfolio_posts b
         JOIN portfolios p ON p.owner_id = b.owner_id AND p.template_id = b.template_id
         WHERE b.published_at IS NOT NULL AND p.published_at IS NOT NULL AND p.slug IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM custom_domains d WHERE d.owner_id = p.owner_id AND d.template_id = p.template_id AND d.verified_at IS NOT NULL)
         ORDER BY b.published_at DESC LIMIT 10000`),
    ]);
    const blogs = new Map<string, Date[]>();
    for (const row of posts.rows) blogs.set(row.slug, [...(blogs.get(row.slug) ?? []), row.updated_at ?? row.published_at]);
    return [
      ...entries,
      ...community.rows.map((row) => at(`/community/${row.id}`, { lastModified: row.updated_at, priority: 0.4 })),
      ...portfolios.rows.map((row) => at(`/p/${row.slug}`, { lastModified: row.published_at, priority: 0.5 })),
      ...[...blogs].map(([slug, dates]) => at(`/p/${slug}/blog`, { lastModified: latest(dates), priority: 0.4 })),
      ...posts.rows.map((row) => at(`/p/${row.slug}/blog/${row.post_slug}`, { lastModified: row.updated_at ?? row.published_at, priority: 0.4 })),
    ];
  } catch {
    return entries; // A database outage shouldn't break the sitemap.
  }
}

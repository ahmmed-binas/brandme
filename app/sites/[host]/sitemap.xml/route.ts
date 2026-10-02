import { siteForHost, sitePosts } from "@/lib/portfolio/site";

/** The sitemap for a customer's own domain: their portfolio and blog. */
export async function GET(_request: Request, { params }: { params: Promise<{ host: string }> }) {
  const site = await siteForHost((await params).host);
  if (!site || site.portfolio.resting) return new Response("Not found", { status: 404 });
  const posts = await sitePosts(site);
  const urls = [
    { loc: `${site.canonical}/`, lastmod: site.portfolio.updatedAt },
    ...(posts.length ? [{ loc: `${site.canonical}/blog`, lastmod: posts[0]!.publishedAt! }] : []),
    ...posts.map((post) => ({ loc: `${site.canonical}/blog/${post.slug}`, lastmod: post.publishedAt! })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${url.loc}</loc><lastmod>${url.lastmod}</lastmod></url>`).join("")}</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=600" } });
}

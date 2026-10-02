import { listJournal } from "@/lib/content/journal";
import { brand } from "@/lib/brand";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** RSS for the Journal, so readers and search engines pick up new posts. */
export async function GET() {
  const posts = (await listJournal()).slice(0, 30);
  const items = posts.map((post) => `<item><title>${escape(post.title)}</title><link>${siteUrl}/blog/${post.slug}</link><guid>${siteUrl}/blog/${post.slug}</guid><pubDate>${new Date(post.publishedAt!).toUTCString()}</pubDate><category>${escape(post.category)}</category><description>${escape(post.description)}</description></item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escape(brand.name)} Journal</title><link>${siteUrl}/blog</link><description>Practical advice on portfolios for every kind of work.</description><language>en-gb</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=600" } });
}

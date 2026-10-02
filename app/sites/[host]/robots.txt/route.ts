/** robots.txt for a customer's own domain. */
export async function GET(_request: Request, { params }: { params: Promise<{ host: string }> }) {
  const host = decodeURIComponent((await params).host).toLowerCase();
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: https://${host}/sitemap.xml\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

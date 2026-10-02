import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/editor/", "/account", "/login", "/sites/", "/admin", "/community/moderation"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

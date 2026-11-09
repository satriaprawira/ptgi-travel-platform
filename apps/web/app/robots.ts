import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/content";

/** /robots.txt: everything but the staff pages may be indexed. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/login"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

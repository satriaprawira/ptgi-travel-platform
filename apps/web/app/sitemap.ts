import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/content";

/** /sitemap.xml: the customer pages. Staff pages (/admin, /login) are left out. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/services", "/about", "/how-to-book", "/fare-and-policy", "/reservation-form"];
  return pages.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    changeFrequency: path === "/fare-and-policy" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}

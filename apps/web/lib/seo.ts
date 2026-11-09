import type { Metadata } from "next";
import { COMPANY_NAME, HOME } from "./content";

/**
 * A customer page's title, description, canonical link and social preview. Next replaces the layout's
 * openGraph as a whole when a page sets one, so the shared parts are repeated here.
 */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: COMPANY_NAME,
      locale: "en",
      url: path,
      title,
      description,
      images: [{ url: HOME.photo.src, width: HOME.photo.width, height: HOME.photo.height, alt: HOME.photo.alt }],
    },
  };
}

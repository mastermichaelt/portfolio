import type { MetadataRoute } from "next";
import { getSitemapPaths } from "@/lib/sitemap-paths";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return getSitemapPaths().map((path) => ({
    url: `${siteUrl}${path}`,
  }));
}

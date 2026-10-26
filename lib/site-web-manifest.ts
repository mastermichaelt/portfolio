import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from "@/lib/site-metadata";

/** Static web app manifest for the portfolio site (not the `/connect` shortcut). */
export const SITE_WEB_MANIFEST_PATH = "/manifest.webmanifest";

/** Source of truth for `public/manifest.webmanifest`. */
export const SITE_WEB_MANIFEST = {
  name: SITE_TITLE,
  short_name: SITE_NAME,
  description: SITE_DESCRIPTION,
  start_url: "/",
  display: "browser" as const,
  background_color: "#121110",
  theme_color: "#121110",
  icons: [
    {
      src: "/android-chrome-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any" as const,
    },
  ],
};

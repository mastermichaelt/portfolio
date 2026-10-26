/** Canonical LinkedIn profile URL encoded in the on-page QR SVG. */
export const LINKEDIN_PROFILE_URL =
  "https://www.linkedin.com/in/michael-truong-dev/";

/** Illustrated QR (default on `/connect`). */
export const CONNECT_QR_ART_PATH = "/connect-qr-art.svg";

/** Light-module / field fill in `connect-qr-art.svg` (`#fcf0e4`, 851 rects). */
export const CONNECT_QR_ART_PANEL_BACKGROUND = "#fcf0e4";

/** Generated standard QR (toggle fallback on `/connect`). */
export const CONNECT_QR_STANDARD_PATH = "/linkedin-connect-qr.svg";

export const CONNECT_QR_ALT = "QR code linking to Michael Truong on LinkedIn";

export const CONNECT_QR_TOGGLE_SHOW_STANDARD =
  "Having trouble scanning? Show standard QR";

export const CONNECT_QR_TOGGLE_SHOW_ILLUSTRATED = "Show illustrated QR";

/** LinkedIn networking-card headline (matches official QR export). */
export const CONNECT_HEADLINE =
  "Senior Software Engineer | AI Product Engineer | Ex Atlassian";

export const CONNECT_PAGE_TITLE = "Connect";

export const CONNECT_PAGE_DESCRIPTION =
  "Scan the QR code or open the link to connect with Michael Truong on LinkedIn.";

export const CONNECT_LINKEDIN_ANALYTICS_LABEL =
  "LinkedIn profile (connect page)";

/** Static web app manifest for Home Screen shortcut (connect route only). */
export const CONNECT_MANIFEST_PATH = "/connect.webmanifest";

/** Source of truth for `public/connect.webmanifest` (regenerate via generate:connect-manifest). */
export const CONNECT_WEB_MANIFEST = {
  id: "/connect",
  name: "LinkedIn Connect — Michael Truong",
  short_name: CONNECT_PAGE_TITLE,
  description: CONNECT_PAGE_DESCRIPTION,
  start_url: "/connect",
  scope: "/connect",
  display: "standalone",
  background_color: "#121110",
  theme_color: "#121110",
  icons: [
    {
      src: "/connect-icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/connect-icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
  ],
} as const;

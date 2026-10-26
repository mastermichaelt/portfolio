/** Canonical LinkedIn profile URL encoded in the on-page QR SVG. */
export const LINKEDIN_PROFILE_URL =
  "https://www.linkedin.com/in/michael-truong-dev/";

/** LinkedIn networking-card headline (matches official QR export). */
export const CONNECT_HEADLINE_LINES = [
  "Senior Software Engineer | AI Product Engineer |",
  "Ex Atlassian",
] as const;

export const CONNECT_PAGE_TITLE = "Connect";

export const CONNECT_PAGE_DESCRIPTION =
  "Scan the QR code or open the link to connect with Michael Truong on LinkedIn.";

export const CONNECT_LINKEDIN_ANALYTICS_LABEL =
  "LinkedIn profile (connect page)";

/** Static web app manifest for Home Screen shortcut (connect route only). */
export const CONNECT_MANIFEST_PATH = "/connect.webmanifest";

export const CONNECT_MANIFEST_ID = "/connect";

export const CONNECT_MANIFEST_NAME = "LinkedIn Connect — Michael Truong";

export const CONNECT_MANIFEST_SHORT_NAME = CONNECT_PAGE_TITLE;

export const CONNECT_MANIFEST_START_URL = "/connect";

export const CONNECT_MANIFEST_SCOPE = "/connect";

export const CONNECT_MANIFEST_DISPLAY = "standalone";

export const CONNECT_MANIFEST_BACKGROUND_COLOR = "#121110";

export const CONNECT_MANIFEST_THEME_COLOR = "#121110";

export const CONNECT_MANIFEST_ICONS = [
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
] as const;

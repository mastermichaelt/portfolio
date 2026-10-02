import type { MetadataRoute } from "next";

const SITE_DESCRIPTION =
  "Michael Truong — Senior Software Engineer and AI Product Engineer in Sydney. Growth experimentation, attribution and platform measurement at Atlassian (2014–2025). Independent AI products and agent-native engineering systems since 2026 — the same practice: measure it, validate it, and write down what the system is allowed to do.";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Michael Truong · Making uncertain systems dependable",
    short_name: "Michael Truong",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "browser",
    background_color: "#121110",
    theme_color: "#121110",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

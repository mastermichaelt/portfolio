import localFont from "next/font/local";

// Self-hosted IBM Plex — see app/fonts/README.md
export const ibmPlexSans = localFont({
  src: [
    {
      path: "../app/fonts/ibm-plex-sans-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../app/fonts/ibm-plex-sans-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../app/fonts/ibm-plex-sans-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const ibmPlexMono = localFont({
  src: [
    {
      path: "../app/fonts/ibm-plex-mono-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../app/fonts/ibm-plex-mono-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-mono",
  display: "swap",
  adjustFontFallback: false,
});

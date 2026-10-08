import type { Metadata, Viewport } from "next";
import { PersonJsonLd } from "@/components/PersonJsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeScript } from "@/components/ThemeScript";
import { getPortfolioRepository } from "@/lib/portfolio";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
  SITE_TITLE_TEMPLATE,
} from "@/lib/site-metadata";
import { ibmPlexMono, ibmPlexSans } from "@/lib/fonts";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_TITLE,
    template: SITE_TITLE_TEMPLATE,
  },
  description: SITE_DESCRIPTION,
  authors: [{ name: SITE_NAME, url: getSiteUrl() }],
  creator: SITE_NAME,
  keywords: [...SITE_KEYWORDS],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_AU",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: [{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2efe8" },
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
  ],
  colorScheme: "dark light",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const profile = await getPortfolioRepository().getProfile();

  return (
    <html
      lang="en"
      // The pre-paint ThemeScript sets data-theme before hydration, so the
      // server markup (no attribute) and client markup differ by design.
      suppressHydrationWarning
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
        <PersonJsonLd profile={profile} />
      </head>
      <body className="min-h-full flex flex-col">
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <ThemeProvider>
          <SiteHeader email={profile.email} />
          {children}
          <SiteFooter profile={profile} />
        </ThemeProvider>
      </body>
    </html>
  );
}

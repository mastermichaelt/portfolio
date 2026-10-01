import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeScript } from "@/components/ThemeScript";
import { getPortfolioRepository } from "@/lib/portfolio";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Michael Truong · Making uncertain systems dependable",
    template: "%s · Michael Truong",
  },
  description:
    "Senior software engineer in Sydney. Growth experimentation, attribution and platform measurement at Atlassian (2014–2025). Independent AI products and agent-native engineering systems since 2026 — the same practice: measure it, validate it, and write down what the system is allowed to do.",
  openGraph: {
    type: "website",
    siteName: "Michael Truong",
    title: "Michael Truong · Making uncertain systems dependable",
    description:
      "Senior software engineer in Sydney. Growth experimentation, attribution and platform measurement at Atlassian (2014–2025). Independent AI products and agent-native engineering systems since 2026 — the same practice: measure it, validate it, and write down what the system is allowed to do.",
    locale: "en_AU",
  },
  twitter: {
    card: "summary_large_image",
    title: "Michael Truong · Making uncertain systems dependable",
    description:
      "Senior software engineer in Sydney. Growth experimentation, attribution and platform measurement at Atlassian (2014–2025). Independent AI products and agent-native engineering systems since 2026 — the same practice: measure it, validate it, and write down what the system is allowed to do.",
  },
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

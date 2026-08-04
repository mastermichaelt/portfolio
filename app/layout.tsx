import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader, Source_Sans_3 } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getPortfolioRepository } from "@/lib/portfolio";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl = "https://portfolio-multipliers-dev.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Michael Truong · AI engineering systems",
    template: "%s · Michael Truong",
  },
  description:
    "Senior software engineer in Sydney. Production AI systems, editorial workflows, and evidence-backed engineering field reports.",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Michael Truong",
    title: "Michael Truong · AI engineering systems",
    description:
      "Senior software engineer in Sydney. Production AI systems, editorial workflows, and evidence-backed engineering field reports.",
    locale: "en_AU",
  },
  twitter: {
    card: "summary_large_image",
    title: "Michael Truong · AI engineering systems",
    description:
      "Senior software engineer in Sydney. Production AI systems, editorial workflows, and evidence-backed engineering field reports.",
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const profile = await getPortfolioRepository().getProfile();

  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${sourceSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        <SiteFooter profile={profile} />
      </body>
    </html>
  );
}

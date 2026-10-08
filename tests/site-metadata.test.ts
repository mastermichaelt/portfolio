import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
} from "@/lib/site-metadata";

vi.mock("@/lib/fonts", () => ({
  ibmPlexSans: { variable: "--font-body" },
  ibmPlexMono: { variable: "--font-mono" },
}));

vi.mock("@/lib/portfolio", () => ({
  getPortfolioRepository: () => ({
    getProfile: async () => ({
      name: SITE_NAME,
      email: "michael@multipliers.dev",
    }),
  }),
}));

describe("site metadata constants", () => {
  it("exports SITE_DESCRIPTION and curated SITE_KEYWORDS", () => {
    expect(SITE_DESCRIPTION).toContain("Michael Truong");
    expect(SITE_DESCRIPTION).toContain("Senior Software Engineer");
    expect(SITE_DESCRIPTION).toContain("AI Product Engineer");

    expect(SITE_KEYWORDS).toEqual(
      expect.arrayContaining([
        "Michael Truong",
        "Senior Software Engineer",
        "AI Product Engineer",
        "Sydney",
      ]),
    );
    expect(SITE_KEYWORDS.length).toBeGreaterThanOrEqual(8);
  });
});

describe("layout metadata", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.resetModules();
  });

  it("wires authors, creator, keywords, and unified descriptions", async () => {
    const { metadata } = await import("@/app/layout");
    const { getSiteUrl } = await import("@/lib/site");

    expect(metadata.authors).toEqual([{ name: SITE_NAME, url: getSiteUrl() }]);
    expect(metadata.creator).toBe(SITE_NAME);
    expect(metadata.keywords).toEqual([...SITE_KEYWORDS]);
    expect(metadata.description).toBe(SITE_DESCRIPTION);
    expect(metadata.openGraph?.description).toBe(SITE_DESCRIPTION);
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      description: SITE_DESCRIPTION,
    });
  });
});

describe("homepage metadata", () => {
  it("keeps homepage-specific fields without partial Twitter or OG description overrides", async () => {
    const { metadata } = await import("@/app/page");

    expect(metadata.title).toEqual({ absolute: SITE_TITLE });
    expect(metadata.alternates).toEqual({ canonical: "/" });
    expect(metadata.openGraph).toEqual({ url: "/" });
    expect(metadata.twitter).toBeUndefined();
    expect(metadata.description).toBeUndefined();
  });
});

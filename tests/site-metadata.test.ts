import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  HOME_DESCRIPTION,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
} from "@/lib/site-metadata";

vi.mock("next/font/google", () => ({
  IBM_Plex_Sans: () => ({ variable: "--font-body" }),
  IBM_Plex_Mono: () => ({ variable: "--font-mono" }),
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
  it("exports curated HOME_DESCRIPTION and SITE_KEYWORDS", () => {
    expect(HOME_DESCRIPTION).toContain("Michael Truong");
    expect(HOME_DESCRIPTION).toContain("Senior Software Engineer");
    expect(HOME_DESCRIPTION.length).toBeLessThan(SITE_DESCRIPTION.length);

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

  it("wires authors, creator, and keywords from site-metadata constants", async () => {
    const { metadata } = await import("@/app/layout");
    const { getSiteUrl } = await import("@/lib/site");

    expect(metadata.authors).toEqual([{ name: SITE_NAME, url: getSiteUrl() }]);
    expect(metadata.creator).toBe(SITE_NAME);
    expect(metadata.keywords).toEqual([...SITE_KEYWORDS]);
    expect(metadata.description).toBe(SITE_DESCRIPTION);
    expect(metadata.openGraph?.description).toBe(SITE_DESCRIPTION);
    expect(metadata.twitter?.description).toBe(SITE_DESCRIPTION);
  });
});

describe("homepage metadata", () => {
  it("aligns description, Open Graph, and Twitter with HOME_DESCRIPTION", async () => {
    const { metadata } = await import("@/app/page");

    expect(metadata.description).toBe(HOME_DESCRIPTION);
    expect(metadata.openGraph?.description).toBe(HOME_DESCRIPTION);
    expect(metadata.twitter?.description).toBe(HOME_DESCRIPTION);
    expect(metadata.title).toEqual({ absolute: SITE_TITLE });
  });
});

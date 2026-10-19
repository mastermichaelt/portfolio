import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  OPEN_GRAPH_IMAGE_PATH,
  SITE_PORTRAIT_PATH,
} from "@/lib/social-metadata";
import { getSiteUrl } from "@/lib/site";
import { SITE_TITLE } from "@/lib/site-metadata";

vi.mock("@/lib/fonts", () => ({
  ibmPlexSans: { variable: "--font-body" },
  ibmPlexMono: { variable: "--font-mono" },
}));

vi.mock("@/lib/portfolio", () => ({
  getPortfolioRepository: () => ({
    getProfile: async () => ({
      name: "Michael Truong",
      email: "michael@multipliers.dev",
      location: "Sydney, Australia",
      links: {
        linkedin: "https://linkedin.com/in/example",
        github: "https://github.com/example",
        blog: "https://dev.to/example",
      },
    }),
    getProjectCase: async (slug: string) =>
      slug === "codenames-ai"
        ? {
            slug: "codenames-ai",
            name: "Codenames AI",
            lead: "Lead for codenames case study.",
          }
        : slug === "experiment-measurement"
          ? {
              slug: "experiment-measurement",
              name: "Experiment measurement",
              lead: "Lead for experiment case study.",
            }
          : null,
    getSupportingCase: async (slug: string) =>
      slug === "editorial-workflow"
        ? {
            slug: "editorial-workflow",
            name: "Editorial workflow",
            lead: "Lead for supporting case.",
          }
        : null,
    getProjectWorkflowView: async (slug: string) =>
      slug === "editorial-workflow" ? { slug } : null,
    getProject: async () => null,
    listProjectCases: async () => [],
    listSupportingCases: async () => [],
    listProjects: async () => [],
  }),
}));

function expectOpenGraphImages(
  openGraph: { url?: unknown; images?: unknown } | null | undefined,
  options?: { requireUrl?: boolean },
) {
  if (options?.requireUrl) {
    expect(openGraph?.url).toEqual(expect.any(String));
  }
  expect(openGraph?.images).toEqual([
    expect.objectContaining({
      url: OPEN_GRAPH_IMAGE_PATH,
      width: 1200,
      height: 630,
      alt: SITE_TITLE,
      type: "image/png",
    }),
  ]);
}

describe("route Open Graph metadata exports", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://michaeltruong.ai");
    vi.resetModules();
  });

  it("includes default images on the root layout metadata", async () => {
    const { metadata } = await import("@/app/layout");
    expectOpenGraphImages(metadata.openGraph);
  });

  it("includes default images on static indexable pages", async () => {
    const pages = [
      await import("@/app/page"),
      await import("@/app/about/page"),
      await import("@/app/projects/page"),
      await import("@/app/articles/page"),
      await import("@/app/ecosystem/page"),
    ] as const;

    for (const { metadata } of pages) {
      expectOpenGraphImages(metadata.openGraph, { requireUrl: true });
    }
  });

  // Detail pages leave `images` unset so the colocated per-slug
  // opengraph-image / twitter-image files own the card. The rendered tags are
  // asserted by scripts/verify-prerendered-social-metadata.mjs.
  it("leaves images to the per-slug image files on project detail metadata", async () => {
    const { generateMetadata } = await import("@/app/projects/[slug]/page");

    for (const slug of [
      "codenames-ai",
      "experiment-measurement",
      "editorial-workflow",
    ]) {
      const metadata = await generateMetadata({
        params: Promise.resolve({ slug }),
      } as Parameters<typeof generateMetadata>[0]);
      expect(metadata.openGraph?.url).toBe(`/projects/${slug}`);
      expect(metadata.openGraph && "images" in metadata.openGraph).toBe(false);
      expect(metadata.openGraph?.title).toMatch(/· Michael Truong$/);
    }
  });

  it("keeps Person JSON-LD image on the canonical portrait URL", async () => {
    const { buildPersonJsonLd } = await import("@/components/PersonJsonLd");
    const { profile } = await import("@/content/profile");
    const siteUrl = getSiteUrl();
    const person = (
      buildPersonJsonLd(profile, siteUrl)["@graph"] as Array<{
        "@type": string;
        image?: string;
      }>
    ).find((node) => node["@type"] === "Person");

    expect(person?.image).toBe(`${siteUrl}${SITE_PORTRAIT_PATH}`);
  });
});

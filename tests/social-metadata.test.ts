import { describe, expect, it } from "vitest";

import type { CaseStudyEntry } from "@/lib/case-study-entry";
import { caseStudyCardContent } from "@/lib/social-card";
import {
  OPEN_GRAPH_IMAGE_PATH,
  SITE_PORTRAIT_PATH,
  defaultOpenGraphImages,
  openGraphForCanonicalPath,
  openGraphForFileImageSegment,
} from "@/lib/social-metadata";
import { SITE_TITLE } from "@/lib/site-metadata";

describe("social metadata helpers", () => {
  it("points default Open Graph images at the file-convention route", () => {
    expect(defaultOpenGraphImages()).toEqual([
      {
        url: OPEN_GRAPH_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
        type: "image/png",
      },
    ]);
  });

  it("always includes images when building page Open Graph metadata", () => {
    expect(openGraphForCanonicalPath("/about")).toEqual({
      url: "/about",
      images: defaultOpenGraphImages(),
    });

    expect(
      openGraphForCanonicalPath("/projects/codenames-ai", {
        title: "Codenames AI · Michael Truong",
        description: "Lead copy",
      }),
    ).toMatchObject({
      url: "/projects/codenames-ai",
      title: "Codenames AI · Michael Truong",
      description: "Lead copy",
      images: defaultOpenGraphImages(),
    });
  });

  it("omits the images key for segments with a colocated opengraph-image", () => {
    const result = openGraphForFileImageSegment("/projects/codenames-ai", {
      title: "Codenames AI · Michael Truong",
      description: "Lead copy",
    });
    expect(result).toEqual({
      url: "/projects/codenames-ai",
      title: "Codenames AI · Michael Truong",
      description: "Lead copy",
    });
    // Even `images: undefined` would suppress the file-convention image.
    expect("images" in result).toBe(false);
  });

  it("builds case-study card copy from the header line and contract sentence", () => {
    expect(
      caseStudyCardContent({
        kind: "case",
        projectCase: {
          channelLabel: "CH 01",
          metaLines: ["Independent", "2026 – present", "Live product"],
          title: "A live game people play.",
        },
      } as CaseStudyEntry),
    ).toEqual({
      kicker: "CH 01 · Independent · 2026 – present · Live product",
      headline: "A live game people play.",
    });

    expect(
      caseStudyCardContent({
        kind: "supporting",
        supportingCase: {
          header: {
            tier: "Supporting",
            lines: ["Workflow case study", "agents · workflows"],
          },
          title: "AI-assisted editorial workflow",
        },
      } as CaseStudyEntry),
    ).toEqual({
      kicker: "Supporting · Workflow case study",
      headline: "AI-assisted editorial workflow",
    });
  });

  it("exposes the canonical portrait path for structured data", () => {
    expect(SITE_PORTRAIT_PATH).toBe("/portrait-michael-1200.jpg");
  });
});

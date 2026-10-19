import { describe, expect, it } from "vitest";

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

  it("exposes the canonical portrait path for structured data", () => {
    expect(SITE_PORTRAIT_PATH).toBe("/portrait-michael-1200.jpg");
  });
});

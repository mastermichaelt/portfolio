import { describe, expect, it } from "vitest";

import {
  OPEN_GRAPH_IMAGE_PATH,
  SITE_PORTRAIT_ALT,
  SITE_PORTRAIT_PATH,
  SITE_PORTRAIT_SIZE,
  defaultOpenGraphImages,
  openGraphForCanonicalPath,
  portraitOpenGraphImages,
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

  it("uses route-supplied images instead of the default card when given", () => {
    const images = [{ url: "/projects/x/opengraph-image", alt: "X card" }];
    expect(
      openGraphForCanonicalPath("/projects/x", { title: "X" }, images),
    ).toEqual({
      url: "/projects/x",
      title: "X",
      images,
    });
  });

  it("exposes the canonical portrait path for structured data", () => {
    expect(SITE_PORTRAIT_PATH).toBe("/portrait-michael-1200.jpg");
  });

  it("builds About-page Open Graph images from the canonical portrait", () => {
    expect(portraitOpenGraphImages()).toEqual([
      {
        url: SITE_PORTRAIT_PATH,
        width: SITE_PORTRAIT_SIZE.width,
        height: SITE_PORTRAIT_SIZE.height,
        alt: SITE_PORTRAIT_ALT,
        type: "image/jpeg",
      },
    ]);
  });
});

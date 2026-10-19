import type { Metadata } from "next";

import { SITE_TITLE } from "@/lib/site-metadata";

export const OPEN_GRAPH_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/** App Router file-convention route (`app/opengraph-image.tsx`). */
export const OPEN_GRAPH_IMAGE_PATH = "/opengraph-image";

/** Canonical photographic portrait for Person JSON-LD and identity surfaces. */
export const SITE_PORTRAIT_PATH = "/portrait-michael-1200.jpg";

export function defaultOpenGraphImages(): NonNullable<
  Metadata["openGraph"]
>["images"] {
  return [
    {
      url: OPEN_GRAPH_IMAGE_PATH,
      width: OPEN_GRAPH_IMAGE_SIZE.width,
      height: OPEN_GRAPH_IMAGE_SIZE.height,
      alt: SITE_TITLE,
      type: "image/png",
    },
  ];
}

/**
 * Open Graph fields for an indexable route. Always includes `images` (the
 * default card unless a route passes its own) so a partial page-level
 * `openGraph` override does not drop preview tags.
 */
export function openGraphForCanonicalPath(
  pathname: string,
  fields?: Omit<NonNullable<Metadata["openGraph"]>, "url" | "images">,
  images: NonNullable<
    Metadata["openGraph"]
  >["images"] = defaultOpenGraphImages(),
): NonNullable<Metadata["openGraph"]> {
  return {
    ...fields,
    url: pathname,
    images,
  };
}

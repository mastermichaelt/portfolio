import { notFound } from "next/navigation";

import {
  listCaseStudyParams,
  resolveCaseStudyEntry,
} from "@/lib/case-study-entry";

import { readCaseStudyCardPng } from "./_cards/cards";

// No `alt` / `size` exports: the page metadata declares each card explicitly
// (per-slug alt, real dimensions, content version) via caseStudySocialImages.
// Twitter metadata points at this same route; there is no twitter-image route.
export const contentType = "image/png";

/** Prerenders each card at build (without this, every request re-reads). */
export function generateStaticParams() {
  return listCaseStudyParams();
}

/** Serves the approved per-case-study card (`_cards/<slug>.png`) byte-for-byte. */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Gate on the resolver so only known slugs reach the filesystem path.
  // (`dynamicParams = false` is not an option: Next's metadata-route loader
  // drops that export, so unknown slugs always reach this handler.)
  if (!(await resolveCaseStudyEntry(slug))) notFound();

  const png = await readCaseStudyCardPng(slug);
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": contentType },
  });
}

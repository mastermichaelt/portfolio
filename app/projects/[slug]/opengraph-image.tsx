import { notFound } from "next/navigation";

import {
  listCaseStudyParams,
  resolveCaseStudyEntry,
} from "@/lib/case-study-entry";

import { readCaseStudyCardPng } from "./_cards/cards";

// No `alt` / `size` exports: the page metadata declares each card explicitly
// (per-slug alt and real dimensions) via caseStudySocialImages.
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
  if (!(await resolveCaseStudyEntry(slug))) notFound();

  const png = await readCaseStudyCardPng(slug);
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": contentType },
  });
}

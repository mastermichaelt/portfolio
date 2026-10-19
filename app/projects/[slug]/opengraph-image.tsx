import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { notFound } from "next/navigation";

import {
  listCaseStudyParams,
  resolveCaseStudyEntry,
} from "@/lib/case-study-entry";

export const alt = "Michael Truong — case study";
// No `size` export: the approved cards are not all one size, and a static
// `size` would declare wrong og:image:width/height for some of them.
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

  const png = await readFile(
    join(process.cwd(), "app/projects/[slug]/_cards", `${slug}.png`),
  );
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": contentType },
  });
}

import { notFound } from "next/navigation";

import {
  listCaseStudyParams,
  resolveCaseStudyEntry,
} from "@/lib/case-study-entry";
import { getSiteHostname } from "@/lib/site";
import { caseStudyCardContent, renderSocialCard } from "@/lib/social-card";
import { OPEN_GRAPH_IMAGE_SIZE } from "@/lib/social-metadata";

export const alt = "Michael Truong — case study";
export const size = OPEN_GRAPH_IMAGE_SIZE;
export const contentType = "image/png";

/** Prerenders each card at build (Step 0 spike: without this, every request re-renders). */
export function generateStaticParams() {
  return listCaseStudyParams();
}

/** Per-case-study social card; exists exactly when the detail page does. */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await resolveCaseStudyEntry(slug);
  if (!entry) notFound();

  return renderSocialCard({
    ...caseStudyCardContent(entry),
    footer: `${getSiteHostname()}/projects/${slug}`,
    headlineSize: 60,
  });
}

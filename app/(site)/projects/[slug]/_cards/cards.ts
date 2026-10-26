import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { Metadata } from "next";

/**
 * Approved social-card assets live beside this module as `<slug>.png`. They are
 * read at runtime, so next.config.ts `outputFileTracingIncludes` must ship them
 * with the `/projects/[slug]` page and image-route server bundles.
 */
export const CASE_STUDY_CARDS_DIR = join(
  process.cwd(),
  "app/(site)/projects/[slug]/_cards",
);

interface CaseStudyCard {
  /** Describes the artwork itself (read aloud by screen readers on X / LinkedIn). */
  alt: string;
  /** Intrinsic PNG size; tests assert it matches the file. */
  width: number;
  height: number;
}

/** One entry per prerendered `/projects/[slug]`; tests fail when a slug is missing. */
export const CASE_STUDY_CARDS: Record<string, CaseStudyCard> = {
  "codenames-ai": {
    alt: "Codenames AI: a robot spymaster gives the clue “branch 2” over a board of red, blue and neutral word cards. LLM gameplay under real constraints: generation, validation and multilingual word pools.",
    width: 1731,
    height: 909,
  },
  "experiment-measurement": {
    alt: "Experiment measurement: a dashboard of experiment exposure, conversion rate for experiment versus control, and a Shipped decision, above a pipeline from events through processing and analysis to a ship, iterate or stop outcome. From event data to reliable product decisions.",
    width: 1731,
    height: 909,
  },
  "editorial-workflow": {
    alt: "AI-assisted editorial workflow: an eight-step pipeline — capture, triage, schedule, context, draft, critique, sync, publish — ending in a published article. From capture to publication with AI assistance and explicit human gates.",
    width: 1734,
    height: 907,
  },
  "renovate-governance": {
    alt: "Renovate workflow: a dependency-update pull request (react 18.2.0 → 18.3.1) moving through classify (automated), investigate (agent analysis), review (human gate) and merge (approved). Governed dependency updates with explicit human gates.",
    width: 1731,
    height: 909,
  },
};

function missingCardError(slug: string, detail: string): Error {
  return new Error(
    `Missing social card for /projects/${slug}: ${detail}. Add the approved ` +
      `1.91:1 PNG as app/(site)/projects/[slug]/_cards/${slug}.png and an entry ` +
      `(alt, width, height) to CASE_STUDY_CARDS in app/(site)/projects/[slug]/_cards/cards.ts.`,
  );
}

export function caseStudyCard(slug: string): CaseStudyCard {
  // Own keys only: inherited names such as "constructor" are not cards.
  if (!Object.hasOwn(CASE_STUDY_CARDS, slug)) {
    throw missingCardError(slug, "no CASE_STUDY_CARDS entry");
  }
  return CASE_STUDY_CARDS[slug];
}

/** The approved PNG, byte-for-byte. */
export async function readCaseStudyCardPng(slug: string): Promise<Buffer> {
  caseStudyCard(slug);
  try {
    return await readFile(join(CASE_STUDY_CARDS_DIR, `${slug}.png`));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw missingCardError(slug, `${slug}.png not found`);
    }
    throw error;
  }
}

/** Short content hash of the PNG bytes: a replaced card gets a new URL. */
export function caseStudyCardVersion(png: Uint8Array): string {
  return createHash("sha256").update(png).digest("hex").slice(0, 12);
}

/**
 * Explicit image entries for the page metadata. Declaring them (rather than
 * relying on the file convention) is the only way to give each card its own
 * alt text and real dimensions without changing the route URL. Open Graph and
 * Twitter share the one `opengraph-image` route; `?v=` busts crawler caches
 * whenever the PNG bytes change.
 */
export async function caseStudySocialImages(slug: string) {
  const { alt, width, height } = caseStudyCard(slug);
  const version = caseStudyCardVersion(await readCaseStudyCardPng(slug));
  const image = {
    url: `/projects/${slug}/opengraph-image?v=${version}`,
    width,
    height,
    alt,
    type: "image/png",
  };
  return {
    openGraph: [image],
    twitter: [image],
  } satisfies {
    openGraph: NonNullable<Metadata["openGraph"]>["images"];
    twitter: NonNullable<Metadata["twitter"]>["images"];
  };
}

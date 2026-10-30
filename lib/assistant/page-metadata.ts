import type { Metadata } from "next";

import { openGraphForCanonicalPath } from "@/lib/social-metadata";

const ASSISTANT_CANONICAL_PATH = "/assistant";

export const ASSISTANT_PAGE_ENABLED_DESCRIPTION =
  "Ask questions about Michael Truong's published portfolio work — evidence-aware answers with claim-level attribution and citations.";

export const ASSISTANT_PAGE_MAINTENANCE_DESCRIPTION =
  "The portfolio assistant is temporarily unavailable. Public generation is paused; check back later.";

export function buildAssistantPageMetadata(publicEnabled: boolean): Metadata {
  const description = publicEnabled
    ? ASSISTANT_PAGE_ENABLED_DESCRIPTION
    : ASSISTANT_PAGE_MAINTENANCE_DESCRIPTION;

  return {
    title: "Assistant",
    description,
    alternates: {
      canonical: ASSISTANT_CANONICAL_PATH,
    },
    openGraph: openGraphForCanonicalPath(ASSISTANT_CANONICAL_PATH, {
      title: "Assistant",
      description,
    }),
  };
}

import { ImageResponse } from "next/og";

import type { CaseStudyEntry } from "@/lib/case-study-entry";
import { OPEN_GRAPH_IMAGE_SIZE } from "@/lib/social-metadata";

export interface SocialCardProps {
  kicker: string;
  headline: string;
  body?: string;
  footer: string;
  headlineSize?: number;
}

/** Shared 1200×630 frame for Open Graph / Twitter large cards. */
export function renderSocialCard({
  kicker,
  headline,
  body,
  footer,
  headlineSize = 84,
}: SocialCardProps): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#121110",
        color: "#ece9e2",
        fontFamily:
          "IBM Plex Sans, system-ui, -apple-system, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 28,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#d9a441",
          fontFamily: "IBM Plex Mono, ui-monospace, Menlo, monospace",
        }}
      >
        {kicker}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            fontSize: headlineSize,
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
          }}
        >
          {headline}
        </div>
        {body ? (
          <div
            style={{
              fontSize: 34,
              lineHeight: 1.35,
              color: "#bdb7ac",
              maxWidth: 820,
            }}
          >
            {body}
          </div>
        ) : null}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 24,
          color: "#8d877c",
          fontFamily: "IBM Plex Mono, ui-monospace, Menlo, monospace",
        }}
      >
        {footer}
      </div>
    </div>,
    { ...OPEN_GRAPH_IMAGE_SIZE },
  );
}

/** Card copy for a case study: its header line as kicker, its `<h1>` as headline. */
export function caseStudyCardContent(entry: CaseStudyEntry): {
  kicker: string;
  headline: string;
} {
  switch (entry.kind) {
    case "case": {
      const { channelLabel, metaLines, title } = entry.projectCase;
      return {
        kicker: [channelLabel, ...metaLines].join(" · "),
        headline: title,
      };
    }
    case "supporting": {
      const { header, title } = entry.supportingCase;
      return {
        kicker: [header.tier, header.lines[0]].filter(Boolean).join(" · "),
        headline: title,
      };
    }
    case "project":
      return {
        kicker: entry.project.eyebrow ?? "Project",
        headline: entry.project.title,
      };
  }
}

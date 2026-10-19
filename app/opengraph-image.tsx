import { ImageResponse } from "next/og";

import { getSiteHostname } from "@/lib/site";

export const alt = "Michael Truong · Making uncertain systems dependable";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

/** Default social preview for LinkedIn / Open Graph / Twitter large cards. */
export default function OpenGraphImage() {
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
        Senior Software Engineer · AI Product Engineer · Sydney
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{ fontSize: 84, lineHeight: 1.05, letterSpacing: "-0.035em" }}
        >
          Michael Truong
        </div>
        <div
          style={{
            fontSize: 34,
            lineHeight: 1.35,
            color: "#bdb7ac",
            maxWidth: 820,
          }}
        >
          Making uncertain systems dependable — experimentation, measurement,
          verification, and evidence-backed field reports.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 24,
          color: "#8d877c",
          fontFamily: "IBM Plex Mono, ui-monospace, Menlo, monospace",
        }}
      >
        {getSiteHostname()}
      </div>
    </div>,
    {
      ...size,
    },
  );
}

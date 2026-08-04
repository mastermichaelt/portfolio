import { ImageResponse } from "next/og";

export const alt = "Michael Truong · AI engineering systems";
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
        background: "#f6f2eb",
        backgroundImage:
          "radial-gradient(900px 420px at 12% -10%, rgba(92, 115, 89, 0.16), transparent 55%), radial-gradient(700px 360px at 92% 0%, rgba(26, 25, 22, 0.06), transparent 50%)",
        color: "#1a1916",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 28,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#5c7359",
          fontFamily: "ui-monospace, Menlo, monospace",
        }}
      >
        Senior software engineer · Sydney
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{ fontSize: 84, lineHeight: 1.05, letterSpacing: "-0.03em" }}
        >
          Michael Truong
        </div>
        <div
          style={{
            fontSize: 34,
            lineHeight: 1.35,
            color: "#6e6860",
            maxWidth: 820,
          }}
        >
          Production AI systems, editorial workflows, and evidence-backed field
          reports.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 24,
          color: "#6e6860",
          fontFamily: "ui-monospace, Menlo, monospace",
        }}
      >
        portfolio-multipliers-dev.vercel.app
      </div>
    </div>,
    {
      ...size,
    },
  );
}

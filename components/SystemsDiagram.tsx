import Link from "next/link";

/**
 * Ecosystem System overview spine (projects → AI workflows → governance/feedback
 * → evidence). Mirrors the orientation view on /ecosystem and links to it.
 * Styled with shared hairline/square tokens — not a separate identity layer.
 */
// Node centers step by an even (105, 88) each, so the spine reads as one
// straight diagonal rather than kinking on the last leg.
const SPINE = "M95 50 L200 138 L305 226 L410 314";

type Node = {
  label: string;
  subtitle: string;
  x: number;
  y: number;
  w: number;
};

const NODE_H = 56;

const NODES: Node[] = [
  { label: "Projects", subtitle: "Shipped systems", x: 20, y: 22, w: 150 },
  {
    label: "AI workflows",
    subtitle: "Operational loops",
    x: 112,
    y: 110,
    w: 176,
  },
  {
    label: "Governance & feedback",
    subtitle: "Gates & review",
    x: 207,
    y: 198,
    w: 196,
  },
  {
    label: "Evidence & outputs",
    subtitle: "Public artifacts",
    x: 322,
    y: 286,
    w: 176,
  },
];

export function SystemsDiagram() {
  return (
    <Link
      className="sys-map-link"
      href="/ecosystem"
      aria-label="Explore the systems ecosystem"
    >
      <figure className="sys-map ph-img diagram">
        <svg
          viewBox="0 0 520 360"
          width="100%"
          height="100%"
          role="presentation"
        >
          <path className="sys-edge-live" d={SPINE} fill="none" />
          <path className="sys-edge-flow" d={SPINE} fill="none" />
          <circle className="sys-signal" r="3.5" />

          {NODES.map((node) => (
            <g key={node.label} className="sys-node">
              <rect
                x={node.x}
                y={node.y}
                width={node.w}
                height={NODE_H}
                rx="0"
              />
              <text className="sys-node-label" x={node.x + 14} y={node.y + 24}>
                {node.label}
              </text>
              <text
                className="sys-node-subtitle"
                x={node.x + 14}
                y={node.y + 42}
              >
                {node.subtitle}
              </text>
            </g>
          ))}
        </svg>
        <figcaption className="sys-map-caption">
          <span className="sys-map-dot" aria-hidden="true" />
          <span className="sys-map-caption-text">System overview</span>
          <span className="sys-map-explore" aria-hidden="true">
            Explore ecosystem →
          </span>
        </figcaption>
      </figure>
    </Link>
  );
}

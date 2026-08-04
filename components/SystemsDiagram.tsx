/** Decorative systems diagram for the homepage hero (IA/brand only). */
export function SystemsDiagram() {
  return (
    <div className="ph-img diagram" aria-hidden="true">
      <svg viewBox="0 0 520 320" width="100%" height="100%" role="presentation">
        <rect width="520" height="320" fill="transparent" />
        <g stroke="currentColor" strokeOpacity="0.18" fill="none">
          <path d="M90 70 L210 110 L330 70 L430 130" />
          <path d="M210 110 L210 210 L120 250" />
          <path d="M210 210 L330 230 L430 190" />
          <path d="M330 70 L330 230" />
        </g>
        <g
          fontFamily="var(--font-mono), monospace"
          fontSize="11"
          fill="currentColor"
        >
          <rect
            x="54"
            y="48"
            width="88"
            height="42"
            rx="8"
            fill="var(--surface)"
            stroke="var(--border)"
          />
          <text x="68" y="74" fill="var(--fg)">
            Agents
          </text>
          <rect
            x="168"
            y="90"
            width="96"
            height="42"
            rx="8"
            fill="var(--surface)"
            stroke="var(--border)"
          />
          <text x="182" y="116" fill="var(--fg)">
            Workflows
          </text>
          <rect
            x="286"
            y="48"
            width="104"
            height="42"
            rx="8"
            fill="var(--surface)"
            stroke="var(--border)"
          />
          <text x="300" y="74" fill="var(--fg)">
            Governance
          </text>
          <rect
            x="168"
            y="190"
            width="96"
            height="42"
            rx="8"
            fill="var(--surface)"
            stroke="var(--accent)"
          />
          <text x="186" y="216" fill="var(--fg)">
            Projects
          </text>
          <rect
            x="286"
            y="210"
            width="104"
            height="42"
            rx="8"
            fill="var(--surface)"
            stroke="var(--border)"
          />
          <text x="304" y="236" fill="var(--fg)">
            Evidence
          </text>
          <rect
            x="388"
            y="168"
            width="88"
            height="42"
            rx="8"
            fill="var(--surface)"
            stroke="var(--border)"
          />
          <text x="406" y="194" fill="var(--fg)">
            Writing
          </text>
        </g>
      </svg>
    </div>
  );
}

import { ExternalLink } from "@/components/ExternalLink";
import type { Evidence } from "@/domain/evidence";

export interface StripSelection {
  kind: string;
  ordinal: string;
  label: string;
  subtitle?: string;
  summary?: string;
  evidence: Evidence[];
}

/**
 * The local node-detail strip beneath the figure. Always present (never a
 * popover): default shows the diagram census; a selection shows that node's
 * kind, ordinal, label, subtitle, entity summary, and an evidence link only
 * where the entity owns evidence. aria-live polite; selection never moves focus.
 */
export function ArchitectureDetailStrip({
  selection,
  defaultSub,
  defaultSummary,
}: {
  selection: StripSelection | null;
  defaultSub: string;
  defaultSummary: string;
}) {
  return (
    <div
      className="pcase-arch-strip"
      aria-live="polite"
      data-testid="architecture-detail-strip"
    >
      <div className="pcase-arch-strip-label">
        <p className="pcase-arch-strip-eyebrow">Node detail</p>
        <p className="pcase-arch-strip-kind">
          {selection
            ? `${selection.kind} · node ${selection.ordinal}`
            : "no node selected"}
        </p>
      </div>
      <div className="pcase-arch-strip-body">
        <p className="pcase-arch-strip-title">
          {selection ? selection.label : "Select a node"}
        </p>
        <p className="pcase-arch-strip-sub">
          {selection ? selection.subtitle : defaultSub}
        </p>
        <p className="pcase-arch-strip-summary">
          {selection ? selection.summary : defaultSummary}
        </p>
        {selection && selection.evidence.length > 0 ? (
          <div className="pcase-arch-strip-evidence">
            {selection.evidence.map((item) =>
              item.url ? (
                <ExternalLink
                  key={item.id}
                  className="pcase-arch-strip-evlink"
                  href={item.url}
                >
                  {item.label}
                </ExternalLink>
              ) : (
                <span key={item.id} className="pcase-arch-strip-evmuted">
                  {item.label}
                </span>
              ),
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

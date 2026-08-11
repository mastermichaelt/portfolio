import Link from "next/link";

import { ExternalLink } from "@/components/ExternalLink";
import type { EcosystemDetailModel } from "@/lib/ecosystem-canvas";

type EcosystemDetailPanelProps = {
  detail: EcosystemDetailModel | null;
};

export function EcosystemDetailPanel({ detail }: EcosystemDetailPanelProps) {
  return (
    <aside
      className="ecosystem-panel card"
      aria-live="polite"
      data-testid="ecosystem-detail-panel"
    >
      {detail ? (
        <>
          <div className="kicker">
            <span className="pill">{detail.kind}</span>
            <span className="meta">{detail.sourceViewTitle}</span>
          </div>
          <h3>{detail.label}</h3>
          {detail.subtitle ? <p className="meta">{detail.subtitle}</p> : null}
          {detail.summary ? <p>{detail.summary}</p> : null}
          {detail.relatedProjectSlug ? (
            <p>
              <Link
                className="text-link"
                href={`/projects/${detail.relatedProjectSlug}`}
              >
                Open project case study
              </Link>
            </p>
          ) : null}
          {detail.evidence.length > 0 ? (
            <div className="links">
              {detail.evidence.map((item) =>
                item.url ? (
                  <ExternalLink
                    key={item.id}
                    className="text-link"
                    href={item.url}
                  >
                    {item.label}
                  </ExternalLink>
                ) : (
                  <span key={item.id} className="meta">
                    {item.label}
                  </span>
                ),
              )}
            </div>
          ) : null}
        </>
      ) : (
        <>
          <p className="eyebrow">Detail</p>
          <h3>Select a node</h3>
          <p>
            Click any node in the overview spine or an operational workflow to
            see its summary, project link, and evidence.
          </p>
        </>
      )}
    </aside>
  );
}

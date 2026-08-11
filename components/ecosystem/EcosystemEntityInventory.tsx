"use client";

import Link from "next/link";
import { useState } from "react";

import { ExternalLink } from "@/components/ExternalLink";
import type { Entity, EntityKind } from "@/domain/entities";
import {
  availableEcosystemEntityKinds,
  ecosystemEntityKindLabel,
  filterEntitiesByKind,
} from "@/lib/ecosystem-canvas";

type EcosystemEntityInventoryProps = {
  entities: Entity[];
};

export function EcosystemEntityInventory({
  entities,
}: EcosystemEntityInventoryProps) {
  const kinds = availableEcosystemEntityKinds(entities);
  const [activeKind, setActiveKind] = useState<EntityKind>(
    () => kinds[0] ?? "project",
  );
  const visible = filterEntitiesByKind(entities, activeKind);

  return (
    <div className="ecosystem-inventory stack">
      <div
        className="ecosystem-inventory-filters"
        role="tablist"
        aria-label="Entity kinds"
      >
        {kinds.map((kind) => {
          const selected = kind === activeKind;
          const count = filterEntitiesByKind(entities, kind).length;
          return (
            <button
              key={kind}
              type="button"
              role="tab"
              id={`ecosystem-kind-${kind}`}
              aria-selected={selected}
              aria-controls="ecosystem-inventory-panel"
              className={`ecosystem-inventory-filter${selected ? " is-active" : ""}`}
              onClick={() => setActiveKind(kind)}
            >
              {ecosystemEntityKindLabel(kind)}
              <span className="meta">{count}</span>
            </button>
          );
        })}
      </div>

      <div
        id="ecosystem-inventory-panel"
        role="tabpanel"
        aria-labelledby={`ecosystem-kind-${activeKind}`}
        data-testid="ecosystem-inventory-panel"
      >
        <div className="grid-2">
          {visible.map((entity) => (
            <article key={entity.id} className="card work-card">
              <div className="kicker">
                <span className="pill">{entity.kind}</span>
                {entity.relatedProjectSlug ? (
                  <Link
                    className="meta text-link"
                    href={`/projects/${entity.relatedProjectSlug}`}
                  >
                    {entity.relatedProjectSlug}
                  </Link>
                ) : null}
              </div>
              <h3>{entity.name}</h3>
              <p>{entity.summary}</p>
              {entity.evidence && entity.evidence.length > 0 ? (
                <div className="links">
                  {entity.evidence.map((item) =>
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
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

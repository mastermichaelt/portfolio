"use client";

import { useState } from "react";

import {
  stageCode,
  type ProductionLine as ProductionLineData,
} from "@/domain/production-line";

const SELECTOR_LABEL = "Run a system down the line";

type ProductionLineProps = {
  line: ProductionLineData;
};

/**
 * Ecosystem 1b — "The Line". A fixed five-stage rack, a four-chip selector, and
 * one lane of five cells that re-fills on selection. Exactly one lane is ever
 * visible; the rack and the selection are the whole interaction. Rendered on the
 * server with the default lane so it is a complete worked example without JS.
 */
export function ProductionLine({ line }: ProductionLineProps) {
  const { stages, lanes, defaultSystemId } = line;
  const [selectedId, setSelectedId] = useState(defaultSystemId);

  const activeLane =
    lanes.find((lane) => lane.systemId === selectedId) ?? lanes[0];
  const cellByStage = new Map(
    activeLane.cells.map((cell) => [cell.stageId, cell] as const),
  );

  return (
    <div className="line">
      {/* Rack — fixed and identical across every selection. Below 920px it is
          hidden and each stage is restated inside its lane cell, so the stage
          names and pass conditions stay in the accessibility tree at every
          width without ever being announced twice. */}
      <div className="line-rack" role="list" aria-label="Production stages">
        {stages.map((stage) => (
          <div key={stage.id} className="line-stage" role="listitem">
            <p className="line-stage-code">{`STAGE ${stageCode(stage.order)}`}</p>
            <p className="line-stage-name">{stage.name}</p>
            <p className="line-stage-pass">{stage.passCondition}</p>
          </div>
        ))}
      </div>

      {/* Selector — always exactly one system pressed; no deselect. */}
      <div className="line-selector">
        <p className="label line-selector-label">{SELECTOR_LABEL}</p>
        <div className="line-chips" role="group" aria-label={SELECTOR_LABEL}>
          {lanes.map((lane) => {
            const isSelected = lane.systemId === selectedId;
            return (
              <button
                key={lane.systemId}
                type="button"
                aria-pressed={isSelected}
                className={`line-chip${isSelected ? " is-selected" : ""}`}
                onClick={() => setSelectedId(lane.systemId)}
              >
                {lane.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lane — only these five cells swap on selection. */}
      <div className="line-lane-region" aria-live="polite">
        <div
          key={selectedId}
          className="line-lane"
          data-system={selectedId}
          data-testid="line-lane"
        >
          {stages.map((stage) => {
            const cell = cellByStage.get(stage.id);
            const label = `${stageCode(stage.order)} · ${stage.name}`;
            return (
              <div key={stage.id} className="line-cell" data-stage={stage.id}>
                {/* Stage identity in-cell — revealed (display:block) only below
                    920px, where the rack restacks into per-stage rows. Constant
                    across systems; on desktop it is display:none, so it leaves
                    the accessibility tree and the rack above is the sole source. */}
                <div className="line-cell-stage">
                  <p className="line-stage-code">{`STAGE ${stageCode(stage.order)}`}</p>
                  <p className="line-stage-name">{stage.name}</p>
                  <p className="line-stage-pass">{stage.passCondition}</p>
                </div>
                <div className="line-cell-body">
                  <p className="line-cell-label">{label}</p>
                  {cell ? (
                    <>
                      <p className="line-cell-title">{cell.title}</p>
                      <p className="line-cell-text">{cell.body}</p>
                    </>
                  ) : (
                    // Honest gap: a system that cannot fill a stage shows the
                    // hole rather than inventing copy to hide it.
                    <p className="line-cell-empty">
                      No {stage.name.toLowerCase()} step recorded for this
                      system yet.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

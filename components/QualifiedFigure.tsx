import type { CaseFigure } from "@/domain/project-case";

/**
 * One indivisible qualified figure: value + name + scope, always in this order
 * and never separated. The scope line never truncates, never sits in a
 * scroller, and never drops below its minimum size — a figure whose scope will
 * not fit is simply not shown (an authoring decision, enforced upstream).
 */
export function QualifiedFigure({ figure }: { figure: CaseFigure }) {
  return (
    <div className="qfigure">
      <p className="figure-value">{figure.value}</p>
      <p className="figure-name">{figure.name}</p>
      <p className="figure-scope">{figure.scope}</p>
    </div>
  );
}

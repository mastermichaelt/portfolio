import type { Article, ArticleLineDefinition } from "@/domain/article";
import type { ArticleSystemRef } from "@/content/article-lines";

/** A non-lead report row: its article plus the resolved system label (or null). */
export interface ArticleReportRow {
  article: Article;
  system: ArticleSystemRef | null;
}

/** The lead report that opens a line: its article, argument, and resolved system. */
export interface ArticleLineLead {
  article: Article;
  argument: string;
  /** Null when the line lead has no implementation — rendered as an absence. */
  system: ArticleSystemRef | null;
}

/** One rendered reasoning-line band: head, lead, remaining rows, and count. */
export interface ArticleLineBand {
  id: ArticleLineDefinition["id"];
  /** Two-digit ordinal from render order, e.g. "01". */
  ordinal: string;
  label: string;
  pairs: string;
  note?: string;
  count: number;
  lead: ArticleLineLead;
  reports: ArticleReportRow[];
}

/** Resolves a `relatedProjectSlug` to a system ref, or null when unknown/absent. */
export type ResolveSystem = (
  slug: string | undefined,
) => ArticleSystemRef | null;

function ordinalFor(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/**
 * Group the article inventory into the five reasoning-line bands, in the order
 * the line definitions are given. Pure and render-free so it can be unit-tested.
 * The bands carry everything the line index needs (ordinal, label, count), so
 * the index nav renders straight from them.
 *
 * Each line takes its lead from the single article marked `lineLead`; the
 * remaining reports keep their inventory order. Unknown or absent
 * `relatedProjectSlug` values resolve to `null` (rendered as an empty system /
 * "no implementation attached") rather than throwing. Throws on the structural
 * violations the content tests also guard: a line with no reports, a line whose
 * lead count is not exactly one, or a lead with no argument.
 */
export function groupArticleLines(
  lines: ArticleLineDefinition[],
  articles: Article[],
  resolveSystem: ResolveSystem,
): ArticleLineBand[] {
  return lines.map((line, index) => {
    const members = articles.filter((article) => article.line === line.id);
    if (members.length === 0) {
      throw new Error(`Reasoning line "${line.id}" has no reports.`);
    }

    const leads = members.filter((article) => article.lineLead);
    if (leads.length !== 1) {
      throw new Error(
        `Reasoning line "${line.id}" must have exactly one lead report, found ${leads.length}.`,
      );
    }
    const leadArticle = leads[0]!;
    if (!leadArticle.argument?.trim()) {
      throw new Error(
        `Reasoning line "${line.id}" lead "${leadArticle.slug}" has no argument.`,
      );
    }

    const reports = members
      .filter((article) => article.slug !== leadArticle.slug)
      .map((article) => ({
        article,
        system: resolveSystem(article.relatedProjectSlug),
      }));

    return {
      id: line.id,
      ordinal: ordinalFor(index),
      label: line.label,
      pairs: line.pairs,
      ...(line.note ? { note: line.note } : {}),
      count: members.length,
      lead: {
        article: leadArticle,
        argument: leadArticle.argument.trim(),
        system: resolveSystem(leadArticle.relatedProjectSlug),
      },
      reports,
    };
  });
}

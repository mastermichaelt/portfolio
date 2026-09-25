import { describe, expect, it } from "vitest";

import { articles } from "@/content/articles";
import { projectCases } from "@/content/project-cases";
import { projectsIndex } from "@/content/projects-index";
import type { CaseFigure, ProjectCase } from "@/domain/project-case";
import { StaticPortfolioRepository } from "@/repositories/static-portfolio-repository";

function caseBySlug(slug: string): ProjectCase {
  const found = projectCases.find((entry) => entry.slug === slug);
  expect(found, `case ${slug}`).toBeDefined();
  return found!;
}

function allFigures(entry: ProjectCase): CaseFigure[] {
  return entry.blocks.flatMap((block) => block.figures ?? []);
}

describe("projects 1C — co-primary cases", () => {
  const repository = new StaticPortfolioRepository();

  it("exposes exactly two co-primary cases, Atlassian first", async () => {
    const cases = await repository.listProjectCases();
    expect(cases.map((entry) => entry.slug)).toEqual([
      "experiment-measurement",
      "codenames-ai",
    ]);
    expect(cases[0]?.channelLabel).toBe("CH 02");
    expect(cases[1]?.channelLabel).toBe("CH 01");
  });

  it("has five Atlassian blocks and four Codenames blocks, each ending on a contract", () => {
    const atlassian = caseBySlug("experiment-measurement");
    const codenames = caseBySlug("codenames-ai");

    expect(atlassian.blocks).toHaveLength(5);
    expect(codenames.blocks).toHaveLength(4);

    for (const entry of projectCases) {
      for (const block of entry.blocks) {
        expect(block.contract.trim().length).toBeGreaterThan(0);
        expect(block.heading.trim().length).toBeGreaterThan(0);
        // A block carries a figure set or a figure-absent note, never both.
        expect(Boolean(block.figures) !== Boolean(block.note)).toBe(true);
      }
    }
  });

  it("keeps every figure as value + name + scope with an inventory source", () => {
    for (const figure of projectCases.flatMap(allFigures)) {
      expect(figure.value.trim().length).toBeGreaterThan(0);
      expect(figure.name.trim().length).toBeGreaterThan(0);
      expect(figure.scope.trim().length).toBeGreaterThan(0);
      expect(figure.source.inventory).toMatch(/^resumes\/facts\/.+\.yml$/);
      expect(figure.source.factId.trim().length).toBeGreaterThan(0);
    }
  });

  it("marks exactly two index figures per co-primary case", () => {
    for (const entry of projectCases) {
      const onIndex = allFigures(entry).filter((figure) => figure.onIndex);
      expect(onIndex).toHaveLength(2);
    }
  });

  it("renders Codenames blocks 01 and 02 as the figure-absent state", () => {
    const codenames = caseBySlug("codenames-ai");
    for (const id of ["b01", "b02"]) {
      const block = codenames.blocks.find((b) => b.id === id);
      expect(block?.figures).toBeUndefined();
      expect(block?.note?.closing.trim().length).toBeGreaterThan(0);
    }
    expect(codenames.blocks.find((b) => b.id === "b01")?.note?.closing).toMatch(
      /No figure is claimed for this block/i,
    );
  });

  it("publishes 175+ as the durable floor and never the exact snapshot 175", () => {
    const figures = projectCases.flatMap(allFigures);
    expect(figures.some((figure) => figure.value === "175+")).toBe(true);
    expect(figures.some((figure) => figure.value === "175")).toBe(false);

    const players = figures.find((figure) => figure.value === "175+");
    expect(players?.scope).toMatch(/durable floor/i);

    const branded = figures.find((figure) => figure.value === "#1");
    expect(branded?.scope).toMatch(/28 days/i);
  });

  it("keeps EM and AIM metrics out of the Atlassian case entirely", () => {
    const atlassian = caseBySlug("experiment-measurement");
    // Role spine mention lives in the aside, in words, with no metrics.
    expect(atlassian.aside.label).toBe("Role spine");
    expect(atlassian.aside.note).toMatch(/Mentoring/i);

    const serialized = JSON.stringify(atlassian);
    for (const excluded of ["8–10", "3,552", "86%", ">60,000", "100%"]) {
      expect(serialized).not.toContain(excluded);
    }
  });

  it("states both Atlassian artifact absences without a fabricated field report", () => {
    const atlassian = caseBySlug("experiment-measurement");
    const affordances = atlassian.artifacts.rows.map((row) => row.affordance);
    expect(affordances).toContain("Private");
    expect(affordances).toContain("Adjacent");

    // No article claims a relationship to this private work.
    expect(
      articles.some(
        (article) => article.relatedProjectSlug === "experiment-measurement",
      ),
    ).toBe(false);
  });

  it("names the block each Codenames field report documents", () => {
    const codenames = caseBySlug("codenames-ai");
    const reports = codenames.artifacts.rows.filter((row) =>
      row.id.startsWith("report-"),
    );
    expect(reports).toHaveLength(3);
    for (const report of reports) {
      const text = (report.description ?? [])
        .map((segment) => segment.text)
        .join(" ");
      expect(text).toMatch(/block 0\d/);
      expect(report.href).toMatch(/^https:\/\/dev\.to\//);
    }
  });
});

describe("projects 1C — index composition", () => {
  const repository = new StaticPortfolioRepository();

  it("orders tiers explicitly, not by a featured flag", async () => {
    const index = await repository.getProjectsIndex();

    expect(index.coPrimary.map((row) => row.title)).toEqual([
      "Codenames AI",
      "Experiment measurement",
    ]);
    expect(index.supporting.map((row) => row.title)).toEqual([
      "Editorial workflow",
      "Renovate governance",
      "Agent-native systems",
    ]);
    expect(index.infrastructure.map((row) => row.title)).toEqual([
      "Resume generator",
    ]);
  });

  it("shows exactly the two index figures per co-primary, drawn from the cases", () => {
    const figureValues = projectsIndex.coPrimary.flatMap((row) =>
      row.figures.map((figure) => figure.value),
    );
    expect(figureValues).toEqual(["350", "175+", ">10%", "9%–41%"]);

    for (const row of projectsIndex.coPrimary) {
      expect(row.figures).toHaveLength(2);
      for (const figure of row.figures) {
        expect(figure.onIndex).toBe(true);
        expect(figure.scope.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("gives the resume generator an infrastructure row with no link", () => {
    const resume = projectsIndex.infrastructure[0];
    expect(resume?.proofSurface).toMatch(/no public URL/i);
    // Infrastructure rows carry no href — they are not interactive.
    expect(resume).not.toHaveProperty("href");
  });

  it("previews depth with one chip per detail block", () => {
    const codenames = projectsIndex.coPrimary[0];
    const atlassian = projectsIndex.coPrimary[1];
    expect(atlassian?.chips).toHaveLength(5);
    expect(codenames?.chips).toHaveLength(4);
  });
});

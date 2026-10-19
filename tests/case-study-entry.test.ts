import { describe, expect, it } from "vitest";

import {
  caseStudyMetadataFields,
  type CaseStudyEntry,
  listCaseStudyParams,
  resolveCaseStudyEntry,
} from "@/lib/case-study-entry";
import type { PortfolioRepository } from "@/repositories/portfolio-repository";

describe("resolveCaseStudyEntry", () => {
  it("resolves a project case", async () => {
    const entry = await resolveCaseStudyEntry("codenames-ai");
    expect(entry?.kind).toBe("case");
    expect(entry?.kind === "case" && entry.projectCase.slug).toBe(
      "codenames-ai",
    );
  });

  it("resolves a supporting case with its workflow view", async () => {
    const entry = await resolveCaseStudyEntry("editorial-workflow");
    expect(entry?.kind).toBe("supporting");
    if (entry?.kind !== "supporting") return;
    expect(entry.supportingCase.slug).toBe("editorial-workflow");
    expect(entry.workflowView).toBeTruthy();
  });

  it("returns null for an unknown slug", async () => {
    expect(await resolveCaseStudyEntry("nope")).toBeNull();
  });

  it("returns null for a supporting case without a workflow view (page 404s)", async () => {
    const repository = {
      getProjectCase: async () => null,
      getSupportingCase: async (slug: string) => ({ slug }),
      getProjectWorkflowView: async () => null,
      getProject: async () => null,
    } as unknown as PortfolioRepository;

    expect(
      await resolveCaseStudyEntry("orphan-supporting", repository),
    ).toBeNull();
  });

  it("resolves every prerendered slug", async () => {
    const params = await listCaseStudyParams();
    expect(params.map((p) => p.slug).sort()).toEqual([
      "codenames-ai",
      "editorial-workflow",
      "experiment-measurement",
      "renovate-governance",
    ]);
    for (const { slug } of params) {
      expect(await resolveCaseStudyEntry(slug)).not.toBeNull();
    }
  });

  it("maps every entry kind to metadata name and description", () => {
    expect(
      caseStudyMetadataFields({
        kind: "case",
        projectCase: { name: "Case", lead: "Case lead" },
      } as CaseStudyEntry),
    ).toEqual({ name: "Case", description: "Case lead" });
    expect(
      caseStudyMetadataFields({
        kind: "supporting",
        supportingCase: { name: "Supporting", lead: "Supporting lead" },
      } as CaseStudyEntry),
    ).toEqual({ name: "Supporting", description: "Supporting lead" });
    expect(
      caseStudyMetadataFields({
        kind: "project",
        project: { title: "Project", summary: "Project summary" },
      } as CaseStudyEntry),
    ).toEqual({ name: "Project", description: "Project summary" });
  });
});

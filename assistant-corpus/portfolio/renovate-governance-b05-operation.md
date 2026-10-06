---
type: Case Study Block
title: Renovate governance ladder — Operation
resource: "https://michaeltruong.ai/projects/renovate-governance#b05"
sources:
  - id: "portfolio-renovate-governance"
    title: Renovate governance ladder
    resource: "https://michaeltruong.ai/projects/renovate-governance"
generated:
  by: "process:portfolio-okf-producer"
tags:
  - "renovate-governance"
  - portfolio
  - operation
  - b05
---

Operators run /renovate-classifier (or /renovate-loop for batch), route by packet, and for investigation-eligible stops run the investigator, human-audit the report, then invoke /renovate-maintainer --approved.

Each maintainer run writes a gitignored audit report.

Run order: /renovate-classifier; route by packet; investigator + human audit; /renovate-maintainer --approved — Automation triggers deferred to Phase 6.

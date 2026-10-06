---
type: Case Study Block
title: Renovate governance ladder — System
resource: "https://michaeltruong.ai/projects/renovate-governance#b01"
sources:
  - id: "portfolio-renovate-governance"
    title: Renovate governance ladder
    resource: "https://michaeltruong.ai/projects/renovate-governance"
generated:
  by: "process:portfolio-okf-producer"
tags:
  - "renovate-governance"
  - portfolio
  - system
  - b01
---

Open Renovate PRs are handled through a manual four-step ladder: classify one active (non-draft) PR per run into a YAML execution packet; route to maintainer auto-path, investigation, or hard stop; optionally investigate high-touch/unlisted packages; then execute only when policy and CI allow.

Draft Renovate PRs stay parked until marked ready — they are reported in discovery but not selectable by the ladder.

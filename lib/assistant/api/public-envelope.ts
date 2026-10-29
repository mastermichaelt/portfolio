import type { AssistantGenerationResponse } from "@/scripts/assistant/generation/response-schema.mjs";

import {
  type CitationDisplayMetadata,
  lookupCitationDisplay,
} from "./citation-display";

/** Allowlisted visitor-safe fields on each citation (integrity ids + server-enriched display). */
export type AssistantPublicCitation = {
  evidence_id: string;
  unit_id: string;
  source_label?: string;
  source_url?: string;
};

/** Visitor-safe answer payload (no evidence packets or internal diagnostics). */
export type AssistantPublicAnswer = {
  claims: Array<
    Omit<AssistantGenerationResponse["claims"][number], "citations"> & {
      citations?: AssistantPublicCitation[];
    }
  >;
  answer_text: string;
  citations: AssistantPublicCitation[];
  support_level: AssistantGenerationResponse["support_level"];
  abstained: boolean;
  abstention_reason?: AssistantGenerationResponse["abstention_reason"];
};

/** Allowlisted OpenAI usage fields only — omit when unavailable (never zero-fill). */
export type AssistantPublicUsage = {
  model?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

export type AssistantGenerateSuccessBody = {
  answer: AssistantPublicAnswer;
  usage?: AssistantPublicUsage;
};

const USAGE_ALLOWLIST = new Set([
  "model",
  "prompt_tokens",
  "completion_tokens",
  "total_tokens",
]);

const CITATION_ALLOWLIST = new Set([
  "evidence_id",
  "unit_id",
  "source_label",
  "source_url",
]);

type ModelCitation = AssistantGenerationResponse["citations"][number];
type ModelClaim = AssistantGenerationResponse["claims"][number];

function projectPublicCitation(
  citation: ModelCitation,
  displayByKey?: Map<string, CitationDisplayMetadata>,
): AssistantPublicCitation {
  const projected: AssistantPublicCitation = {
    evidence_id: citation.evidence_id,
    unit_id: citation.unit_id,
  };

  const display = displayByKey
    ? lookupCitationDisplay(
        displayByKey,
        citation.evidence_id,
        citation.unit_id,
      )
    : undefined;

  if (display?.source_label) {
    projected.source_label = display.source_label;
  }
  if (display?.source_url) {
    projected.source_url = display.source_url;
  }

  return projected;
}

function projectPublicClaim(
  claim: ModelClaim,
  displayByKey?: Map<string, CitationDisplayMetadata>,
): AssistantPublicAnswer["claims"][number] {
  const projected: AssistantPublicAnswer["claims"][number] = {
    text: claim.text,
    attribution: claim.attribution,
  };

  if (claim.citations !== undefined) {
    projected.citations = claim.citations.map((citation) =>
      projectPublicCitation(citation, displayByKey),
    );
  }

  return projected;
}

export function buildPublicAnswer(
  response: AssistantGenerationResponse,
  displayByKey?: Map<string, CitationDisplayMetadata>,
): AssistantPublicAnswer {
  const claims = response.claims.map((claim) =>
    projectPublicClaim(claim, displayByKey),
  );
  const citations = response.citations.map((citation) =>
    projectPublicCitation(citation, displayByKey),
  );

  const answer: AssistantPublicAnswer = {
    claims,
    answer_text: response.answer_text,
    citations,
    support_level: response.support_level,
    abstained: response.abstained,
  };

  if (response.abstained && response.abstention_reason) {
    answer.abstention_reason = response.abstention_reason;
  }

  return answer;
}

export function buildPublicUsageFromDiagnostics(diagnostics: {
  model?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}): AssistantPublicUsage | undefined {
  const hasTokenUsage =
    typeof diagnostics.prompt_tokens === "number" ||
    typeof diagnostics.completion_tokens === "number" ||
    typeof diagnostics.total_tokens === "number";

  if (!hasTokenUsage) {
    return undefined;
  }

  const usage: AssistantPublicUsage = {};

  if (typeof diagnostics.model === "string" && diagnostics.model.trim()) {
    usage.model = diagnostics.model.trim();
  }
  if (typeof diagnostics.prompt_tokens === "number") {
    usage.prompt_tokens = diagnostics.prompt_tokens;
  }
  if (typeof diagnostics.completion_tokens === "number") {
    usage.completion_tokens = diagnostics.completion_tokens;
  }
  if (typeof diagnostics.total_tokens === "number") {
    usage.total_tokens = diagnostics.total_tokens;
  }

  return usage;
}

/** Keys that must never appear in a successful API JSON body. */
export const DISALLOWED_PUBLIC_RESPONSE_KEYS = [
  "diagnostics",
  "packet",
  "evidence",
  "entries",
  "matched_hits",
  "embedding",
  "embeddings",
  "prompt",
  "system",
  "user",
  "messages",
  "OPENAI_API_KEY",
  "OPENAI_PROJECT_ID",
  "DATABASE_URL",
  "output_token_utilization",
  "evidence_character_budget",
  "attribution_counts",
  "retrieval_latency_ms",
  "assembly_latency_ms",
  "generation_latency_ms",
  "total_latency_ms",
  "evidence_entry_count",
  "evidence_character_count",
  "truncated",
  "assembly_mode",
  "error_category",
  "stack",
  "stackTrace",
] as const;

function assertCitationObject(value: unknown, path: string): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [`${path} must be an object`];
  }

  const violations: string[] = [];
  for (const key of Object.keys(value)) {
    if (!CITATION_ALLOWLIST.has(key)) {
      violations.push(`${path}.${key}`);
    }
  }
  return violations;
}

export function assertNoDisallowedPublicKeys(
  value: unknown,
  path = "",
): string[] {
  const violations: string[] = [];

  if (value === null || typeof value !== "object") {
    return violations;
  }

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      violations.push(
        ...assertNoDisallowedPublicKeys(item, `${path}[${index}]`),
      );
    }
    return violations;
  }

  for (const [key, nested] of Object.entries(value)) {
    const fullPath = path ? `${path}.${key}` : key;

    if (USAGE_ALLOWLIST.has(key) || key === "answer" || key === "usage") {
      if (key === "usage" && nested && typeof nested === "object") {
        for (const usageKey of Object.keys(nested)) {
          if (!USAGE_ALLOWLIST.has(usageKey)) {
            violations.push(`${fullPath}.${usageKey}`);
          }
        }
      }
      violations.push(...assertNoDisallowedPublicKeys(nested, fullPath));
      continue;
    }

    if (key === "citations" && Array.isArray(nested)) {
      for (const [index, citation] of nested.entries()) {
        violations.push(
          ...assertCitationObject(citation, `${fullPath}[${index}]`),
        );
        violations.push(
          ...assertNoDisallowedPublicKeys(citation, `${fullPath}[${index}]`),
        );
      }
      continue;
    }

    if (
      DISALLOWED_PUBLIC_RESPONSE_KEYS.includes(
        key as (typeof DISALLOWED_PUBLIC_RESPONSE_KEYS)[number],
      )
    ) {
      violations.push(fullPath);
    }

    violations.push(...assertNoDisallowedPublicKeys(nested, fullPath));
  }

  return violations;
}

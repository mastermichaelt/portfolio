import type { AssistantGenerationResponse } from "@/scripts/assistant/generation/response-schema.mjs";

/** Visitor-safe answer payload (no evidence packets or internal diagnostics). */
export type AssistantPublicAnswer = {
  claims: AssistantGenerationResponse["claims"];
  answer_text: string;
  citations: AssistantGenerationResponse["citations"];
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

export function buildPublicAnswer(
  response: AssistantGenerationResponse,
): AssistantPublicAnswer {
  const answer: AssistantPublicAnswer = {
    claims: response.claims,
    answer_text: response.answer_text,
    citations: response.citations,
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

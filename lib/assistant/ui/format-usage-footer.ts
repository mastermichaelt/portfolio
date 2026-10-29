import type { AssistantPublicUsage } from "@/lib/assistant/api/public-envelope";

const MODEL_DISPLAY: Record<string, string> = {
  "gpt-4o-mini": "GPT-4o mini",
  "gpt-4o": "GPT-4o",
};

export function formatModelDisplayName(
  model: string | undefined,
): string | undefined {
  if (!model?.trim()) {
    return undefined;
  }
  const trimmed = model.trim();
  return MODEL_DISPLAY[trimmed] ?? trimmed;
}

export type UsageFooterParts = {
  modelLabel?: string;
  promptTokens?: number;
  completionTokens?: number;
  title?: string;
};

/**
 * Build visitor-visible usage footer parts. Returns undefined when nothing
 * meaningful should render (never zero-fills missing counts).
 */
export function buildUsageFooterParts(
  usage: AssistantPublicUsage | undefined,
): UsageFooterParts | undefined {
  if (!usage) {
    return undefined;
  }

  const modelLabel = formatModelDisplayName(usage.model);
  const promptTokens =
    typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : undefined;
  const completionTokens =
    typeof usage.completion_tokens === "number"
      ? usage.completion_tokens
      : undefined;

  const hasCounts =
    promptTokens !== undefined || completionTokens !== undefined;

  if (!modelLabel && !hasCounts) {
    return undefined;
  }

  const titleSegments: string[] = [];
  if (modelLabel) {
    titleSegments.push(modelLabel);
  }
  if (promptTokens !== undefined) {
    titleSegments.push(`${promptTokens.toLocaleString()} input tokens`);
  }
  if (completionTokens !== undefined) {
    titleSegments.push(`${completionTokens.toLocaleString()} output tokens`);
  }
  if (
    typeof usage.total_tokens === "number" &&
    (promptTokens === undefined || completionTokens === undefined)
  ) {
    titleSegments.push(`${usage.total_tokens.toLocaleString()} total tokens`);
  }

  return {
    modelLabel,
    promptTokens,
    completionTokens,
    title: titleSegments.length > 0 ? titleSegments.join(" · ") : undefined,
  };
}

export function formatUsageFooterLine(parts: UsageFooterParts): string {
  const segments: string[] = [];
  if (parts.modelLabel) {
    segments.push(parts.modelLabel);
  }
  if (parts.promptTokens !== undefined) {
    segments.push(`${parts.promptTokens.toLocaleString()} input tokens`);
  }
  if (parts.completionTokens !== undefined) {
    segments.push(`${parts.completionTokens.toLocaleString()} output tokens`);
  }
  return segments.join(" · ");
}

import type {
  AssistantGenerateSuccessBody,
  AssistantPublicAnswer,
  AssistantPublicUsage,
} from "@/lib/assistant/api/public-envelope";
import type { AssistantApiErrorBody } from "@/lib/assistant/api/errors";

export type AssistantGenerateResult =
  | {
      ok: true;
      answer: AssistantPublicAnswer;
      usage?: AssistantPublicUsage;
    }
  | {
      ok: false;
      status: number;
      code: string;
      message: string;
    };

const GENERATE_PATH = "/api/assistant/generate";

const CLAIM_ATTRIBUTIONS = new Set([
  "evidence_supported",
  "evidence_inferred",
  "general_knowledge",
  "uncertain",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPublicUsage(value: unknown): value is AssistantPublicUsage {
  if (!isPlainObject(value)) {
    return false;
  }
  const allowed = [
    "model",
    "prompt_tokens",
    "completion_tokens",
    "total_tokens",
  ];
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      return false;
    }
  }
  if (value.model !== undefined && typeof value.model !== "string") {
    return false;
  }
  for (const key of [
    "prompt_tokens",
    "completion_tokens",
    "total_tokens",
  ] as const) {
    if (value[key] !== undefined && typeof value[key] !== "number") {
      return false;
    }
  }
  return true;
}

function isPublicCitation(value: unknown): boolean {
  if (!isPlainObject(value)) {
    return false;
  }
  const allowed = ["evidence_id", "unit_id", "source_label", "source_url"];
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      return false;
    }
  }
  if (
    typeof value.evidence_id !== "string" ||
    !value.evidence_id ||
    typeof value.unit_id !== "string" ||
    !value.unit_id
  ) {
    return false;
  }
  if (
    value.source_label !== undefined &&
    typeof value.source_label !== "string"
  ) {
    return false;
  }
  if (value.source_url !== undefined) {
    if (typeof value.source_url !== "string") {
      return false;
    }
    try {
      const parsed = new URL(value.source_url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return false;
      }
    } catch {
      return false;
    }
  }
  return true;
}

function isPublicClaim(value: unknown): boolean {
  if (!isPlainObject(value)) {
    return false;
  }
  if (typeof value.text !== "string" || !value.text.trim()) {
    return false;
  }
  if (
    typeof value.attribution !== "string" ||
    !CLAIM_ATTRIBUTIONS.has(value.attribution)
  ) {
    return false;
  }
  if (value.citations !== undefined) {
    if (!Array.isArray(value.citations)) {
      return false;
    }
    for (const citation of value.citations) {
      if (!isPublicCitation(citation)) {
        return false;
      }
    }
  }
  return true;
}

/** Minimum shape check for a successful generation API payload. */
export function parseAssistantGenerateSuccessBody(
  raw: unknown,
): AssistantGenerateSuccessBody | null {
  if (!isPlainObject(raw) || !isPlainObject(raw.answer)) {
    return null;
  }

  const answer = raw.answer;
  if (!Array.isArray(answer.claims) || answer.claims.length === 0) {
    return null;
  }
  if (!answer.claims.every(isPublicClaim)) {
    return null;
  }
  if (typeof answer.answer_text !== "string") {
    return null;
  }
  if (!Array.isArray(answer.citations)) {
    return null;
  }
  if (!answer.citations.every(isPublicCitation)) {
    return null;
  }
  if (typeof answer.support_level !== "string") {
    return null;
  }
  if (typeof answer.abstained !== "boolean") {
    return null;
  }
  if (
    answer.abstention_reason !== undefined &&
    typeof answer.abstention_reason !== "string"
  ) {
    return null;
  }
  if (raw.usage !== undefined && !isPublicUsage(raw.usage)) {
    return null;
  }

  return raw as AssistantGenerateSuccessBody;
}

export async function postAssistantGenerate(
  question: string,
  signal?: AbortSignal,
): Promise<AssistantGenerateResult> {
  let response: Response;
  try {
    response = await fetch(GENERATE_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        ok: false,
        status: 0,
        code: "aborted",
        message: "Request cancelled.",
      };
    }
    return {
      ok: false,
      status: 0,
      code: "network_error",
      message:
        "Could not reach the assistant. Check your connection and try again.",
    };
  }

  if (response.ok) {
    let raw: unknown;
    try {
      raw = await response.json();
    } catch {
      return {
        ok: false,
        status: response.status,
        code: "invalid_response",
        message:
          "The assistant returned an unreadable response. Please try again.",
      };
    }

    const body = parseAssistantGenerateSuccessBody(raw);
    if (!body) {
      return {
        ok: false,
        status: response.status,
        code: "invalid_response",
        message:
          "The assistant returned an unexpected response. Please try again.",
      };
    }

    return {
      ok: true,
      answer: body.answer,
      usage: body.usage,
    };
  }

  let message =
    "The assistant could not complete your request. Please try again.";
  let code = "unknown_error";

  try {
    const body = (await response.json()) as AssistantApiErrorBody;
    if (body.error?.message) {
      message = body.error.message;
    }
    if (body.error?.code) {
      code = body.error.code;
    }
  } catch {
    // keep defaults
  }

  return {
    ok: false,
    status: response.status,
    code,
    message,
  };
}

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
    const body = (await response.json()) as AssistantGenerateSuccessBody;
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

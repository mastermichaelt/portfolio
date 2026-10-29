"use client";

import type { RefObject } from "react";

import type {
  AssistantPublicAnswer,
  AssistantPublicUsage,
} from "@/lib/assistant/api/public-envelope";
import { abstentionMessage } from "@/lib/assistant/ui/attribution-copy";

import { AssistantMessageBody } from "./AssistantMessageBody";
import { AssistantUsageFooter } from "./AssistantUsageFooter";

export function AssistantAssistantMessage({
  turnId,
  status,
  answer,
  usage,
  errorMessage,
  focusRef,
}: {
  turnId: string;
  status: "loading" | "success" | "error";
  answer?: AssistantPublicAnswer;
  usage?: AssistantPublicUsage;
  errorMessage?: string;
  focusRef?: RefObject<HTMLDivElement | null>;
}) {
  if (status === "loading") {
    return (
      <div
        className="assistant-message assistant-message--assistant assistant-message--loading"
        aria-live="polite"
        role="status"
      >
        <p className="assistant-message-label">Assistant</p>
        <p className="assistant-message-status">
          <span className="assistant-spinner" aria-hidden="true" />
          Searching evidence and drafting an answer…
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className="assistant-message assistant-message--assistant assistant-message--error"
        role="alert"
      >
        <p className="assistant-message-label">Assistant</p>
        <div className="assistant-callout assistant-callout--error">
          <p className="assistant-callout-title">Something went wrong</p>
          <p>{errorMessage ?? "Please try again."}</p>
        </div>
      </div>
    );
  }

  if (!answer) {
    return null;
  }

  return (
    <div
      ref={focusRef}
      tabIndex={-1}
      className="assistant-message assistant-message--assistant assistant-message--success assistant-answer-focus"
      aria-live="polite"
      data-turn-id={turnId}
    >
      <p className="assistant-message-label">Assistant</p>
      {answer.abstained ? (
        <div
          className="assistant-callout assistant-callout--abstain"
          role="status"
        >
          <p className="assistant-callout-title">Limited answer</p>
          <p>{abstentionMessage(answer.abstention_reason)}</p>
        </div>
      ) : null}
      <AssistantMessageBody claims={answer.claims} />
      <AssistantUsageFooter usage={usage} />
    </div>
  );
}

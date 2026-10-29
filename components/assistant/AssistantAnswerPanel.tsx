"use client";

import type {
  AssistantPublicAnswer,
  AssistantPublicUsage,
} from "@/lib/assistant/api/public-envelope";
import { abstentionMessage } from "@/lib/assistant/ui/attribution-copy";

import { AssistantMessageBody } from "./AssistantMessageBody";
import { AssistantUsageFooter } from "./AssistantUsageFooter";

export function AssistantAnswerPanel({
  answer,
  usage,
}: {
  answer: AssistantPublicAnswer;
  usage?: AssistantPublicUsage;
}) {
  return (
    <section className="assistant-answer" aria-live="polite" aria-busy={false}>
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
    </section>
  );
}

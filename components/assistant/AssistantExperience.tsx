"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { postAssistantGenerate } from "@/lib/assistant/client/post-generate";
import {
  appendLoadingTurn,
  createTurnId,
  resolveTurn,
  type TranscriptTurn,
} from "@/lib/assistant/ui/transcript-turns";

import { AssistantComposer } from "./AssistantComposer";
import { AssistantSuggestedQuestions } from "./AssistantSuggestedQuestions";
import { AssistantTranscript } from "./AssistantTranscript";

export function AssistantExperience() {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [focusTurnId, setFocusTurnId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const hasInteracted = turns.length > 0;
  const inFlight = turns.some((turn) => turn.status === "loading");

  const submitQuestion = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const turnId = createTurnId();
    setTurns((prev) => appendLoadingTurn(prev, trimmed, turnId));
    setQuestion("");

    const result = await postAssistantGenerate(trimmed, controller.signal);

    if (!result.ok && result.code === "aborted") {
      setTurns((prev) =>
        resolveTurn(prev, turnId, {
          status: "error",
          errorMessage: "Request cancelled.",
        }),
      );
      return;
    }

    if (result.ok) {
      setTurns((prev) =>
        resolveTurn(prev, turnId, {
          status: "success",
          answer: result.answer,
          usage: result.usage,
        }),
      );
      setFocusTurnId(turnId);
      return;
    }

    setTurns((prev) =>
      resolveTurn(prev, turnId, {
        status: "error",
        errorMessage: result.message,
      }),
    );
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const clearConversation = useCallback(() => {
    abortRef.current?.abort();
    setTurns([]);
    setFocusTurnId(null);
    setQuestion("");
  }, []);

  const handleFocusTurnHandled = useCallback(() => {
    setFocusTurnId(null);
  }, []);

  return (
    <div className="assistant-shell assistant-shell--chat fade-in">
      {!hasInteracted ? (
        <>
          <header className="assistant-intro">
            <p className="eyebrow">Assistant · grounded answers</p>
            <h1>Ask about Michael&apos;s published work.</h1>
            <p className="lead measure">
              Questions run against the same indexed portfolio corpus used for
              retrieval experiments — answers show claim-level attribution and
              citations when evidence supports them.
            </p>
          </header>

          <AssistantSuggestedQuestions
            disabled={inFlight}
            onSelect={(value) => {
              void submitQuestion(value);
            }}
          />
        </>
      ) : null}

      <AssistantTranscript
        turns={turns}
        focusTurnId={focusTurnId}
        onFocusTurnHandled={handleFocusTurnHandled}
      />

      {hasInteracted ? (
        <div className="assistant-transcript-actions">
          <button
            type="button"
            className="btn btn-ghost assistant-clear"
            disabled={inFlight}
            onClick={clearConversation}
          >
            Clear conversation
          </button>
        </div>
      ) : null}

      <AssistantComposer
        question={question}
        disabled={inFlight}
        onQuestionChange={setQuestion}
        onSubmit={() => void submitQuestion(question)}
      />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { postAssistantGenerate } from "@/lib/assistant/client/post-generate";
import {
  clearAssistantSession,
  submitAssistantQuestionSingleFlight,
} from "@/lib/assistant/ui/single-flight-submit";
import type { SubmissionLockState } from "@/lib/assistant/ui/submission-lock";
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
  const [scrollGeneration, setScrollGeneration] = useState(0);
  const turnsRef = useRef(turns);

  const syncTurnsRef = useCallback((next: TranscriptTurn[]) => {
    turnsRef.current = next;
    return next;
  }, []);

  const abortRef = useRef<AbortController | null>(null);
  const sessionEpochRef = useRef(0);
  const submissionLockRef = useRef<SubmissionLockState>({
    inFlight: false,
    ownerId: null,
  });

  const hasInteracted = turns.length > 0;
  const inFlight = turns.some((turn) => turn.status === "loading");

  const submitQuestion = useCallback(
    async (raw: string) => {
      await submitAssistantQuestionSingleFlight(raw, {
        lock: submissionLockRef.current,
        sessionEpoch: sessionEpochRef,
        abortRef,
        createId: createTurnId,
        postGenerate: postAssistantGenerate,
        callbacks: {
          bumpScrollGeneration: () => {
            setScrollGeneration((value) => value + 1);
          },
          appendLoadingTurn: (turnId, trimmed) => {
            setTurns((prev) =>
              syncTurnsRef(appendLoadingTurn(prev, trimmed, turnId)),
            );
          },
          clearComposer: () => {
            setQuestion("");
          },
          getTurns: () => turnsRef.current,
          resolveTurnSuccess: (turnId, answer, usage) => {
            setTurns((prev) =>
              syncTurnsRef(
                resolveTurn(prev, turnId, {
                  status: "success",
                  answer,
                  usage,
                }),
              ),
            );
          },
          resolveTurnError: (turnId, message) => {
            setTurns((prev) =>
              syncTurnsRef(
                resolveTurn(prev, turnId, {
                  status: "error",
                  errorMessage: message,
                }),
              ),
            );
          },
          focusSuccessTurn: (turnId) => {
            setFocusTurnId(turnId);
          },
        },
      });
    },
    [syncTurnsRef],
  );

  useEffect(() => {
    const lock = submissionLockRef.current;
    return () => {
      clearAssistantSession({
        lock,
        sessionEpoch: sessionEpochRef,
        abortRef,
      });
    };
  }, []);

  const clearConversation = useCallback(() => {
    clearAssistantSession({
      lock: submissionLockRef.current,
      sessionEpoch: sessionEpochRef,
      abortRef,
    });
    turnsRef.current = [];
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
        scrollGeneration={scrollGeneration}
        focusTurnId={focusTurnId}
        onFocusTurnHandled={handleFocusTurnHandled}
      />

      {hasInteracted ? (
        <div className="assistant-transcript-actions">
          <button
            type="button"
            className="btn btn-ghost assistant-clear"
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

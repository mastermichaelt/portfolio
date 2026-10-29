"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { postAssistantGenerate } from "@/lib/assistant/client/post-generate";
import type {
  AssistantPublicAnswer,
  AssistantPublicUsage,
} from "@/lib/assistant/api/public-envelope";

import { AssistantAnswerPanel } from "./AssistantAnswerPanel";
import { AssistantQuestionForm } from "./AssistantQuestionForm";
import { AssistantSuggestedQuestions } from "./AssistantSuggestedQuestions";

type UiState =
  | { kind: "idle" }
  | { kind: "loading" }
  | {
      kind: "success";
      answer: AssistantPublicAnswer;
      usage?: AssistantPublicUsage;
    }
  | { kind: "error"; message: string };

export function AssistantExperience() {
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<UiState>({ kind: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const answerRef = useRef<HTMLDivElement | null>(null);

  const loading = state.kind === "loading";

  const submitQuestion = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ kind: "loading" });

    const result = await postAssistantGenerate(trimmed, controller.signal);

    if (controller.signal.aborted) {
      return;
    }

    if (result.ok) {
      setState({
        kind: "success",
        answer: result.answer,
        usage: result.usage,
      });
      return;
    }

    if (result.code === "aborted") {
      setState({ kind: "idle" });
      return;
    }

    setState({ kind: "error", message: result.message });
  }, []);

  useEffect(() => {
    if (state.kind === "success" && answerRef.current) {
      answerRef.current.focus({ preventScroll: true });
    }
  }, [state.kind]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return (
    <div className="assistant-shell fade-in">
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
        disabled={loading}
        onSelect={(value) => {
          setQuestion(value);
          void submitQuestion(value);
        }}
      />

      <AssistantQuestionForm
        question={question}
        disabled={loading}
        onQuestionChange={setQuestion}
        onSubmit={() => void submitQuestion(question)}
      />

      {loading ? (
        <p className="assistant-status" role="status" aria-live="polite">
          <span className="assistant-spinner" aria-hidden="true" />
          Searching evidence and drafting an answer…
        </p>
      ) : null}

      {state.kind === "error" ? (
        <div
          className="assistant-callout assistant-callout--error"
          role="alert"
        >
          <p className="assistant-callout-title">Something went wrong</p>
          <p>{state.message}</p>
        </div>
      ) : null}

      {state.kind === "success" ? (
        <div ref={answerRef} tabIndex={-1} className="assistant-answer-focus">
          <AssistantAnswerPanel answer={state.answer} usage={state.usage} />
        </div>
      ) : null}
    </div>
  );
}

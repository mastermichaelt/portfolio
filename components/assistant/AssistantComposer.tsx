"use client";

import { useId } from "react";

const STATELESS_DISCLAIMER =
  "Each question is answered independently from published sources. Earlier messages in this view are not sent to the model.";
const EVALUATION_DISCLOSURE =
  "Questions and answers may be stored for up to 30 days to improve the assistant. They are not shared in analytics events.";
const SUBJECT_HINT =
  "For follow-ups, name the subject in your question (for example the project or topic).";

export function AssistantComposer({
  question,
  submitDisabled,
  onQuestionChange,
  onSubmit,
}: {
  question: string;
  /** Blocks Send / Enter submit while a generation request is in flight. */
  submitDisabled: boolean;
  onQuestionChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const fieldId = useId();
  const hintId = `${fieldId}-hint`;
  const statelessId = `${fieldId}-stateless`;

  return (
    <div className="assistant-composer-wrap">
      <form
        className="assistant-form assistant-composer"
        onSubmit={(event) => {
          event.preventDefault();
          if (submitDisabled || question.trim().length === 0) {
            return;
          }
          onSubmit();
        }}
      >
        <label className="assistant-form-label" htmlFor={fieldId}>
          Your question
        </label>
        <p id={hintId} className="assistant-form-hint">
          Answers use published portfolio evidence where possible. Personal
          details stay conservative when evidence is thin. Press Enter to send;
          Shift+Enter for a new line.
        </p>
        <textarea
          id={fieldId}
          name="question"
          className="assistant-input"
          rows={3}
          value={question}
          aria-describedby={`${hintId} ${statelessId}`}
          onChange={(event) => onQuestionChange(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key !== "Enter" ||
              event.shiftKey ||
              event.nativeEvent.isComposing
            ) {
              return;
            }
            event.preventDefault();
            if (submitDisabled || question.trim().length === 0) {
              return;
            }
            onSubmit();
          }}
          placeholder="Ask about projects, articles, or how Michael builds with agents…"
        />
        <div className="assistant-form-actions">
          <button
            type="submit"
            className="btn btn-primary assistant-submit"
            disabled={submitDisabled || question.trim().length === 0}
          >
            {submitDisabled ? "Thinking…" : "Send"}
          </button>
        </div>
      </form>
      <div id={statelessId} className="assistant-stateless-hints">
        <p>{STATELESS_DISCLAIMER}</p>
        <p>{EVALUATION_DISCLOSURE}</p>
        <p>{SUBJECT_HINT}</p>
      </div>
    </div>
  );
}

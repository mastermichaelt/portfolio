"use client";

import { useId } from "react";

const STATELESS_DISCLAIMER =
  "Each question is answered independently from published sources. Earlier messages in this view are not sent to the model.";
const SUBJECT_HINT =
  "For follow-ups, name the subject in your question (for example the project or topic).";

export function AssistantComposer({
  question,
  disabled,
  onQuestionChange,
  onSubmit,
}: {
  question: string;
  disabled: boolean;
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
          disabled={disabled}
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
            if (disabled || question.trim().length === 0) {
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
            disabled={disabled || question.trim().length === 0}
          >
            {disabled ? "Thinking…" : "Send"}
          </button>
        </div>
      </form>
      <div id={statelessId} className="assistant-stateless-hints">
        <p>{STATELESS_DISCLAIMER}</p>
        <p>{SUBJECT_HINT}</p>
      </div>
    </div>
  );
}

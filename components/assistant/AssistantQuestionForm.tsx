"use client";

import { useId } from "react";

export function AssistantQuestionForm({
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

  return (
    <form
      className="assistant-form"
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
        details stay conservative when evidence is thin.
      </p>
      <textarea
        id={fieldId}
        name="question"
        className="assistant-input"
        rows={3}
        value={question}
        disabled={disabled}
        aria-describedby={hintId}
        onChange={(event) => onQuestionChange(event.target.value)}
        placeholder="Ask about projects, articles, or how Michael builds with agents…"
      />
      <div className="assistant-form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={disabled || question.trim().length === 0}
        >
          {disabled ? "Thinking…" : "Ask"}
        </button>
      </div>
    </form>
  );
}

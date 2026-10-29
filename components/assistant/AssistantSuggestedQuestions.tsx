"use client";

import { ASSISTANT_SUGGESTED_QUESTIONS } from "@/lib/assistant/ui/suggested-questions";

export function AssistantSuggestedQuestions({
  disabled,
  onSelect,
}: {
  disabled: boolean;
  onSelect: (question: string) => void;
}) {
  return (
    <div className="assistant-suggestions">
      <p className="assistant-suggestions-label">Suggested questions</p>
      <ul className="assistant-suggestions-list">
        {ASSISTANT_SUGGESTED_QUESTIONS.map((question) => (
          <li key={question}>
            <button
              type="button"
              className="assistant-suggestion"
              disabled={disabled}
              onClick={() => onSelect(question)}
            >
              {question}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

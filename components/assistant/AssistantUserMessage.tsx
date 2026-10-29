"use client";

export function AssistantUserMessage({ text }: { text: string }) {
  return (
    <div className="assistant-message assistant-message--user">
      <p className="assistant-message-label">You</p>
      <p className="assistant-message-text">{text}</p>
    </div>
  );
}

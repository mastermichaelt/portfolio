"use client";

import { useEffect, useRef } from "react";

import {
  isTranscriptNearBottom,
  shouldAutoScrollTranscript,
  TRANSCRIPT_NEAR_BOTTOM_PX,
} from "@/lib/assistant/ui/transcript-scroll";
import type { TranscriptTurn } from "@/lib/assistant/ui/transcript-turns";

import { AssistantAssistantMessage } from "./AssistantAssistantMessage";
import { AssistantUserMessage } from "./AssistantUserMessage";

export function AssistantTranscript({
  turns,
  scrollGeneration,
  focusTurnId,
  onFocusTurnHandled,
}: {
  turns: TranscriptTurn[];
  scrollGeneration: number;
  focusTurnId: string | null;
  onFocusTurnHandled: () => void;
}) {
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const focusRef = useRef<HTMLDivElement | null>(null);
  const lastScrollGenerationRef = useRef(scrollGeneration);
  /** Updated on scroll — reflects position before the next content height change. */
  const wasNearBottomRef = useRef(true);

  useEffect(() => {
    const root = transcriptRef.current;
    if (!root) {
      return;
    }

    const syncNearBottom = () => {
      wasNearBottomRef.current = isTranscriptNearBottom(
        root,
        TRANSCRIPT_NEAR_BOTTOM_PX,
      );
    };

    syncNearBottom();
    root.addEventListener("scroll", syncNearBottom, { passive: true });
    return () => root.removeEventListener("scroll", syncNearBottom);
  }, [turns.length]);

  useEffect(() => {
    if (turns.length === 0) {
      wasNearBottomRef.current = true;
      return;
    }

    const userJustSubmitted =
      scrollGeneration !== lastScrollGenerationRef.current;
    lastScrollGenerationRef.current = scrollGeneration;

    if (userJustSubmitted) {
      wasNearBottomRef.current = true;
    }

    const shouldScroll = shouldAutoScrollTranscript({
      userJustSubmitted,
      wasNearBottomBeforeUpdate: wasNearBottomRef.current,
    });

    if (!shouldScroll) {
      return;
    }

    endRef.current?.scrollIntoView({
      behavior: userJustSubmitted ? "smooth" : "auto",
      block: "nearest",
    });
    wasNearBottomRef.current = true;
  }, [turns, scrollGeneration]);

  useEffect(() => {
    if (!focusTurnId) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      focusRef.current?.focus({ preventScroll: true });
      onFocusTurnHandled();
    });
    return () => cancelAnimationFrame(frame);
  }, [focusTurnId, onFocusTurnHandled, turns]);

  if (turns.length === 0) {
    return null;
  }

  return (
    <div
      ref={transcriptRef}
      className="assistant-transcript"
      role="log"
      aria-label="Conversation"
      aria-relevant="additions"
    >
      {turns.map((turn) => (
        <div key={turn.id} className="assistant-turn">
          <AssistantUserMessage text={turn.question} />
          <AssistantAssistantMessage
            turnId={turn.id}
            status={turn.status}
            answer={turn.answer}
            usage={turn.usage}
            errorMessage={turn.errorMessage}
            focusRef={
              focusTurnId === turn.id && turn.status === "success"
                ? focusRef
                : undefined
            }
          />
        </div>
      ))}
      <div
        ref={endRef}
        className="assistant-transcript-end"
        aria-hidden="true"
      />
    </div>
  );
}

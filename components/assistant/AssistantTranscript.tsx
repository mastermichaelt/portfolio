"use client";

import { useEffect, useRef } from "react";

import {
  followConversationAfterProgrammaticScroll,
  isTranscriptNearBottom,
  shouldAutoScrollTranscript,
  TRANSCRIPT_NEAR_BOTTOM_PX,
  updateFollowConversationOnScroll,
} from "@/lib/assistant/ui/transcript-scroll";
import type { TranscriptTurn } from "@/lib/assistant/ui/transcript-turns";

import { AssistantAssistantMessage } from "./AssistantAssistantMessage";
import { AssistantUserMessage } from "./AssistantUserMessage";

const PROGRAMMATIC_SCROLL_FALLBACK_MS = 600;

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
  const followConversationRef = useRef(true);
  const programmaticScrollRef = useRef(false);

  useEffect(() => {
    const root = transcriptRef.current;
    if (!root) {
      return;
    }

    const onScroll = () => {
      followConversationRef.current = updateFollowConversationOnScroll({
        isNearBottom: isTranscriptNearBottom(root, TRANSCRIPT_NEAR_BOTTOM_PX),
        programmaticScrollInProgress: programmaticScrollRef.current,
        currentFollow: followConversationRef.current,
      });
    };

    onScroll();
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [turns.length]);

  useEffect(() => {
    const root = transcriptRef.current;
    if (turns.length === 0) {
      followConversationRef.current = true;
      programmaticScrollRef.current = false;
      return;
    }

    const userJustSubmitted =
      scrollGeneration !== lastScrollGenerationRef.current;
    lastScrollGenerationRef.current = scrollGeneration;

    if (userJustSubmitted) {
      followConversationRef.current = true;
    }

    const shouldScroll = shouldAutoScrollTranscript({
      userJustSubmitted,
      followConversation: followConversationRef.current,
    });

    if (!shouldScroll || !root) {
      return;
    }

    programmaticScrollRef.current = true;
    endRef.current?.scrollIntoView({
      behavior: userJustSubmitted ? "smooth" : "auto",
      block: "nearest",
    });

    const finishProgrammaticScroll = () => {
      if (!programmaticScrollRef.current) {
        return;
      }
      programmaticScrollRef.current = false;
      const container = transcriptRef.current;
      if (!container) {
        return;
      }
      followConversationRef.current = followConversationAfterProgrammaticScroll(
        isTranscriptNearBottom(container, TRANSCRIPT_NEAR_BOTTOM_PX),
      );
    };

    let fallbackTimeout: ReturnType<typeof setTimeout> | undefined;
    const onScrollEnd = () => {
      finishProgrammaticScroll();
    };

    if (typeof root.onscrollend !== "undefined") {
      root.addEventListener("scrollend", onScrollEnd, { once: true });
      fallbackTimeout = setTimeout(
        finishProgrammaticScroll,
        PROGRAMMATIC_SCROLL_FALLBACK_MS,
      );
    } else {
      requestAnimationFrame(() => {
        requestAnimationFrame(finishProgrammaticScroll);
      });
    }

    return () => {
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
      }
      root.removeEventListener("scrollend", onScrollEnd);
    };
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

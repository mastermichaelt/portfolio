import type { AssistantGenerateResult } from "@/lib/assistant/client/post-generate";

import {
  isTranscriptRequestStillActive,
  turnExists,
} from "./transcript-request-guard";
import {
  forceReleaseSubmissionLock,
  releaseSubmissionLock,
  tryAcquireSubmissionLock,
  type SubmissionLockState,
} from "./submission-lock";
import type { TranscriptTurn } from "./transcript-turns";

export type SingleFlightSubmitCallbacks = {
  appendLoadingTurn: (turnId: string, question: string) => void;
  bumpScrollGeneration: () => void;
  clearComposer: () => void;
  resolveTurnSuccess: (
    turnId: string,
    answer: Extract<AssistantGenerateResult, { ok: true }>["answer"],
    usage: Extract<AssistantGenerateResult, { ok: true }>["usage"],
  ) => void;
  resolveTurnError: (turnId: string, message: string) => void;
  focusSuccessTurn: (turnId: string) => void;
  getTurns: () => TranscriptTurn[];
};

export type SingleFlightSubmitContext = {
  lock: SubmissionLockState;
  sessionEpoch: { current: number };
  abortRef: { current: AbortController | null };
  createId: () => string;
  postGenerate: (
    question: string,
    signal: AbortSignal,
  ) => Promise<AssistantGenerateResult>;
  callbacks: SingleFlightSubmitCallbacks;
};

export function clearAssistantSession(
  ctx: Pick<SingleFlightSubmitContext, "lock" | "sessionEpoch" | "abortRef">,
): void {
  ctx.abortRef.current?.abort();
  ctx.abortRef.current = null;
  ctx.sessionEpoch.current += 1;
  forceReleaseSubmissionLock(ctx.lock);
}

function requestStillApplies(
  ctx: SingleFlightSubmitContext,
  epochAtStart: number,
  controller: AbortController,
  turnId: string,
): boolean {
  if (
    !isTranscriptRequestStillActive({
      epochAtStart,
      currentEpoch: ctx.sessionEpoch.current,
      controller,
      activeController: ctx.abortRef.current,
    })
  ) {
    return false;
  }
  return turnExists(ctx.callbacks.getTurns(), turnId);
}

/**
 * Single in-flight POST /api/assistant/generate. Returns false when ignored
 * (empty question or lock already held).
 */
export async function submitAssistantQuestionSingleFlight(
  raw: string,
  ctx: SingleFlightSubmitContext,
): Promise<boolean> {
  const trimmed = raw.trim();
  if (!trimmed) {
    return false;
  }

  const acquired = tryAcquireSubmissionLock(ctx.lock, ctx.createId);
  if (!acquired.acquired) {
    return false;
  }

  const { ownerId } = acquired;
  const controller = new AbortController();
  ctx.abortRef.current = controller;
  const epochAtStart = ctx.sessionEpoch.current;
  const turnId = ctx.createId();

  ctx.callbacks.bumpScrollGeneration();
  ctx.callbacks.appendLoadingTurn(turnId, trimmed);
  ctx.callbacks.clearComposer();

  try {
    const result = await ctx.postGenerate(trimmed, controller.signal);

    const stillApplies = () =>
      requestStillApplies(ctx, epochAtStart, controller, turnId);

    if (!stillApplies()) {
      return true;
    }

    if (!result.ok && result.code === "aborted") {
      return true;
    }

    if (result.ok) {
      if (!stillApplies()) {
        return true;
      }
      ctx.callbacks.resolveTurnSuccess(turnId, result.answer, result.usage);
      if (
        isTranscriptRequestStillActive({
          epochAtStart,
          currentEpoch: ctx.sessionEpoch.current,
          controller,
          activeController: ctx.abortRef.current,
        })
      ) {
        ctx.callbacks.focusSuccessTurn(turnId);
      }
      return true;
    }

    if (!stillApplies()) {
      return true;
    }
    ctx.callbacks.resolveTurnError(turnId, result.message);
    return true;
  } finally {
    releaseSubmissionLock(ctx.lock, ownerId);
  }
}

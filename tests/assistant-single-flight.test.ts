import { describe, expect, it, vi } from "vitest";

import type { AssistantGenerateResult } from "@/lib/assistant/client/post-generate";
import { parseAssistantGenerateSuccessBody } from "@/lib/assistant/client/post-generate";
import {
  forceReleaseSubmissionLock,
  releaseSubmissionLock,
  tryAcquireSubmissionLock,
  type SubmissionLockState,
} from "@/lib/assistant/ui/submission-lock";
import {
  clearAssistantSession,
  submitAssistantQuestionSingleFlight,
  type SingleFlightSubmitCallbacks,
  type SingleFlightSubmitContext,
} from "@/lib/assistant/ui/single-flight-submit";
import { isTranscriptRequestStillActive } from "@/lib/assistant/ui/transcript-request-guard";
import { shouldAutoScrollTranscript } from "@/lib/assistant/ui/transcript-scroll";
import {
  appendLoadingTurn,
  type TranscriptTurn,
} from "@/lib/assistant/ui/transcript-turns";

function successResult(): Extract<AssistantGenerateResult, { ok: true }> {
  const body = parseAssistantGenerateSuccessBody({
    answer: {
      claims: [
        {
          text: "Grounded claim.",
          attribution: "evidence_supported",
        },
      ],
      answer_text: "Grounded claim.",
      citations: [],
      support_level: "full",
      abstained: false,
    },
  });
  if (!body) {
    throw new Error("fixture");
  }
  return { ok: true, answer: body.answer, usage: body.usage };
}

function createTestContext(options: {
  postGenerate: SingleFlightSubmitContext["postGenerate"];
  turns?: TranscriptTurn[];
}): {
  ctx: SingleFlightSubmitContext;
  getTurns: () => TranscriptTurn[];
  clearTurns: () => void;
  lock: SubmissionLockState;
} {
  let turns = options.turns ?? [];
  const lock: SubmissionLockState = { inFlight: false, ownerId: null };
  const sessionEpoch = { current: 0 };
  const abortRef: { current: AbortController | null } = { current: null };
  let idCounter = 0;

  const callbacks: SingleFlightSubmitCallbacks = {
    bumpScrollGeneration: () => {},
    appendLoadingTurn: (turnId, question) => {
      turns = appendLoadingTurn(turns, question, turnId);
    },
    clearComposer: () => {},
    getTurns: () => turns,
    resolveTurnSuccess: (turnId, answer, usage) => {
      turns = turns.map((turn) =>
        turn.id === turnId
          ? { ...turn, status: "success" as const, answer, usage }
          : turn,
      );
    },
    resolveTurnError: (turnId, message) => {
      turns = turns.map((turn) =>
        turn.id === turnId
          ? { ...turn, status: "error" as const, errorMessage: message }
          : turn,
      );
    },
    focusSuccessTurn: () => {},
  };

  const ctx: SingleFlightSubmitContext = {
    lock,
    sessionEpoch,
    abortRef,
    createId: () => `id-${++idCounter}`,
    postGenerate: options.postGenerate,
    callbacks,
  };

  return {
    ctx,
    getTurns: () => turns,
    clearTurns: () => {
      turns = [];
    },
    lock,
  };
}

describe("submission lock", () => {
  it("allows only one synchronous acquire", () => {
    const lock: SubmissionLockState = { inFlight: false, ownerId: null };
    const first = tryAcquireSubmissionLock(lock, () => "a");
    const second = tryAcquireSubmissionLock(lock, () => "b");
    expect(first).toEqual({ acquired: true, ownerId: "a" });
    expect(second).toEqual({ acquired: false });
  });

  it("releases only for the current owner", () => {
    const lock: SubmissionLockState = {
      inFlight: true,
      ownerId: "a",
    };
    releaseSubmissionLock(lock, "b");
    expect(lock.inFlight).toBe(true);
    releaseSubmissionLock(lock, "a");
    expect(lock.inFlight).toBe(false);
    expect(lock.ownerId).toBeNull();
  });

  it("forceRelease clears the lock for clear conversation", () => {
    const lock: SubmissionLockState = {
      inFlight: true,
      ownerId: "a",
    };
    forceReleaseSubmissionLock(lock);
    expect(lock.inFlight).toBe(false);
    expect(tryAcquireSubmissionLock(lock, () => "next").acquired).toBe(true);
  });
});

describe("submitAssistantQuestionSingleFlight", () => {
  it("ignores a second synchronous submission while the first is in flight", async () => {
    let resolveFirst: (value: AssistantGenerateResult) => void = () => {};
    const firstPromise = new Promise<AssistantGenerateResult>((resolve) => {
      resolveFirst = resolve;
    });
    const postGenerate = vi
      .fn()
      .mockImplementationOnce(() => firstPromise)
      .mockImplementationOnce(() => Promise.resolve(successResult()));

    const { ctx, lock } = createTestContext({ postGenerate });

    const firstStarted = submitAssistantQuestionSingleFlight("First?", ctx);
    const secondIgnored = await submitAssistantQuestionSingleFlight(
      "Second?",
      ctx,
    );

    expect(secondIgnored).toBe(false);
    expect(postGenerate).toHaveBeenCalledTimes(1);
    expect(lock.inFlight).toBe(true);

    resolveFirst(successResult());
    await firstStarted;

    expect(lock.inFlight).toBe(false);
  });

  it("avoids duplicate loading turns from rapid suggested-question clicks", async () => {
    let resolveFirst: (value: AssistantGenerateResult) => void = () => {};
    const postGenerate = vi.fn(
      () =>
        new Promise<AssistantGenerateResult>((resolve) => {
          resolveFirst = resolve;
        }),
    );

    const { ctx } = createTestContext({ postGenerate });

    const firstFlight = submitAssistantQuestionSingleFlight("Question A", ctx);
    expect(await submitAssistantQuestionSingleFlight("Question B", ctx)).toBe(
      false,
    );

    expect(postGenerate).toHaveBeenCalledTimes(1);
    expect(ctx.callbacks.getTurns()).toHaveLength(1);
    expect(ctx.callbacks.getTurns()[0]?.question).toBe("Question A");

    resolveFirst(successResult());
    await firstFlight;
    expect(ctx.callbacks.getTurns()[0]?.status).toBe("success");
  });

  it("allows a new submission after the previous request completes", async () => {
    const postGenerate = vi.fn(() => Promise.resolve(successResult()));
    const { ctx, lock } = createTestContext({ postGenerate });

    expect(await submitAssistantQuestionSingleFlight("One", ctx)).toBe(true);
    expect(await submitAssistantQuestionSingleFlight("Two", ctx)).toBe(true);
    expect(postGenerate).toHaveBeenCalledTimes(2);
    expect(lock.inFlight).toBe(false);
    expect(ctx.callbacks.getTurns()).toHaveLength(2);
  });

  it("releases the lock on clear so a new request can start immediately", async () => {
    let resolveFirst: (value: AssistantGenerateResult) => void = () => {};
    const postGenerate = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<AssistantGenerateResult>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(() => Promise.resolve(successResult()));

    const { ctx, lock, clearTurns } = createTestContext({ postGenerate });

    void submitAssistantQuestionSingleFlight("Stale?", ctx);
    expect(lock.inFlight).toBe(true);

    clearAssistantSession(ctx);
    clearTurns();

    expect(lock.inFlight).toBe(false);
    expect(await submitAssistantQuestionSingleFlight("Fresh?", ctx)).toBe(true);
    expect(postGenerate).toHaveBeenCalledTimes(2);

    resolveFirst(successResult());
    await new Promise((r) => setTimeout(r, 0));

    expect(ctx.callbacks.getTurns()).toHaveLength(1);
    expect(ctx.callbacks.getTurns()[0]?.question).toBe("Fresh?");
    expect(lock.inFlight).toBe(false);
  });

  it("does not let a late cleared response release the new request lock", async () => {
    let resolveStale: (value: AssistantGenerateResult) => void = () => {};
    let resolveFresh: (value: AssistantGenerateResult) => void = () => {};
    const postGenerate = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<AssistantGenerateResult>((resolve) => {
            resolveStale = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<AssistantGenerateResult>((resolve) => {
            resolveFresh = resolve;
          }),
      );

    const { ctx, lock, clearTurns } = createTestContext({ postGenerate });

    const staleFlight = submitAssistantQuestionSingleFlight("Old", ctx);
    clearAssistantSession(ctx);
    clearTurns();

    const freshFlight = submitAssistantQuestionSingleFlight("New", ctx);
    expect(lock.inFlight).toBe(true);

    resolveStale(successResult());
    await staleFlight;
    expect(lock.inFlight).toBe(true);

    resolveFresh(successResult());
    await freshFlight;
    expect(lock.inFlight).toBe(false);
    expect(ctx.callbacks.getTurns()).toHaveLength(1);
    expect(ctx.callbacks.getTurns()[0]?.question).toBe("New");
  });
});

describe("transcript request guard (clear / abort)", () => {
  it("rejects results after session epoch bump", () => {
    const controller = new AbortController();
    expect(
      isTranscriptRequestStillActive({
        epochAtStart: 0,
        currentEpoch: 1,
        controller,
        activeController: controller,
      }),
    ).toBe(false);
  });
});

describe("transcript scroll follow (unchanged)", () => {
  it("follows new content when follow intent is active", () => {
    expect(
      shouldAutoScrollTranscript({
        userJustSubmitted: false,
        followConversation: true,
      }),
    ).toBe(true);
  });
});

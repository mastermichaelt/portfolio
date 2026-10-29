import { describe, expect, it } from "vitest";

import {
  followConversationAfterProgrammaticScroll,
  isTranscriptNearBottom,
  shouldAutoScrollTranscript,
  TRANSCRIPT_NEAR_BOTTOM_PX,
  updateFollowConversationOnScroll,
} from "@/lib/assistant/ui/transcript-scroll";
import {
  clearAssistantSession,
  submitAssistantQuestionSingleFlight,
  type SingleFlightSubmitCallbacks,
  type SingleFlightSubmitContext,
} from "@/lib/assistant/ui/single-flight-submit";
import type { AssistantGenerateResult } from "@/lib/assistant/client/post-generate";
import { parseAssistantGenerateSuccessBody } from "@/lib/assistant/client/post-generate";
import type { SubmissionLockState } from "@/lib/assistant/ui/submission-lock";
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

function createTestContext(
  postGenerate: SingleFlightSubmitContext["postGenerate"],
): SingleFlightSubmitContext & { getTurns: () => TranscriptTurn[] } {
  let turns: TranscriptTurn[] = [];
  const lock: SubmissionLockState = { inFlight: false, ownerId: null };
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
    sessionEpoch: { current: 0 },
    abortRef: { current: null },
    createId: () => `id-${++idCounter}`,
    postGenerate,
    callbacks,
  };

  return Object.assign(ctx, { getTurns: () => turns });
}

describe("transcript scroll follow", () => {
  it("follows when the visitor opted in via submit or follow flag", () => {
    expect(
      shouldAutoScrollTranscript({
        userJustSubmitted: true,
        followConversation: false,
      }),
    ).toBe(true);
    expect(
      shouldAutoScrollTranscript({
        userJustSubmitted: false,
        followConversation: true,
      }),
    ).toBe(true);
    expect(
      shouldAutoScrollTranscript({
        userJustSubmitted: false,
        followConversation: false,
      }),
    ).toBe(false);
  });

  it("ignores mid-programmatic-scroll positions when updating follow intent", () => {
    expect(
      updateFollowConversationOnScroll({
        isNearBottom: false,
        programmaticScrollInProgress: true,
        currentFollow: true,
      }),
    ).toBe(true);
  });

  it("clears follow intent when the visitor scrolls away manually", () => {
    expect(
      updateFollowConversationOnScroll({
        isNearBottom: false,
        programmaticScrollInProgress: false,
        currentFollow: true,
      }),
    ).toBe(false);
  });

  it("restores follow intent when the visitor returns to the bottom", () => {
    expect(
      updateFollowConversationOnScroll({
        isNearBottom: true,
        programmaticScrollInProgress: false,
        currentFollow: false,
      }),
    ).toBe(true);
  });

  it("derives follow intent from geometry after programmatic scroll", () => {
    expect(followConversationAfterProgrammaticScroll(true)).toBe(true);
    expect(followConversationAfterProgrammaticScroll(false)).toBe(false);
  });

  it("simulates answer arrival while smooth scroll has not reached bottom", () => {
    let follow = true;
    follow = updateFollowConversationOnScroll({
      isNearBottom: false,
      programmaticScrollInProgress: true,
      currentFollow: follow,
    });
    expect(
      shouldAutoScrollTranscript({
        userJustSubmitted: false,
        followConversation: follow,
      }),
    ).toBe(true);
  });

  it("simulates incomplete programmatic scroll leaving follow false", () => {
    const element = {
      scrollHeight: 1000,
      scrollTop: 100,
      clientHeight: 80,
    } as HTMLElement;
    expect(isTranscriptNearBottom(element, TRANSCRIPT_NEAR_BOTTOM_PX)).toBe(
      false,
    );
    const follow = followConversationAfterProgrammaticScroll(
      isTranscriptNearBottom(element, TRANSCRIPT_NEAR_BOTTOM_PX),
    );
    expect(
      shouldAutoScrollTranscript({
        userJustSubmitted: false,
        followConversation: follow,
      }),
    ).toBe(false);
  });
});

describe("assistant session teardown (unmount)", () => {
  it("blocks late success after teardown without mutating the turn", async () => {
    let resolveFlight: (value: AssistantGenerateResult) => void = () => {};
    const ctx = createTestContext(
      () =>
        new Promise<AssistantGenerateResult>((resolve) => {
          resolveFlight = resolve;
        }),
    );

    const flight = submitAssistantQuestionSingleFlight("Question?", ctx);
    expect(ctx.getTurns()[0]?.status).toBe("loading");

    clearAssistantSession(ctx);
    expect(ctx.sessionEpoch.current).toBe(1);
    expect(ctx.lock.inFlight).toBe(false);

    resolveFlight(successResult());
    await flight;

    expect(ctx.getTurns()[0]?.status).toBe("loading");
  });
});

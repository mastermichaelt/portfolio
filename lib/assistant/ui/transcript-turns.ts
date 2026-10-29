import type {
  AssistantPublicAnswer,
  AssistantPublicUsage,
} from "@/lib/assistant/api/public-envelope";

export type TranscriptTurnStatus = "loading" | "success" | "error";

export type TranscriptTurn = {
  id: string;
  question: string;
  status: TranscriptTurnStatus;
  answer?: AssistantPublicAnswer;
  usage?: AssistantPublicUsage;
  errorMessage?: string;
};

export function createTurnId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `turn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function appendLoadingTurn(
  turns: TranscriptTurn[],
  question: string,
  id: string,
): TranscriptTurn[] {
  return [...turns, { id, question, status: "loading" }];
}

export function resolveTurn(
  turns: TranscriptTurn[],
  turnId: string,
  patch:
    | {
        status: "success";
        answer: AssistantPublicAnswer;
        usage?: AssistantPublicUsage;
      }
    | { status: "error"; errorMessage: string },
): TranscriptTurn[] {
  return turns.map((turn) =>
    turn.id === turnId ? { ...turn, ...patch } : turn,
  );
}

export function removeTurn(
  turns: TranscriptTurn[],
  turnId: string,
): TranscriptTurn[] {
  return turns.filter((turn) => turn.id !== turnId);
}

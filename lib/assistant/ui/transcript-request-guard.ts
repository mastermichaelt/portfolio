/** Returns false after Clear conversation (epoch) or when the request was aborted. */
export function isTranscriptRequestStillActive(options: {
  epochAtStart: number;
  currentEpoch: number;
  controller: AbortController;
  activeController: AbortController | null;
}): boolean {
  if (options.epochAtStart !== options.currentEpoch) {
    return false;
  }
  if (options.controller.signal.aborted) {
    return false;
  }
  if (options.activeController !== options.controller) {
    return false;
  }
  return true;
}

export function turnExists(turns: { id: string }[], turnId: string): boolean {
  return turns.some((turn) => turn.id === turnId);
}

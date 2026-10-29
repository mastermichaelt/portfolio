/** Returns false when clear/submit superseded this in-flight POST before applying results. */
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

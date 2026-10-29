/** Distance from scroll bottom (px) treated as "following" the thread. */
export const TRANSCRIPT_NEAR_BOTTOM_PX = 80;

export function isTranscriptNearBottom(
  element: HTMLElement,
  thresholdPx = TRANSCRIPT_NEAR_BOTTOM_PX,
): boolean {
  const distanceFromBottom =
    element.scrollHeight - element.scrollTop - element.clientHeight;
  return distanceFromBottom <= thresholdPx;
}

/** Use pre-update "following" state — not post-render geometry after content grows. */
export function shouldAutoScrollTranscript(options: {
  userJustSubmitted: boolean;
  wasNearBottomBeforeUpdate: boolean;
}): boolean {
  return options.userJustSubmitted || options.wasNearBottomBeforeUpdate;
}

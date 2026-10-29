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

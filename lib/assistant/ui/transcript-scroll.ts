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

export function shouldAutoScrollTranscript(options: {
  userJustSubmitted: boolean;
  followConversation: boolean;
}): boolean {
  return options.userJustSubmitted || options.followConversation;
}

/**
 * Update follow intent from scroll geometry. While a programmatic scroll runs,
 * preserve the current follow flag so mid-animation positions are not treated
 * as the visitor scrolling away.
 */
export function updateFollowConversationOnScroll(options: {
  isNearBottom: boolean;
  programmaticScrollInProgress: boolean;
  currentFollow: boolean;
}): boolean {
  if (options.programmaticScrollInProgress) {
    return options.currentFollow;
  }
  if (options.isNearBottom) {
    return true;
  }
  return false;
}

/** After programmatic scroll, derive follow intent from measured position only. */
export function followConversationAfterProgrammaticScroll(
  isNearBottom: boolean,
): boolean {
  return isNearBottom;
}

/**
 * A line of copy that mixes plain text with inline links. Used where 1C copy is
 * final and interleaves prose with anchors (deferral lines, footer notes,
 * artifact closings) without reaching for `dangerouslySetInnerHTML`.
 *
 * `href` absent → plain text. `href` starting with `http` → external (new tab,
 * analytics). Otherwise an internal route.
 */
export interface RichSegment {
  text: string;
  href?: string;
}

export type RichText = RichSegment[];

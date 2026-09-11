import Link from "next/link";
import { Fragment } from "react";
import { ExternalLink } from "@/components/ExternalLink";
import type { RichText as RichTextSegments } from "@/domain/rich-text";

function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

/**
 * Renders a line of copy that interleaves plain text with inline links.
 * External hrefs open in a new tab (with analytics); everything else routes
 * internally. Segments with no href are plain text.
 */
export function RichText({ segments }: { segments: RichTextSegments }) {
  return (
    <>
      {segments.map((segment, index) => {
        const key = `${index}-${segment.text}`;
        if (!segment.href) {
          return <Fragment key={key}>{segment.text}</Fragment>;
        }
        if (isExternal(segment.href)) {
          return (
            <ExternalLink key={key} href={segment.href}>
              {segment.text}
            </ExternalLink>
          );
        }
        return (
          <Link key={key} href={segment.href}>
            {segment.text}
          </Link>
        );
      })}
    </>
  );
}

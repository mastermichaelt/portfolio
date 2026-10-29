"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { ExternalLink } from "@/components/ExternalLink";
import { normalizeHttpUrl } from "@/lib/assistant/ui/extract-http-urls";
import { toVisitorHref } from "@/lib/assistant/ui/visitor-href";

type TextSegment =
  { kind: "text"; value: string } | { kind: "url"; value: string };

function segmentClaimText(text: string): TextSegment[] {
  const pattern = /https?:\/\/[^\s<>"')\]]+/gi;
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      segments.push({ kind: "text", value: text.slice(lastIndex, start) });
    }
    const raw = match[0].replace(/[.,;:!?)]+$/, "");
    const normalized = normalizeHttpUrl(raw);
    if (normalized) {
      segments.push({ kind: "url", value: normalized });
      lastIndex = start + match[0].length;
    } else {
      segments.push({ kind: "text", value: match[0] });
      lastIndex = start + match[0].length;
    }
  }

  if (lastIndex < text.length) {
    segments.push({ kind: "text", value: text.slice(lastIndex) });
  }

  if (segments.length === 0) {
    return [{ kind: "text", value: text }];
  }

  return segments;
}

function isExternalHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}

export function SafeClaimText({ text }: { text: string }) {
  const segments = segmentClaimText(text);
  const nodes: ReactNode[] = [];

  for (const [index, segment] of segments.entries()) {
    if (segment.kind === "text") {
      nodes.push(<span key={`t-${index}`}>{segment.value}</span>);
      continue;
    }

    const href = toVisitorHref(segment.value);
    const key = `u-${index}-${href}`;

    if (isExternalHref(href)) {
      nodes.push(
        <ExternalLink key={key} href={href}>
          {segment.value}
        </ExternalLink>,
      );
    } else {
      nodes.push(
        <Link key={key} href={href}>
          {segment.value}
        </Link>,
      );
    }
  }

  return <>{nodes}</>;
}

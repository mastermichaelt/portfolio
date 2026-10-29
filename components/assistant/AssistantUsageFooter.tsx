"use client";

import type { AssistantPublicUsage } from "@/lib/assistant/api/public-envelope";
import {
  buildUsageFooterParts,
  formatUsageFooterLine,
} from "@/lib/assistant/ui/format-usage-footer";

export function AssistantUsageFooter({
  usage,
}: {
  usage: AssistantPublicUsage | undefined;
}) {
  const parts = buildUsageFooterParts(usage);
  if (!parts) {
    return null;
  }

  const line = formatUsageFooterLine(parts);
  if (!line) {
    return null;
  }

  return (
    <p
      className="assistant-usage"
      title={parts.title}
      aria-label={parts.title ?? line}
    >
      {line}
    </p>
  );
}

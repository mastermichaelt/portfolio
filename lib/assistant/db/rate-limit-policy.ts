import type { AssistantApiConfig } from "@/lib/assistant/api/config";

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

type RateLimitWindow = {
  name: string;
  windowMs: number;
  limit: number;
  scope: "client" | "global";
};

export type RateLimitBucket = {
  key: string;
  windowEndsAt: Date;
  limit: number;
  windowName: string;
};

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number; window: string };

function buildWindows(config: AssistantApiConfig): RateLimitWindow[] {
  return [
    {
      name: "minute",
      windowMs: MS_PER_MINUTE,
      limit: config.perClientPerMinute,
      scope: "client",
    },
    {
      name: "hour",
      windowMs: MS_PER_HOUR,
      limit: config.perClientPerHour,
      scope: "client",
    },
    {
      name: "day",
      windowMs: MS_PER_DAY,
      limit: config.perClientPerDay,
      scope: "client",
    },
    {
      name: "global_day",
      windowMs: MS_PER_DAY,
      limit: config.globalPerDay,
      scope: "global",
    },
  ];
}

function bucketKey(
  scope: "client" | "global",
  clientKey: string,
  window: RateLimitWindow,
  nowMs: number,
): string {
  const windowIndex = Math.floor(nowMs / window.windowMs);
  const subject = scope === "global" ? "global" : clientKey;
  return `${subject}:${window.name}:${windowIndex}`;
}

export function buildRateLimitBuckets(
  clientKey: string,
  config: AssistantApiConfig,
  nowMs: number,
): RateLimitBucket[] {
  const windows = buildWindows(config);
  const buckets = windows.map((window) => {
    const windowEndsAt = new Date(
      (Math.floor(nowMs / window.windowMs) + 1) * window.windowMs,
    );
    return {
      key: bucketKey(window.scope, clientKey, window, nowMs),
      windowEndsAt,
      limit: window.limit,
      windowName: window.name,
    };
  });

  return buckets.sort((a, b) => a.key.localeCompare(b.key));
}

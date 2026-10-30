/** Server-only configuration for the assistant generation API route. */

const TRUE_VALUES = new Set(["1", "true", "yes"]);
const FALSE_VALUES = new Set(["0", "false", "no"]);

/** Visitor-safe copy when public generation is disabled. */
export const ASSISTANT_PUBLIC_DISABLED_MESSAGE =
  "Public assistant generation is temporarily unavailable. Please check back later.";

export class AssistantPublicEnabledConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssistantPublicEnabledConfigError";
  }
}

/**
 * Reads only `ASSISTANT_PUBLIC_ENABLED`. Does not validate other API env vars.
 */
export function resolveAssistantPublicEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const raw = env.ASSISTANT_PUBLIC_ENABLED;
  if (raw === undefined || raw.trim() === "") {
    return true;
  }

  const normalized = raw.trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) {
    return true;
  }
  if (FALSE_VALUES.has(normalized)) {
    return false;
  }

  throw new AssistantPublicEnabledConfigError(
    `ASSISTANT_PUBLIC_ENABLED must be one of 1, true, yes, 0, false, no (case-insensitive), received "${raw}"`,
  );
}

function parsePositiveInt(
  raw: string | undefined,
  name: string,
  fallback: number,
): number {
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer, received "${raw}"`);
  }
  return parsed;
}

function parseBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  return TRUE_VALUES.has(raw.trim().toLowerCase());
}

export type AssistantApiConfig = {
  /** When false, POST /api/assistant/generate returns 503 and /assistant shows maintenance UX. */
  publicEnabled: boolean;
  maxBodyBytes: number;
  rateLimitEnabled: boolean;
  perClientPerMinute: number;
  perClientPerHour: number;
  perClientPerDay: number;
  globalPerDay: number;
};

export function resolveAssistantApiConfig(
  env: NodeJS.ProcessEnv = process.env,
): AssistantApiConfig {
  return {
    publicEnabled: resolveAssistantPublicEnabled(env),
    maxBodyBytes: parsePositiveInt(
      env.ASSISTANT_API_MAX_BODY_BYTES,
      "ASSISTANT_API_MAX_BODY_BYTES",
      16_384,
    ),
    rateLimitEnabled: parseBoolean(env.ASSISTANT_API_RATE_LIMIT_ENABLED, true),
    perClientPerMinute: parsePositiveInt(
      env.ASSISTANT_API_RATE_LIMIT_PER_MINUTE,
      "ASSISTANT_API_RATE_LIMIT_PER_MINUTE",
      8,
    ),
    perClientPerHour: parsePositiveInt(
      env.ASSISTANT_API_RATE_LIMIT_PER_HOUR,
      "ASSISTANT_API_RATE_LIMIT_PER_HOUR",
      40,
    ),
    perClientPerDay: parsePositiveInt(
      env.ASSISTANT_API_RATE_LIMIT_PER_DAY,
      "ASSISTANT_API_RATE_LIMIT_PER_DAY",
      120,
    ),
    globalPerDay: parsePositiveInt(
      env.ASSISTANT_API_RATE_LIMIT_GLOBAL_PER_DAY,
      "ASSISTANT_API_RATE_LIMIT_GLOBAL_PER_DAY",
      2_000,
    ),
  };
}

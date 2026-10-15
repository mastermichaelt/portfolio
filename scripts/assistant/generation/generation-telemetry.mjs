import { createHash } from "node:crypto";

import { loadEnvFiles } from "../db/load-env.mjs";

/** @typedef {'cli' | 'eval' | 'api'} GenerationExecutionContext */

/**
 * @typedef {object} GenerationTelemetry
 * @property {(event: string, properties: Record<string, string | number | boolean>) => void} capture
 * @property {() => Promise<void>} flush
 */

const DEFAULT_DISTINCT_ID = "assistant_generation_cli";
const DEFAULT_FLUSH_MS = 3_000;

/**
 * @returns {{
 *   enabled: boolean,
 *   projectToken?: string,
 *   apiHost: string,
 *   distinctId: string,
 *   flushTimeoutMs: number,
 * }}
 */
export function resolveGenerationTelemetryConfig() {
  loadEnvFiles();
  const projectToken =
    process.env.ASSISTANT_GENERATION_POSTHOG_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?.trim() ||
    undefined;
  const explicitOff =
    process.env.ASSISTANT_GENERATION_TELEMETRY?.trim().toLowerCase() ===
    "false";
  const enabled = Boolean(projectToken) && !explicitOff;
  const apiHost =
    process.env.ASSISTANT_GENERATION_POSTHOG_HOST?.trim() ||
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() ||
    "https://us.i.posthog.com";
  const distinctId =
    process.env.ASSISTANT_GENERATION_TELEMETRY_DISTINCT_ID?.trim() ||
    DEFAULT_DISTINCT_ID;
  const flushTimeoutMs = Number(
    process.env.ASSISTANT_GENERATION_TELEMETRY_FLUSH_MS ?? DEFAULT_FLUSH_MS,
  );

  return {
    enabled,
    projectToken,
    apiHost: apiHost.replace(/\/$/, ""),
    distinctId,
    flushTimeoutMs:
      Number.isFinite(flushTimeoutMs) && flushTimeoutMs > 0
        ? flushTimeoutMs
        : DEFAULT_FLUSH_MS,
  };
}

/**
 * @param {Record<string, string | number | boolean | undefined>} properties
 * @returns {Record<string, string | number | boolean>}
 */
export function sanitizeTelemetryProperties(properties) {
  /** @type {Record<string, string | number | boolean>} */
  const sanitized = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value === undefined) {
      continue;
    }
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * @param {Record<string, number>} counts
 * @returns {Record<string, number>}
 */
export function flattenAttributionCounts(counts) {
  /** @type {Record<string, number>} */
  const flat = {};
  for (const [key, value] of Object.entries(counts)) {
    if (Number.isFinite(value)) {
      flat[`attribution_${key}`] = value;
    }
  }
  return flat;
}

/**
 * @param {number | undefined} completionTokens
 * @param {number} maxOutputTokens
 * @returns {number | undefined}
 */
/**
 * @param {string} message
 */
export function warnTelemetryDeliveryFailure(message) {
  console.warn(`[assistant-generation telemetry] ${message}`);
}

export function outputTokenUtilization(completionTokens, maxOutputTokens) {
  if (
    typeof completionTokens !== "number" ||
    !Number.isFinite(completionTokens) ||
    maxOutputTokens < 1
  ) {
    return undefined;
  }
  return Math.round((completionTokens / maxOutputTokens) * 1000) / 1000;
}

/**
 * @returns {GenerationTelemetry}
 */
export function createNoOpGenerationTelemetry() {
  return {
    capture() {},
    async flush() {},
  };
}

/**
 * @param {{
 *   executionContext?: GenerationExecutionContext,
 *   fetch?: typeof fetch,
 * }} [options]
 * @returns {GenerationTelemetry}
 */
export function createGenerationTelemetry(options = {}) {
  const config = resolveGenerationTelemetryConfig();
  if (!config.enabled || !config.projectToken) {
    return createNoOpGenerationTelemetry();
  }

  const executionContext = options.executionContext ?? "cli";
  const fetchFn = options.fetch ?? globalThis.fetch;
  /** @type {Array<{ event: string, properties: Record<string, string | number | boolean> }>} */
  const queue = [];

  return {
    capture(event, properties) {
      try {
        queue.push({
          event,
          properties: sanitizeTelemetryProperties({
            ...properties,
            execution_context: executionContext,
            analytics_environment: "assistant_generation_tooling",
            telemetry_schema_version: 1,
          }),
        });
      } catch {
        // Telemetry must never fail generation.
      }
    },
    async flush() {
      if (queue.length === 0 || typeof fetchFn !== "function") {
        return;
      }

      const batch = queue.splice(0, queue.length);
      const captureUrl = `${config.apiHost}/capture/`;

      const sendOne = async (item) => {
        const body = JSON.stringify({
          api_key: config.projectToken,
          event: item.event,
          distinct_id: config.distinctId,
          properties: {
            ...item.properties,
            $lib: "portfolio-assistant-generation",
          },
        });
        const response = await fetchFn(captureUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (!response.ok) {
          return { ok: false, status: response.status, event: item.event };
        }
        return { ok: true };
      };

      try {
        const outcomes = await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error("telemetry flush timeout"));
          }, config.flushTimeoutMs);

          Promise.all(batch.map((item) => sendOne(item))).then(
            (value) => {
              clearTimeout(timeoutId);
              resolve(value);
            },
            (error) => {
              clearTimeout(timeoutId);
              reject(error);
            },
          );
        });

        for (const outcome of outcomes) {
          if (!outcome.ok) {
            warnTelemetryDeliveryFailure(
              `PostHog capture failed for ${outcome.event} (HTTP ${outcome.status})`,
            );
          }
        }
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "telemetry flush timeout"
        ) {
          warnTelemetryDeliveryFailure("PostHog capture flush timed out");
        } else {
          warnTelemetryDeliveryFailure("PostHog capture flush failed");
        }
      }
    },
  };
}

/**
 * Stable anonymous id helper (optional rotation salt from env hostname).
 *
 * @param {string} seed
 * @returns {string}
 */
export function hashOperationalDistinctId(seed) {
  return createHash("sha256").update(seed).digest("hex").slice(0, 32);
}

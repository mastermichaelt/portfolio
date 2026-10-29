export function resolveEvaluationObservabilityConfig(): {
  enabled: boolean;
} {
  const explicitOff =
    process.env.ASSISTANT_EVALUATION_ENABLED?.trim().toLowerCase() === "false";
  const enabled = !explicitOff && Boolean(process.env.DATABASE_URL?.trim());

  return { enabled };
}

/**
 * Optional age window for manual operator cleanup only — not a retention policy default.
 */
export function parseEvaluationCleanupRetentionDays(
  raw: string | undefined,
): number | null {
  if (raw === undefined || raw.trim() === "") {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.floor(parsed);
}

export function resolveEvaluationCleanupRetentionDays(): number | null {
  return parseEvaluationCleanupRetentionDays(
    process.env.ASSISTANT_EVALUATION_RETENTION_DAYS,
  );
}

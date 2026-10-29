const DEFAULT_RETENTION_DAYS = 30;

export function resolveEvaluationObservabilityConfig(): {
  enabled: boolean;
  retentionDays: number;
} {
  const explicitOff =
    process.env.ASSISTANT_EVALUATION_ENABLED?.trim().toLowerCase() === "false";
  const enabled = !explicitOff && Boolean(process.env.DATABASE_URL?.trim());

  const parsed = Number(
    process.env.ASSISTANT_EVALUATION_RETENTION_DAYS ?? DEFAULT_RETENTION_DAYS,
  );
  const retentionDays =
    Number.isFinite(parsed) && parsed > 0
      ? Math.floor(parsed)
      : DEFAULT_RETENTION_DAYS;

  return { enabled, retentionDays };
}

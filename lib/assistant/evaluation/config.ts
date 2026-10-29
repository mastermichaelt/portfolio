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
 * Accepts positive integers only (fractional values that floor below 1 are rejected).
 */
export function parseEvaluationCleanupRetentionDays(
  raw: string | undefined,
): number | null {
  if (raw === undefined || raw.trim() === "") {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  const days = Math.floor(parsed);
  if (days < 1) {
    return null;
  }
  return days;
}

export function resolveEvaluationCleanupRetentionDays(): number | null {
  return parseEvaluationCleanupRetentionDays(
    process.env.ASSISTANT_EVALUATION_RETENTION_DAYS,
  );
}

export type EvaluationCleanupRetentionDaysResolution =
  | { source: "omitted" }
  | { source: "explicit"; days: number }
  | { source: "invalid"; message: string };

/**
 * Resolves retention days from cleanup CLI argv. Invalid explicit --days does not fall back to env.
 */
export function resolveEvaluationCleanupRetentionDaysFromArgv(
  argv: string[],
): EvaluationCleanupRetentionDaysResolution {
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--days") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("-")) {
        return {
          source: "invalid",
          message: "Evaluation cleanup: --days requires a positive integer.",
        };
      }
      const days = parseEvaluationCleanupRetentionDays(value);
      if (days === null) {
        return {
          source: "invalid",
          message: `Evaluation cleanup: invalid --days value "${value}" (use a positive integer).`,
        };
      }
      return { source: "explicit", days };
    }
    if (arg.startsWith("--days=")) {
      const value = arg.slice("--days=".length);
      const days = parseEvaluationCleanupRetentionDays(value);
      if (days === null) {
        return {
          source: "invalid",
          message: `Evaluation cleanup: invalid --days value "${value}" (use a positive integer).`,
        };
      }
      return { source: "explicit", days };
    }
  }
  return { source: "omitted" };
}

export function resolveEvaluationCleanupRetentionDaysForRun(
  argv: string[],
): { days: number } | { error: string } {
  const fromArgv = resolveEvaluationCleanupRetentionDaysFromArgv(argv);
  if (fromArgv.source === "invalid") {
    return { error: fromArgv.message };
  }
  if (fromArgv.source === "explicit") {
    return { days: fromArgv.days };
  }
  const fromEnv = resolveEvaluationCleanupRetentionDays();
  if (fromEnv === null) {
    return {
      error:
        "Evaluation cleanup requires an explicit age window: pass --days <n> or set ASSISTANT_EVALUATION_RETENTION_DAYS.",
    };
  }
  return { days: fromEnv };
}

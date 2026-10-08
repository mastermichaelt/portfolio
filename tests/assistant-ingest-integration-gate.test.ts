import { afterEach, describe, expect, it } from "vitest";

import {
  isNeonPostgresHost,
  parsePostgresDatabaseName,
  validateAssistantIngestTestDatabaseUrl,
} from "@/scripts/assistant/db/integration-test-database.mjs";
import { resetEnvFileLoader } from "@/scripts/assistant/db/load-env.mjs";

describe("assistant ingest integration test database gate", () => {
  const previousDevUrl = process.env.DATABASE_URL;
  const previousTestUrl = process.env.ASSISTANT_TEST_DATABASE_URL;
  const previousAllowNeon = process.env.ASSISTANT_TEST_ALLOW_NEON;

  afterEach(() => {
    resetEnvFileLoader();
    if (previousDevUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDevUrl;
    }
    if (previousTestUrl === undefined) {
      delete process.env.ASSISTANT_TEST_DATABASE_URL;
    } else {
      process.env.ASSISTANT_TEST_DATABASE_URL = previousTestUrl;
    }
    if (previousAllowNeon === undefined) {
      delete process.env.ASSISTANT_TEST_ALLOW_NEON;
    } else {
      process.env.ASSISTANT_TEST_ALLOW_NEON = previousAllowNeon;
    }
  });

  it("parses postgres database names from connection strings", () => {
    expect(
      parsePostgresDatabaseName(
        "postgresql://user:pass@localhost:5433/portfolio_assistant_test",
      ),
    ).toBe("portfolio_assistant_test");
  });

  it("detects Neon hosts", () => {
    expect(
      isNeonPostgresHost(
        "postgresql://user:pass@ep-cool.ap-southeast-2.aws.neon.tech/neondb_test?sslmode=require",
      ),
    ).toBe(true);
    expect(
      isNeonPostgresHost(
        "postgresql://user:pass@localhost:5433/portfolio_assistant_test",
      ),
    ).toBe(false);
  });

  it("rejects dev retrieval index database names", () => {
    process.env.DATABASE_URL =
      "postgresql://portfolio:portfolio_dev@localhost:5433/portfolio_assistant";
    const result = validateAssistantIngestTestDatabaseUrl(
      "postgresql://portfolio:portfolio_dev@localhost:5433/portfolio_assistant",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/_test/);
    }
  });

  it("rejects ASSISTANT_TEST_DATABASE_URL equal to DATABASE_URL", () => {
    const url =
      "postgresql://portfolio:portfolio_dev@localhost:5433/portfolio_assistant_test";
    process.env.DATABASE_URL = url;
    const result = validateAssistantIngestTestDatabaseUrl(url);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/must not equal DATABASE_URL/);
    }
  });

  it("accepts local dedicated test database URLs", () => {
    process.env.DATABASE_URL =
      "postgresql://portfolio:portfolio_dev@localhost:5433/portfolio_assistant";
    const result = validateAssistantIngestTestDatabaseUrl(
      "postgresql://portfolio:portfolio_dev@localhost:5433/portfolio_assistant_test",
    );
    expect(result).toEqual({ ok: true });
  });

  it("rejects Neon without explicit opt-in", () => {
    process.env.DATABASE_URL =
      "postgresql://portfolio:portfolio_dev@localhost:5433/portfolio_assistant";
    delete process.env.ASSISTANT_TEST_ALLOW_NEON;
    const result = validateAssistantIngestTestDatabaseUrl(
      "postgresql://user:pass@ep-x.ap-southeast-2.aws.neon.tech/portfolio_assistant_test?sslmode=require",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/ASSISTANT_TEST_ALLOW_NEON/);
    }
  });

  it("accepts Neon only with opt-in and _test database name", () => {
    process.env.DATABASE_URL =
      "postgresql://portfolio:portfolio_dev@localhost:5433/portfolio_assistant";
    process.env.ASSISTANT_TEST_ALLOW_NEON = "1";
    const result = validateAssistantIngestTestDatabaseUrl(
      "postgresql://user:pass@ep-x.ap-southeast-2.aws.neon.tech/portfolio_assistant_test?sslmode=require",
    );
    expect(result).toEqual({ ok: true });
  });
});

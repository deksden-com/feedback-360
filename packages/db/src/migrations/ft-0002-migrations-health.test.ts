import { describe, expect, it } from "vitest";

import { applyMigrations, runHealthCheck } from "../migrations";

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

describe("FT-0002 migrate + health", () => {
  it.runIf(hasDatabaseUrl)("applies migrations and runs select-1 health query", async () => {
    await applyMigrations();
    await runHealthCheck();
    expect(true).toBe(true);
  });

  it.skipIf(hasDatabaseUrl)("skips integration run when DATABASE_URL is absent", () => {
    expect(process.env.DATABASE_URL).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";

import { hasDatabaseUrl } from "../connection-string";
import { applyMigrations, runHealthCheck } from "../migrations";

const hasUrl = hasDatabaseUrl();

describe("FT-0002 migrate + health", () => {
  it.runIf(hasUrl)("applies migrations and runs select-1 health query", async () => {
    await applyMigrations();
    await runHealthCheck();
    expect(true).toBe(true);
  });

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});

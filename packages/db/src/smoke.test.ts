import { describe, expect, it } from "vitest";

import { dbReady, runSeedScenario } from "./index";

describe("db package", () => {
  it("has smoke readiness", () => {
    expect(dbReady).toBe(true);
  });

  it("rejects unsupported variants before touching db", async () => {
    await expect(
      runSeedScenario({
        scenario: "S1_company_min",
        variant: "unknown",
      }),
    ).rejects.toThrow("Unsupported seed variant");
  });
});

import { describe, expect, it } from "vitest";

import { hasDatabaseUrl, runSeedScenario } from "@feedback-360/db";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0081 membership.list", () => {
  it.runIf(hasUrl)(
    "lists memberships from S1_multi_tenant_min for shared user",
    async () => {
      const seeded = await runSeedScenario({
        scenario: "S1_multi_tenant_min",
      });

      const userId = seeded.handles["user.shared"];
      const companyA = seeded.handles["company.a"];
      const companyB = seeded.handles["company.b"];

      expect(userId).toBeDefined();
      expect(companyA).toBeDefined();
      expect(companyB).toBeDefined();

      if (!userId || !companyA || !companyB) {
        throw new Error("Required seed handles are missing.");
      }

      const result = await dispatchOperation({
        operation: "membership.list",
        input: {},
        context: {
          userId,
        },
      });

      expect(result.ok).toBe(true);
      if (result.ok && "items" in result.data) {
        expect(result.data.items).toHaveLength(2);
        const companyIds = result.data.items
          .map((item) => ("companyId" in item ? item.companyId : undefined))
          .filter((value): value is string => typeof value === "string")
          .sort();
        expect(companyIds).toEqual([companyA, companyB].sort());
      }
    },
    30_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});

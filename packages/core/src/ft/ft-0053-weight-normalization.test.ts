import { hasDatabaseUrl, runSeedScenario } from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0053 weights normalization", () => {
  it.runIf(hasUrl)(
    "normalizes to manager=50/peers=50 when subordinates group is absent",
    async () => {
      const seeded = await runSeedScenario({
        scenario: "S7_campaign_started_some_submitted",
        variant: "no_subordinates",
      });

      const companyId = seeded.handles["company.main"];
      const campaignId = seeded.handles["campaign.main"];
      const subjectEmployeeId = seeded.handles["employee.subject_main"];
      expect(companyId).toBeDefined();
      expect(campaignId).toBeDefined();
      expect(subjectEmployeeId).toBeDefined();

      if (!companyId || !campaignId || !subjectEmployeeId) {
        return;
      }

      const result = await dispatchOperation({
        operation: "results.getHrView",
        input: {
          campaignId,
          subjectEmployeeId,
        },
        context: {
          companyId,
          role: "hr_admin",
        },
      });

      expect(result.ok).toBe(true);
      if (
        !result.ok ||
        !("configuredGroupWeights" in result.data) ||
        !("effectiveGroupWeights" in result.data) ||
        !("overallScore" in result.data)
      ) {
        return;
      }
      const data = result.data;

      expect(data.configuredGroupWeights).toMatchObject({
        manager: 40,
        peers: 30,
        subordinates: 30,
        self: 0,
        other: 0,
      });
      expect(data.effectiveGroupWeights).toMatchObject({
        manager: 50,
        peers: 50,
        subordinates: 0,
        self: 0,
        other: 0,
      });
      expect(data.groupOverall.manager).toBe(4);
      expect(data.groupOverall.peers).toBe(3);
      expect(data.groupOverall.subordinates).toBeUndefined();
      expect(data.overallScore).toBe(3.5);
    },
    60_000,
  );

  it.runIf(hasUrl)(
    "assigns manager=50/other=50 when small groups are merged into other",
    async () => {
      const seeded = await runSeedScenario({
        scenario: "S7_campaign_started_some_submitted",
        variant: "peers2",
      });

      const companyId = seeded.handles["company.main"];
      const campaignId = seeded.handles["campaign.main"];
      const subjectEmployeeId = seeded.handles["employee.subject_main"];

      if (!companyId || !campaignId || !subjectEmployeeId) {
        return;
      }

      const result = await dispatchOperation({
        operation: "results.getHrView",
        input: {
          campaignId,
          subjectEmployeeId,
          smallGroupPolicy: "merge_to_other",
        },
        context: {
          companyId,
          role: "hr_admin",
        },
      });

      expect(result.ok).toBe(true);
      if (
        !result.ok ||
        !("effectiveGroupWeights" in result.data) ||
        !("groupVisibility" in result.data) ||
        !("overallScore" in result.data)
      ) {
        return;
      }
      const data = result.data;

      expect(data.groupVisibility.peers).toBe("merged");
      expect(data.groupVisibility.subordinates).toBe("merged");
      expect(data.groupVisibility.other).toBe("shown");
      expect(data.effectiveGroupWeights).toMatchObject({
        manager: 50,
        peers: 0,
        subordinates: 0,
        self: 0,
        other: 50,
      });
      expect(data.groupOverall.manager).toBe(4);
      expect(data.groupOverall.other).toBeCloseTo(3.3333, 4);
      expect(data.overallScore).toBeCloseTo(3.6666, 4);
    },
    60_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});

import { hasDatabaseUrl, runSeedScenario } from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0054 levels mode/distribution", () => {
  it.runIf(hasUrl)(
    "returns mode=null on tie and excludes UNSURE from nValid",
    async () => {
      const seeded = await runSeedScenario({
        scenario: "S7_campaign_started_some_submitted",
        variant: "levels_tie",
      });

      const companyId = seeded.handles["company.main"];
      const campaignId = seeded.handles["campaign.main"];
      const subjectEmployeeId = seeded.handles["employee.subject_main"];
      const competencyId = seeded.handles["competency.main"];
      const managerId = seeded.handles["employee.rater_manager"];

      expect(companyId).toBeDefined();
      expect(campaignId).toBeDefined();
      expect(subjectEmployeeId).toBeDefined();
      expect(competencyId).toBeDefined();
      expect(managerId).toBeDefined();

      if (!companyId || !campaignId || !subjectEmployeeId || !competencyId || !managerId) {
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
        !("modelKind" in result.data) ||
        !("groupVisibility" in result.data) ||
        !("competencyScores" in result.data) ||
        !("raterScores" in result.data) ||
        !("effectiveGroupWeights" in result.data)
      ) {
        return;
      }
      const data = result.data;

      expect(data.modelKind).toBe("levels");
      expect(data.groupVisibility.peers).toBe("merged");
      expect(data.groupVisibility.subordinates).toBe("merged");
      expect(data.groupVisibility.other).toBe("shown");

      const leadership = data.competencyScores.find((item) => item.competencyId === competencyId);
      expect(leadership).toBeDefined();
      expect(leadership?.otherVisibility).toBe("shown");
      expect(leadership?.otherLevels?.modeLevel).toBeNull();
      expect(leadership?.otherLevels?.distribution).toEqual({
        level1: 0,
        level2: 2,
        level3: 2,
        level4: 0,
      });
      expect(leadership?.otherLevels?.nValid).toBe(4);
      expect(leadership?.otherLevels?.nUnsure).toBe(0);

      expect(leadership?.managerLevels?.modeLevel).toBeNull();
      expect(leadership?.managerLevels?.nValid).toBe(0);
      expect(leadership?.managerLevels?.nUnsure).toBe(1);
      expect(leadership?.managerScore).toBeUndefined();
      expect(data.groupOverall.manager).toBeUndefined();
      expect(data.groupOverall.other).toBe(2.5);
      expect(data.effectiveGroupWeights).toMatchObject({
        manager: 0,
        peers: 0,
        subordinates: 0,
        self: 0,
        other: 100,
      });
      expect(data.overallScore).toBe(2.5);

      const managerRaterScore = data.raterScores.find(
        (item) => item.raterEmployeeId === managerId && item.competencyId === competencyId,
      );
      expect(managerRaterScore).toBeDefined();
      expect(managerRaterScore?.score).toBeUndefined();
      expect(managerRaterScore?.validIndicatorCount).toBe(0);
      expect(managerRaterScore?.totalIndicatorCount).toBe(1);
    },
    60_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});

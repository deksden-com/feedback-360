import { hasDatabaseUrl, runSeedScenario } from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0052 anonymity threshold + small groups", () => {
  it.runIf(hasUrl)(
    "applies hide policy and marks peers/subordinates visibility as hidden for peers2 dataset",
    async () => {
      const seeded = await runSeedScenario({
        scenario: "S7_campaign_started_some_submitted",
        variant: "peers2",
      });

      const companyId = seeded.handles["company.main"];
      const campaignId = seeded.handles["campaign.main"];
      const subjectEmployeeId = seeded.handles["employee.subject_main"];
      const competencyMain = seeded.handles["competency.main"];
      const competencySecondary = seeded.handles["competency.secondary"];

      expect(companyId).toBeDefined();
      expect(campaignId).toBeDefined();
      expect(subjectEmployeeId).toBeDefined();
      expect(competencyMain).toBeDefined();
      expect(competencySecondary).toBeDefined();

      if (
        !companyId ||
        !campaignId ||
        !subjectEmployeeId ||
        !competencyMain ||
        !competencySecondary
      ) {
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
        !("smallGroupPolicy" in result.data) ||
        !("anonymityThreshold" in result.data) ||
        !("groupVisibility" in result.data) ||
        !("competencyScores" in result.data)
      ) {
        return;
      }
      const data = result.data;

      expect(data.smallGroupPolicy).toBe("hide");
      expect(data.anonymityThreshold).toBe(3);
      expect(data.groupVisibility.peers).toBe("hidden");
      expect(data.groupVisibility.subordinates).toBe("hidden");
      expect(data.groupVisibility.other).toBeUndefined();

      const leadership = data.competencyScores.find((item) => item.competencyId === competencyMain);
      const collaboration = data.competencyScores.find(
        (item) => item.competencyId === competencySecondary,
      );
      expect(leadership).toBeDefined();
      expect(collaboration).toBeDefined();

      expect(leadership?.peersRaters).toBe(2);
      expect(leadership?.subordinatesRaters).toBe(1);
      expect(leadership?.peersVisibility).toBe("hidden");
      expect(leadership?.subordinatesVisibility).toBe("hidden");
      expect(leadership?.otherVisibility).toBeUndefined();

      expect(collaboration?.peersRaters).toBe(1);
      expect(collaboration?.subordinatesRaters).toBe(0);
      expect(collaboration?.peersVisibility).toBe("hidden");
      expect(collaboration?.subordinatesVisibility).toBe("hidden");
      expect(collaboration?.otherVisibility).toBeUndefined();
    },
    60_000,
  );

  it.runIf(hasUrl)(
    "applies merge_to_other and per-competency threshold on merged group",
    async () => {
      const seeded = await runSeedScenario({
        scenario: "S7_campaign_started_some_submitted",
        variant: "peers2",
      });

      const companyId = seeded.handles["company.main"];
      const campaignId = seeded.handles["campaign.main"];
      const subjectEmployeeId = seeded.handles["employee.subject_main"];
      const competencyMain = seeded.handles["competency.main"];
      const competencySecondary = seeded.handles["competency.secondary"];

      if (
        !companyId ||
        !campaignId ||
        !subjectEmployeeId ||
        !competencyMain ||
        !competencySecondary
      ) {
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
        !("smallGroupPolicy" in result.data) ||
        !("groupVisibility" in result.data) ||
        !("groupOverall" in result.data) ||
        !("competencyScores" in result.data)
      ) {
        return;
      }
      const data = result.data;

      expect(data.smallGroupPolicy).toBe("merge_to_other");
      expect(data.groupVisibility.peers).toBe("merged");
      expect(data.groupVisibility.subordinates).toBe("merged");
      expect(data.groupVisibility.other).toBe("shown");
      expect(data.groupOverall.other).toBeCloseTo(3.3333, 4);

      const leadership = data.competencyScores.find((item) => item.competencyId === competencyMain);
      const collaboration = data.competencyScores.find(
        (item) => item.competencyId === competencySecondary,
      );
      expect(leadership).toBeDefined();
      expect(collaboration).toBeDefined();

      expect(leadership?.peersVisibility).toBe("merged");
      expect(leadership?.subordinatesVisibility).toBe("merged");
      expect(leadership?.otherVisibility).toBe("shown");
      expect(leadership?.otherRaters).toBe(3);
      expect(leadership?.otherScore).toBeCloseTo(3.3333, 4);

      expect(collaboration?.peersVisibility).toBe("merged");
      expect(collaboration?.subordinatesVisibility).toBe("merged");
      expect(collaboration?.otherVisibility).toBe("hidden");
      expect(collaboration?.otherRaters).toBe(1);
      expect(collaboration?.otherScore).toBeUndefined();
    },
    60_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});

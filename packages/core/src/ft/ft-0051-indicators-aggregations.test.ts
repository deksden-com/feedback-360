import { hasDatabaseUrl, runSeedScenario } from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0051 indicators aggregations", () => {
  it.runIf(hasUrl)(
    "computes indicator aggregates with NA exclusion and equal rater weighting",
    async () => {
      const seeded = await runSeedScenario({
        scenario: "S7_campaign_started_some_submitted",
        variant: "na_heavy_peer",
      });

      const companyId = seeded.handles["company.main"];
      const campaignId = seeded.handles["campaign.main"];
      const subjectEmployeeId = seeded.handles["employee.subject_main"];
      const competencyId = seeded.handles["competency.main"];
      const peer1Id = seeded.handles["employee.rater_peer_1"];
      const peer2Id = seeded.handles["employee.rater_peer_2"];

      expect(companyId).toBeDefined();
      expect(campaignId).toBeDefined();
      expect(subjectEmployeeId).toBeDefined();
      expect(competencyId).toBeDefined();
      expect(peer1Id).toBeDefined();
      expect(peer2Id).toBeDefined();

      if (
        !companyId ||
        !campaignId ||
        !subjectEmployeeId ||
        !competencyId ||
        !peer1Id ||
        !peer2Id
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
      if (result.ok && "competencyScores" in result.data && "raterScores" in result.data) {
        expect(result.data.modelKind).toBe("indicators");

        const competencyScore = result.data.competencyScores.find(
          (item) => item.competencyId === competencyId,
        );
        expect(competencyScore).toBeDefined();
        expect(competencyScore?.managerScore).toBe(4);
        expect(competencyScore?.managerRaters).toBe(1);
        expect(competencyScore?.peersScore).toBe(3);
        expect(competencyScore?.peersRaters).toBe(2);

        const peerRaterScores = result.data.raterScores
          .filter((item) => item.group === "peers" && item.competencyId === competencyId)
          .sort((left, right) => left.raterEmployeeId.localeCompare(right.raterEmployeeId));

        expect(peerRaterScores).toHaveLength(2);

        const peer1 = peerRaterScores.find((item) => item.raterEmployeeId === peer1Id);
        const peer2 = peerRaterScores.find((item) => item.raterEmployeeId === peer2Id);

        expect(peer1).toBeDefined();
        expect(peer2).toBeDefined();
        expect(peer1?.score).toBe(5);
        expect(peer1?.validIndicatorCount).toBe(1);
        expect(peer1?.totalIndicatorCount).toBe(3);
        expect(peer2?.score).toBe(1);
        expect(peer2?.validIndicatorCount).toBe(3);
        expect(peer2?.totalIndicatorCount).toBe(3);

        const naiveIndicatorWeightedAverage =
          ((peer1?.score ?? 0) * (peer1?.validIndicatorCount ?? 0) +
            (peer2?.score ?? 0) * (peer2?.validIndicatorCount ?? 0)) /
          ((peer1?.validIndicatorCount ?? 0) + (peer2?.validIndicatorCount ?? 0));

        expect(Number(naiveIndicatorWeightedAverage.toFixed(4))).toBe(2);
        expect(competencyScore?.peersScore).toBe(3);
      }
    },
    60_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});

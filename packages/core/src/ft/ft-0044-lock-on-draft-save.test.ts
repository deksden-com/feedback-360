import { hasDatabaseUrl, runSeedScenario } from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0044 lock on first draft save", () => {
  it.runIf(hasUrl)(
    "keeps matrix/weights mutable before first draft and blocks both after lock",
    async () => {
      const seeded = await runSeedScenario({
        scenario: "S5_campaign_started_no_answers",
      });

      const companyId = seeded.handles["company.main"];
      const campaignId = seeded.handles["campaign.main"];
      const questionnaireId = seeded.handles["questionnaire.main"];
      const subjectEmployeeId = seeded.handles["employee.staff_a1"];
      const managerEmployeeId = seeded.handles["employee.head_a"];

      expect(companyId).toBeDefined();
      expect(campaignId).toBeDefined();
      expect(questionnaireId).toBeDefined();
      expect(subjectEmployeeId).toBeDefined();
      expect(managerEmployeeId).toBeDefined();

      if (
        !companyId ||
        !campaignId ||
        !questionnaireId ||
        !subjectEmployeeId ||
        !managerEmployeeId
      ) {
        return;
      }

      const hrContext = {
        companyId,
        role: "hr_admin" as const,
      };
      const employeeContext = {
        companyId,
        role: "employee" as const,
      };

      const beforeLockWeights = await dispatchOperation({
        operation: "campaign.weights.set",
        input: {
          campaignId,
          manager: 40,
          peers: 30,
          subordinates: 30,
        },
        context: hrContext,
      });
      expect(beforeLockWeights.ok).toBe(true);

      const beforeLockMatrix = await dispatchOperation({
        operation: "matrix.set",
        input: {
          campaignId,
          assignments: [
            {
              subjectEmployeeId,
              raterEmployeeId: managerEmployeeId,
              raterRole: "manager",
            },
          ],
        },
        context: hrContext,
      });
      expect(beforeLockMatrix.ok).toBe(true);
      if (beforeLockMatrix.ok && "totalAssignments" in beforeLockMatrix.data) {
        expect(beforeLockMatrix.data.totalAssignments).toBe(1);
      }

      const saveDraft = await dispatchOperation({
        operation: "questionnaire.saveDraft",
        input: {
          questionnaireId,
          draft: {
            answers: {
              leadership: 4,
            },
          },
        },
        context: employeeContext,
      });
      expect(saveDraft.ok).toBe(true);
      if (saveDraft.ok && "campaignLockedAt" in saveDraft.data) {
        expect(typeof saveDraft.data.campaignLockedAt).toBe("string");
        expect(saveDraft.data.campaignLockedAt.length).toBeGreaterThan(0);
      }

      const afterLockWeights = await dispatchOperation({
        operation: "campaign.weights.set",
        input: {
          campaignId,
          manager: 50,
          peers: 25,
          subordinates: 25,
        },
        context: hrContext,
      });
      expect(afterLockWeights.ok).toBe(false);
      if (!afterLockWeights.ok) {
        expect(afterLockWeights.error.code).toBe("campaign_locked");
      }

      const afterLockMatrix = await dispatchOperation({
        operation: "matrix.set",
        input: {
          campaignId,
          assignments: [
            {
              subjectEmployeeId,
              raterEmployeeId: managerEmployeeId,
              raterRole: "manager",
            },
          ],
        },
        context: hrContext,
      });
      expect(afterLockMatrix.ok).toBe(false);
      if (!afterLockMatrix.ok) {
        expect(afterLockMatrix.error.code).toBe("campaign_locked");
      }
    },
    60_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});

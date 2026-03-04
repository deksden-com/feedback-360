import { hasDatabaseUrl, runSeedScenario } from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0043 started immutability", () => {
  it.runIf(hasUrl)(
    "allows model/participants mutation in draft and blocks all such mutations after start",
    async () => {
      const seeded = await runSeedScenario({
        scenario: "S4_campaign_draft",
        variant: "no_participants",
      });

      const companyId = seeded.handles["company.main"];
      const campaignId = seeded.handles["campaign.main"];
      const employeeA = seeded.handles["employee.staff_a1"];
      const employeeB = seeded.handles["employee.staff_a2"];
      expect(companyId).toBeDefined();
      expect(campaignId).toBeDefined();
      expect(employeeA).toBeDefined();
      expect(employeeB).toBeDefined();

      if (!companyId || !campaignId || !employeeA || !employeeB) {
        return;
      }

      const context = {
        companyId,
        role: "hr_admin" as const,
      };

      const modelOne = await dispatchOperation({
        operation: "model.version.create",
        input: {
          name: "Q1 Model",
          kind: "indicators",
          groups: [
            {
              name: "Execution",
              weight: 100,
              competencies: [
                {
                  name: "Delivery",
                  indicators: [
                    { text: "Keeps commitments", order: 1 },
                    { text: "Communicates clearly", order: 2 },
                  ],
                },
              ],
            },
          ],
        },
        context,
      });
      expect(modelOne.ok).toBe(true);
      if (!modelOne.ok || !("modelVersionId" in modelOne.data)) {
        return;
      }

      const modelTwo = await dispatchOperation({
        operation: "model.version.create",
        input: {
          name: "Q2 Model",
          kind: "indicators",
          groups: [
            {
              name: "Collaboration",
              weight: 100,
              competencies: [
                {
                  name: "Communication",
                  indicators: [
                    { text: "Shares context", order: 1 },
                    { text: "Listens actively", order: 2 },
                  ],
                },
              ],
            },
          ],
        },
        context,
      });
      expect(modelTwo.ok).toBe(true);
      if (!modelTwo.ok || !("modelVersionId" in modelTwo.data)) {
        return;
      }

      const setModelDraft = await dispatchOperation({
        operation: "campaign.setModelVersion",
        input: {
          campaignId,
          modelVersionId: modelOne.data.modelVersionId,
        },
        context,
      });
      expect(setModelDraft.ok).toBe(true);

      const addParticipantsDraft = await dispatchOperation({
        operation: "campaign.participants.add",
        input: {
          campaignId,
          employeeIds: [employeeA, employeeB],
        },
        context,
      });
      expect(addParticipantsDraft.ok).toBe(true);
      if (addParticipantsDraft.ok && "totalParticipants" in addParticipantsDraft.data) {
        expect(addParticipantsDraft.data.totalParticipants).toBe(2);
      }

      const startCampaign = await dispatchOperation({
        operation: "campaign.start",
        input: {
          campaignId,
        },
        context,
      });
      expect(startCampaign.ok).toBe(true);

      const setModelStarted = await dispatchOperation({
        operation: "campaign.setModelVersion",
        input: {
          campaignId,
          modelVersionId: modelTwo.data.modelVersionId,
        },
        context,
      });
      expect(setModelStarted.ok).toBe(false);
      if (!setModelStarted.ok) {
        expect(setModelStarted.error.code).toBe("campaign_started_immutable");
      }

      const addParticipantsStarted = await dispatchOperation({
        operation: "campaign.participants.add",
        input: {
          campaignId,
          employeeIds: [seeded.handles["employee.staff_b1"] ?? "missing-employee"],
        },
        context,
      });
      expect(addParticipantsStarted.ok).toBe(false);
      if (!addParticipantsStarted.ok) {
        expect(addParticipantsStarted.error.code).toBe("campaign_started_immutable");
      }

      const removeParticipantsStarted = await dispatchOperation({
        operation: "campaign.participants.remove",
        input: {
          campaignId,
          employeeIds: [employeeA],
        },
        context,
      });
      expect(removeParticipantsStarted.ok).toBe(false);
      if (!removeParticipantsStarted.ok) {
        expect(removeParticipantsStarted.error.code).toBe("campaign_started_immutable");
      }
    },
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});

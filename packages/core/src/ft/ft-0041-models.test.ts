import { hasDatabaseUrl, runSeedScenario } from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0041 competency model versions + campaign create", () => {
  it.runIf(hasUrl)("creates indicators model version and campaign linked to it", async () => {
    const seeded = await runSeedScenario({
      scenario: "S1_company_min",
    });

    const companyId = seeded.handles["company.main"];
    expect(companyId).toBeDefined();

    if (!companyId) {
      return;
    }

    const context = {
      companyId,
      role: "hr_admin" as const,
    };

    const modelResult = await dispatchOperation({
      operation: "model.version.create",
      input: {
        name: "Q1 Model",
        kind: "indicators",
        groups: [
          {
            name: "Execution",
            weight: 60,
            competencies: [
              {
                name: "Delivery",
                indicators: [
                  { text: "Meets deadlines", order: 1 },
                  { text: "Raises risks early", order: 2 },
                ],
              },
            ],
          },
          {
            name: "Collaboration",
            weight: 40,
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

    expect(modelResult.ok).toBe(true);
    if (
      !modelResult.ok ||
      !("modelVersionId" in modelResult.data) ||
      !("groupCount" in modelResult.data)
    ) {
      return;
    }

    expect(modelResult.data.companyId).toBe(companyId);
    expect(modelResult.data.kind).toBe("indicators");
    expect(modelResult.data.groupCount).toBe(2);
    expect(modelResult.data.competencyCount).toBe(2);
    expect(modelResult.data.indicatorCount).toBe(4);
    expect(modelResult.data.levelCount).toBe(0);

    const campaignResult = await dispatchOperation({
      operation: "campaign.create",
      input: {
        name: "Q1 2026 Campaign",
        modelVersionId: modelResult.data.modelVersionId,
        startAt: "2026-03-15T09:00:00.000Z",
        endAt: "2026-03-30T18:00:00.000Z",
      },
      context,
    });

    expect(campaignResult.ok).toBe(true);
    if (
      !campaignResult.ok ||
      !("campaignId" in campaignResult.data) ||
      !("modelVersionId" in campaignResult.data) ||
      !("timezone" in campaignResult.data)
    ) {
      return;
    }

    expect(campaignResult.data.companyId).toBe(companyId);
    expect(campaignResult.data.modelVersionId).toBe(modelResult.data.modelVersionId);
    expect(campaignResult.data.status).toBe("draft");
    expect(campaignResult.data.timezone).toBe("Europe/Kaliningrad");
  });

  it.runIf(hasUrl)("returns invalid_input for model with invalid group weights", async () => {
    const seeded = await runSeedScenario({
      scenario: "S1_company_min",
    });

    const companyId = seeded.handles["company.main"];
    expect(companyId).toBeDefined();

    if (!companyId) {
      return;
    }

    const result = await dispatchOperation({
      operation: "model.version.create",
      input: {
        name: "Broken model",
        kind: "indicators",
        groups: [
          {
            name: "Execution",
            weight: 90,
            competencies: [
              {
                name: "Delivery",
                indicators: [{ text: "Keeps commitments", order: 1 }],
              },
            ],
          },
        ],
      },
      context: {
        companyId,
        role: "hr_admin",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("invalid_input");
    }
  });

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { createClient } from "./index";

describe("FT-0041 client model + campaign operations", () => {
  it("maps model.version.create and campaign.create with active company context", async () => {
    const requests: Array<{
      operation: string;
      context?: { companyId?: string };
      input: unknown;
    }> = [];

    const client = createClient({
      invoke: async (request) => {
        requests.push({
          operation: request.operation,
          context: request.context,
          input: request.input,
        });

        if (request.operation === "model.version.create") {
          return {
            ok: true,
            data: {
              modelVersionId: "model-version-1",
              companyId: request.context?.companyId ?? "unknown-company",
              name: "Q1 Model",
              kind: "indicators",
              version: 1,
              createdAt: "2026-03-04T10:00:00.000Z",
              groupCount: 1,
              competencyCount: 1,
              indicatorCount: 2,
              levelCount: 0,
            },
          };
        }

        if (request.operation === "campaign.create") {
          return {
            ok: true,
            data: {
              campaignId: "campaign-main",
              companyId: request.context?.companyId ?? "unknown-company",
              modelVersionId: "model-version-1",
              name: "Q1 Campaign",
              status: "draft",
              startAt: "2026-04-01T09:00:00.000Z",
              endAt: "2026-04-30T18:00:00.000Z",
              timezone: "Europe/Kaliningrad",
              createdAt: "2026-03-04T10:05:00.000Z",
            },
          };
        }

        return {
          ok: false,
          error: {
            code: "not_found",
            message: `Unexpected operation: ${request.operation}`,
          },
        };
      },
    });

    const activeCompany = client.setActiveCompany("company-main");
    expect(activeCompany.ok).toBe(true);

    const modelResult = await client.modelVersionCreate({
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
                { text: "Communicates risks", order: 2 },
              ],
            },
          ],
        },
      ],
    });
    expect(modelResult.ok).toBe(true);
    if (!modelResult.ok) {
      return;
    }
    expect(modelResult.data.companyId).toBe("company-main");

    const campaignResult = await client.campaignCreate({
      name: "Q1 Campaign",
      modelVersionId: modelResult.data.modelVersionId,
      startAt: "2026-04-01T09:00:00.000Z",
      endAt: "2026-04-30T18:00:00.000Z",
    });
    expect(campaignResult.ok).toBe(true);
    if (!campaignResult.ok) {
      return;
    }
    expect(campaignResult.data.companyId).toBe("company-main");
    expect(campaignResult.data.modelVersionId).toBe(modelResult.data.modelVersionId);

    expect(requests).toHaveLength(2);
    expect(requests[0]?.operation).toBe("model.version.create");
    expect(requests[1]?.operation).toBe("campaign.create");
    expect(requests[0]?.context?.companyId).toBe("company-main");
    expect(requests[1]?.context?.companyId).toBe("company-main");
  });
});

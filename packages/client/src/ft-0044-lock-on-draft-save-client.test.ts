import { describe, expect, it } from "vitest";

import { createClient } from "./index";

describe("FT-0044 client matrix/weights operations", () => {
  it("maps campaign.weights.set and matrix.set with active company context", async () => {
    const operations: string[] = [];

    const client = createClient({
      invoke: async (request) => {
        operations.push(request.operation);

        if (request.operation === "campaign.weights.set") {
          return {
            ok: true,
            data: {
              campaignId: "campaign-main",
              manager: 40,
              peers: 30,
              subordinates: 30,
              self: 0,
              changed: true,
              updatedAt: "2026-03-04T12:00:00.000Z",
            },
          };
        }

        if (request.operation === "matrix.set") {
          return {
            ok: true,
            data: {
              campaignId: "campaign-main",
              totalAssignments: 1,
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

    const setActiveCompany = client.setActiveCompany("company-main");
    expect(setActiveCompany.ok).toBe(true);

    const weightsResult = await client.campaignWeightsSet({
      campaignId: "campaign-main",
      manager: 40,
      peers: 30,
      subordinates: 30,
    });
    expect(weightsResult.ok).toBe(true);

    const matrixResult = await client.matrixSet({
      campaignId: "campaign-main",
      assignments: [
        {
          subjectEmployeeId: "employee-staff-a1",
          raterEmployeeId: "employee-head-a",
          raterRole: "manager",
        },
      ],
    });
    expect(matrixResult.ok).toBe(true);

    expect(operations).toEqual(["campaign.weights.set", "matrix.set"]);
  });
});

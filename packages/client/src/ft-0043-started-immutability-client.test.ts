import { describe, expect, it } from "vitest";

import { createClient } from "./index";

describe("FT-0043 client campaign mutability ops", () => {
  it("maps setModelVersion and participants add/remove operations", async () => {
    const operations: string[] = [];

    const client = createClient({
      invoke: async (request) => {
        operations.push(request.operation);

        if (request.operation === "campaign.setModelVersion") {
          return {
            ok: true,
            data: {
              campaignId: "campaign-main",
              modelVersionId: "model-version-1",
              changed: true,
              updatedAt: "2026-03-04T12:00:00.000Z",
            },
          };
        }

        if (
          request.operation === "campaign.participants.add" ||
          request.operation === "campaign.participants.remove"
        ) {
          return {
            ok: true,
            data: {
              campaignId: "campaign-main",
              changedEmployeeIds: ["employee-1"],
              totalParticipants: request.operation === "campaign.participants.add" ? 1 : 0,
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

    const setCompany = client.setActiveCompany("company-main");
    expect(setCompany.ok).toBe(true);

    const setModelResult = await client.campaignSetModelVersion({
      campaignId: "campaign-main",
      modelVersionId: "model-version-1",
    });
    expect(setModelResult.ok).toBe(true);

    const addParticipants = await client.campaignParticipantsAdd({
      campaignId: "campaign-main",
      employeeIds: ["employee-1"],
    });
    expect(addParticipants.ok).toBe(true);

    const removeParticipants = await client.campaignParticipantsRemove({
      campaignId: "campaign-main",
      employeeIds: ["employee-1"],
    });
    expect(removeParticipants.ok).toBe(true);

    expect(operations).toEqual([
      "campaign.setModelVersion",
      "campaign.participants.add",
      "campaign.participants.remove",
    ]);
  });
});

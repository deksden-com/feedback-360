import { describe, expect, it } from "vitest";

import { createClient } from "./index";

describe("FT-0042 client campaign lifecycle operations", () => {
  it("maps campaign.start/stop/end operations with active company context", async () => {
    const operations: string[] = [];

    const client = createClient({
      invoke: async (request) => {
        operations.push(request.operation);
        return {
          ok: true,
          data: {
            campaignId: "campaign-main",
            previousStatus:
              request.operation === "campaign.start"
                ? "draft"
                : request.operation === "campaign.stop"
                  ? "started"
                  : "ended",
            status: request.operation === "campaign.start" ? "started" : "ended",
            changed: request.operation !== "campaign.end",
            updatedAt: "2026-03-04T12:00:00.000Z",
          },
        };
      },
    });

    const setActiveCompany = client.setActiveCompany("company-main");
    expect(setActiveCompany.ok).toBe(true);

    const startResult = await client.campaignStart({ campaignId: "campaign-main" });
    expect(startResult.ok).toBe(true);

    const stopResult = await client.campaignStop({ campaignId: "campaign-main" });
    expect(stopResult.ok).toBe(true);

    const endResult = await client.campaignEnd({ campaignId: "campaign-main" });
    expect(endResult.ok).toBe(true);

    expect(operations).toEqual(["campaign.start", "campaign.stop", "campaign.end"]);
  });
});

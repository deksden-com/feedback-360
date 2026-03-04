import { describe, expect, it } from "vitest";

import type { DispatchOperationInput } from "@feedback-360/api-contract";

import { type OperationTransport, createClient } from "./index";

describe("FT-0071 client ai.runForCampaign", () => {
  it("invokes ai.runForCampaign with active company context and parses typed output", async () => {
    const requests: DispatchOperationInput[] = [];
    const transport: OperationTransport = {
      invoke: async (request) => {
        requests.push(request);
        return {
          ok: true,
          data: {
            campaignId: "campaign-main",
            aiJobId: "ai-job-main",
            provider: "mvp_stub",
            status: "completed",
            completedAt: "2026-01-21T10:00:00.000Z",
            wasAlreadyCompleted: false,
          },
        };
      },
    };

    const client = createClient(transport);
    client.setActiveCompany("company-main");

    const result = await client.aiRunForCampaign({
      campaignId: "campaign-main",
    });

    expect(result.ok).toBe(true);
    expect(requests).toHaveLength(1);
    expect(requests[0]?.operation).toBe("ai.runForCampaign");
    expect(requests[0]?.context?.companyId).toBe("company-main");

    if (result.ok) {
      expect(result.data.provider).toBe("mvp_stub");
      expect(result.data.status).toBe("completed");
      expect(result.data.wasAlreadyCompleted).toBe(false);
    }
  });
});

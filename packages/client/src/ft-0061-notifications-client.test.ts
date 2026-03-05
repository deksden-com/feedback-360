import { describe, expect, it } from "vitest";

import type { DispatchOperationInput } from "@feedback-360/api-contract";

import { type OperationTransport, createClient } from "./index";

describe("FT-0061 client notifications operations", () => {
  it("invokes notifications.generateReminders and notifications.dispatchOutbox with active context", async () => {
    const requests: DispatchOperationInput[] = [];
    const transport: OperationTransport = {
      invoke: async (request) => {
        requests.push(request);

        if (request.operation === "notifications.generateReminders") {
          return {
            ok: true,
            data: {
              campaignId: "campaign-main",
              dateBucket: "2026-03-05",
              candidateRecipients: 2,
              generated: 2,
              deduplicated: 0,
            },
          };
        }

        return {
          ok: true,
          data: {
            provider: "stub",
            processed: 2,
            sent: 2,
            failed: 0,
            attemptsLogged: 2,
            remainingPending: 0,
          },
        };
      },
    };

    const client = createClient(transport);
    client.setActiveCompany("company-main");

    const generated = await client.notificationsGenerateReminders({
      campaignId: "campaign-main",
    });
    const dispatched = await client.notificationsDispatchOutbox({
      campaignId: "campaign-main",
      limit: 50,
      provider: "stub",
    });

    expect(generated.ok).toBe(true);
    expect(dispatched.ok).toBe(true);
    expect(requests).toHaveLength(2);
    expect(requests[0]?.operation).toBe("notifications.generateReminders");
    expect(requests[0]?.context?.companyId).toBe("company-main");
    expect(requests[1]?.operation).toBe("notifications.dispatchOutbox");
    expect(requests[1]?.context?.companyId).toBe("company-main");
  });
});

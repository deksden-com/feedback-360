import { describe, expect, it } from "vitest";

import { type OperationTransport, createClient } from "./index";

describe("FT-0081 membership.list client mapping", () => {
  it("maps membershipList to membership.list operation with active context", async () => {
    const transport: OperationTransport = {
      invoke: async (request) => {
        expect(request.operation).toBe("membership.list");
        expect(request.input).toEqual({});
        expect(request.context?.userId).toBe("user-shared");

        return {
          ok: true,
          data: {
            items: [
              {
                companyId: "company-a",
                companyName: "Company A",
                role: "employee",
              },
              {
                companyId: "company-b",
                companyName: "Company B",
                role: "manager",
              },
            ],
          },
        };
      },
    };

    const client = createClient(transport);
    client.setActiveContext({ userId: "user-shared" });

    const result = await client.membershipList();
    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.items).toHaveLength(2);
      expect(result.data.items[0]?.companyId).toBe("company-a");
      expect(result.data.items[1]?.companyId).toBe("company-b");
    }
  });
});

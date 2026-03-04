import { type DispatchOperationInput, createOperationError } from "@feedback-360/api-contract";
import { hasDatabaseUrl } from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { type OperationTransport, createClient, createInprocClient } from "./index";

const hasUrl = hasDatabaseUrl();

describe("FT-0021 multi-tenant active company isolation", () => {
  it("isolates company scope when active company changes (transport contract)", async () => {
    const campaignToCompany = new Map([
      ["campaign-a", "company-a"],
      ["campaign-b", "company-b"],
    ]);

    const transport: OperationTransport = {
      invoke: async (request: DispatchOperationInput) => {
        if (request.operation !== "questionnaire.listAssigned") {
          return {
            ok: false,
            error: createOperationError("not_found", `Unsupported operation: ${request.operation}`),
          };
        }

        const campaignId = (request.input as { campaignId?: string }).campaignId;
        if (typeof campaignId !== "string") {
          return {
            ok: false,
            error: createOperationError("invalid_input", "campaignId is required."),
          };
        }

        const contextCompanyId = request.context?.companyId;
        if (!contextCompanyId) {
          return {
            ok: false,
            error: createOperationError("forbidden", "Active company is required."),
          };
        }

        const ownerCompanyId = campaignToCompany.get(campaignId);
        if (!ownerCompanyId || ownerCompanyId !== contextCompanyId) {
          return {
            ok: false,
            error: createOperationError("not_found", "Campaign not found in active company.", {
              campaignId,
              companyId: contextCompanyId,
            }),
          };
        }

        return {
          ok: true,
          data: {
            items: [
              {
                questionnaireId: `q-${campaignId}`,
                campaignId,
                companyId: ownerCompanyId,
                subjectEmployeeId: `subject-${campaignId}`,
                raterEmployeeId: `rater-${campaignId}`,
                status: "not_started",
              },
            ],
          },
        };
      },
    };

    const client = createClient(transport);

    const useA = client.setActiveCompany("company-a");
    expect(useA.ok).toBe(true);

    const listA = await client.questionnaireListAssigned(
      { campaignId: "campaign-a" },
      { role: "hr_admin" },
    );
    expect(listA.ok).toBe(true);
    if (listA.ok) {
      expect(listA.data.items).toHaveLength(1);
      expect(listA.data.items[0]?.companyId).toBe("company-a");
    }

    const useB = client.setActiveCompany("company-b");
    expect(useB.ok).toBe(true);

    const listB = await client.questionnaireListAssigned(
      { campaignId: "campaign-b" },
      { role: "hr_admin" },
    );
    expect(listB.ok).toBe(true);
    if (listB.ok) {
      expect(listB.data.items).toHaveLength(1);
      expect(listB.data.items[0]?.companyId).toBe("company-b");
    }

    const crossCompanyRead = await client.questionnaireListAssigned(
      { campaignId: "campaign-a" },
      { role: "hr_admin" },
    );
    expect(crossCompanyRead.ok).toBe(false);
    if (!crossCompanyRead.ok) {
      expect(crossCompanyRead.error.code).toBe("not_found");
    }
  });

  it.runIf(hasUrl)("runs S1_multi_tenant_min and enforces isolation in in-proc flow", async () => {
    const client = createInprocClient();
    const seeded = await client.seedRun({ scenario: "S1_multi_tenant_min" });

    const companyA = seeded.handles["company.a"];
    const companyB = seeded.handles["company.b"];
    const campaignA = seeded.handles["campaign.a"];
    const campaignB = seeded.handles["campaign.b"];

    expect(companyA).toBeDefined();
    expect(companyB).toBeDefined();
    expect(campaignA).toBeDefined();
    expect(campaignB).toBeDefined();

    if (!companyA || !companyB || !campaignA || !campaignB) {
      return;
    }

    client.setActiveCompany(companyA);
    const listA = await client.questionnaireListAssigned(
      { campaignId: campaignA },
      { role: "hr_admin" },
    );
    expect(listA.ok).toBe(true);
    if (listA.ok) {
      expect(listA.data.items).toHaveLength(1);
      expect(listA.data.items[0]?.companyId).toBe(companyA);
    }

    client.setActiveCompany(companyB);
    const listB = await client.questionnaireListAssigned(
      { campaignId: campaignB },
      { role: "hr_admin" },
    );
    expect(listB.ok).toBe(true);
    if (listB.ok) {
      expect(listB.data.items).toHaveLength(1);
      expect(listB.data.items[0]?.companyId).toBe(companyB);
    }

    const crossCompanyRead = await client.questionnaireListAssigned(
      { campaignId: campaignA },
      { role: "hr_admin" },
    );
    expect(crossCompanyRead.ok).toBe(false);
    if (!crossCompanyRead.ok) {
      expect(crossCompanyRead.error.code).toBe("not_found");
    }
  });

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});

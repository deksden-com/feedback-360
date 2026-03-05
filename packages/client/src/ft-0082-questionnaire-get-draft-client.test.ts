import { describe, expect, it } from "vitest";

import { type OperationTransport, createClient } from "./index";

describe("FT-0082 questionnaire.getDraft client mapping", () => {
  it("maps questionnaireGetDraft to questionnaire.getDraft operation", async () => {
    const transport: OperationTransport = {
      invoke: async (request) => {
        expect(request.operation).toBe("questionnaire.getDraft");
        expect(request.input).toEqual({
          questionnaireId: "q-main",
        });
        expect(request.context?.companyId).toBe("company-main");
        expect(request.context?.userId).toBe("user-main");
        expect(request.context?.role).toBe("employee");

        return {
          ok: true,
          data: {
            questionnaireId: "q-main",
            campaignId: "campaign-main",
            companyId: "company-main",
            subjectEmployeeId: "employee-subject",
            raterEmployeeId: "employee-rater",
            status: "in_progress",
            campaignStatus: "started",
            draft: {
              note: "saved",
            },
          },
        };
      },
    };

    const client = createClient(transport);
    client.setActiveContext({
      companyId: "company-main",
      userId: "user-main",
      role: "employee",
    });

    const result = await client.questionnaireGetDraft({
      questionnaireId: "q-main",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe("in_progress");
      expect(result.data.campaignStatus).toBe("started");
      expect(result.data.draft.note).toBe("saved");
    }
  });
});

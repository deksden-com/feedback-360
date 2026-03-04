import { describe, expect, it } from "vitest";

import {
  apiContractReady,
  parseClientSetActiveCompanyInput,
  parseOperationError,
  parseSeedRunInput,
  parseSeedRunOutput,
} from "./index";

describe("api-contract package", () => {
  it("has smoke readiness", () => {
    expect(apiContractReady).toBe(true);
  });

  it("parses seed.run input and output", () => {
    const input = parseSeedRunInput({ scenario: "S1_company_min" });
    expect(input.scenario).toBe("S1_company_min");

    const output = parseSeedRunOutput({
      scenario: "S1_company_min",
      handles: {
        "company.main": "id",
      },
    });
    expect(output.handles["company.main"]).toBe("id");
  });

  it("parses typed operation error", () => {
    const error = parseOperationError({
      code: "invalid_input",
      message: "Input is invalid",
      details: { field: "scenario" },
    });

    expect(error.code).toBe("invalid_input");
    expect(error.details?.field).toBe("scenario");
  });

  it("parses client active company input", () => {
    const parsed = parseClientSetActiveCompanyInput({ companyId: "company-1" });
    expect(parsed.companyId).toBe("company-1");
  });
});

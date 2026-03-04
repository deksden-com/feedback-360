import { describe, expect, it } from "vitest";

import { apiContractReady, parseSeedRunInput, parseSeedRunOutput } from "./index";

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
});

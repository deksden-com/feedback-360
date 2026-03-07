import { describe, expect, it } from "vitest";

import { getXeScenarioDefinition, listXeScenarios } from "./scenario-registry";

describe("FT-0205 scenario registry", () => {
  it("loads XE-001 definition and lists catalog", async () => {
    const scenarios = await listXeScenarios();
    expect(scenarios.some((scenario) => scenario.scenarioId === "XE-001")).toBe(true);

    const xe001 = await getXeScenarioDefinition("XE-001");
    expect(xe001.seed.handle).toBe("XE-001-first-campaign");
    expect(xe001.phases.map((phase) => phase.phaseId)).toEqual([
      "phase-01-seed",
      "phase-02-start-campaign",
      "phase-03-bootstrap-sessions",
      "phase-04-fill-questionnaires",
      "phase-05-verify-results",
    ]);
  });
});

import { describe, expect, it } from "vitest";

import { clientReady, createInprocClient } from "./index";

describe("client package", () => {
  it("has smoke readiness", () => {
    expect(clientReady).toBe(true);
  });

  it("creates inproc client with key operations", () => {
    const client = createInprocClient();
    expect(typeof client.seedRun).toBe("function");
    expect(typeof client.systemPing).toBe("function");
    expect(typeof client.employeeUpsert).toBe("function");
    expect(typeof client.employeeListActive).toBe("function");
    expect(typeof client.orgDepartmentMove).toBe("function");
    expect(typeof client.orgManagerSet).toBe("function");
    expect(typeof client.campaignSnapshotList).toBe("function");
    expect(typeof client.questionnaireListAssigned).toBe("function");
    expect(typeof client.questionnaireSaveDraft).toBe("function");
    expect(typeof client.questionnaireSubmit).toBe("function");
    expect(typeof client.setActiveCompany).toBe("function");
    expect(typeof client.invokeOperation).toBe("function");
  });
});

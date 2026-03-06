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
    expect(typeof client.modelVersionList).toBe("function");
    expect(typeof client.campaignList).toBe("function");
    expect(typeof client.campaignGet).toBe("function");
    expect(typeof client.employeeUpsert).toBe("function");
    expect(typeof client.employeeListActive).toBe("function");
    expect(typeof client.campaignUpdateDraft).toBe("function");
    expect(typeof client.orgDepartmentMove).toBe("function");
    expect(typeof client.orgManagerSet).toBe("function");
    expect(typeof client.campaignSnapshotList).toBe("function");
    expect(typeof client.campaignProgressGet).toBe("function");
    expect(typeof client.campaignParticipantsAddFromDepartments).toBe("function");
    expect(typeof client.matrixGenerateSuggested).toBe("function");
    expect(typeof client.questionnaireListAssigned).toBe("function");
    expect(typeof client.questionnaireSaveDraft).toBe("function");
    expect(typeof client.questionnaireSubmit).toBe("function");
    expect(typeof client.resultsGetHrView).toBe("function");
    expect(typeof client.setActiveCompany).toBe("function");
    expect(typeof client.invokeOperation).toBe("function");
  });
});

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
    expect(typeof client.setActiveCompany).toBe("function");
    expect(typeof client.invokeOperation).toBe("function");
  });
});

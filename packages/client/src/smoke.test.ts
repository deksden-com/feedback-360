import { describe, expect, it } from "vitest";

import { clientReady, createInprocClient } from "./index";

describe("client package", () => {
  it("has smoke readiness", () => {
    expect(clientReady).toBe(true);
  });

  it("creates inproc client with seedRun operation", () => {
    const client = createInprocClient();
    expect(typeof client.seedRun).toBe("function");
  });
});

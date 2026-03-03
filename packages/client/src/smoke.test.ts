import { describe, expect, it } from "vitest";

import { clientReady } from "./index";

describe("client package", () => {
  it("has smoke readiness", () => {
    expect(clientReady).toBe(true);
  });
});

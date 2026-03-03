import { describe, expect, it } from "vitest";

import { coreReady } from "./index";

describe("core package", () => {
  it("has smoke readiness", () => {
    expect(coreReady).toBe(true);
  });
});

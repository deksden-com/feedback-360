import { describe, expect, it } from "vitest";

import { coreReady, dispatchOperation } from "./index";

describe("core package", () => {
  it("has smoke readiness", () => {
    expect(coreReady).toBe(true);
  });

  it("exports dispatchOperation", () => {
    expect(typeof dispatchOperation).toBe("function");
  });
});

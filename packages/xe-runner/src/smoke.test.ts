import { describe, expect, it } from "vitest";

import { xeRunnerReady } from "./index";

describe("xe-runner package", () => {
  it("has smoke readiness", () => {
    expect(xeRunnerReady).toBe(true);
  });
});

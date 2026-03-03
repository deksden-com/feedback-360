import { describe, expect, it } from "vitest";

import { testkitReady } from "./index";

describe("testkit package", () => {
  it("has smoke readiness", () => {
    expect(testkitReady).toBe(true);
  });
});

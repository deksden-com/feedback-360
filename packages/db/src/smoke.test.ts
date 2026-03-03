import { describe, expect, it } from "vitest";

import { dbReady } from "./index";

describe("db package", () => {
  it("has smoke readiness", () => {
    expect(dbReady).toBe(true);
  });
});

import { describe, expect, it } from "vitest";

import { cliReady } from "./index";

describe("cli package", () => {
  it("has smoke readiness", () => {
    expect(cliReady).toBe(true);
  });
});

import { describe, expect, it } from "vitest";

import { api_contractReady } from "./index";

describe("api-contract package", () => {
  it("has smoke readiness", () => {
    expect(api_contractReady).toBe(true);
  });
});

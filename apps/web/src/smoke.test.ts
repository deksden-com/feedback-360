import { describe, expect, it } from "vitest";

import { webAppReady } from "./index";

describe("web app package", () => {
  it("has smoke readiness", () => {
    expect(webAppReady).toBe(true);
  });
});

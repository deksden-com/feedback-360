import { describe, expect, it } from "vitest";

import { WEB_APP_READY } from "./health";

describe("health", () => {
  it("exports readiness flag", () => {
    expect(WEB_APP_READY).toBe(true);
  });
});

import { describe, expect, it } from "vitest";

import { configPackageReady } from "./index";

describe("config package", () => {
  it("exposes a smoke constant", () => {
    expect(configPackageReady).toBe(true);
  });
});

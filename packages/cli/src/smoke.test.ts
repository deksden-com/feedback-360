import { describe, expect, it } from "vitest";

import { cliReady, runCli } from "./index";

describe("cli package", () => {
  it("has smoke readiness", () => {
    expect(cliReady).toBe(true);
  });

  it("exports runCli entrypoint", () => {
    expect(typeof runCli).toBe("function");
  });
});

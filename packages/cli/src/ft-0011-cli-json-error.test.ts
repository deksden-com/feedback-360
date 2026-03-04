import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "./index";

describe("FT-0011 CLI --json error shape", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  it("prints {ok:false,error} with typed code when operation fails", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await runCli(["node", "seed", "--", "--scenario", "UNKNOWN", "--json"]);

    expect(errorSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(process.exitCode).toBe(1);

    const rawOutput = String(logSpy.mock.calls[0]?.[0] ?? "");
    const parsedOutput = JSON.parse(rawOutput) as {
      ok: boolean;
      error?: { code?: string; message?: string };
    };

    expect(parsedOutput.ok).toBe(false);
    expect(parsedOutput.error?.code).toBe("invalid_input");
    expect(typeof parsedOutput.error?.message).toBe("string");
    expect(parsedOutput.error?.message?.length).toBeGreaterThan(0);
  });
});

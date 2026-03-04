import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const makeClientMock = () => {
  const state = {
    activeCompanyId: "",
    aiCallCount: 0,
    aiJobId: "ai-job-main",
  };

  return () => ({
    setActiveCompany: (companyId: string) => {
      state.activeCompanyId = companyId;
      return {
        ok: true as const,
        data: { companyId },
      };
    },
    getActiveCompany: () => state.activeCompanyId || undefined,
    aiRunForCampaign: async ({ campaignId }: { campaignId: string }) => {
      state.aiCallCount += 1;
      return {
        ok: true as const,
        data: {
          campaignId,
          aiJobId: state.aiJobId,
          provider: "mvp_stub" as const,
          status: "completed" as const,
          completedAt: "2026-01-21T10:00:00.000Z",
          wasAlreadyCompleted: state.aiCallCount > 1,
        },
      };
    },
  });
};

describe("FT-0071 CLI ai run flow", () => {
  let homePath = "";

  beforeEach(async () => {
    vi.resetModules();
    process.exitCode = undefined;
    homePath = await mkdtemp(join(tmpdir(), "feedback360-cli-test-"));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
    if (homePath) {
      await rm(homePath, { recursive: true, force: true });
    }
  });

  it("runs AI processing in stub mode and returns already-completed on second run", async () => {
    vi.doMock("node:os", async () => {
      const actual = await vi.importActual<typeof import("node:os")>("node:os");
      return {
        ...actual,
        homedir: () => homePath,
      };
    });

    vi.doMock("@feedback-360/client", () => {
      return {
        createInprocClient: makeClientMock(),
      };
    });

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { runCli } = await import("./index");

    await runCli(["node", "feedback360", "company", "use", "company-main"]);
    await runCli(["node", "feedback360", "ai", "run", "campaign-main"]);
    await runCli(["node", "feedback360", "ai", "run", "campaign-main"]);

    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(process.exitCode).toBeUndefined();

    const output = logSpy.mock.calls.map((call) => String(call[0] ?? "")).join("\n");
    expect(output).toContain("AI processing completed:");
    expect(output).toContain("AI processing already completed:");
    expect(output).toContain("campaign=campaign-main");
    expect(output).toContain("provider=mvp_stub");
  });
});

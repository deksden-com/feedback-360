import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const makeClientMock = () => {
  const state: {
    activeCompanyId?: string;
    role?: string;
    userId?: string;
  } = {};

  return () => ({
    seedRun: async () => ({
      scenario: "S1_company_min",
      handles: {
        "company.main": "company-main",
      },
    }),
    systemPing: async () => ({
      ok: true as const,
      data: {
        pong: "ok" as const,
        timestamp: new Date().toISOString(),
      },
    }),
    setActiveCompany: (companyId: string) => {
      state.activeCompanyId = companyId;
      return {
        ok: true as const,
        data: { companyId },
      };
    },
    setActiveContext: ({
      role,
      userId,
    }: {
      role?: "hr_admin" | "hr_reader" | "manager" | "employee";
      userId?: string;
    }) => {
      state.role = role;
      state.userId = userId;
      return {
        ok: true as const,
        data: {
          ...(state.activeCompanyId ? { companyId: state.activeCompanyId } : {}),
          ...(state.role ? { role: state.role } : {}),
          ...(state.userId ? { userId: state.userId } : {}),
        },
      };
    },
    getActiveCompany: () => state.activeCompanyId,
    getActiveContext: () => ({
      ...(state.activeCompanyId ? { companyId: state.activeCompanyId } : {}),
      ...(state.role ? { role: state.role } : {}),
      ...(state.userId ? { userId: state.userId } : {}),
    }),
    invokeOperation: async () => ({
      ok: false as const,
      error: { code: "not_found", message: "not implemented in test mock" },
    }),
    campaignWeightsSet: async ({ campaignId }: { campaignId: string }) => {
      if (state.role !== "hr_admin") {
        return {
          ok: false as const,
          error: {
            code: "forbidden" as const,
            message: "Only HR Admin can set campaign weights.",
          },
        };
      }

      return {
        ok: true as const,
        data: {
          campaignId,
          manager: 40,
          peers: 30,
          subordinates: 30,
          self: 0 as const,
          changed: true,
          updatedAt: "2026-03-04T12:00:00.000Z",
        },
      };
    },
  });
};

describe("FT-0012 CLI active actor context", () => {
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

  it("persists company role/user context and applies it to role-protected commands", async () => {
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

    await runCli([
      "node",
      "feedback360",
      "company",
      "use",
      "company-main",
      "--role",
      "hr_admin",
      "--user-id",
      "user-main",
      "--json",
    ]);

    await runCli(["node", "feedback360", "company", "context", "--json"]);

    await runCli([
      "node",
      "feedback360",
      "campaign",
      "weights",
      "set",
      "campaign-main",
      "--manager",
      "40",
      "--peers",
      "30",
      "--subordinates",
      "30",
      "--json",
    ]);

    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(process.exitCode).toBeUndefined();

    const jsonLines = logSpy.mock.calls
      .map((call) => String(call[0] ?? ""))
      .filter((line) => line.trim().startsWith("{"));
    expect(jsonLines.length).toBeGreaterThanOrEqual(3);

    const useOutput = JSON.parse(jsonLines[0] ?? "{}") as {
      ok?: boolean;
      data?: { companyId?: string; role?: string; userId?: string };
    };
    expect(useOutput.ok).toBe(true);
    expect(useOutput.data?.companyId).toBe("company-main");
    expect(useOutput.data?.role).toBe("hr_admin");
    expect(useOutput.data?.userId).toBe("user-main");

    const weightsOutput = JSON.parse(jsonLines.at(-1) ?? "{}") as {
      ok?: boolean;
      data?: { campaignId?: string };
    };
    expect(weightsOutput.ok).toBe(true);
    expect(weightsOutput.data?.campaignId).toBe("campaign-main");
  });
});

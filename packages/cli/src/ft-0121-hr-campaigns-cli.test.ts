import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const makeClientMock = () => {
  let activeCompanyId = "";

  return () => ({
    setActiveCompany: (companyId: string) => {
      activeCompanyId = companyId;
      return {
        ok: true as const,
        data: { companyId },
      };
    },
    getActiveCompany: () => activeCompanyId || undefined,
    invokeOperation: async () => ({
      ok: false as const,
      error: { code: "not_found", message: "not implemented in test mock" },
    }),
    modelVersionList: async () => ({
      ok: true as const,
      data: {
        items: [
          {
            modelVersionId: "model-version-1",
            name: "Q1 Model",
            kind: "indicators" as const,
            version: 1,
            status: "published",
            createdAt: "2026-03-06T09:00:00.000Z",
          },
        ],
      },
    }),
    campaignList: async ({ status }: { status?: string }) => ({
      ok: true as const,
      data: {
        items: [
          {
            campaignId: "campaign-main",
            companyId: activeCompanyId,
            name: "Q1 Campaign",
            status: status ?? "draft",
            modelVersionId: "model-version-1",
            modelName: "Q1 Model",
            modelKind: "indicators" as const,
            modelVersion: 1,
            startAt: "2026-04-01T09:00:00.000Z",
            endAt: "2026-04-30T18:00:00.000Z",
            timezone: "Europe/Kaliningrad",
            createdAt: "2026-03-06T10:00:00.000Z",
            updatedAt: "2026-03-06T10:00:00.000Z",
          },
        ],
      },
    }),
    campaignGet: async ({ campaignId }: { campaignId: string }) => ({
      ok: true as const,
      data: {
        campaignId,
        companyId: activeCompanyId,
        name: "Q1 Campaign",
        status: "draft" as const,
        modelVersionId: "model-version-1",
        modelName: "Q1 Model",
        modelKind: "indicators" as const,
        modelVersion: 1,
        startAt: "2026-04-01T09:00:00.000Z",
        endAt: "2026-04-30T18:00:00.000Z",
        timezone: "Europe/Kaliningrad",
        createdAt: "2026-03-06T10:00:00.000Z",
        updatedAt: "2026-03-06T10:00:00.000Z",
        managerWeight: 40,
        peersWeight: 30,
        subordinatesWeight: 30,
        selfWeight: 0,
      },
    }),
    campaignUpdateDraft: async ({
      campaignId,
      modelVersionId,
      name,
      timezone,
    }: {
      campaignId: string;
      modelVersionId: string;
      name: string;
      timezone?: string;
    }) => ({
      ok: true as const,
      data: {
        campaignId,
        companyId: activeCompanyId,
        modelVersionId,
        name,
        status: "draft" as const,
        startAt: "2026-04-02T09:00:00.000Z",
        endAt: "2026-04-28T18:00:00.000Z",
        timezone: timezone ?? "Europe/Kaliningrad",
        changed: true,
        updatedAt: "2026-03-06T11:00:00.000Z",
      },
    }),
  });
};

describe("FT-0121 CLI campaign list/detail/draft flow", () => {
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

  it("prints campaign management commands in human-readable mode", async () => {
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

    await runCli(["node", "feedback360", "company", "use", "company-main", "--role", "hr_admin"]);
    await runCli(["node", "feedback360", "model", "version", "list"]);
    await runCli(["node", "feedback360", "campaign", "list", "--status", "draft"]);
    await runCli(["node", "feedback360", "campaign", "get", "campaign-main"]);
    await runCli([
      "node",
      "feedback360",
      "campaign",
      "update-draft",
      "campaign-main",
      "--name",
      "Q1 Campaign Updated",
      "--model-version",
      "model-version-1",
      "--start-at",
      "2026-04-02T09:00:00.000Z",
      "--end-at",
      "2026-04-28T18:00:00.000Z",
      "--timezone",
      "Europe/Kaliningrad",
    ]);

    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(process.exitCode).toBeUndefined();

    const output = logSpy.mock.calls.map((call) => String(call[0] ?? "")).join("\n");
    expect(output).toContain("Model versions:");
    expect(output).toContain("Campaigns:");
    expect(output).toContain("Campaign detail:");
    expect(output).toContain("Campaign draft saved:");
  });
});

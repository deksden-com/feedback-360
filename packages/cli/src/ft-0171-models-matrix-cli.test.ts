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
    modelVersionGet: async ({ modelVersionId }: { modelVersionId: string }) => ({
      ok: true as const,
      data: {
        modelVersionId,
        companyId: activeCompanyId,
        name: "Leadership Levels",
        kind: "levels" as const,
        version: 2,
        status: "draft" as const,
        groups: [
          {
            name: "Leadership",
            weight: 100,
            competencies: [
              {
                name: "Coaching",
                levels: [
                  { level: 1, text: "Level 1" },
                  { level: 2, text: "Level 2" },
                ],
              },
            ],
          },
        ],
      },
    }),
    modelVersionCloneDraft: async ({
      sourceModelVersionId,
      name,
    }: {
      sourceModelVersionId: string;
      name?: string;
    }) => ({
      ok: true as const,
      data: {
        modelVersionId: "model-draft-2",
        companyId: activeCompanyId,
        name: name ?? "Leadership Levels Copy",
        kind: "levels" as const,
        version: 3,
        status: "draft" as const,
        createdAt: "2026-03-06T10:00:00.000Z",
        updatedAt: "2026-03-06T10:00:00.000Z",
        groups: [
          {
            name: `Cloned from ${sourceModelVersionId}`,
            weight: 100,
            competencies: [
              {
                name: "Coaching",
                levels: [
                  { level: 1, text: "Level 1" },
                  { level: 2, text: "Level 2" },
                ],
              },
            ],
          },
        ],
      },
    }),
    modelVersionUpsertDraft: async ({
      modelVersionId,
      name,
      kind,
      groups,
    }: {
      modelVersionId?: string;
      name: string;
      kind: "indicators" | "levels";
      groups: Array<unknown>;
    }) => ({
      ok: true as const,
      data: {
        modelVersionId: modelVersionId ?? "model-draft-new",
        companyId: activeCompanyId,
        name,
        kind,
        version: 3,
        status: "draft" as const,
        createdAt: "2026-03-06T11:00:00.000Z",
        updatedAt: "2026-03-06T11:00:00.000Z",
        groups: groups as Array<{
          name: string;
          weight: number;
          competencies: Array<{
            name: string;
            indicators?: Array<{ text: string; order?: number }>;
            levels?: Array<{ level: number; text: string }>;
          }>;
        }>,
      },
    }),
    modelVersionPublish: async ({ modelVersionId }: { modelVersionId: string }) => ({
      ok: true as const,
      data: {
        modelVersionId,
        name: "Leadership Levels Copy",
        version: 3,
        status: "published" as const,
        updatedAt: "2026-03-06T12:00:00.000Z",
      },
    }),
    matrixList: async ({ campaignId }: { campaignId: string }) => ({
      ok: true as const,
      data: {
        campaignId,
        assignments: [
          {
            subjectEmployeeId: "emp-subject",
            raterEmployeeId: "emp-manager",
            raterRole: "manager" as const,
            source: "auto" as const,
          },
        ],
      },
    }),
  });
};

describe("FT-0171 CLI model/matrix operations", () => {
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

  it("prints model detail/clone/save/publish and matrix list commands", async () => {
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
    await runCli(["node", "feedback360", "model", "version", "get", "model-published-1"]);
    await runCli([
      "node",
      "feedback360",
      "model",
      "version",
      "clone-draft",
      "model-published-1",
      "--name",
      "Leadership Levels Copy",
    ]);
    await runCli([
      "node",
      "feedback360",
      "model",
      "version",
      "save-draft",
      "--model-version",
      "model-draft-2",
      "--payload-json",
      JSON.stringify({
        name: "Leadership Levels Copy",
        kind: "levels",
        groups: [
          {
            name: "Leadership",
            weight: 100,
            competencies: [
              {
                name: "Coaching",
                levels: [{ level: 1, text: "Level 1" }],
              },
            ],
          },
        ],
      }),
    ]);
    await runCli(["node", "feedback360", "model", "version", "publish", "model-draft-2"]);
    await runCli(["node", "feedback360", "matrix", "list", "campaign-main"]);

    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(process.exitCode).toBeUndefined();

    const output = logSpy.mock.calls.map((call) => String(call[0] ?? "")).join("\n");
    expect(output).toContain("Model version detail:");
    expect(output).toContain("Model draft cloned:");
    expect(output).toContain("Model version detail:");
    expect(output).toContain("Model version published:");
    expect(output).toContain("Matrix assignments:");
  });
});

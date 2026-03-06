import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const makeClientMock = () => {
  let activeCompanyId = "";

  return () => ({
    setActiveCompany: (companyId: string) => {
      activeCompanyId = companyId;
      return { ok: true as const, data: { companyId } };
    },
    getActiveCompany: () => activeCompanyId || undefined,
    opsHealthGet: async () => ({
      ok: true as const,
      data: {
        appEnv: "beta",
        appVersion: "0.1.0",
        gitCommitSha: "abc123",
        gitBranch: "develop",
        deploymentUrl: "https://beta.go360go.ru",
        checks: [
          { key: "web", label: "Web app", status: "healthy" as const, detail: "ready" },
          { key: "db", label: "Database", status: "healthy" as const, detail: "configured" },
        ],
      },
    }),
    opsAiDiagnosticsList: async () => ({
      ok: true as const,
      data: {
        items: [
          {
            aiJobId: "ai-job-1",
            campaignId: "campaign-main",
            provider: "mvp_stub",
            status: "completed",
            requestedAt: "2026-03-06T07:00:00.000Z",
            completedAt: "2026-03-06T07:02:00.000Z",
            idempotencyKey: "ops-fixture-completed",
            receipt: {
              receiptId: "receipt-1",
              idempotencyKey: "receipt-key",
              receivedAt: "2026-03-06T07:02:00.000Z",
              lastReceivedAt: "2026-03-06T07:04:00.000Z",
              deliveryCount: 2,
              payloadSummary: "completed · comments=1",
            },
          },
        ],
      },
    }),
    opsAuditList: async () => ({
      ok: true as const,
      data: {
        items: [
          {
            auditEventId: "audit-1",
            companyId: activeCompanyId,
            campaignId: "campaign-main",
            actorUserId: "user-1",
            actorRole: "hr_admin",
            source: "release",
            eventType: "release.beta_deployed",
            objectType: "release",
            objectId: "abc123",
            summary: "Beta deployment готов к smoke-проверке.",
            metadataJson: { appEnv: "beta" },
            createdAt: "2026-03-06T06:50:00.000Z",
          },
        ],
      },
    }),
  });
};

describe("FT-019 CLI ops flow", () => {
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

  it("runs ops health, ai diagnostics and audit commands", async () => {
    vi.doMock("node:os", async () => {
      const actual = await vi.importActual<typeof import("node:os")>("node:os");
      return { ...actual, homedir: () => homePath };
    });

    vi.doMock("@feedback-360/client", () => ({
      createInprocClient: makeClientMock(),
    }));

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { runCli } = await import("./index");

    await runCli(["node", "feedback360", "company", "use", "company-main"]);
    await runCli(["node", "feedback360", "ops", "health"]);
    await runCli(["node", "feedback360", "ops", "ai", "--campaign", "campaign-main"]);
    await runCli(["node", "feedback360", "ops", "audit", "--campaign", "campaign-main"]);

    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(process.exitCode).toBeUndefined();

    const output = logSpy.mock.calls.map((call) => String(call[0] ?? "")).join("\n");
    expect(output).toContain("Ops health:");
    expect(output).toContain("AI diagnostics:");
    expect(output).toContain("Audit events:");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

describe("FT-0204 XE CLI", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    process.exitCode = undefined;
  });

  it("lists scenarios, creates run, inspects lock, and issues actor storage state", async () => {
    vi.doMock("@feedback-360/xe-runner", () => ({
      listAvailableXeScenarios: async () => [
        {
          scenarioId: "XE-001",
          version: "1",
          name: "First 360 campaign happy path",
          allowedEnvironments: ["local"],
          phases: [
            {
              phaseId: "phase-01-seed",
              title: "Seed",
              failurePolicy: "fail_run",
            },
          ],
        },
      ],
      createXeRunWorkspace: async () => ({
        runId: "RUN-001",
        scenarioId: "XE-001",
        scenarioVersion: "1",
        environment: "local",
        status: "created",
        workspacePath: ".xe-runs/RUN-001__XE-001",
        createdAt: "2026-03-07T10:00:00.000Z",
        expiresAt: "2026-04-06T10:00:00.000Z",
        cleanupStatus: "active",
        summary: { owner: "cli" },
        bindings: {},
      }),
      getXeEnvironmentLock: async () => ({
        environment: "local",
        runId: "RUN-001",
        owner: "cli",
        acquiredAt: "2026-03-07T10:00:00.000Z",
        expiresAt: "2026-03-07T12:00:00.000Z",
        updatedAt: "2026-03-07T10:00:00.000Z",
      }),
      issueXeActorStorageState: async () => ({
        actor: "subject",
        format: "storage-state",
        path: ".xe-runs/RUN-001__XE-001/storage-state/subject.json",
        baseUrl: "http://127.0.0.1:3000",
      }),
      listXeRunNotifications: async () => ({
        items: [
          {
            outboxId: "outbox-1",
            eventType: "campaign_invite",
            recipientEmployeeId: "employee-1",
            status: "sent",
            toEmail: "xe@test.local",
          },
        ],
      }),
      listXeRunRegistry: async () => ({ items: [] }),
      runXeScenario: async () => ({
        runId: "RUN-001",
        scenarioId: "XE-001",
        scenarioVersion: "1",
        environment: "local",
        status: "passed",
        workspacePath: ".xe-runs/RUN-001__XE-001",
        createdAt: "2026-03-07T10:00:00.000Z",
        expiresAt: "2026-04-06T10:00:00.000Z",
        cleanupStatus: "active",
        summary: {},
        bindings: {},
      }),
      runXeScenarioById: async () => ({
        runId: "RUN-001",
        scenarioId: "XE-001",
        scenarioVersion: "1",
        environment: "local",
        status: "passed",
        workspacePath: ".xe-runs/RUN-001__XE-001",
        createdAt: "2026-03-07T10:00:00.000Z",
        expiresAt: "2026-04-06T10:00:00.000Z",
        cleanupStatus: "active",
        summary: {},
        bindings: {},
      }),
      getXeRunRegistry: async () => ({
        runId: "RUN-001",
        scenarioId: "XE-001",
        scenarioVersion: "1",
        environment: "local",
        status: "created",
        workspacePath: ".xe-runs/RUN-001__XE-001",
        createdAt: "2026-03-07T10:00:00.000Z",
        expiresAt: "2026-04-06T10:00:00.000Z",
        cleanupStatus: "active",
        summary: {},
        bindings: {},
      }),
      deleteManagedXeRun: async () => ({ deleted: true }),
      cleanupExpiredManagedXeRuns: async () => ({ deletedRunIds: ["RUN-001"] }),
      acquireXeEnvironmentLock: async () => ({
        environment: "local",
        runId: "RUN-001",
        owner: "cli",
        acquiredAt: "2026-03-07T10:00:00.000Z",
        expiresAt: "2026-03-07T12:00:00.000Z",
        updatedAt: "2026-03-07T10:00:00.000Z",
      }),
      releaseXeEnvironmentLock: async () => true,
      readXeState: async () => ({
        phases: {
          "phase-01-seed": {
            status: "passed",
          },
        },
      }),
    }));

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { runCli } = await import("./index");

    await runCli(["node", "feedback360", "xe", "scenarios", "list"]);
    await runCli(["node", "feedback360", "xe", "runs", "create", "XE-001", "--env", "local"]);
    await runCli(["node", "feedback360", "xe", "lock", "status", "--env", "local"]);
    await runCli([
      "node",
      "feedback360",
      "xe",
      "auth",
      "issue",
      "RUN-001",
      "--actor",
      "subject",
      "--base-url",
      "http://127.0.0.1:3000",
    ]);

    expect(errorSpy).toHaveBeenCalledTimes(0);
    const output = logSpy.mock.calls.map((call) => String(call[0] ?? "")).join("\n");
    expect(output).toContain("XE scenarios:");
    expect(output).toContain("XE run: RUN-001");
    expect(output).toContain("XE lock:");
    expect(output).toContain("Issued storage-state for subject");
  });
});

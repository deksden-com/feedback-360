import { afterEach, describe, expect, it, vi } from "vitest";

import { hasDatabaseUrl } from "../connection-string";
import { runSeedScenario } from "../seeds";
import {
  acquireXeLock,
  applyXeNamedSeed,
  createXeRun,
  deleteXeRun,
  getXeLock,
  getXeRun,
  releaseXeLock,
} from "../xe";

const hasUrl = hasDatabaseUrl();

describe("FT-0201 XE run lifecycle", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.runIf(hasUrl)(
    "creates a run, acquires lock, applies explicit seed bindings, and cleans up by run id",
    async () => {
      await runSeedScenario({ scenario: "S0_empty" });

      const run = await createXeRun({
        scenarioId: "XE-001",
        scenarioVersion: "1",
        environment: "local",
        owner: "vitest",
        workspacePath: ".xe-runs/test-ft-0201",
      });

      expect(run.status).toBe("created");

      const lock = await acquireXeLock({
        environment: "local",
        runId: run.runId,
        owner: "vitest",
      });
      expect(lock.runId).toBe(run.runId);

      const bindings = await applyXeNamedSeed({
        runId: run.runId,
        seedHandle: "XE-001-first-campaign",
      });
      expect(bindings.company?.id).toBeDefined();
      expect(bindings.campaign?.id).toBeDefined();
      expect(Object.keys(bindings.actors ?? {})).toHaveLength(9);

      const persistedRun = await getXeRun(run.runId);
      expect(persistedRun.bindings.company?.id).toBe(bindings.company?.id);

      const persistedLock = await getXeLock("local");
      expect(persistedLock?.runId).toBe(run.runId);

      const released = await releaseXeLock({
        environment: "local",
        runId: run.runId,
      });
      expect(released).toBe(true);

      const deleted = await deleteXeRun(run.runId);
      expect(deleted.deleted).toBe(true);

      await expect(getXeRun(run.runId)).rejects.toMatchObject({
        code: "not_found",
      });
    },
    90_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });

  it.runIf(hasUrl)("blocks beta seed reset while XE lock is active", async () => {
    await runSeedScenario({ scenario: "S0_empty" });

    const run = await createXeRun({
      scenarioId: "XE-001",
      scenarioVersion: "1",
      environment: "beta",
      owner: "vitest",
      workspacePath: ".xe-runs/test-ft-0201-beta-lock",
    });

    await acquireXeLock({
      environment: "beta",
      runId: run.runId,
      owner: "vitest",
    });

    vi.stubEnv("APP_ENV", "beta");

    await expect(runSeedScenario({ scenario: "S1_company_min" })).rejects.toThrow(
      `seed.run is blocked while XE run ${run.runId} holds the beta lock.`,
    );

    await releaseXeLock({
      environment: "beta",
      runId: run.runId,
    });
    await deleteXeRun(run.runId);
  });
});

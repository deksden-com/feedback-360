import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { hasDatabaseUrl } from "../connection-string";
import { createDb, createPool } from "../db";
import { applyMigrations } from "../migrations";
import { questionnaires } from "../schema";
import { runSeedScenario } from "../seeds";

const hasUrl = hasDatabaseUrl();

describe("FT-0023 RLS deny-by-default smoke", () => {
  it.runIf(hasUrl)("isolates rows for user context and allows service-role access", async () => {
    await applyMigrations();
    const seeded = await runSeedScenario({ scenario: "S1_multi_tenant_min" });

    const userAOnly = seeded.handles["user.company_a_only"];
    const questionnaireA = seeded.handles["questionnaire.a"];
    const questionnaireB = seeded.handles["questionnaire.b"];

    expect(userAOnly).toBeDefined();
    expect(questionnaireA).toBeDefined();
    expect(questionnaireB).toBeDefined();

    if (!userAOnly || !questionnaireA || !questionnaireB) {
      return;
    }

    const userPool = createPool({
      serviceRole: false,
      userId: userAOnly,
    });

    try {
      const userDb = createDb(userPool);

      const visibleForA = await userDb
        .select({ id: questionnaires.id })
        .from(questionnaires)
        .where(eq(questionnaires.id, questionnaireA))
        .limit(1);

      const hiddenForB = await userDb
        .select({ id: questionnaires.id })
        .from(questionnaires)
        .where(eq(questionnaires.id, questionnaireB))
        .limit(1);

      expect(visibleForA).toHaveLength(1);
      expect(hiddenForB).toHaveLength(0);
    } finally {
      await userPool.end();
    }

    const servicePool = createPool();
    try {
      const serviceDb = createDb(servicePool);
      const serviceVisibleB = await serviceDb
        .select({ id: questionnaires.id })
        .from(questionnaires)
        .where(eq(questionnaires.id, questionnaireB))
        .limit(1);

      expect(serviceVisibleB).toHaveLength(1);
    } finally {
      await servicePool.end();
    }
  });

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});

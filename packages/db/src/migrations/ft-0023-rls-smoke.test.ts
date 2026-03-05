import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { hasDatabaseUrl, isSupabasePoolerDatabaseUrl } from "../connection-string";
import { createDb, createPool } from "../db";
import { applyMigrations } from "../migrations";
import { questionnaires } from "../schema";
import { runSeedScenario } from "../seeds";

const hasUrl = hasDatabaseUrl();
const hasDirectRlsContext = hasUrl && !isSupabasePoolerDatabaseUrl();

describe("FT-0023 RLS deny-by-default smoke", () => {
  it.runIf(hasDirectRlsContext)(
    "isolates rows for user context and allows service-role access",
    async () => {
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

      const userPool = createPool();

      try {
        const userClient = await userPool.connect();
        try {
          await userClient.query(
            "select set_config('app.is_service_role', $1, false), set_config('app.current_user_id', $2, false)",
            ["off", userAOnly],
          );
          const userDb = createDb(userClient);

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
          userClient.release();
        }
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
    },
  );

  it.skipIf(hasDirectRlsContext)(
    "skips integration run when database URL is absent or only pooled Supabase URL is available",
    () => {
      expect(hasDatabaseUrl() === false || isSupabasePoolerDatabaseUrl()).toBe(true);
    },
  );
});

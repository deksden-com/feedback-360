import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { hasDatabaseUrl } from "../connection-string";
import { createDb, createPool } from "../db";
import { runSeedScenario } from "../seeds";

const hasUrl = hasDatabaseUrl();

const loadCounts = async () => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    const result = await db.execute(sql`
      select
        (select count(*) from companies) as companies_count,
        (select count(*) from campaigns) as campaigns_count,
        (select count(*) from questionnaires) as questionnaires_count,
        (select count(*) from campaign_employee_snapshots) as snapshots_count,
        (select count(*) from company_memberships) as memberships_count
    `);

    return {
      companies: Number(result.rows[0]?.companies_count ?? 0),
      campaigns: Number(result.rows[0]?.campaigns_count ?? 0),
      questionnaires: Number(result.rows[0]?.questionnaires_count ?? 0),
      snapshots: Number(result.rows[0]?.snapshots_count ?? 0),
      memberships: Number(result.rows[0]?.memberships_count ?? 0),
    };
  } finally {
    await pool.end();
  }
};

describe("FT-0091 DB integration isolation", () => {
  it.runIf(hasUrl)(
    "replays canonical seeds twice without leftover rows or FK drift",
    async () => {
      const firstS1 = await runSeedScenario({ scenario: "S1_multi_tenant_min" });
      expect(firstS1.handles["company.a"]).toBeDefined();
      expect(firstS1.handles["company.b"]).toBeDefined();
      expect(firstS1.handles["user.shared"]).toBeDefined();

      const firstS9 = await runSeedScenario({ scenario: "S9_campaign_completed_with_ai" });
      expect(firstS9.handles["campaign.main"]).toBeDefined();
      expect(firstS9.handles["questionnaire.subject_manager"]).toBeDefined();
      expect(firstS9.handles["employee.subject_main"]).toBeDefined();

      const firstCounts = await loadCounts();
      expect(firstCounts).toEqual({
        companies: 1,
        campaigns: 1,
        questionnaires: 4,
        snapshots: 2,
        memberships: 7,
      });

      const secondS1 = await runSeedScenario({ scenario: "S1_multi_tenant_min" });
      expect(secondS1.handles["company.a"]).toBe(firstS1.handles["company.a"]);
      expect(secondS1.handles["user.shared"]).toBe(firstS1.handles["user.shared"]);

      const secondS9 = await runSeedScenario({ scenario: "S9_campaign_completed_with_ai" });
      expect(secondS9.handles["campaign.main"]).toBe(firstS9.handles["campaign.main"]);
      expect(secondS9.handles["employee.subject_main"]).toBe(
        firstS9.handles["employee.subject_main"],
      );

      const secondCounts = await loadCounts();
      expect(secondCounts).toEqual(firstCounts);
    },
    90_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});

import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { hasDatabaseUrl } from "../connection-string";
import { createDb, createPool } from "../db";
import { runSeedScenario } from "../seeds";

const hasUrl = hasDatabaseUrl();

describe("FT-0003 seed runner + handles", () => {
  it.runIf(hasUrl)(
    "creates S1 and S2 seed scenarios with expected handles and counts",
    async () => {
      const s1 = await runSeedScenario({ scenario: "S1_company_min" });
      expect(s1.handles["company.main"]).toBeDefined();
      expect(s1.handles["employee.hr_admin"]).toBeDefined();
      expect(s1.handles["user.hr_admin"]).toBeDefined();

      const s2 = await runSeedScenario({ scenario: "S2_org_basic" });
      expect(s2.handles["department.root"]).toBeDefined();
      expect(s2.handles["employee.ceo"]).toBeDefined();
      expect(s2.handles["employee.head_a"]).toBeDefined();

      const pool = createPool();
      try {
        const db = createDb(pool);
        const counts = await db.execute(sql`
        select
          (select count(*) from companies) as companies_count,
          (select count(*) from employees) as employees_count,
          (select count(*) from departments) as departments_count
      `);

        expect(Number(counts.rows[0]?.companies_count)).toBe(1);
        expect(Number(counts.rows[0]?.employees_count)).toBe(7);
        expect(Number(counts.rows[0]?.departments_count)).toBe(3);
      } finally {
        await pool.end();
      }
    },
    30_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});

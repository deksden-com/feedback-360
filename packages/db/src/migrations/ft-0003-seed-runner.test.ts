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

      const poolAfterS2 = createPool();
      try {
        const db = createDb(poolAfterS2);
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
        await poolAfterS2.end();
      }

      const s4 = await runSeedScenario({
        scenario: "S4_campaign_draft",
        variant: "no_participants",
      });
      expect(s4.handles["campaign.main"]).toBeDefined();
      expect(s4.handles["department.a"]).toBeDefined();

      const poolAfterS4 = createPool();
      try {
        const db = createDb(poolAfterS4);
        const counts = await db.execute(sql`
        select
          (select count(*) from campaigns) as campaigns_count,
          (select count(*) from campaign_participants) as participants_count
      `);

        expect(Number(counts.rows[0]?.campaigns_count)).toBe(1);
        expect(Number(counts.rows[0]?.participants_count)).toBe(0);
      } finally {
        await poolAfterS4.end();
      }

      const s1MultiTenant = await runSeedScenario({ scenario: "S1_multi_tenant_min" });
      expect(s1MultiTenant.handles["company.a"]).toBeDefined();
      expect(s1MultiTenant.handles["company.b"]).toBeDefined();
      expect(s1MultiTenant.handles["user.shared"]).toBeDefined();
      expect(s1MultiTenant.handles["user.company_a_only"]).toBeDefined();
      expect(s1MultiTenant.handles["employee.shared@company.a"]).toBeDefined();
      expect(s1MultiTenant.handles["employee.shared@company.b"]).toBeDefined();
      expect(s1MultiTenant.handles["employee.company_a_only@company.a"]).toBeDefined();

      const pool = createPool();
      try {
        const db = createDb(pool);
        const counts = await db.execute(sql`
        select
          (select count(*) from companies) as companies_count,
          (select count(*) from employees) as employees_count,
          (select count(*) from departments) as departments_count
      `);

        expect(Number(counts.rows[0]?.companies_count)).toBe(2);
        expect(Number(counts.rows[0]?.employees_count)).toBe(3);
        expect(Number(counts.rows[0]?.departments_count)).toBe(0);
      } finally {
        await pool.end();
      }

      const s8 = await runSeedScenario({ scenario: "S8_campaign_ended" });
      expect(s8.handles["campaign.main"]).toBeDefined();
      expect(s8.handles["questionnaire.main"]).toBeDefined();

      const poolAfterS8 = createPool();
      try {
        const db = createDb(poolAfterS8);
        const statusRows = await db.execute(sql`
        select status
        from campaigns
        limit 1
      `);

        expect(statusRows.rows[0]?.status).toBe("ended");
      } finally {
        await poolAfterS8.end();
      }

      const s7 = await runSeedScenario({ scenario: "S7_campaign_started_some_submitted" });
      expect(s7.handles["campaign.main"]).toBeDefined();
      expect(s7.handles["questionnaire.main_not_started"]).toBeDefined();
      expect(s7.handles["questionnaire.main_in_progress"]).toBeDefined();
      expect(s7.handles["questionnaire.main_submitted"]).toBeDefined();

      const poolAfterS7 = createPool();
      try {
        const db = createDb(poolAfterS7);
        const statusRows = await db.execute(sql`
          select status, count(*) as count
          from questionnaires
          group by status
          order by status
        `);

        const countsByStatus = Object.fromEntries(
          statusRows.rows.map((row) => [String(row.status), Number(row.count)]),
        );
        expect(countsByStatus.not_started).toBe(1);
        expect(countsByStatus.in_progress).toBe(1);
        expect(countsByStatus.submitted).toBe(1);
      } finally {
        await poolAfterS7.end();
      }

      const s7NaHeavy = await runSeedScenario({
        scenario: "S7_campaign_started_some_submitted",
        variant: "na_heavy_peer",
      });
      expect(s7NaHeavy.handles["employee.subject_main"]).toBeDefined();
      expect(s7NaHeavy.handles["employee.rater_peer_1"]).toBeDefined();
      expect(s7NaHeavy.handles["competency.main"]).toBeDefined();

      const poolAfterS7NaHeavy = createPool();
      try {
        const db = createDb(poolAfterS7NaHeavy);
        const counts = await db.execute(sql`
          select
            (select count(*) from questionnaires where status = 'submitted') as submitted_count,
            (select count(*) from campaign_assignments) as assignments_count,
            (select count(*) from competency_indicators) as indicators_count
        `);

        expect(Number(counts.rows[0]?.submitted_count)).toBe(3);
        expect(Number(counts.rows[0]?.assignments_count)).toBe(3);
        expect(Number(counts.rows[0]?.indicators_count)).toBe(3);
      } finally {
        await poolAfterS7NaHeavy.end();
      }

      const s7Peers2 = await runSeedScenario({
        scenario: "S7_campaign_started_some_submitted",
        variant: "peers2",
      });
      expect(s7Peers2.handles["employee.rater_subordinate_1"]).toBeDefined();
      expect(s7Peers2.handles["competency.secondary"]).toBeDefined();
      expect(s7Peers2.handles["questionnaire.subject_subordinate_1"]).toBeDefined();

      const poolAfterS7Peers2 = createPool();
      try {
        const db = createDb(poolAfterS7Peers2);
        const counts = await db.execute(sql`
          select
            (select count(*) from questionnaires where status = 'submitted') as submitted_count,
            (select count(*) from campaign_assignments) as assignments_count,
            (select count(*) from competency_indicators) as indicators_count,
            (
              select count(*)
              from campaign_assignments
              where rater_role = 'peer'
            ) as peer_assignments_count
        `);

        expect(Number(counts.rows[0]?.submitted_count)).toBe(4);
        expect(Number(counts.rows[0]?.assignments_count)).toBe(4);
        expect(Number(counts.rows[0]?.indicators_count)).toBe(2);
        expect(Number(counts.rows[0]?.peer_assignments_count)).toBe(2);
      } finally {
        await poolAfterS7Peers2.end();
      }

      const s7NoSubordinates = await runSeedScenario({
        scenario: "S7_campaign_started_some_submitted",
        variant: "no_subordinates",
      });
      expect(s7NoSubordinates.handles["employee.rater_peer_3"]).toBeDefined();
      expect(s7NoSubordinates.handles["questionnaire.subject_peer_3"]).toBeDefined();

      const poolAfterS7NoSubordinates = createPool();
      try {
        const db = createDb(poolAfterS7NoSubordinates);
        const counts = await db.execute(sql`
          select
            (select count(*) from questionnaires where status = 'submitted') as submitted_count,
            (select count(*) from campaign_assignments) as assignments_count,
            (
              select count(*)
              from campaign_assignments
              where rater_role = 'subordinate'
            ) as subordinate_assignments_count
        `);

        expect(Number(counts.rows[0]?.submitted_count)).toBe(4);
        expect(Number(counts.rows[0]?.assignments_count)).toBe(4);
        expect(Number(counts.rows[0]?.subordinate_assignments_count)).toBe(0);
      } finally {
        await poolAfterS7NoSubordinates.end();
      }

      const s7LevelsTie = await runSeedScenario({
        scenario: "S7_campaign_started_some_submitted",
        variant: "levels_tie",
      });
      expect(s7LevelsTie.handles["employee.rater_subordinate_2"]).toBeDefined();
      expect(s7LevelsTie.handles["model.version.main"]).toBeDefined();

      const poolAfterS7LevelsTie = createPool();
      try {
        const db = createDb(poolAfterS7LevelsTie);
        const counts = await db.execute(sql`
          select
            (select count(*) from questionnaires where status = 'submitted') as submitted_count,
            (select count(*) from campaign_assignments) as assignments_count,
            (select count(*) from competency_levels) as levels_count,
            (
              select count(*)
              from competency_model_versions
              where kind = 'levels'
            ) as levels_model_count
        `);

        expect(Number(counts.rows[0]?.submitted_count)).toBe(5);
        expect(Number(counts.rows[0]?.assignments_count)).toBe(5);
        expect(Number(counts.rows[0]?.levels_count)).toBe(4);
        expect(Number(counts.rows[0]?.levels_model_count)).toBe(1);
      } finally {
        await poolAfterS7LevelsTie.end();
      }
    },
    120_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});

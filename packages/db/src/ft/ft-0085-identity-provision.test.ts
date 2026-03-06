import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { hasDatabaseUrl } from "../connection-string";
import { createDb, createPool } from "../db";
import { provisionIdentityAccess } from "../identity";
import { listMemberships } from "../memberships";
import { employees } from "../schema";
import { runSeedScenario } from "../seeds";

const hasUrl = hasDatabaseUrl();

describe("FT-0085 identity access provisioning", () => {
  it.runIf(hasUrl)(
    "provisions memberships, links, and updates employee emails",
    async () => {
      await runSeedScenario({
        scenario: "S1_multi_tenant_min",
      });

      const output = await provisionIdentityAccess({
        userId: "18000000-0000-4000-8000-000000000010",
        email: "deksden@deksden.com",
        links: [
          {
            companyId: "10000000-0000-4000-8000-000000000010",
            employeeId: "12000000-0000-4000-8000-000000000010",
            role: "hr_admin",
          },
          {
            companyId: "10000000-0000-4000-8000-000000000011",
            employeeId: "12000000-0000-4000-8000-000000000011",
            role: "hr_admin",
          },
        ],
      });

      expect(output.userId).toBe("18000000-0000-4000-8000-000000000010");
      expect(output.email).toBe("deksden@deksden.com");
      expect(output.links).toHaveLength(2);

      const memberships = await listMemberships({
        userId: "18000000-0000-4000-8000-000000000010",
      });
      expect(memberships.items).toHaveLength(2);
      expect(memberships.items.map((item) => item.role)).toEqual(["hr_admin", "hr_admin"]);

      const pool = createPool();
      try {
        const db = createDb(pool);
        const [employeeA] = await db
          .select({
            email: employees.email,
          })
          .from(employees)
          .where(
            and(
              eq(employees.id, "12000000-0000-4000-8000-000000000010"),
              eq(employees.companyId, "10000000-0000-4000-8000-000000000010"),
            ),
          )
          .limit(1);
        const [employeeB] = await db
          .select({
            email: employees.email,
          })
          .from(employees)
          .where(
            and(
              eq(employees.id, "12000000-0000-4000-8000-000000000011"),
              eq(employees.companyId, "10000000-0000-4000-8000-000000000011"),
            ),
          )
          .limit(1);

        expect(employeeA?.email).toBe("deksden@deksden.com");
        expect(employeeB?.email).toBe("deksden@deksden.com");
      } finally {
        await pool.end();
      }
    },
    45000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});

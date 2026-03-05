import { and, asc, eq, isNull } from "drizzle-orm";

import { createDb, createPool } from "./db";
import { companies, companyMemberships } from "./schema";

export type MembershipListInput = {
  userId: string;
};

export type MembershipListOutput = {
  items: Array<{
    companyId: string;
    companyName: string;
    role: "hr_admin" | "hr_reader" | "manager" | "employee";
  }>;
};

export const listMemberships = async (
  input: MembershipListInput,
): Promise<MembershipListOutput> => {
  const pool = createPool();

  try {
    const db = createDb(pool);
    const rows = await db
      .select({
        companyId: companyMemberships.companyId,
        companyName: companies.name,
        role: companyMemberships.role,
      })
      .from(companyMemberships)
      .innerJoin(companies, eq(companies.id, companyMemberships.companyId))
      .where(
        and(
          eq(companyMemberships.userId, input.userId),
          eq(companies.isActive, true),
          isNull(companies.deletedAt),
        ),
      )
      .orderBy(asc(companies.name), asc(companyMemberships.createdAt));

    return {
      items: rows
        .filter(
          (row): row is typeof row & { role: "hr_admin" | "hr_reader" | "manager" | "employee" } =>
            row.role === "hr_admin" ||
            row.role === "hr_reader" ||
            row.role === "manager" ||
            row.role === "employee",
        )
        .map((row) => ({
          companyId: row.companyId,
          companyName: row.companyName,
          role: row.role,
        })),
    };
  } finally {
    await pool.end();
  }
};

import { createOperationError } from "@feedback-360/api-contract";
import { and, eq, isNull } from "drizzle-orm";

import { createDb, createPool } from "./db";
import { employees } from "./schema";

export type EmployeeUpsertInput = {
  employeeId: string;
  companyId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
};

export type EmployeeUpsertOutput = {
  employeeId: string;
  companyId: string;
  isActive: boolean;
  deletedAt?: string;
  updatedAt: string;
  created: boolean;
};

export type EmployeeListActiveInput = {
  companyId: string;
};

export type EmployeeListActiveOutput = {
  items: Array<{
    employeeId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    isActive: boolean;
  }>;
};

export const upsertEmployee = async (input: EmployeeUpsertInput): Promise<EmployeeUpsertOutput> => {
  const pool = createPool();

  try {
    const db = createDb(pool);

    return await db.transaction(async (tx) => {
      const current = await tx
        .select({
          employeeId: employees.id,
          companyId: employees.companyId,
          email: employees.email,
          firstName: employees.firstName,
          lastName: employees.lastName,
          phone: employees.phone,
          isActive: employees.isActive,
          deletedAt: employees.deletedAt,
        })
        .from(employees)
        .where(and(eq(employees.id, input.employeeId), eq(employees.companyId, input.companyId)))
        .limit(1);

      const now = new Date();
      const found = current[0];

      if (!found) {
        if (!input.email) {
          throw createOperationError(
            "invalid_input",
            "employee.upsert requires email when creating employee.",
          );
        }

        const createdIsActive = input.isActive ?? true;
        const createdDeletedAt = createdIsActive ? null : now;

        await tx.insert(employees).values({
          id: input.employeeId,
          companyId: input.companyId,
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          isActive: createdIsActive,
          deletedAt: createdDeletedAt,
          createdAt: now,
          updatedAt: now,
        });

        return {
          employeeId: input.employeeId,
          companyId: input.companyId,
          isActive: createdIsActive,
          ...(createdDeletedAt ? { deletedAt: createdDeletedAt.toISOString() } : {}),
          updatedAt: now.toISOString(),
          created: true,
        };
      }

      const nextIsActive = input.isActive ?? found.isActive;
      const nextDeletedAt =
        input.isActive === undefined ? found.deletedAt : nextIsActive ? null : now;

      await tx
        .update(employees)
        .set({
          ...(input.email ? { email: input.email } : {}),
          ...(input.firstName ? { firstName: input.firstName } : {}),
          ...(input.lastName ? { lastName: input.lastName } : {}),
          ...(input.phone ? { phone: input.phone } : {}),
          isActive: nextIsActive,
          deletedAt: nextDeletedAt,
          updatedAt: now,
        })
        .where(and(eq(employees.id, input.employeeId), eq(employees.companyId, input.companyId)));

      return {
        employeeId: found.employeeId,
        companyId: found.companyId,
        isActive: nextIsActive,
        ...(nextDeletedAt ? { deletedAt: nextDeletedAt.toISOString() } : {}),
        updatedAt: now.toISOString(),
        created: false,
      };
    });
  } finally {
    await pool.end();
  }
};

export const listActiveEmployees = async (
  input: EmployeeListActiveInput,
): Promise<EmployeeListActiveOutput> => {
  const pool = createPool();

  try {
    const db = createDb(pool);
    const rows = await db
      .select({
        employeeId: employees.id,
        email: employees.email,
        firstName: employees.firstName,
        lastName: employees.lastName,
        isActive: employees.isActive,
      })
      .from(employees)
      .where(
        and(
          eq(employees.companyId, input.companyId),
          eq(employees.isActive, true),
          isNull(employees.deletedAt),
        ),
      )
      .orderBy(employees.createdAt);

    return {
      items: rows.map((row) => ({
        employeeId: row.employeeId,
        email: row.email,
        ...(row.firstName ? { firstName: row.firstName } : {}),
        ...(row.lastName ? { lastName: row.lastName } : {}),
        isActive: row.isActive,
      })),
    };
  } finally {
    await pool.end();
  }
};

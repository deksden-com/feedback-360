import { createOperationError } from "@feedback-360/api-contract";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import { createDb, createPool } from "./db";
import {
  departments,
  employeeDepartmentHistory,
  employeeManagerHistory,
  employees,
} from "./schema";

type OrgDepartmentMoveInput = {
  companyId: string;
  employeeId: string;
  toDepartmentId: string;
};

type OrgDepartmentMoveOutput = {
  employeeId: string;
  previousDepartmentId?: string;
  departmentId: string;
  changed: boolean;
  effectiveAt: string;
};

type OrgManagerSetInput = {
  companyId: string;
  employeeId: string;
  managerEmployeeId: string;
};

type OrgManagerSetOutput = {
  employeeId: string;
  previousManagerEmployeeId?: string;
  managerEmployeeId: string;
  changed: boolean;
  effectiveAt: string;
};

export type DepartmentListInput = {
  companyId: string;
  includeInactive?: boolean;
};

export type DepartmentListOutput = {
  items: Array<{
    departmentId: string;
    name: string;
    parentDepartmentId?: string;
    isActive: boolean;
    deletedAt?: string;
    memberCount: number;
  }>;
};

export type DepartmentUpsertInput = {
  companyId: string;
  departmentId: string;
  name: string;
  parentDepartmentId?: string;
  isActive?: boolean;
};

export type DepartmentUpsertOutput = {
  departmentId: string;
  companyId: string;
  name: string;
  parentDepartmentId?: string;
  isActive: boolean;
  deletedAt?: string;
  updatedAt: string;
  created: boolean;
};

type DbReader = {
  select: ReturnType<typeof createDb>["select"];
};

const ensureEmployeeInCompany = async (
  tx: DbReader,
  companyId: string,
  employeeId: string,
): Promise<void> => {
  const rows = await tx
    .select({
      employeeId: employees.id,
    })
    .from(employees)
    .where(and(eq(employees.id, employeeId), eq(employees.companyId, companyId)))
    .limit(1);

  if (!rows[0]) {
    throw createOperationError("not_found", "Employee not found in active company.", {
      employeeId,
      companyId,
    });
  }
};

const ensureDepartmentInCompany = async (
  tx: DbReader,
  companyId: string,
  departmentId: string,
): Promise<void> => {
  const rows = await tx
    .select({
      departmentId: departments.id,
    })
    .from(departments)
    .where(and(eq(departments.id, departmentId), eq(departments.companyId, companyId)))
    .limit(1);

  if (!rows[0]) {
    throw createOperationError("not_found", "Department not found in active company.", {
      departmentId,
      companyId,
    });
  }
};

const ensureDepartmentIsActive = async (tx: DbReader, departmentId: string): Promise<void> => {
  const rows = await tx
    .select({
      isActive: departments.isActive,
      deletedAt: departments.deletedAt,
    })
    .from(departments)
    .where(eq(departments.id, departmentId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    throw createOperationError("not_found", "Department not found.");
  }

  if (!row.isActive || row.deletedAt) {
    throw createOperationError(
      "invalid_transition",
      "Cannot move employee to inactive department.",
    );
  }
};

const assertNoDepartmentCycle = (
  allDepartments: Array<{ departmentId: string; parentDepartmentId?: string | null }>,
  departmentId: string,
  parentDepartmentId?: string,
): void => {
  if (!parentDepartmentId) {
    return;
  }

  if (parentDepartmentId === departmentId) {
    throw createOperationError("invalid_input", "Department cannot be its own parent department.");
  }

  const parentById = new Map(
    allDepartments.map((row) => [row.departmentId, row.parentDepartmentId ?? undefined]),
  );

  let cursor: string | undefined = parentDepartmentId;
  const seen = new Set<string>();
  while (cursor) {
    if (cursor === departmentId) {
      throw createOperationError("invalid_input", "Department hierarchy would create a cycle.");
    }

    if (seen.has(cursor)) {
      break;
    }
    seen.add(cursor);
    cursor = parentById.get(cursor);
  }
};

export const moveEmployeeDepartment = async (
  input: OrgDepartmentMoveInput,
): Promise<OrgDepartmentMoveOutput> => {
  const pool = createPool();

  try {
    const db = createDb(pool);

    return await db.transaction(async (tx) => {
      await ensureEmployeeInCompany(tx, input.companyId, input.employeeId);
      await ensureDepartmentInCompany(tx, input.companyId, input.toDepartmentId);
      await ensureDepartmentIsActive(tx, input.toDepartmentId);

      const activeRows = await tx
        .select({
          historyId: employeeDepartmentHistory.id,
          departmentId: employeeDepartmentHistory.departmentId,
        })
        .from(employeeDepartmentHistory)
        .where(
          and(
            eq(employeeDepartmentHistory.employeeId, input.employeeId),
            isNull(employeeDepartmentHistory.endAt),
          ),
        )
        .orderBy(employeeDepartmentHistory.startAt);

      const activeRow = activeRows.at(-1);
      const now = new Date();

      if (activeRow?.departmentId === input.toDepartmentId) {
        return {
          employeeId: input.employeeId,
          previousDepartmentId: activeRow.departmentId,
          departmentId: input.toDepartmentId,
          changed: false,
          effectiveAt: now.toISOString(),
        };
      }

      if (activeRow) {
        await tx
          .update(employeeDepartmentHistory)
          .set({
            endAt: now,
          })
          .where(eq(employeeDepartmentHistory.id, activeRow.historyId));
      }

      await tx.insert(employeeDepartmentHistory).values({
        employeeId: input.employeeId,
        departmentId: input.toDepartmentId,
        startAt: now,
        endAt: null,
        createdAt: now,
      });

      return {
        employeeId: input.employeeId,
        ...(activeRow ? { previousDepartmentId: activeRow.departmentId } : {}),
        departmentId: input.toDepartmentId,
        changed: true,
        effectiveAt: now.toISOString(),
      };
    });
  } finally {
    await pool.end();
  }
};

export const setEmployeeManager = async (
  input: OrgManagerSetInput,
): Promise<OrgManagerSetOutput> => {
  if (input.employeeId === input.managerEmployeeId) {
    throw createOperationError("invalid_input", "Employee cannot be their own manager.");
  }

  const pool = createPool();

  try {
    const db = createDb(pool);

    return await db.transaction(async (tx) => {
      await ensureEmployeeInCompany(tx, input.companyId, input.employeeId);
      await ensureEmployeeInCompany(tx, input.companyId, input.managerEmployeeId);

      const activeRows = await tx
        .select({
          historyId: employeeManagerHistory.id,
          managerEmployeeId: employeeManagerHistory.managerEmployeeId,
        })
        .from(employeeManagerHistory)
        .where(
          and(
            eq(employeeManagerHistory.employeeId, input.employeeId),
            isNull(employeeManagerHistory.endAt),
          ),
        )
        .orderBy(employeeManagerHistory.startAt);

      const activeRow = activeRows.at(-1);
      const now = new Date();

      if (activeRow?.managerEmployeeId === input.managerEmployeeId) {
        return {
          employeeId: input.employeeId,
          previousManagerEmployeeId: activeRow.managerEmployeeId,
          managerEmployeeId: input.managerEmployeeId,
          changed: false,
          effectiveAt: now.toISOString(),
        };
      }

      if (activeRow) {
        await tx
          .update(employeeManagerHistory)
          .set({
            endAt: now,
          })
          .where(eq(employeeManagerHistory.id, activeRow.historyId));
      }

      await tx.insert(employeeManagerHistory).values({
        employeeId: input.employeeId,
        managerEmployeeId: input.managerEmployeeId,
        startAt: now,
        endAt: null,
        createdAt: now,
      });

      return {
        employeeId: input.employeeId,
        ...(activeRow ? { previousManagerEmployeeId: activeRow.managerEmployeeId } : {}),
        managerEmployeeId: input.managerEmployeeId,
        changed: true,
        effectiveAt: now.toISOString(),
      };
    });
  } finally {
    await pool.end();
  }
};

export const listDepartments = async (
  input: DepartmentListInput,
): Promise<DepartmentListOutput> => {
  const pool = createPool();

  try {
    const db = createDb(pool);
    const departmentRows = await db
      .select({
        departmentId: departments.id,
        name: departments.name,
        parentDepartmentId: departments.parentId,
        isActive: departments.isActive,
        deletedAt: departments.deletedAt,
      })
      .from(departments)
      .where(eq(departments.companyId, input.companyId))
      .orderBy(departments.createdAt);

    const visibleRows = input.includeInactive
      ? departmentRows
      : departmentRows.filter((row) => row.isActive && row.deletedAt === null);

    const departmentIds = visibleRows.map((row) => row.departmentId);
    const memberRows = departmentIds.length
      ? await db
          .select({
            departmentId: employeeDepartmentHistory.departmentId,
          })
          .from(employeeDepartmentHistory)
          .where(
            and(
              inArray(employeeDepartmentHistory.departmentId, departmentIds),
              isNull(employeeDepartmentHistory.endAt),
            ),
          )
      : [];

    const memberCounts = new Map<string, number>();
    for (const row of memberRows) {
      memberCounts.set(row.departmentId, (memberCounts.get(row.departmentId) ?? 0) + 1);
    }

    return {
      items: visibleRows
        .map((row) => ({
          departmentId: row.departmentId,
          name: row.name,
          ...(row.parentDepartmentId ? { parentDepartmentId: row.parentDepartmentId } : {}),
          isActive: row.isActive,
          ...(row.deletedAt ? { deletedAt: row.deletedAt.toISOString() } : {}),
          memberCount: memberCounts.get(row.departmentId) ?? 0,
        }))
        .sort((left, right) => left.name.localeCompare(right.name)),
    };
  } finally {
    await pool.end();
  }
};

export const upsertDepartment = async (
  input: DepartmentUpsertInput,
): Promise<DepartmentUpsertOutput> => {
  const pool = createPool();

  try {
    const db = createDb(pool);

    return await db.transaction(async (tx) => {
      const existingRows = await tx
        .select({
          departmentId: departments.id,
          parentDepartmentId: departments.parentId,
          name: departments.name,
          isActive: departments.isActive,
          deletedAt: departments.deletedAt,
        })
        .from(departments)
        .where(eq(departments.companyId, input.companyId));

      if (input.parentDepartmentId) {
        const parentExists = existingRows.some(
          (row) => row.departmentId === input.parentDepartmentId,
        );
        if (!parentExists) {
          throw createOperationError("not_found", "Parent department not found in company.", {
            parentDepartmentId: input.parentDepartmentId,
            companyId: input.companyId,
          });
        }
      }

      assertNoDepartmentCycle(
        existingRows.map((row) => ({
          departmentId: row.departmentId,
          parentDepartmentId:
            row.departmentId === input.departmentId
              ? (input.parentDepartmentId ?? undefined)
              : (row.parentDepartmentId ?? undefined),
        })),
        input.departmentId,
        input.parentDepartmentId,
      );

      const found = existingRows.find((row) => row.departmentId === input.departmentId);
      const now = new Date();

      if (!found) {
        const createdIsActive = input.isActive ?? true;
        const createdDeletedAt = createdIsActive ? null : now;

        await tx.insert(departments).values({
          id: input.departmentId,
          companyId: input.companyId,
          parentId: input.parentDepartmentId ?? null,
          name: input.name,
          isActive: createdIsActive,
          deletedAt: createdDeletedAt,
          createdAt: now,
          updatedAt: now,
        });

        return {
          departmentId: input.departmentId,
          companyId: input.companyId,
          name: input.name,
          ...(input.parentDepartmentId ? { parentDepartmentId: input.parentDepartmentId } : {}),
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
        .update(departments)
        .set({
          name: input.name,
          parentId: input.parentDepartmentId ?? null,
          isActive: nextIsActive,
          deletedAt: nextDeletedAt,
          updatedAt: now,
        })
        .where(
          and(eq(departments.id, input.departmentId), eq(departments.companyId, input.companyId)),
        );

      return {
        departmentId: input.departmentId,
        companyId: input.companyId,
        name: input.name,
        ...(input.parentDepartmentId ? { parentDepartmentId: input.parentDepartmentId } : {}),
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

export const getDepartmentHistoryForEmployeeDebug = async (
  employeeId: string,
): Promise<Array<{ departmentId: string; startAt: string; endAt?: string }>> => {
  const pool = createPool();

  try {
    const db = createDb(pool);
    const rows = await db
      .select({
        departmentId: employeeDepartmentHistory.departmentId,
        startAt: employeeDepartmentHistory.startAt,
        endAt: employeeDepartmentHistory.endAt,
      })
      .from(employeeDepartmentHistory)
      .where(eq(employeeDepartmentHistory.employeeId, employeeId))
      .orderBy(employeeDepartmentHistory.startAt);

    return rows.map((row) => ({
      departmentId: row.departmentId,
      startAt: row.startAt.toISOString(),
      ...(row.endAt ? { endAt: row.endAt.toISOString() } : {}),
    }));
  } finally {
    await pool.end();
  }
};

export const getManagerHistoryForEmployeeDebug = async (
  employeeId: string,
): Promise<Array<{ managerEmployeeId: string; startAt: string; endAt?: string }>> => {
  const pool = createPool();

  try {
    const db = createDb(pool);
    const rows = await db
      .select({
        managerEmployeeId: employeeManagerHistory.managerEmployeeId,
        startAt: employeeManagerHistory.startAt,
        endAt: employeeManagerHistory.endAt,
      })
      .from(employeeManagerHistory)
      .where(eq(employeeManagerHistory.employeeId, employeeId))
      .orderBy(employeeManagerHistory.startAt);

    return rows.map((row) => ({
      managerEmployeeId: row.managerEmployeeId,
      startAt: row.startAt.toISOString(),
      ...(row.endAt ? { endAt: row.endAt.toISOString() } : {}),
    }));
  } finally {
    await pool.end();
  }
};

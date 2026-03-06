import { type MembershipRole, createOperationError } from "@feedback-360/api-contract";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import { createDb, createPool } from "./db";
import {
  companyMemberships,
  departments,
  employeeDepartmentHistory,
  employeeManagerHistory,
  employeePositions,
  employeeUserLinks,
  employees,
} from "./schema";

export type EmployeeUpsertInput = {
  employeeId: string;
  companyId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  telegramUserId?: string;
  telegramChatId?: string;
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

export type EmployeeDirectoryListInput = {
  companyId: string;
  search?: string;
  departmentId?: string;
  status?: "active" | "inactive" | "deleted" | "all";
};

export type EmployeeDirectoryListOutput = {
  items: Array<{
    employeeId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    telegramUserId?: string;
    telegramChatId?: string;
    isActive: boolean;
    deletedAt?: string;
    departmentId?: string;
    departmentName?: string;
    managerEmployeeId?: string;
    managerName?: string;
    positionTitle?: string;
    positionLevel?: number;
    userId?: string;
    membershipRole?: MembershipRole;
  }>;
};

export type EmployeeProfileGetInput = {
  companyId: string;
  employeeId: string;
};

export type EmployeeProfileGetOutput = {
  employeeId: string;
  companyId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  telegramUserId?: string;
  telegramChatId?: string;
  isActive: boolean;
  deletedAt?: string;
  currentDepartmentId?: string;
  currentDepartmentName?: string;
  currentManagerEmployeeId?: string;
  currentManagerName?: string;
  currentPositionTitle?: string;
  currentPositionLevel?: number;
  userId?: string;
  membershipRole?: MembershipRole;
  departmentHistory: Array<{
    departmentId: string;
    departmentName?: string;
    startAt: string;
    endAt?: string;
  }>;
  managerHistory: Array<{
    managerEmployeeId: string;
    managerName?: string;
    startAt: string;
    endAt?: string;
  }>;
  positionHistory: Array<{
    title: string;
    level?: number;
    startAt: string;
    endAt?: string;
  }>;
};

const normalizeOptionalString = (value?: string | null): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

const buildDisplayName = (
  firstName?: string | null,
  lastName?: string | null,
): string | undefined => {
  const parts = [normalizeOptionalString(firstName), normalizeOptionalString(lastName)].filter(
    (part): part is string => Boolean(part),
  );

  return parts.length > 0 ? parts.join(" ") : undefined;
};

const getEmployeeStatusMatches = (
  employee: { isActive: boolean; deletedAt?: string },
  status: EmployeeDirectoryListInput["status"],
): boolean => {
  if (!status || status === "all") {
    return true;
  }

  if (status === "active") {
    return employee.isActive && !employee.deletedAt;
  }

  if (status === "inactive") {
    return !employee.isActive;
  }

  return Boolean(employee.deletedAt);
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
          telegramUserId: employees.telegramUserId,
          telegramChatId: employees.telegramChatId,
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
          telegramUserId: input.telegramUserId,
          telegramChatId: input.telegramChatId,
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
          ...(input.telegramUserId ? { telegramUserId: input.telegramUserId } : {}),
          ...(input.telegramChatId ? { telegramChatId: input.telegramChatId } : {}),
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

export const listEmployeeDirectory = async (
  input: EmployeeDirectoryListInput,
): Promise<EmployeeDirectoryListOutput> => {
  const pool = createPool();

  try {
    const db = createDb(pool);

    const employeeRows = await db
      .select({
        employeeId: employees.id,
        email: employees.email,
        firstName: employees.firstName,
        lastName: employees.lastName,
        phone: employees.phone,
        telegramUserId: employees.telegramUserId,
        telegramChatId: employees.telegramChatId,
        isActive: employees.isActive,
        deletedAt: employees.deletedAt,
      })
      .from(employees)
      .where(eq(employees.companyId, input.companyId))
      .orderBy(employees.createdAt);

    const employeeIds = employeeRows.map((row) => row.employeeId);
    if (employeeIds.length === 0) {
      return { items: [] };
    }

    const [departmentHistoryRows, departmentRows, managerHistoryRows, positionRows, linkRows] =
      await Promise.all([
        db
          .select({
            employeeId: employeeDepartmentHistory.employeeId,
            departmentId: employeeDepartmentHistory.departmentId,
            startAt: employeeDepartmentHistory.startAt,
          })
          .from(employeeDepartmentHistory)
          .where(
            and(
              inArray(employeeDepartmentHistory.employeeId, employeeIds),
              isNull(employeeDepartmentHistory.endAt),
            ),
          )
          .orderBy(desc(employeeDepartmentHistory.startAt)),
        db
          .select({
            departmentId: departments.id,
            name: departments.name,
          })
          .from(departments)
          .where(eq(departments.companyId, input.companyId)),
        db
          .select({
            employeeId: employeeManagerHistory.employeeId,
            managerEmployeeId: employeeManagerHistory.managerEmployeeId,
            startAt: employeeManagerHistory.startAt,
          })
          .from(employeeManagerHistory)
          .where(
            and(
              inArray(employeeManagerHistory.employeeId, employeeIds),
              isNull(employeeManagerHistory.endAt),
            ),
          )
          .orderBy(desc(employeeManagerHistory.startAt)),
        db
          .select({
            employeeId: employeePositions.employeeId,
            title: employeePositions.title,
            level: employeePositions.level,
            startAt: employeePositions.startAt,
          })
          .from(employeePositions)
          .where(
            and(
              inArray(employeePositions.employeeId, employeeIds),
              isNull(employeePositions.endAt),
            ),
          )
          .orderBy(desc(employeePositions.startAt)),
        db
          .select({
            employeeId: employeeUserLinks.employeeId,
            userId: employeeUserLinks.userId,
          })
          .from(employeeUserLinks)
          .where(eq(employeeUserLinks.companyId, input.companyId)),
      ]);

    const managerIds = [...new Set(managerHistoryRows.map((row) => row.managerEmployeeId))];
    const managerRows = managerIds.length
      ? await db
          .select({
            employeeId: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
          })
          .from(employees)
          .where(inArray(employees.id, managerIds))
      : [];

    const userIds = [...new Set(linkRows.map((row) => row.userId))];
    const membershipRows = userIds.length
      ? await db
          .select({
            userId: companyMemberships.userId,
            role: companyMemberships.role,
          })
          .from(companyMemberships)
          .where(
            and(
              eq(companyMemberships.companyId, input.companyId),
              inArray(companyMemberships.userId, userIds),
            ),
          )
      : [];

    const departmentByEmployeeId = new Map<
      string,
      { departmentId: string; departmentName?: string }
    >();
    const departmentNameById = new Map(departmentRows.map((row) => [row.departmentId, row.name]));
    for (const row of departmentHistoryRows) {
      if (!departmentByEmployeeId.has(row.employeeId)) {
        departmentByEmployeeId.set(row.employeeId, {
          departmentId: row.departmentId,
          departmentName: departmentNameById.get(row.departmentId),
        });
      }
    }

    const managerNameByEmployeeId = new Map(
      managerRows.map((row) => [row.employeeId, buildDisplayName(row.firstName, row.lastName)]),
    );
    const managerByEmployeeId = new Map<
      string,
      { managerEmployeeId: string; managerName?: string }
    >();
    for (const row of managerHistoryRows) {
      if (!managerByEmployeeId.has(row.employeeId)) {
        managerByEmployeeId.set(row.employeeId, {
          managerEmployeeId: row.managerEmployeeId,
          managerName: managerNameByEmployeeId.get(row.managerEmployeeId),
        });
      }
    }

    const positionByEmployeeId = new Map<string, { title: string; level?: number }>();
    for (const row of positionRows) {
      if (!positionByEmployeeId.has(row.employeeId)) {
        positionByEmployeeId.set(row.employeeId, {
          title: row.title,
          ...(typeof row.level === "number" ? { level: row.level } : {}),
        });
      }
    }

    const roleByUserId = new Map(
      membershipRows.map((row) => [row.userId, row.role as MembershipRole]),
    );
    const linkByEmployeeId = new Map(
      linkRows.map((row) => [
        row.employeeId,
        { userId: row.userId, membershipRole: roleByUserId.get(row.userId) },
      ]),
    );

    const searchNeedle = normalizeOptionalString(input.search)?.toLowerCase();
    const items = employeeRows
      .map((row) => {
        const department = departmentByEmployeeId.get(row.employeeId);
        const manager = managerByEmployeeId.get(row.employeeId);
        const position = positionByEmployeeId.get(row.employeeId);
        const link = linkByEmployeeId.get(row.employeeId);

        return {
          employeeId: row.employeeId,
          email: row.email,
          ...(normalizeOptionalString(row.firstName)
            ? { firstName: normalizeOptionalString(row.firstName) }
            : {}),
          ...(normalizeOptionalString(row.lastName)
            ? { lastName: normalizeOptionalString(row.lastName) }
            : {}),
          ...(normalizeOptionalString(row.phone)
            ? { phone: normalizeOptionalString(row.phone) }
            : {}),
          ...(normalizeOptionalString(row.telegramUserId)
            ? { telegramUserId: normalizeOptionalString(row.telegramUserId) }
            : {}),
          ...(normalizeOptionalString(row.telegramChatId)
            ? { telegramChatId: normalizeOptionalString(row.telegramChatId) }
            : {}),
          isActive: row.isActive,
          ...(row.deletedAt ? { deletedAt: row.deletedAt.toISOString() } : {}),
          ...(department?.departmentId ? { departmentId: department.departmentId } : {}),
          ...(department?.departmentName ? { departmentName: department.departmentName } : {}),
          ...(manager?.managerEmployeeId ? { managerEmployeeId: manager.managerEmployeeId } : {}),
          ...(manager?.managerName ? { managerName: manager.managerName } : {}),
          ...(position?.title ? { positionTitle: position.title } : {}),
          ...(typeof position?.level === "number" ? { positionLevel: position.level } : {}),
          ...(link?.userId ? { userId: link.userId } : {}),
          ...(link?.membershipRole ? { membershipRole: link.membershipRole } : {}),
        };
      })
      .filter((item) => getEmployeeStatusMatches(item, input.status))
      .filter((item) => (input.departmentId ? item.departmentId === input.departmentId : true))
      .filter((item) => {
        if (!searchNeedle) {
          return true;
        }

        const haystack = [
          item.email,
          item.firstName,
          item.lastName,
          item.phone,
          item.departmentName,
          item.managerName,
          item.positionTitle,
        ]
          .filter((value): value is string => typeof value === "string")
          .join(" ")
          .toLowerCase();

        return haystack.includes(searchNeedle);
      })
      .sort((left, right) => {
        const leftKey =
          `${left.lastName ?? ""}|${left.firstName ?? ""}|${left.email}`.toLowerCase();
        const rightKey =
          `${right.lastName ?? ""}|${right.firstName ?? ""}|${right.email}`.toLowerCase();
        return leftKey.localeCompare(rightKey);
      });

    return { items };
  } finally {
    await pool.end();
  }
};

export const getEmployeeProfile = async (
  input: EmployeeProfileGetInput,
): Promise<EmployeeProfileGetOutput> => {
  const pool = createPool();

  try {
    const db = createDb(pool);
    const [employeeRow] = await db
      .select({
        employeeId: employees.id,
        companyId: employees.companyId,
        email: employees.email,
        firstName: employees.firstName,
        lastName: employees.lastName,
        phone: employees.phone,
        telegramUserId: employees.telegramUserId,
        telegramChatId: employees.telegramChatId,
        isActive: employees.isActive,
        deletedAt: employees.deletedAt,
      })
      .from(employees)
      .where(and(eq(employees.id, input.employeeId), eq(employees.companyId, input.companyId)))
      .limit(1);

    if (!employeeRow) {
      throw createOperationError("not_found", "Employee not found in company.", {
        employeeId: input.employeeId,
        companyId: input.companyId,
      });
    }

    const [departmentHistoryRows, managerHistoryRows, positionRows, linkRows, departmentRows] =
      await Promise.all([
        db
          .select({
            departmentId: employeeDepartmentHistory.departmentId,
            startAt: employeeDepartmentHistory.startAt,
            endAt: employeeDepartmentHistory.endAt,
          })
          .from(employeeDepartmentHistory)
          .where(eq(employeeDepartmentHistory.employeeId, input.employeeId))
          .orderBy(desc(employeeDepartmentHistory.startAt)),
        db
          .select({
            managerEmployeeId: employeeManagerHistory.managerEmployeeId,
            startAt: employeeManagerHistory.startAt,
            endAt: employeeManagerHistory.endAt,
          })
          .from(employeeManagerHistory)
          .where(eq(employeeManagerHistory.employeeId, input.employeeId))
          .orderBy(desc(employeeManagerHistory.startAt)),
        db
          .select({
            title: employeePositions.title,
            level: employeePositions.level,
            startAt: employeePositions.startAt,
            endAt: employeePositions.endAt,
          })
          .from(employeePositions)
          .where(eq(employeePositions.employeeId, input.employeeId))
          .orderBy(desc(employeePositions.startAt)),
        db
          .select({
            userId: employeeUserLinks.userId,
          })
          .from(employeeUserLinks)
          .where(
            and(
              eq(employeeUserLinks.companyId, input.companyId),
              eq(employeeUserLinks.employeeId, input.employeeId),
            ),
          )
          .limit(1),
        db
          .select({
            departmentId: departments.id,
            name: departments.name,
          })
          .from(departments)
          .where(eq(departments.companyId, input.companyId)),
      ]);

    const departmentNameById = new Map(departmentRows.map((row) => [row.departmentId, row.name]));
    const currentDepartment = departmentHistoryRows.find((row) => row.endAt === null);

    const managerIds = [...new Set(managerHistoryRows.map((row) => row.managerEmployeeId))];
    const managerRows = managerIds.length
      ? await db
          .select({
            employeeId: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
          })
          .from(employees)
          .where(inArray(employees.id, managerIds))
      : [];
    const managerNameById = new Map(
      managerRows.map((row) => [row.employeeId, buildDisplayName(row.firstName, row.lastName)]),
    );
    const currentManager = managerHistoryRows.find((row) => row.endAt === null);
    const currentPosition = positionRows.find((row) => row.endAt === null);

    const userId = linkRows[0]?.userId;
    const [membershipRow] = userId
      ? await db
          .select({
            role: companyMemberships.role,
          })
          .from(companyMemberships)
          .where(
            and(
              eq(companyMemberships.companyId, input.companyId),
              eq(companyMemberships.userId, userId),
            ),
          )
          .limit(1)
      : [];

    return {
      employeeId: employeeRow.employeeId,
      companyId: employeeRow.companyId,
      email: employeeRow.email,
      ...(normalizeOptionalString(employeeRow.firstName)
        ? { firstName: normalizeOptionalString(employeeRow.firstName) }
        : {}),
      ...(normalizeOptionalString(employeeRow.lastName)
        ? { lastName: normalizeOptionalString(employeeRow.lastName) }
        : {}),
      ...(normalizeOptionalString(employeeRow.phone)
        ? { phone: normalizeOptionalString(employeeRow.phone) }
        : {}),
      ...(normalizeOptionalString(employeeRow.telegramUserId)
        ? { telegramUserId: normalizeOptionalString(employeeRow.telegramUserId) }
        : {}),
      ...(normalizeOptionalString(employeeRow.telegramChatId)
        ? { telegramChatId: normalizeOptionalString(employeeRow.telegramChatId) }
        : {}),
      isActive: employeeRow.isActive,
      ...(employeeRow.deletedAt ? { deletedAt: employeeRow.deletedAt.toISOString() } : {}),
      ...(currentDepartment?.departmentId
        ? { currentDepartmentId: currentDepartment.departmentId }
        : {}),
      ...(currentDepartment?.departmentId && departmentNameById.get(currentDepartment.departmentId)
        ? { currentDepartmentName: departmentNameById.get(currentDepartment.departmentId) }
        : {}),
      ...(currentManager?.managerEmployeeId
        ? { currentManagerEmployeeId: currentManager.managerEmployeeId }
        : {}),
      ...(currentManager?.managerEmployeeId && managerNameById.get(currentManager.managerEmployeeId)
        ? { currentManagerName: managerNameById.get(currentManager.managerEmployeeId) }
        : {}),
      ...(currentPosition?.title ? { currentPositionTitle: currentPosition.title } : {}),
      ...(typeof currentPosition?.level === "number"
        ? { currentPositionLevel: currentPosition.level }
        : {}),
      ...(userId ? { userId } : {}),
      ...(typeof membershipRow?.role === "string"
        ? { membershipRole: membershipRow.role as MembershipRole }
        : {}),
      departmentHistory: departmentHistoryRows.map((row) => ({
        departmentId: row.departmentId,
        ...(departmentNameById.get(row.departmentId)
          ? { departmentName: departmentNameById.get(row.departmentId) }
          : {}),
        startAt: row.startAt.toISOString(),
        ...(row.endAt ? { endAt: row.endAt.toISOString() } : {}),
      })),
      managerHistory: managerHistoryRows.map((row) => ({
        managerEmployeeId: row.managerEmployeeId,
        ...(managerNameById.get(row.managerEmployeeId)
          ? { managerName: managerNameById.get(row.managerEmployeeId) }
          : {}),
        startAt: row.startAt.toISOString(),
        ...(row.endAt ? { endAt: row.endAt.toISOString() } : {}),
      })),
      positionHistory: positionRows.map((row) => ({
        title: row.title,
        ...(typeof row.level === "number" ? { level: row.level } : {}),
        startAt: row.startAt.toISOString(),
        ...(row.endAt ? { endAt: row.endAt.toISOString() } : {}),
      })),
    };
  } finally {
    await pool.end();
  }
};

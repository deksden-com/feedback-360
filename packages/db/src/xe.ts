import { randomUUID } from "node:crypto";

import { createOperationError } from "@feedback-360/api-contract";
import { and, asc, eq, isNull, lt, sql } from "drizzle-orm";

import { createDb, createPool } from "./db";
import {
  campaignAssignments,
  campaignParticipants,
  campaigns,
  companies,
  companyMemberships,
  competencies,
  competencyGroups,
  competencyIndicators,
  competencyModelVersions,
  departments,
  employeeDepartmentHistory,
  employeeManagerHistory,
  employeePositions,
  employeeUserLinks,
  employees,
  notificationOutbox,
  questionnaires,
  xeRunLocks,
  xeRuns,
} from "./schema";

type XeEnvironment = "local" | "beta";
type XeRunStatus = "created" | "running" | "passed" | "failed" | "aborted" | "cleaned";
type XeCleanupStatus = "active" | "cleaned";

type XeActorKey =
  | "hr_admin"
  | "manager"
  | "subject"
  | "peer_1"
  | "peer_2"
  | "peer_3"
  | "subordinate_1"
  | "subordinate_2"
  | "subordinate_3";

type XeBindings = {
  company?: { id: string; name: string };
  campaign?: { id: string };
  modelVersion?: { id: string };
  actors?: Record<
    XeActorKey,
    {
      userId: string;
      employeeId: string;
      email: string;
      role: "hr_admin" | "manager" | "employee";
    }
  >;
  departments?: Record<string, string>;
  competencies?: Record<string, { competencyId: string; indicatorIds: string[] }>;
  questionnaires?: Record<string, string>;
  createdEntities?: Array<{ type: string; id: string }>;
};

export type XeRunRecord = {
  runId: string;
  scenarioId: string;
  scenarioVersion: string;
  environment: XeEnvironment;
  status: XeRunStatus;
  workspacePath: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  expiresAt: string;
  cleanupStatus: XeCleanupStatus;
  summary: Record<string, unknown>;
  bindings: XeBindings;
  lastError?: string;
};

export type XeRunListOutput = {
  items: XeRunRecord[];
};

export type XeLockRecord = {
  environment: XeEnvironment;
  runId: string;
  owner: string;
  acquiredAt: string;
  expiresAt: string;
  updatedAt: string;
};

export type CreateXeRunInput = {
  scenarioId: string;
  scenarioVersion: string;
  environment: XeEnvironment;
  workspacePath: string;
  owner: string;
  ttlDays?: number;
};

export type ApplyXeSeedInput = {
  runId: string;
  seedHandle: "XE-001-first-campaign";
};

const DEFAULT_RUN_TTL_DAYS = 30;
const DEFAULT_LOCK_TTL_MS = 2 * 60 * 60 * 1000;
const seededAt = new Date("2026-03-07T09:00:00.000Z");

const asRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
};

const parseBindings = (value: unknown): XeBindings => {
  const record = asRecord(value);
  return record as XeBindings;
};

const mapRunRow = (row: {
  runId: string;
  scenarioId: string;
  scenarioVersion: string;
  environment: string;
  status: string;
  workspacePath: string;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  expiresAt: Date;
  cleanupStatus: string;
  summaryJson: unknown;
  bindingsJson: unknown;
  lastError: string | null;
}): XeRunRecord => ({
  runId: row.runId,
  scenarioId: row.scenarioId,
  scenarioVersion: row.scenarioVersion,
  environment: row.environment as XeEnvironment,
  status: row.status as XeRunStatus,
  workspacePath: row.workspacePath,
  createdAt: row.createdAt.toISOString(),
  ...(row.startedAt ? { startedAt: row.startedAt.toISOString() } : {}),
  ...(row.finishedAt ? { finishedAt: row.finishedAt.toISOString() } : {}),
  expiresAt: row.expiresAt.toISOString(),
  cleanupStatus: row.cleanupStatus as XeCleanupStatus,
  summary: asRecord(row.summaryJson),
  bindings: parseBindings(row.bindingsJson),
  ...(row.lastError ? { lastError: row.lastError } : {}),
});

export const ensureXeAllowedEnvironment = (environment: string): XeEnvironment => {
  if (environment === "local" || environment === "beta") {
    return environment;
  }

  throw createOperationError(
    "forbidden",
    "XE operations are allowed only in local or beta environments.",
  );
};

export const createXeRun = async (input: CreateXeRunInput): Promise<XeRunRecord> => {
  const environment = ensureXeAllowedEnvironment(input.environment);
  const pool = createPool();

  try {
    const db = createDb(pool);
    const now = new Date();
    const ttlDays = input.ttlDays ?? DEFAULT_RUN_TTL_DAYS;
    const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);
    const runId = `RUN-${now.toISOString().slice(0, 19).replace(/[-:T]/g, "")}-${randomUUID().slice(0, 8)}`;

    const insertedRows = await db
      .insert(xeRuns)
      .values({
        runId,
        scenarioId: input.scenarioId,
        scenarioVersion: input.scenarioVersion,
        environment,
        status: "created",
        workspacePath: input.workspacePath,
        createdAt: now,
        expiresAt,
        cleanupStatus: "active",
        summaryJson: {
          owner: input.owner,
        },
        bindingsJson: {},
      })
      .returning({
        runId: xeRuns.runId,
        scenarioId: xeRuns.scenarioId,
        scenarioVersion: xeRuns.scenarioVersion,
        environment: xeRuns.environment,
        status: xeRuns.status,
        workspacePath: xeRuns.workspacePath,
        createdAt: xeRuns.createdAt,
        startedAt: xeRuns.startedAt,
        finishedAt: xeRuns.finishedAt,
        expiresAt: xeRuns.expiresAt,
        cleanupStatus: xeRuns.cleanupStatus,
        summaryJson: xeRuns.summaryJson,
        bindingsJson: xeRuns.bindingsJson,
        lastError: xeRuns.lastError,
      });

    const inserted = insertedRows[0];
    if (!inserted) {
      throw createOperationError("invalid_transition", "Failed to create XE run.");
    }

    return mapRunRow(inserted);
  } finally {
    await pool.end();
  }
};

export const listXeRuns = async (input?: {
  status?: XeRunStatus;
  scenarioId?: string;
}): Promise<XeRunListOutput> => {
  const pool = createPool();

  try {
    const db = createDb(pool);
    const conditions = [] as Array<ReturnType<typeof eq>>;
    if (input?.status) {
      conditions.push(eq(xeRuns.status, input.status));
    }
    if (input?.scenarioId) {
      conditions.push(eq(xeRuns.scenarioId, input.scenarioId));
    }

    const rows = await db
      .select({
        runId: xeRuns.runId,
        scenarioId: xeRuns.scenarioId,
        scenarioVersion: xeRuns.scenarioVersion,
        environment: xeRuns.environment,
        status: xeRuns.status,
        workspacePath: xeRuns.workspacePath,
        createdAt: xeRuns.createdAt,
        startedAt: xeRuns.startedAt,
        finishedAt: xeRuns.finishedAt,
        expiresAt: xeRuns.expiresAt,
        cleanupStatus: xeRuns.cleanupStatus,
        summaryJson: xeRuns.summaryJson,
        bindingsJson: xeRuns.bindingsJson,
        lastError: xeRuns.lastError,
      })
      .from(xeRuns)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(xeRuns.createdAt));

    return {
      items: rows.map(mapRunRow),
    };
  } finally {
    await pool.end();
  }
};

export const getXeRun = async (runId: string): Promise<XeRunRecord> => {
  const pool = createPool();

  try {
    const db = createDb(pool);
    const rows = await db
      .select({
        runId: xeRuns.runId,
        scenarioId: xeRuns.scenarioId,
        scenarioVersion: xeRuns.scenarioVersion,
        environment: xeRuns.environment,
        status: xeRuns.status,
        workspacePath: xeRuns.workspacePath,
        createdAt: xeRuns.createdAt,
        startedAt: xeRuns.startedAt,
        finishedAt: xeRuns.finishedAt,
        expiresAt: xeRuns.expiresAt,
        cleanupStatus: xeRuns.cleanupStatus,
        summaryJson: xeRuns.summaryJson,
        bindingsJson: xeRuns.bindingsJson,
        lastError: xeRuns.lastError,
      })
      .from(xeRuns)
      .where(eq(xeRuns.runId, runId))
      .limit(1);

    const row = rows[0];
    if (!row) {
      throw createOperationError("not_found", "XE run is not found.", { runId });
    }

    return mapRunRow(row);
  } finally {
    await pool.end();
  }
};

export const updateXeRunState = async (input: {
  runId: string;
  status?: XeRunStatus;
  startedAt?: Date;
  finishedAt?: Date;
  lastError?: string;
  workspacePath?: string;
  summary?: Record<string, unknown>;
  bindings?: XeBindings;
}): Promise<XeRunRecord> => {
  const pool = createPool();

  try {
    const db = createDb(pool);
    const updatedRows = await db
      .update(xeRuns)
      .set({
        ...(input.status ? { status: input.status } : {}),
        ...(input.startedAt ? { startedAt: input.startedAt } : {}),
        ...(input.finishedAt ? { finishedAt: input.finishedAt } : {}),
        ...(input.lastError !== undefined ? { lastError: input.lastError } : {}),
        ...(input.workspacePath ? { workspacePath: input.workspacePath } : {}),
        ...(input.summary ? { summaryJson: input.summary } : {}),
        ...(input.bindings ? { bindingsJson: input.bindings } : {}),
      })
      .where(eq(xeRuns.runId, input.runId))
      .returning({
        runId: xeRuns.runId,
        scenarioId: xeRuns.scenarioId,
        scenarioVersion: xeRuns.scenarioVersion,
        environment: xeRuns.environment,
        status: xeRuns.status,
        workspacePath: xeRuns.workspacePath,
        createdAt: xeRuns.createdAt,
        startedAt: xeRuns.startedAt,
        finishedAt: xeRuns.finishedAt,
        expiresAt: xeRuns.expiresAt,
        cleanupStatus: xeRuns.cleanupStatus,
        summaryJson: xeRuns.summaryJson,
        bindingsJson: xeRuns.bindingsJson,
        lastError: xeRuns.lastError,
      });

    const updated = updatedRows[0];
    if (!updated) {
      throw createOperationError("not_found", "XE run is not found.", { runId: input.runId });
    }

    return mapRunRow(updated);
  } finally {
    await pool.end();
  }
};

export const getXeLock = async (environment: XeEnvironment): Promise<XeLockRecord | undefined> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    const rows = await db
      .select({
        environment: xeRunLocks.environment,
        runId: xeRunLocks.runId,
        owner: xeRunLocks.owner,
        acquiredAt: xeRunLocks.acquiredAt,
        expiresAt: xeRunLocks.expiresAt,
        updatedAt: xeRunLocks.updatedAt,
      })
      .from(xeRunLocks)
      .where(eq(xeRunLocks.environment, environment))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return undefined;
    }

    return {
      environment: row.environment as XeEnvironment,
      runId: row.runId,
      owner: row.owner,
      acquiredAt: row.acquiredAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  } finally {
    await pool.end();
  }
};

export const acquireXeLock = async (input: {
  environment: XeEnvironment;
  runId: string;
  owner: string;
  ttlMs?: number;
}): Promise<XeLockRecord> => {
  const environment = ensureXeAllowedEnvironment(input.environment);
  const pool = createPool();

  try {
    const db = createDb(pool);
    return await db.transaction(async (tx) => {
      const now = new Date();
      const ttlMs = input.ttlMs ?? DEFAULT_LOCK_TTL_MS;
      const expiresAt = new Date(now.getTime() + ttlMs);

      const existingRows = await tx
        .select({
          environment: xeRunLocks.environment,
          runId: xeRunLocks.runId,
          owner: xeRunLocks.owner,
          acquiredAt: xeRunLocks.acquiredAt,
          expiresAt: xeRunLocks.expiresAt,
          updatedAt: xeRunLocks.updatedAt,
        })
        .from(xeRunLocks)
        .where(eq(xeRunLocks.environment, environment))
        .limit(1);

      const existing = existingRows[0];
      if (existing && existing.expiresAt > now && existing.runId !== input.runId) {
        throw createOperationError("invalid_transition", "XE lock is already held.", {
          environment,
          runId: existing.runId,
        });
      }

      const upsertedRows = await tx
        .insert(xeRunLocks)
        .values({
          environment,
          runId: input.runId,
          owner: input.owner,
          acquiredAt: now,
          expiresAt,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: xeRunLocks.environment,
          set: {
            runId: input.runId,
            owner: input.owner,
            acquiredAt: now,
            expiresAt,
            updatedAt: now,
          },
        })
        .returning({
          environment: xeRunLocks.environment,
          runId: xeRunLocks.runId,
          owner: xeRunLocks.owner,
          acquiredAt: xeRunLocks.acquiredAt,
          expiresAt: xeRunLocks.expiresAt,
          updatedAt: xeRunLocks.updatedAt,
        });

      const lock = upsertedRows[0];
      if (!lock) {
        throw createOperationError("invalid_transition", "Failed to acquire XE lock.");
      }

      return {
        environment: lock.environment as XeEnvironment,
        runId: lock.runId,
        owner: lock.owner,
        acquiredAt: lock.acquiredAt.toISOString(),
        expiresAt: lock.expiresAt.toISOString(),
        updatedAt: lock.updatedAt.toISOString(),
      };
    });
  } finally {
    await pool.end();
  }
};

export const releaseXeLock = async (input: {
  environment: XeEnvironment;
  runId?: string;
}): Promise<boolean> => {
  const environment = ensureXeAllowedEnvironment(input.environment);
  const pool = createPool();

  try {
    const db = createDb(pool);
    const deletedRows = await db
      .delete(xeRunLocks)
      .where(
        input.runId
          ? and(eq(xeRunLocks.environment, environment), eq(xeRunLocks.runId, input.runId))
          : eq(xeRunLocks.environment, environment),
      )
      .returning({ environment: xeRunLocks.environment });

    return deletedRows.length > 0;
  } finally {
    await pool.end();
  }
};

const createEmployeeWithIdentity = async (
  tx: ReturnType<typeof createDb> | DbTransaction,
  input: {
    companyId: string;
    userId: string;
    employeeId: string;
    membershipId: string;
    employeeUserLinkId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "hr_admin" | "manager" | "employee";
    phone: string;
    departmentId: string;
    title: string;
    level: number;
  },
): Promise<void> => {
  await tx.insert(employees).values({
    id: input.employeeId,
    companyId: input.companyId,
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    isActive: true,
    createdAt: seededAt,
    updatedAt: seededAt,
  });

  await tx.insert(companyMemberships).values({
    id: input.membershipId,
    companyId: input.companyId,
    userId: input.userId,
    role: input.role,
    createdAt: seededAt,
  });

  await tx.insert(employeeUserLinks).values({
    id: input.employeeUserLinkId,
    companyId: input.companyId,
    employeeId: input.employeeId,
    userId: input.userId,
    createdAt: seededAt,
  });

  await tx.insert(employeeDepartmentHistory).values({
    id: randomUUID(),
    employeeId: input.employeeId,
    departmentId: input.departmentId,
    startAt: seededAt,
    createdAt: seededAt,
  });

  await tx.insert(employeePositions).values({
    id: randomUUID(),
    employeeId: input.employeeId,
    title: input.title,
    level: input.level,
    startAt: seededAt,
    createdAt: seededAt,
  });
};

const buildXe001Seed = async (
  tx: ReturnType<typeof createDb> | DbTransaction,
  runId: string,
): Promise<XeBindings> => {
  const suffix = runId
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(-12);
  const companyId = randomUUID();
  const campaignId = randomUUID();
  const modelVersionId = randomUUID();
  const rootDepartmentId = randomUUID();
  const engineeringDepartmentId = randomUUID();
  const companyName = `XE 001 ${suffix}`;
  const startAt = new Date("2026-03-10T09:00:00.000Z");
  const endAt = new Date("2026-03-17T18:00:00.000Z");

  await tx.insert(companies).values({
    id: companyId,
    name: companyName,
    timezone: "Europe/Kaliningrad",
    isActive: true,
    createdAt: seededAt,
    updatedAt: seededAt,
  });

  await tx.insert(departments).values([
    {
      id: rootDepartmentId,
      companyId,
      name: "HQ",
      isActive: true,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
    {
      id: engineeringDepartmentId,
      companyId,
      parentId: rootDepartmentId,
      name: "Engineering",
      isActive: true,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
  ]);

  const actorDefs = [
    {
      key: "hr_admin",
      firstName: "Harriet",
      lastName: "Admin",
      role: "hr_admin",
      title: "HR Admin",
      level: 8,
      departmentId: rootDepartmentId,
    },
    {
      key: "manager",
      firstName: "Marta",
      lastName: "Manager",
      role: "manager",
      title: "Engineering Manager",
      level: 7,
      departmentId: engineeringDepartmentId,
    },
    {
      key: "subject",
      firstName: "Sam",
      lastName: "Subject",
      role: "employee",
      title: "Senior Engineer",
      level: 6,
      departmentId: engineeringDepartmentId,
    },
    {
      key: "peer_1",
      firstName: "Pavel",
      lastName: "PeerOne",
      role: "employee",
      title: "Engineer",
      level: 5,
      departmentId: engineeringDepartmentId,
    },
    {
      key: "peer_2",
      firstName: "Paula",
      lastName: "PeerTwo",
      role: "employee",
      title: "Engineer",
      level: 5,
      departmentId: engineeringDepartmentId,
    },
    {
      key: "peer_3",
      firstName: "Petra",
      lastName: "PeerThree",
      role: "employee",
      title: "Engineer",
      level: 5,
      departmentId: engineeringDepartmentId,
    },
    {
      key: "subordinate_1",
      firstName: "Sid",
      lastName: "SubOne",
      role: "employee",
      title: "Junior Engineer",
      level: 4,
      departmentId: engineeringDepartmentId,
    },
    {
      key: "subordinate_2",
      firstName: "Sara",
      lastName: "SubTwo",
      role: "employee",
      title: "Junior Engineer",
      level: 4,
      departmentId: engineeringDepartmentId,
    },
    {
      key: "subordinate_3",
      firstName: "Sean",
      lastName: "SubThree",
      role: "employee",
      title: "Junior Engineer",
      level: 4,
      departmentId: engineeringDepartmentId,
    },
  ] as const;

  const actors = {} as NonNullable<XeBindings["actors"]>;
  for (const actor of actorDefs) {
    const userId = randomUUID();
    const employeeId = randomUUID();
    actors[actor.key] = {
      userId,
      employeeId,
      email: `${suffix}-${actor.key}@xe.test`,
      role: actor.role,
    };

    await createEmployeeWithIdentity(tx, {
      companyId,
      userId,
      employeeId,
      membershipId: randomUUID(),
      employeeUserLinkId: randomUUID(),
      email: actors[actor.key].email,
      firstName: actor.firstName,
      lastName: actor.lastName,
      role: actor.role,
      phone: `+1000${Math.floor(Math.random() * 900000 + 100000)}`,
      departmentId: actor.departmentId,
      title: actor.title,
      level: actor.level,
    });
  }

  const managerEmployeeId = actors.manager.employeeId;
  const subjectEmployeeId = actors.subject.employeeId;
  for (const actorKey of [
    "subject",
    "peer_1",
    "peer_2",
    "peer_3",
    "subordinate_1",
    "subordinate_2",
    "subordinate_3",
  ] as const) {
    await tx.insert(employeeManagerHistory).values({
      id: randomUUID(),
      employeeId: actors[actorKey].employeeId,
      managerEmployeeId,
      startAt: seededAt,
      createdAt: seededAt,
    });
  }

  for (const subordinateKey of ["subordinate_1", "subordinate_2", "subordinate_3"] as const) {
    await tx
      .update(employeeManagerHistory)
      .set({ endAt: seededAt })
      .where(eq(employeeManagerHistory.employeeId, actors[subordinateKey].employeeId));

    await tx.insert(employeeManagerHistory).values({
      id: randomUUID(),
      employeeId: actors[subordinateKey].employeeId,
      managerEmployeeId: subjectEmployeeId,
      startAt: new Date(seededAt.getTime() + 60_000),
      createdAt: seededAt,
    });
  }

  await tx.insert(competencyModelVersions).values({
    id: modelVersionId,
    companyId,
    name: "XE-001 Indicators Model",
    kind: "indicators",
    version: 1,
    status: "published",
    createdAt: seededAt,
    updatedAt: seededAt,
  });

  const groupCommunicationId = randomUUID();
  const groupExecutionId = randomUUID();
  await tx.insert(competencyGroups).values([
    {
      id: groupCommunicationId,
      companyId,
      modelVersionId,
      name: "Communication",
      weight: 50,
      order: 1,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
    {
      id: groupExecutionId,
      companyId,
      modelVersionId,
      name: "Execution",
      weight: 50,
      order: 2,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
  ]);

  const competencyBlueprints = [
    { key: "clarity", name: "Clarity", groupId: groupCommunicationId, order: 1 },
    { key: "feedback", name: "Feedback", groupId: groupCommunicationId, order: 2 },
    { key: "ownership", name: "Ownership", groupId: groupExecutionId, order: 1 },
    { key: "planning", name: "Planning", groupId: groupExecutionId, order: 2 },
  ] as const;

  const competenciesMap = {} as NonNullable<XeBindings["competencies"]>;
  for (const competency of competencyBlueprints) {
    const competencyId = randomUUID();
    const indicatorIds = [randomUUID(), randomUUID()];
    competenciesMap[competency.key] = {
      competencyId,
      indicatorIds,
    };

    await tx.insert(competencies).values({
      id: competencyId,
      companyId,
      modelVersionId,
      groupId: competency.groupId,
      name: competency.name,
      order: competency.order,
      createdAt: seededAt,
      updatedAt: seededAt,
    });

    await tx.insert(competencyIndicators).values([
      {
        id: indicatorIds[0],
        companyId,
        competencyId,
        text: `${competency.name} indicator 1`,
        order: 1,
        createdAt: seededAt,
        updatedAt: seededAt,
      },
      {
        id: indicatorIds[1],
        companyId,
        competencyId,
        text: `${competency.name} indicator 2`,
        order: 2,
        createdAt: seededAt,
        updatedAt: seededAt,
      },
    ]);
  }

  await tx.insert(campaigns).values({
    id: campaignId,
    companyId,
    modelVersionId,
    name: "XE-001 Campaign",
    status: "draft",
    timezone: "Europe/Kaliningrad",
    startAt,
    endAt,
    managerWeight: 40,
    peersWeight: 30,
    subordinatesWeight: 30,
    selfWeight: 0,
    createdAt: seededAt,
    updatedAt: seededAt,
  });

  const participantKeys = [
    "subject",
    "manager",
    "peer_1",
    "peer_2",
    "peer_3",
    "subordinate_1",
    "subordinate_2",
    "subordinate_3",
  ] as const;
  await tx.insert(campaignParticipants).values(
    participantKeys.map((key) => ({
      id: randomUUID(),
      companyId,
      campaignId,
      employeeId: actors[key].employeeId,
      includeSelf: key === "subject",
      source: "manual",
      createdAt: seededAt,
    })),
  );

  const assignmentDefs = [
    { key: "self_to_subject", rater: "subject", role: "self" },
    { key: "manager_to_subject", rater: "manager", role: "manager" },
    { key: "peer_1_to_subject", rater: "peer_1", role: "peer" },
    { key: "peer_2_to_subject", rater: "peer_2", role: "peer" },
    { key: "peer_3_to_subject", rater: "peer_3", role: "peer" },
    { key: "subordinate_1_to_subject", rater: "subordinate_1", role: "subordinate" },
    { key: "subordinate_2_to_subject", rater: "subordinate_2", role: "subordinate" },
    { key: "subordinate_3_to_subject", rater: "subordinate_3", role: "subordinate" },
  ] as const;
  await tx.insert(campaignAssignments).values(
    assignmentDefs.map((assignment) => ({
      id: randomUUID(),
      companyId,
      campaignId,
      subjectEmployeeId,
      raterEmployeeId: actors[assignment.rater].employeeId,
      raterRole: assignment.role,
      source: "manual",
      createdAt: seededAt,
    })),
  );

  const createdEntities: Array<{ type: string; id: string }> = [
    { type: "company", id: companyId },
    { type: "campaign", id: campaignId },
    { type: "model_version", id: modelVersionId },
  ];

  return {
    company: { id: companyId, name: companyName },
    campaign: { id: campaignId },
    modelVersion: { id: modelVersionId },
    actors,
    departments: {
      root: rootDepartmentId,
      engineering: engineeringDepartmentId,
    },
    competencies: competenciesMap,
    createdEntities,
  };
};

export const applyXeNamedSeed = async (input: ApplyXeSeedInput): Promise<XeBindings> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    return await db.transaction(async (tx) => {
      const runRows = await tx
        .select({
          runId: xeRuns.runId,
          scenarioId: xeRuns.scenarioId,
          bindingsJson: xeRuns.bindingsJson,
          environment: xeRuns.environment,
        })
        .from(xeRuns)
        .where(eq(xeRuns.runId, input.runId))
        .limit(1);

      const run = runRows[0];
      if (!run) {
        throw createOperationError("not_found", "XE run is not found.", { runId: input.runId });
      }

      const existingBindings = parseBindings(run.bindingsJson);
      if (existingBindings.company?.id) {
        return existingBindings;
      }

      let bindings: XeBindings;
      if (input.seedHandle === "XE-001-first-campaign") {
        bindings = await buildXe001Seed(tx, input.runId);
      } else {
        throw createOperationError("invalid_input", "Unsupported XE seed handle.", {
          seedHandle: input.seedHandle,
        });
      }

      await tx
        .update(xeRuns)
        .set({
          bindingsJson: bindings,
          summaryJson: {
            seedHandle: input.seedHandle,
            companyId: bindings.company?.id,
          },
        })
        .where(eq(xeRuns.runId, input.runId));

      return bindings;
    });
  } finally {
    await pool.end();
  }
};

export const listXeNotifications = async (
  runId: string,
): Promise<{
  items: Array<{
    outboxId: string;
    campaignId: string;
    recipientEmployeeId: string;
    channel: string;
    eventType: string;
    templateKey: string;
    status: string;
    idempotencyKey: string;
    toEmail: string;
    attempts: number;
  }>;
}> => {
  const run = await getXeRun(runId);
  const companyId = run.bindings.company?.id;
  const campaignId = run.bindings.campaign?.id;
  if (!companyId || !campaignId) {
    return { items: [] };
  }

  const pool = createPool();
  try {
    const db = createDb(pool);
    const rows = await db
      .select({
        outboxId: notificationOutbox.id,
        campaignId: notificationOutbox.campaignId,
        recipientEmployeeId: notificationOutbox.recipientEmployeeId,
        channel: notificationOutbox.channel,
        eventType: notificationOutbox.eventType,
        templateKey: notificationOutbox.templateKey,
        status: notificationOutbox.status,
        idempotencyKey: notificationOutbox.idempotencyKey,
        toEmail: notificationOutbox.toEmail,
        attempts: notificationOutbox.attempts,
      })
      .from(notificationOutbox)
      .where(
        and(
          eq(notificationOutbox.companyId, companyId),
          eq(notificationOutbox.campaignId, campaignId),
        ),
      )
      .orderBy(asc(notificationOutbox.createdAt));

    return { items: rows };
  } finally {
    await pool.end();
  }
};

export const deleteXeRun = async (runId: string): Promise<{ deleted: boolean }> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    return await db.transaction(async (tx) => {
      const runRows = await tx
        .select({
          runId: xeRuns.runId,
          bindingsJson: xeRuns.bindingsJson,
          environment: xeRuns.environment,
        })
        .from(xeRuns)
        .where(eq(xeRuns.runId, runId))
        .limit(1);

      const run = runRows[0];
      if (!run) {
        return { deleted: false };
      }

      const bindings = parseBindings(run.bindingsJson);
      const companyId = bindings.company?.id;
      if (companyId) {
        await tx.delete(companies).where(eq(companies.id, companyId));
      }

      await tx.delete(xeRunLocks).where(eq(xeRunLocks.runId, runId));
      await tx.delete(xeRuns).where(eq(xeRuns.runId, runId));
      return { deleted: true };
    });
  } finally {
    await pool.end();
  }
};

export const cleanupExpiredXeRuns = async (input?: { before?: Date; since?: Date }): Promise<{
  deletedRunIds: string[];
}> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    const now = new Date();
    const conditions = [lt(xeRuns.expiresAt, input?.before ?? now)];
    if (input?.since) {
      conditions.push(sql`${xeRuns.createdAt} >= ${input.since}` as never);
    }

    const rows = await db
      .select({ runId: xeRuns.runId })
      .from(xeRuns)
      .where(and(...conditions));

    const deletedRunIds: string[] = [];
    for (const row of rows) {
      const deleted = await deleteXeRun(row.runId);
      if (deleted.deleted) {
        deletedRunIds.push(row.runId);
      }
    }

    return { deletedRunIds };
  } finally {
    await pool.end();
  }
};
type DbTransaction = Parameters<Parameters<ReturnType<typeof createDb>["transaction"]>[0]>[0];

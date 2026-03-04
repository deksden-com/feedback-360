import { createOperationError } from "@feedback-360/api-contract";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { createDb, createPool } from "./db";
import {
  campaignAssignments,
  campaignEmployeeSnapshots,
  campaignParticipants,
  campaigns,
  departments,
  employeeDepartmentHistory,
  employeeManagerHistory,
  employees,
} from "./schema";

type AddParticipantsFromDepartmentsInput = {
  companyId: string;
  campaignId: string;
  departmentIds: string[];
  includeSelf?: boolean;
};

type AddParticipantsFromDepartmentsOutput = {
  campaignId: string;
  addedEmployeeIds: string[];
  totalParticipants: number;
};

type MutateCampaignParticipantsInput = {
  companyId: string;
  campaignId: string;
  employeeIds: string[];
};

type MutateCampaignParticipantsOutput = {
  campaignId: string;
  changedEmployeeIds: string[];
  totalParticipants: number;
};

type MatrixGenerateSuggestedInput = {
  companyId: string;
  campaignId: string;
  departmentIds?: string[];
};

type MatrixGeneratedAssignment = {
  subjectEmployeeId: string;
  raterEmployeeId: string;
  raterRole: "manager" | "peer" | "subordinate" | "self";
};

type MatrixGenerateSuggestedOutput = {
  campaignId: string;
  generatedAssignments: MatrixGeneratedAssignment[];
  totalAssignments: number;
};

type MatrixSetInput = {
  companyId: string;
  campaignId: string;
  assignments: MatrixGeneratedAssignment[];
};

export type MatrixSetOutput = {
  campaignId: string;
  totalAssignments: number;
};

type CampaignState = {
  companyId: string;
  campaignId: string;
  status: string;
  lockedAt: Date | null;
};

type DbLike = Pick<ReturnType<typeof createDb>, "select" | "insert" | "delete">;

const getCampaignState = async (
  db: DbLike,
  companyId: string,
  campaignId: string,
): Promise<CampaignState> => {
  const rows = await db
    .select({
      companyId: campaigns.companyId,
      campaignId: campaigns.id,
      status: campaigns.status,
      lockedAt: campaigns.lockedAt,
    })
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.companyId, companyId)))
    .limit(1);

  const campaign = rows[0];
  if (!campaign) {
    throw createOperationError("not_found", "Campaign not found in active company.", {
      campaignId,
      companyId,
    });
  }

  return campaign;
};

const throwIfCampaignLocked = (campaign: CampaignState): void => {
  if (campaign.lockedAt) {
    throw createOperationError("campaign_locked", "Campaign matrix is locked.", {
      campaignId: campaign.campaignId,
      lockedAt: campaign.lockedAt.toISOString(),
    });
  }
};

const ensureCampaignParticipantsMutable = (campaign: CampaignState): void => {
  throwIfCampaignLocked(campaign);

  if (campaign.status !== "draft") {
    throw createOperationError(
      "campaign_started_immutable",
      "Participants can be changed only while campaign is in draft.",
      {
        campaignId: campaign.campaignId,
        status: campaign.status,
      },
    );
  }
};

const getDescendantDepartmentIds = async (
  db: DbLike,
  companyId: string,
  rootDepartmentIds: string[],
): Promise<string[]> => {
  if (rootDepartmentIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      departmentId: departments.id,
      parentId: departments.parentId,
      isActive: departments.isActive,
      deletedAt: departments.deletedAt,
    })
    .from(departments)
    .where(eq(departments.companyId, companyId));

  const childrenByParent = new Map<string, string[]>();
  const allById = new Map<string, { isActive: boolean; deletedAt: Date | null }>();
  for (const row of rows) {
    allById.set(row.departmentId, {
      isActive: row.isActive,
      deletedAt: row.deletedAt,
    });
    if (!row.parentId) {
      continue;
    }
    const existing = childrenByParent.get(row.parentId) ?? [];
    existing.push(row.departmentId);
    childrenByParent.set(row.parentId, existing);
  }

  const queue = [...new Set(rootDepartmentIds)];
  const result = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || result.has(current)) {
      continue;
    }
    const metadata = allById.get(current);
    if (!metadata || !metadata.isActive || metadata.deletedAt) {
      continue;
    }
    result.add(current);

    const children = childrenByParent.get(current) ?? [];
    for (const child of children) {
      if (!result.has(child)) {
        queue.push(child);
      }
    }
  }

  return [...result];
};

const getLiveOrgMap = async (
  db: DbLike,
  companyId: string,
): Promise<Map<string, { departmentId?: string; managerEmployeeId?: string }>> => {
  const activeEmployees = await db
    .select({
      employeeId: employees.id,
    })
    .from(employees)
    .where(
      and(
        eq(employees.companyId, companyId),
        eq(employees.isActive, true),
        isNull(employees.deletedAt),
      ),
    );

  const map = new Map<string, { departmentId?: string; managerEmployeeId?: string }>();
  for (const row of activeEmployees) {
    map.set(row.employeeId, {});
  }

  const departmentRows = await db
    .select({
      employeeId: employeeDepartmentHistory.employeeId,
      departmentId: employeeDepartmentHistory.departmentId,
      startAt: employeeDepartmentHistory.startAt,
    })
    .from(employeeDepartmentHistory)
    .where(isNull(employeeDepartmentHistory.endAt))
    .orderBy(desc(employeeDepartmentHistory.startAt));
  for (const row of departmentRows) {
    const existing = map.get(row.employeeId);
    if (!existing || existing.departmentId) {
      continue;
    }
    existing.departmentId = row.departmentId;
  }

  const managerRows = await db
    .select({
      employeeId: employeeManagerHistory.employeeId,
      managerEmployeeId: employeeManagerHistory.managerEmployeeId,
      startAt: employeeManagerHistory.startAt,
    })
    .from(employeeManagerHistory)
    .where(isNull(employeeManagerHistory.endAt))
    .orderBy(desc(employeeManagerHistory.startAt));
  for (const row of managerRows) {
    const existing = map.get(row.employeeId);
    if (!existing || existing.managerEmployeeId) {
      continue;
    }
    existing.managerEmployeeId = row.managerEmployeeId;
  }

  return map;
};

const getSnapshotOrgMap = async (
  db: DbLike,
  companyId: string,
  campaignId: string,
): Promise<Map<string, { departmentId?: string; managerEmployeeId?: string }>> => {
  const rows = await db
    .select({
      employeeId: campaignEmployeeSnapshots.employeeId,
      departmentId: campaignEmployeeSnapshots.departmentId,
      managerEmployeeId: campaignEmployeeSnapshots.managerEmployeeId,
    })
    .from(campaignEmployeeSnapshots)
    .where(
      and(
        eq(campaignEmployeeSnapshots.companyId, companyId),
        eq(campaignEmployeeSnapshots.campaignId, campaignId),
      ),
    );

  const map = new Map<string, { departmentId?: string; managerEmployeeId?: string }>();
  for (const row of rows) {
    map.set(row.employeeId, {
      ...(row.departmentId ? { departmentId: row.departmentId } : {}),
      ...(row.managerEmployeeId ? { managerEmployeeId: row.managerEmployeeId } : {}),
    });
  }
  return map;
};

export const addCampaignParticipantsFromDepartments = async (
  input: AddParticipantsFromDepartmentsInput,
): Promise<AddParticipantsFromDepartmentsOutput> => {
  if (input.departmentIds.length === 0) {
    throw createOperationError("invalid_input", "departmentIds must not be empty.");
  }

  const pool = createPool();
  try {
    const db = createDb(pool);
    return await db.transaction(async (tx) => {
      const campaign = await getCampaignState(tx, input.companyId, input.campaignId);
      ensureCampaignParticipantsMutable(campaign);

      const expandedDepartmentIds = await getDescendantDepartmentIds(
        tx,
        input.companyId,
        input.departmentIds,
      );
      if (expandedDepartmentIds.length === 0) {
        return {
          campaignId: input.campaignId,
          addedEmployeeIds: [],
          totalParticipants: 0,
        };
      }

      const departmentRows = await tx
        .select({
          employeeId: employeeDepartmentHistory.employeeId,
        })
        .from(employeeDepartmentHistory)
        .where(
          and(
            isNull(employeeDepartmentHistory.endAt),
            inArray(employeeDepartmentHistory.departmentId, expandedDepartmentIds),
          ),
        );

      const candidateEmployeeIds = [...new Set(departmentRows.map((row) => row.employeeId))];
      if (candidateEmployeeIds.length === 0) {
        return {
          campaignId: input.campaignId,
          addedEmployeeIds: [],
          totalParticipants: 0,
        };
      }

      const activeEmployeeRows = await tx
        .select({
          employeeId: employees.id,
        })
        .from(employees)
        .where(
          and(
            eq(employees.companyId, input.companyId),
            eq(employees.isActive, true),
            isNull(employees.deletedAt),
            inArray(employees.id, candidateEmployeeIds),
          ),
        );
      const activeEmployeeSet = new Set(activeEmployeeRows.map((row) => row.employeeId));

      const existingParticipants = await tx
        .select({
          employeeId: campaignParticipants.employeeId,
        })
        .from(campaignParticipants)
        .where(eq(campaignParticipants.campaignId, input.campaignId));
      const existingSet = new Set(existingParticipants.map((row) => row.employeeId));

      const addedEmployeeIds: string[] = [];
      for (const employeeId of candidateEmployeeIds.sort((left, right) =>
        left.localeCompare(right),
      )) {
        if (!activeEmployeeSet.has(employeeId) || existingSet.has(employeeId)) {
          continue;
        }
        await tx.insert(campaignParticipants).values({
          companyId: input.companyId,
          campaignId: input.campaignId,
          employeeId,
          includeSelf: input.includeSelf ?? true,
          source: "auto",
        });
        addedEmployeeIds.push(employeeId);
      }

      const participantsCountRows = await tx
        .select({
          total: sql<number>`count(*)`,
        })
        .from(campaignParticipants)
        .where(eq(campaignParticipants.campaignId, input.campaignId));

      return {
        campaignId: input.campaignId,
        addedEmployeeIds,
        totalParticipants: Number(participantsCountRows[0]?.total ?? 0),
      };
    });
  } finally {
    await pool.end();
  }
};

export const addCampaignParticipants = async (
  input: MutateCampaignParticipantsInput,
): Promise<MutateCampaignParticipantsOutput> => {
  if (input.employeeIds.length === 0) {
    throw createOperationError("invalid_input", "employeeIds must not be empty.");
  }

  const pool = createPool();
  try {
    const db = createDb(pool);
    return await db.transaction(async (tx) => {
      const campaign = await getCampaignState(tx, input.companyId, input.campaignId);
      ensureCampaignParticipantsMutable(campaign);

      const requestedEmployeeIds = [
        ...new Set(input.employeeIds.map((employeeId) => employeeId.trim())),
      ]
        .filter((employeeId) => employeeId.length > 0)
        .sort((left, right) => left.localeCompare(right));
      if (requestedEmployeeIds.length === 0) {
        throw createOperationError(
          "invalid_input",
          "employeeIds must contain non-empty identifiers.",
        );
      }

      const employeeRows = await tx
        .select({
          employeeId: employees.id,
        })
        .from(employees)
        .where(
          and(
            eq(employees.companyId, input.companyId),
            inArray(employees.id, requestedEmployeeIds),
            eq(employees.isActive, true),
            isNull(employees.deletedAt),
          ),
        );

      const allowedEmployeeIds = new Set(employeeRows.map((row) => row.employeeId));
      const missingEmployeeIds = requestedEmployeeIds.filter(
        (employeeId) => !allowedEmployeeIds.has(employeeId),
      );
      if (missingEmployeeIds.length > 0) {
        throw createOperationError(
          "not_found",
          "Some employees are unavailable for participation.",
          {
            campaignId: input.campaignId,
            employeeIds: missingEmployeeIds,
          },
        );
      }

      const insertedRows = await tx
        .insert(campaignParticipants)
        .values(
          requestedEmployeeIds.map((employeeId) => ({
            companyId: input.companyId,
            campaignId: input.campaignId,
            employeeId,
            includeSelf: true,
            source: "manual",
          })),
        )
        .onConflictDoNothing()
        .returning({
          employeeId: campaignParticipants.employeeId,
        });

      const totalRows = await tx
        .select({
          total: sql<number>`count(*)::int`,
        })
        .from(campaignParticipants)
        .where(
          and(
            eq(campaignParticipants.companyId, input.companyId),
            eq(campaignParticipants.campaignId, input.campaignId),
          ),
        );

      return {
        campaignId: input.campaignId,
        changedEmployeeIds: insertedRows
          .map((row) => row.employeeId)
          .sort((left, right) => left.localeCompare(right)),
        totalParticipants: totalRows[0]?.total ?? 0,
      };
    });
  } finally {
    await pool.end();
  }
};

export const removeCampaignParticipants = async (
  input: MutateCampaignParticipantsInput,
): Promise<MutateCampaignParticipantsOutput> => {
  if (input.employeeIds.length === 0) {
    throw createOperationError("invalid_input", "employeeIds must not be empty.");
  }

  const pool = createPool();
  try {
    const db = createDb(pool);
    return await db.transaction(async (tx) => {
      const campaign = await getCampaignState(tx, input.companyId, input.campaignId);
      ensureCampaignParticipantsMutable(campaign);

      const requestedEmployeeIds = [
        ...new Set(input.employeeIds.map((employeeId) => employeeId.trim())),
      ]
        .filter((employeeId) => employeeId.length > 0)
        .sort((left, right) => left.localeCompare(right));
      if (requestedEmployeeIds.length === 0) {
        throw createOperationError(
          "invalid_input",
          "employeeIds must contain non-empty identifiers.",
        );
      }

      const deletedRows = await tx
        .delete(campaignParticipants)
        .where(
          and(
            eq(campaignParticipants.companyId, input.companyId),
            eq(campaignParticipants.campaignId, input.campaignId),
            inArray(campaignParticipants.employeeId, requestedEmployeeIds),
          ),
        )
        .returning({
          employeeId: campaignParticipants.employeeId,
        });

      const totalRows = await tx
        .select({
          total: sql<number>`count(*)::int`,
        })
        .from(campaignParticipants)
        .where(
          and(
            eq(campaignParticipants.companyId, input.companyId),
            eq(campaignParticipants.campaignId, input.campaignId),
          ),
        );

      return {
        campaignId: input.campaignId,
        changedEmployeeIds: deletedRows
          .map((row) => row.employeeId)
          .sort((left, right) => left.localeCompare(right)),
        totalParticipants: totalRows[0]?.total ?? 0,
      };
    });
  } finally {
    await pool.end();
  }
};

const chooseRole = <T extends { role: MatrixGeneratedAssignment["raterRole"]; priority: number }>(
  current: T | undefined,
  next: { role: MatrixGeneratedAssignment["raterRole"]; priority: number },
): { role: MatrixGeneratedAssignment["raterRole"]; priority: number } => {
  if (!current) {
    return next;
  }
  return next.priority > current.priority ? next : current;
};

export const generateSuggestedMatrix = async (
  input: MatrixGenerateSuggestedInput,
): Promise<MatrixGenerateSuggestedOutput> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    return await db.transaction(async (tx) => {
      const campaign = await getCampaignState(tx, input.companyId, input.campaignId);
      throwIfCampaignLocked(campaign);

      if (campaign.status !== "draft" && campaign.status !== "started") {
        throw createOperationError(
          "invalid_transition",
          "Matrix can be generated only for draft or started campaign.",
          {
            campaignId: input.campaignId,
            status: campaign.status,
          },
        );
      }

      const participantRows = await tx
        .select({
          employeeId: campaignParticipants.employeeId,
          includeSelf: campaignParticipants.includeSelf,
        })
        .from(campaignParticipants)
        .where(eq(campaignParticipants.campaignId, input.campaignId));
      const participants = participantRows.sort((left, right) =>
        left.employeeId.localeCompare(right.employeeId),
      );

      if (participants.length === 0) {
        await tx
          .delete(campaignAssignments)
          .where(
            and(
              eq(campaignAssignments.campaignId, input.campaignId),
              eq(campaignAssignments.source, "auto"),
            ),
          );

        return {
          campaignId: input.campaignId,
          generatedAssignments: [],
          totalAssignments: 0,
        };
      }

      const participantSet = new Set(participants.map((participant) => participant.employeeId));
      const orgMap =
        campaign.status === "started"
          ? await getSnapshotOrgMap(tx, input.companyId, input.campaignId)
          : await getLiveOrgMap(tx, input.companyId);

      let subjectIds = participants.map((participant) => participant.employeeId);
      if (input.departmentIds && input.departmentIds.length > 0) {
        const selectedDepartments = await getDescendantDepartmentIds(
          tx,
          input.companyId,
          input.departmentIds,
        );
        if (selectedDepartments.length === 0) {
          subjectIds = [];
        } else {
          const departmentSet = new Set(selectedDepartments);
          subjectIds = subjectIds.filter((employeeId) =>
            departmentSet.has(orgMap.get(employeeId)?.departmentId ?? ""),
          );
        }
      }

      const managerToEmployees = new Map<string, string[]>();
      for (const employeeId of subjectIds) {
        const managerEmployeeId = orgMap.get(employeeId)?.managerEmployeeId;
        if (!managerEmployeeId) {
          continue;
        }
        const list = managerToEmployees.get(managerEmployeeId) ?? [];
        list.push(employeeId);
        managerToEmployees.set(managerEmployeeId, list);
      }

      const assignmentsByPair = new Map<
        string,
        {
          subjectEmployeeId: string;
          raterEmployeeId: string;
          role: MatrixGeneratedAssignment["raterRole"];
          priority: number;
        }
      >();
      const setAssignment = (
        subjectEmployeeId: string,
        raterEmployeeId: string,
        role: MatrixGeneratedAssignment["raterRole"],
      ) => {
        if (subjectEmployeeId === raterEmployeeId && role !== "self") {
          return;
        }
        const key = `${subjectEmployeeId}:${raterEmployeeId}`;
        const priorityByRole: Record<MatrixGeneratedAssignment["raterRole"], number> = {
          manager: 4,
          subordinate: 3,
          peer: 2,
          self: 1,
        };
        const current = assignmentsByPair.get(key);
        const chosen = chooseRole(current, {
          role,
          priority: priorityByRole[role],
        });
        assignmentsByPair.set(key, {
          subjectEmployeeId,
          raterEmployeeId,
          role: chosen.role,
          priority: chosen.priority,
        });
      };

      for (const subjectEmployeeId of subjectIds) {
        const managerEmployeeId = orgMap.get(subjectEmployeeId)?.managerEmployeeId;
        if (managerEmployeeId && participantSet.has(managerEmployeeId)) {
          setAssignment(subjectEmployeeId, managerEmployeeId, "manager");
        }

        if (managerEmployeeId) {
          for (const peerEmployeeId of managerToEmployees.get(managerEmployeeId) ?? []) {
            if (peerEmployeeId === subjectEmployeeId || !participantSet.has(peerEmployeeId)) {
              continue;
            }
            setAssignment(subjectEmployeeId, peerEmployeeId, "peer");
          }
        }

        for (const subordinateEmployeeId of subjectIds) {
          if (orgMap.get(subordinateEmployeeId)?.managerEmployeeId !== subjectEmployeeId) {
            continue;
          }
          setAssignment(subjectEmployeeId, subordinateEmployeeId, "subordinate");
        }

        const includeSelf = participants.find(
          (participant) => participant.employeeId === subjectEmployeeId,
        )?.includeSelf;
        if (includeSelf) {
          setAssignment(subjectEmployeeId, subjectEmployeeId, "self");
        }
      }

      const generatedAssignments: MatrixGeneratedAssignment[] = [...assignmentsByPair.values()]
        .map((value) => ({
          subjectEmployeeId: value.subjectEmployeeId,
          raterEmployeeId: value.raterEmployeeId,
          raterRole: value.role,
        }))
        .sort((left, right) => {
          if (left.subjectEmployeeId !== right.subjectEmployeeId) {
            return left.subjectEmployeeId.localeCompare(right.subjectEmployeeId);
          }
          return left.raterEmployeeId.localeCompare(right.raterEmployeeId);
        });

      await tx
        .delete(campaignAssignments)
        .where(
          and(
            eq(campaignAssignments.campaignId, input.campaignId),
            eq(campaignAssignments.source, "auto"),
          ),
        );

      if (generatedAssignments.length > 0) {
        await tx.insert(campaignAssignments).values(
          generatedAssignments.map((assignment) => ({
            companyId: input.companyId,
            campaignId: input.campaignId,
            subjectEmployeeId: assignment.subjectEmployeeId,
            raterEmployeeId: assignment.raterEmployeeId,
            raterRole: assignment.raterRole,
            source: "auto",
          })),
        );
      }

      return {
        campaignId: input.campaignId,
        generatedAssignments,
        totalAssignments: generatedAssignments.length,
      };
    });
  } finally {
    await pool.end();
  }
};

export const setMatrixAssignments = async (input: MatrixSetInput): Promise<MatrixSetOutput> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    return await db.transaction(async (tx) => {
      const campaign = await getCampaignState(tx, input.companyId, input.campaignId);
      throwIfCampaignLocked(campaign);

      if (campaign.status !== "draft" && campaign.status !== "started") {
        throw createOperationError(
          "invalid_transition",
          "Matrix can be changed only in draft or started campaign.",
          {
            campaignId: input.campaignId,
            status: campaign.status,
          },
        );
      }

      const deduplicated = new Map<string, MatrixGeneratedAssignment>();
      for (const assignment of input.assignments) {
        const subjectEmployeeId = assignment.subjectEmployeeId.trim();
        const raterEmployeeId = assignment.raterEmployeeId.trim();

        if (!subjectEmployeeId || !raterEmployeeId) {
          throw createOperationError(
            "invalid_input",
            "Matrix assignments must contain non-empty subject/rater identifiers.",
          );
        }

        if (subjectEmployeeId === raterEmployeeId && assignment.raterRole !== "self") {
          throw createOperationError(
            "invalid_input",
            "Self assignment is allowed only with raterRole=self.",
            {
              subjectEmployeeId,
              raterEmployeeId,
            },
          );
        }

        const key = `${subjectEmployeeId}:${raterEmployeeId}`;
        deduplicated.set(key, {
          subjectEmployeeId,
          raterEmployeeId,
          raterRole: assignment.raterRole,
        });
      }

      const normalizedAssignments = [...deduplicated.values()].sort((left, right) => {
        if (left.subjectEmployeeId !== right.subjectEmployeeId) {
          return left.subjectEmployeeId.localeCompare(right.subjectEmployeeId);
        }
        return left.raterEmployeeId.localeCompare(right.raterEmployeeId);
      });

      const uniqueEmployeeIds = [
        ...new Set(
          normalizedAssignments.flatMap((assignment) => [
            assignment.subjectEmployeeId,
            assignment.raterEmployeeId,
          ]),
        ),
      ];
      if (uniqueEmployeeIds.length > 0) {
        const employeeRows = await tx
          .select({
            employeeId: employees.id,
          })
          .from(employees)
          .where(
            and(
              eq(employees.companyId, input.companyId),
              inArray(employees.id, uniqueEmployeeIds),
              eq(employees.isActive, true),
              isNull(employees.deletedAt),
            ),
          );
        const existingEmployeeIds = new Set(employeeRows.map((row) => row.employeeId));
        const missingEmployeeIds = uniqueEmployeeIds.filter(
          (employeeId) => !existingEmployeeIds.has(employeeId),
        );
        if (missingEmployeeIds.length > 0) {
          throw createOperationError("not_found", "Some assignment employees are unavailable.", {
            campaignId: input.campaignId,
            employeeIds: missingEmployeeIds,
          });
        }
      }

      await tx
        .delete(campaignAssignments)
        .where(
          and(
            eq(campaignAssignments.companyId, input.companyId),
            eq(campaignAssignments.campaignId, input.campaignId),
          ),
        );

      if (normalizedAssignments.length > 0) {
        await tx.insert(campaignAssignments).values(
          normalizedAssignments.map((assignment) => ({
            companyId: input.companyId,
            campaignId: input.campaignId,
            subjectEmployeeId: assignment.subjectEmployeeId,
            raterEmployeeId: assignment.raterEmployeeId,
            raterRole: assignment.raterRole,
            source: "manual",
          })),
        );
      }

      return {
        campaignId: input.campaignId,
        totalAssignments: normalizedAssignments.length,
      };
    });
  } finally {
    await pool.end();
  }
};

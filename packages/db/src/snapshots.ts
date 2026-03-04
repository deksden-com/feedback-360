import { createOperationError } from "@feedback-360/api-contract";
import { and, desc, eq, isNull, lte, or, sql } from "drizzle-orm";

import { createDb, createPool } from "./db";
import {
  campaignEmployeeSnapshots,
  campaigns,
  employeeDepartmentHistory,
  employeeManagerHistory,
  employeePositions,
  employees,
  questionnaires,
} from "./schema";

type CreateCampaignEmployeeSnapshotsInput = {
  companyId: string;
  campaignId: string;
};

export type CampaignSnapshotItem = {
  snapshotId: string;
  companyId: string;
  campaignId: string;
  employeeId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  departmentId?: string;
  managerEmployeeId?: string;
  positionTitle?: string;
  positionLevel?: number;
  snapshotAt: string;
};

export type CampaignSnapshotListOutput = {
  items: CampaignSnapshotItem[];
};

const createCampaignEmployeeSnapshotsUsingDb = async (
  db: ReturnType<typeof createDb>,
  input: CreateCampaignEmployeeSnapshotsInput,
): Promise<void> => {
  const campaignRows = await db
    .select({
      campaignId: campaigns.id,
      companyId: campaigns.companyId,
      status: campaigns.status,
      startAt: campaigns.startAt,
    })
    .from(campaigns)
    .where(and(eq(campaigns.id, input.campaignId), eq(campaigns.companyId, input.companyId)))
    .limit(1);

  const campaign = campaignRows[0];
  if (!campaign) {
    throw createOperationError("not_found", "Campaign not found in active company.", {
      campaignId: input.campaignId,
      companyId: input.companyId,
    });
  }

  if (campaign.status !== "started") {
    throw createOperationError(
      "invalid_transition",
      "Snapshots can be created only for started campaign.",
      {
        campaignId: input.campaignId,
        status: campaign.status,
      },
    );
  }

  const subjectRows = await db
    .select({
      employeeId: questionnaires.subjectEmployeeId,
    })
    .from(questionnaires)
    .where(eq(questionnaires.campaignId, input.campaignId));
  const raterRows = await db
    .select({
      employeeId: questionnaires.raterEmployeeId,
    })
    .from(questionnaires)
    .where(eq(questionnaires.campaignId, input.campaignId));
  const participantEmployeeIds = [
    ...new Set([...subjectRows, ...raterRows].map((row) => row.employeeId)),
  ]
    .filter((employeeId): employeeId is string => Boolean(employeeId))
    .sort((left, right) => left.localeCompare(right));

  const snapshotAt = campaign.startAt;
  for (const employeeId of participantEmployeeIds) {
    const employeeRows = await db
      .select({
        employeeId: employees.id,
        email: employees.email,
        firstName: employees.firstName,
        lastName: employees.lastName,
        phone: employees.phone,
        telegramUserId: employees.telegramUserId,
        telegramChatId: employees.telegramChatId,
      })
      .from(employees)
      .where(and(eq(employees.id, employeeId), eq(employees.companyId, input.companyId)))
      .limit(1);

    const employee = employeeRows[0];
    if (!employee) {
      continue;
    }

    const departmentRows = await db
      .select({
        departmentId: employeeDepartmentHistory.departmentId,
      })
      .from(employeeDepartmentHistory)
      .where(
        and(
          eq(employeeDepartmentHistory.employeeId, employee.employeeId),
          lte(employeeDepartmentHistory.startAt, snapshotAt),
          or(
            isNull(employeeDepartmentHistory.endAt),
            sql`${employeeDepartmentHistory.endAt} > ${snapshotAt}`,
          ),
        ),
      )
      .orderBy(desc(employeeDepartmentHistory.startAt))
      .limit(1);

    const managerRows = await db
      .select({
        managerEmployeeId: employeeManagerHistory.managerEmployeeId,
      })
      .from(employeeManagerHistory)
      .where(
        and(
          eq(employeeManagerHistory.employeeId, employee.employeeId),
          lte(employeeManagerHistory.startAt, snapshotAt),
          or(
            isNull(employeeManagerHistory.endAt),
            sql`${employeeManagerHistory.endAt} > ${snapshotAt}`,
          ),
        ),
      )
      .orderBy(desc(employeeManagerHistory.startAt))
      .limit(1);

    const positionRows = await db
      .select({
        title: employeePositions.title,
        level: employeePositions.level,
      })
      .from(employeePositions)
      .where(
        and(
          eq(employeePositions.employeeId, employee.employeeId),
          lte(employeePositions.startAt, snapshotAt),
          or(isNull(employeePositions.endAt), sql`${employeePositions.endAt} > ${snapshotAt}`),
        ),
      )
      .orderBy(desc(employeePositions.startAt))
      .limit(1);

    await db
      .insert(campaignEmployeeSnapshots)
      .values({
        companyId: input.companyId,
        campaignId: input.campaignId,
        employeeId: employee.employeeId,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        phone: employee.phone,
        telegramUserId: employee.telegramUserId,
        telegramChatId: employee.telegramChatId,
        departmentId: departmentRows[0]?.departmentId ?? null,
        managerEmployeeId: managerRows[0]?.managerEmployeeId ?? null,
        positionTitle: positionRows[0]?.title ?? null,
        positionLevel: positionRows[0]?.level ?? null,
        snapshotAt,
      })
      .onConflictDoNothing({
        target: [campaignEmployeeSnapshots.campaignId, campaignEmployeeSnapshots.employeeId],
      });
  }
};

export const createCampaignEmployeeSnapshotsForCampaignStart = async (
  input: CreateCampaignEmployeeSnapshotsInput,
): Promise<void> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    await createCampaignEmployeeSnapshotsUsingDb(db, input);
  } finally {
    await pool.end();
  }
};

export const createCampaignEmployeeSnapshotsForCampaignStartInDb =
  createCampaignEmployeeSnapshotsUsingDb;

export const listCampaignEmployeeSnapshots = async (input: {
  companyId: string;
  campaignId: string;
}): Promise<CampaignSnapshotListOutput> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    const rows = await db
      .select({
        snapshotId: campaignEmployeeSnapshots.id,
        companyId: campaignEmployeeSnapshots.companyId,
        campaignId: campaignEmployeeSnapshots.campaignId,
        employeeId: campaignEmployeeSnapshots.employeeId,
        email: campaignEmployeeSnapshots.email,
        firstName: campaignEmployeeSnapshots.firstName,
        lastName: campaignEmployeeSnapshots.lastName,
        departmentId: campaignEmployeeSnapshots.departmentId,
        managerEmployeeId: campaignEmployeeSnapshots.managerEmployeeId,
        positionTitle: campaignEmployeeSnapshots.positionTitle,
        positionLevel: campaignEmployeeSnapshots.positionLevel,
        snapshotAt: campaignEmployeeSnapshots.snapshotAt,
      })
      .from(campaignEmployeeSnapshots)
      .where(
        and(
          eq(campaignEmployeeSnapshots.companyId, input.companyId),
          eq(campaignEmployeeSnapshots.campaignId, input.campaignId),
        ),
      )
      .orderBy(campaignEmployeeSnapshots.employeeId);

    return {
      items: rows.map((row) => ({
        snapshotId: row.snapshotId,
        companyId: row.companyId,
        campaignId: row.campaignId,
        employeeId: row.employeeId,
        email: row.email,
        ...(row.firstName ? { firstName: row.firstName } : {}),
        ...(row.lastName ? { lastName: row.lastName } : {}),
        ...(row.departmentId ? { departmentId: row.departmentId } : {}),
        ...(row.managerEmployeeId ? { managerEmployeeId: row.managerEmployeeId } : {}),
        ...(row.positionTitle ? { positionTitle: row.positionTitle } : {}),
        ...(typeof row.positionLevel === "number" ? { positionLevel: row.positionLevel } : {}),
        snapshotAt: row.snapshotAt.toISOString(),
      })),
    };
  } finally {
    await pool.end();
  }
};

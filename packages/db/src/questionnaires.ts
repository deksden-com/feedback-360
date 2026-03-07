import {
  type CampaignProgressGetOutput,
  type CampaignProgressPendingItem,
  type QuestionnaireDefinition,
  type QuestionnaireStatus,
  createOperationError,
} from "@feedback-360/api-contract";
import { and, asc, eq } from "drizzle-orm";

import { createDb, createPool } from "./db";
import {
  campaignAssignments,
  campaignEmployeeSnapshots,
  campaigns,
  competencies,
  competencyGroups,
  competencyIndicators,
  competencyLevels,
  competencyModelVersions,
  questionnaires,
} from "./schema";

type DbTransaction = Parameters<Parameters<ReturnType<typeof createDb>["transaction"]>[0]>[0];

export const ensureQuestionnairesForCampaignAssignmentsInDb = async (
  tx: DbReader & Pick<DbTransaction, "insert">,
  input: {
    companyId: string;
    campaignId: string;
  },
): Promise<number> => {
  const assignmentRows = await tx
    .select({
      subjectEmployeeId: campaignAssignments.subjectEmployeeId,
      raterEmployeeId: campaignAssignments.raterEmployeeId,
    })
    .from(campaignAssignments)
    .where(
      and(
        eq(campaignAssignments.companyId, input.companyId),
        eq(campaignAssignments.campaignId, input.campaignId),
      ),
    );

  if (assignmentRows.length === 0) {
    return 0;
  }

  const insertedRows = await tx
    .insert(questionnaires)
    .values(
      assignmentRows.map((assignment) => ({
        companyId: input.companyId,
        campaignId: input.campaignId,
        subjectEmployeeId: assignment.subjectEmployeeId,
        raterEmployeeId: assignment.raterEmployeeId,
        status: "not_started",
        draftPayload: {},
      })),
    )
    .onConflictDoNothing({
      target: [
        questionnaires.campaignId,
        questionnaires.subjectEmployeeId,
        questionnaires.raterEmployeeId,
      ],
    })
    .returning({ questionnaireId: questionnaires.id });

  return insertedRows.length;
};

type QuestionnaireDbRow = {
  questionnaireId: string;
  campaignId: string;
  companyId: string;
  subjectEmployeeId: string;
  raterEmployeeId: string;
  status: string;
  firstDraftAt: Date | null;
  submittedAt: Date | null;
  draftPayload: Record<string, unknown>;
  campaignStatus: string;
  campaignLockedAt: Date | null;
  campaignName: string;
  campaignEndAt: Date;
  modelVersionId: string | null;
  modelName: string | null;
  modelKind: string | null;
  subjectFirstName: string | null;
  subjectLastName: string | null;
  subjectEmail: string | null;
  subjectPositionTitle: string | null;
  raterRole: string | null;
};

type QuestionnaireListRow = {
  questionnaireId: string;
  campaignId: string;
  companyId: string;
  subjectEmployeeId: string;
  raterEmployeeId: string;
  status: string;
  campaignName: string;
  campaignStatus: string;
  campaignEndAt: Date;
  subjectFirstName: string | null;
  subjectLastName: string | null;
  subjectEmail: string | null;
  subjectPositionTitle: string | null;
  raterRole: string | null;
  firstDraftAt: Date | null;
  submittedAt: Date | null;
};

type DbReader = {
  select: ReturnType<typeof createDb>["select"];
};

const formatDisplayName = (value: {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  fallbackId: string;
}): string => {
  const parts = [value.firstName?.trim(), value.lastName?.trim()].filter((item): item is string =>
    Boolean(item),
  );

  if (parts.length > 0) {
    return parts.join(" ");
  }

  if (value.email) {
    return value.email;
  }

  return value.fallbackId;
};

const ensureQuestionnaireStatus = (value: string): QuestionnaireStatus => {
  if (value === "not_started" || value === "in_progress" || value === "submitted") {
    return value;
  }

  throw createOperationError("invalid_input", `Unsupported questionnaire status: ${value}`);
};

const ensureQuestionnaireRaterRole = (
  value: string | null,
): "manager" | "peer" | "subordinate" | "self" | undefined => {
  if (!value) {
    return undefined;
  }

  if (value === "manager" || value === "peer" || value === "subordinate" || value === "self") {
    return value;
  }

  return undefined;
};

const mapQuestionnaireListRow = (row: QuestionnaireListRow) => {
  return {
    questionnaireId: row.questionnaireId,
    campaignId: row.campaignId,
    companyId: row.companyId,
    subjectEmployeeId: row.subjectEmployeeId,
    raterEmployeeId: row.raterEmployeeId,
    status: ensureQuestionnaireStatus(row.status),
    campaignName: row.campaignName,
    campaignStatus: row.campaignStatus as
      | "draft"
      | "started"
      | "ended"
      | "processing_ai"
      | "ai_failed"
      | "completed",
    campaignEndAt: row.campaignEndAt.toISOString(),
    subjectDisplayName: formatDisplayName({
      firstName: row.subjectFirstName,
      lastName: row.subjectLastName,
      email: row.subjectEmail,
      fallbackId: row.subjectEmployeeId,
    }),
    ...(row.subjectPositionTitle ? { subjectPositionTitle: row.subjectPositionTitle } : {}),
    ...(ensureQuestionnaireRaterRole(row.raterRole)
      ? { raterRole: ensureQuestionnaireRaterRole(row.raterRole) }
      : {}),
    ...(row.firstDraftAt ? { firstDraftAt: row.firstDraftAt.toISOString() } : {}),
    ...(row.submittedAt ? { submittedAt: row.submittedAt.toISOString() } : {}),
  };
};

const mapQuestionnaireRow = (row: QuestionnaireDbRow) => {
  return {
    questionnaireId: row.questionnaireId,
    campaignId: row.campaignId,
    companyId: row.companyId,
    subjectEmployeeId: row.subjectEmployeeId,
    raterEmployeeId: row.raterEmployeeId,
    status: ensureQuestionnaireStatus(row.status),
    campaignStatus: ensureCampaignStatus(row.campaignStatus),
    campaignName: row.campaignName,
    campaignEndAt: row.campaignEndAt.toISOString(),
    subjectDisplayName: formatDisplayName({
      firstName: row.subjectFirstName,
      lastName: row.subjectLastName,
      email: row.subjectEmail,
      fallbackId: row.subjectEmployeeId,
    }),
    ...(row.subjectPositionTitle ? { subjectPositionTitle: row.subjectPositionTitle } : {}),
    ...(ensureQuestionnaireRaterRole(row.raterRole)
      ? { raterRole: ensureQuestionnaireRaterRole(row.raterRole) }
      : {}),
    ...(row.firstDraftAt ? { firstDraftAt: row.firstDraftAt.toISOString() } : {}),
    ...(row.submittedAt ? { submittedAt: row.submittedAt.toISOString() } : {}),
  };
};

const mapQuestionnaireDebugRow = (row: QuestionnaireDbRow) => {
  return {
    questionnaireId: row.questionnaireId,
    campaignId: row.campaignId,
    companyId: row.companyId,
    subjectEmployeeId: row.subjectEmployeeId,
    raterEmployeeId: row.raterEmployeeId,
    status: ensureQuestionnaireStatus(row.status),
    campaignStatus: ensureCampaignStatus(row.campaignStatus),
    draft: row.draftPayload,
    ...(row.firstDraftAt ? { firstDraftAt: row.firstDraftAt.toISOString() } : {}),
    ...(row.submittedAt ? { submittedAt: row.submittedAt.toISOString() } : {}),
  };
};

const getQuestionnaireRow = async (
  tx: DbReader,
  questionnaireId: string,
  companyId?: string,
  raterEmployeeId?: string,
): Promise<QuestionnaireDbRow> => {
  const whereClauses = [eq(questionnaires.id, questionnaireId)];
  if (companyId) {
    whereClauses.push(eq(questionnaires.companyId, companyId));
  }
  if (raterEmployeeId) {
    whereClauses.push(eq(questionnaires.raterEmployeeId, raterEmployeeId));
  }

  const rows = await tx
    .select({
      questionnaireId: questionnaires.id,
      campaignId: questionnaires.campaignId,
      companyId: questionnaires.companyId,
      subjectEmployeeId: questionnaires.subjectEmployeeId,
      raterEmployeeId: questionnaires.raterEmployeeId,
      status: questionnaires.status,
      firstDraftAt: questionnaires.firstDraftAt,
      submittedAt: questionnaires.submittedAt,
      draftPayload: questionnaires.draftPayload,
      campaignName: campaigns.name,
      campaignEndAt: campaigns.endAt,
      campaignStatus: campaigns.status,
      campaignLockedAt: campaigns.lockedAt,
      modelVersionId: campaigns.modelVersionId,
      modelName: competencyModelVersions.name,
      modelKind: competencyModelVersions.kind,
      subjectFirstName: campaignEmployeeSnapshots.firstName,
      subjectLastName: campaignEmployeeSnapshots.lastName,
      subjectEmail: campaignEmployeeSnapshots.email,
      subjectPositionTitle: campaignEmployeeSnapshots.positionTitle,
      raterRole: campaignAssignments.raterRole,
    })
    .from(questionnaires)
    .innerJoin(campaigns, eq(campaigns.id, questionnaires.campaignId))
    .leftJoin(competencyModelVersions, eq(competencyModelVersions.id, campaigns.modelVersionId))
    .leftJoin(
      campaignEmployeeSnapshots,
      and(
        eq(campaignEmployeeSnapshots.campaignId, questionnaires.campaignId),
        eq(campaignEmployeeSnapshots.employeeId, questionnaires.subjectEmployeeId),
      ),
    )
    .leftJoin(
      campaignAssignments,
      and(
        eq(campaignAssignments.campaignId, questionnaires.campaignId),
        eq(campaignAssignments.subjectEmployeeId, questionnaires.subjectEmployeeId),
        eq(campaignAssignments.raterEmployeeId, questionnaires.raterEmployeeId),
      ),
    )
    .where(and(...whereClauses))
    .limit(1);

  const row = rows[0];
  if (!row) {
    throw createOperationError("not_found", "Questionnaire not found.", {
      questionnaireId,
    });
  }

  const draftPayload =
    typeof row.draftPayload === "object" &&
    row.draftPayload !== null &&
    !Array.isArray(row.draftPayload)
      ? (row.draftPayload as Record<string, unknown>)
      : {};

  return {
    ...row,
    draftPayload,
  };
};

const getQuestionnaireDefinition = async (
  tx: DbReader,
  input: {
    companyId: string;
    modelVersionId: string | null;
  },
): Promise<QuestionnaireDefinition | undefined> => {
  if (!input.modelVersionId) {
    return undefined;
  }

  const modelRows = await tx
    .select({
      modelVersionId: competencyModelVersions.id,
      modelName: competencyModelVersions.name,
      modelKind: competencyModelVersions.kind,
    })
    .from(competencyModelVersions)
    .where(
      and(
        eq(competencyModelVersions.id, input.modelVersionId),
        eq(competencyModelVersions.companyId, input.companyId),
      ),
    )
    .limit(1);

  const model = modelRows[0];
  if (!model) {
    return undefined;
  }

  if (model.modelKind !== "indicators" && model.modelKind !== "levels") {
    throw createOperationError("invalid_input", "Unsupported questionnaire model kind.", {
      modelVersionId: model.modelVersionId,
      modelKind: model.modelKind,
    });
  }

  const competencyRows = await tx
    .select({
      groupId: competencyGroups.id,
      groupName: competencyGroups.name,
      groupWeight: competencyGroups.weight,
      groupOrder: competencyGroups.order,
      competencyId: competencies.id,
      competencyName: competencies.name,
      competencyOrder: competencies.order,
    })
    .from(competencies)
    .innerJoin(competencyGroups, eq(competencyGroups.id, competencies.groupId))
    .where(eq(competencies.modelVersionId, model.modelVersionId))
    .orderBy(asc(competencyGroups.order), asc(competencies.order));

  const groups = new Map<
    string,
    {
      groupId: string;
      name: string;
      weight: number;
      order: number;
      competencies: Array<{
        competencyId: string;
        name: string;
        order: number;
        indicators?: Array<{ indicatorId: string; text: string; order: number }>;
        levels?: Array<{ levelId: string; level: number; text: string }>;
      }>;
    }
  >();

  for (const row of competencyRows) {
    const existingGroup = groups.get(row.groupId) ?? {
      groupId: row.groupId,
      name: row.groupName,
      weight: row.groupWeight,
      order: row.groupOrder,
      competencies: [],
    };

    if (!groups.has(row.groupId)) {
      groups.set(row.groupId, existingGroup);
    }

    existingGroup.competencies.push({
      competencyId: row.competencyId,
      name: row.competencyName,
      order: row.competencyOrder,
    });
  }

  const competencyById = new Map(
    Array.from(groups.values())
      .flatMap((group) => group.competencies)
      .map((competency) => [competency.competencyId, competency]),
  );

  if (model.modelKind === "indicators") {
    const indicatorRows = await tx
      .select({
        competencyId: competencyIndicators.competencyId,
        indicatorId: competencyIndicators.id,
        text: competencyIndicators.text,
        order: competencyIndicators.order,
      })
      .from(competencyIndicators)
      .innerJoin(competencies, eq(competencies.id, competencyIndicators.competencyId))
      .where(eq(competencies.modelVersionId, model.modelVersionId))
      .orderBy(asc(competencyIndicators.competencyId), asc(competencyIndicators.order));

    for (const row of indicatorRows) {
      const competency = competencyById.get(row.competencyId);
      if (!competency) {
        continue;
      }

      const indicators = competency.indicators ?? [];
      indicators.push({
        indicatorId: row.indicatorId,
        text: row.text,
        order: row.order,
      });
      competency.indicators = indicators;
    }
  } else {
    const levelRows = await tx
      .select({
        competencyId: competencyLevels.competencyId,
        levelId: competencyLevels.id,
        level: competencyLevels.level,
        text: competencyLevels.text,
      })
      .from(competencyLevels)
      .innerJoin(competencies, eq(competencies.id, competencyLevels.competencyId))
      .where(eq(competencies.modelVersionId, model.modelVersionId))
      .orderBy(asc(competencyLevels.competencyId), asc(competencyLevels.level));

    for (const row of levelRows) {
      const competency = competencyById.get(row.competencyId);
      if (!competency) {
        continue;
      }

      const levels = competency.levels ?? [];
      levels.push({
        levelId: row.levelId,
        level: row.level,
        text: row.text,
      });
      competency.levels = levels;
    }
  }

  const sortedGroups = Array.from(groups.values()).sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.groupId.localeCompare(right.groupId);
  });

  const totalPrompts = sortedGroups.reduce((sum, group) => {
    return (
      sum +
      group.competencies.reduce((groupSum, competency) => {
        if (model.modelKind === "indicators") {
          return groupSum + (competency.indicators?.length ?? 0);
        }

        return groupSum + 1;
      }, 0)
    );
  }, 0);

  return {
    modelVersionId: model.modelVersionId,
    modelKind: model.modelKind,
    ...(model.modelName ? { modelName: model.modelName } : {}),
    groups: sortedGroups,
    totalPrompts,
  };
};

const ensureWritableCampaign = (campaignStatus: string): void => {
  if (
    campaignStatus === "ended" ||
    campaignStatus === "processing_ai" ||
    campaignStatus === "ai_failed" ||
    campaignStatus === "completed"
  ) {
    throw createOperationError("campaign_ended_readonly", "Campaign is ended and read-only.");
  }

  if (campaignStatus !== "started") {
    throw createOperationError(
      "invalid_transition",
      "Questionnaire updates are allowed only in started campaign.",
    );
  }
};

const ensureCampaignInCompany = async (
  tx: DbReader,
  campaignId: string,
  companyId: string,
): Promise<void> => {
  const rows = await tx
    .select({ campaignId: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.companyId, companyId)))
    .limit(1);

  if (!rows[0]) {
    throw createOperationError("not_found", "Campaign not found in active company.", {
      campaignId,
      companyId,
    });
  }
};

export type ListAssignedQuestionnairesInput = {
  campaignId?: string;
  companyId?: string;
  status?: QuestionnaireStatus;
  raterEmployeeId?: string;
};

export type ListAssignedQuestionnairesOutput = {
  items: Array<{
    questionnaireId: string;
    campaignId: string;
    companyId: string;
    subjectEmployeeId: string;
    raterEmployeeId: string;
    status: QuestionnaireStatus;
    campaignName: string;
    campaignStatus: "draft" | "started" | "ended" | "processing_ai" | "ai_failed" | "completed";
    campaignEndAt: string;
    subjectDisplayName: string;
    subjectPositionTitle?: string;
    raterRole?: "manager" | "peer" | "subordinate" | "self";
    firstDraftAt?: string;
    submittedAt?: string;
  }>;
};

export const listAssignedQuestionnaires = async (
  input: ListAssignedQuestionnairesInput,
): Promise<ListAssignedQuestionnairesOutput> => {
  const pool = createPool();

  try {
    const db = createDb(pool);

    if (input.companyId && input.campaignId) {
      await ensureCampaignInCompany(db, input.campaignId, input.companyId);
    }

    const whereClauses = [];

    if (input.campaignId) {
      whereClauses.push(eq(questionnaires.campaignId, input.campaignId));
    }

    if (input.companyId) {
      whereClauses.push(eq(questionnaires.companyId, input.companyId));
    }

    if (input.raterEmployeeId) {
      whereClauses.push(eq(questionnaires.raterEmployeeId, input.raterEmployeeId));
    }

    if (input.status) {
      whereClauses.push(eq(questionnaires.status, input.status));
    }

    const rows = await db
      .select({
        questionnaireId: questionnaires.id,
        campaignId: questionnaires.campaignId,
        companyId: questionnaires.companyId,
        subjectEmployeeId: questionnaires.subjectEmployeeId,
        raterEmployeeId: questionnaires.raterEmployeeId,
        status: questionnaires.status,
        campaignName: campaigns.name,
        campaignStatus: campaigns.status,
        campaignEndAt: campaigns.endAt,
        subjectFirstName: campaignEmployeeSnapshots.firstName,
        subjectLastName: campaignEmployeeSnapshots.lastName,
        subjectEmail: campaignEmployeeSnapshots.email,
        subjectPositionTitle: campaignEmployeeSnapshots.positionTitle,
        raterRole: campaignAssignments.raterRole,
        firstDraftAt: questionnaires.firstDraftAt,
        submittedAt: questionnaires.submittedAt,
      })
      .from(questionnaires)
      .innerJoin(campaigns, eq(campaigns.id, questionnaires.campaignId))
      .leftJoin(
        campaignEmployeeSnapshots,
        and(
          eq(campaignEmployeeSnapshots.campaignId, questionnaires.campaignId),
          eq(campaignEmployeeSnapshots.employeeId, questionnaires.subjectEmployeeId),
        ),
      )
      .leftJoin(
        campaignAssignments,
        and(
          eq(campaignAssignments.campaignId, questionnaires.campaignId),
          eq(campaignAssignments.subjectEmployeeId, questionnaires.subjectEmployeeId),
          eq(campaignAssignments.raterEmployeeId, questionnaires.raterEmployeeId),
        ),
      )
      .where(whereClauses.length > 0 ? and(...whereClauses) : undefined)
      .orderBy(asc(campaigns.endAt), asc(questionnaires.createdAt));

    return {
      items: rows.map(mapQuestionnaireListRow),
    };
  } finally {
    await pool.end();
  }
};

export type SaveQuestionnaireDraftInput = {
  questionnaireId: string;
  draft: Record<string, unknown>;
  companyId?: string;
  raterEmployeeId?: string;
};

export type SaveQuestionnaireDraftOutput = {
  questionnaireId: string;
  status: "in_progress";
  campaignLockedAt: string;
};

export const saveQuestionnaireDraft = async (
  input: SaveQuestionnaireDraftInput,
): Promise<SaveQuestionnaireDraftOutput> => {
  const pool = createPool();

  try {
    const db = createDb(pool);

    return await db.transaction(async (tx) => {
      const row = await getQuestionnaireRow(tx, input.questionnaireId, input.companyId);
      if (input.raterEmployeeId && row.raterEmployeeId !== input.raterEmployeeId) {
        throw createOperationError("forbidden", "Questionnaire is not assigned to current rater.");
      }
      ensureWritableCampaign(row.campaignStatus);

      if (row.status === "submitted") {
        throw createOperationError(
          "invalid_transition",
          "Submitted questionnaire is immutable and cannot be saved as draft.",
        );
      }

      const now = new Date();
      await tx
        .update(questionnaires)
        .set({
          status: "in_progress",
          draftPayload: input.draft,
          ...(row.firstDraftAt ? {} : { firstDraftAt: now }),
          updatedAt: now,
        })
        .where(eq(questionnaires.id, row.questionnaireId));

      if (!row.campaignLockedAt) {
        await tx
          .update(campaigns)
          .set({
            lockedAt: now,
            updatedAt: now,
          })
          .where(eq(campaigns.id, row.campaignId));
      }

      const refreshedCampaign = await tx
        .select({
          lockedAt: campaigns.lockedAt,
        })
        .from(campaigns)
        .where(eq(campaigns.id, row.campaignId))
        .limit(1);

      const lockedAt = refreshedCampaign[0]?.lockedAt;
      if (!lockedAt) {
        throw createOperationError("invalid_transition", "Campaign lock timestamp was not set.");
      }

      return {
        questionnaireId: row.questionnaireId,
        status: "in_progress",
        campaignLockedAt: lockedAt.toISOString(),
      };
    });
  } finally {
    await pool.end();
  }
};

export type SubmitQuestionnaireInput = {
  questionnaireId: string;
  companyId?: string;
  raterEmployeeId?: string;
};

export type SubmitQuestionnaireOutput = {
  questionnaireId: string;
  status: "submitted";
  submittedAt: string;
  wasAlreadySubmitted: boolean;
};

export const submitQuestionnaire = async (
  input: SubmitQuestionnaireInput,
): Promise<SubmitQuestionnaireOutput> => {
  const pool = createPool();

  try {
    const db = createDb(pool);

    return await db.transaction(async (tx) => {
      const row = await getQuestionnaireRow(tx, input.questionnaireId, input.companyId);
      if (input.raterEmployeeId && row.raterEmployeeId !== input.raterEmployeeId) {
        throw createOperationError("forbidden", "Questionnaire is not assigned to current rater.");
      }
      ensureWritableCampaign(row.campaignStatus);

      if (row.status === "submitted" && row.submittedAt) {
        return {
          questionnaireId: row.questionnaireId,
          status: "submitted",
          submittedAt: row.submittedAt.toISOString(),
          wasAlreadySubmitted: true,
        };
      }

      const now = new Date();
      await tx
        .update(questionnaires)
        .set({
          status: "submitted",
          submittedAt: now,
          updatedAt: now,
        })
        .where(eq(questionnaires.id, row.questionnaireId));

      return {
        questionnaireId: row.questionnaireId,
        status: "submitted",
        submittedAt: now.toISOString(),
        wasAlreadySubmitted: false,
      };
    });
  } finally {
    await pool.end();
  }
};

export type GetCampaignProgressInput = {
  campaignId: string;
  companyId: string;
};

const sortPendingGroups = (groups: Map<string, number>) => {
  return Array.from(groups.entries())
    .map(([employeeId, pendingCount]) => ({
      employeeId,
      pendingCount,
    }))
    .sort((left, right) => {
      if (right.pendingCount !== left.pendingCount) {
        return right.pendingCount - left.pendingCount;
      }

      return left.employeeId.localeCompare(right.employeeId);
    });
};

export const getCampaignProgress = async (
  input: GetCampaignProgressInput,
): Promise<CampaignProgressGetOutput> => {
  const pool = createPool();

  try {
    const db = createDb(pool);

    const campaignRows = await db
      .select({
        campaignId: campaigns.id,
        companyId: campaigns.companyId,
        lockedAt: campaigns.lockedAt,
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

    const rows = await db
      .select({
        questionnaireId: questionnaires.id,
        campaignId: questionnaires.campaignId,
        companyId: questionnaires.companyId,
        subjectEmployeeId: questionnaires.subjectEmployeeId,
        raterEmployeeId: questionnaires.raterEmployeeId,
        status: questionnaires.status,
        firstDraftAt: questionnaires.firstDraftAt,
        submittedAt: questionnaires.submittedAt,
      })
      .from(questionnaires)
      .where(
        and(
          eq(questionnaires.campaignId, campaign.campaignId),
          eq(questionnaires.companyId, campaign.companyId),
        ),
      )
      .orderBy(questionnaires.createdAt);

    const statusCounts = {
      notStarted: 0,
      inProgress: 0,
      submitted: 0,
    };
    const pendingQuestionnaires: CampaignProgressPendingItem[] = [];
    const pendingByRater = new Map<string, number>();
    const pendingBySubject = new Map<string, number>();

    for (const row of rows) {
      const status = ensureQuestionnaireStatus(row.status);

      if (status === "not_started") {
        statusCounts.notStarted += 1;
      } else if (status === "in_progress") {
        statusCounts.inProgress += 1;
      } else {
        statusCounts.submitted += 1;
      }

      if (status === "submitted") {
        continue;
      }

      pendingQuestionnaires.push({
        questionnaireId: row.questionnaireId,
        campaignId: row.campaignId,
        companyId: row.companyId,
        subjectEmployeeId: row.subjectEmployeeId,
        raterEmployeeId: row.raterEmployeeId,
        status,
        ...(row.firstDraftAt ? { firstDraftAt: row.firstDraftAt.toISOString() } : {}),
        ...(row.submittedAt ? { submittedAt: row.submittedAt.toISOString() } : {}),
      });

      pendingByRater.set(row.raterEmployeeId, (pendingByRater.get(row.raterEmployeeId) ?? 0) + 1);
      pendingBySubject.set(
        row.subjectEmployeeId,
        (pendingBySubject.get(row.subjectEmployeeId) ?? 0) + 1,
      );
    }

    return {
      campaignId: campaign.campaignId,
      companyId: campaign.companyId,
      totalQuestionnaires: rows.length,
      statusCounts,
      ...(campaign.lockedAt ? { campaignLockedAt: campaign.lockedAt.toISOString() } : {}),
      pendingQuestionnaires,
      pendingByRater: sortPendingGroups(pendingByRater),
      pendingBySubject: sortPendingGroups(pendingBySubject),
    };
  } finally {
    await pool.end();
  }
};

export const getQuestionnaireForDebug = async (
  questionnaireId: string,
): Promise<ReturnType<typeof mapQuestionnaireDebugRow>> => {
  const pool = createPool();

  try {
    const db = createDb(pool);
    const row = await getQuestionnaireRow(db, questionnaireId);
    return mapQuestionnaireDebugRow(row);
  } finally {
    await pool.end();
  }
};

export type GetQuestionnaireDraftInput = {
  questionnaireId: string;
  companyId?: string;
  raterEmployeeId?: string;
};

export type GetQuestionnaireDraftOutput = {
  questionnaireId: string;
  campaignId: string;
  companyId: string;
  subjectEmployeeId: string;
  raterEmployeeId: string;
  status: QuestionnaireStatus;
  campaignStatus: "draft" | "started" | "ended" | "processing_ai" | "ai_failed" | "completed";
  draft: Record<string, unknown>;
  campaignName: string;
  campaignEndAt: string;
  subjectDisplayName: string;
  subjectPositionTitle?: string;
  raterRole?: "manager" | "peer" | "subordinate" | "self";
  definition?: QuestionnaireDefinition;
  firstDraftAt?: string;
  submittedAt?: string;
};

const ensureCampaignStatus = (
  value: string,
): "draft" | "started" | "ended" | "processing_ai" | "ai_failed" | "completed" => {
  if (
    value === "draft" ||
    value === "started" ||
    value === "ended" ||
    value === "processing_ai" ||
    value === "ai_failed" ||
    value === "completed"
  ) {
    return value;
  }

  throw createOperationError("invalid_input", `Unsupported campaign status: ${value}`);
};

export const getQuestionnaireDraft = async (
  input: GetQuestionnaireDraftInput,
): Promise<GetQuestionnaireDraftOutput> => {
  const pool = createPool();

  try {
    const db = createDb(pool);
    const row = await getQuestionnaireRow(
      db,
      input.questionnaireId,
      input.companyId,
      input.raterEmployeeId,
    );
    const definition = await getQuestionnaireDefinition(db, {
      companyId: row.companyId,
      modelVersionId: row.modelVersionId,
    });

    return {
      ...mapQuestionnaireRow(row),
      draft: row.draftPayload,
      ...(definition ? { definition } : {}),
    };
  } finally {
    await pool.end();
  }
};

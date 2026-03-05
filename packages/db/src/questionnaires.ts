import {
  type CampaignProgressGetOutput,
  type CampaignProgressPendingItem,
  type QuestionnaireStatus,
  createOperationError,
} from "@feedback-360/api-contract";
import { and, eq } from "drizzle-orm";

import { createDb, createPool } from "./db";
import { campaigns, questionnaires } from "./schema";

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
};

type DbReader = {
  select: ReturnType<typeof createDb>["select"];
};

const ensureQuestionnaireStatus = (value: string): QuestionnaireStatus => {
  if (value === "not_started" || value === "in_progress" || value === "submitted") {
    return value;
  }

  throw createOperationError("invalid_input", `Unsupported questionnaire status: ${value}`);
};

const mapQuestionnaireRow = (row: QuestionnaireDbRow) => {
  return {
    questionnaireId: row.questionnaireId,
    campaignId: row.campaignId,
    companyId: row.companyId,
    subjectEmployeeId: row.subjectEmployeeId,
    raterEmployeeId: row.raterEmployeeId,
    status: ensureQuestionnaireStatus(row.status),
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
      campaignStatus: campaigns.status,
      campaignLockedAt: campaigns.lockedAt,
    })
    .from(questionnaires)
    .innerJoin(campaigns, eq(campaigns.id, questionnaires.campaignId))
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
        submittedAt: questionnaires.submittedAt,
      })
      .from(questionnaires)
      .where(whereClauses.length > 0 ? and(...whereClauses) : undefined)
      .orderBy(questionnaires.createdAt);

    return {
      items: rows.map((row) => ({
        questionnaireId: row.questionnaireId,
        campaignId: row.campaignId,
        companyId: row.companyId,
        subjectEmployeeId: row.subjectEmployeeId,
        raterEmployeeId: row.raterEmployeeId,
        status: ensureQuestionnaireStatus(row.status),
        ...(row.submittedAt ? { submittedAt: row.submittedAt.toISOString() } : {}),
      })),
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
): Promise<ReturnType<typeof mapQuestionnaireRow>> => {
  const pool = createPool();

  try {
    const db = createDb(pool);
    const row = await getQuestionnaireRow(db, questionnaireId);
    return mapQuestionnaireRow(row);
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
  } finally {
    await pool.end();
  }
};

import { type QuestionnaireStatus, createOperationError } from "@feedback-360/api-contract";
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
    ...(row.submittedAt ? { submittedAt: row.submittedAt.toISOString() } : {}),
  };
};

const getQuestionnaireRow = async (
  tx: DbReader,
  questionnaireId: string,
  companyId?: string,
): Promise<QuestionnaireDbRow> => {
  const whereClause = companyId
    ? and(eq(questionnaires.id, questionnaireId), eq(questionnaires.companyId, companyId))
    : eq(questionnaires.id, questionnaireId);

  const rows = await tx
    .select({
      questionnaireId: questionnaires.id,
      campaignId: questionnaires.campaignId,
      companyId: questionnaires.companyId,
      subjectEmployeeId: questionnaires.subjectEmployeeId,
      raterEmployeeId: questionnaires.raterEmployeeId,
      status: questionnaires.status,
      submittedAt: questionnaires.submittedAt,
      draftPayload: questionnaires.draftPayload,
      campaignStatus: campaigns.status,
      campaignLockedAt: campaigns.lockedAt,
    })
    .from(questionnaires)
    .innerJoin(campaigns, eq(campaigns.id, questionnaires.campaignId))
    .where(whereClause)
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
  campaignId: string;
  companyId?: string;
  status?: QuestionnaireStatus;
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

    if (input.companyId) {
      await ensureCampaignInCompany(db, input.campaignId, input.companyId);
    }

    const whereClauses = [eq(questionnaires.campaignId, input.campaignId)];

    if (input.companyId) {
      whereClauses.push(eq(questionnaires.companyId, input.companyId));
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
      .where(and(...whereClauses))
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

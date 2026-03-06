import type {
  QuestionnaireDefinition,
  QuestionnaireGetDraftOutput,
  QuestionnaireListAssignedItem,
} from "@feedback-360/api-contract";

export type IndicatorDraftValue = "1" | "2" | "3" | "4" | "5" | "NA";
export type LevelDraftValue = "1" | "2" | "3" | "4" | "UNSURE";

export const questionnaireStatusLabels: Record<string, string> = {
  not_started: "Не начата",
  in_progress: "Черновик",
  submitted: "Отправлена",
};

export const campaignStatusLabels: Record<string, string> = {
  draft: "Черновик",
  started: "Идёт сбор",
  ended: "Завершена",
  processing_ai: "Обработка ИИ",
  ai_failed: "Ошибка ИИ",
  completed: "Готова",
};

export const questionnaireRaterRoleLabels: Record<string, string> = {
  manager: "Руководитель",
  peer: "Коллега",
  subordinate: "Подчинённый",
  self: "Самооценка",
};

type StructuredDraft = {
  note: string;
  indicatorResponses: Record<string, Record<string, IndicatorDraftValue>>;
  levelResponses: Record<string, LevelDraftValue>;
  competencyComments: Record<string, string>;
  finalComment: string;
};

export type QuestionnaireDraftState = StructuredDraft;

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
};

const getRawCommentText = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  const record = asRecord(value);
  if (!record) {
    return "";
  }

  if (typeof record.rawText === "string") {
    return record.rawText;
  }

  return "";
};

export const normalizeQuestionnaireDraft = (
  draft: QuestionnaireGetDraftOutput["draft"],
): StructuredDraft => {
  const draftRecord = asRecord(draft) ?? {};
  const indicatorResponsesRecord = asRecord(draftRecord.indicatorResponses) ?? {};
  const levelResponsesRecord = asRecord(draftRecord.levelResponses) ?? {};
  const competencyCommentsRecord = asRecord(draftRecord.competencyComments) ?? {};
  const finalCommentRecord = draftRecord.finalComment;

  const indicatorResponses: Record<string, Record<string, IndicatorDraftValue>> = {};
  for (const [competencyId, value] of Object.entries(indicatorResponsesRecord)) {
    const responseRecord = asRecord(value);
    if (!responseRecord) {
      continue;
    }

    const normalized: Record<string, IndicatorDraftValue> = {};
    for (const [indicatorId, responseValue] of Object.entries(responseRecord)) {
      if (typeof responseValue === "number") {
        normalized[indicatorId] = String(responseValue) as IndicatorDraftValue;
      } else if (responseValue === "NA") {
        normalized[indicatorId] = "NA";
      }
    }

    indicatorResponses[competencyId] = normalized;
  }

  const levelResponses: Record<string, LevelDraftValue> = {};
  for (const [competencyId, value] of Object.entries(levelResponsesRecord)) {
    if (typeof value === "number") {
      levelResponses[competencyId] = String(value) as LevelDraftValue;
    } else if (value === "UNSURE") {
      levelResponses[competencyId] = "UNSURE";
    }
  }

  const competencyComments: Record<string, string> = {};
  for (const [competencyId, value] of Object.entries(competencyCommentsRecord)) {
    const rawText = getRawCommentText(value).trim();
    if (rawText.length > 0) {
      competencyComments[competencyId] = rawText;
    }
  }

  return {
    note: typeof draftRecord.note === "string" ? draftRecord.note : "",
    indicatorResponses,
    levelResponses,
    competencyComments,
    finalComment: getRawCommentText(finalCommentRecord).trim(),
  };
};

export const groupQuestionnairesByStatus = (items: QuestionnaireListAssignedItem[]) => {
  return {
    not_started: items.filter((item) => item.status === "not_started"),
    in_progress: items.filter((item) => item.status === "in_progress"),
    submitted: items.filter((item) => item.status === "submitted"),
  };
};

export const getQuestionnaireCounts = (items: QuestionnaireListAssignedItem[]) => {
  const grouped = groupQuestionnairesByStatus(items);

  return {
    total: items.length,
    notStarted: grouped.not_started.length,
    inProgress: grouped.in_progress.length,
    submitted: grouped.submitted.length,
  };
};

export const getQuestionnaireStatusTone = (status: QuestionnaireListAssignedItem["status"]) => {
  if (status === "submitted") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (status === "in_progress") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-slate-100 text-slate-700 border-slate-200";
};

export const getQuestionnaireCtaLabel = (status: QuestionnaireListAssignedItem["status"]) => {
  if (status === "in_progress") {
    return "Продолжить";
  }

  if (status === "submitted") {
    return "Открыть";
  }

  return "Начать";
};

export const getQuestionnaireProgress = (
  definition: QuestionnaireDefinition | undefined,
  draft: StructuredDraft,
) => {
  if (!definition) {
    return {
      totalPrompts: 1,
      answeredPrompts: draft.note.trim().length > 0 ? 1 : 0,
      totalCompetencies: 1,
      completedCompetencies: draft.note.trim().length > 0 ? 1 : 0,
    };
  }

  let totalCompetencies = 0;
  let completedCompetencies = 0;
  let answeredPrompts = 0;

  for (const group of definition.groups) {
    for (const competency of group.competencies) {
      totalCompetencies += 1;

      if (definition.modelKind === "indicators") {
        const responses = draft.indicatorResponses[competency.competencyId] ?? {};
        const promptCount = competency.indicators?.length ?? 0;
        const answeredCount = Object.keys(responses).length;
        answeredPrompts += answeredCount;
        if (promptCount > 0 && answeredCount === promptCount) {
          completedCompetencies += 1;
        }
      } else {
        if (draft.levelResponses[competency.competencyId]) {
          answeredPrompts += 1;
          completedCompetencies += 1;
        }
      }
    }
  }

  return {
    totalPrompts: definition.totalPrompts,
    answeredPrompts,
    totalCompetencies,
    completedCompetencies,
  };
};

export const buildQuestionnaireDraftPayload = (draft: StructuredDraft): Record<string, unknown> => {
  const indicatorResponses = Object.fromEntries(
    Object.entries(draft.indicatorResponses).map(([competencyId, responses]) => [
      competencyId,
      Object.fromEntries(
        Object.entries(responses).map(([indicatorId, value]) => [
          indicatorId,
          value === "NA" ? "NA" : Number(value),
        ]),
      ),
    ]),
  );

  const levelResponses = Object.fromEntries(
    Object.entries(draft.levelResponses).map(([competencyId, value]) => [
      competencyId,
      value === "UNSURE" ? "UNSURE" : Number(value),
    ]),
  );

  return {
    ...(draft.note.trim().length > 0 ? { note: draft.note.trim() } : {}),
    ...(Object.keys(indicatorResponses).length > 0 ? { indicatorResponses } : {}),
    ...(Object.keys(levelResponses).length > 0 ? { levelResponses } : {}),
    ...(Object.keys(draft.competencyComments).length > 0
      ? {
          competencyComments: Object.fromEntries(
            Object.entries(draft.competencyComments)
              .filter(([, value]) => value.trim().length > 0)
              .map(([competencyId, value]) => [competencyId, { rawText: value.trim() }]),
          ),
        }
      : {}),
    ...(draft.finalComment.trim().length > 0
      ? { finalComment: { rawText: draft.finalComment.trim() } }
      : {}),
  };
};

export const computeQuestionnaireProgress = (
  definition: QuestionnaireDefinition | undefined,
  draft: StructuredDraft,
) => {
  const progress = getQuestionnaireProgress(definition, draft);
  const percent =
    progress.totalPrompts > 0
      ? Math.round((progress.answeredPrompts / progress.totalPrompts) * 100)
      : 0;

  return {
    answeredPrompts: progress.answeredPrompts,
    totalPrompts: progress.totalPrompts,
    percent,
  };
};

export const formatQuestionnaireDate = (value?: string) => {
  if (!value) {
    return undefined;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const questionnaireStatusMeta = {
  not_started: {
    label: questionnaireStatusLabels.not_started,
    tone: "default",
  },
  in_progress: {
    label: questionnaireStatusLabels.in_progress,
    tone: "warning",
  },
  submitted: {
    label: questionnaireStatusLabels.submitted,
    tone: "success",
  },
} as const;

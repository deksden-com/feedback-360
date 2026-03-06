import type {
  CampaignGetOutput,
  CampaignSnapshotListItem,
  DepartmentListItem,
  EmployeeListActiveItem,
  MatrixListAssignment,
  ModelGroupInput,
  ModelVersionGetOutput,
  ModelVersionListItem,
  ModelVersionStatus,
} from "@feedback-360/api-contract";

export type ModelEditorDraft = {
  modelVersionId?: string;
  name: string;
  kind: "indicators" | "levels";
  status?: ModelVersionStatus;
  groups: ModelGroupInput[];
};

export const getQueryValue = (value: string | string[] | undefined): string | undefined => {
  if (typeof value === "string") {
    return value.trim().length > 0 ? value.trim() : undefined;
  }

  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" && first.trim().length > 0 ? first.trim() : undefined;
  }

  return undefined;
};

export const modelStatusLabels: Record<ModelVersionStatus, string> = {
  draft: "Черновик",
  published: "Опубликована",
};

export const modelKindLabels: Record<ModelVersionListItem["kind"], string> = {
  indicators: "Индикаторы 1–5",
  levels: "Уровни 1–4",
};

export const formatDateLabel = (value: string | undefined): string => {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(parsed);
};

export const buildEmptyModelDraft = (kind: "indicators" | "levels"): ModelEditorDraft => ({
  name: kind === "indicators" ? "Новая модель 360" : "Новая уровнeвая модель",
  kind,
  groups: [
    {
      name: "Ключевые компетенции",
      weight: 100,
      competencies: [
        kind === "indicators"
          ? {
              name: "Лидерство",
              indicators: [
                { text: "Даёт понятные приоритеты", order: 1 },
                { text: "Поддерживает команду обратной связью", order: 2 },
              ],
            }
          : {
              name: "Лидерство",
              levels: [
                { level: 1, text: "Нуждается в постоянной поддержке." },
                { level: 2, text: "Стабильно решает типовые задачи." },
                { level: 3, text: "Уверенно ведёт направление и людей." },
                { level: 4, text: "Формирует практики и масштабирует их." },
              ],
            },
      ],
    },
  ],
});

export const modelToDraft = (model: ModelVersionGetOutput): ModelEditorDraft => ({
  modelVersionId: model.modelVersionId,
  name: model.name,
  kind: model.kind,
  status: model.status,
  groups: model.groups,
});

export const countModelDefinition = (groups: ModelGroupInput[]) => {
  let competencyCount = 0;
  let indicatorCount = 0;
  let levelCount = 0;

  for (const group of groups) {
    competencyCount += group.competencies.length;
    for (const competency of group.competencies) {
      indicatorCount += competency.indicators?.length ?? 0;
      levelCount += competency.levels?.length ?? 0;
    }
  }

  return {
    groupCount: groups.length,
    competencyCount,
    indicatorCount,
    levelCount,
    totalWeight: groups.reduce((sum, group) => sum + group.weight, 0),
  };
};

export const getEmployeeLabel = (employee: {
  employeeId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}) => {
  const parts = [employee.firstName, employee.lastName].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );
  return parts.length > 0
    ? `${parts.join(" ")} · ${employee.email ?? employee.employeeId}`
    : (employee.email ?? employee.employeeId);
};

export const buildMatrixPeople = (
  employees: EmployeeListActiveItem[],
  snapshots: CampaignSnapshotListItem[],
): Array<{ employeeId: string; label: string }> => {
  if (snapshots.length > 0) {
    return snapshots.map((item) => ({
      employeeId: item.employeeId,
      label: getEmployeeLabel(item),
    }));
  }

  return employees.map((item) => ({
    employeeId: item.employeeId,
    label: getEmployeeLabel(item),
  }));
};

export const matrixRoleLabels: Record<MatrixListAssignment["raterRole"], string> = {
  manager: "Руководитель",
  peer: "Коллега",
  subordinate: "Подчинённый",
  self: "Self",
};

export const buildDepartmentOptions = (departments: DepartmentListItem[]) => {
  type DepartmentOption = {
    departmentId: string;
    label: string;
  };
  const byParent = new Map<string | undefined, DepartmentListItem[]>();
  for (const item of departments) {
    const list = byParent.get(item.parentDepartmentId) ?? [];
    list.push(item);
    byParent.set(item.parentDepartmentId, list);
  }

  const visit = (parentDepartmentId: string | undefined, depth: number): DepartmentOption[] => {
    const siblings = [...(byParent.get(parentDepartmentId) ?? [])].sort((left, right) =>
      left.name.localeCompare(right.name),
    );

    return siblings.flatMap((item) => [
      { departmentId: item.departmentId, label: `${"— ".repeat(depth)}${item.name}` },
      ...visit(item.departmentId, depth + 1),
    ]);
  };

  return visit(undefined, 0);
};

export const groupAssignmentsBySubject = (
  assignments: MatrixListAssignment[],
  peopleById: Map<string, string>,
) => {
  const buckets = new Map<string, MatrixListAssignment[]>();
  for (const assignment of assignments) {
    const list = buckets.get(assignment.subjectEmployeeId) ?? [];
    list.push(assignment);
    buckets.set(assignment.subjectEmployeeId, list);
  }

  return [...buckets.entries()]
    .map(([subjectEmployeeId, rows]) => ({
      subjectEmployeeId,
      subjectLabel: peopleById.get(subjectEmployeeId) ?? subjectEmployeeId,
      rows: rows.sort((left, right) => {
        if (left.raterRole !== right.raterRole) {
          return left.raterRole.localeCompare(right.raterRole);
        }
        return (peopleById.get(left.raterEmployeeId) ?? left.raterEmployeeId).localeCompare(
          peopleById.get(right.raterEmployeeId) ?? right.raterEmployeeId,
        );
      }),
    }))
    .sort((left, right) => left.subjectLabel.localeCompare(right.subjectLabel));
};

export const getMatrixLockCopy = (campaign: CampaignGetOutput): string => {
  if (campaign.lockedAt) {
    return `Матрица зафиксирована ${formatDateLabel(campaign.lockedAt)} после первого draft save в анкете.`;
  }

  if (campaign.status !== "draft" && campaign.status !== "started") {
    return `Кампания в статусе ${campaign.status}. Матрица больше не редактируется.`;
  }

  return "Матрица пока редактируема. После первого draft save в любой анкете изменения будут запрещены.";
};

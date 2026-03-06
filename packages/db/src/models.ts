import { createOperationError } from "@feedback-360/api-contract";
import { and, desc, eq, ilike, inArray } from "drizzle-orm";

import { createDb, createPool } from "./db";
import {
  campaigns,
  competencies,
  competencyGroups,
  competencyIndicators,
  competencyLevels,
  competencyModelVersions,
} from "./schema";

type DbExecutor = Pick<ReturnType<typeof createDb>, "select" | "insert" | "update" | "delete">;

type ModelKind = "indicators" | "levels";
type ModelStatus = "draft" | "published";

type ModelDefinitionInput = {
  companyId: string;
  name: string;
  kind: ModelKind;
  groups: Array<{
    name: string;
    weight: number;
    competencies: Array<{
      name: string;
      indicators?: Array<{
        text: string;
        order?: number;
      }>;
      levels?: Array<{
        level: number;
        text: string;
      }>;
    }>;
  }>;
};

type ModelVersionRecord = {
  modelVersionId: string;
  companyId: string;
  name: string;
  kind: ModelKind;
  version: number;
  status: ModelStatus;
  createdAt: string;
  updatedAt: string;
  groups: ModelDefinitionInput["groups"];
};

type CreateModelVersionInput = ModelDefinitionInput;

export type CreateModelVersionOutput = {
  modelVersionId: string;
  companyId: string;
  name: string;
  kind: ModelKind;
  version: number;
  createdAt: string;
  groupCount: number;
  competencyCount: number;
  indicatorCount: number;
  levelCount: number;
};

export type ModelVersionListOutput = {
  items: Array<{
    modelVersionId: string;
    name: string;
    kind: ModelKind;
    version: number;
    status: ModelStatus;
    createdAt: string;
    updatedAt: string;
    usedByActiveCampaigns: number;
  }>;
};

export type ModelVersionGetOutput = ModelVersionRecord;

export type ModelVersionCloneDraftOutput = ModelVersionRecord;

export type ModelVersionUpsertDraftInput = ModelDefinitionInput & {
  modelVersionId?: string;
};

export type ModelVersionUpsertDraftOutput = ModelVersionRecord;

export type ModelVersionPublishOutput = {
  modelVersionId: string;
  name: string;
  version: number;
  status: "published";
  updatedAt: string;
};

const ACTIVE_CAMPAIGN_STATUSES = new Set([
  "draft",
  "started",
  "ended",
  "processing_ai",
  "ai_failed",
]);

const ensurePositiveInteger = (value: number, fieldName: string): number => {
  if (!Number.isInteger(value) || value <= 0) {
    throw createOperationError("invalid_input", `${fieldName} must be a positive integer.`);
  }
  return value;
};

const validateInput = (input: ModelDefinitionInput): void => {
  if (input.name.trim().length === 0) {
    throw createOperationError("invalid_input", "Model version name must be non-empty.");
  }

  if (input.groups.length === 0) {
    throw createOperationError("invalid_input", "Model version must contain at least one group.");
  }

  const totalWeight = input.groups.reduce((sum, group) => {
    if (group.name.trim().length === 0) {
      throw createOperationError("invalid_input", "Group name must be non-empty.");
    }
    ensurePositiveInteger(group.weight, "group.weight");
    if (group.competencies.length === 0) {
      throw createOperationError(
        "invalid_input",
        "Each group must contain at least one competency.",
      );
    }

    for (const competency of group.competencies) {
      if (competency.name.trim().length === 0) {
        throw createOperationError("invalid_input", "Competency name must be non-empty.");
      }

      if (input.kind === "indicators") {
        if (!competency.indicators || competency.indicators.length === 0) {
          throw createOperationError(
            "invalid_input",
            "Indicators model requires at least one indicator per competency.",
          );
        }

        const explicitOrders = new Set<number>();
        for (const indicator of competency.indicators) {
          if (indicator.text.trim().length === 0) {
            throw createOperationError("invalid_input", "Indicator text must be non-empty.");
          }
          if (indicator.order !== undefined) {
            ensurePositiveInteger(indicator.order, "indicator.order");
            if (explicitOrders.has(indicator.order)) {
              throw createOperationError(
                "invalid_input",
                "Indicator order must be unique within competency.",
              );
            }
            explicitOrders.add(indicator.order);
          }
        }
      }

      if (input.kind === "levels") {
        if (!competency.levels || competency.levels.length === 0) {
          throw createOperationError(
            "invalid_input",
            "Levels model requires at least one level per competency.",
          );
        }
        const levelValues = new Set<number>();
        for (const level of competency.levels) {
          ensurePositiveInteger(level.level, "level.level");
          if (level.text.trim().length === 0) {
            throw createOperationError("invalid_input", "Level text must be non-empty.");
          }
          if (levelValues.has(level.level)) {
            throw createOperationError(
              "invalid_input",
              "Level values must be unique within competency.",
            );
          }
          levelValues.add(level.level);
        }
      }
    }

    return sum + group.weight;
  }, 0);

  if (totalWeight !== 100) {
    throw createOperationError("invalid_input", "Sum of group weights must be exactly 100.");
  }
};

const getNextVersion = async (tx: DbExecutor, companyId: string, name: string): Promise<number> => {
  const previousRows = await tx
    .select({
      version: competencyModelVersions.version,
    })
    .from(competencyModelVersions)
    .where(
      and(
        eq(competencyModelVersions.companyId, companyId),
        eq(competencyModelVersions.name, name.trim()),
      ),
    )
    .orderBy(desc(competencyModelVersions.version))
    .limit(1);

  return (previousRows[0]?.version ?? 0) + 1;
};

const insertDefinition = async (
  tx: DbExecutor,
  input: {
    companyId: string;
    modelVersionId: string;
    kind: ModelKind;
    groups: ModelDefinitionInput["groups"];
    now: Date;
  },
): Promise<{ competencyCount: number; indicatorCount: number; levelCount: number }> => {
  let competencyCount = 0;
  let indicatorCount = 0;
  let levelCount = 0;

  for (const [groupIndex, group] of input.groups.entries()) {
    const groupRows = await tx
      .insert(competencyGroups)
      .values({
        companyId: input.companyId,
        modelVersionId: input.modelVersionId,
        name: group.name.trim(),
        weight: group.weight,
        order: groupIndex + 1,
        createdAt: input.now,
        updatedAt: input.now,
      })
      .returning({
        groupId: competencyGroups.id,
      });

    const groupRow = groupRows[0];
    if (!groupRow) {
      throw createOperationError("invalid_transition", "Failed to create competency group.");
    }

    for (const [competencyIndex, competency] of group.competencies.entries()) {
      competencyCount += 1;
      const competencyRows = await tx
        .insert(competencies)
        .values({
          companyId: input.companyId,
          modelVersionId: input.modelVersionId,
          groupId: groupRow.groupId,
          name: competency.name.trim(),
          order: competencyIndex + 1,
          createdAt: input.now,
          updatedAt: input.now,
        })
        .returning({
          competencyId: competencies.id,
        });

      const competencyRow = competencyRows[0];
      if (!competencyRow) {
        throw createOperationError("invalid_transition", "Failed to create competency.");
      }

      if (input.kind === "indicators") {
        const indicators = competency.indicators ?? [];
        const sortedIndicators = [...indicators].sort((left, right) => {
          const leftOrder = left.order ?? Number.MAX_SAFE_INTEGER;
          const rightOrder = right.order ?? Number.MAX_SAFE_INTEGER;
          if (leftOrder === rightOrder) {
            return indicators.indexOf(left) - indicators.indexOf(right);
          }
          return leftOrder - rightOrder;
        });

        for (const [indicatorIndex, indicator] of sortedIndicators.entries()) {
          indicatorCount += 1;
          await tx.insert(competencyIndicators).values({
            companyId: input.companyId,
            competencyId: competencyRow.competencyId,
            text: indicator.text.trim(),
            order: indicator.order ?? indicatorIndex + 1,
            createdAt: input.now,
            updatedAt: input.now,
          });
        }
      }

      if (input.kind === "levels") {
        const levels = competency.levels ?? [];
        const sortedLevels = [...levels].sort((left, right) => left.level - right.level);
        for (const level of sortedLevels) {
          levelCount += 1;
          await tx.insert(competencyLevels).values({
            companyId: input.companyId,
            competencyId: competencyRow.competencyId,
            level: level.level,
            text: level.text.trim(),
            createdAt: input.now,
            updatedAt: input.now,
          });
        }
      }
    }
  }

  return { competencyCount, indicatorCount, levelCount };
};

const getModelRow = async (tx: DbExecutor, companyId: string, modelVersionId: string) => {
  const rows = await tx
    .select({
      modelVersionId: competencyModelVersions.id,
      companyId: competencyModelVersions.companyId,
      name: competencyModelVersions.name,
      kind: competencyModelVersions.kind,
      version: competencyModelVersions.version,
      status: competencyModelVersions.status,
      createdAt: competencyModelVersions.createdAt,
      updatedAt: competencyModelVersions.updatedAt,
    })
    .from(competencyModelVersions)
    .where(
      and(
        eq(competencyModelVersions.companyId, companyId),
        eq(competencyModelVersions.id, modelVersionId),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    throw createOperationError("not_found", "Model version not found in active company.", {
      companyId,
      modelVersionId,
    });
  }

  return row;
};

const loadModelDefinition = async (
  tx: DbExecutor,
  companyId: string,
  modelVersionId: string,
): Promise<ModelVersionRecord> => {
  const model = await getModelRow(tx, companyId, modelVersionId);

  const groupRows = await tx
    .select({
      groupId: competencyGroups.id,
      name: competencyGroups.name,
      weight: competencyGroups.weight,
      order: competencyGroups.order,
    })
    .from(competencyGroups)
    .where(
      and(
        eq(competencyGroups.companyId, companyId),
        eq(competencyGroups.modelVersionId, modelVersionId),
      ),
    )
    .orderBy(competencyGroups.order);

  const competencyRows = await tx
    .select({
      competencyId: competencies.id,
      groupId: competencies.groupId,
      name: competencies.name,
      order: competencies.order,
    })
    .from(competencies)
    .where(
      and(eq(competencies.companyId, companyId), eq(competencies.modelVersionId, modelVersionId)),
    )
    .orderBy(competencies.order);

  const competencyIds = competencyRows.map((row) => row.competencyId);
  const indicatorRows = competencyIds.length
    ? await tx
        .select({
          competencyId: competencyIndicators.competencyId,
          text: competencyIndicators.text,
          order: competencyIndicators.order,
        })
        .from(competencyIndicators)
        .where(
          and(
            eq(competencyIndicators.companyId, companyId),
            inArray(competencyIndicators.competencyId, competencyIds),
          ),
        )
        .orderBy(competencyIndicators.order)
    : [];
  const levelRows = competencyIds.length
    ? await tx
        .select({
          competencyId: competencyLevels.competencyId,
          level: competencyLevels.level,
          text: competencyLevels.text,
        })
        .from(competencyLevels)
        .where(
          and(
            eq(competencyLevels.companyId, companyId),
            inArray(competencyLevels.competencyId, competencyIds),
          ),
        )
        .orderBy(competencyLevels.level)
    : [];

  const indicatorsByCompetency = new Map<string, Array<{ text: string; order?: number }>>();
  for (const row of indicatorRows) {
    const list = indicatorsByCompetency.get(row.competencyId) ?? [];
    list.push({ text: row.text, order: row.order });
    indicatorsByCompetency.set(row.competencyId, list);
  }

  const levelsByCompetency = new Map<string, Array<{ level: number; text: string }>>();
  for (const row of levelRows) {
    const list = levelsByCompetency.get(row.competencyId) ?? [];
    list.push({ level: row.level, text: row.text });
    levelsByCompetency.set(row.competencyId, list);
  }

  const competenciesByGroup = new Map<
    string,
    ModelDefinitionInput["groups"][number]["competencies"]
  >();
  for (const row of competencyRows) {
    const list = competenciesByGroup.get(row.groupId) ?? [];
    list.push({
      name: row.name,
      ...(model.kind === "indicators"
        ? { indicators: indicatorsByCompetency.get(row.competencyId) ?? [] }
        : { levels: levelsByCompetency.get(row.competencyId) ?? [] }),
    });
    competenciesByGroup.set(row.groupId, list);
  }

  return {
    modelVersionId: model.modelVersionId,
    companyId: model.companyId,
    name: model.name,
    kind: model.kind as ModelKind,
    version: model.version,
    status: model.status as ModelStatus,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
    groups: groupRows.map((group) => ({
      name: group.name,
      weight: group.weight,
      competencies: competenciesByGroup.get(group.groupId) ?? [],
    })),
  };
};

export const createModelVersion = async (
  input: CreateModelVersionInput,
): Promise<CreateModelVersionOutput> => {
  validateInput(input);

  const pool = createPool();
  try {
    const db = createDb(pool);
    return await db.transaction(async (tx) => {
      const nextVersion = await getNextVersion(tx, input.companyId, input.name);
      const now = new Date();

      const modelRows = await tx
        .insert(competencyModelVersions)
        .values({
          companyId: input.companyId,
          name: input.name.trim(),
          kind: input.kind,
          version: nextVersion,
          status: "published",
          createdAt: now,
          updatedAt: now,
        })
        .returning({
          modelVersionId: competencyModelVersions.id,
          createdAt: competencyModelVersions.createdAt,
        });

      const model = modelRows[0];
      if (!model) {
        throw createOperationError("invalid_transition", "Failed to create model version.");
      }

      const counts = await insertDefinition(tx, {
        companyId: input.companyId,
        modelVersionId: model.modelVersionId,
        kind: input.kind,
        groups: input.groups,
        now,
      });

      return {
        modelVersionId: model.modelVersionId,
        companyId: input.companyId,
        name: input.name.trim(),
        kind: input.kind,
        version: nextVersion,
        createdAt: model.createdAt.toISOString(),
        groupCount: input.groups.length,
        competencyCount: counts.competencyCount,
        indicatorCount: counts.indicatorCount,
        levelCount: counts.levelCount,
      };
    });
  } finally {
    await pool.end();
  }
};

export const listModelVersions = async (input: {
  companyId: string;
  kind?: ModelKind;
  status?: ModelStatus;
  search?: string;
}): Promise<ModelVersionListOutput> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    const filters = [eq(competencyModelVersions.companyId, input.companyId)];
    if (input.kind) {
      filters.push(eq(competencyModelVersions.kind, input.kind));
    }
    if (input.status) {
      filters.push(eq(competencyModelVersions.status, input.status));
    }
    if (input.search?.trim()) {
      filters.push(ilike(competencyModelVersions.name, `%${input.search.trim()}%`));
    }

    const rows = await db
      .select({
        modelVersionId: competencyModelVersions.id,
        name: competencyModelVersions.name,
        kind: competencyModelVersions.kind,
        version: competencyModelVersions.version,
        status: competencyModelVersions.status,
        createdAt: competencyModelVersions.createdAt,
        updatedAt: competencyModelVersions.updatedAt,
      })
      .from(competencyModelVersions)
      .where(and(...filters))
      .orderBy(
        desc(competencyModelVersions.updatedAt),
        desc(competencyModelVersions.version),
        desc(competencyModelVersions.id),
      );

    const modelIds = rows.map((row) => row.modelVersionId);
    const campaignRows = modelIds.length
      ? await db
          .select({
            modelVersionId: campaigns.modelVersionId,
            status: campaigns.status,
          })
          .from(campaigns)
          .where(
            and(
              eq(campaigns.companyId, input.companyId),
              inArray(campaigns.modelVersionId, modelIds),
            ),
          )
      : [];
    const activeUsage = new Map<string, number>();
    for (const row of campaignRows) {
      if (!row.modelVersionId || !ACTIVE_CAMPAIGN_STATUSES.has(row.status)) {
        continue;
      }
      activeUsage.set(row.modelVersionId, (activeUsage.get(row.modelVersionId) ?? 0) + 1);
    }

    return {
      items: rows.map((row) => ({
        modelVersionId: row.modelVersionId,
        name: row.name,
        kind: row.kind as ModelKind,
        version: row.version,
        status: row.status as ModelStatus,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        usedByActiveCampaigns: activeUsage.get(row.modelVersionId) ?? 0,
      })),
    };
  } finally {
    await pool.end();
  }
};

export const getModelVersion = async (input: {
  companyId: string;
  modelVersionId: string;
}): Promise<ModelVersionGetOutput> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    return await db.transaction((tx) =>
      loadModelDefinition(tx, input.companyId, input.modelVersionId),
    );
  } finally {
    await pool.end();
  }
};

export const cloneModelVersionToDraft = async (input: {
  companyId: string;
  sourceModelVersionId: string;
  name?: string;
}): Promise<ModelVersionCloneDraftOutput> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    return await db.transaction(async (tx) => {
      const source = await loadModelDefinition(tx, input.companyId, input.sourceModelVersionId);
      const targetName = input.name?.trim() || source.name;
      const nextVersion = await getNextVersion(tx, input.companyId, targetName);
      const now = new Date();

      const modelRows = await tx
        .insert(competencyModelVersions)
        .values({
          companyId: input.companyId,
          name: targetName,
          kind: source.kind,
          version: nextVersion,
          status: "draft",
          createdAt: now,
          updatedAt: now,
        })
        .returning({
          modelVersionId: competencyModelVersions.id,
        });

      const model = modelRows[0];
      if (!model) {
        throw createOperationError("invalid_transition", "Failed to clone model version.");
      }

      await insertDefinition(tx, {
        companyId: input.companyId,
        modelVersionId: model.modelVersionId,
        kind: source.kind,
        groups: source.groups,
        now,
      });

      return loadModelDefinition(tx, input.companyId, model.modelVersionId);
    });
  } finally {
    await pool.end();
  }
};

export const upsertModelDraft = async (
  input: ModelVersionUpsertDraftInput,
): Promise<ModelVersionUpsertDraftOutput> => {
  validateInput(input);

  const pool = createPool();
  try {
    const db = createDb(pool);
    return await db.transaction(async (tx) => {
      const now = new Date();

      if (input.modelVersionId) {
        const current = await getModelRow(tx, input.companyId, input.modelVersionId);
        if (current.status !== "draft") {
          throw createOperationError(
            "invalid_transition",
            "Only draft model versions can be edited.",
            { modelVersionId: input.modelVersionId },
          );
        }

        await tx
          .update(competencyModelVersions)
          .set({
            name: input.name.trim(),
            kind: input.kind,
            updatedAt: now,
          })
          .where(
            and(
              eq(competencyModelVersions.companyId, input.companyId),
              eq(competencyModelVersions.id, input.modelVersionId),
            ),
          );

        await tx
          .delete(competencyGroups)
          .where(
            and(
              eq(competencyGroups.companyId, input.companyId),
              eq(competencyGroups.modelVersionId, input.modelVersionId),
            ),
          );

        await insertDefinition(tx, {
          companyId: input.companyId,
          modelVersionId: input.modelVersionId,
          kind: input.kind,
          groups: input.groups,
          now,
        });

        return loadModelDefinition(tx, input.companyId, input.modelVersionId);
      }

      const nextVersion = await getNextVersion(tx, input.companyId, input.name);
      const modelRows = await tx
        .insert(competencyModelVersions)
        .values({
          companyId: input.companyId,
          name: input.name.trim(),
          kind: input.kind,
          version: nextVersion,
          status: "draft",
          createdAt: now,
          updatedAt: now,
        })
        .returning({
          modelVersionId: competencyModelVersions.id,
        });

      const model = modelRows[0];
      if (!model) {
        throw createOperationError("invalid_transition", "Failed to create draft model version.");
      }

      await insertDefinition(tx, {
        companyId: input.companyId,
        modelVersionId: model.modelVersionId,
        kind: input.kind,
        groups: input.groups,
        now,
      });

      return loadModelDefinition(tx, input.companyId, model.modelVersionId);
    });
  } finally {
    await pool.end();
  }
};

export const publishModelVersion = async (input: {
  companyId: string;
  modelVersionId: string;
}): Promise<ModelVersionPublishOutput> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    return await db.transaction(async (tx) => {
      const current = await getModelRow(tx, input.companyId, input.modelVersionId);
      if (current.status !== "draft") {
        throw createOperationError(
          "invalid_transition",
          "Only draft model versions can be published.",
          { modelVersionId: input.modelVersionId },
        );
      }

      const now = new Date();
      const updatedRows = await tx
        .update(competencyModelVersions)
        .set({
          status: "published",
          updatedAt: now,
        })
        .where(
          and(
            eq(competencyModelVersions.companyId, input.companyId),
            eq(competencyModelVersions.id, input.modelVersionId),
          ),
        )
        .returning({
          modelVersionId: competencyModelVersions.id,
          name: competencyModelVersions.name,
          version: competencyModelVersions.version,
          status: competencyModelVersions.status,
          updatedAt: competencyModelVersions.updatedAt,
        });

      const updated = updatedRows[0];
      if (!updated) {
        throw createOperationError("invalid_transition", "Failed to publish model version.");
      }

      return {
        modelVersionId: updated.modelVersionId,
        name: updated.name,
        version: updated.version,
        status: updated.status as "published",
        updatedAt: updated.updatedAt.toISOString(),
      };
    });
  } finally {
    await pool.end();
  }
};

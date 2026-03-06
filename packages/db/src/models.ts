import { createOperationError } from "@feedback-360/api-contract";
import { and, desc, eq } from "drizzle-orm";

import { createDb, createPool } from "./db";
import {
  competencies,
  competencyGroups,
  competencyIndicators,
  competencyLevels,
  competencyModelVersions,
} from "./schema";

type ModelKind = "indicators" | "levels";

type CreateModelVersionInput = {
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
    status: string;
    createdAt: string;
  }>;
};

const ensurePositiveInteger = (value: number, fieldName: string): number => {
  if (!Number.isInteger(value) || value <= 0) {
    throw createOperationError("invalid_input", `${fieldName} must be a positive integer.`);
  }
  return value;
};

const validateInput = (input: CreateModelVersionInput): void => {
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

export const createModelVersion = async (
  input: CreateModelVersionInput,
): Promise<CreateModelVersionOutput> => {
  validateInput(input);

  const pool = createPool();
  try {
    const db = createDb(pool);
    return await db.transaction(async (tx) => {
      const previousRows = await tx
        .select({
          version: competencyModelVersions.version,
        })
        .from(competencyModelVersions)
        .where(
          and(
            eq(competencyModelVersions.companyId, input.companyId),
            eq(competencyModelVersions.name, input.name.trim()),
          ),
        )
        .orderBy(desc(competencyModelVersions.version))
        .limit(1);

      const nextVersion = (previousRows[0]?.version ?? 0) + 1;
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

      let competencyCount = 0;
      let indicatorCount = 0;
      let levelCount = 0;

      for (const [groupIndex, group] of input.groups.entries()) {
        const groupRows = await tx
          .insert(competencyGroups)
          .values({
            companyId: input.companyId,
            modelVersionId: model.modelVersionId,
            name: group.name.trim(),
            weight: group.weight,
            order: groupIndex + 1,
            createdAt: now,
            updatedAt: now,
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
              modelVersionId: model.modelVersionId,
              groupId: groupRow.groupId,
              name: competency.name.trim(),
              order: competencyIndex + 1,
              createdAt: now,
              updatedAt: now,
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
                createdAt: now,
                updatedAt: now,
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
                createdAt: now,
                updatedAt: now,
              });
            }
          }
        }
      }

      return {
        modelVersionId: model.modelVersionId,
        companyId: input.companyId,
        name: input.name.trim(),
        kind: input.kind,
        version: nextVersion,
        createdAt: model.createdAt.toISOString(),
        groupCount: input.groups.length,
        competencyCount,
        indicatorCount,
        levelCount,
      };
    });
  } finally {
    await pool.end();
  }
};

export const listModelVersions = async (input: {
  companyId: string;
}): Promise<ModelVersionListOutput> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    const rows = await db
      .select({
        modelVersionId: competencyModelVersions.id,
        name: competencyModelVersions.name,
        kind: competencyModelVersions.kind,
        version: competencyModelVersions.version,
        status: competencyModelVersions.status,
        createdAt: competencyModelVersions.createdAt,
      })
      .from(competencyModelVersions)
      .where(eq(competencyModelVersions.companyId, input.companyId))
      .orderBy(
        desc(competencyModelVersions.createdAt),
        desc(competencyModelVersions.version),
        desc(competencyModelVersions.id),
      );

    return {
      items: rows.map((row) => ({
        modelVersionId: row.modelVersionId,
        name: row.name,
        kind: row.kind as ModelKind,
        version: row.version,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  } finally {
    await pool.end();
  }
};

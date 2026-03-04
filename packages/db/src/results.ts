import {
  type ResultsGetHrViewOutput,
  type ResultsGroupKey,
  createOperationError,
} from "@feedback-360/api-contract";
import { and, eq, inArray } from "drizzle-orm";

import { createDb, createPool } from "./db";
import {
  campaignAssignments,
  campaigns,
  competencies,
  competencyGroups,
  competencyIndicators,
  competencyModelVersions,
  questionnaires,
} from "./schema";

const groupOrder: Record<ResultsGroupKey, number> = {
  manager: 1,
  peers: 2,
  subordinates: 3,
  self: 4,
};

const assignmentRoleToResultsGroup = (value: string): ResultsGroupKey | undefined => {
  if (value === "manager") {
    return "manager";
  }
  if (value === "peer") {
    return "peers";
  }
  if (value === "subordinate") {
    return "subordinates";
  }
  if (value === "self") {
    return "self";
  }
  return undefined;
};

const roundScore = (value: number): number => {
  return Number(value.toFixed(4));
};

const getIndicatorValue = (
  payload: Record<string, unknown>,
  competencyId: string,
  indicatorId: string,
): number | undefined => {
  const indicatorResponses = payload.indicatorResponses;
  if (
    typeof indicatorResponses !== "object" ||
    indicatorResponses === null ||
    Array.isArray(indicatorResponses)
  ) {
    return undefined;
  }

  const byCompetency = (indicatorResponses as Record<string, unknown>)[competencyId];
  if (typeof byCompetency !== "object" || byCompetency === null || Array.isArray(byCompetency)) {
    return undefined;
  }

  const rawValue = (byCompetency as Record<string, unknown>)[indicatorId];
  if (rawValue === "NA") {
    return undefined;
  }
  if (typeof rawValue === "number" && rawValue >= 1 && rawValue <= 5) {
    return rawValue;
  }

  return undefined;
};

export type GetResultsHrViewInput = {
  companyId: string;
  campaignId: string;
  subjectEmployeeId: string;
};

type CompetencyWithGroup = {
  competencyId: string;
  competencyName: string;
  competencyOrder: number;
  groupId: string;
  groupName: string;
  groupWeight: number;
  groupOrder: number;
};

export const getResultsHrView = async (
  input: GetResultsHrViewInput,
): Promise<ResultsGetHrViewOutput> => {
  const pool = createPool();

  try {
    const db = createDb(pool);

    const campaignRows = await db
      .select({
        campaignId: campaigns.id,
        companyId: campaigns.companyId,
        modelVersionId: campaigns.modelVersionId,
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

    if (!campaign.modelVersionId) {
      throw createOperationError(
        "invalid_input",
        "Campaign has no competency model and cannot produce indicator results.",
        {
          campaignId: input.campaignId,
        },
      );
    }

    const modelRows = await db
      .select({
        modelVersionId: competencyModelVersions.id,
        kind: competencyModelVersions.kind,
      })
      .from(competencyModelVersions)
      .where(
        and(
          eq(competencyModelVersions.id, campaign.modelVersionId),
          eq(competencyModelVersions.companyId, input.companyId),
        ),
      )
      .limit(1);

    const model = modelRows[0];
    if (!model) {
      throw createOperationError("not_found", "Campaign model version was not found.", {
        campaignId: input.campaignId,
        modelVersionId: campaign.modelVersionId,
      });
    }

    if (model.kind !== "indicators") {
      throw createOperationError(
        "invalid_input",
        "results.getHrView currently supports indicators model only.",
        {
          campaignId: input.campaignId,
          modelKind: model.kind,
        },
      );
    }

    const competencyRows = await db
      .select({
        competencyId: competencies.id,
        competencyName: competencies.name,
        competencyOrder: competencies.order,
        groupId: competencyGroups.id,
        groupName: competencyGroups.name,
        groupWeight: competencyGroups.weight,
        groupOrder: competencyGroups.order,
      })
      .from(competencies)
      .innerJoin(competencyGroups, eq(competencyGroups.id, competencies.groupId))
      .where(eq(competencies.modelVersionId, model.modelVersionId))
      .orderBy(competencyGroups.order, competencies.order);

    if (competencyRows.length === 0) {
      throw createOperationError("invalid_input", "Model has no competencies for aggregation.", {
        campaignId: input.campaignId,
        modelVersionId: model.modelVersionId,
      });
    }

    const typedCompetencies: CompetencyWithGroup[] = competencyRows.map((row) => ({
      competencyId: row.competencyId,
      competencyName: row.competencyName,
      competencyOrder: row.competencyOrder,
      groupId: row.groupId,
      groupName: row.groupName,
      groupWeight: row.groupWeight,
      groupOrder: row.groupOrder,
    }));

    const competencyIds = typedCompetencies.map((item) => item.competencyId);
    const indicatorRows = await db
      .select({
        competencyId: competencyIndicators.competencyId,
        indicatorId: competencyIndicators.id,
        indicatorOrder: competencyIndicators.order,
      })
      .from(competencyIndicators)
      .where(inArray(competencyIndicators.competencyId, competencyIds))
      .orderBy(competencyIndicators.competencyId, competencyIndicators.order);

    const indicatorIdsByCompetency = new Map<string, string[]>();
    for (const row of indicatorRows) {
      const ids = indicatorIdsByCompetency.get(row.competencyId) ?? [];
      ids.push(row.indicatorId);
      indicatorIdsByCompetency.set(row.competencyId, ids);
    }

    const questionnaireRows = await db
      .select({
        questionnaireId: questionnaires.id,
        raterEmployeeId: questionnaires.raterEmployeeId,
        draftPayload: questionnaires.draftPayload,
        raterRole: campaignAssignments.raterRole,
      })
      .from(questionnaires)
      .leftJoin(
        campaignAssignments,
        and(
          eq(campaignAssignments.campaignId, questionnaires.campaignId),
          eq(campaignAssignments.subjectEmployeeId, questionnaires.subjectEmployeeId),
          eq(campaignAssignments.raterEmployeeId, questionnaires.raterEmployeeId),
        ),
      )
      .where(
        and(
          eq(questionnaires.companyId, campaign.companyId),
          eq(questionnaires.campaignId, campaign.campaignId),
          eq(questionnaires.subjectEmployeeId, input.subjectEmployeeId),
          eq(questionnaires.status, "submitted"),
        ),
      );

    const submittedCountByGroup = new Map<ResultsGroupKey, number>();
    const aggregateByGroupCompetency = new Map<
      string,
      {
        sum: number;
        ratersWithScore: number;
      }
    >();
    const raterScores: ResultsGetHrViewOutput["raterScores"] = [];

    for (const row of questionnaireRows) {
      const mappedGroup = row.raterRole ? assignmentRoleToResultsGroup(row.raterRole) : undefined;
      if (!mappedGroup) {
        continue;
      }

      submittedCountByGroup.set(mappedGroup, (submittedCountByGroup.get(mappedGroup) ?? 0) + 1);

      const payload =
        typeof row.draftPayload === "object" &&
        row.draftPayload !== null &&
        !Array.isArray(row.draftPayload)
          ? (row.draftPayload as Record<string, unknown>)
          : {};

      for (const competency of typedCompetencies) {
        const indicatorIds = indicatorIdsByCompetency.get(competency.competencyId) ?? [];
        const numericScores: number[] = [];

        for (const indicatorId of indicatorIds) {
          const value = getIndicatorValue(payload, competency.competencyId, indicatorId);
          if (value !== undefined) {
            numericScores.push(value);
          }
        }

        const score =
          numericScores.length > 0
            ? roundScore(
                numericScores.reduce((sum, value) => sum + value, 0) / numericScores.length,
              )
            : undefined;

        raterScores.push({
          raterEmployeeId: row.raterEmployeeId,
          group: mappedGroup,
          competencyId: competency.competencyId,
          ...(score !== undefined ? { score } : {}),
          validIndicatorCount: numericScores.length,
          totalIndicatorCount: indicatorIds.length,
        });

        if (score === undefined) {
          continue;
        }

        const aggregateKey = `${mappedGroup}:${competency.competencyId}`;
        const aggregate = aggregateByGroupCompetency.get(aggregateKey) ?? {
          sum: 0,
          ratersWithScore: 0,
        };
        aggregate.sum += score;
        aggregate.ratersWithScore += 1;
        aggregateByGroupCompetency.set(aggregateKey, aggregate);
      }
    }

    const competencyScores: ResultsGetHrViewOutput["competencyScores"] = typedCompetencies.map(
      (competency) => {
        const managerAggregate = aggregateByGroupCompetency.get(
          `manager:${competency.competencyId}`,
        );
        const peersAggregate = aggregateByGroupCompetency.get(`peers:${competency.competencyId}`);
        const subordinatesAggregate = aggregateByGroupCompetency.get(
          `subordinates:${competency.competencyId}`,
        );
        const selfAggregate = aggregateByGroupCompetency.get(`self:${competency.competencyId}`);

        const managerScore =
          managerAggregate && managerAggregate.ratersWithScore > 0
            ? roundScore(managerAggregate.sum / managerAggregate.ratersWithScore)
            : undefined;
        const peersScore =
          peersAggregate && peersAggregate.ratersWithScore > 0
            ? roundScore(peersAggregate.sum / peersAggregate.ratersWithScore)
            : undefined;
        const subordinatesScore =
          subordinatesAggregate && subordinatesAggregate.ratersWithScore > 0
            ? roundScore(subordinatesAggregate.sum / subordinatesAggregate.ratersWithScore)
            : undefined;
        const selfScore =
          selfAggregate && selfAggregate.ratersWithScore > 0
            ? roundScore(selfAggregate.sum / selfAggregate.ratersWithScore)
            : undefined;

        return {
          competencyId: competency.competencyId,
          competencyName: competency.competencyName,
          groupId: competency.groupId,
          groupName: competency.groupName,
          ...(managerScore !== undefined ? { managerScore } : {}),
          managerRaters: managerAggregate?.ratersWithScore ?? 0,
          ...(peersScore !== undefined ? { peersScore } : {}),
          peersRaters: peersAggregate?.ratersWithScore ?? 0,
          ...(subordinatesScore !== undefined ? { subordinatesScore } : {}),
          subordinatesRaters: subordinatesAggregate?.ratersWithScore ?? 0,
          ...(selfScore !== undefined ? { selfScore } : {}),
          selfRaters: selfAggregate?.ratersWithScore ?? 0,
        };
      },
    );

    const groupOverall: ResultsGetHrViewOutput["groupOverall"] = {};
    const groupKeys: ResultsGroupKey[] = ["manager", "peers", "subordinates", "self"];
    for (const groupKey of groupKeys) {
      let weightedSum = 0;
      let weightSum = 0;

      for (const competency of typedCompetencies) {
        const aggregate = aggregateByGroupCompetency.get(`${groupKey}:${competency.competencyId}`);
        if (!aggregate || aggregate.ratersWithScore === 0) {
          continue;
        }

        const groupCompetencyScore = aggregate.sum / aggregate.ratersWithScore;
        weightedSum += groupCompetencyScore * competency.groupWeight;
        weightSum += competency.groupWeight;
      }

      if (weightSum > 0) {
        groupOverall[groupKey] = roundScore(weightedSum / weightSum);
      }
    }

    const sortedRaterScores = [...raterScores].sort((left, right) => {
      if (groupOrder[left.group] !== groupOrder[right.group]) {
        return groupOrder[left.group] - groupOrder[right.group];
      }
      if (left.raterEmployeeId !== right.raterEmployeeId) {
        return left.raterEmployeeId.localeCompare(right.raterEmployeeId);
      }
      return left.competencyId.localeCompare(right.competencyId);
    });

    return {
      campaignId: campaign.campaignId,
      companyId: campaign.companyId,
      subjectEmployeeId: input.subjectEmployeeId,
      modelVersionId: model.modelVersionId,
      modelKind: "indicators",
      competencyScores,
      raterScores: sortedRaterScores,
      groupOverall,
    };
  } finally {
    await pool.end();
  }
};

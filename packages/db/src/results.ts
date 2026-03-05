import {
  type ResultsGetHrViewOutput,
  type ResultsGroupKey,
  type ResultsGroupVisibilityState,
  type ResultsHrViewGroupVisibility,
  type ResultsHrViewGroupWeights,
  type ResultsHrViewLevelSummary,
  type ResultsOpenTextItem,
  type SmallGroupPolicy,
  createOperationError,
} from "@feedback-360/api-contract";
import { and, eq, inArray } from "drizzle-orm";

import { createDb, createPool } from "./db";
import {
  campaignAssignments,
  campaignEmployeeSnapshots,
  campaigns,
  competencies,
  competencyGroups,
  competencyIndicators,
  competencyModelVersions,
  employeeUserLinks,
  questionnaires,
} from "./schema";

const groupOrder: Record<ResultsGroupKey, number> = {
  manager: 1,
  peers: 2,
  subordinates: 3,
  self: 4,
};

const openTextGroupOrder: Record<ResultsOpenTextItem["group"], number> = {
  manager: 1,
  peers: 2,
  subordinates: 3,
  self: 4,
  other: 5,
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

const getLevelValue = (
  payload: Record<string, unknown>,
  competencyId: string,
): number | "UNSURE" | undefined => {
  const levelResponses = payload.levelResponses;
  if (
    typeof levelResponses !== "object" ||
    levelResponses === null ||
    Array.isArray(levelResponses)
  ) {
    return undefined;
  }

  const rawValue = (levelResponses as Record<string, unknown>)[competencyId];
  if (rawValue === "UNSURE") {
    return "UNSURE";
  }
  if (
    typeof rawValue === "number" &&
    Number.isInteger(rawValue) &&
    rawValue >= 1 &&
    rawValue <= 4
  ) {
    return rawValue;
  }

  return undefined;
};

const getCommentBundle = (
  payload: Record<string, unknown>,
  competencyId: string,
): {
  rawText?: string;
  processedText?: string;
  summaryText?: string;
} => {
  const competencyComments = payload.competencyComments;
  if (
    typeof competencyComments !== "object" ||
    competencyComments === null ||
    Array.isArray(competencyComments)
  ) {
    return {};
  }

  const commentByCompetency = (competencyComments as Record<string, unknown>)[competencyId];
  if (
    typeof commentByCompetency !== "object" ||
    commentByCompetency === null ||
    Array.isArray(commentByCompetency)
  ) {
    return {};
  }

  const record = commentByCompetency as Record<string, unknown>;
  const rawText = typeof record.rawText === "string" ? record.rawText.trim() : undefined;
  const processedText =
    typeof record.processedText === "string" ? record.processedText.trim() : undefined;
  const summaryText =
    typeof record.summaryText === "string" ? record.summaryText.trim() : undefined;

  return {
    ...(rawText ? { rawText } : {}),
    ...(processedText ? { processedText } : {}),
    ...(summaryText ? { summaryText } : {}),
  };
};

export type GetResultsHrViewInput = {
  companyId: string;
  campaignId: string;
  subjectEmployeeId: string;
  smallGroupPolicy?: SmallGroupPolicy;
  anonymityThreshold?: number;
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

const defaultAnonymityThreshold = 3;
const defaultSmallGroupPolicy: SmallGroupPolicy = "hide";

const hiddenGroupVisibility = (smallGroupPolicy: SmallGroupPolicy): ResultsGroupVisibilityState => {
  return smallGroupPolicy === "merge_to_other" ? "merged" : "hidden";
};

const buildZeroGroupWeights = (): ResultsHrViewGroupWeights => {
  return {
    manager: 0,
    peers: 0,
    subordinates: 0,
    self: 0,
    other: 0,
  };
};

const buildEffectiveGroupWeights = (params: {
  configured: ResultsHrViewGroupWeights;
  groupVisibility: ResultsHrViewGroupVisibility;
  groupOverall: ResultsGetHrViewOutput["groupOverall"];
}): ResultsHrViewGroupWeights => {
  const { configured, groupVisibility, groupOverall } = params;
  const effective = buildZeroGroupWeights();

  const managerBase =
    groupVisibility.manager === "shown" && groupOverall.manager !== undefined
      ? configured.manager
      : 0;
  const peersBase =
    groupVisibility.peers === "shown" && groupOverall.peers !== undefined ? configured.peers : 0;
  const subordinatesBase =
    groupVisibility.subordinates === "shown" && groupOverall.subordinates !== undefined
      ? configured.subordinates
      : 0;
  const otherBase =
    groupVisibility.other === "shown" && groupOverall.other !== undefined
      ? (groupVisibility.peers === "merged" ? configured.peers : 0) +
        (groupVisibility.subordinates === "merged" ? configured.subordinates : 0)
      : 0;

  const allBaseEntries: Array<{ key: keyof ResultsHrViewGroupWeights; weight: number }> = [
    { key: "manager", weight: managerBase },
    { key: "peers", weight: peersBase },
    { key: "subordinates", weight: subordinatesBase },
    { key: "other", weight: otherBase },
  ];
  const baseEntries: Array<{ key: keyof ResultsHrViewGroupWeights; weight: number }> = [];
  for (const entry of allBaseEntries) {
    if (entry.weight > 0) {
      baseEntries.push(entry);
    }
  }

  if (baseEntries.length === 0) {
    return effective;
  }

  if (baseEntries.length === 1) {
    const onlyEntry = baseEntries[0];
    if (!onlyEntry) {
      return effective;
    }
    effective[onlyEntry.key] = 100;
    return effective;
  }

  if (baseEntries.length === 2) {
    for (const entry of baseEntries) {
      effective[entry.key] = 50;
    }
    return effective;
  }

  const totalBase = baseEntries.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalBase <= 0) {
    return effective;
  }

  for (const entry of baseEntries) {
    effective[entry.key] = roundScore((entry.weight / totalBase) * 100);
  }

  return effective;
};

type LevelSummaryState = {
  level1: number;
  level2: number;
  level3: number;
  level4: number;
  nUnsure: number;
};

const buildEmptyLevelSummaryState = (): LevelSummaryState => {
  return {
    level1: 0,
    level2: 0,
    level3: 0,
    level4: 0,
    nUnsure: 0,
  };
};

const mergeLevelSummaryStates = (
  states: Array<LevelSummaryState | undefined>,
): LevelSummaryState => {
  return states.reduce<LevelSummaryState>((accumulator, state) => {
    if (!state) {
      return accumulator;
    }

    accumulator.level1 += state.level1;
    accumulator.level2 += state.level2;
    accumulator.level3 += state.level3;
    accumulator.level4 += state.level4;
    accumulator.nUnsure += state.nUnsure;
    return accumulator;
  }, buildEmptyLevelSummaryState());
};

const buildLevelSummary = (state: LevelSummaryState | undefined): ResultsHrViewLevelSummary => {
  const safeState = state ?? buildEmptyLevelSummaryState();
  const levelEntries: Array<{ level: 1 | 2 | 3 | 4; count: number }> = [
    { level: 1, count: safeState.level1 },
    { level: 2, count: safeState.level2 },
    { level: 3, count: safeState.level3 },
    { level: 4, count: safeState.level4 },
  ];
  const nValid = levelEntries.reduce((sum, entry) => sum + entry.count, 0);
  const maxCount = levelEntries.reduce((max, entry) => Math.max(max, entry.count), 0);

  let modeLevel: 1 | 2 | 3 | 4 | null = null;
  if (nValid > 0 && maxCount > 0) {
    const modes = levelEntries.filter((entry) => entry.count === maxCount);
    if (modes.length === 1) {
      modeLevel = modes[0]?.level ?? null;
    }
  }

  return {
    modeLevel,
    distribution: {
      level1: safeState.level1,
      level2: safeState.level2,
      level3: safeState.level3,
      level4: safeState.level4,
    },
    nValid,
    nUnsure: safeState.nUnsure,
  };
};

const buildOpenTextItem = (params: {
  competencyId: string;
  group: ResultsOpenTextItem["group"];
  entry: {
    rawTexts: string[];
    processedTexts: string[];
    summaryTexts: string[];
  };
}): ResultsOpenTextItem => {
  const { competencyId, group, entry } = params;
  const count = Math.max(
    entry.rawTexts.length,
    entry.processedTexts.length,
    entry.summaryTexts.length,
  );

  return {
    competencyId,
    group,
    count,
    ...(entry.rawTexts.length > 0 ? { rawText: entry.rawTexts.join("\n\n") } : {}),
    ...(entry.processedTexts.length > 0
      ? { processedText: entry.processedTexts.join("\n\n") }
      : {}),
    ...(entry.summaryTexts.length > 0 ? { summaryText: entry.summaryTexts.join("\n\n") } : {}),
  };
};

export const getResultsHrView = async (
  input: GetResultsHrViewInput,
): Promise<ResultsGetHrViewOutput> => {
  const pool = createPool();

  try {
    const db = createDb(pool);
    const smallGroupPolicy = input.smallGroupPolicy ?? defaultSmallGroupPolicy;
    const anonymityThreshold = input.anonymityThreshold ?? defaultAnonymityThreshold;

    const campaignRows = await db
      .select({
        campaignId: campaigns.id,
        companyId: campaigns.companyId,
        modelVersionId: campaigns.modelVersionId,
        managerWeight: campaigns.managerWeight,
        peersWeight: campaigns.peersWeight,
        subordinatesWeight: campaigns.subordinatesWeight,
        selfWeight: campaigns.selfWeight,
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
        "Campaign has no competency model and cannot produce results.",
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

    if (model.kind !== "indicators" && model.kind !== "levels") {
      throw createOperationError("invalid_input", "Unsupported model kind for results.", {
        campaignId: input.campaignId,
        modelKind: model.kind,
      });
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
    const groupWeightByCompetency = new Map(
      typedCompetencies.map((item) => [item.competencyId, item.groupWeight]),
    );

    const competencyIds = typedCompetencies.map((item) => item.competencyId);
    const indicatorIdsByCompetency = new Map<string, string[]>();
    if (model.kind === "indicators") {
      const indicatorRows = await db
        .select({
          competencyId: competencyIndicators.competencyId,
          indicatorId: competencyIndicators.id,
          indicatorOrder: competencyIndicators.order,
        })
        .from(competencyIndicators)
        .where(inArray(competencyIndicators.competencyId, competencyIds))
        .orderBy(competencyIndicators.competencyId, competencyIndicators.order);

      for (const row of indicatorRows) {
        const ids = indicatorIdsByCompetency.get(row.competencyId) ?? [];
        ids.push(row.indicatorId);
        indicatorIdsByCompetency.set(row.competencyId, ids);
      }
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
    const levelSummaryByGroupCompetency = new Map<string, LevelSummaryState>();
    const scoredRowsByGroupCompetency = new Map<
      string,
      Array<{
        raterEmployeeId: string;
        score: number;
      }>
    >();
    const openTextByGroupCompetency = new Map<
      string,
      {
        rawTexts: string[];
        processedTexts: string[];
        summaryTexts: string[];
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
        const commentBundle = getCommentBundle(payload, competency.competencyId);
        if (
          commentBundle.rawText !== undefined ||
          commentBundle.processedText !== undefined ||
          commentBundle.summaryText !== undefined
        ) {
          const openTextKey = `${mappedGroup}:${competency.competencyId}`;
          const entry = openTextByGroupCompetency.get(openTextKey) ?? {
            rawTexts: [],
            processedTexts: [],
            summaryTexts: [],
          };
          if (commentBundle.rawText) {
            entry.rawTexts.push(commentBundle.rawText);
          }
          if (commentBundle.processedText) {
            entry.processedTexts.push(commentBundle.processedText);
          }
          if (commentBundle.summaryText) {
            entry.summaryTexts.push(commentBundle.summaryText);
          }
          openTextByGroupCompetency.set(openTextKey, entry);
        }

        let score: number | undefined;
        let validScoreCount = 0;
        let totalScoreCount = 0;

        if (model.kind === "indicators") {
          const indicatorIds = indicatorIdsByCompetency.get(competency.competencyId) ?? [];
          const numericScores: number[] = [];
          totalScoreCount = indicatorIds.length;

          for (const indicatorId of indicatorIds) {
            const value = getIndicatorValue(payload, competency.competencyId, indicatorId);
            if (value !== undefined) {
              numericScores.push(value);
            }
          }

          validScoreCount = numericScores.length;
          score =
            numericScores.length > 0
              ? roundScore(
                  numericScores.reduce((sum, value) => sum + value, 0) / numericScores.length,
                )
              : undefined;
        } else {
          totalScoreCount = 1;
          const levelValue = getLevelValue(payload, competency.competencyId);
          if (typeof levelValue === "number") {
            score = levelValue;
            validScoreCount = 1;

            const levelSummaryKey = `${mappedGroup}:${competency.competencyId}`;
            const existing = levelSummaryByGroupCompetency.get(levelSummaryKey) ?? {
              level1: 0,
              level2: 0,
              level3: 0,
              level4: 0,
              nUnsure: 0,
            };
            if (levelValue === 1) {
              existing.level1 += 1;
            } else if (levelValue === 2) {
              existing.level2 += 1;
            } else if (levelValue === 3) {
              existing.level3 += 1;
            } else if (levelValue === 4) {
              existing.level4 += 1;
            }
            levelSummaryByGroupCompetency.set(levelSummaryKey, existing);
          } else if (levelValue === "UNSURE") {
            const levelSummaryKey = `${mappedGroup}:${competency.competencyId}`;
            const existing = levelSummaryByGroupCompetency.get(levelSummaryKey) ?? {
              level1: 0,
              level2: 0,
              level3: 0,
              level4: 0,
              nUnsure: 0,
            };
            existing.nUnsure += 1;
            levelSummaryByGroupCompetency.set(levelSummaryKey, existing);
          }
        }

        raterScores.push({
          raterEmployeeId: row.raterEmployeeId,
          group: mappedGroup,
          competencyId: competency.competencyId,
          ...(score !== undefined ? { score } : {}),
          validIndicatorCount: validScoreCount,
          totalIndicatorCount: totalScoreCount,
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

        const scoredRows = scoredRowsByGroupCompetency.get(aggregateKey) ?? [];
        scoredRows.push({
          raterEmployeeId: row.raterEmployeeId,
          score,
        });
        scoredRowsByGroupCompetency.set(aggregateKey, scoredRows);
      }
    }

    const peersSubmitted = submittedCountByGroup.get("peers") ?? 0;
    const subordinatesSubmitted = submittedCountByGroup.get("subordinates") ?? 0;
    const peersGroupVisibility: ResultsGroupVisibilityState =
      peersSubmitted >= anonymityThreshold ? "shown" : hiddenGroupVisibility(smallGroupPolicy);
    const subordinatesGroupVisibility: ResultsGroupVisibilityState =
      subordinatesSubmitted >= anonymityThreshold
        ? "shown"
        : hiddenGroupVisibility(smallGroupPolicy);

    const shouldCalculateOtherVisibility =
      smallGroupPolicy === "merge_to_other" &&
      (peersGroupVisibility === "merged" || subordinatesGroupVisibility === "merged");
    const mergedSubmittedCount =
      (peersGroupVisibility === "merged" ? peersSubmitted : 0) +
      (subordinatesGroupVisibility === "merged" ? subordinatesSubmitted : 0);

    const groupVisibility: ResultsHrViewGroupVisibility = {
      manager: "shown",
      peers: peersGroupVisibility,
      subordinates: subordinatesGroupVisibility,
      self: "shown",
      ...(shouldCalculateOtherVisibility
        ? {
            other:
              mergedSubmittedCount >= anonymityThreshold ? ("shown" as const) : ("hidden" as const),
          }
        : {}),
    };

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
        const managerLevelSummary = levelSummaryByGroupCompetency.get(
          `manager:${competency.competencyId}`,
        );
        const peersLevelSummary = levelSummaryByGroupCompetency.get(
          `peers:${competency.competencyId}`,
        );
        const subordinatesLevelSummary = levelSummaryByGroupCompetency.get(
          `subordinates:${competency.competencyId}`,
        );
        const selfLevelSummary = levelSummaryByGroupCompetency.get(
          `self:${competency.competencyId}`,
        );

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

        const peersVisibility: ResultsGroupVisibilityState =
          peersGroupVisibility === "shown" &&
          (peersAggregate?.ratersWithScore ?? 0) >= anonymityThreshold
            ? "shown"
            : hiddenGroupVisibility(smallGroupPolicy);
        const subordinatesVisibility: ResultsGroupVisibilityState =
          subordinatesGroupVisibility === "shown" &&
          (subordinatesAggregate?.ratersWithScore ?? 0) >= anonymityThreshold
            ? "shown"
            : hiddenGroupVisibility(smallGroupPolicy);

        const hasMergedCompetency =
          smallGroupPolicy === "merge_to_other" &&
          (peersVisibility === "merged" || subordinatesVisibility === "merged");
        const mergedRows = [
          ...(peersVisibility === "merged"
            ? (scoredRowsByGroupCompetency.get(`peers:${competency.competencyId}`) ?? [])
            : []),
          ...(subordinatesVisibility === "merged"
            ? (scoredRowsByGroupCompetency.get(`subordinates:${competency.competencyId}`) ?? [])
            : []),
        ];
        const otherRaters = mergedRows.length;
        const otherVisibility =
          hasMergedCompetency && otherRaters >= anonymityThreshold
            ? ("shown" as const)
            : hasMergedCompetency
              ? ("hidden" as const)
              : undefined;
        const otherScore =
          otherVisibility === "shown" && otherRaters > 0
            ? roundScore(mergedRows.reduce((sum, row) => sum + row.score, 0) / mergedRows.length)
            : undefined;
        const otherLevelSummary = hasMergedCompetency
          ? mergeLevelSummaryStates([
              peersVisibility === "merged" ? peersLevelSummary : undefined,
              subordinatesVisibility === "merged" ? subordinatesLevelSummary : undefined,
            ])
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
          ...(otherScore !== undefined ? { otherScore } : {}),
          otherRaters,
          managerVisibility: "shown",
          peersVisibility,
          subordinatesVisibility,
          selfVisibility: "shown",
          ...(otherVisibility ? { otherVisibility } : {}),
          ...(model.kind === "levels"
            ? {
                managerLevels: buildLevelSummary(managerLevelSummary),
                peersLevels: buildLevelSummary(peersLevelSummary),
                subordinatesLevels: buildLevelSummary(subordinatesLevelSummary),
                selfLevels: buildLevelSummary(selfLevelSummary),
                ...(otherLevelSummary ? { otherLevels: buildLevelSummary(otherLevelSummary) } : {}),
              }
            : {}),
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

    if (groupVisibility.other === "shown") {
      let weightedSum = 0;
      let weightSum = 0;

      for (const competency of competencyScores) {
        if (competency.otherVisibility !== "shown" || competency.otherScore === undefined) {
          continue;
        }

        const weight = groupWeightByCompetency.get(competency.competencyId) ?? 0;
        if (weight <= 0) {
          continue;
        }

        weightedSum += competency.otherScore * weight;
        weightSum += weight;
      }

      if (weightSum > 0) {
        groupOverall.other = roundScore(weightedSum / weightSum);
      }
    }

    const openTextItems: ResultsOpenTextItem[] = [];
    for (const competency of typedCompetencies) {
      const groups: Array<ResultsGroupKey> = ["manager", "peers", "subordinates", "self"];
      for (const group of groups) {
        const entry = openTextByGroupCompetency.get(`${group}:${competency.competencyId}`);
        if (!entry) {
          continue;
        }
        openTextItems.push(
          buildOpenTextItem({
            competencyId: competency.competencyId,
            group,
            entry,
          }),
        );
      }

      if (smallGroupPolicy === "merge_to_other") {
        const peersMerged = groupVisibility.peers === "merged";
        const subordinatesMerged = groupVisibility.subordinates === "merged";
        if (peersMerged || subordinatesMerged) {
          const peersEntry = peersMerged
            ? openTextByGroupCompetency.get(`peers:${competency.competencyId}`)
            : undefined;
          const subordinatesEntry = subordinatesMerged
            ? openTextByGroupCompetency.get(`subordinates:${competency.competencyId}`)
            : undefined;

          const mergedOpenTextEntry = {
            rawTexts: [...(peersEntry?.rawTexts ?? []), ...(subordinatesEntry?.rawTexts ?? [])],
            processedTexts: [
              ...(peersEntry?.processedTexts ?? []),
              ...(subordinatesEntry?.processedTexts ?? []),
            ],
            summaryTexts: [
              ...(peersEntry?.summaryTexts ?? []),
              ...(subordinatesEntry?.summaryTexts ?? []),
            ],
          };
          if (
            mergedOpenTextEntry.rawTexts.length > 0 ||
            mergedOpenTextEntry.processedTexts.length > 0 ||
            mergedOpenTextEntry.summaryTexts.length > 0
          ) {
            openTextItems.push(
              buildOpenTextItem({
                competencyId: competency.competencyId,
                group: "other",
                entry: mergedOpenTextEntry,
              }),
            );
          }
        }
      }
    }

    const sortedOpenTextItems = openTextItems.sort((left, right) => {
      if (left.competencyId !== right.competencyId) {
        const leftOrder =
          typedCompetencies.find((item) => item.competencyId === left.competencyId)
            ?.competencyOrder ?? Number.MAX_SAFE_INTEGER;
        const rightOrder =
          typedCompetencies.find((item) => item.competencyId === right.competencyId)
            ?.competencyOrder ?? Number.MAX_SAFE_INTEGER;
        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }
        return left.competencyId.localeCompare(right.competencyId);
      }

      return openTextGroupOrder[left.group] - openTextGroupOrder[right.group];
    });

    const configuredGroupWeights: ResultsHrViewGroupWeights = {
      manager: campaign.managerWeight,
      peers: campaign.peersWeight,
      subordinates: campaign.subordinatesWeight,
      self: 0,
      other: 0,
    };
    const effectiveGroupWeights = buildEffectiveGroupWeights({
      configured: configuredGroupWeights,
      groupVisibility,
      groupOverall,
    });

    const weightedGroups: Array<{ score: number; weight: number }> = [
      { score: groupOverall.manager ?? Number.NaN, weight: effectiveGroupWeights.manager },
      { score: groupOverall.peers ?? Number.NaN, weight: effectiveGroupWeights.peers },
      {
        score: groupOverall.subordinates ?? Number.NaN,
        weight: effectiveGroupWeights.subordinates,
      },
      { score: groupOverall.other ?? Number.NaN, weight: effectiveGroupWeights.other },
    ].filter((entry) => entry.weight > 0 && Number.isFinite(entry.score));

    const overallScore =
      weightedGroups.length > 0
        ? roundScore(
            weightedGroups.reduce((sum, entry) => sum + entry.score * entry.weight, 0) /
              weightedGroups.reduce((sum, entry) => sum + entry.weight, 0),
          )
        : undefined;

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
      modelKind: model.kind,
      anonymityThreshold,
      smallGroupPolicy,
      groupVisibility,
      competencyScores,
      raterScores: sortedRaterScores,
      groupOverall,
      configuredGroupWeights,
      effectiveGroupWeights,
      ...(overallScore !== undefined ? { overallScore } : {}),
      ...(sortedOpenTextItems.length > 0 ? { openText: sortedOpenTextItems } : {}),
    };
  } finally {
    await pool.end();
  }
};

export const getEmployeeIdByUserInCompany = async (input: {
  companyId: string;
  userId: string;
}): Promise<string | undefined> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    const rows = await db
      .select({
        employeeId: employeeUserLinks.employeeId,
      })
      .from(employeeUserLinks)
      .where(
        and(
          eq(employeeUserLinks.companyId, input.companyId),
          eq(employeeUserLinks.userId, input.userId),
        ),
      )
      .limit(1);

    return rows[0]?.employeeId;
  } finally {
    await pool.end();
  }
};

export const isCampaignSubjectManagedByEmployee = async (input: {
  companyId: string;
  campaignId: string;
  subjectEmployeeId: string;
  managerEmployeeId: string;
}): Promise<boolean> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    const rows = await db
      .select({
        employeeId: campaignEmployeeSnapshots.employeeId,
      })
      .from(campaignEmployeeSnapshots)
      .where(
        and(
          eq(campaignEmployeeSnapshots.companyId, input.companyId),
          eq(campaignEmployeeSnapshots.campaignId, input.campaignId),
          eq(campaignEmployeeSnapshots.employeeId, input.subjectEmployeeId),
          eq(campaignEmployeeSnapshots.managerEmployeeId, input.managerEmployeeId),
        ),
      )
      .limit(1);

    return rows.length > 0;
  } finally {
    await pool.end();
  }
};

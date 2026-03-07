import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import { createInprocClient } from "@feedback-360/client";
import { chromium, expect } from "@playwright/test";

import { issueXeActorStorageState } from "../auth";
import { EmployeeResultsPagePom, HrResultsPagePom, ManagerResultsPagePom } from "../pom/results";
import {
  applyXeSeed,
  getXeRunRegistry,
  listXeRunNotifications,
  updateXeRunRegistry,
} from "../run-registry";
import { loadScenarioFixture } from "../scenario-fixtures";
import type { XePhaseContext, XePhaseResult } from "../types";
import { writeXeArtifactJson } from "../workspace";

type AnswersFixture = {
  actors: Record<
    string,
    {
      competencies: Record<
        string,
        {
          indicatorValues: Array<1 | 2 | 3 | 4 | 5 | "NA">;
          comment: string;
        }
      >;
      finalComment: string;
    }
  >;
};

type ExpectedResultsFixture = {
  overallScore: number;
  groupOverall: {
    manager: number;
    peers: number;
    subordinates: number;
    self: number;
  };
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
};

const createActorClient = (run: Awaited<ReturnType<typeof getXeRunRegistry>>, actor: string) => {
  const company = asRecord(run.bindings).company as { id?: string };
  const actors = asRecord(run.bindings).actors as Record<
    string,
    { userId?: string; employeeId?: string; role?: string }
  >;
  const actorBinding = actors[actor];
  if (!company?.id || !actorBinding?.userId || !actorBinding?.employeeId || !actorBinding.role) {
    throw new Error(`Missing actor binding for ${actor}.`);
  }

  const client = createInprocClient();
  client.setActiveCompany(company.id);
  client.setActiveContext({
    companyId: company.id,
    userId: actorBinding.userId,
    employeeId: actorBinding.employeeId,
    role: actorBinding.role as "hr_admin" | "manager" | "employee" | "hr_reader",
  });
  return client;
};

const savePhaseArtifact = async (
  ctx: XePhaseContext,
  relativePath: string,
  value: unknown,
): Promise<string> => {
  await writeXeArtifactJson(ctx.phaseWorkspacePath, relativePath, value);
  return join(ctx.phaseWorkspacePath, relativePath);
};

export const runXe001PhaseSeed = async (ctx: XePhaseContext): Promise<XePhaseResult> => {
  const bindings = await applyXeSeed({
    runId: ctx.run.runId,
    seedHandle: "XE-001-first-campaign",
  });
  await writeXeArtifactJson(ctx.phaseWorkspacePath, "seed-summary.json", {
    companyId: bindings.company?.id,
    campaignId: bindings.campaign?.id,
    actorCount: Object.keys(bindings.actors ?? {}).length,
  });
  return {
    bindings: bindings as Record<string, unknown>,
    artifacts: [
      {
        label: "seed-summary",
        path: join(ctx.phaseWorkspacePath, "seed-summary.json"),
      },
    ],
  };
};

export const runXe001PhaseStartCampaign = async (ctx: XePhaseContext): Promise<XePhaseResult> => {
  const run = await getXeRunRegistry(ctx.run.runId);
  const campaignId = (asRecord(run.bindings).campaign as { id?: string })?.id;
  if (!campaignId) {
    throw new Error("XE run has no seeded campaign.");
  }

  const hrClient = createActorClient(run, "hr_admin");
  const startResult = await hrClient.campaignStart({ campaignId });
  if (!startResult.ok) {
    throw new Error(startResult.error.message);
  }

  const notifications = await listXeRunNotifications(ctx.run.runId);
  await savePhaseArtifact(ctx, "campaign.json", startResult.data);
  await savePhaseArtifact(ctx, "notifications.json", notifications);
  return {
    artifacts: [
      { label: "campaign", path: join(ctx.phaseWorkspacePath, "campaign.json") },
      { label: "notifications", path: join(ctx.phaseWorkspacePath, "notifications.json") },
    ],
  };
};

export const runXe001PhaseBootstrapSessions = async (
  ctx: XePhaseContext,
): Promise<XePhaseResult> => {
  const run = await getXeRunRegistry(ctx.run.runId);
  const actors = Object.keys(asRecord(asRecord(run.bindings).actors));
  const outputs = [] as Array<Record<string, unknown>>;
  for (const actor of actors) {
    const issued = await issueXeActorStorageState({
      runId: ctx.run.runId,
      actor,
      baseUrl: ctx.baseUrl,
    });
    outputs.push(issued);
  }

  await savePhaseArtifact(ctx, "sessions.json", { items: outputs });
  return {
    artifacts: [{ label: "sessions", path: join(ctx.phaseWorkspacePath, "sessions.json") }],
  };
};

export const runXe001PhaseFillQuestionnaires = async (
  ctx: XePhaseContext,
): Promise<XePhaseResult> => {
  const run = await getXeRunRegistry(ctx.run.runId);
  const campaignId = (asRecord(run.bindings).campaign as { id?: string })?.id;
  const actors = asRecord(run.bindings).actors as Record<string, { employeeId?: string }>;
  const competencies = asRecord(run.bindings).competencies as Record<
    string,
    { competencyId?: string; indicatorIds?: string[] }
  >;
  if (!campaignId) {
    throw new Error("Campaign binding missing.");
  }

  const answers = await loadScenarioFixture<AnswersFixture>(
    ctx.scenario.scenarioId,
    "answers.json",
  );
  const summary: Array<Record<string, unknown>> = [];
  const hrClient = createActorClient(run, "hr_admin");
  const allQuestionnairesResult = await hrClient.questionnaireListAssigned({ campaignId });
  if (!allQuestionnairesResult.ok) {
    throw new Error(allQuestionnairesResult.error.message);
  }

  const questionnaireByRaterEmployeeId = new Map(
    allQuestionnairesResult.data.items.map((item) => [item.raterEmployeeId, item.questionnaireId]),
  );

  for (const actor of [
    "subject",
    "manager",
    "peer_1",
    "peer_2",
    "peer_3",
    "subordinate_1",
    "subordinate_2",
    "subordinate_3",
  ]) {
    const actorAnswers = answers.actors[actor];
    if (!actorAnswers) {
      throw new Error(`Answers fixture is missing actor ${actor}.`);
    }
    const actorEmployeeId = actors[actor]?.employeeId;
    if (!actorEmployeeId) {
      throw new Error(`Actor binding is missing employeeId for ${actor}.`);
    }

    const questionnaireId = questionnaireByRaterEmployeeId.get(actorEmployeeId);
    if (!questionnaireId) {
      throw new Error(`Expected questionnaire binding for actor ${actor}.`);
    }

    const client = createActorClient(run, actor);

    const draftPayload = {
      indicatorResponses: Object.fromEntries(
        Object.entries(actorAnswers.competencies).map(([competencyKey, competencyAnswer]) => {
          const competencyBinding = competencies[competencyKey];
          if (!competencyBinding?.competencyId || !competencyBinding.indicatorIds) {
            throw new Error(`Missing competency binding for ${competencyKey}.`);
          }

          return [
            competencyBinding.competencyId,
            Object.fromEntries(
              competencyBinding.indicatorIds.map((indicatorId, index) => {
                const value = competencyAnswer.indicatorValues[index];
                if (value === undefined) {
                  throw new Error(
                    `Missing indicator value for ${actor}:${competencyKey}:${index}.`,
                  );
                }
                return [indicatorId, value === "NA" ? "NA" : value];
              }),
            ),
          ];
        }),
      ),
      competencyComments: Object.fromEntries(
        Object.entries(actorAnswers.competencies).map(([competencyKey, competencyAnswer]) => {
          const competencyBinding = competencies[competencyKey];
          if (!competencyBinding?.competencyId) {
            throw new Error(`Missing competency binding for ${competencyKey}.`);
          }
          return [
            competencyBinding.competencyId,
            {
              rawText: competencyAnswer.comment,
            },
          ];
        }),
      ),
      finalComment: {
        rawText: actorAnswers.finalComment,
      },
    };

    const draftResult = await client.questionnaireSaveDraft({
      questionnaireId,
      draft: draftPayload,
    });
    if (!draftResult.ok) {
      throw new Error(draftResult.error.message);
    }

    const submitResult = await client.questionnaireSubmit({ questionnaireId });
    if (!submitResult.ok) {
      throw new Error(submitResult.error.message);
    }

    summary.push({
      actor,
      questionnaireId,
      status: submitResult.data.status,
      submittedAt: submitResult.data.submittedAt,
    });
  }

  const progressResult = await hrClient.campaignProgressGet({ campaignId });
  if (!progressResult.ok) {
    throw new Error(progressResult.error.message);
  }

  await savePhaseArtifact(ctx, "questionnaires.json", summary);
  await savePhaseArtifact(ctx, "progress.json", progressResult.data);
  return {
    artifacts: [
      { label: "questionnaires", path: join(ctx.phaseWorkspacePath, "questionnaires.json") },
      { label: "progress", path: join(ctx.phaseWorkspacePath, "progress.json") },
    ],
  };
};

export const runXe001PhaseVerifyResults = async (ctx: XePhaseContext): Promise<XePhaseResult> => {
  const run = await getXeRunRegistry(ctx.run.runId);
  const campaignId = (asRecord(run.bindings).campaign as { id?: string })?.id;
  const actors = asRecord(run.bindings).actors as Record<string, { employeeId?: string }>;
  const subjectEmployeeId = actors.subject?.employeeId;
  if (!campaignId || !subjectEmployeeId) {
    throw new Error("Missing campaign or subject binding.");
  }

  const hrClient = createActorClient(run, "hr_admin");
  const endResult = await hrClient.campaignEnd({ campaignId });
  if (!endResult.ok) {
    throw new Error(endResult.error.message);
  }
  const aiResult = await hrClient.aiRunForCampaign({ campaignId });
  if (!aiResult.ok) {
    throw new Error(aiResult.error.message);
  }

  const employeeClient = createActorClient(run, "subject");
  const employeeResults = await employeeClient.resultsGetMyDashboard({
    campaignId,
    anonymityThreshold: 3,
    smallGroupPolicy: "merge_to_other",
  });
  if (!employeeResults.ok) {
    throw new Error(employeeResults.error.message);
  }

  const managerClient = createActorClient(run, "manager");
  const managerResults = await managerClient.resultsGetTeamDashboard({
    campaignId,
    subjectEmployeeId,
    anonymityThreshold: 3,
    smallGroupPolicy: "merge_to_other",
  });
  if (!managerResults.ok) {
    throw new Error(managerResults.error.message);
  }

  const hrResults = await hrClient.resultsGetHrView({
    campaignId,
    subjectEmployeeId,
    anonymityThreshold: 3,
    smallGroupPolicy: "merge_to_other",
  });
  if (!hrResults.ok) {
    throw new Error(hrResults.error.message);
  }

  const expected = await loadScenarioFixture<ExpectedResultsFixture>(
    ctx.scenario.scenarioId,
    "expected-results.json",
  );
  expect(employeeResults.data.overallScore).toBeCloseTo(expected.overallScore, 2);
  expect(employeeResults.data.groupOverall.manager).toBeCloseTo(expected.groupOverall.manager, 2);
  expect(employeeResults.data.groupOverall.peers).toBeCloseTo(expected.groupOverall.peers, 2);
  expect(employeeResults.data.groupOverall.subordinates).toBeCloseTo(
    expected.groupOverall.subordinates,
    2,
  );
  expect(employeeResults.data.groupOverall.self).toBeCloseTo(expected.groupOverall.self, 2);

  expect(employeeResults.data.openText.every((item) => item.rawText === undefined)).toBe(true);
  expect(managerResults.data.openText.every((item) => item.rawText === undefined)).toBe(true);
  expect((hrResults.data.openText ?? []).some((item) => typeof item.rawText === "string")).toBe(
    true,
  );

  const browser = await chromium.launch({ headless: ctx.headless });
  try {
    const employeeContext = await browser.newContext({
      baseURL: ctx.baseUrl,
      storageState: join(ctx.workspacePath, "storage-state", "subject.json"),
      ignoreHTTPSErrors: true,
    });
    const employeePage = await employeeContext.newPage();
    const employeePom = new EmployeeResultsPagePom(employeePage);
    await employeePom.goto(campaignId);
    await employeePage.screenshot({
      path: join(ctx.phaseWorkspacePath, "employee-results.png"),
      fullPage: true,
    });
    await employeeContext.close();

    const managerContext = await browser.newContext({
      baseURL: ctx.baseUrl,
      storageState: join(ctx.workspacePath, "storage-state", "manager.json"),
      ignoreHTTPSErrors: true,
    });
    const managerPage = await managerContext.newPage();
    const managerPom = new ManagerResultsPagePom(managerPage);
    await managerPom.goto(campaignId, subjectEmployeeId);
    await managerPage.screenshot({
      path: join(ctx.phaseWorkspacePath, "manager-results.png"),
      fullPage: true,
    });
    await managerContext.close();

    const hrContext = await browser.newContext({
      baseURL: ctx.baseUrl,
      storageState: join(ctx.workspacePath, "storage-state", "hr_admin.json"),
      ignoreHTTPSErrors: true,
    });
    const hrPage = await hrContext.newPage();
    const hrPom = new HrResultsPagePom(hrPage);
    await hrPom.goto(campaignId, subjectEmployeeId);
    await hrPage.screenshot({
      path: join(ctx.phaseWorkspacePath, "hr-results.png"),
      fullPage: true,
    });
    await hrContext.close();
  } finally {
    await browser.close();
  }

  await savePhaseArtifact(ctx, "results.json", {
    employee: employeeResults.data,
    manager: managerResults.data,
    hr: hrResults.data,
    ai: aiResult.data,
  });

  const finalRun = await updateXeRunRegistry({
    runId: ctx.run.runId,
    bindings: {
      ...run.bindings,
      questionnaires: {
        status: "submitted",
      },
    },
  });
  await writeFile(
    join(ctx.phaseWorkspacePath, "run-summary.txt"),
    `Run ${finalRun.runId} completed with overall score ${employeeResults.data.overallScore?.toFixed(2) ?? "n/a"}.\n`,
    "utf8",
  );

  return {
    artifacts: [
      { label: "results", path: join(ctx.phaseWorkspacePath, "results.json") },
      { label: "employee-results", path: join(ctx.phaseWorkspacePath, "employee-results.png") },
      { label: "manager-results", path: join(ctx.phaseWorkspacePath, "manager-results.png") },
      { label: "hr-results", path: join(ctx.phaseWorkspacePath, "hr-results.png") },
    ],
  };
};

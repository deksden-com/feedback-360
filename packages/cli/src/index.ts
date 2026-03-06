import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Command } from "commander";

import { parseProvisionLinksJson, provisionAuthEmailAccess } from "./auth-provisioning";

import {
  type CampaignLifecycleStatus,
  type MembershipRole,
  type OperationError,
  type OperationResult,
  type QuestionnaireStatus,
  type SeedScenario,
  createOperationError,
  errorFromUnknown,
  membershipRoles,
} from "@feedback-360/api-contract";
import { createInprocClient } from "@feedback-360/client";

type SeedCommandOptions = {
  json?: boolean;
  scenario: string;
  variant?: string;
};

type JsonFlagOptions = {
  json?: boolean;
};

type CompanyUseOptions = {
  json?: boolean;
  role?: string;
  userId?: string;
};

type QuestionnaireListOptions = {
  json?: boolean;
  campaign: string;
  status?: QuestionnaireStatus;
};

type QuestionnaireSaveDraftOptions = {
  json?: boolean;
  draftJson?: string;
};

type CampaignSnapshotListOptions = {
  json?: boolean;
  campaign: string;
};

type ResultsHrOptions = {
  json?: boolean;
  campaign: string;
  subject: string;
  smallGroupPolicy?: "hide" | "merge_to_other";
  anonymityThreshold?: string;
};

type ResultsMyOptions = {
  json?: boolean;
  campaign: string;
  smallGroupPolicy?: "hide" | "merge_to_other";
  anonymityThreshold?: string;
};

type ResultsTeamOptions = {
  json?: boolean;
  campaign: string;
  subject: string;
  smallGroupPolicy?: "hide" | "merge_to_other";
  anonymityThreshold?: string;
};

type CampaignParticipantsAddDepartmentsOptions = {
  json?: boolean;
  fromDepartments: string[];
  includeSelf?: string;
};

type MatrixGenerateOptions = {
  json?: boolean;
  fromDepartments?: string[];
};

type ModelVersionCreateOptions = {
  json?: boolean;
  name: string;
  kind: "indicators" | "levels";
  payloadJson?: string;
};

type CampaignCreateOptions = {
  json?: boolean;
  name: string;
  modelVersion: string;
  startAt: string;
  endAt: string;
  timezone?: string;
};

type CampaignListOptions = {
  json?: boolean;
  status?: CampaignLifecycleStatus;
};

type CampaignGetOptions = {
  json?: boolean;
};

type CampaignUpdateDraftOptions = {
  json?: boolean;
  name: string;
  modelVersion: string;
  startAt: string;
  endAt: string;
  timezone?: string;
};

type CampaignTransitionOptions = {
  json?: boolean;
};

type CampaignSetModelOptions = {
  json?: boolean;
};

type CampaignWeightsSetOptions = {
  json?: boolean;
  manager: number;
  peers: number;
  subordinates: number;
};

type CampaignParticipantsMutationOptions = {
  json?: boolean;
};

type MatrixSetOptions = {
  json?: boolean;
  assignmentsJson: string;
};

type AiRunOptions = {
  json?: boolean;
};

type RemindersGenerateOptions = {
  json?: boolean;
  campaign: string;
  now?: string;
};

type NotificationsDispatchOptions = {
  json?: boolean;
  campaign?: string;
  limit?: string;
  provider?: "stub" | "resend";
};

type EmployeeUpsertOptions = {
  json?: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: string;
};

type AuthProvisionEmailOptions = {
  json?: boolean;
  email: string;
  userId: string;
  linksJson: string;
  target?: "beta" | "prod";
  projectRef?: string;
};

type CliState = {
  activeCompanyId?: string;
  activeRole?: MembershipRole;
  activeUserId?: string;
};

const cliStateFilePath = join(homedir(), ".feedback360", "cli-state.json");

const loadCliState = async (): Promise<CliState> => {
  try {
    const rawState = await readFile(cliStateFilePath, "utf8");
    const parsedState = JSON.parse(rawState) as {
      activeCompanyId?: unknown;
      activeRole?: unknown;
      activeUserId?: unknown;
    };
    const state: CliState = {};

    if (typeof parsedState.activeCompanyId === "string") {
      state.activeCompanyId = parsedState.activeCompanyId;
    }

    if (
      typeof parsedState.activeRole === "string" &&
      membershipRoles.includes(parsedState.activeRole as MembershipRole)
    ) {
      state.activeRole = parsedState.activeRole as MembershipRole;
    }

    if (typeof parsedState.activeUserId === "string") {
      state.activeUserId = parsedState.activeUserId;
    }

    return state;
  } catch {
    return {};
  }
};

const saveCliState = async (state: CliState): Promise<void> => {
  const directory = join(homedir(), ".feedback360");
  await mkdir(directory, { recursive: true });
  await writeFile(cliStateFilePath, JSON.stringify(state, null, 2), "utf8");
};

const emitError = (error: OperationError, asJson?: boolean): void => {
  if (asJson) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          error,
        },
        null,
        2,
      ),
    );
  } else {
    console.error(`${error.code}: ${error.message}`);
  }

  process.exitCode = 1;
};

const emitResult = <Output>(result: OperationResult<Output>, asJson?: boolean): boolean => {
  if (!result.ok) {
    emitError(result.error, asJson);
    return false;
  }

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          data: result.data,
        },
        null,
        2,
      ),
    );
    return true;
  }

  return true;
};

const getClientWithActiveCompany = async (asJson?: boolean) => {
  const state = await loadCliState();
  const client = createInprocClient();

  if (!state.activeCompanyId) {
    emitError(
      createOperationError(
        "forbidden",
        "Active company is not set. Run `company use <company_id>` first.",
      ),
      asJson,
    );
    return null;
  }

  const setResult = client.setActiveCompany(state.activeCompanyId);
  if (!setResult.ok) {
    emitError(setResult.error, asJson);
    return null;
  }

  const contextPayload = {
    ...(state.activeRole ? { role: state.activeRole } : {}),
    ...(state.activeUserId ? { userId: state.activeUserId } : {}),
  };
  const setActiveContextMaybe = (
    client as {
      setActiveContext?: (
        context: Partial<{ role: MembershipRole; userId: string }>,
      ) => OperationResult<unknown>;
    }
  ).setActiveContext;
  if (setActiveContextMaybe && Object.keys(contextPayload).length > 0) {
    const contextResult = setActiveContextMaybe(contextPayload);
    if (!contextResult.ok) {
      emitError(contextResult.error, asJson);
      return null;
    }
  }

  return client;
};

const formatSeedHuman = (result: { scenario: string; handles: Record<string, string> }): string => {
  const entries = Object.entries(result.handles).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  const lines = [`Scenario: ${result.scenario}`];

  if (entries.length === 0) {
    lines.push("Handles: (none)");
    return lines.join("\n");
  }

  lines.push("Handles:");
  for (const [key, value] of entries) {
    lines.push(`  - ${key} = ${value}`);
  }

  return lines.join("\n");
};

const formatQuestionnaireListHuman = (data: {
  items: Array<{
    questionnaireId: string;
    status: string;
    subjectEmployeeId: string;
    raterEmployeeId: string;
    submittedAt?: string;
  }>;
}): string => {
  if (data.items.length === 0) {
    return "No questionnaires found.";
  }

  const lines = [`Questionnaires: ${data.items.length}`];
  for (const item of data.items) {
    lines.push(
      `- ${item.questionnaireId}: status=${item.status}, subject=${item.subjectEmployeeId}, rater=${item.raterEmployeeId}${item.submittedAt ? `, submittedAt=${item.submittedAt}` : ""}`,
    );
  }

  return lines.join("\n");
};

const formatEmployeeListHuman = (data: {
  items: Array<{
    employeeId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    isActive: boolean;
  }>;
}): string => {
  if (data.items.length === 0) {
    return "No active employees found.";
  }

  const lines = [`Active employees: ${data.items.length}`];
  for (const item of data.items) {
    lines.push(
      `- ${item.employeeId}: email=${item.email}, name=${item.firstName ?? ""} ${item.lastName ?? ""}, isActive=${item.isActive}`,
    );
  }

  return lines.join("\n");
};

const formatCampaignSnapshotsHuman = (data: {
  items: Array<{
    employeeId: string;
    email: string;
    departmentId?: string;
    managerEmployeeId?: string;
    snapshotAt: string;
  }>;
}): string => {
  if (data.items.length === 0) {
    return "No campaign snapshots found.";
  }

  const lines = [`Campaign snapshots: ${data.items.length}`];
  for (const item of data.items) {
    lines.push(
      `- employee=${item.employeeId}, email=${item.email}, department=${item.departmentId ?? "-"}, manager=${item.managerEmployeeId ?? "-"}, snapshotAt=${item.snapshotAt}`,
    );
  }

  return lines.join("\n");
};

const formatCampaignProgressHuman = (data: {
  campaignId: string;
  totalQuestionnaires: number;
  statusCounts: {
    notStarted: number;
    inProgress: number;
    submitted: number;
  };
  campaignLockedAt?: string;
  pendingQuestionnaires: Array<{
    questionnaireId: string;
    status: "not_started" | "in_progress";
    subjectEmployeeId: string;
    raterEmployeeId: string;
    firstDraftAt?: string;
  }>;
  pendingByRater: Array<{
    employeeId: string;
    pendingCount: number;
  }>;
  pendingBySubject: Array<{
    employeeId: string;
    pendingCount: number;
  }>;
}): string => {
  const lines = [
    `Campaign progress: campaign=${data.campaignId}, total=${data.totalQuestionnaires}, not_started=${data.statusCounts.notStarted}, in_progress=${data.statusCounts.inProgress}, submitted=${data.statusCounts.submitted}${data.campaignLockedAt ? `, lockedAt=${data.campaignLockedAt}` : ""}`,
  ];

  if (data.pendingQuestionnaires.length === 0) {
    lines.push("Pending questionnaires: 0");
  } else {
    lines.push(`Pending questionnaires: ${data.pendingQuestionnaires.length}`);
    for (const item of data.pendingQuestionnaires) {
      lines.push(
        `- ${item.questionnaireId}: status=${item.status}, subject=${item.subjectEmployeeId}, rater=${item.raterEmployeeId}${item.firstDraftAt ? `, firstDraftAt=${item.firstDraftAt}` : ""}`,
      );
    }
  }

  if (data.pendingByRater.length > 0) {
    lines.push("Pending by rater:");
    for (const item of data.pendingByRater) {
      lines.push(`- employee=${item.employeeId}, pending=${item.pendingCount}`);
    }
  }

  if (data.pendingBySubject.length > 0) {
    lines.push("Pending by subject:");
    for (const item of data.pendingBySubject) {
      lines.push(`- employee=${item.employeeId}, pending=${item.pendingCount}`);
    }
  }

  return lines.join("\n");
};

const formatMatrixSuggestionsHuman = (data: {
  generatedAssignments: Array<{
    subjectEmployeeId: string;
    raterEmployeeId: string;
    raterRole: string;
  }>;
  totalAssignments: number;
}): string => {
  if (data.generatedAssignments.length === 0) {
    return "No suggested assignments generated.";
  }

  const lines = [`Suggested assignments: ${data.totalAssignments}`];
  for (const item of data.generatedAssignments) {
    lines.push(
      `- subject=${item.subjectEmployeeId}, rater=${item.raterEmployeeId}, role=${item.raterRole}`,
    );
  }

  return lines.join("\n");
};

const formatAiRunHuman = (data: {
  campaignId: string;
  aiJobId: string;
  provider: string;
  status: string;
  completedAt: string;
  wasAlreadyCompleted: boolean;
}): string => {
  return `AI processing ${data.wasAlreadyCompleted ? "already completed" : "completed"}: campaign=${data.campaignId}, job=${data.aiJobId}, provider=${data.provider}, status=${data.status}, completedAt=${data.completedAt}`;
};

const formatRemindersGenerateHuman = (data: {
  campaignId: string;
  dateBucket: string;
  candidateRecipients: number;
  generated: number;
  deduplicated: number;
}): string => {
  return `Reminders generated: campaign=${data.campaignId}, date=${data.dateBucket}, candidates=${data.candidateRecipients}, generated=${data.generated}, deduplicated=${data.deduplicated}`;
};

const formatNotificationsDispatchHuman = (data: {
  provider: "stub" | "resend";
  processed: number;
  sent: number;
  failed: number;
  attemptsLogged: number;
  remainingPending: number;
}): string => {
  return `Notification dispatch: provider=${data.provider}, processed=${data.processed}, sent=${data.sent}, failed=${data.failed}, attempts=${data.attemptsLogged}, remainingPending=${data.remainingPending}`;
};

const formatModelVersionCreateHuman = (data: {
  modelVersionId: string;
  companyId: string;
  name: string;
  kind: string;
  version: number;
  groupCount: number;
  competencyCount: number;
  indicatorCount: number;
  levelCount: number;
}): string => {
  return `Model version created: id=${data.modelVersionId}, company=${data.companyId}, name=${data.name}, kind=${data.kind}, version=${data.version}, groups=${data.groupCount}, competencies=${data.competencyCount}, indicators=${data.indicatorCount}, levels=${data.levelCount}`;
};

const formatModelVersionListHuman = (data: {
  items: Array<{
    modelVersionId: string;
    name: string;
    kind: "indicators" | "levels";
    version: number;
    status: string;
  }>;
}): string => {
  if (data.items.length === 0) {
    return "No model versions found.";
  }

  return [
    "Model versions:",
    ...data.items.map(
      (item) =>
        `- ${item.modelVersionId}: ${item.name} v${item.version} (${item.kind}, ${item.status})`,
    ),
  ].join("\n");
};

const formatCampaignCreateHuman = (data: {
  campaignId: string;
  companyId: string;
  modelVersionId: string;
  name: string;
  status: string;
  startAt: string;
  endAt: string;
  timezone: string;
}): string => {
  return `Campaign created: id=${data.campaignId}, company=${data.companyId}, modelVersion=${data.modelVersionId}, name=${data.name}, status=${data.status}, startAt=${data.startAt}, endAt=${data.endAt}, timezone=${data.timezone}`;
};

const formatCampaignListHuman = (data: {
  items: Array<{
    campaignId: string;
    name: string;
    status: string;
    modelName: string | null;
    modelVersion: number | null;
    timezone: string;
    startAt: string;
    endAt: string;
  }>;
}): string => {
  if (data.items.length === 0) {
    return "No campaigns found.";
  }

  return [
    "Campaigns:",
    ...data.items.map((item) => {
      const model = item.modelName ? `${item.modelName} v${item.modelVersion ?? "?"}` : "no-model";
      return `- ${item.campaignId}: ${item.name} [${item.status}] ${item.startAt} -> ${item.endAt}, timezone=${item.timezone}, model=${model}`;
    }),
  ].join("\n");
};

const formatCampaignGetHuman = (data: {
  campaignId: string;
  name: string;
  status: string;
  modelVersionId: string | null;
  modelName: string | null;
  modelVersion: number | null;
  timezone: string;
  startAt: string;
  endAt: string;
  managerWeight: number;
  peersWeight: number;
  subordinatesWeight: number;
  selfWeight: number;
  lockedAt?: string;
}): string => {
  return [
    `Campaign detail: id=${data.campaignId}, name=${data.name}, status=${data.status}`,
    `- model=${data.modelName ?? "n/a"}${data.modelVersion ? ` v${data.modelVersion}` : ""}, modelVersionId=${data.modelVersionId ?? "n/a"}`,
    `- dates=${data.startAt} -> ${data.endAt}, timezone=${data.timezone}`,
    `- weights=manager:${data.managerWeight}, peers:${data.peersWeight}, subordinates:${data.subordinatesWeight}, self:${data.selfWeight}`,
    `- lockedAt=${data.lockedAt ?? "not_locked"}`,
  ].join("\n");
};

const formatCampaignUpdateDraftHuman = (data: {
  campaignId: string;
  modelVersionId: string;
  name: string;
  changed: boolean;
  timezone: string;
  updatedAt: string;
}): string => {
  return `Campaign draft saved: id=${data.campaignId}, name=${data.name}, modelVersion=${data.modelVersionId}, changed=${data.changed}, timezone=${data.timezone}, updatedAt=${data.updatedAt}`;
};

const formatCampaignTransitionHuman = (data: {
  campaignId: string;
  previousStatus: string;
  status: string;
  changed: boolean;
  updatedAt: string;
}): string => {
  return `Campaign status updated: id=${data.campaignId}, previous=${data.previousStatus}, status=${data.status}, changed=${data.changed}, updatedAt=${data.updatedAt}`;
};

const formatCampaignSetModelHuman = (data: {
  campaignId: string;
  modelVersionId: string;
  changed: boolean;
  updatedAt: string;
}): string => {
  return `Campaign model updated: campaign=${data.campaignId}, modelVersion=${data.modelVersionId}, changed=${data.changed}, updatedAt=${data.updatedAt}`;
};

const formatCampaignParticipantsMutationHuman = (data: {
  campaignId: string;
  changedEmployeeIds: string[];
  totalParticipants: number;
}): string => {
  return `Campaign participants updated: campaign=${data.campaignId}, changed=${data.changedEmployeeIds.length}, total=${data.totalParticipants}`;
};

const formatCampaignWeightsSetHuman = (data: {
  campaignId: string;
  manager: number;
  peers: number;
  subordinates: number;
  self: number;
  changed: boolean;
  updatedAt: string;
}): string => {
  return `Campaign weights updated: campaign=${data.campaignId}, manager=${data.manager}, peers=${data.peers}, subordinates=${data.subordinates}, self=${data.self}, changed=${data.changed}, updatedAt=${data.updatedAt}`;
};

const formatMatrixSetHuman = (data: { campaignId: string; totalAssignments: number }): string => {
  return `Matrix set: campaign=${data.campaignId}, totalAssignments=${data.totalAssignments}`;
};

const formatResultsHrHuman = (data: {
  campaignId: string;
  subjectEmployeeId: string;
  modelKind: "indicators" | "levels";
  smallGroupPolicy: "hide" | "merge_to_other";
  anonymityThreshold: number;
  groupVisibility: {
    manager: "shown";
    peers: "shown" | "hidden" | "merged";
    subordinates: "shown" | "hidden" | "merged";
    self: "shown";
    other?: "shown" | "hidden";
  };
  competencyScores: Array<{
    competencyId: string;
    competencyName: string;
    managerScore?: number;
    peersScore?: number;
    subordinatesScore?: number;
    selfScore?: number;
    peersVisibility: "shown" | "hidden" | "merged";
    subordinatesVisibility: "shown" | "hidden" | "merged";
    otherScore?: number;
    otherVisibility?: "shown" | "hidden";
    managerLevels?: {
      modeLevel: 1 | 2 | 3 | 4 | null;
      distribution: { level1: number; level2: number; level3: number; level4: number };
      nValid: number;
      nUnsure: number;
    };
    peersLevels?: {
      modeLevel: 1 | 2 | 3 | 4 | null;
      distribution: { level1: number; level2: number; level3: number; level4: number };
      nValid: number;
      nUnsure: number;
    };
    subordinatesLevels?: {
      modeLevel: 1 | 2 | 3 | 4 | null;
      distribution: { level1: number; level2: number; level3: number; level4: number };
      nValid: number;
      nUnsure: number;
    };
    selfLevels?: {
      modeLevel: 1 | 2 | 3 | 4 | null;
      distribution: { level1: number; level2: number; level3: number; level4: number };
      nValid: number;
      nUnsure: number;
    };
    otherLevels?: {
      modeLevel: 1 | 2 | 3 | 4 | null;
      distribution: { level1: number; level2: number; level3: number; level4: number };
      nValid: number;
      nUnsure: number;
    };
  }>;
  groupOverall: {
    manager?: number;
    peers?: number;
    subordinates?: number;
    self?: number;
    other?: number;
  };
}): string => {
  const lines = [
    `HR results: campaign=${data.campaignId}, subject=${data.subjectEmployeeId}, kind=${data.modelKind}, competencies=${data.competencyScores.length}`,
    `Anonymity: threshold=${data.anonymityThreshold}, policy=${data.smallGroupPolicy}, visibility={manager:${data.groupVisibility.manager}, peers:${data.groupVisibility.peers}, subordinates:${data.groupVisibility.subordinates}, self:${data.groupVisibility.self}${data.groupVisibility.other ? `, other:${data.groupVisibility.other}` : ""}}`,
    `Group overall: manager=${data.groupOverall.manager ?? "-"}, peers=${data.groupOverall.peers ?? "-"}, subordinates=${data.groupOverall.subordinates ?? "-"}, self=${data.groupOverall.self ?? "-"}, other=${data.groupOverall.other ?? "-"}`,
  ];

  for (const competency of data.competencyScores) {
    lines.push(
      `- ${competency.competencyId} (${competency.competencyName}): manager=${competency.managerScore ?? "-"}, peers=${competency.peersScore ?? "-"} [${competency.peersVisibility}], subordinates=${competency.subordinatesScore ?? "-"} [${competency.subordinatesVisibility}], self=${competency.selfScore ?? "-"}, other=${competency.otherScore ?? "-"}${competency.otherVisibility ? ` [${competency.otherVisibility}]` : ""}`,
    );
    if (data.modelKind === "levels") {
      lines.push(
        `  levels: manager(mode=${competency.managerLevels?.modeLevel ?? "null"}, n=${competency.managerLevels?.nValid ?? 0}, unsure=${competency.managerLevels?.nUnsure ?? 0}), peers(mode=${competency.peersLevels?.modeLevel ?? "null"}, n=${competency.peersLevels?.nValid ?? 0}, unsure=${competency.peersLevels?.nUnsure ?? 0}), subordinates(mode=${competency.subordinatesLevels?.modeLevel ?? "null"}, n=${competency.subordinatesLevels?.nValid ?? 0}, unsure=${competency.subordinatesLevels?.nUnsure ?? 0}), other(mode=${competency.otherLevels?.modeLevel ?? "null"}, n=${competency.otherLevels?.nValid ?? 0}, unsure=${competency.otherLevels?.nUnsure ?? 0})`,
      );
    }
  }

  return lines.join("\n");
};

const formatResultsDashboardHuman = (data: {
  campaignId: string;
  subjectEmployeeId: string;
  modelKind: "indicators" | "levels";
  smallGroupPolicy: "hide" | "merge_to_other";
  anonymityThreshold: number;
  groupVisibility: {
    manager: "shown";
    peers: "shown" | "hidden" | "merged";
    subordinates: "shown" | "hidden" | "merged";
    self: "shown";
    other?: "shown" | "hidden";
  };
  competencyScores: Array<{
    competencyId: string;
    competencyName: string;
    managerScore?: number;
    peersScore?: number;
    subordinatesScore?: number;
    selfScore?: number;
    peersVisibility: "shown" | "hidden" | "merged";
    subordinatesVisibility: "shown" | "hidden" | "merged";
    otherScore?: number;
    otherVisibility?: "shown" | "hidden";
  }>;
  groupOverall: {
    manager?: number;
    peers?: number;
    subordinates?: number;
    self?: number;
    other?: number;
  };
  overallScore?: number;
  openText: Array<{
    competencyId: string;
    group: "manager" | "peers" | "subordinates" | "self" | "other";
    count: number;
    processedText?: string;
    summaryText?: string;
  }>;
}): string => {
  const lines = [
    `Dashboard results: campaign=${data.campaignId}, subject=${data.subjectEmployeeId}, kind=${data.modelKind}, competencies=${data.competencyScores.length}`,
    `Anonymity: threshold=${data.anonymityThreshold}, policy=${data.smallGroupPolicy}, visibility={manager:${data.groupVisibility.manager}, peers:${data.groupVisibility.peers}, subordinates:${data.groupVisibility.subordinates}, self:${data.groupVisibility.self}${data.groupVisibility.other ? `, other:${data.groupVisibility.other}` : ""}}`,
    `Group overall: manager=${data.groupOverall.manager ?? "-"}, peers=${data.groupOverall.peers ?? "-"}, subordinates=${data.groupOverall.subordinates ?? "-"}, self=${data.groupOverall.self ?? "-"}, other=${data.groupOverall.other ?? "-"}, overall=${data.overallScore ?? "-"}`,
  ];

  for (const competency of data.competencyScores) {
    lines.push(
      `- ${competency.competencyId} (${competency.competencyName}): manager=${competency.managerScore ?? "-"}, peers=${competency.peersScore ?? "-"} [${competency.peersVisibility}], subordinates=${competency.subordinatesScore ?? "-"} [${competency.subordinatesVisibility}], self=${competency.selfScore ?? "-"}, other=${competency.otherScore ?? "-"}${competency.otherVisibility ? ` [${competency.otherVisibility}]` : ""}`,
    );
  }

  if (data.openText.length > 0) {
    lines.push("Open text:");
    for (const item of data.openText) {
      lines.push(
        `- ${item.competencyId}/${item.group}: count=${item.count}, processed=${item.processedText ? "yes" : "no"}, summary=${item.summaryText ? "yes" : "no"}`,
      );
    }
  }

  return lines.join("\n");
};

const buildDefaultModelPayload = (name: string, kind: "indicators" | "levels") => {
  if (kind === "levels") {
    return {
      name,
      kind,
      groups: [
        {
          name: "Default group",
          weight: 100,
          competencies: [
            {
              name: "Core competency",
              levels: [
                { level: 1, text: "Level 1" },
                { level: 2, text: "Level 2" },
                { level: 3, text: "Level 3" },
                { level: 4, text: "Level 4" },
              ],
            },
          ],
        },
      ],
    };
  }

  return {
    name,
    kind,
    groups: [
      {
        name: "Default group",
        weight: 100,
        competencies: [
          {
            name: "Core competency",
            indicators: [
              { text: "Delivers commitments", order: 1 },
              { text: "Communicates clearly", order: 2 },
            ],
          },
        ],
      },
    ],
  };
};

const parseBooleanOption = (value: string, fieldName: string): boolean => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }

  throw new Error(`${fieldName} must be either true or false.`);
};

const parseMembershipRoleOption = (value: string): MembershipRole => {
  const normalized = value.trim();
  if (membershipRoles.includes(normalized as MembershipRole)) {
    return normalized as MembershipRole;
  }

  throw new Error(`--role must be one of: ${membershipRoles.join(", ")}`);
};

const normalizeLegacySeedArgs = (argv: string[]): string[] => {
  const normalizedArgv = [...argv];
  if (normalizedArgv[2] === "--") {
    normalizedArgv.splice(2, 1);
  }

  const firstArgument = normalizedArgv[2];
  if (!firstArgument) {
    return normalizedArgv;
  }

  const knownTopLevelCommands = new Set([
    "seed",
    "company",
    "model",
    "employee",
    "org",
    "campaign",
    "matrix",
    "ai",
    "auth",
    "reminders",
    "notifications",
    "questionnaire",
    "results",
  ]);
  if (!knownTopLevelCommands.has(firstArgument) && firstArgument.startsWith("--")) {
    normalizedArgv.splice(2, 0, "seed");
  }

  return normalizedArgv;
};

export const runCli = async (argv: string[]): Promise<void> => {
  const normalizedArgv = normalizeLegacySeedArgs(argv);
  const program = new Command();

  program
    .name("feedback360")
    .description("feedback-360 CLI (human-readable output + --json).")
    .addHelpText(
      "after",
      `
Examples:
  pnpm seed --scenario S1_company_min
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- company use <company_id> --role hr_admin --user-id <user_id>
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- model version create --name "Q1 Model" --kind indicators --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- model version list --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- campaign create --name "Q1 Campaign" --model-version <model_version_id> --start-at 2026-02-01T09:00:00.000Z --end-at 2026-02-28T18:00:00.000Z --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- campaign list --status started --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- campaign get <campaign_id> --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- campaign update-draft <campaign_id> --name "Q1 Campaign" --model-version <model_version_id> --start-at 2026-02-01T09:00:00.000Z --end-at 2026-02-28T18:00:00.000Z --timezone Europe/Kaliningrad --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- campaign set-model <campaign_id> <model_version_id> --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- campaign weights set <campaign_id> --manager 40 --peers 30 --subordinates 30 --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- campaign participants add <campaign_id> <employee_id>... --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- campaign participants remove <campaign_id> <employee_id>... --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- campaign start <campaign_id> --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- campaign stop <campaign_id> --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- campaign progress <campaign_id> --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- campaign snapshot list --campaign <campaign_id> --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- campaign participants add-departments <campaign_id> --from-departments <department_id>...
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- matrix set <campaign_id> --assignments-json '[{"subjectEmployeeId":"<id>","raterEmployeeId":"<id>","raterRole":"manager"}]' --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- auth provision-email --target beta --email deksden@deksden.com --user-id <user_id> --links-json '[{"companyId":"<company_id>","employeeId":"<employee_id>","role":"hr_admin"}]' --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- reminders generate --campaign <campaign_id> --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- notifications dispatch --campaign <campaign_id> --provider stub --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- ai run <campaign_id> --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- questionnaire list --campaign <campaign_id> --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- results my --campaign <campaign_id> --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- results team --campaign <campaign_id> --subject <employee_id> --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- results hr --campaign <campaign_id> --subject <employee_id> --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- results hr --campaign <campaign_id> --subject <employee_id> --small-group-policy merge_to_other --anonymity-threshold 3 --json
`,
    );

  program
    .command("seed")
    .description("Run deterministic database seed scenarios.")
    .requiredOption(
      "--scenario <scenario>",
      "Seed scenario name (S0_empty | S1_company_min | S1_multi_tenant_min | S2_org_basic | S4_campaign_draft | S5_campaign_started_no_answers | S7_campaign_started_some_submitted | S8_campaign_ended | S9_campaign_completed_with_ai).",
    )
    .option(
      "--variant <variant>",
      "Optional seed variant (S4: no_participants; S7: na_heavy_peer | peers2 | no_subordinates | levels_tie).",
    )
    .option("--json", "Output machine-readable JSON.")
    .action(async (options: SeedCommandOptions) => {
      try {
        const client = createInprocClient();
        const result = await client.seedRun({
          scenario: options.scenario as SeedScenario,
          variant: options.variant,
        });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        console.log(formatSeedHuman(result));
      } catch (error: unknown) {
        emitError(errorFromUnknown(error, "invalid_input", "seed.run failed."), options.json);
      }
    });

  const companyCommand = program.command("company").description("Company context operations.");

  companyCommand
    .command("use")
    .description("Set active company and optional actor context in local CLI state.")
    .argument("<company_id>", "Company identifier.")
    .option(
      "--role <role>",
      `Active membership role for subsequent commands (${membershipRoles.join(" | ")}).`,
    )
    .option("--user-id <userId>", "Active user id for context propagation.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (companyId: string, options: CompanyUseOptions) => {
      try {
        const client = createInprocClient();
        const result = client.setActiveCompany(companyId);

        if (!result.ok) {
          emitError(result.error, options.json);
          return;
        }

        const previousState = await loadCliState();

        let activeRole = previousState.activeRole;
        if (options.role) {
          try {
            activeRole = parseMembershipRoleOption(options.role);
          } catch (error: unknown) {
            emitError(
              errorFromUnknown(error, "invalid_input", "Invalid --role value."),
              options.json,
            );
            return;
          }
        }

        const activeUserId = options.userId ?? previousState.activeUserId;
        const nextState: CliState = {
          activeCompanyId: companyId,
          ...(activeRole ? { activeRole } : {}),
          ...(activeUserId ? { activeUserId } : {}),
        };
        await saveCliState(nextState);

        if (options.json) {
          console.log(
            JSON.stringify(
              {
                ok: true,
                data: {
                  companyId,
                  ...(activeRole ? { role: activeRole } : {}),
                  ...(activeUserId ? { userId: activeUserId } : {}),
                },
              },
              null,
              2,
            ),
          );
          return;
        }

        if (!options.json) {
          console.log(
            `Active company: ${companyId}${activeRole ? `, role=${activeRole}` : ""}${activeUserId ? `, userId=${activeUserId}` : ""}`,
          );
        }
      } catch (error: unknown) {
        emitError(
          errorFromUnknown(error, "invalid_input", "Failed to set active company."),
          options.json,
        );
      }
    });

  companyCommand
    .command("context")
    .description("Show active company and actor context from local CLI state.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (options: JsonFlagOptions) => {
      const state = await loadCliState();
      if (options.json) {
        console.log(
          JSON.stringify(
            {
              ok: true,
              data: state,
            },
            null,
            2,
          ),
        );
        return;
      }

      if (!state.activeCompanyId) {
        console.log("No active company context is set.");
        return;
      }

      console.log(
        `Active company: ${state.activeCompanyId}${state.activeRole ? `, role=${state.activeRole}` : ""}${state.activeUserId ? `, userId=${state.activeUserId}` : ""}`,
      );
    });

  const authCommand = program.command("auth").description("Auth provisioning operations.");

  authCommand
    .command("provision-email")
    .description(
      "Provision Supabase Auth user + HR links for email login in beta/prod (ops/admin command).",
    )
    .requiredOption("--email <email>", "User email for magic-link login.")
    .requiredOption("--user-id <userId>", "Supabase Auth user UUID to create/update.")
    .requiredOption(
      "--links-json <json>",
      'JSON array of links: [{"companyId":"...","employeeId":"...","role":"hr_admin|hr_reader|manager|employee"}].',
    )
    .option("--target <target>", "Environment target: beta | prod.", "beta")
    .option("--project-ref <projectRef>", "Override Supabase project ref (optional).")
    .option("--json", "Output machine-readable JSON.")
    .action(async (options: AuthProvisionEmailOptions) => {
      const target = options.target === "prod" ? "prod" : "beta";

      let links: ReturnType<typeof parseProvisionLinksJson>;
      try {
        links = parseProvisionLinksJson(options.linksJson);
      } catch (error: unknown) {
        emitError(
          errorFromUnknown(error, "invalid_input", "Invalid --links-json value."),
          options.json,
        );
        return;
      }

      try {
        const result = await provisionAuthEmailAccess({
          email: options.email,
          userId: options.userId,
          links,
          target,
          projectRef: options.projectRef,
        });

        if (options.json) {
          console.log(
            JSON.stringify(
              {
                ok: true,
                data: result,
              },
              null,
              2,
            ),
          );
          return;
        }

        console.log(
          `Auth provisioned: target=${result.target}, projectRef=${result.projectRef}, userId=${result.userId}, email=${result.email}, action=${result.authAction}, links=${result.links.length}`,
        );
        for (const link of result.links) {
          console.log(
            `- company=${link.companyId}, employee=${link.employeeId}, role=${link.role}, membership=${link.membershipId}, employeeUserLink=${link.employeeUserLinkId}`,
          );
        }
      } catch (error: unknown) {
        emitError(
          errorFromUnknown(error, "invalid_input", "Failed to provision auth email access."),
          options.json,
        );
      }
    });

  const employeeCommand = program.command("employee").description("Employee directory operations.");

  employeeCommand
    .command("upsert")
    .description("Create/update employee record (supports soft deactivate via --is-active false).")
    .argument("<employee_id>", "Employee identifier.")
    .option("--email <email>", "Employee email.")
    .option("--first-name <firstName>", "Employee first name.")
    .option("--last-name <lastName>", "Employee last name.")
    .option("--phone <phone>", "Employee phone.")
    .option("--is-active <true|false>", "Set employee active state.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (employeeId: string, options: EmployeeUpsertOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      let isActive: boolean | undefined;
      try {
        isActive = options.isActive
          ? parseBooleanOption(options.isActive, "--is-active")
          : undefined;
      } catch (error: unknown) {
        emitError(
          errorFromUnknown(error, "invalid_input", "Invalid --is-active value."),
          options.json,
        );
        return;
      }

      const result = await client.employeeUpsert({
        employeeId,
        email: options.email,
        firstName: options.firstName,
        lastName: options.lastName,
        phone: options.phone,
        ...(isActive !== undefined ? { isActive } : {}),
      });

      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(
          `Employee upserted: employee=${result.data.employeeId}, company=${result.data.companyId}, isActive=${result.data.isActive}, created=${result.data.created}`,
        );
      }
    });

  employeeCommand
    .command("list-active")
    .description("List active employees in active company.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (options: JsonFlagOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.employeeListActive();
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatEmployeeListHuman(result.data));
      }
    });

  const orgCommand = program.command("org").description("Organization structure operations.");

  const modelCommand = program.command("model").description("Competency model operations.");
  const modelVersionCommand = modelCommand
    .command("version")
    .description("Competency model version operations.");

  modelVersionCommand
    .command("list")
    .description("List competency model versions in active company.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (options: JsonFlagOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.modelVersionList({});
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatModelVersionListHuman(result.data));
      }
    });

  modelVersionCommand
    .command("create")
    .description("Create competency model version (indicators/levels).")
    .requiredOption("--name <name>", "Model version name.")
    .option("--kind <kind>", "Model kind (indicators | levels).", "indicators")
    .option(
      "--payload-json <json>",
      "Optional full payload JSON (overrides default template generated from --name/--kind).",
    )
    .option("--json", "Output machine-readable JSON.")
    .action(async (options: ModelVersionCreateOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const kind = options.kind;
      if (kind !== "indicators" && kind !== "levels") {
        emitError(
          createOperationError("invalid_input", "--kind must be indicators or levels."),
          options.json,
        );
        return;
      }

      let payload: unknown;
      try {
        payload = options.payloadJson
          ? (JSON.parse(options.payloadJson) as unknown)
          : buildDefaultModelPayload(options.name, kind);
      } catch (error: unknown) {
        emitError(
          errorFromUnknown(error, "invalid_input", "Invalid --payload-json."),
          options.json,
        );
        return;
      }

      const result = await client.modelVersionCreate(payload as never);
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatModelVersionCreateHuman(result.data));
      }
    });

  const orgDepartmentCommand = orgCommand
    .command("department")
    .description("Department hierarchy operations.");

  orgDepartmentCommand
    .command("move")
    .description("Move employee to another department and close/open history intervals.")
    .argument("<employee_id>", "Employee identifier.")
    .requiredOption("--to <department_id>", "Target department identifier.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (employeeId: string, options: { to: string; json?: boolean }) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.orgDepartmentMove({
        employeeId,
        toDepartmentId: options.to,
      });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(
          `Department moved: employee=${result.data.employeeId}, previous=${result.data.previousDepartmentId ?? "-"}, current=${result.data.departmentId}, changed=${result.data.changed}`,
        );
      }
    });

  orgCommand
    .command("set-manager")
    .description("Set employee direct manager and close/open manager history intervals.")
    .argument("<employee_id>", "Employee identifier.")
    .requiredOption("--manager <manager_employee_id>", "Manager employee identifier.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (employeeId: string, options: { manager: string; json?: boolean }) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.orgManagerSet({
        employeeId,
        managerEmployeeId: options.manager,
      });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(
          `Manager set: employee=${result.data.employeeId}, previous=${result.data.previousManagerEmployeeId ?? "-"}, current=${result.data.managerEmployeeId}, changed=${result.data.changed}`,
        );
      }
    });

  const campaignCommand = program.command("campaign").description("Campaign operations.");

  campaignCommand
    .command("list")
    .description("List campaigns in active company.")
    .option(
      "--status <status>",
      "Filter by lifecycle status (draft | started | ended | processing_ai | ai_failed | completed).",
    )
    .option("--json", "Output machine-readable JSON.")
    .action(async (options: CampaignListOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.campaignList(options.status ? { status: options.status } : {});
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatCampaignListHuman(result.data));
      }
    });

  campaignCommand
    .command("get")
    .description("Show campaign detail snapshot for HR.")
    .argument("<campaign_id>", "Campaign identifier.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (campaignId: string, options: CampaignGetOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.campaignGet({ campaignId });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatCampaignGetHuman(result.data));
      }
    });

  campaignCommand
    .command("create")
    .description("Create draft campaign linked to competency model version.")
    .requiredOption("--name <name>", "Campaign name.")
    .requiredOption("--model-version <modelVersionId>", "Competency model version identifier.")
    .requiredOption("--start-at <startAt>", "Campaign start datetime (ISO).")
    .requiredOption("--end-at <endAt>", "Campaign end datetime (ISO).")
    .option("--timezone <timezone>", "Campaign timezone override.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (options: CampaignCreateOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.campaignCreate({
        name: options.name,
        modelVersionId: options.modelVersion,
        startAt: options.startAt,
        endAt: options.endAt,
        ...(options.timezone ? { timezone: options.timezone } : {}),
      });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatCampaignCreateHuman(result.data));
      }
    });

  campaignCommand
    .command("update-draft")
    .description("Update draft campaign base configuration.")
    .argument("<campaign_id>", "Campaign identifier.")
    .requiredOption("--name <name>", "Campaign name.")
    .requiredOption("--model-version <modelVersionId>", "Competency model version identifier.")
    .requiredOption("--start-at <startAt>", "Campaign start datetime (ISO).")
    .requiredOption("--end-at <endAt>", "Campaign end datetime (ISO).")
    .option("--timezone <timezone>", "Campaign timezone override.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (campaignId: string, options: CampaignUpdateDraftOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.campaignUpdateDraft({
        campaignId,
        name: options.name,
        modelVersionId: options.modelVersion,
        startAt: options.startAt,
        endAt: options.endAt,
        ...(options.timezone ? { timezone: options.timezone } : {}),
      });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatCampaignUpdateDraftHuman(result.data));
      }
    });

  campaignCommand
    .command("set-model")
    .description("Set campaign model version (`draft` only).")
    .argument("<campaign_id>", "Campaign identifier.")
    .argument("<model_version_id>", "Model version identifier.")
    .option("--json", "Output machine-readable JSON.")
    .action(
      async (campaignId: string, modelVersionId: string, options: CampaignSetModelOptions) => {
        const client = await getClientWithActiveCompany(options.json);
        if (!client) {
          return;
        }

        const result = await client.campaignSetModelVersion({
          campaignId,
          modelVersionId,
        });
        if (!emitResult(result, options.json)) {
          return;
        }

        if (!options.json && result.ok) {
          console.log(formatCampaignSetModelHuman(result.data));
        }
      },
    );

  const campaignWeightsCommand = campaignCommand
    .command("weights")
    .description("Campaign weights operations.");

  campaignWeightsCommand
    .command("set")
    .description("Set campaign rater-group weights (`draft`/`started`, until lock).")
    .argument("<campaign_id>", "Campaign identifier.")
    .requiredOption("--manager <value>", "Manager weight.", Number)
    .requiredOption("--peers <value>", "Peers weight.", Number)
    .requiredOption("--subordinates <value>", "Subordinates weight.", Number)
    .option("--json", "Output machine-readable JSON.")
    .action(async (campaignId: string, options: CampaignWeightsSetOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      if (
        !Number.isFinite(options.manager) ||
        !Number.isFinite(options.peers) ||
        !Number.isFinite(options.subordinates)
      ) {
        emitError(
          createOperationError(
            "invalid_input",
            "Weights must be finite numbers for --manager/--peers/--subordinates.",
          ),
          options.json,
        );
        return;
      }

      const result = await client.campaignWeightsSet({
        campaignId,
        manager: options.manager,
        peers: options.peers,
        subordinates: options.subordinates,
      });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatCampaignWeightsSetHuman(result.data));
      }
    });

  campaignCommand
    .command("start")
    .description("Start campaign (`draft -> started`).")
    .argument("<campaign_id>", "Campaign identifier.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (campaignId: string, options: CampaignTransitionOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.campaignStart({ campaignId });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatCampaignTransitionHuman(result.data));
      }
    });

  campaignCommand
    .command("stop")
    .description("Stop campaign early (`started -> ended`).")
    .argument("<campaign_id>", "Campaign identifier.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (campaignId: string, options: CampaignTransitionOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.campaignStop({ campaignId });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatCampaignTransitionHuman(result.data));
      }
    });

  campaignCommand
    .command("end")
    .description("End campaign (`started -> ended`) helper for manual admin/ops flow.")
    .argument("<campaign_id>", "Campaign identifier.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (campaignId: string, options: CampaignTransitionOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.campaignEnd({ campaignId });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatCampaignTransitionHuman(result.data));
      }
    });

  const campaignParticipantsCommand = campaignCommand
    .command("participants")
    .description("Campaign participants operations.");

  campaignParticipantsCommand
    .command("add")
    .description("Add employees to campaign participants (`draft` only).")
    .argument("<campaign_id>", "Campaign identifier.")
    .argument("<employee_ids...>", "Employee identifiers.")
    .option("--json", "Output machine-readable JSON.")
    .action(
      async (
        campaignId: string,
        employeeIds: string[],
        options: CampaignParticipantsMutationOptions,
      ) => {
        const client = await getClientWithActiveCompany(options.json);
        if (!client) {
          return;
        }

        const result = await client.campaignParticipantsAdd({
          campaignId,
          employeeIds,
        });
        if (!emitResult(result, options.json)) {
          return;
        }

        if (!options.json && result.ok) {
          console.log(formatCampaignParticipantsMutationHuman(result.data));
        }
      },
    );

  campaignParticipantsCommand
    .command("remove")
    .description("Remove employees from campaign participants (`draft` only).")
    .argument("<campaign_id>", "Campaign identifier.")
    .argument("<employee_ids...>", "Employee identifiers.")
    .option("--json", "Output machine-readable JSON.")
    .action(
      async (
        campaignId: string,
        employeeIds: string[],
        options: CampaignParticipantsMutationOptions,
      ) => {
        const client = await getClientWithActiveCompany(options.json);
        if (!client) {
          return;
        }

        const result = await client.campaignParticipantsRemove({
          campaignId,
          employeeIds,
        });
        if (!emitResult(result, options.json)) {
          return;
        }

        if (!options.json && result.ok) {
          console.log(formatCampaignParticipantsMutationHuman(result.data));
        }
      },
    );

  campaignParticipantsCommand
    .command("add-departments")
    .description("Add participants from selected departments (with descendants) in draft campaign.")
    .argument("<campaign_id>", "Campaign identifier.")
    .requiredOption(
      "--from-departments <department_ids...>",
      "Root department identifiers to include (descendants included).",
    )
    .option("--include-self <true|false>", "Set includeSelf for added participants.", "true")
    .option("--json", "Output machine-readable JSON.")
    .action(async (campaignId: string, options: CampaignParticipantsAddDepartmentsOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      let includeSelf: boolean | undefined;
      try {
        includeSelf =
          options.includeSelf !== undefined
            ? parseBooleanOption(options.includeSelf, "--include-self")
            : undefined;
      } catch (error: unknown) {
        emitError(
          errorFromUnknown(error, "invalid_input", "Invalid --include-self value."),
          options.json,
        );
        return;
      }

      const result = await client.campaignParticipantsAddFromDepartments({
        campaignId,
        departmentIds: options.fromDepartments,
        ...(includeSelf !== undefined ? { includeSelf } : {}),
      });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(
          `Participants added: campaign=${result.data.campaignId}, added=${result.data.addedEmployeeIds.length}, total=${result.data.totalParticipants}`,
        );
      }
    });

  campaignCommand
    .command("progress")
    .description("Show campaign questionnaire progress for HR (counts + pending lists).")
    .argument("<campaign_id>", "Campaign identifier.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (campaignId: string, options: CampaignTransitionOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.campaignProgressGet({ campaignId });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatCampaignProgressHuman(result.data));
      }
    });

  campaignCommand
    .command("snapshot")
    .description("Campaign snapshot operations.")
    .command("list")
    .description("List campaign employee snapshots (snapshot-on-start).")
    .requiredOption("--campaign <campaign_id>", "Campaign identifier.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (options: CampaignSnapshotListOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.campaignSnapshotList({
        campaignId: options.campaign,
      });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatCampaignSnapshotsHuman(result.data));
      }
    });

  const matrixCommand = program.command("matrix").description("Rater matrix operations.");

  matrixCommand
    .command("generate")
    .description("Generate suggested matrix assignments from participants and org structure.")
    .argument("<campaign_id>", "Campaign identifier.")
    .option(
      "--from-departments <department_ids...>",
      "Optional department filter for subject set (with descendants).",
    )
    .option("--json", "Output machine-readable JSON.")
    .action(async (campaignId: string, options: MatrixGenerateOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.matrixGenerateSuggested({
        campaignId,
        ...(options.fromDepartments ? { departmentIds: options.fromDepartments } : {}),
      });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatMatrixSuggestionsHuman(result.data));
      }
    });

  matrixCommand
    .command("set")
    .description("Replace matrix assignments (`draft`/`started`, until lock).")
    .argument("<campaign_id>", "Campaign identifier.")
    .requiredOption(
      "--assignments-json <json>",
      "JSON array of assignments [{subjectEmployeeId,raterEmployeeId,raterRole}].",
    )
    .option("--json", "Output machine-readable JSON.")
    .action(async (campaignId: string, options: MatrixSetOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      let assignmentsPayload: unknown;
      try {
        assignmentsPayload = JSON.parse(options.assignmentsJson);
      } catch (error: unknown) {
        emitError(
          errorFromUnknown(error, "invalid_input", "Invalid --assignments-json payload."),
          options.json,
        );
        return;
      }

      if (!Array.isArray(assignmentsPayload)) {
        emitError(
          createOperationError("invalid_input", "--assignments-json must be a JSON array."),
          options.json,
        );
        return;
      }

      const result = await client.matrixSet({
        campaignId,
        assignments: assignmentsPayload as Array<{
          subjectEmployeeId: string;
          raterEmployeeId: string;
          raterRole: "manager" | "peer" | "subordinate" | "self";
        }>,
      });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatMatrixSetHuman(result.data));
      }
    });

  const remindersCommand = program
    .command("reminders")
    .description("Reminder generation operations.");

  remindersCommand
    .command("generate")
    .description("Generate reminder outbox rows for pending questionnaires.")
    .requiredOption("--campaign <campaign_id>", "Campaign identifier.")
    .option("--now <iso_timestamp>", "Override current time (ISO) for deterministic checks.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (options: RemindersGenerateOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.notificationsGenerateReminders({
        campaignId: options.campaign,
        ...(options.now ? { now: options.now } : {}),
      });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatRemindersGenerateHuman(result.data));
      }
    });

  const notificationsCommand = program
    .command("notifications")
    .description("Notification outbox dispatch operations.");

  notificationsCommand
    .command("dispatch")
    .description("Dispatch pending notification outbox rows.")
    .option("--campaign <campaign_id>", "Campaign identifier filter.")
    .option("--limit <n>", "Max outbox rows to process in one run (default: 100).")
    .option("--provider <provider>", "Dispatch provider: stub | resend.", "stub")
    .option("--json", "Output machine-readable JSON.")
    .action(async (options: NotificationsDispatchOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      let parsedLimit: number | undefined;
      if (options.limit !== undefined) {
        const value = Number(options.limit);
        if (!Number.isInteger(value) || value < 1) {
          emitError(
            createOperationError("invalid_input", "--limit must be an integer >= 1.", {
              value: options.limit,
            }),
            options.json,
          );
          return;
        }
        parsedLimit = value;
      }

      if (
        options.provider !== undefined &&
        options.provider !== "stub" &&
        options.provider !== "resend"
      ) {
        emitError(
          createOperationError("invalid_input", '--provider must be "stub" or "resend".', {
            value: options.provider,
          }),
          options.json,
        );
        return;
      }

      const result = await client.notificationsDispatchOutbox({
        ...(options.campaign ? { campaignId: options.campaign } : {}),
        ...(typeof parsedLimit === "number" ? { limit: parsedLimit } : {}),
        ...(options.provider ? { provider: options.provider } : {}),
      });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatNotificationsDispatchHuman(result.data));
      }
    });

  const aiCommand = program.command("ai").description("AI processing operations.");

  aiCommand
    .command("run")
    .description("Run AI processing for ended campaign (MVP stub mode).")
    .argument("<campaign_id>", "Campaign identifier.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (campaignId: string, options: AiRunOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.aiRunForCampaign({ campaignId });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatAiRunHuman(result.data));
      }
    });

  const questionnaireCommand = program
    .command("questionnaire")
    .description("Questionnaire operations.");

  questionnaireCommand
    .command("list")
    .description("List assigned questionnaires by campaign/status.")
    .requiredOption("--campaign <campaign_id>", "Campaign identifier.")
    .option("--status <status>", "Status filter (not_started | in_progress | submitted).")
    .option("--json", "Output machine-readable JSON.")
    .action(async (options: QuestionnaireListOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.questionnaireListAssigned({
        campaignId: options.campaign,
        status: options.status,
      });

      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatQuestionnaireListHuman(result.data));
      }
    });

  questionnaireCommand
    .command("save-draft")
    .description("Save questionnaire draft and trigger campaign lock (if first draft).")
    .argument("<questionnaire_id>", "Questionnaire identifier.")
    .option("--draft-json <json>", "Draft payload JSON string.", "{}")
    .option("--json", "Output machine-readable JSON.")
    .action(async (questionnaireId: string, options: QuestionnaireSaveDraftOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      let draftPayload: Record<string, unknown>;
      try {
        const parsed = JSON.parse(options.draftJson ?? "{}");
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          throw new Error("draft-json must be a JSON object.");
        }
        draftPayload = parsed as Record<string, unknown>;
      } catch (error: unknown) {
        emitError(
          errorFromUnknown(error, "invalid_input", "Invalid --draft-json payload."),
          options.json,
        );
        return;
      }

      const result = await client.questionnaireSaveDraft({
        questionnaireId,
        draft: draftPayload,
      });

      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(
          `Draft saved: questionnaire=${result.data.questionnaireId}, status=${result.data.status}, campaignLockedAt=${result.data.campaignLockedAt}`,
        );
      }
    });

  questionnaireCommand
    .command("submit")
    .description("Submit questionnaire.")
    .argument("<questionnaire_id>", "Questionnaire identifier.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (questionnaireId: string, options: JsonFlagOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.questionnaireSubmit({ questionnaireId });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(
          `Submitted: questionnaire=${result.data.questionnaireId}, submittedAt=${result.data.submittedAt}${result.data.wasAlreadySubmitted ? " (already submitted)" : ""}`,
        );
      }
    });

  const resultsCommand = program.command("results").description("Results read operations.");

  resultsCommand
    .command("my")
    .description("Get current user dashboard in campaign (processed/summary open text only).")
    .requiredOption("--campaign <campaign_id>", "Campaign identifier.")
    .option(
      "--small-group-policy <policy>",
      "Anonymity policy for small groups: hide | merge_to_other (default: hide).",
    )
    .option("--anonymity-threshold <n>", "Anonymity threshold (integer >= 1, default: 3).")
    .option("--json", "Output machine-readable JSON.")
    .action(async (options: ResultsMyOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      let anonymityThreshold: number | undefined;
      if (options.anonymityThreshold !== undefined) {
        const parsed = Number(options.anonymityThreshold);
        if (!Number.isInteger(parsed) || parsed < 1) {
          emitError(
            createOperationError(
              "invalid_input",
              "--anonymity-threshold must be an integer >= 1.",
              {
                value: options.anonymityThreshold,
              },
            ),
            options.json,
          );
          return;
        }
        anonymityThreshold = parsed;
      }

      const result = await client.resultsGetMyDashboard({
        campaignId: options.campaign,
        smallGroupPolicy: options.smallGroupPolicy,
        ...(typeof anonymityThreshold === "number" ? { anonymityThreshold } : {}),
      });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatResultsDashboardHuman(result.data));
      }
    });

  resultsCommand
    .command("team")
    .description("Get manager team dashboard for subject in campaign (processed/summary only).")
    .requiredOption("--campaign <campaign_id>", "Campaign identifier.")
    .requiredOption("--subject <employee_id>", "Subject employee identifier.")
    .option(
      "--small-group-policy <policy>",
      "Anonymity policy for small groups: hide | merge_to_other (default: hide).",
    )
    .option("--anonymity-threshold <n>", "Anonymity threshold (integer >= 1, default: 3).")
    .option("--json", "Output machine-readable JSON.")
    .action(async (options: ResultsTeamOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      let anonymityThreshold: number | undefined;
      if (options.anonymityThreshold !== undefined) {
        const parsed = Number(options.anonymityThreshold);
        if (!Number.isInteger(parsed) || parsed < 1) {
          emitError(
            createOperationError(
              "invalid_input",
              "--anonymity-threshold must be an integer >= 1.",
              {
                value: options.anonymityThreshold,
              },
            ),
            options.json,
          );
          return;
        }
        anonymityThreshold = parsed;
      }

      const result = await client.resultsGetTeamDashboard({
        campaignId: options.campaign,
        subjectEmployeeId: options.subject,
        smallGroupPolicy: options.smallGroupPolicy,
        ...(typeof anonymityThreshold === "number" ? { anonymityThreshold } : {}),
      });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatResultsDashboardHuman(result.data));
      }
    });

  resultsCommand
    .command("hr")
    .description("Get HR view of results for subject in campaign.")
    .requiredOption("--campaign <campaign_id>", "Campaign identifier.")
    .requiredOption("--subject <employee_id>", "Subject employee identifier.")
    .option(
      "--small-group-policy <policy>",
      "Anonymity policy for small groups: hide | merge_to_other (default: hide).",
    )
    .option("--anonymity-threshold <n>", "Anonymity threshold (integer >= 1, default: 3).")
    .option("--json", "Output machine-readable JSON.")
    .action(async (options: ResultsHrOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      let anonymityThreshold: number | undefined;
      if (options.anonymityThreshold !== undefined) {
        const parsed = Number(options.anonymityThreshold);
        if (!Number.isInteger(parsed) || parsed < 1) {
          emitError(
            createOperationError(
              "invalid_input",
              "--anonymity-threshold must be an integer >= 1.",
              {
                value: options.anonymityThreshold,
              },
            ),
            options.json,
          );
          return;
        }
        anonymityThreshold = parsed;
      }

      const result = await client.resultsGetHrView({
        campaignId: options.campaign,
        subjectEmployeeId: options.subject,
        smallGroupPolicy: options.smallGroupPolicy,
        ...(typeof anonymityThreshold === "number" ? { anonymityThreshold } : {}),
      });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatResultsHrHuman(result.data));
      }
    });

  await program.parseAsync(normalizedArgv);
};

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isDirectRun) {
  void runCli(process.argv);
}

export const cliReady = true;

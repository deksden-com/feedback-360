export const seedScenarios = [
  "S0_empty",
  "S1_company_min",
  "S1_multi_tenant_min",
  "S2_org_basic",
  "S4_campaign_draft",
  "S5_campaign_started_no_answers",
  "S6_campaign_started_some_drafts",
  "S7_campaign_started_some_submitted",
  "S8_campaign_ended",
  "S9_campaign_completed_with_ai",
] as const;

export type SeedScenario = (typeof seedScenarios)[number];

export const operationErrorCodes = [
  "invalid_input",
  "unauthenticated",
  "forbidden",
  "not_found",
  "invalid_transition",
  "campaign_started_immutable",
  "campaign_locked",
  "campaign_ended_readonly",
  "webhook_invalid_signature",
  "webhook_timestamp_invalid",
  "ai_job_conflict",
] as const;

export type OperationErrorCode = (typeof operationErrorCodes)[number];

export type OperationError = {
  code: OperationErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export type OperationResult<Output> =
  | {
      ok: true;
      data: Output;
    }
  | {
      ok: false;
      error: OperationError;
    };

export const membershipRoles = ["hr_admin", "hr_reader", "manager", "employee"] as const;
export type MembershipRole = (typeof membershipRoles)[number];

export type OperationContext = {
  userId?: string;
  companyId?: string;
  role?: MembershipRole;
};

export type DispatchOperationInput = {
  operation: string;
  input: unknown;
  context?: OperationContext;
};

export const knownOperations = [
  "seed.run",
  "system.ping",
  "company.updateProfile",
  "membership.list",
  "model.version.create",
  "model.version.list",
  "model.version.get",
  "model.version.cloneDraft",
  "model.version.upsertDraft",
  "model.version.publish",
  "campaign.list",
  "campaign.get",
  "campaign.create",
  "campaign.updateDraft",
  "campaign.start",
  "campaign.stop",
  "campaign.end",
  "campaign.setModelVersion",
  "campaign.weights.set",
  "campaign.participants.add",
  "campaign.participants.remove",
  "campaign.progress.get",
  "notifications.generateReminders",
  "notifications.dispatchOutbox",
  "notifications.settings.get",
  "notifications.settings.upsert",
  "notifications.settings.preview",
  "notifications.templates.list",
  "notifications.templates.preview",
  "notifications.deliveries.list",
  "results.getMyDashboard",
  "results.getTeamDashboard",
  "results.getHrView",
  "employee.upsert",
  "employee.listActive",
  "employee.directoryList",
  "employee.profileGet",
  "identity.provisionAccess",
  "department.list",
  "department.upsert",
  "org.department.move",
  "org.manager.set",
  "campaign.snapshot.list",
  "campaign.participants.addFromDepartments",
  "matrix.list",
  "matrix.generateSuggested",
  "matrix.set",
  "ai.runForCampaign",
  "client.setActiveCompany",
  "questionnaire.listAssigned",
  "questionnaire.getDraft",
  "questionnaire.saveDraft",
  "questionnaire.submit",
] as const;
export type KnownOperation = (typeof knownOperations)[number];

export type SystemPingInput = Record<string, never>;
export type SystemPingOutput = {
  pong: "ok";
  timestamp: string;
};

export type CompanyUpdateProfileInput = {
  companyId: string;
  name: string;
};

export type CompanyUpdateProfileOutput = {
  companyId: string;
  name: string;
  updatedAt: string;
};

export type ModelIndicatorInput = {
  text: string;
  order?: number;
};

export type ModelLevelInput = {
  level: number;
  text: string;
};

export type ModelCompetencyInput = {
  name: string;
  indicators?: ModelIndicatorInput[];
  levels?: ModelLevelInput[];
};

export type ModelGroupInput = {
  name: string;
  weight: number;
  competencies: ModelCompetencyInput[];
};

export type ModelVersionCreateInput = {
  name: string;
  kind: "indicators" | "levels";
  groups: ModelGroupInput[];
};

export type ModelVersionCreateOutput = {
  modelVersionId: string;
  companyId: string;
  name: string;
  kind: "indicators" | "levels";
  version: number;
  createdAt: string;
  groupCount: number;
  competencyCount: number;
  indicatorCount: number;
  levelCount: number;
};

export type ModelVersionListInput = {
  kind?: "indicators" | "levels";
  status?: ModelVersionStatus;
  search?: string;
};

export type ModelVersionStatus = "draft" | "published";

export type ModelVersionListItem = {
  modelVersionId: string;
  name: string;
  kind: "indicators" | "levels";
  version: number;
  status: ModelVersionStatus;
  createdAt: string;
  updatedAt?: string;
  usedByActiveCampaigns?: number;
};

export type ModelVersionListOutput = {
  items: ModelVersionListItem[];
};

export type ModelVersionGetInput = {
  modelVersionId: string;
};

export type ModelVersionGetOutput = {
  modelVersionId: string;
  companyId: string;
  name: string;
  kind: "indicators" | "levels";
  version: number;
  status: ModelVersionStatus;
  createdAt: string;
  updatedAt: string;
  groups: ModelGroupInput[];
};

export type ModelVersionCloneDraftInput = {
  sourceModelVersionId: string;
  name?: string;
};

export type ModelVersionCloneDraftOutput = ModelVersionGetOutput;

export type ModelVersionUpsertDraftInput = {
  modelVersionId?: string;
  name: string;
  kind: "indicators" | "levels";
  groups: ModelGroupInput[];
};

export type ModelVersionUpsertDraftOutput = ModelVersionGetOutput;

export type ModelVersionPublishInput = {
  modelVersionId: string;
};

export type ModelVersionPublishOutput = {
  modelVersionId: string;
  name: string;
  version: number;
  status: "published";
  updatedAt: string;
};

export type CampaignCreateInput = {
  name: string;
  modelVersionId: string;
  startAt: string;
  endAt: string;
  timezone?: string;
};

export type CampaignCreateOutput = {
  campaignId: string;
  companyId: string;
  modelVersionId: string;
  name: string;
  status: "draft";
  startAt: string;
  endAt: string;
  timezone: string;
  createdAt: string;
};

export const campaignLifecycleStatuses = [
  "draft",
  "started",
  "ended",
  "processing_ai",
  "ai_failed",
  "completed",
] as const;

export type CampaignLifecycleStatus = (typeof campaignLifecycleStatuses)[number];

export type CampaignListInput = {
  status?: CampaignLifecycleStatus;
};

export type CampaignListItem = {
  campaignId: string;
  companyId: string;
  name: string;
  status: CampaignLifecycleStatus;
  modelVersionId: string | null;
  modelName: string | null;
  modelKind: "indicators" | "levels" | null;
  modelVersion: number | null;
  startAt: string;
  endAt: string;
  timezone: string;
  lockedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CampaignListOutput = {
  items: CampaignListItem[];
};

export type CampaignGetInput = {
  campaignId: string;
};

export type CampaignGetOutput = CampaignListItem & {
  managerWeight: number;
  peersWeight: number;
  subordinatesWeight: number;
  selfWeight: number;
};

export type CampaignUpdateDraftInput = {
  campaignId: string;
  name: string;
  modelVersionId: string;
  startAt: string;
  endAt: string;
  timezone?: string;
};

export type CampaignUpdateDraftOutput = {
  campaignId: string;
  companyId: string;
  modelVersionId: string;
  name: string;
  status: "draft";
  startAt: string;
  endAt: string;
  timezone: string;
  changed: boolean;
  updatedAt: string;
};

export type CampaignTransitionInput = {
  campaignId: string;
};

export type CampaignTransitionOutput = {
  campaignId: string;
  previousStatus: CampaignLifecycleStatus;
  status: CampaignLifecycleStatus;
  changed: boolean;
  updatedAt: string;
};

export type CampaignSetModelVersionInput = {
  campaignId: string;
  modelVersionId: string;
};

export type CampaignSetModelVersionOutput = {
  campaignId: string;
  modelVersionId: string;
  changed: boolean;
  updatedAt: string;
};

export type CampaignParticipantsMutationInput = {
  campaignId: string;
  employeeIds: string[];
};

export type CampaignParticipantsMutationOutput = {
  campaignId: string;
  changedEmployeeIds: string[];
  totalParticipants: number;
};

export type CampaignWeightsSetInput = {
  campaignId: string;
  manager: number;
  peers: number;
  subordinates: number;
};

export type CampaignWeightsSetOutput = {
  campaignId: string;
  manager: number;
  peers: number;
  subordinates: number;
  self: 0;
  changed: boolean;
  updatedAt: string;
};

export type EmployeeUpsertInput = {
  employeeId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  telegramUserId?: string;
  telegramChatId?: string;
  isActive?: boolean;
};

export type EmployeeUpsertOutput = {
  employeeId: string;
  companyId: string;
  isActive: boolean;
  deletedAt?: string;
  updatedAt: string;
  created: boolean;
};

export type EmployeeListActiveInput = {
  companyId?: string;
};

export type EmployeeListActiveItem = {
  employeeId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
};

export type EmployeeListActiveOutput = {
  items: EmployeeListActiveItem[];
};

export type EmployeeDirectoryStatus = "active" | "inactive" | "deleted" | "all";

export type EmployeeDirectoryListInput = {
  companyId?: string;
  search?: string;
  departmentId?: string;
  status?: EmployeeDirectoryStatus;
};

export type EmployeeDirectoryListItem = {
  employeeId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  telegramUserId?: string;
  telegramChatId?: string;
  isActive: boolean;
  deletedAt?: string;
  departmentId?: string;
  departmentName?: string;
  managerEmployeeId?: string;
  managerName?: string;
  positionTitle?: string;
  positionLevel?: number;
  userId?: string;
  membershipRole?: MembershipRole;
};

export type EmployeeDirectoryListOutput = {
  items: EmployeeDirectoryListItem[];
};

export type EmployeeProfileGetInput = {
  employeeId: string;
};

export type EmployeeProfileDepartmentHistoryItem = {
  departmentId: string;
  departmentName?: string;
  startAt: string;
  endAt?: string;
};

export type EmployeeProfileManagerHistoryItem = {
  managerEmployeeId: string;
  managerName?: string;
  startAt: string;
  endAt?: string;
};

export type EmployeeProfilePositionHistoryItem = {
  title: string;
  level?: number;
  startAt: string;
  endAt?: string;
};

export type EmployeeProfileGetOutput = {
  employeeId: string;
  companyId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  telegramUserId?: string;
  telegramChatId?: string;
  isActive: boolean;
  deletedAt?: string;
  currentDepartmentId?: string;
  currentDepartmentName?: string;
  currentManagerEmployeeId?: string;
  currentManagerName?: string;
  currentPositionTitle?: string;
  currentPositionLevel?: number;
  userId?: string;
  membershipRole?: MembershipRole;
  departmentHistory: EmployeeProfileDepartmentHistoryItem[];
  managerHistory: EmployeeProfileManagerHistoryItem[];
  positionHistory: EmployeeProfilePositionHistoryItem[];
};

export type IdentityProvisionAccessInput = {
  employeeId: string;
  userId: string;
  email: string;
  role: MembershipRole;
};

export type IdentityProvisionAccessOutput = {
  employeeId: string;
  userId: string;
  email: string;
  role: MembershipRole;
  membershipId: string;
  employeeUserLinkId: string;
};

export type DepartmentListInput = {
  companyId?: string;
  includeInactive?: boolean;
};

export type DepartmentListItem = {
  departmentId: string;
  name: string;
  parentDepartmentId?: string;
  isActive: boolean;
  deletedAt?: string;
  memberCount: number;
};

export type DepartmentListOutput = {
  items: DepartmentListItem[];
};

export type DepartmentUpsertInput = {
  departmentId: string;
  name: string;
  parentDepartmentId?: string;
  isActive?: boolean;
};

export type DepartmentUpsertOutput = {
  departmentId: string;
  companyId: string;
  name: string;
  parentDepartmentId?: string;
  isActive: boolean;
  deletedAt?: string;
  updatedAt: string;
  created: boolean;
};

export type MembershipListInput = Record<string, never>;

export type MembershipListItem = {
  companyId: string;
  companyName: string;
  role: MembershipRole;
};

export type MembershipListOutput = {
  items: MembershipListItem[];
};

export type OrgDepartmentMoveInput = {
  employeeId: string;
  toDepartmentId: string;
};

export type OrgDepartmentMoveOutput = {
  employeeId: string;
  previousDepartmentId?: string;
  departmentId: string;
  changed: boolean;
  effectiveAt: string;
};

export type OrgManagerSetInput = {
  employeeId: string;
  managerEmployeeId: string;
};

export type OrgManagerSetOutput = {
  employeeId: string;
  previousManagerEmployeeId?: string;
  managerEmployeeId: string;
  changed: boolean;
  effectiveAt: string;
};

export type CampaignSnapshotListInput = {
  campaignId: string;
};

export type CampaignSnapshotListItem = {
  snapshotId: string;
  companyId: string;
  campaignId: string;
  employeeId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  departmentId?: string;
  managerEmployeeId?: string;
  positionTitle?: string;
  positionLevel?: number;
  snapshotAt: string;
};

export type CampaignSnapshotListOutput = {
  items: CampaignSnapshotListItem[];
};

export type CampaignProgressGetInput = {
  campaignId: string;
};

export type CampaignProgressStatusCounts = {
  notStarted: number;
  inProgress: number;
  submitted: number;
};

export type CampaignProgressPendingItem = {
  questionnaireId: string;
  campaignId: string;
  companyId: string;
  subjectEmployeeId: string;
  raterEmployeeId: string;
  status: "not_started" | "in_progress";
  firstDraftAt?: string;
  submittedAt?: string;
};

export type CampaignProgressPendingGroupItem = {
  employeeId: string;
  pendingCount: number;
};

export type CampaignProgressGetOutput = {
  campaignId: string;
  companyId: string;
  totalQuestionnaires: number;
  statusCounts: CampaignProgressStatusCounts;
  campaignLockedAt?: string;
  pendingQuestionnaires: CampaignProgressPendingItem[];
  pendingByRater: CampaignProgressPendingGroupItem[];
  pendingBySubject: CampaignProgressPendingGroupItem[];
};

export type NotificationsGenerateRemindersInput = {
  campaignId: string;
  now?: string;
};

export type NotificationsGenerateRemindersOutput = {
  campaignId: string;
  dateBucket: string;
  candidateRecipients: number;
  generated: number;
  deduplicated: number;
};

export type NotificationsDispatchProvider = "stub" | "resend";

export type NotificationsDispatchOutboxInput = {
  campaignId?: string;
  limit?: number;
  provider?: NotificationsDispatchProvider;
};

export type NotificationsDispatchOutboxOutput = {
  provider: NotificationsDispatchProvider;
  processed: number;
  sent: number;
  failed: number;
  attemptsLogged: number;
  remainingPending: number;
};

export type NotificationReminderSettingsOutput = {
  companyId: string;
  reminderScheduledHour: number;
  quietHoursStart: number;
  quietHoursEnd: number;
  reminderWeekdays: number[];
  locale: "ru";
  updatedAt: string;
};

export type NotificationReminderSettingsGetInput = Record<string, never>;

export type NotificationReminderSettingsUpsertInput = {
  reminderScheduledHour: number;
  quietHoursStart: number;
  quietHoursEnd: number;
  reminderWeekdays: number[];
};

export type NotificationReminderPreviewInput = {
  campaignId?: string;
  now?: string;
  reminderScheduledHour?: number;
  quietHoursStart?: number;
  quietHoursEnd?: number;
  reminderWeekdays?: number[];
};

export type NotificationReminderPreviewOutput = {
  companyId: string;
  campaignId?: string;
  effectiveTimezone: string;
  companyTimezone: string;
  campaignTimezone?: string;
  reminderScheduledHour: number;
  quietHoursStart: number;
  quietHoursEnd: number;
  reminderWeekdays: number[];
  nextRunAt: string | null;
  localDateBucket: string;
  localWeekday: number;
  localHour: number;
};

export type NotificationTemplateCatalogItem = {
  templateKey: "campaign_invite@v1" | "campaign_reminder@v1";
  locale: "ru";
  version: "v1";
  channel: "email";
  title: string;
  description: string;
  variables: string[];
};

export type NotificationTemplateCatalogOutput = {
  items: NotificationTemplateCatalogItem[];
};

export type NotificationTemplatePreviewInput = {
  templateKey: NotificationTemplateCatalogItem["templateKey"];
  campaignId?: string;
};

export type NotificationTemplatePreviewOutput = NotificationTemplateCatalogItem & {
  subject: string;
  text: string;
  html: string;
};

export type NotificationDeliveryDiagnosticsInput = {
  campaignId?: string;
  status?: "pending" | "sent" | "failed" | "dead_letter" | "retry_scheduled";
  channel?: "email";
};

export type NotificationDeliveryDiagnosticsOutput = {
  items: Array<{
    outboxId: string;
    campaignId: string;
    campaignName: string;
    recipientEmployeeId: string;
    recipientLabel: string;
    toEmail: string;
    eventType: string;
    templateKey: string;
    channel: "email";
    status: string;
    attempts: number;
    nextRetryAt: string | null;
    lastError: string | null;
    idempotencyKey: string;
    attemptsHistory: Array<{
      attemptNo: number;
      provider: string;
      status: string;
      errorMessage: string | null;
      requestedAt: string;
    }>;
  }>;
};

export const resultsGroupKeys = ["manager", "peers", "subordinates", "self"] as const;
export type ResultsGroupKey = (typeof resultsGroupKeys)[number];
export const resultsGroupVisibilityStates = ["shown", "hidden", "merged"] as const;
export type ResultsGroupVisibilityState = (typeof resultsGroupVisibilityStates)[number];
export const smallGroupPolicies = ["hide", "merge_to_other"] as const;
export type SmallGroupPolicy = (typeof smallGroupPolicies)[number];

export type ResultsGetHrViewInput = {
  campaignId: string;
  subjectEmployeeId: string;
  smallGroupPolicy?: SmallGroupPolicy;
  anonymityThreshold?: number;
};

export type ResultsGetMyDashboardInput = {
  campaignId: string;
  smallGroupPolicy?: SmallGroupPolicy;
  anonymityThreshold?: number;
};

export type ResultsGetTeamDashboardInput = {
  campaignId: string;
  subjectEmployeeId: string;
  smallGroupPolicy?: SmallGroupPolicy;
  anonymityThreshold?: number;
};

export type ResultsHrViewRaterScore = {
  raterEmployeeId: string;
  group: ResultsGroupKey;
  competencyId: string;
  score?: number;
  validIndicatorCount: number;
  totalIndicatorCount: number;
};

export type ResultsHrViewLevelDistribution = {
  level1: number;
  level2: number;
  level3: number;
  level4: number;
};

export type ResultsHrViewLevelSummary = {
  modeLevel: 1 | 2 | 3 | 4 | null;
  distribution: ResultsHrViewLevelDistribution;
  nValid: number;
  nUnsure: number;
};

export type ResultsHrViewCompetencyScore = {
  competencyId: string;
  competencyName: string;
  groupId: string;
  groupName: string;
  managerScore?: number;
  managerRaters: number;
  peersScore?: number;
  peersRaters: number;
  subordinatesScore?: number;
  subordinatesRaters: number;
  selfScore?: number;
  selfRaters: number;
  otherScore?: number;
  otherRaters: number;
  managerVisibility: "shown";
  peersVisibility: ResultsGroupVisibilityState;
  subordinatesVisibility: ResultsGroupVisibilityState;
  selfVisibility: "shown";
  otherVisibility?: "shown" | "hidden";
  managerLevels?: ResultsHrViewLevelSummary;
  peersLevels?: ResultsHrViewLevelSummary;
  subordinatesLevels?: ResultsHrViewLevelSummary;
  selfLevels?: ResultsHrViewLevelSummary;
  otherLevels?: ResultsHrViewLevelSummary;
};

export type ResultsHrViewGroupOverall = {
  manager?: number;
  peers?: number;
  subordinates?: number;
  self?: number;
  other?: number;
};

export type ResultsHrViewGroupWeights = {
  manager: number;
  peers: number;
  subordinates: number;
  self: number;
  other: number;
};

export type ResultsHrViewGroupVisibility = {
  manager: "shown";
  peers: ResultsGroupVisibilityState;
  subordinates: ResultsGroupVisibilityState;
  self: "shown";
  other?: "shown" | "hidden";
};

export type ResultsOpenTextGroup = ResultsGroupKey | "other";

export type ResultsOpenTextItem = {
  competencyId: string;
  group: ResultsOpenTextGroup;
  count: number;
  rawText?: string;
  processedText?: string;
  summaryText?: string;
};

export type ResultsGetHrViewOutput = {
  campaignId: string;
  companyId: string;
  subjectEmployeeId: string;
  modelVersionId: string;
  modelKind: "indicators" | "levels";
  anonymityThreshold: number;
  smallGroupPolicy: SmallGroupPolicy;
  groupVisibility: ResultsHrViewGroupVisibility;
  competencyScores: ResultsHrViewCompetencyScore[];
  raterScores: ResultsHrViewRaterScore[];
  groupOverall: ResultsHrViewGroupOverall;
  configuredGroupWeights: ResultsHrViewGroupWeights;
  effectiveGroupWeights: ResultsHrViewGroupWeights;
  overallScore?: number;
  openText?: ResultsOpenTextItem[];
};

export type ResultsGetMyDashboardOutput = {
  campaignId: string;
  companyId: string;
  subjectEmployeeId: string;
  modelVersionId: string;
  modelKind: "indicators" | "levels";
  anonymityThreshold: number;
  smallGroupPolicy: SmallGroupPolicy;
  groupVisibility: ResultsHrViewGroupVisibility;
  competencyScores: ResultsHrViewCompetencyScore[];
  groupOverall: ResultsHrViewGroupOverall;
  effectiveGroupWeights: ResultsHrViewGroupWeights;
  overallScore?: number;
  openText: ResultsOpenTextItem[];
};

export type ResultsGetTeamDashboardOutput = ResultsGetMyDashboardOutput;

export type CampaignParticipantsAddFromDepartmentsInput = {
  campaignId: string;
  departmentIds: string[];
  includeSelf?: boolean;
};

export type CampaignParticipantsAddFromDepartmentsOutput = {
  campaignId: string;
  addedEmployeeIds: string[];
  totalParticipants: number;
};

export type MatrixGeneratedAssignment = {
  subjectEmployeeId: string;
  raterEmployeeId: string;
  raterRole: "manager" | "peer" | "subordinate" | "self";
};

export type MatrixAssignmentSource = "auto" | "manual";

export type MatrixGenerateSuggestedInput = {
  campaignId: string;
  departmentIds?: string[];
};

export type MatrixGenerateSuggestedOutput = {
  campaignId: string;
  generatedAssignments: MatrixGeneratedAssignment[];
  totalAssignments: number;
};

export type MatrixSetInput = {
  campaignId: string;
  assignments: MatrixGeneratedAssignment[];
};

export type MatrixSetOutput = {
  campaignId: string;
  totalAssignments: number;
};

export type MatrixListInput = {
  campaignId: string;
};

export type MatrixListAssignment = MatrixGeneratedAssignment & {
  source: MatrixAssignmentSource;
};

export type MatrixListOutput = {
  campaignId: string;
  assignments: MatrixListAssignment[];
  totalAssignments: number;
};

export type AiRunForCampaignInput = {
  campaignId: string;
};

export type AiRunForCampaignOutput = {
  campaignId: string;
  aiJobId: string;
  provider: "mvp_stub";
  status: "completed";
  completedAt: string;
  wasAlreadyCompleted: boolean;
};

export type ClientSetActiveCompanyInput = {
  companyId: string;
};

export type ClientSetActiveCompanyOutput = {
  companyId: string;
};

export const questionnaireStatuses = ["not_started", "in_progress", "submitted"] as const;
export type QuestionnaireStatus = (typeof questionnaireStatuses)[number];
export const questionnaireRaterRoles = ["manager", "peer", "subordinate", "self"] as const;
export type QuestionnaireRaterRole = (typeof questionnaireRaterRoles)[number];
export const questionnaireCampaignStatuses = [
  "draft",
  "started",
  "ended",
  "processing_ai",
  "ai_failed",
  "completed",
] as const;
export type QuestionnaireCampaignStatus = (typeof questionnaireCampaignStatuses)[number];

export type QuestionnaireDefinitionIndicator = {
  indicatorId: string;
  text: string;
  order: number;
};

export type QuestionnaireDefinitionLevel = {
  levelId: string;
  level: number;
  text: string;
};

export type QuestionnaireDefinitionCompetency = {
  competencyId: string;
  name: string;
  order: number;
  indicators?: QuestionnaireDefinitionIndicator[];
  levels?: QuestionnaireDefinitionLevel[];
};

export type QuestionnaireDefinitionGroup = {
  groupId: string;
  name: string;
  weight: number;
  order: number;
  competencies: QuestionnaireDefinitionCompetency[];
};

export type QuestionnaireDefinition = {
  modelVersionId: string;
  modelName?: string;
  modelKind: "indicators" | "levels";
  groups: QuestionnaireDefinitionGroup[];
  totalPrompts: number;
};

export type QuestionnaireListAssignedInput = {
  campaignId?: string;
  status?: QuestionnaireStatus;
};

export type QuestionnaireListAssignedItem = {
  questionnaireId: string;
  campaignId: string;
  companyId: string;
  subjectEmployeeId: string;
  raterEmployeeId: string;
  status: QuestionnaireStatus;
  campaignName?: string;
  campaignStatus?: QuestionnaireCampaignStatus;
  campaignEndAt?: string;
  subjectDisplayName?: string;
  subjectPositionTitle?: string;
  raterRole?: QuestionnaireRaterRole;
  firstDraftAt?: string;
  submittedAt?: string;
};

export type QuestionnaireListAssignedOutput = {
  items: QuestionnaireListAssignedItem[];
};

export type QuestionnaireGetDraftInput = {
  questionnaireId: string;
};

export type QuestionnaireGetDraftOutput = {
  questionnaireId: string;
  campaignId: string;
  companyId: string;
  subjectEmployeeId: string;
  raterEmployeeId: string;
  status: QuestionnaireStatus;
  campaignStatus: QuestionnaireCampaignStatus;
  draft: Record<string, unknown>;
  campaignName?: string;
  campaignEndAt?: string;
  subjectDisplayName?: string;
  subjectPositionTitle?: string;
  raterRole?: QuestionnaireRaterRole;
  definition?: QuestionnaireDefinition;
  firstDraftAt?: string;
  submittedAt?: string;
};

export type QuestionnaireSaveDraftInput = {
  questionnaireId: string;
  draft: Record<string, unknown>;
};

export type QuestionnaireSaveDraftOutput = {
  questionnaireId: string;
  status: "in_progress";
  campaignLockedAt: string;
};

export type QuestionnaireSubmitInput = {
  questionnaireId: string;
};

export type QuestionnaireSubmitOutput = {
  questionnaireId: string;
  status: "submitted";
  submittedAt: string;
  wasAlreadySubmitted: boolean;
};

export type SeedRunInput = {
  scenario: SeedScenario;
  variant?: string;
};

export type SeedRunOutput = {
  scenario: SeedScenario;
  variant?: string;
  handles: Record<string, string>;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const ensureObject = (value: unknown, fieldName: string): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw new Error(`${fieldName} must be an object.`);
  }

  return value;
};

const ensureAllowedKeys = (
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
  fieldName: string,
): void => {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) {
      throw new Error(`${fieldName}.${key} is not allowed.`);
    }
  }
};

const ensureArray = (value: unknown, fieldName: string): unknown[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array.`);
  }

  return value;
};

const ensureStringField = (
  value: Record<string, unknown>,
  field: string,
  fieldName: string,
): string => {
  const fieldValue = value[field];
  if (typeof fieldValue !== "string" || fieldValue.trim().length === 0) {
    throw new Error(`${fieldName}.${field} must be a non-empty string.`);
  }

  return fieldValue.trim();
};

const ensureBooleanField = (
  value: Record<string, unknown>,
  field: string,
  fieldName: string,
): boolean => {
  const fieldValue = value[field];
  if (typeof fieldValue !== "boolean") {
    throw new Error(`${fieldName}.${field} must be a boolean.`);
  }

  return fieldValue;
};

const ensureNumberField = (
  value: Record<string, unknown>,
  field: string,
  fieldName: string,
): number => {
  const fieldValue = value[field];
  if (typeof fieldValue !== "number" || Number.isNaN(fieldValue)) {
    throw new Error(`${fieldName}.${field} must be a number.`);
  }

  return fieldValue;
};

const isSeedScenario = (value: string): value is SeedScenario => {
  return seedScenarios.includes(value as SeedScenario);
};

const isOperationErrorCode = (value: string): value is OperationErrorCode => {
  return operationErrorCodes.includes(value as OperationErrorCode);
};

const isMembershipRole = (value: string): value is MembershipRole => {
  return membershipRoles.includes(value as MembershipRole);
};

const isQuestionnaireStatus = (value: string): value is QuestionnaireStatus => {
  return questionnaireStatuses.includes(value as QuestionnaireStatus);
};

const isQuestionnaireCampaignStatus = (value: string): value is QuestionnaireCampaignStatus => {
  return questionnaireCampaignStatuses.includes(value as QuestionnaireCampaignStatus);
};

const isPendingQuestionnaireStatus = (
  value: string,
): value is CampaignProgressPendingItem["status"] => {
  return value === "not_started" || value === "in_progress";
};

const isResultsGroupKey = (value: string): value is ResultsGroupKey => {
  return resultsGroupKeys.includes(value as ResultsGroupKey);
};

const isResultsGroupVisibilityState = (value: string): value is ResultsGroupVisibilityState => {
  return resultsGroupVisibilityStates.includes(value as ResultsGroupVisibilityState);
};

const isSmallGroupPolicy = (value: string): value is SmallGroupPolicy => {
  return smallGroupPolicies.includes(value as SmallGroupPolicy);
};

export const isKnownOperation = (value: string): value is KnownOperation => {
  return knownOperations.includes(value as KnownOperation);
};

export const createOperationError = (
  code: OperationErrorCode,
  message: string,
  details?: Record<string, unknown>,
): OperationError => {
  return {
    code,
    message,
    ...(details ? { details } : {}),
  };
};

export const parseOperationError = (value: unknown): OperationError => {
  const record = ensureObject(value, "error");

  const code = record.code;
  if (typeof code !== "string" || !isOperationErrorCode(code)) {
    throw new Error(`error.code must be one of: ${operationErrorCodes.join(", ")}`);
  }

  const message = record.message;
  if (typeof message !== "string" || message.trim().length === 0) {
    throw new Error("error.message must be a non-empty string.");
  }

  const details = record.details;
  if (details !== undefined && !isRecord(details)) {
    throw new Error("error.details must be an object when provided.");
  }

  return createOperationError(code, message, details);
};

export const parseOperationContext = (value: unknown): OperationContext => {
  if (value === undefined) {
    return {};
  }

  const record = ensureObject(value, "context");
  ensureAllowedKeys(record, ["userId", "companyId", "role"], "context");

  const userId = record.userId;
  if (userId !== undefined && typeof userId !== "string") {
    throw new Error("context.userId must be a string when provided.");
  }

  const companyId = record.companyId;
  if (companyId !== undefined && typeof companyId !== "string") {
    throw new Error("context.companyId must be a string when provided.");
  }

  const roleValue = record.role;
  if (roleValue !== undefined) {
    if (typeof roleValue !== "string" || !isMembershipRole(roleValue)) {
      throw new Error(`context.role must be one of: ${membershipRoles.join(", ")}`);
    }
  }

  return {
    ...(userId ? { userId } : {}),
    ...(companyId ? { companyId } : {}),
    ...(roleValue ? { role: roleValue } : {}),
  };
};

export const parseDispatchOperationInput = (value: unknown): DispatchOperationInput => {
  const record = ensureObject(value, "dispatch input");
  ensureAllowedKeys(record, ["operation", "input", "context"], "dispatch input");

  const operation = record.operation;
  if (typeof operation !== "string" || operation.trim().length === 0) {
    throw new Error("dispatch input.operation must be a non-empty string.");
  }

  return {
    operation: operation.trim(),
    input: record.input,
    context: parseOperationContext(record.context),
  };
};

export const parseOperationResult = <Output>(
  value: unknown,
  parseOutput: (data: unknown) => Output,
): OperationResult<Output> => {
  const record = ensureObject(value, "operation result");
  ensureAllowedKeys(record, ["ok", "data", "error"], "operation result");

  const ok = record.ok;
  if (typeof ok !== "boolean") {
    throw new Error("operation result.ok must be a boolean.");
  }

  if (ok) {
    return {
      ok: true,
      data: parseOutput(record.data),
    };
  }

  return {
    ok: false,
    error: parseOperationError(record.error),
  };
};

export const errorFromUnknown = (
  error: unknown,
  fallbackCode: OperationErrorCode = "invalid_input",
  fallbackMessage = "Unexpected error.",
): OperationError => {
  if (isRecord(error)) {
    try {
      return parseOperationError(error);
    } catch {
      const maybeCode = error.code;
      const maybeMessage = error.message;
      if (typeof maybeCode === "string" && isOperationErrorCode(maybeCode)) {
        if (typeof maybeMessage === "string" && maybeMessage.trim().length > 0) {
          return createOperationError(
            maybeCode,
            maybeMessage,
            isRecord(error.details) ? error.details : undefined,
          );
        }
      }
    }
  }

  if (error instanceof Error) {
    return createOperationError(fallbackCode, error.message, {
      cause: error.name,
    });
  }

  return createOperationError(fallbackCode, fallbackMessage);
};

export const okResult = <Output>(data: Output): OperationResult<Output> => {
  return { ok: true, data };
};

export const errorResult = <Output>(error: OperationError): OperationResult<Output> => {
  return { ok: false, error };
};

const toStringMap = (value: unknown, fieldName: string): Record<string, string> => {
  const record = ensureObject(value, fieldName);

  const entries = Object.entries(record);
  const map: Record<string, string> = {};

  for (const [key, entryValue] of entries) {
    if (typeof entryValue !== "string") {
      throw new Error(`${fieldName}.${key} must be a string.`);
    }

    map[key] = entryValue;
  }

  return map;
};

export const parseSeedRunInput = (value: unknown): SeedRunInput => {
  const record = ensureObject(value, "seed.run input");
  ensureAllowedKeys(record, ["scenario", "variant"], "seed.run input");

  const scenario = record.scenario;
  if (typeof scenario !== "string" || !isSeedScenario(scenario)) {
    throw new Error(`Unknown seed scenario: ${String(scenario)}`);
  }

  const variant = record.variant;
  if (variant !== undefined && typeof variant !== "string") {
    throw new Error("seed.run input.variant must be a string when provided.");
  }

  return { scenario, variant };
};

export const parseSeedRunOutput = (value: unknown): SeedRunOutput => {
  const record = ensureObject(value, "seed.run output");
  ensureAllowedKeys(record, ["scenario", "variant", "handles"], "seed.run output");

  const scenario = record.scenario;
  if (typeof scenario !== "string" || !isSeedScenario(scenario)) {
    throw new Error(`Unknown seed scenario in output: ${String(scenario)}`);
  }

  const variant = record.variant;
  if (variant !== undefined && typeof variant !== "string") {
    throw new Error("seed.run output.variant must be a string when provided.");
  }

  return {
    scenario,
    variant,
    handles: toStringMap(record.handles, "seed.run output.handles"),
  };
};

export const parseSystemPingInput = (value: unknown): SystemPingInput => {
  const record = ensureObject(value, "system.ping input");
  ensureAllowedKeys(record, [], "system.ping input");
  return {};
};

export const parseSystemPingOutput = (value: unknown): SystemPingOutput => {
  const record = ensureObject(value, "system.ping output");
  ensureAllowedKeys(record, ["pong", "timestamp"], "system.ping output");

  const pong = record.pong;
  if (pong !== "ok") {
    throw new Error('system.ping output.pong must be "ok".');
  }

  const timestamp = ensureStringField(record, "timestamp", "system.ping output");
  return {
    pong: "ok",
    timestamp,
  };
};

export const parseCompanyUpdateProfileInput = (value: unknown): CompanyUpdateProfileInput => {
  const record = ensureObject(value, "company.updateProfile input");
  ensureAllowedKeys(record, ["companyId", "name"], "company.updateProfile input");

  return {
    companyId: ensureStringField(record, "companyId", "company.updateProfile input"),
    name: ensureStringField(record, "name", "company.updateProfile input"),
  };
};

export const parseCompanyUpdateProfileOutput = (value: unknown): CompanyUpdateProfileOutput => {
  const record = ensureObject(value, "company.updateProfile output");
  ensureAllowedKeys(record, ["companyId", "name", "updatedAt"], "company.updateProfile output");

  return {
    companyId: ensureStringField(record, "companyId", "company.updateProfile output"),
    name: ensureStringField(record, "name", "company.updateProfile output"),
    updatedAt: ensureStringField(record, "updatedAt", "company.updateProfile output"),
  };
};

const parseModelKind = (value: unknown, fieldName: string): "indicators" | "levels" => {
  if (value === "indicators" || value === "levels") {
    return value;
  }

  throw new Error(`${fieldName} must be one of: indicators, levels.`);
};

const parseModelVersionStatus = (value: unknown, fieldName: string): ModelVersionStatus => {
  if (value === "draft" || value === "published") {
    return value;
  }

  throw new Error(`${fieldName} must be one of: draft, published.`);
};

const parseCampaignLifecycleStatus = (
  value: unknown,
  fieldName: string,
): CampaignLifecycleStatus => {
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

  throw new Error(`${fieldName} must be one of: ${campaignLifecycleStatuses.join(", ")}.`);
};

const parseModelIndicatorInput = (value: unknown): ModelIndicatorInput => {
  const record = ensureObject(
    value,
    "model.version.create input.groups[].competencies[].indicators[]",
  );
  ensureAllowedKeys(
    record,
    ["text", "order"],
    "model.version.create input.groups[].competencies[].indicators[]",
  );

  const order = record.order;
  if (order !== undefined && typeof order !== "number") {
    throw new Error(
      "model.version.create input.groups[].competencies[].indicators[].order must be a number when provided.",
    );
  }

  return {
    text: ensureStringField(
      record,
      "text",
      "model.version.create input.groups[].competencies[].indicators[]",
    ),
    ...(typeof order === "number" ? { order } : {}),
  };
};

const parseModelLevelInput = (value: unknown): ModelLevelInput => {
  const record = ensureObject(value, "model.version.create input.groups[].competencies[].levels[]");
  ensureAllowedKeys(
    record,
    ["level", "text"],
    "model.version.create input.groups[].competencies[].levels[]",
  );

  return {
    level: ensureNumberField(
      record,
      "level",
      "model.version.create input.groups[].competencies[].levels[]",
    ),
    text: ensureStringField(
      record,
      "text",
      "model.version.create input.groups[].competencies[].levels[]",
    ),
  };
};

const parseModelCompetencyInput = (value: unknown): ModelCompetencyInput => {
  const record = ensureObject(value, "model.version.create input.groups[].competencies[]");
  ensureAllowedKeys(
    record,
    ["name", "indicators", "levels"],
    "model.version.create input.groups[].competencies[]",
  );

  const indicators = record.indicators;
  const levels = record.levels;

  let parsedIndicators: ModelIndicatorInput[] | undefined;
  if (indicators !== undefined) {
    parsedIndicators = ensureArray(
      indicators,
      "model.version.create input.groups[].competencies[].indicators",
    ).map(parseModelIndicatorInput);
  }

  let parsedLevels: ModelLevelInput[] | undefined;
  if (levels !== undefined) {
    parsedLevels = ensureArray(
      levels,
      "model.version.create input.groups[].competencies[].levels",
    ).map(parseModelLevelInput);
  }

  return {
    name: ensureStringField(record, "name", "model.version.create input.groups[].competencies[]"),
    ...(parsedIndicators ? { indicators: parsedIndicators } : {}),
    ...(parsedLevels ? { levels: parsedLevels } : {}),
  };
};

const parseModelGroupInput = (value: unknown): ModelGroupInput => {
  const record = ensureObject(value, "model.version.create input.groups[]");
  ensureAllowedKeys(
    record,
    ["name", "weight", "competencies"],
    "model.version.create input.groups[]",
  );

  return {
    name: ensureStringField(record, "name", "model.version.create input.groups[]"),
    weight: ensureNumberField(record, "weight", "model.version.create input.groups[]"),
    competencies: ensureArray(
      record.competencies,
      "model.version.create input.groups[].competencies",
    ).map(parseModelCompetencyInput),
  };
};

export const parseModelVersionCreateInput = (value: unknown): ModelVersionCreateInput => {
  const record = ensureObject(value, "model.version.create input");
  ensureAllowedKeys(record, ["name", "kind", "groups"], "model.version.create input");

  return {
    name: ensureStringField(record, "name", "model.version.create input"),
    kind: parseModelKind(record.kind, "model.version.create input.kind"),
    groups: ensureArray(record.groups, "model.version.create input.groups").map(
      parseModelGroupInput,
    ),
  };
};

export const parseModelVersionCreateOutput = (value: unknown): ModelVersionCreateOutput => {
  const record = ensureObject(value, "model.version.create output");
  ensureAllowedKeys(
    record,
    [
      "modelVersionId",
      "companyId",
      "name",
      "kind",
      "version",
      "createdAt",
      "groupCount",
      "competencyCount",
      "indicatorCount",
      "levelCount",
    ],
    "model.version.create output",
  );

  return {
    modelVersionId: ensureStringField(record, "modelVersionId", "model.version.create output"),
    companyId: ensureStringField(record, "companyId", "model.version.create output"),
    name: ensureStringField(record, "name", "model.version.create output"),
    kind: parseModelKind(record.kind, "model.version.create output.kind"),
    version: ensureNumberField(record, "version", "model.version.create output"),
    createdAt: ensureStringField(record, "createdAt", "model.version.create output"),
    groupCount: ensureNumberField(record, "groupCount", "model.version.create output"),
    competencyCount: ensureNumberField(record, "competencyCount", "model.version.create output"),
    indicatorCount: ensureNumberField(record, "indicatorCount", "model.version.create output"),
    levelCount: ensureNumberField(record, "levelCount", "model.version.create output"),
  };
};

const parseModelVersionListItem = (value: unknown): ModelVersionListItem => {
  const record = ensureObject(value, "model.version.list output.items[]");
  ensureAllowedKeys(
    record,
    [
      "modelVersionId",
      "name",
      "kind",
      "version",
      "status",
      "createdAt",
      "updatedAt",
      "usedByActiveCampaigns",
    ],
    "model.version.list output.items[]",
  );

  const updatedAt = record.updatedAt;
  if (updatedAt !== undefined && updatedAt !== null && typeof updatedAt !== "string") {
    throw new Error("model.version.list output.items[].updatedAt must be a string when provided.");
  }

  const usedByActiveCampaigns = record.usedByActiveCampaigns;
  if (
    usedByActiveCampaigns !== undefined &&
    usedByActiveCampaigns !== null &&
    typeof usedByActiveCampaigns !== "number"
  ) {
    throw new Error(
      "model.version.list output.items[].usedByActiveCampaigns must be a number when provided.",
    );
  }

  return {
    modelVersionId: ensureStringField(
      record,
      "modelVersionId",
      "model.version.list output.items[]",
    ),
    name: ensureStringField(record, "name", "model.version.list output.items[]"),
    kind: parseModelKind(record.kind, "model.version.list output.items[].kind"),
    version: ensureNumberField(record, "version", "model.version.list output.items[]"),
    status: parseModelVersionStatus(record.status, "model.version.list output.items[].status"),
    createdAt: ensureStringField(record, "createdAt", "model.version.list output.items[]"),
    ...(typeof updatedAt === "string" ? { updatedAt } : {}),
    ...(typeof usedByActiveCampaigns === "number" ? { usedByActiveCampaigns } : {}),
  };
};

export const parseModelVersionListInput = (value: unknown): ModelVersionListInput => {
  const record = ensureObject(value, "model.version.list input");
  ensureAllowedKeys(record, ["kind", "status", "search"], "model.version.list input");

  const search = record.search;
  if (search !== undefined && search !== null && typeof search !== "string") {
    throw new Error("model.version.list input.search must be a string when provided.");
  }

  return {
    ...(record.kind !== undefined
      ? { kind: parseModelKind(record.kind, "model.version.list input.kind") }
      : {}),
    ...(record.status !== undefined
      ? { status: parseModelVersionStatus(record.status, "model.version.list input.status") }
      : {}),
    ...(typeof search === "string" ? { search } : {}),
  };
};

export const parseModelVersionListOutput = (value: unknown): ModelVersionListOutput => {
  const record = ensureObject(value, "model.version.list output");
  ensureAllowedKeys(record, ["items"], "model.version.list output");

  return {
    items: ensureArray(record.items, "model.version.list output.items").map(
      parseModelVersionListItem,
    ),
  };
};

export const parseModelVersionGetInput = (value: unknown): ModelVersionGetInput => {
  const record = ensureObject(value, "model.version.get input");
  ensureAllowedKeys(record, ["modelVersionId"], "model.version.get input");

  return {
    modelVersionId: ensureStringField(record, "modelVersionId", "model.version.get input"),
  };
};

export const parseModelVersionGetOutput = (value: unknown): ModelVersionGetOutput => {
  const record = ensureObject(value, "model.version.get output");
  ensureAllowedKeys(
    record,
    [
      "modelVersionId",
      "companyId",
      "name",
      "kind",
      "version",
      "status",
      "createdAt",
      "updatedAt",
      "groups",
    ],
    "model.version.get output",
  );

  return {
    modelVersionId: ensureStringField(record, "modelVersionId", "model.version.get output"),
    companyId: ensureStringField(record, "companyId", "model.version.get output"),
    name: ensureStringField(record, "name", "model.version.get output"),
    kind: parseModelKind(record.kind, "model.version.get output.kind"),
    version: ensureNumberField(record, "version", "model.version.get output"),
    status: parseModelVersionStatus(record.status, "model.version.get output.status"),
    createdAt: ensureStringField(record, "createdAt", "model.version.get output"),
    updatedAt: ensureStringField(record, "updatedAt", "model.version.get output"),
    groups: ensureArray(record.groups, "model.version.get output.groups").map(parseModelGroupInput),
  };
};

export const parseModelVersionCloneDraftInput = (value: unknown): ModelVersionCloneDraftInput => {
  const record = ensureObject(value, "model.version.cloneDraft input");
  ensureAllowedKeys(record, ["sourceModelVersionId", "name"], "model.version.cloneDraft input");

  const name = record.name;
  if (name !== undefined && name !== null && typeof name !== "string") {
    throw new Error("model.version.cloneDraft input.name must be a string when provided.");
  }

  return {
    sourceModelVersionId: ensureStringField(
      record,
      "sourceModelVersionId",
      "model.version.cloneDraft input",
    ),
    ...(typeof name === "string" ? { name } : {}),
  };
};

export const parseModelVersionCloneDraftOutput = (value: unknown): ModelVersionCloneDraftOutput =>
  parseModelVersionGetOutput(value);

export const parseModelVersionUpsertDraftInput = (value: unknown): ModelVersionUpsertDraftInput => {
  const record = ensureObject(value, "model.version.upsertDraft input");
  ensureAllowedKeys(
    record,
    ["modelVersionId", "name", "kind", "groups"],
    "model.version.upsertDraft input",
  );

  const modelVersionId = record.modelVersionId;
  if (
    modelVersionId !== undefined &&
    modelVersionId !== null &&
    typeof modelVersionId !== "string"
  ) {
    throw new Error(
      "model.version.upsertDraft input.modelVersionId must be a string when provided.",
    );
  }

  return {
    ...(typeof modelVersionId === "string" ? { modelVersionId } : {}),
    name: ensureStringField(record, "name", "model.version.upsertDraft input"),
    kind: parseModelKind(record.kind, "model.version.upsertDraft input.kind"),
    groups: ensureArray(record.groups, "model.version.upsertDraft input.groups").map(
      parseModelGroupInput,
    ),
  };
};

export const parseModelVersionUpsertDraftOutput = (value: unknown): ModelVersionUpsertDraftOutput =>
  parseModelVersionGetOutput(value);

export const parseModelVersionPublishInput = (value: unknown): ModelVersionPublishInput => {
  const record = ensureObject(value, "model.version.publish input");
  ensureAllowedKeys(record, ["modelVersionId"], "model.version.publish input");

  return {
    modelVersionId: ensureStringField(record, "modelVersionId", "model.version.publish input"),
  };
};

export const parseModelVersionPublishOutput = (value: unknown): ModelVersionPublishOutput => {
  const record = ensureObject(value, "model.version.publish output");
  ensureAllowedKeys(
    record,
    ["modelVersionId", "name", "version", "status", "updatedAt"],
    "model.version.publish output",
  );

  const status = parseModelVersionStatus(record.status, "model.version.publish output.status");
  if (status !== "published") {
    throw new Error("model.version.publish output.status must be published.");
  }

  return {
    modelVersionId: ensureStringField(record, "modelVersionId", "model.version.publish output"),
    name: ensureStringField(record, "name", "model.version.publish output"),
    version: ensureNumberField(record, "version", "model.version.publish output"),
    status,
    updatedAt: ensureStringField(record, "updatedAt", "model.version.publish output"),
  };
};

export const parseCampaignCreateInput = (value: unknown): CampaignCreateInput => {
  const record = ensureObject(value, "campaign.create input");
  ensureAllowedKeys(
    record,
    ["name", "modelVersionId", "startAt", "endAt", "timezone"],
    "campaign.create input",
  );

  const timezone = record.timezone;
  if (timezone !== undefined && typeof timezone !== "string") {
    throw new Error("campaign.create input.timezone must be a string when provided.");
  }

  return {
    name: ensureStringField(record, "name", "campaign.create input"),
    modelVersionId: ensureStringField(record, "modelVersionId", "campaign.create input"),
    startAt: ensureStringField(record, "startAt", "campaign.create input"),
    endAt: ensureStringField(record, "endAt", "campaign.create input"),
    ...(typeof timezone === "string" && timezone.trim().length > 0
      ? { timezone: timezone.trim() }
      : {}),
  };
};

export const parseCampaignCreateOutput = (value: unknown): CampaignCreateOutput => {
  const record = ensureObject(value, "campaign.create output");
  ensureAllowedKeys(
    record,
    [
      "campaignId",
      "companyId",
      "modelVersionId",
      "name",
      "status",
      "startAt",
      "endAt",
      "timezone",
      "createdAt",
    ],
    "campaign.create output",
  );

  const status = ensureStringField(record, "status", "campaign.create output");
  if (status !== "draft") {
    throw new Error('campaign.create output.status must be "draft".');
  }

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign.create output"),
    companyId: ensureStringField(record, "companyId", "campaign.create output"),
    modelVersionId: ensureStringField(record, "modelVersionId", "campaign.create output"),
    name: ensureStringField(record, "name", "campaign.create output"),
    status: "draft",
    startAt: ensureStringField(record, "startAt", "campaign.create output"),
    endAt: ensureStringField(record, "endAt", "campaign.create output"),
    timezone: ensureStringField(record, "timezone", "campaign.create output"),
    createdAt: ensureStringField(record, "createdAt", "campaign.create output"),
  };
};

const parseNullableCampaignModelKind = (
  value: unknown,
  path: string,
): "indicators" | "levels" | null => {
  if (value == null) {
    return null;
  }
  return parseModelKind(value, path);
};

const parseNullableCampaignString = (
  record: Record<string, unknown>,
  fieldName: string,
  path: string,
) => {
  const value = record[fieldName];
  if (value == null) {
    return null;
  }
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${path}.${fieldName} must be a non-empty string when provided.`);
  }
  return value.trim();
};

const parseNullableCampaignNumber = (
  record: Record<string, unknown>,
  fieldName: string,
  path: string,
) => {
  const value = record[fieldName];
  if (value == null) {
    return null;
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${path}.${fieldName} must be a number when provided.`);
  }
  return value;
};

const parseCampaignListItem = (value: unknown): CampaignListItem => {
  const record = ensureObject(value, "campaign.list output.items[]");
  ensureAllowedKeys(
    record,
    [
      "campaignId",
      "companyId",
      "name",
      "status",
      "modelVersionId",
      "modelName",
      "modelKind",
      "modelVersion",
      "startAt",
      "endAt",
      "timezone",
      "lockedAt",
      "createdAt",
      "updatedAt",
    ],
    "campaign.list output.items[]",
  );

  const lockedAt = record.lockedAt;
  if (lockedAt !== undefined && lockedAt !== null && typeof lockedAt !== "string") {
    throw new Error("campaign.list output.items[].lockedAt must be a string when provided.");
  }

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign.list output.items[]"),
    companyId: ensureStringField(record, "companyId", "campaign.list output.items[]"),
    name: ensureStringField(record, "name", "campaign.list output.items[]"),
    status: parseCampaignLifecycleStatus(record.status, "campaign.list output.items[].status"),
    modelVersionId: parseNullableCampaignString(
      record,
      "modelVersionId",
      "campaign.list output.items[]",
    ),
    modelName: parseNullableCampaignString(record, "modelName", "campaign.list output.items[]"),
    modelKind: parseNullableCampaignModelKind(
      record.modelKind,
      "campaign.list output.items[].modelKind",
    ),
    modelVersion: parseNullableCampaignNumber(
      record,
      "modelVersion",
      "campaign.list output.items[]",
    ),
    startAt: ensureStringField(record, "startAt", "campaign.list output.items[]"),
    endAt: ensureStringField(record, "endAt", "campaign.list output.items[]"),
    timezone: ensureStringField(record, "timezone", "campaign.list output.items[]"),
    ...(typeof lockedAt === "string" ? { lockedAt } : {}),
    createdAt: ensureStringField(record, "createdAt", "campaign.list output.items[]"),
    updatedAt: ensureStringField(record, "updatedAt", "campaign.list output.items[]"),
  };
};

export const parseCampaignListInput = (value: unknown): CampaignListInput => {
  const record = ensureObject(value, "campaign.list input");
  ensureAllowedKeys(record, ["status"], "campaign.list input");

  const status = record.status;
  if (status === undefined) {
    return {};
  }

  return {
    status: parseCampaignLifecycleStatus(status, "campaign.list input.status"),
  };
};

export const parseCampaignListOutput = (value: unknown): CampaignListOutput => {
  const record = ensureObject(value, "campaign.list output");
  ensureAllowedKeys(record, ["items"], "campaign.list output");

  return {
    items: ensureArray(record.items, "campaign.list output.items").map(parseCampaignListItem),
  };
};

export const parseCampaignGetInput = (value: unknown): CampaignGetInput => {
  const record = ensureObject(value, "campaign.get input");
  ensureAllowedKeys(record, ["campaignId"], "campaign.get input");

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign.get input"),
  };
};

export const parseCampaignGetOutput = (value: unknown): CampaignGetOutput => {
  const record = ensureObject(value, "campaign.get output");
  ensureAllowedKeys(
    record,
    [
      "campaignId",
      "companyId",
      "name",
      "status",
      "modelVersionId",
      "modelName",
      "modelKind",
      "modelVersion",
      "startAt",
      "endAt",
      "timezone",
      "lockedAt",
      "createdAt",
      "updatedAt",
      "managerWeight",
      "peersWeight",
      "subordinatesWeight",
      "selfWeight",
    ],
    "campaign.get output",
  );

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign.get output"),
    companyId: ensureStringField(record, "companyId", "campaign.get output"),
    name: ensureStringField(record, "name", "campaign.get output"),
    status: parseCampaignLifecycleStatus(record.status, "campaign.get output.status"),
    modelVersionId: parseNullableCampaignString(record, "modelVersionId", "campaign.get output"),
    modelName: parseNullableCampaignString(record, "modelName", "campaign.get output"),
    modelKind: parseNullableCampaignModelKind(record.modelKind, "campaign.get output.modelKind"),
    modelVersion: parseNullableCampaignNumber(record, "modelVersion", "campaign.get output"),
    startAt: ensureStringField(record, "startAt", "campaign.get output"),
    endAt: ensureStringField(record, "endAt", "campaign.get output"),
    timezone: ensureStringField(record, "timezone", "campaign.get output"),
    ...(typeof record.lockedAt === "string" ? { lockedAt: record.lockedAt } : {}),
    createdAt: ensureStringField(record, "createdAt", "campaign.get output"),
    updatedAt: ensureStringField(record, "updatedAt", "campaign.get output"),
    managerWeight: ensureNumberField(record, "managerWeight", "campaign.get output"),
    peersWeight: ensureNumberField(record, "peersWeight", "campaign.get output"),
    subordinatesWeight: ensureNumberField(record, "subordinatesWeight", "campaign.get output"),
    selfWeight: ensureNumberField(record, "selfWeight", "campaign.get output"),
  };
};

export const parseCampaignUpdateDraftInput = (value: unknown): CampaignUpdateDraftInput => {
  const record = ensureObject(value, "campaign.updateDraft input");
  ensureAllowedKeys(
    record,
    ["campaignId", "name", "modelVersionId", "startAt", "endAt", "timezone"],
    "campaign.updateDraft input",
  );

  const timezone = record.timezone;
  if (timezone !== undefined && typeof timezone !== "string") {
    throw new Error("campaign.updateDraft input.timezone must be a string when provided.");
  }

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign.updateDraft input"),
    name: ensureStringField(record, "name", "campaign.updateDraft input"),
    modelVersionId: ensureStringField(record, "modelVersionId", "campaign.updateDraft input"),
    startAt: ensureStringField(record, "startAt", "campaign.updateDraft input"),
    endAt: ensureStringField(record, "endAt", "campaign.updateDraft input"),
    ...(typeof timezone === "string" && timezone.trim().length > 0
      ? { timezone: timezone.trim() }
      : {}),
  };
};

export const parseCampaignUpdateDraftOutput = (value: unknown): CampaignUpdateDraftOutput => {
  const record = ensureObject(value, "campaign.updateDraft output");
  ensureAllowedKeys(
    record,
    [
      "campaignId",
      "companyId",
      "modelVersionId",
      "name",
      "status",
      "startAt",
      "endAt",
      "timezone",
      "changed",
      "updatedAt",
    ],
    "campaign.updateDraft output",
  );

  const status = ensureStringField(record, "status", "campaign.updateDraft output");
  if (status !== "draft") {
    throw new Error('campaign.updateDraft output.status must be "draft".');
  }

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign.updateDraft output"),
    companyId: ensureStringField(record, "companyId", "campaign.updateDraft output"),
    modelVersionId: ensureStringField(record, "modelVersionId", "campaign.updateDraft output"),
    name: ensureStringField(record, "name", "campaign.updateDraft output"),
    status: "draft",
    startAt: ensureStringField(record, "startAt", "campaign.updateDraft output"),
    endAt: ensureStringField(record, "endAt", "campaign.updateDraft output"),
    timezone: ensureStringField(record, "timezone", "campaign.updateDraft output"),
    changed: ensureBooleanField(record, "changed", "campaign.updateDraft output"),
    updatedAt: ensureStringField(record, "updatedAt", "campaign.updateDraft output"),
  };
};

export const parseCampaignTransitionInput = (value: unknown): CampaignTransitionInput => {
  const record = ensureObject(value, "campaign transition input");
  ensureAllowedKeys(record, ["campaignId"], "campaign transition input");

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign transition input"),
  };
};

export const parseCampaignTransitionOutput = (value: unknown): CampaignTransitionOutput => {
  const record = ensureObject(value, "campaign transition output");
  ensureAllowedKeys(
    record,
    ["campaignId", "previousStatus", "status", "changed", "updatedAt"],
    "campaign transition output",
  );

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign transition output"),
    previousStatus: parseCampaignLifecycleStatus(
      record.previousStatus,
      "campaign transition output.previousStatus",
    ),
    status: parseCampaignLifecycleStatus(record.status, "campaign transition output.status"),
    changed: ensureBooleanField(record, "changed", "campaign transition output"),
    updatedAt: ensureStringField(record, "updatedAt", "campaign transition output"),
  };
};

export const parseCampaignSetModelVersionInput = (value: unknown): CampaignSetModelVersionInput => {
  const record = ensureObject(value, "campaign.setModelVersion input");
  ensureAllowedKeys(record, ["campaignId", "modelVersionId"], "campaign.setModelVersion input");

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign.setModelVersion input"),
    modelVersionId: ensureStringField(record, "modelVersionId", "campaign.setModelVersion input"),
  };
};

export const parseCampaignSetModelVersionOutput = (
  value: unknown,
): CampaignSetModelVersionOutput => {
  const record = ensureObject(value, "campaign.setModelVersion output");
  ensureAllowedKeys(
    record,
    ["campaignId", "modelVersionId", "changed", "updatedAt"],
    "campaign.setModelVersion output",
  );

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign.setModelVersion output"),
    modelVersionId: ensureStringField(record, "modelVersionId", "campaign.setModelVersion output"),
    changed: ensureBooleanField(record, "changed", "campaign.setModelVersion output"),
    updatedAt: ensureStringField(record, "updatedAt", "campaign.setModelVersion output"),
  };
};

export const parseCampaignParticipantsMutationInput = (
  value: unknown,
): CampaignParticipantsMutationInput => {
  const record = ensureObject(value, "campaign participants mutation input");
  ensureAllowedKeys(record, ["campaignId", "employeeIds"], "campaign participants mutation input");

  const employeeIds = ensureArray(
    record.employeeIds,
    "campaign participants mutation input.employeeIds",
  );
  return {
    campaignId: ensureStringField(record, "campaignId", "campaign participants mutation input"),
    employeeIds: employeeIds.map((employeeId) => {
      if (typeof employeeId !== "string" || employeeId.trim().length === 0) {
        throw new Error(
          "campaign participants mutation input.employeeIds[] must be non-empty strings.",
        );
      }

      return employeeId.trim();
    }),
  };
};

export const parseCampaignParticipantsMutationOutput = (
  value: unknown,
): CampaignParticipantsMutationOutput => {
  const record = ensureObject(value, "campaign participants mutation output");
  ensureAllowedKeys(
    record,
    ["campaignId", "changedEmployeeIds", "totalParticipants"],
    "campaign participants mutation output",
  );

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign participants mutation output"),
    changedEmployeeIds: ensureArray(
      record.changedEmployeeIds,
      "campaign participants mutation output.changedEmployeeIds",
    ).map((employeeId) => {
      if (typeof employeeId !== "string" || employeeId.trim().length === 0) {
        throw new Error(
          "campaign participants mutation output.changedEmployeeIds[] must be non-empty strings.",
        );
      }

      return employeeId.trim();
    }),
    totalParticipants: ensureNumberField(
      record,
      "totalParticipants",
      "campaign participants mutation output",
    ),
  };
};

export const parseCampaignWeightsSetInput = (value: unknown): CampaignWeightsSetInput => {
  const record = ensureObject(value, "campaign.weights.set input");
  ensureAllowedKeys(
    record,
    ["campaignId", "manager", "peers", "subordinates"],
    "campaign.weights.set input",
  );

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign.weights.set input"),
    manager: ensureNumberField(record, "manager", "campaign.weights.set input"),
    peers: ensureNumberField(record, "peers", "campaign.weights.set input"),
    subordinates: ensureNumberField(record, "subordinates", "campaign.weights.set input"),
  };
};

export const parseCampaignWeightsSetOutput = (value: unknown): CampaignWeightsSetOutput => {
  const record = ensureObject(value, "campaign.weights.set output");
  ensureAllowedKeys(
    record,
    ["campaignId", "manager", "peers", "subordinates", "self", "changed", "updatedAt"],
    "campaign.weights.set output",
  );

  const selfValue = ensureNumberField(record, "self", "campaign.weights.set output");
  if (selfValue !== 0) {
    throw new Error("campaign.weights.set output.self must be 0.");
  }

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign.weights.set output"),
    manager: ensureNumberField(record, "manager", "campaign.weights.set output"),
    peers: ensureNumberField(record, "peers", "campaign.weights.set output"),
    subordinates: ensureNumberField(record, "subordinates", "campaign.weights.set output"),
    self: 0,
    changed: ensureBooleanField(record, "changed", "campaign.weights.set output"),
    updatedAt: ensureStringField(record, "updatedAt", "campaign.weights.set output"),
  };
};

export const parseEmployeeUpsertInput = (value: unknown): EmployeeUpsertInput => {
  const record = ensureObject(value, "employee.upsert input");
  ensureAllowedKeys(
    record,
    [
      "employeeId",
      "email",
      "firstName",
      "lastName",
      "phone",
      "telegramUserId",
      "telegramChatId",
      "isActive",
    ],
    "employee.upsert input",
  );

  const input: EmployeeUpsertInput = {
    employeeId: ensureStringField(record, "employeeId", "employee.upsert input"),
  };

  const email = record.email;
  if (email !== undefined) {
    if (typeof email !== "string" || email.trim().length === 0) {
      throw new Error("employee.upsert input.email must be a non-empty string when provided.");
    }
    input.email = email.trim();
  }

  const firstName = record.firstName;
  if (firstName !== undefined) {
    if (typeof firstName !== "string" || firstName.trim().length === 0) {
      throw new Error("employee.upsert input.firstName must be a non-empty string when provided.");
    }
    input.firstName = firstName.trim();
  }

  const lastName = record.lastName;
  if (lastName !== undefined) {
    if (typeof lastName !== "string" || lastName.trim().length === 0) {
      throw new Error("employee.upsert input.lastName must be a non-empty string when provided.");
    }
    input.lastName = lastName.trim();
  }

  const phone = record.phone;
  if (phone !== undefined) {
    if (typeof phone !== "string" || phone.trim().length === 0) {
      throw new Error("employee.upsert input.phone must be a non-empty string when provided.");
    }
    input.phone = phone.trim();
  }

  const telegramUserId = record.telegramUserId;
  if (telegramUserId !== undefined) {
    if (typeof telegramUserId !== "string" || telegramUserId.trim().length === 0) {
      throw new Error(
        "employee.upsert input.telegramUserId must be a non-empty string when provided.",
      );
    }
    input.telegramUserId = telegramUserId.trim();
  }

  const telegramChatId = record.telegramChatId;
  if (telegramChatId !== undefined) {
    if (typeof telegramChatId !== "string" || telegramChatId.trim().length === 0) {
      throw new Error(
        "employee.upsert input.telegramChatId must be a non-empty string when provided.",
      );
    }
    input.telegramChatId = telegramChatId.trim();
  }

  const isActive = record.isActive;
  if (isActive !== undefined) {
    if (typeof isActive !== "boolean") {
      throw new Error("employee.upsert input.isActive must be boolean when provided.");
    }
    input.isActive = isActive;
  }

  return input;
};

const employeeDirectoryStatuses = ["active", "inactive", "deleted", "all"] as const;
const isEmployeeDirectoryStatus = (value: string): value is EmployeeDirectoryStatus =>
  (employeeDirectoryStatuses as readonly string[]).includes(value);

const parseEmployeeDirectoryListItem = (value: unknown): EmployeeDirectoryListItem => {
  const record = ensureObject(value, "employee.directoryList output.items[]");
  ensureAllowedKeys(
    record,
    [
      "employeeId",
      "email",
      "firstName",
      "lastName",
      "phone",
      "telegramUserId",
      "telegramChatId",
      "isActive",
      "deletedAt",
      "departmentId",
      "departmentName",
      "managerEmployeeId",
      "managerName",
      "positionTitle",
      "positionLevel",
      "userId",
      "membershipRole",
    ],
    "employee.directoryList output.items[]",
  );

  const membershipRole = record.membershipRole;
  if (
    membershipRole !== undefined &&
    membershipRole !== null &&
    (typeof membershipRole !== "string" || !isMembershipRole(membershipRole))
  ) {
    throw new Error(
      `employee.directoryList output.items[].membershipRole must be one of: ${membershipRoles.join(", ")}`,
    );
  }

  const optionalStringFields = [
    "firstName",
    "lastName",
    "phone",
    "telegramUserId",
    "telegramChatId",
    "deletedAt",
    "departmentId",
    "departmentName",
    "managerEmployeeId",
    "managerName",
    "positionTitle",
    "userId",
  ] as const;

  for (const field of optionalStringFields) {
    const fieldValue = record[field];
    if (fieldValue !== undefined && fieldValue !== null && typeof fieldValue !== "string") {
      throw new Error(
        `employee.directoryList output.items[].${field} must be a string when provided.`,
      );
    }
  }

  const positionLevel = record.positionLevel;
  if (positionLevel !== undefined && positionLevel !== null && typeof positionLevel !== "number") {
    throw new Error(
      "employee.directoryList output.items[].positionLevel must be a number when provided.",
    );
  }

  return {
    employeeId: ensureStringField(record, "employeeId", "employee.directoryList output.items[]"),
    email: ensureStringField(record, "email", "employee.directoryList output.items[]"),
    ...(typeof record.firstName === "string" ? { firstName: record.firstName } : {}),
    ...(typeof record.lastName === "string" ? { lastName: record.lastName } : {}),
    ...(typeof record.phone === "string" ? { phone: record.phone } : {}),
    ...(typeof record.telegramUserId === "string" ? { telegramUserId: record.telegramUserId } : {}),
    ...(typeof record.telegramChatId === "string" ? { telegramChatId: record.telegramChatId } : {}),
    isActive: ensureBooleanField(record, "isActive", "employee.directoryList output.items[]"),
    ...(typeof record.deletedAt === "string" ? { deletedAt: record.deletedAt } : {}),
    ...(typeof record.departmentId === "string" ? { departmentId: record.departmentId } : {}),
    ...(typeof record.departmentName === "string" ? { departmentName: record.departmentName } : {}),
    ...(typeof record.managerEmployeeId === "string"
      ? { managerEmployeeId: record.managerEmployeeId }
      : {}),
    ...(typeof record.managerName === "string" ? { managerName: record.managerName } : {}),
    ...(typeof record.positionTitle === "string" ? { positionTitle: record.positionTitle } : {}),
    ...(typeof positionLevel === "number" ? { positionLevel } : {}),
    ...(typeof record.userId === "string" ? { userId: record.userId } : {}),
    ...(typeof membershipRole === "string" ? { membershipRole } : {}),
  };
};

export const parseEmployeeUpsertOutput = (value: unknown): EmployeeUpsertOutput => {
  const record = ensureObject(value, "employee.upsert output");
  ensureAllowedKeys(
    record,
    ["employeeId", "companyId", "isActive", "deletedAt", "updatedAt", "created"],
    "employee.upsert output",
  );

  const deletedAt = record.deletedAt;
  if (deletedAt !== undefined && deletedAt !== null && typeof deletedAt !== "string") {
    throw new Error("employee.upsert output.deletedAt must be a string when provided.");
  }

  return {
    employeeId: ensureStringField(record, "employeeId", "employee.upsert output"),
    companyId: ensureStringField(record, "companyId", "employee.upsert output"),
    isActive: ensureBooleanField(record, "isActive", "employee.upsert output"),
    ...(typeof deletedAt === "string" ? { deletedAt } : {}),
    updatedAt: ensureStringField(record, "updatedAt", "employee.upsert output"),
    created: ensureBooleanField(record, "created", "employee.upsert output"),
  };
};

const parseEmployeeListActiveItem = (value: unknown): EmployeeListActiveItem => {
  const record = ensureObject(value, "employee.listActive output.items[]");
  ensureAllowedKeys(
    record,
    ["employeeId", "email", "firstName", "lastName", "isActive"],
    "employee.listActive output.items[]",
  );

  const firstName = record.firstName;
  if (firstName !== undefined && firstName !== null && typeof firstName !== "string") {
    throw new Error("employee.listActive output.items[].firstName must be a string when provided.");
  }

  const lastName = record.lastName;
  if (lastName !== undefined && lastName !== null && typeof lastName !== "string") {
    throw new Error("employee.listActive output.items[].lastName must be a string when provided.");
  }

  return {
    employeeId: ensureStringField(record, "employeeId", "employee.listActive output.items[]"),
    email: ensureStringField(record, "email", "employee.listActive output.items[]"),
    ...(typeof firstName === "string" ? { firstName } : {}),
    ...(typeof lastName === "string" ? { lastName } : {}),
    isActive: ensureBooleanField(record, "isActive", "employee.listActive output.items[]"),
  };
};

export const parseEmployeeListActiveInput = (value: unknown): EmployeeListActiveInput => {
  const record = ensureObject(value, "employee.listActive input");
  ensureAllowedKeys(record, ["companyId"], "employee.listActive input");

  const companyId = record.companyId;
  if (companyId !== undefined && typeof companyId !== "string") {
    throw new Error("employee.listActive input.companyId must be a string when provided.");
  }

  return {
    ...(typeof companyId === "string" ? { companyId: companyId.trim() } : {}),
  };
};

export const parseEmployeeListActiveOutput = (value: unknown): EmployeeListActiveOutput => {
  const record = ensureObject(value, "employee.listActive output");
  ensureAllowedKeys(record, ["items"], "employee.listActive output");

  return {
    items: ensureArray(record.items, "employee.listActive output.items").map(
      parseEmployeeListActiveItem,
    ),
  };
};

export const parseEmployeeDirectoryListInput = (value: unknown): EmployeeDirectoryListInput => {
  const record = ensureObject(value, "employee.directoryList input");
  ensureAllowedKeys(
    record,
    ["companyId", "search", "departmentId", "status"],
    "employee.directoryList input",
  );

  const companyId = record.companyId;
  if (companyId !== undefined && typeof companyId !== "string") {
    throw new Error("employee.directoryList input.companyId must be a string when provided.");
  }

  const search = record.search;
  if (search !== undefined && typeof search !== "string") {
    throw new Error("employee.directoryList input.search must be a string when provided.");
  }

  const departmentId = record.departmentId;
  if (departmentId !== undefined && typeof departmentId !== "string") {
    throw new Error("employee.directoryList input.departmentId must be a string when provided.");
  }

  const status = record.status;
  if (status !== undefined && (typeof status !== "string" || !isEmployeeDirectoryStatus(status))) {
    throw new Error(
      `employee.directoryList input.status must be one of: ${employeeDirectoryStatuses.join(", ")}`,
    );
  }

  return {
    ...(typeof companyId === "string" ? { companyId: companyId.trim() } : {}),
    ...(typeof search === "string" && search.trim().length > 0 ? { search: search.trim() } : {}),
    ...(typeof departmentId === "string" && departmentId.trim().length > 0
      ? { departmentId: departmentId.trim() }
      : {}),
    ...(typeof status === "string" ? { status } : {}),
  };
};

export const parseEmployeeDirectoryListOutput = (value: unknown): EmployeeDirectoryListOutput => {
  const record = ensureObject(value, "employee.directoryList output");
  ensureAllowedKeys(record, ["items"], "employee.directoryList output");

  return {
    items: ensureArray(record.items, "employee.directoryList output.items").map(
      parseEmployeeDirectoryListItem,
    ),
  };
};

const parseEmployeeProfileDepartmentHistoryItem = (
  value: unknown,
): EmployeeProfileDepartmentHistoryItem => {
  const record = ensureObject(value, "employee.profileGet output.departmentHistory[]");
  ensureAllowedKeys(
    record,
    ["departmentId", "departmentName", "startAt", "endAt"],
    "employee.profileGet output.departmentHistory[]",
  );

  return {
    departmentId: ensureStringField(
      record,
      "departmentId",
      "employee.profileGet output.departmentHistory[]",
    ),
    ...(typeof record.departmentName === "string" ? { departmentName: record.departmentName } : {}),
    startAt: ensureStringField(record, "startAt", "employee.profileGet output.departmentHistory[]"),
    ...(typeof record.endAt === "string" ? { endAt: record.endAt } : {}),
  };
};

const parseEmployeeProfileManagerHistoryItem = (
  value: unknown,
): EmployeeProfileManagerHistoryItem => {
  const record = ensureObject(value, "employee.profileGet output.managerHistory[]");
  ensureAllowedKeys(
    record,
    ["managerEmployeeId", "managerName", "startAt", "endAt"],
    "employee.profileGet output.managerHistory[]",
  );

  return {
    managerEmployeeId: ensureStringField(
      record,
      "managerEmployeeId",
      "employee.profileGet output.managerHistory[]",
    ),
    ...(typeof record.managerName === "string" ? { managerName: record.managerName } : {}),
    startAt: ensureStringField(record, "startAt", "employee.profileGet output.managerHistory[]"),
    ...(typeof record.endAt === "string" ? { endAt: record.endAt } : {}),
  };
};

const parseEmployeeProfilePositionHistoryItem = (
  value: unknown,
): EmployeeProfilePositionHistoryItem => {
  const record = ensureObject(value, "employee.profileGet output.positionHistory[]");
  ensureAllowedKeys(
    record,
    ["title", "level", "startAt", "endAt"],
    "employee.profileGet output.positionHistory[]",
  );

  const level = record.level;
  if (level !== undefined && level !== null && typeof level !== "number") {
    throw new Error(
      "employee.profileGet output.positionHistory[].level must be a number when provided.",
    );
  }

  return {
    title: ensureStringField(record, "title", "employee.profileGet output.positionHistory[]"),
    ...(typeof level === "number" ? { level } : {}),
    startAt: ensureStringField(record, "startAt", "employee.profileGet output.positionHistory[]"),
    ...(typeof record.endAt === "string" ? { endAt: record.endAt } : {}),
  };
};

export const parseEmployeeProfileGetInput = (value: unknown): EmployeeProfileGetInput => {
  const record = ensureObject(value, "employee.profileGet input");
  ensureAllowedKeys(record, ["employeeId"], "employee.profileGet input");

  return {
    employeeId: ensureStringField(record, "employeeId", "employee.profileGet input"),
  };
};

export const parseEmployeeProfileGetOutput = (value: unknown): EmployeeProfileGetOutput => {
  const record = ensureObject(value, "employee.profileGet output");
  ensureAllowedKeys(
    record,
    [
      "employeeId",
      "companyId",
      "email",
      "firstName",
      "lastName",
      "phone",
      "telegramUserId",
      "telegramChatId",
      "isActive",
      "deletedAt",
      "currentDepartmentId",
      "currentDepartmentName",
      "currentManagerEmployeeId",
      "currentManagerName",
      "currentPositionTitle",
      "currentPositionLevel",
      "userId",
      "membershipRole",
      "departmentHistory",
      "managerHistory",
      "positionHistory",
    ],
    "employee.profileGet output",
  );

  const membershipRole = record.membershipRole;
  if (
    membershipRole !== undefined &&
    membershipRole !== null &&
    (typeof membershipRole !== "string" || !isMembershipRole(membershipRole))
  ) {
    throw new Error(
      `employee.profileGet output.membershipRole must be one of: ${membershipRoles.join(", ")}`,
    );
  }

  const currentPositionLevel = record.currentPositionLevel;
  if (
    currentPositionLevel !== undefined &&
    currentPositionLevel !== null &&
    typeof currentPositionLevel !== "number"
  ) {
    throw new Error(
      "employee.profileGet output.currentPositionLevel must be a number when provided.",
    );
  }

  return {
    employeeId: ensureStringField(record, "employeeId", "employee.profileGet output"),
    companyId: ensureStringField(record, "companyId", "employee.profileGet output"),
    email: ensureStringField(record, "email", "employee.profileGet output"),
    ...(typeof record.firstName === "string" ? { firstName: record.firstName } : {}),
    ...(typeof record.lastName === "string" ? { lastName: record.lastName } : {}),
    ...(typeof record.phone === "string" ? { phone: record.phone } : {}),
    ...(typeof record.telegramUserId === "string" ? { telegramUserId: record.telegramUserId } : {}),
    ...(typeof record.telegramChatId === "string" ? { telegramChatId: record.telegramChatId } : {}),
    isActive: ensureBooleanField(record, "isActive", "employee.profileGet output"),
    ...(typeof record.deletedAt === "string" ? { deletedAt: record.deletedAt } : {}),
    ...(typeof record.currentDepartmentId === "string"
      ? { currentDepartmentId: record.currentDepartmentId }
      : {}),
    ...(typeof record.currentDepartmentName === "string"
      ? { currentDepartmentName: record.currentDepartmentName }
      : {}),
    ...(typeof record.currentManagerEmployeeId === "string"
      ? { currentManagerEmployeeId: record.currentManagerEmployeeId }
      : {}),
    ...(typeof record.currentManagerName === "string"
      ? { currentManagerName: record.currentManagerName }
      : {}),
    ...(typeof record.currentPositionTitle === "string"
      ? { currentPositionTitle: record.currentPositionTitle }
      : {}),
    ...(typeof currentPositionLevel === "number" ? { currentPositionLevel } : {}),
    ...(typeof record.userId === "string" ? { userId: record.userId } : {}),
    ...(typeof membershipRole === "string" ? { membershipRole } : {}),
    departmentHistory: ensureArray(
      record.departmentHistory,
      "employee.profileGet output.departmentHistory",
    ).map(parseEmployeeProfileDepartmentHistoryItem),
    managerHistory: ensureArray(
      record.managerHistory,
      "employee.profileGet output.managerHistory",
    ).map(parseEmployeeProfileManagerHistoryItem),
    positionHistory: ensureArray(
      record.positionHistory,
      "employee.profileGet output.positionHistory",
    ).map(parseEmployeeProfilePositionHistoryItem),
  };
};

export const parseIdentityProvisionAccessInput = (value: unknown): IdentityProvisionAccessInput => {
  const record = ensureObject(value, "identity.provisionAccess input");
  ensureAllowedKeys(
    record,
    ["employeeId", "userId", "email", "role"],
    "identity.provisionAccess input",
  );

  const role = ensureStringField(record, "role", "identity.provisionAccess input");
  if (!isMembershipRole(role)) {
    throw new Error(
      `identity.provisionAccess input.role must be one of: ${membershipRoles.join(", ")}`,
    );
  }

  return {
    employeeId: ensureStringField(record, "employeeId", "identity.provisionAccess input"),
    userId: ensureStringField(record, "userId", "identity.provisionAccess input"),
    email: ensureStringField(record, "email", "identity.provisionAccess input").trim(),
    role,
  };
};

export const parseIdentityProvisionAccessOutput = (
  value: unknown,
): IdentityProvisionAccessOutput => {
  const record = ensureObject(value, "identity.provisionAccess output");
  ensureAllowedKeys(
    record,
    ["employeeId", "userId", "email", "role", "membershipId", "employeeUserLinkId"],
    "identity.provisionAccess output",
  );

  const role = ensureStringField(record, "role", "identity.provisionAccess output");
  if (!isMembershipRole(role)) {
    throw new Error(
      `identity.provisionAccess output.role must be one of: ${membershipRoles.join(", ")}`,
    );
  }

  return {
    employeeId: ensureStringField(record, "employeeId", "identity.provisionAccess output"),
    userId: ensureStringField(record, "userId", "identity.provisionAccess output"),
    email: ensureStringField(record, "email", "identity.provisionAccess output"),
    role,
    membershipId: ensureStringField(record, "membershipId", "identity.provisionAccess output"),
    employeeUserLinkId: ensureStringField(
      record,
      "employeeUserLinkId",
      "identity.provisionAccess output",
    ),
  };
};

const parseDepartmentListItem = (value: unknown): DepartmentListItem => {
  const record = ensureObject(value, "department.list output.items[]");
  ensureAllowedKeys(
    record,
    ["departmentId", "name", "parentDepartmentId", "isActive", "deletedAt", "memberCount"],
    "department.list output.items[]",
  );

  return {
    departmentId: ensureStringField(record, "departmentId", "department.list output.items[]"),
    name: ensureStringField(record, "name", "department.list output.items[]"),
    ...(typeof record.parentDepartmentId === "string"
      ? { parentDepartmentId: record.parentDepartmentId }
      : {}),
    isActive: ensureBooleanField(record, "isActive", "department.list output.items[]"),
    ...(typeof record.deletedAt === "string" ? { deletedAt: record.deletedAt } : {}),
    memberCount: ensureNumberField(record, "memberCount", "department.list output.items[]"),
  };
};

export const parseDepartmentListInput = (value: unknown): DepartmentListInput => {
  const record = ensureObject(value, "department.list input");
  ensureAllowedKeys(record, ["companyId", "includeInactive"], "department.list input");

  const companyId = record.companyId;
  if (companyId !== undefined && typeof companyId !== "string") {
    throw new Error("department.list input.companyId must be a string when provided.");
  }

  const includeInactive = record.includeInactive;
  if (includeInactive !== undefined && typeof includeInactive !== "boolean") {
    throw new Error("department.list input.includeInactive must be boolean when provided.");
  }

  return {
    ...(typeof companyId === "string" ? { companyId: companyId.trim() } : {}),
    ...(typeof includeInactive === "boolean" ? { includeInactive } : {}),
  };
};

export const parseDepartmentListOutput = (value: unknown): DepartmentListOutput => {
  const record = ensureObject(value, "department.list output");
  ensureAllowedKeys(record, ["items"], "department.list output");

  return {
    items: ensureArray(record.items, "department.list output.items").map(parseDepartmentListItem),
  };
};

export const parseDepartmentUpsertInput = (value: unknown): DepartmentUpsertInput => {
  const record = ensureObject(value, "department.upsert input");
  ensureAllowedKeys(
    record,
    ["departmentId", "name", "parentDepartmentId", "isActive"],
    "department.upsert input",
  );

  const parentDepartmentId = record.parentDepartmentId;
  if (
    parentDepartmentId !== undefined &&
    parentDepartmentId !== null &&
    typeof parentDepartmentId !== "string"
  ) {
    throw new Error("department.upsert input.parentDepartmentId must be a string when provided.");
  }

  const isActive = record.isActive;
  if (isActive !== undefined && typeof isActive !== "boolean") {
    throw new Error("department.upsert input.isActive must be boolean when provided.");
  }

  return {
    departmentId: ensureStringField(record, "departmentId", "department.upsert input"),
    name: ensureStringField(record, "name", "department.upsert input"),
    ...(typeof parentDepartmentId === "string" && parentDepartmentId.trim().length > 0
      ? { parentDepartmentId: parentDepartmentId.trim() }
      : {}),
    ...(typeof isActive === "boolean" ? { isActive } : {}),
  };
};

export const parseDepartmentUpsertOutput = (value: unknown): DepartmentUpsertOutput => {
  const record = ensureObject(value, "department.upsert output");
  ensureAllowedKeys(
    record,
    [
      "departmentId",
      "companyId",
      "name",
      "parentDepartmentId",
      "isActive",
      "deletedAt",
      "updatedAt",
      "created",
    ],
    "department.upsert output",
  );

  return {
    departmentId: ensureStringField(record, "departmentId", "department.upsert output"),
    companyId: ensureStringField(record, "companyId", "department.upsert output"),
    name: ensureStringField(record, "name", "department.upsert output"),
    ...(typeof record.parentDepartmentId === "string"
      ? { parentDepartmentId: record.parentDepartmentId }
      : {}),
    isActive: ensureBooleanField(record, "isActive", "department.upsert output"),
    ...(typeof record.deletedAt === "string" ? { deletedAt: record.deletedAt } : {}),
    updatedAt: ensureStringField(record, "updatedAt", "department.upsert output"),
    created: ensureBooleanField(record, "created", "department.upsert output"),
  };
};

const parseMembershipListItem = (value: unknown): MembershipListItem => {
  const record = ensureObject(value, "membership.list output.items[]");
  ensureAllowedKeys(record, ["companyId", "companyName", "role"], "membership.list output.items[]");

  const role = ensureStringField(record, "role", "membership.list output.items[]");
  if (!isMembershipRole(role)) {
    throw new Error(
      `membership.list output.items[].role must be one of: ${membershipRoles.join(", ")}`,
    );
  }

  return {
    companyId: ensureStringField(record, "companyId", "membership.list output.items[]"),
    companyName: ensureStringField(record, "companyName", "membership.list output.items[]"),
    role,
  };
};

export const parseMembershipListInput = (value: unknown): MembershipListInput => {
  const record = ensureObject(value, "membership.list input");
  ensureAllowedKeys(record, [], "membership.list input");

  return {};
};

export const parseMembershipListOutput = (value: unknown): MembershipListOutput => {
  const record = ensureObject(value, "membership.list output");
  ensureAllowedKeys(record, ["items"], "membership.list output");

  return {
    items: ensureArray(record.items, "membership.list output.items").map(parseMembershipListItem),
  };
};

export const parseOrgDepartmentMoveInput = (value: unknown): OrgDepartmentMoveInput => {
  const record = ensureObject(value, "org.department.move input");
  ensureAllowedKeys(record, ["employeeId", "toDepartmentId"], "org.department.move input");

  return {
    employeeId: ensureStringField(record, "employeeId", "org.department.move input"),
    toDepartmentId: ensureStringField(record, "toDepartmentId", "org.department.move input"),
  };
};

export const parseOrgDepartmentMoveOutput = (value: unknown): OrgDepartmentMoveOutput => {
  const record = ensureObject(value, "org.department.move output");
  ensureAllowedKeys(
    record,
    ["employeeId", "previousDepartmentId", "departmentId", "changed", "effectiveAt"],
    "org.department.move output",
  );

  const previousDepartmentId = record.previousDepartmentId;
  if (
    previousDepartmentId !== undefined &&
    previousDepartmentId !== null &&
    typeof previousDepartmentId !== "string"
  ) {
    throw new Error(
      "org.department.move output.previousDepartmentId must be a string when provided.",
    );
  }

  return {
    employeeId: ensureStringField(record, "employeeId", "org.department.move output"),
    ...(typeof previousDepartmentId === "string" ? { previousDepartmentId } : {}),
    departmentId: ensureStringField(record, "departmentId", "org.department.move output"),
    changed: ensureBooleanField(record, "changed", "org.department.move output"),
    effectiveAt: ensureStringField(record, "effectiveAt", "org.department.move output"),
  };
};

export const parseOrgManagerSetInput = (value: unknown): OrgManagerSetInput => {
  const record = ensureObject(value, "org.manager.set input");
  ensureAllowedKeys(record, ["employeeId", "managerEmployeeId"], "org.manager.set input");

  return {
    employeeId: ensureStringField(record, "employeeId", "org.manager.set input"),
    managerEmployeeId: ensureStringField(record, "managerEmployeeId", "org.manager.set input"),
  };
};

export const parseOrgManagerSetOutput = (value: unknown): OrgManagerSetOutput => {
  const record = ensureObject(value, "org.manager.set output");
  ensureAllowedKeys(
    record,
    ["employeeId", "previousManagerEmployeeId", "managerEmployeeId", "changed", "effectiveAt"],
    "org.manager.set output",
  );

  const previousManagerEmployeeId = record.previousManagerEmployeeId;
  if (
    previousManagerEmployeeId !== undefined &&
    previousManagerEmployeeId !== null &&
    typeof previousManagerEmployeeId !== "string"
  ) {
    throw new Error(
      "org.manager.set output.previousManagerEmployeeId must be a string when provided.",
    );
  }

  return {
    employeeId: ensureStringField(record, "employeeId", "org.manager.set output"),
    ...(typeof previousManagerEmployeeId === "string" ? { previousManagerEmployeeId } : {}),
    managerEmployeeId: ensureStringField(record, "managerEmployeeId", "org.manager.set output"),
    changed: ensureBooleanField(record, "changed", "org.manager.set output"),
    effectiveAt: ensureStringField(record, "effectiveAt", "org.manager.set output"),
  };
};

const parseCampaignSnapshotListItem = (value: unknown): CampaignSnapshotListItem => {
  const record = ensureObject(value, "campaign.snapshot.list output.items[]");
  ensureAllowedKeys(
    record,
    [
      "snapshotId",
      "companyId",
      "campaignId",
      "employeeId",
      "email",
      "firstName",
      "lastName",
      "departmentId",
      "managerEmployeeId",
      "positionTitle",
      "positionLevel",
      "snapshotAt",
    ],
    "campaign.snapshot.list output.items[]",
  );

  const firstName = record.firstName;
  if (firstName !== undefined && firstName !== null && typeof firstName !== "string") {
    throw new Error("campaign.snapshot.list output.items[].firstName must be a string.");
  }

  const lastName = record.lastName;
  if (lastName !== undefined && lastName !== null && typeof lastName !== "string") {
    throw new Error("campaign.snapshot.list output.items[].lastName must be a string.");
  }

  const departmentId = record.departmentId;
  if (departmentId !== undefined && departmentId !== null && typeof departmentId !== "string") {
    throw new Error("campaign.snapshot.list output.items[].departmentId must be a string.");
  }

  const managerEmployeeId = record.managerEmployeeId;
  if (
    managerEmployeeId !== undefined &&
    managerEmployeeId !== null &&
    typeof managerEmployeeId !== "string"
  ) {
    throw new Error("campaign.snapshot.list output.items[].managerEmployeeId must be a string.");
  }

  const positionTitle = record.positionTitle;
  if (positionTitle !== undefined && positionTitle !== null && typeof positionTitle !== "string") {
    throw new Error("campaign.snapshot.list output.items[].positionTitle must be a string.");
  }

  const positionLevel = record.positionLevel;
  if (positionLevel !== undefined && positionLevel !== null && typeof positionLevel !== "number") {
    throw new Error("campaign.snapshot.list output.items[].positionLevel must be a number.");
  }

  return {
    snapshotId: ensureStringField(record, "snapshotId", "campaign.snapshot.list output.items[]"),
    companyId: ensureStringField(record, "companyId", "campaign.snapshot.list output.items[]"),
    campaignId: ensureStringField(record, "campaignId", "campaign.snapshot.list output.items[]"),
    employeeId: ensureStringField(record, "employeeId", "campaign.snapshot.list output.items[]"),
    email: ensureStringField(record, "email", "campaign.snapshot.list output.items[]"),
    ...(typeof firstName === "string" ? { firstName } : {}),
    ...(typeof lastName === "string" ? { lastName } : {}),
    ...(typeof departmentId === "string" ? { departmentId } : {}),
    ...(typeof managerEmployeeId === "string" ? { managerEmployeeId } : {}),
    ...(typeof positionTitle === "string" ? { positionTitle } : {}),
    ...(typeof positionLevel === "number" ? { positionLevel } : {}),
    snapshotAt: ensureStringField(record, "snapshotAt", "campaign.snapshot.list output.items[]"),
  };
};

export const parseCampaignSnapshotListInput = (value: unknown): CampaignSnapshotListInput => {
  const record = ensureObject(value, "campaign.snapshot.list input");
  ensureAllowedKeys(record, ["campaignId"], "campaign.snapshot.list input");

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign.snapshot.list input"),
  };
};

export const parseCampaignSnapshotListOutput = (value: unknown): CampaignSnapshotListOutput => {
  const record = ensureObject(value, "campaign.snapshot.list output");
  ensureAllowedKeys(record, ["items"], "campaign.snapshot.list output");

  return {
    items: ensureArray(record.items, "campaign.snapshot.list output.items").map(
      parseCampaignSnapshotListItem,
    ),
  };
};

export const parseCampaignProgressGetInput = (value: unknown): CampaignProgressGetInput => {
  const record = ensureObject(value, "campaign.progress.get input");
  ensureAllowedKeys(record, ["campaignId"], "campaign.progress.get input");

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign.progress.get input"),
  };
};

const parseCampaignProgressStatusCounts = (value: unknown): CampaignProgressStatusCounts => {
  const record = ensureObject(value, "campaign.progress.get output.statusCounts");
  ensureAllowedKeys(
    record,
    ["notStarted", "inProgress", "submitted"],
    "campaign.progress.get output.statusCounts",
  );

  return {
    notStarted: ensureNumberField(
      record,
      "notStarted",
      "campaign.progress.get output.statusCounts",
    ),
    inProgress: ensureNumberField(
      record,
      "inProgress",
      "campaign.progress.get output.statusCounts",
    ),
    submitted: ensureNumberField(record, "submitted", "campaign.progress.get output.statusCounts"),
  };
};

const parseCampaignProgressPendingItem = (value: unknown): CampaignProgressPendingItem => {
  const record = ensureObject(value, "campaign.progress.get output.pendingQuestionnaires[]");
  ensureAllowedKeys(
    record,
    [
      "questionnaireId",
      "campaignId",
      "companyId",
      "subjectEmployeeId",
      "raterEmployeeId",
      "status",
      "firstDraftAt",
      "submittedAt",
    ],
    "campaign.progress.get output.pendingQuestionnaires[]",
  );

  const status = ensureStringField(
    record,
    "status",
    "campaign.progress.get output.pendingQuestionnaires[]",
  );
  if (!isPendingQuestionnaireStatus(status)) {
    throw new Error(
      'campaign.progress.get output.pendingQuestionnaires[].status must be "not_started" or "in_progress".',
    );
  }

  const firstDraftAt = record.firstDraftAt;
  if (firstDraftAt !== undefined && firstDraftAt !== null && typeof firstDraftAt !== "string") {
    throw new Error(
      "campaign.progress.get output.pendingQuestionnaires[].firstDraftAt must be a string when provided.",
    );
  }

  const submittedAt = record.submittedAt;
  if (submittedAt !== undefined && submittedAt !== null && typeof submittedAt !== "string") {
    throw new Error(
      "campaign.progress.get output.pendingQuestionnaires[].submittedAt must be a string when provided.",
    );
  }

  return {
    questionnaireId: ensureStringField(
      record,
      "questionnaireId",
      "campaign.progress.get output.pendingQuestionnaires[]",
    ),
    campaignId: ensureStringField(
      record,
      "campaignId",
      "campaign.progress.get output.pendingQuestionnaires[]",
    ),
    companyId: ensureStringField(
      record,
      "companyId",
      "campaign.progress.get output.pendingQuestionnaires[]",
    ),
    subjectEmployeeId: ensureStringField(
      record,
      "subjectEmployeeId",
      "campaign.progress.get output.pendingQuestionnaires[]",
    ),
    raterEmployeeId: ensureStringField(
      record,
      "raterEmployeeId",
      "campaign.progress.get output.pendingQuestionnaires[]",
    ),
    status,
    ...(typeof firstDraftAt === "string" ? { firstDraftAt } : {}),
    ...(typeof submittedAt === "string" ? { submittedAt } : {}),
  };
};

const parseCampaignProgressPendingGroupItem = (
  value: unknown,
): CampaignProgressPendingGroupItem => {
  const record = ensureObject(value, "campaign.progress.get output.pendingBy[]");
  ensureAllowedKeys(
    record,
    ["employeeId", "pendingCount"],
    "campaign.progress.get output.pendingBy[]",
  );

  return {
    employeeId: ensureStringField(record, "employeeId", "campaign.progress.get output.pendingBy[]"),
    pendingCount: ensureNumberField(
      record,
      "pendingCount",
      "campaign.progress.get output.pendingBy[]",
    ),
  };
};

export const parseCampaignProgressGetOutput = (value: unknown): CampaignProgressGetOutput => {
  const record = ensureObject(value, "campaign.progress.get output");
  ensureAllowedKeys(
    record,
    [
      "campaignId",
      "companyId",
      "totalQuestionnaires",
      "statusCounts",
      "campaignLockedAt",
      "pendingQuestionnaires",
      "pendingByRater",
      "pendingBySubject",
    ],
    "campaign.progress.get output",
  );

  const campaignLockedAt = record.campaignLockedAt;
  if (
    campaignLockedAt !== undefined &&
    campaignLockedAt !== null &&
    typeof campaignLockedAt !== "string"
  ) {
    throw new Error("campaign.progress.get output.campaignLockedAt must be a string.");
  }

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign.progress.get output"),
    companyId: ensureStringField(record, "companyId", "campaign.progress.get output"),
    totalQuestionnaires: ensureNumberField(
      record,
      "totalQuestionnaires",
      "campaign.progress.get output",
    ),
    statusCounts: parseCampaignProgressStatusCounts(record.statusCounts),
    ...(typeof campaignLockedAt === "string" ? { campaignLockedAt } : {}),
    pendingQuestionnaires: ensureArray(
      record.pendingQuestionnaires,
      "campaign.progress.get output.pendingQuestionnaires",
    ).map(parseCampaignProgressPendingItem),
    pendingByRater: ensureArray(
      record.pendingByRater,
      "campaign.progress.get output.pendingByRater",
    ).map(parseCampaignProgressPendingGroupItem),
    pendingBySubject: ensureArray(
      record.pendingBySubject,
      "campaign.progress.get output.pendingBySubject",
    ).map(parseCampaignProgressPendingGroupItem),
  };
};

export const parseNotificationsGenerateRemindersInput = (
  value: unknown,
): NotificationsGenerateRemindersInput => {
  const record = ensureObject(value, "notifications.generateReminders input");
  ensureAllowedKeys(record, ["campaignId", "now"], "notifications.generateReminders input");

  const now = record.now;
  if (now !== undefined) {
    if (typeof now !== "string" || Number.isNaN(Date.parse(now))) {
      throw new Error("notifications.generateReminders input.now must be an ISO timestamp.");
    }
  }

  return {
    campaignId: ensureStringField(record, "campaignId", "notifications.generateReminders input"),
    ...(typeof now === "string" ? { now } : {}),
  };
};

export const parseNotificationsGenerateRemindersOutput = (
  value: unknown,
): NotificationsGenerateRemindersOutput => {
  const record = ensureObject(value, "notifications.generateReminders output");
  ensureAllowedKeys(
    record,
    ["campaignId", "dateBucket", "candidateRecipients", "generated", "deduplicated"],
    "notifications.generateReminders output",
  );

  return {
    campaignId: ensureStringField(record, "campaignId", "notifications.generateReminders output"),
    dateBucket: ensureStringField(record, "dateBucket", "notifications.generateReminders output"),
    candidateRecipients: ensureNumberField(
      record,
      "candidateRecipients",
      "notifications.generateReminders output",
    ),
    generated: ensureNumberField(record, "generated", "notifications.generateReminders output"),
    deduplicated: ensureNumberField(
      record,
      "deduplicated",
      "notifications.generateReminders output",
    ),
  };
};

export const parseNotificationsDispatchOutboxInput = (
  value: unknown,
): NotificationsDispatchOutboxInput => {
  const record = ensureObject(value, "notifications.dispatchOutbox input");
  ensureAllowedKeys(
    record,
    ["campaignId", "limit", "provider"],
    "notifications.dispatchOutbox input",
  );

  const limit = record.limit;
  if (limit !== undefined) {
    if (!Number.isInteger(limit) || Number(limit) < 1) {
      throw new Error("notifications.dispatchOutbox input.limit must be an integer >= 1.");
    }
  }

  const provider = record.provider;
  if (provider !== undefined && provider !== "stub" && provider !== "resend") {
    throw new Error('notifications.dispatchOutbox input.provider must be "stub" or "resend".');
  }

  return {
    ...(record.campaignId !== undefined
      ? {
          campaignId: ensureStringField(record, "campaignId", "notifications.dispatchOutbox input"),
        }
      : {}),
    ...(typeof limit === "number" ? { limit } : {}),
    ...(provider ? { provider } : {}),
  };
};

export const parseNotificationsDispatchOutboxOutput = (
  value: unknown,
): NotificationsDispatchOutboxOutput => {
  const record = ensureObject(value, "notifications.dispatchOutbox output");
  ensureAllowedKeys(
    record,
    ["provider", "processed", "sent", "failed", "attemptsLogged", "remainingPending"],
    "notifications.dispatchOutbox output",
  );

  const provider = ensureStringField(record, "provider", "notifications.dispatchOutbox output");
  if (provider !== "stub" && provider !== "resend") {
    throw new Error('notifications.dispatchOutbox output.provider must be "stub" or "resend".');
  }

  return {
    provider,
    processed: ensureNumberField(record, "processed", "notifications.dispatchOutbox output"),
    sent: ensureNumberField(record, "sent", "notifications.dispatchOutbox output"),
    failed: ensureNumberField(record, "failed", "notifications.dispatchOutbox output"),
    attemptsLogged: ensureNumberField(
      record,
      "attemptsLogged",
      "notifications.dispatchOutbox output",
    ),
    remainingPending: ensureNumberField(
      record,
      "remainingPending",
      "notifications.dispatchOutbox output",
    ),
  };
};

const parseReminderWeekdays = (value: unknown, location: string): number[] => {
  return ensureArray(value, location).map((item, index) => {
    if (!Number.isInteger(item) || Number(item) < 1 || Number(item) > 7) {
      throw new Error(`${location}[${index}] must be an integer between 1 and 7.`);
    }
    return Number(item);
  });
};

export const parseNotificationReminderSettingsGetInput = (
  value: unknown,
): NotificationReminderSettingsGetInput => {
  const record = ensureObject(value, "notifications.settings.get input");
  ensureAllowedKeys(record, [], "notifications.settings.get input");
  return {};
};

export const parseNotificationReminderSettingsOutput = (
  value: unknown,
): NotificationReminderSettingsOutput => {
  const record = ensureObject(value, "notifications.settings output");
  ensureAllowedKeys(
    record,
    [
      "companyId",
      "reminderScheduledHour",
      "quietHoursStart",
      "quietHoursEnd",
      "reminderWeekdays",
      "locale",
      "updatedAt",
    ],
    "notifications.settings output",
  );

  const locale = ensureStringField(record, "locale", "notifications.settings output");
  if (locale !== "ru") {
    throw new Error('notifications.settings output.locale must be "ru".');
  }

  return {
    companyId: ensureStringField(record, "companyId", "notifications.settings output"),
    reminderScheduledHour: ensureNumberField(
      record,
      "reminderScheduledHour",
      "notifications.settings output",
    ),
    quietHoursStart: ensureNumberField(record, "quietHoursStart", "notifications.settings output"),
    quietHoursEnd: ensureNumberField(record, "quietHoursEnd", "notifications.settings output"),
    reminderWeekdays: parseReminderWeekdays(
      record.reminderWeekdays,
      "notifications.settings output.reminderWeekdays",
    ),
    locale,
    updatedAt: ensureStringField(record, "updatedAt", "notifications.settings output"),
  };
};

export const parseNotificationReminderSettingsUpsertInput = (
  value: unknown,
): NotificationReminderSettingsUpsertInput => {
  const record = ensureObject(value, "notifications.settings.upsert input");
  ensureAllowedKeys(
    record,
    ["reminderScheduledHour", "quietHoursStart", "quietHoursEnd", "reminderWeekdays"],
    "notifications.settings.upsert input",
  );

  return {
    reminderScheduledHour: ensureNumberField(
      record,
      "reminderScheduledHour",
      "notifications.settings.upsert input",
    ),
    quietHoursStart: ensureNumberField(
      record,
      "quietHoursStart",
      "notifications.settings.upsert input",
    ),
    quietHoursEnd: ensureNumberField(
      record,
      "quietHoursEnd",
      "notifications.settings.upsert input",
    ),
    reminderWeekdays: parseReminderWeekdays(
      record.reminderWeekdays,
      "notifications.settings.upsert input.reminderWeekdays",
    ),
  };
};

export const parseNotificationReminderPreviewInput = (
  value: unknown,
): NotificationReminderPreviewInput => {
  const record = ensureObject(value, "notifications.settings.preview input");
  ensureAllowedKeys(
    record,
    [
      "campaignId",
      "now",
      "reminderScheduledHour",
      "quietHoursStart",
      "quietHoursEnd",
      "reminderWeekdays",
    ],
    "notifications.settings.preview input",
  );

  const now = record.now;
  if (now !== undefined) {
    if (typeof now !== "string" || Number.isNaN(Date.parse(now))) {
      throw new Error("notifications.settings.preview input.now must be an ISO timestamp.");
    }
  }

  return {
    ...(record.campaignId !== undefined
      ? {
          campaignId: ensureStringField(
            record,
            "campaignId",
            "notifications.settings.preview input",
          ),
        }
      : {}),
    ...(typeof now === "string" ? { now } : {}),
    ...(typeof record.reminderScheduledHour === "number"
      ? { reminderScheduledHour: record.reminderScheduledHour }
      : {}),
    ...(typeof record.quietHoursStart === "number"
      ? { quietHoursStart: record.quietHoursStart }
      : {}),
    ...(typeof record.quietHoursEnd === "number" ? { quietHoursEnd: record.quietHoursEnd } : {}),
    ...(record.reminderWeekdays !== undefined
      ? {
          reminderWeekdays: parseReminderWeekdays(
            record.reminderWeekdays,
            "notifications.settings.preview input.reminderWeekdays",
          ),
        }
      : {}),
  };
};

export const parseNotificationReminderPreviewOutput = (
  value: unknown,
): NotificationReminderPreviewOutput => {
  const record = ensureObject(value, "notifications.settings.preview output");
  ensureAllowedKeys(
    record,
    [
      "companyId",
      "campaignId",
      "effectiveTimezone",
      "companyTimezone",
      "campaignTimezone",
      "reminderScheduledHour",
      "quietHoursStart",
      "quietHoursEnd",
      "reminderWeekdays",
      "nextRunAt",
      "localDateBucket",
      "localWeekday",
      "localHour",
    ],
    "notifications.settings.preview output",
  );

  const nextRunAt = record.nextRunAt;
  if (nextRunAt !== undefined && nextRunAt !== null && typeof nextRunAt !== "string") {
    throw new Error("notifications.settings.preview output.nextRunAt must be a string or null.");
  }

  return {
    companyId: ensureStringField(record, "companyId", "notifications.settings.preview output"),
    ...(record.campaignId !== undefined
      ? {
          campaignId: ensureStringField(
            record,
            "campaignId",
            "notifications.settings.preview output",
          ),
        }
      : {}),
    effectiveTimezone: ensureStringField(
      record,
      "effectiveTimezone",
      "notifications.settings.preview output",
    ),
    companyTimezone: ensureStringField(
      record,
      "companyTimezone",
      "notifications.settings.preview output",
    ),
    ...(record.campaignTimezone !== undefined
      ? {
          campaignTimezone: ensureStringField(
            record,
            "campaignTimezone",
            "notifications.settings.preview output",
          ),
        }
      : {}),
    reminderScheduledHour: ensureNumberField(
      record,
      "reminderScheduledHour",
      "notifications.settings.preview output",
    ),
    quietHoursStart: ensureNumberField(
      record,
      "quietHoursStart",
      "notifications.settings.preview output",
    ),
    quietHoursEnd: ensureNumberField(
      record,
      "quietHoursEnd",
      "notifications.settings.preview output",
    ),
    reminderWeekdays: parseReminderWeekdays(
      record.reminderWeekdays,
      "notifications.settings.preview output.reminderWeekdays",
    ),
    ...(typeof nextRunAt === "string" ? { nextRunAt } : { nextRunAt: null }),
    localDateBucket: ensureStringField(
      record,
      "localDateBucket",
      "notifications.settings.preview output",
    ),
    localWeekday: ensureNumberField(
      record,
      "localWeekday",
      "notifications.settings.preview output",
    ),
    localHour: ensureNumberField(record, "localHour", "notifications.settings.preview output"),
  };
};

const parseNotificationTemplateCatalogItem = (
  value: unknown,
  extraAllowedKeys: string[] = [],
): NotificationTemplateCatalogItem => {
  const record = ensureObject(value, "notifications.templates item");
  ensureAllowedKeys(
    record,
    [
      "templateKey",
      "locale",
      "version",
      "channel",
      "title",
      "description",
      "variables",
      ...extraAllowedKeys,
    ],
    "notifications.templates item",
  );
  const templateKey = ensureStringField(record, "templateKey", "notifications.templates item");
  if (templateKey !== "campaign_invite@v1" && templateKey !== "campaign_reminder@v1") {
    throw new Error("notifications.templates item.templateKey must be a supported template key.");
  }
  const locale = ensureStringField(record, "locale", "notifications.templates item");
  const version = ensureStringField(record, "version", "notifications.templates item");
  const channel = ensureStringField(record, "channel", "notifications.templates item");
  if (locale !== "ru" || version !== "v1" || channel !== "email") {
    throw new Error("notifications.templates item locale/version/channel must be ru/v1/email.");
  }

  return {
    templateKey,
    locale,
    version,
    channel,
    title: ensureStringField(record, "title", "notifications.templates item"),
    description: ensureStringField(record, "description", "notifications.templates item"),
    variables: ensureArray(record.variables, "notifications.templates item.variables").map(
      (item, index) =>
        ensureStringField(
          { value: item },
          "value",
          `notifications.templates item.variables[${index}]`,
        ),
    ),
  };
};

export const parseNotificationTemplateCatalogOutput = (
  value: unknown,
): NotificationTemplateCatalogOutput => {
  const record = ensureObject(value, "notifications.templates.list output");
  ensureAllowedKeys(record, ["items"], "notifications.templates.list output");
  return {
    items: ensureArray(record.items, "notifications.templates.list output.items").map((item) =>
      parseNotificationTemplateCatalogItem(item),
    ),
  };
};

export const parseNotificationTemplatePreviewInput = (
  value: unknown,
): NotificationTemplatePreviewInput => {
  const record = ensureObject(value, "notifications.templates.preview input");
  ensureAllowedKeys(record, ["templateKey", "campaignId"], "notifications.templates.preview input");
  const templateKey = ensureStringField(
    record,
    "templateKey",
    "notifications.templates.preview input",
  );
  if (templateKey !== "campaign_invite@v1" && templateKey !== "campaign_reminder@v1") {
    throw new Error(
      "notifications.templates.preview input.templateKey must be a supported template key.",
    );
  }
  return {
    templateKey,
    ...(record.campaignId !== undefined
      ? {
          campaignId: ensureStringField(
            record,
            "campaignId",
            "notifications.templates.preview input",
          ),
        }
      : {}),
  };
};

export const parseNotificationTemplatePreviewOutput = (
  value: unknown,
): NotificationTemplatePreviewOutput => {
  const record = ensureObject(value, "notifications.templates.preview output");
  ensureAllowedKeys(
    record,
    [
      "templateKey",
      "locale",
      "version",
      "channel",
      "title",
      "description",
      "variables",
      "subject",
      "text",
      "html",
    ],
    "notifications.templates.preview output",
  );
  const base = parseNotificationTemplateCatalogItem(record, ["subject", "text", "html"]);
  return {
    ...base,
    subject: ensureStringField(record, "subject", "notifications.templates.preview output"),
    text: ensureStringField(record, "text", "notifications.templates.preview output"),
    html: ensureStringField(record, "html", "notifications.templates.preview output"),
  };
};

export const parseNotificationDeliveryDiagnosticsInput = (
  value: unknown,
): NotificationDeliveryDiagnosticsInput => {
  const record = ensureObject(value, "notifications.deliveries.list input");
  ensureAllowedKeys(
    record,
    ["campaignId", "status", "channel"],
    "notifications.deliveries.list input",
  );
  const status = record.status;
  if (
    status !== undefined &&
    status !== "pending" &&
    status !== "sent" &&
    status !== "failed" &&
    status !== "dead_letter" &&
    status !== "retry_scheduled"
  ) {
    throw new Error(
      "notifications.deliveries.list input.status must be a supported outbox status.",
    );
  }
  const channel = record.channel;
  if (channel !== undefined && channel !== "email") {
    throw new Error('notifications.deliveries.list input.channel must be "email".');
  }

  return {
    ...(record.campaignId !== undefined
      ? {
          campaignId: ensureStringField(
            record,
            "campaignId",
            "notifications.deliveries.list input",
          ),
        }
      : {}),
    ...(typeof status === "string" ? { status } : {}),
    ...(typeof channel === "string" ? { channel } : {}),
  };
};

export const parseNotificationDeliveryDiagnosticsOutput = (
  value: unknown,
): NotificationDeliveryDiagnosticsOutput => {
  const record = ensureObject(value, "notifications.deliveries.list output");
  ensureAllowedKeys(record, ["items"], "notifications.deliveries.list output");

  return {
    items: ensureArray(record.items, "notifications.deliveries.list output.items").map(
      (item, index) => {
        const row = ensureObject(item, `notifications.deliveries.list output.items[${index}]`);
        ensureAllowedKeys(
          row,
          [
            "outboxId",
            "campaignId",
            "campaignName",
            "recipientEmployeeId",
            "recipientLabel",
            "toEmail",
            "eventType",
            "templateKey",
            "channel",
            "status",
            "attempts",
            "nextRetryAt",
            "lastError",
            "idempotencyKey",
            "attemptsHistory",
          ],
          `notifications.deliveries.list output.items[${index}]`,
        );
        const channel = ensureStringField(
          row,
          "channel",
          `notifications.deliveries.list output.items[${index}]`,
        );
        if (channel !== "email") {
          throw new Error("notifications.deliveries.list output.item.channel must be email.");
        }
        const nextRetryAt = row.nextRetryAt;
        const lastError = row.lastError;
        return {
          outboxId: ensureStringField(
            row,
            "outboxId",
            `notifications.deliveries.list output.items[${index}]`,
          ),
          campaignId: ensureStringField(
            row,
            "campaignId",
            `notifications.deliveries.list output.items[${index}]`,
          ),
          campaignName: ensureStringField(
            row,
            "campaignName",
            `notifications.deliveries.list output.items[${index}]`,
          ),
          recipientEmployeeId: ensureStringField(
            row,
            "recipientEmployeeId",
            `notifications.deliveries.list output.items[${index}]`,
          ),
          recipientLabel: ensureStringField(
            row,
            "recipientLabel",
            `notifications.deliveries.list output.items[${index}]`,
          ),
          toEmail: ensureStringField(
            row,
            "toEmail",
            `notifications.deliveries.list output.items[${index}]`,
          ),
          eventType: ensureStringField(
            row,
            "eventType",
            `notifications.deliveries.list output.items[${index}]`,
          ),
          templateKey: ensureStringField(
            row,
            "templateKey",
            `notifications.deliveries.list output.items[${index}]`,
          ),
          channel,
          status: ensureStringField(
            row,
            "status",
            `notifications.deliveries.list output.items[${index}]`,
          ),
          attempts: ensureNumberField(
            row,
            "attempts",
            `notifications.deliveries.list output.items[${index}]`,
          ),
          nextRetryAt: typeof nextRetryAt === "string" ? nextRetryAt : null,
          lastError: typeof lastError === "string" ? lastError : null,
          idempotencyKey: ensureStringField(
            row,
            "idempotencyKey",
            `notifications.deliveries.list output.items[${index}]`,
          ),
          attemptsHistory: ensureArray(
            row.attemptsHistory,
            `notifications.deliveries.list output.items[${index}].attemptsHistory`,
          ).map((attempt, attemptIndex) => {
            const attemptRecord = ensureObject(
              attempt,
              `notifications.deliveries.list output.items[${index}].attemptsHistory[${attemptIndex}]`,
            );
            ensureAllowedKeys(
              attemptRecord,
              ["attemptNo", "provider", "status", "errorMessage", "requestedAt"],
              `notifications.deliveries.list output.items[${index}].attemptsHistory[${attemptIndex}]`,
            );
            const errorMessage = attemptRecord.errorMessage;
            return {
              attemptNo: ensureNumberField(
                attemptRecord,
                "attemptNo",
                `notifications.deliveries.list output.items[${index}].attemptsHistory[${attemptIndex}]`,
              ),
              provider: ensureStringField(
                attemptRecord,
                "provider",
                `notifications.deliveries.list output.items[${index}].attemptsHistory[${attemptIndex}]`,
              ),
              status: ensureStringField(
                attemptRecord,
                "status",
                `notifications.deliveries.list output.items[${index}].attemptsHistory[${attemptIndex}]`,
              ),
              errorMessage: typeof errorMessage === "string" ? errorMessage : null,
              requestedAt: ensureStringField(
                attemptRecord,
                "requestedAt",
                `notifications.deliveries.list output.items[${index}].attemptsHistory[${attemptIndex}]`,
              ),
            };
          }),
        };
      },
    ),
  };
};

export const parseResultsGetHrViewInput = (value: unknown): ResultsGetHrViewInput => {
  const record = ensureObject(value, "results.getHrView input");
  ensureAllowedKeys(
    record,
    ["campaignId", "subjectEmployeeId", "smallGroupPolicy", "anonymityThreshold"],
    "results.getHrView input",
  );

  const smallGroupPolicyValue = record.smallGroupPolicy;
  if (smallGroupPolicyValue !== undefined) {
    if (typeof smallGroupPolicyValue !== "string" || !isSmallGroupPolicy(smallGroupPolicyValue)) {
      throw new Error(
        `results.getHrView input.smallGroupPolicy must be one of: ${smallGroupPolicies.join(", ")}`,
      );
    }
  }

  const anonymityThresholdValue = record.anonymityThreshold;
  if (anonymityThresholdValue !== undefined) {
    if (
      typeof anonymityThresholdValue !== "number" ||
      Number.isNaN(anonymityThresholdValue) ||
      !Number.isInteger(anonymityThresholdValue) ||
      anonymityThresholdValue < 1
    ) {
      throw new Error("results.getHrView input.anonymityThreshold must be an integer >= 1.");
    }
  }

  return {
    campaignId: ensureStringField(record, "campaignId", "results.getHrView input"),
    subjectEmployeeId: ensureStringField(record, "subjectEmployeeId", "results.getHrView input"),
    ...(smallGroupPolicyValue ? { smallGroupPolicy: smallGroupPolicyValue } : {}),
    ...(typeof anonymityThresholdValue === "number"
      ? { anonymityThreshold: anonymityThresholdValue }
      : {}),
  };
};

export const parseResultsGetMyDashboardInput = (value: unknown): ResultsGetMyDashboardInput => {
  const record = ensureObject(value, "results.getMyDashboard input");
  ensureAllowedKeys(
    record,
    ["campaignId", "smallGroupPolicy", "anonymityThreshold"],
    "results.getMyDashboard input",
  );

  const smallGroupPolicyValue = record.smallGroupPolicy;
  if (smallGroupPolicyValue !== undefined) {
    if (typeof smallGroupPolicyValue !== "string" || !isSmallGroupPolicy(smallGroupPolicyValue)) {
      throw new Error(
        `results.getMyDashboard input.smallGroupPolicy must be one of: ${smallGroupPolicies.join(", ")}`,
      );
    }
  }

  const anonymityThresholdValue = record.anonymityThreshold;
  if (anonymityThresholdValue !== undefined) {
    if (
      typeof anonymityThresholdValue !== "number" ||
      Number.isNaN(anonymityThresholdValue) ||
      !Number.isInteger(anonymityThresholdValue) ||
      anonymityThresholdValue < 1
    ) {
      throw new Error("results.getMyDashboard input.anonymityThreshold must be an integer >= 1.");
    }
  }

  return {
    campaignId: ensureStringField(record, "campaignId", "results.getMyDashboard input"),
    ...(smallGroupPolicyValue ? { smallGroupPolicy: smallGroupPolicyValue } : {}),
    ...(typeof anonymityThresholdValue === "number"
      ? { anonymityThreshold: anonymityThresholdValue }
      : {}),
  };
};

export const parseResultsGetTeamDashboardInput = (value: unknown): ResultsGetTeamDashboardInput => {
  const record = ensureObject(value, "results.getTeamDashboard input");
  ensureAllowedKeys(
    record,
    ["campaignId", "subjectEmployeeId", "smallGroupPolicy", "anonymityThreshold"],
    "results.getTeamDashboard input",
  );

  const smallGroupPolicyValue = record.smallGroupPolicy;
  if (smallGroupPolicyValue !== undefined) {
    if (typeof smallGroupPolicyValue !== "string" || !isSmallGroupPolicy(smallGroupPolicyValue)) {
      throw new Error(
        `results.getTeamDashboard input.smallGroupPolicy must be one of: ${smallGroupPolicies.join(", ")}`,
      );
    }
  }

  const anonymityThresholdValue = record.anonymityThreshold;
  if (anonymityThresholdValue !== undefined) {
    if (
      typeof anonymityThresholdValue !== "number" ||
      Number.isNaN(anonymityThresholdValue) ||
      !Number.isInteger(anonymityThresholdValue) ||
      anonymityThresholdValue < 1
    ) {
      throw new Error("results.getTeamDashboard input.anonymityThreshold must be an integer >= 1.");
    }
  }

  return {
    campaignId: ensureStringField(record, "campaignId", "results.getTeamDashboard input"),
    subjectEmployeeId: ensureStringField(
      record,
      "subjectEmployeeId",
      "results.getTeamDashboard input",
    ),
    ...(smallGroupPolicyValue ? { smallGroupPolicy: smallGroupPolicyValue } : {}),
    ...(typeof anonymityThresholdValue === "number"
      ? { anonymityThreshold: anonymityThresholdValue }
      : {}),
  };
};

const parseOptionalNumberField = (
  record: Record<string, unknown>,
  field: string,
  fieldName: string,
): number | undefined => {
  const value = record[field];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${fieldName}.${field} must be a number when provided.`);
  }
  return value;
};

const parseNullableModeLevelField = (
  record: Record<string, unknown>,
  field: string,
  fieldName: string,
): 1 | 2 | 3 | 4 | null => {
  const value = record[field];
  if (value === null) {
    return null;
  }
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 4) {
    throw new Error(`${fieldName}.${field} must be an integer in range 1..4 or null.`);
  }
  return value as 1 | 2 | 3 | 4;
};

const parseResultsHrViewLevelDistribution = (value: unknown): ResultsHrViewLevelDistribution => {
  const record = ensureObject(value, "results.getHrView output.levelSummary.distribution");
  ensureAllowedKeys(
    record,
    ["level1", "level2", "level3", "level4"],
    "results.getHrView output.levelSummary.distribution",
  );

  return {
    level1: ensureNumberField(
      record,
      "level1",
      "results.getHrView output.levelSummary.distribution",
    ),
    level2: ensureNumberField(
      record,
      "level2",
      "results.getHrView output.levelSummary.distribution",
    ),
    level3: ensureNumberField(
      record,
      "level3",
      "results.getHrView output.levelSummary.distribution",
    ),
    level4: ensureNumberField(
      record,
      "level4",
      "results.getHrView output.levelSummary.distribution",
    ),
  };
};

const parseResultsHrViewLevelSummary = (value: unknown): ResultsHrViewLevelSummary => {
  const record = ensureObject(value, "results.getHrView output.levelSummary");
  ensureAllowedKeys(
    record,
    ["modeLevel", "distribution", "nValid", "nUnsure"],
    "results.getHrView output.levelSummary",
  );

  return {
    modeLevel: parseNullableModeLevelField(
      record,
      "modeLevel",
      "results.getHrView output.levelSummary",
    ),
    distribution: parseResultsHrViewLevelDistribution(record.distribution),
    nValid: ensureNumberField(record, "nValid", "results.getHrView output.levelSummary"),
    nUnsure: ensureNumberField(record, "nUnsure", "results.getHrView output.levelSummary"),
  };
};

const parseResultsHrViewRaterScore = (value: unknown): ResultsHrViewRaterScore => {
  const record = ensureObject(value, "results.getHrView output.raterScores[]");
  ensureAllowedKeys(
    record,
    [
      "raterEmployeeId",
      "group",
      "competencyId",
      "score",
      "validIndicatorCount",
      "totalIndicatorCount",
    ],
    "results.getHrView output.raterScores[]",
  );

  const group = ensureStringField(record, "group", "results.getHrView output.raterScores[]");
  if (!isResultsGroupKey(group)) {
    throw new Error(
      `results.getHrView output.raterScores[].group must be one of: ${resultsGroupKeys.join(", ")}`,
    );
  }

  const score = parseOptionalNumberField(record, "score", "results.getHrView output.raterScores[]");

  return {
    raterEmployeeId: ensureStringField(
      record,
      "raterEmployeeId",
      "results.getHrView output.raterScores[]",
    ),
    group,
    competencyId: ensureStringField(
      record,
      "competencyId",
      "results.getHrView output.raterScores[]",
    ),
    ...(score !== undefined ? { score } : {}),
    validIndicatorCount: ensureNumberField(
      record,
      "validIndicatorCount",
      "results.getHrView output.raterScores[]",
    ),
    totalIndicatorCount: ensureNumberField(
      record,
      "totalIndicatorCount",
      "results.getHrView output.raterScores[]",
    ),
  };
};

const parseResultsHrViewCompetencyScore = (value: unknown): ResultsHrViewCompetencyScore => {
  const record = ensureObject(value, "results.getHrView output.competencyScores[]");
  ensureAllowedKeys(
    record,
    [
      "competencyId",
      "competencyName",
      "groupId",
      "groupName",
      "managerScore",
      "managerRaters",
      "peersScore",
      "peersRaters",
      "subordinatesScore",
      "subordinatesRaters",
      "selfScore",
      "selfRaters",
      "otherScore",
      "otherRaters",
      "managerVisibility",
      "peersVisibility",
      "subordinatesVisibility",
      "selfVisibility",
      "otherVisibility",
      "managerLevels",
      "peersLevels",
      "subordinatesLevels",
      "selfLevels",
      "otherLevels",
    ],
    "results.getHrView output.competencyScores[]",
  );

  const managerScore = parseOptionalNumberField(
    record,
    "managerScore",
    "results.getHrView output.competencyScores[]",
  );
  const peersScore = parseOptionalNumberField(
    record,
    "peersScore",
    "results.getHrView output.competencyScores[]",
  );
  const subordinatesScore = parseOptionalNumberField(
    record,
    "subordinatesScore",
    "results.getHrView output.competencyScores[]",
  );
  const selfScore = parseOptionalNumberField(
    record,
    "selfScore",
    "results.getHrView output.competencyScores[]",
  );
  const otherScore = parseOptionalNumberField(
    record,
    "otherScore",
    "results.getHrView output.competencyScores[]",
  );
  const managerVisibility = ensureStringField(
    record,
    "managerVisibility",
    "results.getHrView output.competencyScores[]",
  );
  if (managerVisibility !== "shown") {
    throw new Error(
      'results.getHrView output.competencyScores[].managerVisibility must be "shown".',
    );
  }

  const peersVisibility = ensureStringField(
    record,
    "peersVisibility",
    "results.getHrView output.competencyScores[]",
  );
  if (!isResultsGroupVisibilityState(peersVisibility)) {
    throw new Error(
      `results.getHrView output.competencyScores[].peersVisibility must be one of: ${resultsGroupVisibilityStates.join(", ")}`,
    );
  }

  const subordinatesVisibility = ensureStringField(
    record,
    "subordinatesVisibility",
    "results.getHrView output.competencyScores[]",
  );
  if (!isResultsGroupVisibilityState(subordinatesVisibility)) {
    throw new Error(
      `results.getHrView output.competencyScores[].subordinatesVisibility must be one of: ${resultsGroupVisibilityStates.join(", ")}`,
    );
  }

  const selfVisibility = ensureStringField(
    record,
    "selfVisibility",
    "results.getHrView output.competencyScores[]",
  );
  if (selfVisibility !== "shown") {
    throw new Error('results.getHrView output.competencyScores[].selfVisibility must be "shown".');
  }

  const otherVisibilityValue = record.otherVisibility;
  if (otherVisibilityValue !== undefined) {
    if (otherVisibilityValue !== "shown" && otherVisibilityValue !== "hidden") {
      throw new Error(
        'results.getHrView output.competencyScores[].otherVisibility must be "shown" or "hidden" when provided.',
      );
    }
  }

  const managerLevelsValue = record.managerLevels;
  const peersLevelsValue = record.peersLevels;
  const subordinatesLevelsValue = record.subordinatesLevels;
  const selfLevelsValue = record.selfLevels;
  const otherLevelsValue = record.otherLevels;

  return {
    competencyId: ensureStringField(
      record,
      "competencyId",
      "results.getHrView output.competencyScores[]",
    ),
    competencyName: ensureStringField(
      record,
      "competencyName",
      "results.getHrView output.competencyScores[]",
    ),
    groupId: ensureStringField(record, "groupId", "results.getHrView output.competencyScores[]"),
    groupName: ensureStringField(
      record,
      "groupName",
      "results.getHrView output.competencyScores[]",
    ),
    ...(managerScore !== undefined ? { managerScore } : {}),
    managerRaters: ensureNumberField(
      record,
      "managerRaters",
      "results.getHrView output.competencyScores[]",
    ),
    ...(peersScore !== undefined ? { peersScore } : {}),
    peersRaters: ensureNumberField(
      record,
      "peersRaters",
      "results.getHrView output.competencyScores[]",
    ),
    ...(subordinatesScore !== undefined ? { subordinatesScore } : {}),
    subordinatesRaters: ensureNumberField(
      record,
      "subordinatesRaters",
      "results.getHrView output.competencyScores[]",
    ),
    ...(selfScore !== undefined ? { selfScore } : {}),
    selfRaters: ensureNumberField(
      record,
      "selfRaters",
      "results.getHrView output.competencyScores[]",
    ),
    ...(otherScore !== undefined ? { otherScore } : {}),
    otherRaters: ensureNumberField(
      record,
      "otherRaters",
      "results.getHrView output.competencyScores[]",
    ),
    managerVisibility: "shown",
    peersVisibility,
    subordinatesVisibility,
    selfVisibility: "shown",
    ...(otherVisibilityValue ? { otherVisibility: otherVisibilityValue } : {}),
    ...(managerLevelsValue !== undefined
      ? { managerLevels: parseResultsHrViewLevelSummary(managerLevelsValue) }
      : {}),
    ...(peersLevelsValue !== undefined
      ? { peersLevels: parseResultsHrViewLevelSummary(peersLevelsValue) }
      : {}),
    ...(subordinatesLevelsValue !== undefined
      ? { subordinatesLevels: parseResultsHrViewLevelSummary(subordinatesLevelsValue) }
      : {}),
    ...(selfLevelsValue !== undefined
      ? { selfLevels: parseResultsHrViewLevelSummary(selfLevelsValue) }
      : {}),
    ...(otherLevelsValue !== undefined
      ? { otherLevels: parseResultsHrViewLevelSummary(otherLevelsValue) }
      : {}),
  };
};

const parseResultsHrViewGroupOverall = (value: unknown): ResultsHrViewGroupOverall => {
  const record = ensureObject(value, "results.getHrView output.groupOverall");
  ensureAllowedKeys(
    record,
    ["manager", "peers", "subordinates", "self", "other"],
    "results.getHrView output.groupOverall",
  );

  const manager = parseOptionalNumberField(
    record,
    "manager",
    "results.getHrView output.groupOverall",
  );
  const peers = parseOptionalNumberField(record, "peers", "results.getHrView output.groupOverall");
  const subordinates = parseOptionalNumberField(
    record,
    "subordinates",
    "results.getHrView output.groupOverall",
  );
  const self = parseOptionalNumberField(record, "self", "results.getHrView output.groupOverall");
  const other = parseOptionalNumberField(record, "other", "results.getHrView output.groupOverall");

  return {
    ...(manager !== undefined ? { manager } : {}),
    ...(peers !== undefined ? { peers } : {}),
    ...(subordinates !== undefined ? { subordinates } : {}),
    ...(self !== undefined ? { self } : {}),
    ...(other !== undefined ? { other } : {}),
  };
};

const parseResultsHrViewGroupVisibility = (value: unknown): ResultsHrViewGroupVisibility => {
  const record = ensureObject(value, "results.getHrView output.groupVisibility");
  ensureAllowedKeys(
    record,
    ["manager", "peers", "subordinates", "self", "other"],
    "results.getHrView output.groupVisibility",
  );

  const manager = ensureStringField(record, "manager", "results.getHrView output.groupVisibility");
  if (manager !== "shown") {
    throw new Error('results.getHrView output.groupVisibility.manager must be "shown".');
  }

  const peers = ensureStringField(record, "peers", "results.getHrView output.groupVisibility");
  if (!isResultsGroupVisibilityState(peers)) {
    throw new Error(
      `results.getHrView output.groupVisibility.peers must be one of: ${resultsGroupVisibilityStates.join(", ")}`,
    );
  }

  const subordinates = ensureStringField(
    record,
    "subordinates",
    "results.getHrView output.groupVisibility",
  );
  if (!isResultsGroupVisibilityState(subordinates)) {
    throw new Error(
      `results.getHrView output.groupVisibility.subordinates must be one of: ${resultsGroupVisibilityStates.join(", ")}`,
    );
  }

  const self = ensureStringField(record, "self", "results.getHrView output.groupVisibility");
  if (self !== "shown") {
    throw new Error('results.getHrView output.groupVisibility.self must be "shown".');
  }

  const otherValue = record.other;
  if (otherValue !== undefined) {
    if (otherValue !== "shown" && otherValue !== "hidden") {
      throw new Error(
        'results.getHrView output.groupVisibility.other must be "shown" or "hidden" when provided.',
      );
    }
  }

  return {
    manager: "shown",
    peers,
    subordinates,
    self: "shown",
    ...(otherValue ? { other: otherValue } : {}),
  };
};

const parseResultsHrViewGroupWeights = (value: unknown): ResultsHrViewGroupWeights => {
  const record = ensureObject(value, "results.getHrView output.groupWeights");
  ensureAllowedKeys(
    record,
    ["manager", "peers", "subordinates", "self", "other"],
    "results.getHrView output.groupWeights",
  );

  const manager = ensureNumberField(record, "manager", "results.getHrView output.groupWeights");
  const peers = ensureNumberField(record, "peers", "results.getHrView output.groupWeights");
  const subordinates = ensureNumberField(
    record,
    "subordinates",
    "results.getHrView output.groupWeights",
  );
  const self = ensureNumberField(record, "self", "results.getHrView output.groupWeights");
  const other = ensureNumberField(record, "other", "results.getHrView output.groupWeights");

  return {
    manager,
    peers,
    subordinates,
    self,
    other,
  };
};

const parseResultsOpenTextItem = (value: unknown): ResultsOpenTextItem => {
  const record = ensureObject(value, "results output.openText[]");
  ensureAllowedKeys(
    record,
    ["competencyId", "group", "count", "rawText", "processedText", "summaryText"],
    "results output.openText[]",
  );

  const group = ensureStringField(record, "group", "results output.openText[]");
  if (group !== "other" && !isResultsGroupKey(group)) {
    throw new Error(
      "results output.openText[].group must be one of manager|peers|subordinates|self|other.",
    );
  }

  const rawText = record.rawText;
  if (rawText !== undefined && rawText !== null && typeof rawText !== "string") {
    throw new Error("results output.openText[].rawText must be a string when provided.");
  }

  const processedText = record.processedText;
  if (processedText !== undefined && processedText !== null && typeof processedText !== "string") {
    throw new Error("results output.openText[].processedText must be a string when provided.");
  }

  const summaryText = record.summaryText;
  if (summaryText !== undefined && summaryText !== null && typeof summaryText !== "string") {
    throw new Error("results output.openText[].summaryText must be a string when provided.");
  }

  return {
    competencyId: ensureStringField(record, "competencyId", "results output.openText[]"),
    group: group as ResultsOpenTextGroup,
    count: ensureNumberField(record, "count", "results output.openText[]"),
    ...(typeof rawText === "string" ? { rawText } : {}),
    ...(typeof processedText === "string" ? { processedText } : {}),
    ...(typeof summaryText === "string" ? { summaryText } : {}),
  };
};

export const parseResultsGetHrViewOutput = (value: unknown): ResultsGetHrViewOutput => {
  const record = ensureObject(value, "results.getHrView output");
  ensureAllowedKeys(
    record,
    [
      "campaignId",
      "companyId",
      "subjectEmployeeId",
      "modelVersionId",
      "modelKind",
      "anonymityThreshold",
      "smallGroupPolicy",
      "groupVisibility",
      "competencyScores",
      "raterScores",
      "groupOverall",
      "configuredGroupWeights",
      "effectiveGroupWeights",
      "overallScore",
      "openText",
    ],
    "results.getHrView output",
  );

  const modelKind = ensureStringField(record, "modelKind", "results.getHrView output");
  if (modelKind !== "indicators" && modelKind !== "levels") {
    throw new Error('results.getHrView output.modelKind must be "indicators" or "levels".');
  }

  const smallGroupPolicyValue = ensureStringField(
    record,
    "smallGroupPolicy",
    "results.getHrView output",
  );
  if (!isSmallGroupPolicy(smallGroupPolicyValue)) {
    throw new Error(
      `results.getHrView output.smallGroupPolicy must be one of: ${smallGroupPolicies.join(", ")}`,
    );
  }

  const anonymityThreshold = ensureNumberField(
    record,
    "anonymityThreshold",
    "results.getHrView output",
  );
  if (!Number.isInteger(anonymityThreshold) || anonymityThreshold < 1) {
    throw new Error("results.getHrView output.anonymityThreshold must be an integer >= 1.");
  }

  const overallScore = parseOptionalNumberField(record, "overallScore", "results.getHrView output");
  const openTextValue = record.openText;
  if (openTextValue !== undefined && !Array.isArray(openTextValue)) {
    throw new Error("results.getHrView output.openText must be an array when provided.");
  }

  return {
    campaignId: ensureStringField(record, "campaignId", "results.getHrView output"),
    companyId: ensureStringField(record, "companyId", "results.getHrView output"),
    subjectEmployeeId: ensureStringField(record, "subjectEmployeeId", "results.getHrView output"),
    modelVersionId: ensureStringField(record, "modelVersionId", "results.getHrView output"),
    modelKind,
    anonymityThreshold,
    smallGroupPolicy: smallGroupPolicyValue,
    groupVisibility: parseResultsHrViewGroupVisibility(record.groupVisibility),
    competencyScores: ensureArray(
      record.competencyScores,
      "results.getHrView output.competencyScores",
    ).map(parseResultsHrViewCompetencyScore),
    raterScores: ensureArray(record.raterScores, "results.getHrView output.raterScores").map(
      parseResultsHrViewRaterScore,
    ),
    groupOverall: parseResultsHrViewGroupOverall(record.groupOverall),
    configuredGroupWeights: parseResultsHrViewGroupWeights(record.configuredGroupWeights),
    effectiveGroupWeights: parseResultsHrViewGroupWeights(record.effectiveGroupWeights),
    ...(overallScore !== undefined ? { overallScore } : {}),
    ...(Array.isArray(openTextValue)
      ? { openText: openTextValue.map(parseResultsOpenTextItem) }
      : {}),
  };
};

const parseResultsDashboardOutput = (
  value: unknown,
  fieldName: string,
): ResultsGetMyDashboardOutput => {
  const record = ensureObject(value, fieldName);
  ensureAllowedKeys(
    record,
    [
      "campaignId",
      "companyId",
      "subjectEmployeeId",
      "modelVersionId",
      "modelKind",
      "anonymityThreshold",
      "smallGroupPolicy",
      "groupVisibility",
      "competencyScores",
      "groupOverall",
      "effectiveGroupWeights",
      "overallScore",
      "openText",
    ],
    fieldName,
  );

  const modelKind = ensureStringField(record, "modelKind", fieldName);
  if (modelKind !== "indicators" && modelKind !== "levels") {
    throw new Error(`${fieldName}.modelKind must be "indicators" or "levels".`);
  }

  const smallGroupPolicyValue = ensureStringField(record, "smallGroupPolicy", fieldName);
  if (!isSmallGroupPolicy(smallGroupPolicyValue)) {
    throw new Error(
      `${fieldName}.smallGroupPolicy must be one of: ${smallGroupPolicies.join(", ")}`,
    );
  }

  const anonymityThreshold = ensureNumberField(record, "anonymityThreshold", fieldName);
  if (!Number.isInteger(anonymityThreshold) || anonymityThreshold < 1) {
    throw new Error(`${fieldName}.anonymityThreshold must be an integer >= 1.`);
  }

  const overallScore = parseOptionalNumberField(record, "overallScore", fieldName);
  const parseDashboardOpenTextItem = (itemValue: unknown): ResultsOpenTextItem => {
    const parsedItem = parseResultsOpenTextItem(itemValue);
    if ("rawText" in parsedItem) {
      throw new Error(`${fieldName}.openText[] must not contain rawText.`);
    }
    return parsedItem;
  };

  return {
    campaignId: ensureStringField(record, "campaignId", fieldName),
    companyId: ensureStringField(record, "companyId", fieldName),
    subjectEmployeeId: ensureStringField(record, "subjectEmployeeId", fieldName),
    modelVersionId: ensureStringField(record, "modelVersionId", fieldName),
    modelKind,
    anonymityThreshold,
    smallGroupPolicy: smallGroupPolicyValue,
    groupVisibility: parseResultsHrViewGroupVisibility(record.groupVisibility),
    competencyScores: ensureArray(record.competencyScores, `${fieldName}.competencyScores`).map(
      parseResultsHrViewCompetencyScore,
    ),
    groupOverall: parseResultsHrViewGroupOverall(record.groupOverall),
    effectiveGroupWeights: parseResultsHrViewGroupWeights(record.effectiveGroupWeights),
    ...(overallScore !== undefined ? { overallScore } : {}),
    openText: ensureArray(record.openText, `${fieldName}.openText`).map(parseDashboardOpenTextItem),
  };
};

export const parseResultsGetMyDashboardOutput = (value: unknown): ResultsGetMyDashboardOutput => {
  return parseResultsDashboardOutput(value, "results.getMyDashboard output");
};

export const parseResultsGetTeamDashboardOutput = (
  value: unknown,
): ResultsGetTeamDashboardOutput => {
  return parseResultsDashboardOutput(value, "results.getTeamDashboard output");
};

const matrixRaterRoles = ["manager", "peer", "subordinate", "self"] as const;
const isMatrixRaterRole = (value: string): value is MatrixGeneratedAssignment["raterRole"] => {
  return matrixRaterRoles.includes(value as (typeof matrixRaterRoles)[number]);
};

const matrixAssignmentSources = ["auto", "manual"] as const;
const isMatrixAssignmentSource = (value: string): value is MatrixAssignmentSource => {
  return matrixAssignmentSources.includes(value as (typeof matrixAssignmentSources)[number]);
};

const parseMatrixGeneratedAssignment = (value: unknown): MatrixGeneratedAssignment => {
  const record = ensureObject(value, "matrix.generateSuggested output.generatedAssignments[]");
  ensureAllowedKeys(
    record,
    ["subjectEmployeeId", "raterEmployeeId", "raterRole"],
    "matrix.generateSuggested output.generatedAssignments[]",
  );

  const raterRole = ensureStringField(
    record,
    "raterRole",
    "matrix.generateSuggested output.generatedAssignments[]",
  );
  if (!isMatrixRaterRole(raterRole)) {
    throw new Error(
      `matrix.generateSuggested output.generatedAssignments[].raterRole must be one of: ${matrixRaterRoles.join(", ")}`,
    );
  }

  return {
    subjectEmployeeId: ensureStringField(
      record,
      "subjectEmployeeId",
      "matrix.generateSuggested output.generatedAssignments[]",
    ),
    raterEmployeeId: ensureStringField(
      record,
      "raterEmployeeId",
      "matrix.generateSuggested output.generatedAssignments[]",
    ),
    raterRole,
  };
};

const parseMatrixAssignmentSource = (value: unknown, location: string): MatrixAssignmentSource => {
  const source = ensureStringField({ value }, "value", location);
  if (!isMatrixAssignmentSource(source)) {
    throw new Error(`${location} must be one of: ${matrixAssignmentSources.join(", ")}`);
  }

  return source;
};

const parseMatrixListAssignment = (value: unknown): MatrixListAssignment => {
  const record = ensureObject(value, "matrix.list output.assignments[]");
  ensureAllowedKeys(
    record,
    ["subjectEmployeeId", "raterEmployeeId", "raterRole", "source"],
    "matrix.list output.assignments[]",
  );

  return {
    ...parseMatrixGeneratedAssignment(record),
    source: parseMatrixAssignmentSource(record.source, "matrix.list output.assignments[].source"),
  };
};

export const parseCampaignParticipantsAddFromDepartmentsInput = (
  value: unknown,
): CampaignParticipantsAddFromDepartmentsInput => {
  const record = ensureObject(value, "campaign.participants.addFromDepartments input");
  ensureAllowedKeys(
    record,
    ["campaignId", "departmentIds", "includeSelf"],
    "campaign.participants.addFromDepartments input",
  );

  const includeSelf = record.includeSelf;
  if (includeSelf !== undefined && typeof includeSelf !== "boolean") {
    throw new Error(
      "campaign.participants.addFromDepartments input.includeSelf must be boolean when provided.",
    );
  }

  const departmentIds = ensureArray(
    record.departmentIds,
    "campaign.participants.addFromDepartments input.departmentIds",
  ).map((item) =>
    ensureStringField(
      { value: item },
      "value",
      "campaign.participants.addFromDepartments input.departmentIds[]",
    ),
  );

  return {
    campaignId: ensureStringField(
      record,
      "campaignId",
      "campaign.participants.addFromDepartments input",
    ),
    departmentIds,
    ...(typeof includeSelf === "boolean" ? { includeSelf } : {}),
  };
};

export const parseCampaignParticipantsAddFromDepartmentsOutput = (
  value: unknown,
): CampaignParticipantsAddFromDepartmentsOutput => {
  const record = ensureObject(value, "campaign.participants.addFromDepartments output");
  ensureAllowedKeys(
    record,
    ["campaignId", "addedEmployeeIds", "totalParticipants"],
    "campaign.participants.addFromDepartments output",
  );

  return {
    campaignId: ensureStringField(
      record,
      "campaignId",
      "campaign.participants.addFromDepartments output",
    ),
    addedEmployeeIds: ensureArray(
      record.addedEmployeeIds,
      "campaign.participants.addFromDepartments output.addedEmployeeIds",
    ).map((item) =>
      ensureStringField(
        { value: item },
        "value",
        "campaign.participants.addFromDepartments output.addedEmployeeIds[]",
      ),
    ),
    totalParticipants: ensureNumberField(
      record,
      "totalParticipants",
      "campaign.participants.addFromDepartments output",
    ),
  };
};

export const parseMatrixGenerateSuggestedInput = (value: unknown): MatrixGenerateSuggestedInput => {
  const record = ensureObject(value, "matrix.generateSuggested input");
  ensureAllowedKeys(record, ["campaignId", "departmentIds"], "matrix.generateSuggested input");

  const departmentIdsValue = record.departmentIds;
  let departmentIds: string[] | undefined;
  if (departmentIdsValue !== undefined) {
    departmentIds = ensureArray(
      departmentIdsValue,
      "matrix.generateSuggested input.departmentIds",
    ).map((item) =>
      ensureStringField({ value: item }, "value", "matrix.generateSuggested input.departmentIds[]"),
    );
  }

  return {
    campaignId: ensureStringField(record, "campaignId", "matrix.generateSuggested input"),
    ...(departmentIds ? { departmentIds } : {}),
  };
};

export const parseMatrixGenerateSuggestedOutput = (
  value: unknown,
): MatrixGenerateSuggestedOutput => {
  const record = ensureObject(value, "matrix.generateSuggested output");
  ensureAllowedKeys(
    record,
    ["campaignId", "generatedAssignments", "totalAssignments"],
    "matrix.generateSuggested output",
  );

  return {
    campaignId: ensureStringField(record, "campaignId", "matrix.generateSuggested output"),
    generatedAssignments: ensureArray(
      record.generatedAssignments,
      "matrix.generateSuggested output.generatedAssignments",
    ).map(parseMatrixGeneratedAssignment),
    totalAssignments: ensureNumberField(
      record,
      "totalAssignments",
      "matrix.generateSuggested output",
    ),
  };
};

export const parseMatrixSetInput = (value: unknown): MatrixSetInput => {
  const record = ensureObject(value, "matrix.set input");
  ensureAllowedKeys(record, ["campaignId", "assignments"], "matrix.set input");

  return {
    campaignId: ensureStringField(record, "campaignId", "matrix.set input"),
    assignments: ensureArray(record.assignments, "matrix.set input.assignments").map(
      parseMatrixGeneratedAssignment,
    ),
  };
};

export const parseMatrixSetOutput = (value: unknown): MatrixSetOutput => {
  const record = ensureObject(value, "matrix.set output");
  ensureAllowedKeys(record, ["campaignId", "totalAssignments"], "matrix.set output");

  return {
    campaignId: ensureStringField(record, "campaignId", "matrix.set output"),
    totalAssignments: ensureNumberField(record, "totalAssignments", "matrix.set output"),
  };
};

export const parseMatrixListInput = (value: unknown): MatrixListInput => {
  const record = ensureObject(value, "matrix.list input");
  ensureAllowedKeys(record, ["campaignId"], "matrix.list input");

  return {
    campaignId: ensureStringField(record, "campaignId", "matrix.list input"),
  };
};

export const parseMatrixListOutput = (value: unknown): MatrixListOutput => {
  const record = ensureObject(value, "matrix.list output");
  ensureAllowedKeys(
    record,
    ["campaignId", "assignments", "totalAssignments"],
    "matrix.list output",
  );

  return {
    campaignId: ensureStringField(record, "campaignId", "matrix.list output"),
    assignments: ensureArray(record.assignments, "matrix.list output.assignments").map(
      parseMatrixListAssignment,
    ),
    totalAssignments: ensureNumberField(record, "totalAssignments", "matrix.list output"),
  };
};

export const parseAiRunForCampaignInput = (value: unknown): AiRunForCampaignInput => {
  const record = ensureObject(value, "ai.runForCampaign input");
  ensureAllowedKeys(record, ["campaignId"], "ai.runForCampaign input");

  return {
    campaignId: ensureStringField(record, "campaignId", "ai.runForCampaign input"),
  };
};

export const parseAiRunForCampaignOutput = (value: unknown): AiRunForCampaignOutput => {
  const record = ensureObject(value, "ai.runForCampaign output");
  ensureAllowedKeys(
    record,
    ["campaignId", "aiJobId", "provider", "status", "completedAt", "wasAlreadyCompleted"],
    "ai.runForCampaign output",
  );

  const provider = ensureStringField(record, "provider", "ai.runForCampaign output");
  if (provider !== "mvp_stub") {
    throw new Error('ai.runForCampaign output.provider must be "mvp_stub".');
  }

  const status = ensureStringField(record, "status", "ai.runForCampaign output");
  if (status !== "completed") {
    throw new Error('ai.runForCampaign output.status must be "completed".');
  }

  return {
    campaignId: ensureStringField(record, "campaignId", "ai.runForCampaign output"),
    aiJobId: ensureStringField(record, "aiJobId", "ai.runForCampaign output"),
    provider: "mvp_stub",
    status: "completed",
    completedAt: ensureStringField(record, "completedAt", "ai.runForCampaign output"),
    wasAlreadyCompleted: ensureBooleanField(
      record,
      "wasAlreadyCompleted",
      "ai.runForCampaign output",
    ),
  };
};

export const parseClientSetActiveCompanyInput = (value: unknown): ClientSetActiveCompanyInput => {
  const record = ensureObject(value, "client.setActiveCompany input");
  ensureAllowedKeys(record, ["companyId"], "client.setActiveCompany input");

  return {
    companyId: ensureStringField(record, "companyId", "client.setActiveCompany input"),
  };
};

export const parseClientSetActiveCompanyOutput = (value: unknown): ClientSetActiveCompanyOutput => {
  const record = ensureObject(value, "client.setActiveCompany output");
  ensureAllowedKeys(record, ["companyId"], "client.setActiveCompany output");

  return {
    companyId: ensureStringField(record, "companyId", "client.setActiveCompany output"),
  };
};

export const parseQuestionnaireListAssignedInput = (
  value: unknown,
): QuestionnaireListAssignedInput => {
  const record = ensureObject(value, "questionnaire.listAssigned input");
  ensureAllowedKeys(record, ["campaignId", "status"], "questionnaire.listAssigned input");

  const campaignId = record.campaignId;
  if (
    campaignId !== undefined &&
    (typeof campaignId !== "string" || campaignId.trim().length === 0)
  ) {
    throw new Error("questionnaire.listAssigned input.campaignId must be a non-empty string.");
  }

  const status = record.status;
  if (status !== undefined) {
    if (typeof status !== "string" || !isQuestionnaireStatus(status)) {
      throw new Error(
        `questionnaire.listAssigned input.status must be one of: ${questionnaireStatuses.join(", ")}`,
      );
    }
  }

  return {
    ...(typeof campaignId === "string" ? { campaignId: campaignId.trim() } : {}),
    ...(status ? { status } : {}),
  };
};

const parseQuestionnaireListAssignedItem = (value: unknown): QuestionnaireListAssignedItem => {
  const record = ensureObject(value, "questionnaire.listAssigned output.items[]");
  ensureAllowedKeys(
    record,
    [
      "questionnaireId",
      "campaignId",
      "companyId",
      "subjectEmployeeId",
      "raterEmployeeId",
      "status",
      "campaignName",
      "campaignStatus",
      "campaignEndAt",
      "subjectDisplayName",
      "subjectPositionTitle",
      "raterRole",
      "firstDraftAt",
      "submittedAt",
    ],
    "questionnaire.listAssigned output.items[]",
  );

  const status = record.status;
  if (typeof status !== "string" || !isQuestionnaireStatus(status)) {
    throw new Error(
      `questionnaire.listAssigned output.items[].status must be one of: ${questionnaireStatuses.join(", ")}`,
    );
  }

  const submittedAt = record.submittedAt;
  if (submittedAt !== undefined && submittedAt !== null && typeof submittedAt !== "string") {
    throw new Error("questionnaire.listAssigned output.items[].submittedAt must be a string.");
  }

  const campaignName = record.campaignName;
  if (campaignName !== undefined && campaignName !== null && typeof campaignName !== "string") {
    throw new Error("questionnaire.listAssigned output.items[].campaignName must be a string.");
  }

  const campaignStatus = record.campaignStatus;
  if (
    campaignStatus !== undefined &&
    campaignStatus !== null &&
    (typeof campaignStatus !== "string" || !isQuestionnaireCampaignStatus(campaignStatus))
  ) {
    throw new Error(
      `questionnaire.listAssigned output.items[].campaignStatus must be one of: ${questionnaireCampaignStatuses.join(", ")}`,
    );
  }

  const campaignEndAt = record.campaignEndAt;
  if (campaignEndAt !== undefined && campaignEndAt !== null && typeof campaignEndAt !== "string") {
    throw new Error("questionnaire.listAssigned output.items[].campaignEndAt must be a string.");
  }

  const subjectDisplayName = record.subjectDisplayName;
  if (
    subjectDisplayName !== undefined &&
    subjectDisplayName !== null &&
    typeof subjectDisplayName !== "string"
  ) {
    throw new Error(
      "questionnaire.listAssigned output.items[].subjectDisplayName must be a string.",
    );
  }

  const subjectPositionTitle = record.subjectPositionTitle;
  if (
    subjectPositionTitle !== undefined &&
    subjectPositionTitle !== null &&
    typeof subjectPositionTitle !== "string"
  ) {
    throw new Error(
      "questionnaire.listAssigned output.items[].subjectPositionTitle must be a string.",
    );
  }

  const raterRole = record.raterRole;
  if (
    raterRole !== undefined &&
    raterRole !== null &&
    (typeof raterRole !== "string" || !questionnaireRaterRoles.includes(raterRole as never))
  ) {
    throw new Error(
      `questionnaire.listAssigned output.items[].raterRole must be one of: ${questionnaireRaterRoles.join(", ")}`,
    );
  }

  const firstDraftAt = record.firstDraftAt;
  if (firstDraftAt !== undefined && firstDraftAt !== null && typeof firstDraftAt !== "string") {
    throw new Error("questionnaire.listAssigned output.items[].firstDraftAt must be a string.");
  }

  return {
    questionnaireId: ensureStringField(
      record,
      "questionnaireId",
      "questionnaire.listAssigned output.items[]",
    ),
    campaignId: ensureStringField(
      record,
      "campaignId",
      "questionnaire.listAssigned output.items[]",
    ),
    companyId: ensureStringField(record, "companyId", "questionnaire.listAssigned output.items[]"),
    subjectEmployeeId: ensureStringField(
      record,
      "subjectEmployeeId",
      "questionnaire.listAssigned output.items[]",
    ),
    raterEmployeeId: ensureStringField(
      record,
      "raterEmployeeId",
      "questionnaire.listAssigned output.items[]",
    ),
    status,
    ...(typeof campaignName === "string" ? { campaignName } : {}),
    ...(typeof campaignStatus === "string" ? { campaignStatus } : {}),
    ...(typeof campaignEndAt === "string" ? { campaignEndAt } : {}),
    ...(typeof subjectDisplayName === "string" ? { subjectDisplayName } : {}),
    ...(typeof subjectPositionTitle === "string" ? { subjectPositionTitle } : {}),
    ...(typeof raterRole === "string" ? { raterRole: raterRole as QuestionnaireRaterRole } : {}),
    ...(typeof firstDraftAt === "string" ? { firstDraftAt } : {}),
    ...(typeof submittedAt === "string" ? { submittedAt } : {}),
  };
};

export const parseQuestionnaireListAssignedOutput = (
  value: unknown,
): QuestionnaireListAssignedOutput => {
  const record = ensureObject(value, "questionnaire.listAssigned output");
  ensureAllowedKeys(record, ["items"], "questionnaire.listAssigned output");

  const items = ensureArray(record.items, "questionnaire.listAssigned output.items").map(
    parseQuestionnaireListAssignedItem,
  );

  return {
    items,
  };
};

export const parseQuestionnaireGetDraftInput = (value: unknown): QuestionnaireGetDraftInput => {
  const record = ensureObject(value, "questionnaire.getDraft input");
  ensureAllowedKeys(record, ["questionnaireId"], "questionnaire.getDraft input");

  return {
    questionnaireId: ensureStringField(record, "questionnaireId", "questionnaire.getDraft input"),
  };
};

const parseQuestionnaireDefinitionIndicator = (
  value: unknown,
): QuestionnaireDefinitionIndicator => {
  const record = ensureObject(value, "questionnaire definition indicator");
  ensureAllowedKeys(record, ["indicatorId", "text", "order"], "questionnaire definition indicator");

  return {
    indicatorId: ensureStringField(record, "indicatorId", "questionnaire definition indicator"),
    text: ensureStringField(record, "text", "questionnaire definition indicator"),
    order: ensureNumberField(record, "order", "questionnaire definition indicator"),
  };
};

const parseQuestionnaireDefinitionLevel = (value: unknown): QuestionnaireDefinitionLevel => {
  const record = ensureObject(value, "questionnaire definition level");
  ensureAllowedKeys(record, ["levelId", "level", "text"], "questionnaire definition level");

  return {
    levelId: ensureStringField(record, "levelId", "questionnaire definition level"),
    level: ensureNumberField(record, "level", "questionnaire definition level"),
    text: ensureStringField(record, "text", "questionnaire definition level"),
  };
};

const parseQuestionnaireDefinitionCompetency = (
  value: unknown,
): QuestionnaireDefinitionCompetency => {
  const record = ensureObject(value, "questionnaire definition competency");
  ensureAllowedKeys(
    record,
    ["competencyId", "name", "order", "indicators", "levels"],
    "questionnaire definition competency",
  );

  const indicators = record.indicators;
  const levels = record.levels;

  return {
    competencyId: ensureStringField(record, "competencyId", "questionnaire definition competency"),
    name: ensureStringField(record, "name", "questionnaire definition competency"),
    order: ensureNumberField(record, "order", "questionnaire definition competency"),
    ...(Array.isArray(indicators)
      ? { indicators: indicators.map(parseQuestionnaireDefinitionIndicator) }
      : {}),
    ...(Array.isArray(levels) ? { levels: levels.map(parseQuestionnaireDefinitionLevel) } : {}),
  };
};

const parseQuestionnaireDefinitionGroup = (value: unknown): QuestionnaireDefinitionGroup => {
  const record = ensureObject(value, "questionnaire definition group");
  ensureAllowedKeys(
    record,
    ["groupId", "name", "weight", "order", "competencies"],
    "questionnaire definition group",
  );

  return {
    groupId: ensureStringField(record, "groupId", "questionnaire definition group"),
    name: ensureStringField(record, "name", "questionnaire definition group"),
    weight: ensureNumberField(record, "weight", "questionnaire definition group"),
    order: ensureNumberField(record, "order", "questionnaire definition group"),
    competencies: ensureArray(
      record.competencies,
      "questionnaire definition group.competencies",
    ).map(parseQuestionnaireDefinitionCompetency),
  };
};

const parseQuestionnaireDefinition = (value: unknown): QuestionnaireDefinition => {
  const record = ensureObject(value, "questionnaire definition");
  ensureAllowedKeys(
    record,
    ["modelVersionId", "modelName", "modelKind", "groups", "totalPrompts"],
    "questionnaire definition",
  );

  const modelName = record.modelName;
  if (modelName !== undefined && modelName !== null && typeof modelName !== "string") {
    throw new Error("questionnaire definition.modelName must be a string.");
  }

  const modelKind = record.modelKind;
  if (modelKind !== "indicators" && modelKind !== "levels") {
    throw new Error('questionnaire definition.modelKind must be "indicators" or "levels".');
  }

  return {
    modelVersionId: ensureStringField(record, "modelVersionId", "questionnaire definition"),
    ...(typeof modelName === "string" ? { modelName } : {}),
    modelKind,
    groups: ensureArray(record.groups, "questionnaire definition.groups").map(
      parseQuestionnaireDefinitionGroup,
    ),
    totalPrompts: ensureNumberField(record, "totalPrompts", "questionnaire definition"),
  };
};

export const parseQuestionnaireGetDraftOutput = (value: unknown): QuestionnaireGetDraftOutput => {
  const record = ensureObject(value, "questionnaire.getDraft output");
  ensureAllowedKeys(
    record,
    [
      "questionnaireId",
      "campaignId",
      "companyId",
      "subjectEmployeeId",
      "raterEmployeeId",
      "status",
      "campaignStatus",
      "draft",
      "campaignName",
      "campaignEndAt",
      "subjectDisplayName",
      "subjectPositionTitle",
      "raterRole",
      "definition",
      "firstDraftAt",
      "submittedAt",
    ],
    "questionnaire.getDraft output",
  );

  const status = record.status;
  if (typeof status !== "string" || !isQuestionnaireStatus(status)) {
    throw new Error(
      `questionnaire.getDraft output.status must be one of: ${questionnaireStatuses.join(", ")}`,
    );
  }

  const campaignStatus = record.campaignStatus;
  if (typeof campaignStatus !== "string" || !isQuestionnaireCampaignStatus(campaignStatus)) {
    throw new Error(
      `questionnaire.getDraft output.campaignStatus must be one of: ${questionnaireCampaignStatuses.join(", ")}`,
    );
  }

  const draft = record.draft;
  if (!isRecord(draft)) {
    throw new Error("questionnaire.getDraft output.draft must be an object.");
  }

  const firstDraftAt = record.firstDraftAt;
  if (firstDraftAt !== undefined && firstDraftAt !== null && typeof firstDraftAt !== "string") {
    throw new Error("questionnaire.getDraft output.firstDraftAt must be a string.");
  }

  const submittedAt = record.submittedAt;
  if (submittedAt !== undefined && submittedAt !== null && typeof submittedAt !== "string") {
    throw new Error("questionnaire.getDraft output.submittedAt must be a string.");
  }

  const campaignName = record.campaignName;
  if (campaignName !== undefined && campaignName !== null && typeof campaignName !== "string") {
    throw new Error("questionnaire.getDraft output.campaignName must be a string.");
  }

  const campaignEndAt = record.campaignEndAt;
  if (campaignEndAt !== undefined && campaignEndAt !== null && typeof campaignEndAt !== "string") {
    throw new Error("questionnaire.getDraft output.campaignEndAt must be a string.");
  }

  const subjectDisplayName = record.subjectDisplayName;
  if (
    subjectDisplayName !== undefined &&
    subjectDisplayName !== null &&
    typeof subjectDisplayName !== "string"
  ) {
    throw new Error("questionnaire.getDraft output.subjectDisplayName must be a string.");
  }

  const subjectPositionTitle = record.subjectPositionTitle;
  if (
    subjectPositionTitle !== undefined &&
    subjectPositionTitle !== null &&
    typeof subjectPositionTitle !== "string"
  ) {
    throw new Error("questionnaire.getDraft output.subjectPositionTitle must be a string.");
  }

  const raterRole = record.raterRole;
  if (
    raterRole !== undefined &&
    raterRole !== null &&
    (typeof raterRole !== "string" || !questionnaireRaterRoles.includes(raterRole as never))
  ) {
    throw new Error(
      `questionnaire.getDraft output.raterRole must be one of: ${questionnaireRaterRoles.join(", ")}`,
    );
  }

  const definitionValue = record.definition;
  const definition =
    definitionValue !== undefined && definitionValue !== null
      ? parseQuestionnaireDefinition(definitionValue)
      : undefined;

  return {
    questionnaireId: ensureStringField(record, "questionnaireId", "questionnaire.getDraft output"),
    campaignId: ensureStringField(record, "campaignId", "questionnaire.getDraft output"),
    companyId: ensureStringField(record, "companyId", "questionnaire.getDraft output"),
    subjectEmployeeId: ensureStringField(
      record,
      "subjectEmployeeId",
      "questionnaire.getDraft output",
    ),
    raterEmployeeId: ensureStringField(record, "raterEmployeeId", "questionnaire.getDraft output"),
    status,
    campaignStatus,
    draft,
    ...(typeof campaignName === "string" ? { campaignName } : {}),
    ...(typeof campaignEndAt === "string" ? { campaignEndAt } : {}),
    ...(typeof subjectDisplayName === "string" ? { subjectDisplayName } : {}),
    ...(typeof subjectPositionTitle === "string" ? { subjectPositionTitle } : {}),
    ...(typeof raterRole === "string" ? { raterRole: raterRole as QuestionnaireRaterRole } : {}),
    ...(definition ? { definition } : {}),
    ...(typeof firstDraftAt === "string" ? { firstDraftAt } : {}),
    ...(typeof submittedAt === "string" ? { submittedAt } : {}),
  };
};

export const parseQuestionnaireSaveDraftInput = (value: unknown): QuestionnaireSaveDraftInput => {
  const record = ensureObject(value, "questionnaire.saveDraft input");
  ensureAllowedKeys(record, ["questionnaireId", "draft"], "questionnaire.saveDraft input");

  const draft = record.draft;
  if (!isRecord(draft)) {
    throw new Error("questionnaire.saveDraft input.draft must be an object.");
  }

  return {
    questionnaireId: ensureStringField(record, "questionnaireId", "questionnaire.saveDraft input"),
    draft,
  };
};

export const parseQuestionnaireSaveDraftOutput = (value: unknown): QuestionnaireSaveDraftOutput => {
  const record = ensureObject(value, "questionnaire.saveDraft output");
  ensureAllowedKeys(
    record,
    ["questionnaireId", "status", "campaignLockedAt"],
    "questionnaire.saveDraft output",
  );

  const status = record.status;
  if (status !== "in_progress") {
    throw new Error('questionnaire.saveDraft output.status must be "in_progress".');
  }

  return {
    questionnaireId: ensureStringField(record, "questionnaireId", "questionnaire.saveDraft output"),
    status: "in_progress",
    campaignLockedAt: ensureStringField(
      record,
      "campaignLockedAt",
      "questionnaire.saveDraft output",
    ),
  };
};

export const parseQuestionnaireSubmitInput = (value: unknown): QuestionnaireSubmitInput => {
  const record = ensureObject(value, "questionnaire.submit input");
  ensureAllowedKeys(record, ["questionnaireId"], "questionnaire.submit input");

  return {
    questionnaireId: ensureStringField(record, "questionnaireId", "questionnaire.submit input"),
  };
};

export const parseQuestionnaireSubmitOutput = (value: unknown): QuestionnaireSubmitOutput => {
  const record = ensureObject(value, "questionnaire.submit output");
  ensureAllowedKeys(
    record,
    ["questionnaireId", "status", "submittedAt", "wasAlreadySubmitted"],
    "questionnaire.submit output",
  );

  const status = record.status;
  if (status !== "submitted") {
    throw new Error('questionnaire.submit output.status must be "submitted".');
  }

  const wasAlreadySubmitted = record.wasAlreadySubmitted;
  if (typeof wasAlreadySubmitted !== "boolean") {
    throw new Error("questionnaire.submit output.wasAlreadySubmitted must be a boolean.");
  }

  return {
    questionnaireId: ensureStringField(record, "questionnaireId", "questionnaire.submit output"),
    status: "submitted",
    submittedAt: ensureStringField(record, "submittedAt", "questionnaire.submit output"),
    wasAlreadySubmitted,
  };
};

export const apiContractReady = true;

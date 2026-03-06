import {
  type AiRunForCampaignOutput,
  type CampaignCreateOutput,
  type CampaignGetOutput,
  type CampaignListOutput,
  type CampaignParticipantsAddFromDepartmentsOutput,
  type CampaignParticipantsMutationOutput,
  type CampaignProgressGetOutput,
  type CampaignSetModelVersionOutput,
  type CampaignSnapshotListOutput,
  type CampaignTransitionOutput,
  type CampaignUpdateDraftOutput,
  type CampaignWeightsSetOutput,
  type CompanyUpdateProfileOutput,
  type DepartmentListOutput,
  type DepartmentUpsertOutput,
  type DispatchOperationInput,
  type EmployeeDirectoryListOutput,
  type EmployeeListActiveOutput,
  type EmployeeProfileGetOutput,
  type EmployeeUpsertOutput,
  type IdentityProvisionAccessOutput,
  type KnownOperation,
  type MatrixGenerateSuggestedOutput,
  type MatrixListOutput,
  type MatrixSetOutput,
  type MembershipListOutput,
  type ModelVersionCloneDraftOutput,
  type ModelVersionCreateOutput,
  type ModelVersionGetOutput,
  type ModelVersionListOutput,
  type ModelVersionPublishOutput,
  type ModelVersionUpsertDraftOutput,
  type NotificationDeliveryDiagnosticsOutput,
  type NotificationReminderPreviewOutput,
  type NotificationReminderSettingsOutput,
  type NotificationTemplateCatalogOutput,
  type NotificationTemplatePreviewOutput,
  type NotificationsDispatchOutboxOutput,
  type NotificationsGenerateRemindersOutput,
  type OperationResult,
  type OpsAiDiagnosticsListOutput,
  type OpsAuditListOutput,
  type OpsHealthGetOutput,
  type OrgDepartmentMoveOutput,
  type OrgManagerSetOutput,
  type QuestionnaireGetDraftOutput,
  type QuestionnaireListAssignedOutput,
  type QuestionnaireSaveDraftOutput,
  type QuestionnaireSubmitOutput,
  type ResultsGetHrViewOutput,
  type ResultsGetMyDashboardOutput,
  type ResultsGetTeamDashboardOutput,
  type SystemPingOutput,
  createOperationError,
  errorFromUnknown,
  errorResult,
  isKnownOperation,
  parseDispatchOperationInput,
} from "@feedback-360/api-contract";

import { runAiRunForCampaign } from "./features/ai";
import {
  runCampaignCreate,
  runCampaignEnd,
  runCampaignGet,
  runCampaignList,
  runCampaignParticipantsAdd,
  runCampaignParticipantsRemove,
  runCampaignProgressGet,
  runCampaignSetModelVersion,
  runCampaignSnapshotList,
  runCampaignStart,
  runCampaignStop,
  runCampaignUpdateDraft,
  runCampaignWeightsSet,
} from "./features/campaigns";
import {
  runCompanyUpdateProfile,
  runIdentityProvisionAccess,
  runMembershipList,
  runSystemPing,
} from "./features/identity-tenancy";
import {
  runCampaignParticipantsAddFromDepartments,
  runMatrixGenerateSuggested,
  runMatrixList,
  runMatrixSet,
} from "./features/matrix";
import {
  runModelVersionCloneDraft,
  runModelVersionCreate,
  runModelVersionGet,
  runModelVersionList,
  runModelVersionPublish,
  runModelVersionUpsertDraft,
} from "./features/models";
import {
  runNotificationDeliveryDiagnostics,
  runNotificationReminderPreview,
  runNotificationReminderSettingsGet,
  runNotificationReminderSettingsUpsert,
  runNotificationTemplateCatalog,
  runNotificationTemplatePreview,
  runNotificationsDispatchOutbox,
  runNotificationsGenerateReminders,
} from "./features/notifications";
import { runOpsAiDiagnosticsList, runOpsAuditList, runOpsHealthGet } from "./features/ops";
import {
  runDepartmentList,
  runDepartmentUpsert,
  runEmployeeDirectoryList,
  runEmployeeListActive,
  runEmployeeProfileGet,
  runEmployeeUpsert,
  runOrgDepartmentMove,
  runOrgManagerSet,
} from "./features/org";
import {
  runQuestionnaireGetDraft,
  runQuestionnaireListAssigned,
  runQuestionnaireSaveDraft,
  runQuestionnaireSubmit,
} from "./features/questionnaires";
import {
  runResultsGetHrView,
  runResultsGetMyDashboard,
  runResultsGetTeamDashboard,
} from "./features/results";

type DispatchOutput =
  | SystemPingOutput
  | CompanyUpdateProfileOutput
  | EmployeeUpsertOutput
  | EmployeeListActiveOutput
  | EmployeeDirectoryListOutput
  | EmployeeProfileGetOutput
  | IdentityProvisionAccessOutput
  | MembershipListOutput
  | DepartmentListOutput
  | DepartmentUpsertOutput
  | ModelVersionListOutput
  | CampaignListOutput
  | CampaignGetOutput
  | CampaignSetModelVersionOutput
  | CampaignWeightsSetOutput
  | CampaignParticipantsMutationOutput
  | CampaignProgressGetOutput
  | NotificationsGenerateRemindersOutput
  | NotificationsDispatchOutboxOutput
  | OpsHealthGetOutput
  | OpsAiDiagnosticsListOutput
  | OpsAuditListOutput
  | NotificationReminderSettingsOutput
  | NotificationReminderPreviewOutput
  | NotificationTemplateCatalogOutput
  | NotificationTemplatePreviewOutput
  | NotificationDeliveryDiagnosticsOutput
  | ResultsGetMyDashboardOutput
  | ResultsGetTeamDashboardOutput
  | ResultsGetHrViewOutput
  | CampaignTransitionOutput
  | OrgDepartmentMoveOutput
  | OrgManagerSetOutput
  | CampaignSnapshotListOutput
  | CampaignParticipantsAddFromDepartmentsOutput
  | MatrixGenerateSuggestedOutput
  | MatrixListOutput
  | MatrixSetOutput
  | AiRunForCampaignOutput
  | ModelVersionCloneDraftOutput
  | ModelVersionCreateOutput
  | ModelVersionGetOutput
  | ModelVersionPublishOutput
  | ModelVersionUpsertDraftOutput
  | CampaignCreateOutput
  | CampaignUpdateDraftOutput
  | QuestionnaireListAssignedOutput
  | QuestionnaireGetDraftOutput
  | QuestionnaireSaveDraftOutput
  | QuestionnaireSubmitOutput;

type OperationHandler = (
  request: DispatchOperationInput,
) => Promise<OperationResult<DispatchOutput>> | OperationResult<DispatchOutput>;

const operationHandlers: Partial<Record<KnownOperation, OperationHandler>> = {
  "system.ping": (request) => runSystemPing(request.input),
  "company.updateProfile": runCompanyUpdateProfile,
  "membership.list": runMembershipList,
  "identity.provisionAccess": runIdentityProvisionAccess,
  "model.version.create": runModelVersionCreate,
  "model.version.list": runModelVersionList,
  "model.version.get": runModelVersionGet,
  "model.version.cloneDraft": runModelVersionCloneDraft,
  "model.version.upsertDraft": runModelVersionUpsertDraft,
  "model.version.publish": runModelVersionPublish,
  "campaign.list": runCampaignList,
  "campaign.get": runCampaignGet,
  "campaign.create": runCampaignCreate,
  "campaign.updateDraft": runCampaignUpdateDraft,
  "campaign.start": runCampaignStart,
  "campaign.stop": runCampaignStop,
  "campaign.end": runCampaignEnd,
  "campaign.setModelVersion": runCampaignSetModelVersion,
  "campaign.weights.set": runCampaignWeightsSet,
  "campaign.participants.add": runCampaignParticipantsAdd,
  "campaign.participants.remove": runCampaignParticipantsRemove,
  "campaign.snapshot.list": runCampaignSnapshotList,
  "campaign.progress.get": runCampaignProgressGet,
  "campaign.participants.addFromDepartments": runCampaignParticipantsAddFromDepartments,
  "employee.upsert": runEmployeeUpsert,
  "employee.listActive": runEmployeeListActive,
  "employee.directoryList": runEmployeeDirectoryList,
  "employee.profileGet": runEmployeeProfileGet,
  "department.list": runDepartmentList,
  "department.upsert": runDepartmentUpsert,
  "org.department.move": runOrgDepartmentMove,
  "org.manager.set": runOrgManagerSet,
  "questionnaire.listAssigned": runQuestionnaireListAssigned,
  "questionnaire.getDraft": runQuestionnaireGetDraft,
  "questionnaire.saveDraft": runQuestionnaireSaveDraft,
  "questionnaire.submit": runQuestionnaireSubmit,
  "results.getHrView": runResultsGetHrView,
  "results.getMyDashboard": runResultsGetMyDashboard,
  "results.getTeamDashboard": runResultsGetTeamDashboard,
  "notifications.generateReminders": runNotificationsGenerateReminders,
  "notifications.dispatchOutbox": runNotificationsDispatchOutbox,
  "notifications.settings.get": runNotificationReminderSettingsGet,
  "notifications.settings.upsert": runNotificationReminderSettingsUpsert,
  "notifications.settings.preview": runNotificationReminderPreview,
  "notifications.templates.list": runNotificationTemplateCatalog,
  "notifications.templates.preview": runNotificationTemplatePreview,
  "notifications.deliveries.list": runNotificationDeliveryDiagnostics,
  "matrix.generateSuggested": runMatrixGenerateSuggested,
  "matrix.list": runMatrixList,
  "matrix.set": runMatrixSet,
  "ai.runForCampaign": runAiRunForCampaign,
  "ops.health.get": runOpsHealthGet,
  "ops.aiDiagnostics.list": runOpsAiDiagnosticsList,
  "ops.audit.list": runOpsAuditList,
};

const clientLocalOperationErrors: Record<"client.setActiveCompany" | "seed.run", string> = {
  "client.setActiveCompany":
    "Operation client.setActiveCompany is client-local and unavailable in core dispatcher.",
  "seed.run": "Operation seed.run is not available in core dispatcher.",
};

export const dispatchOperation = (
  request: DispatchOperationInput,
): Promise<OperationResult<DispatchOutput>> => {
  let parsedRequest: DispatchOperationInput;
  try {
    parsedRequest = parseDispatchOperationInput(request);
  } catch (error) {
    return Promise.resolve(
      errorResult(errorFromUnknown(error, "invalid_input", "Invalid dispatch input.")),
    );
  }

  if (!isKnownOperation(parsedRequest.operation)) {
    return Promise.resolve(
      errorResult(
        createOperationError("not_found", `Unknown operation: ${parsedRequest.operation}`, {
          operation: parsedRequest.operation,
        }),
      ),
    );
  }

  if (
    parsedRequest.operation === "client.setActiveCompany" ||
    parsedRequest.operation === "seed.run"
  ) {
    return Promise.resolve(
      errorResult(
        createOperationError("not_found", clientLocalOperationErrors[parsedRequest.operation]),
      ),
    );
  }

  const handler = operationHandlers[parsedRequest.operation];
  if (!handler) {
    return Promise.resolve(
      errorResult(
        createOperationError("not_found", `Unknown operation: ${parsedRequest.operation}`),
      ),
    );
  }

  return Promise.resolve(handler(parsedRequest));
};

export const coreReady = true;

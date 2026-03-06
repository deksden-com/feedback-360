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
  type MatrixSetOutput,
  type MembershipListOutput,
  type ModelVersionCreateOutput,
  type ModelVersionListOutput,
  type NotificationsDispatchOutboxOutput,
  type NotificationsGenerateRemindersOutput,
  type OperationResult,
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
  runMatrixSet,
} from "./features/matrix";
import { runModelVersionCreate, runModelVersionList } from "./features/models";
import {
  runNotificationsDispatchOutbox,
  runNotificationsGenerateReminders,
} from "./features/notifications";
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
  | ResultsGetMyDashboardOutput
  | ResultsGetTeamDashboardOutput
  | ResultsGetHrViewOutput
  | CampaignTransitionOutput
  | OrgDepartmentMoveOutput
  | OrgManagerSetOutput
  | CampaignSnapshotListOutput
  | CampaignParticipantsAddFromDepartmentsOutput
  | MatrixGenerateSuggestedOutput
  | MatrixSetOutput
  | AiRunForCampaignOutput
  | ModelVersionCreateOutput
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
  "matrix.generateSuggested": runMatrixGenerateSuggested,
  "matrix.set": runMatrixSet,
  "ai.runForCampaign": runAiRunForCampaign,
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

import {
  type AiRunForCampaignInput,
  type AiRunForCampaignOutput,
  type CampaignCreateInput,
  type CampaignCreateOutput,
  type CampaignGetInput,
  type CampaignGetOutput,
  type CampaignListInput,
  type CampaignListOutput,
  type CampaignParticipantsAddFromDepartmentsInput,
  type CampaignParticipantsAddFromDepartmentsOutput,
  type CampaignParticipantsMutationInput,
  type CampaignParticipantsMutationOutput,
  type CampaignProgressGetInput,
  type CampaignProgressGetOutput,
  type CampaignSetModelVersionInput,
  type CampaignSetModelVersionOutput,
  type CampaignSnapshotListInput,
  type CampaignSnapshotListOutput,
  type CampaignTransitionInput,
  type CampaignTransitionOutput,
  type CampaignUpdateDraftInput,
  type CampaignUpdateDraftOutput,
  type CampaignWeightsSetInput,
  type CampaignWeightsSetOutput,
  type CompanyUpdateProfileInput,
  type CompanyUpdateProfileOutput,
  type DispatchOperationInput,
  type EmployeeListActiveInput,
  type EmployeeListActiveOutput,
  type EmployeeUpsertInput,
  type EmployeeUpsertOutput,
  type MatrixGenerateSuggestedInput,
  type MatrixGenerateSuggestedOutput,
  type MatrixSetInput,
  type MatrixSetOutput,
  type MembershipListInput,
  type MembershipListOutput,
  type ModelVersionCreateInput,
  type ModelVersionCreateOutput,
  type ModelVersionListInput,
  type ModelVersionListOutput,
  type NotificationsDispatchOutboxInput,
  type NotificationsDispatchOutboxOutput,
  type NotificationsGenerateRemindersInput,
  type NotificationsGenerateRemindersOutput,
  type OperationResult,
  type OrgDepartmentMoveInput,
  type OrgDepartmentMoveOutput,
  type OrgManagerSetInput,
  type OrgManagerSetOutput,
  type QuestionnaireGetDraftInput,
  type QuestionnaireGetDraftOutput,
  type QuestionnaireListAssignedInput,
  type QuestionnaireListAssignedOutput,
  type QuestionnaireSaveDraftInput,
  type QuestionnaireSaveDraftOutput,
  type QuestionnaireSubmitInput,
  type QuestionnaireSubmitOutput,
  type ResultsGetHrViewInput,
  type ResultsGetHrViewOutput,
  type ResultsGetMyDashboardInput,
  type ResultsGetMyDashboardOutput,
  type ResultsGetTeamDashboardInput,
  type ResultsGetTeamDashboardOutput,
  type ResultsOpenTextItem,
  type SystemPingOutput,
  createOperationError,
  errorFromUnknown,
  errorResult,
  isKnownOperation,
  okResult,
  parseAiRunForCampaignInput,
  parseAiRunForCampaignOutput,
  parseCampaignCreateInput,
  parseCampaignCreateOutput,
  parseCampaignGetInput,
  parseCampaignGetOutput,
  parseCampaignListInput,
  parseCampaignListOutput,
  parseCampaignParticipantsAddFromDepartmentsInput,
  parseCampaignParticipantsAddFromDepartmentsOutput,
  parseCampaignParticipantsMutationInput,
  parseCampaignParticipantsMutationOutput,
  parseCampaignProgressGetInput,
  parseCampaignProgressGetOutput,
  parseCampaignSetModelVersionInput,
  parseCampaignSetModelVersionOutput,
  parseCampaignSnapshotListInput,
  parseCampaignSnapshotListOutput,
  parseCampaignTransitionInput,
  parseCampaignTransitionOutput,
  parseCampaignUpdateDraftInput,
  parseCampaignUpdateDraftOutput,
  parseCampaignWeightsSetInput,
  parseCampaignWeightsSetOutput,
  parseCompanyUpdateProfileInput,
  parseCompanyUpdateProfileOutput,
  parseDispatchOperationInput,
  parseEmployeeListActiveInput,
  parseEmployeeListActiveOutput,
  parseEmployeeUpsertInput,
  parseEmployeeUpsertOutput,
  parseMatrixGenerateSuggestedInput,
  parseMatrixGenerateSuggestedOutput,
  parseMatrixSetInput,
  parseMatrixSetOutput,
  parseMembershipListInput,
  parseMembershipListOutput,
  parseModelVersionCreateInput,
  parseModelVersionCreateOutput,
  parseModelVersionListInput,
  parseModelVersionListOutput,
  parseNotificationsDispatchOutboxInput,
  parseNotificationsDispatchOutboxOutput,
  parseNotificationsGenerateRemindersInput,
  parseNotificationsGenerateRemindersOutput,
  parseOrgDepartmentMoveInput,
  parseOrgDepartmentMoveOutput,
  parseOrgManagerSetInput,
  parseOrgManagerSetOutput,
  parseQuestionnaireGetDraftInput,
  parseQuestionnaireGetDraftOutput,
  parseQuestionnaireListAssignedInput,
  parseQuestionnaireListAssignedOutput,
  parseQuestionnaireSaveDraftInput,
  parseQuestionnaireSaveDraftOutput,
  parseQuestionnaireSubmitInput,
  parseQuestionnaireSubmitOutput,
  parseResultsGetHrViewInput,
  parseResultsGetHrViewOutput,
  parseResultsGetMyDashboardInput,
  parseResultsGetMyDashboardOutput,
  parseResultsGetTeamDashboardInput,
  parseResultsGetTeamDashboardOutput,
  parseSystemPingInput,
  parseSystemPingOutput,
} from "@feedback-360/api-contract";
import {
  addCampaignParticipants,
  addCampaignParticipantsFromDepartments,
  createCampaign,
  createModelVersion,
  dispatchNotificationOutbox,
  endCampaign,
  generateReminderOutbox,
  generateSuggestedMatrix,
  getCampaign,
  getCampaignProgress,
  getEmployeeIdByUserInCompany,
  getQuestionnaireDraft,
  getResultsHrView,
  isCampaignSubjectManagedByEmployee,
  listActiveEmployees,
  listAssignedQuestionnaires,
  listCampaignEmployeeSnapshots,
  listCampaigns,
  listMemberships,
  listModelVersions,
  moveEmployeeDepartment,
  removeCampaignParticipants,
  runAiForCampaign,
  saveQuestionnaireDraft,
  setCampaignModelVersion,
  setCampaignWeights,
  setEmployeeManager,
  setMatrixAssignments,
  startCampaign,
  stopCampaign,
  submitQuestionnaire,
  updateCampaignDraft,
  upsertEmployee,
} from "@feedback-360/db";

const runSystemPing = (input: unknown): OperationResult<SystemPingOutput> => {
  try {
    parseSystemPingInput(input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid system.ping input."));
  }

  try {
    return okResult(
      parseSystemPingOutput({
        pong: "ok",
        timestamp: new Date().toISOString(),
      }),
    );
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid system.ping output payload."),
    );
  }
};

const ensureContextCompany = (request: DispatchOperationInput): string | OperationResult<never> => {
  const companyId = request.context?.companyId;
  if (!companyId) {
    return errorResult(
      createOperationError("forbidden", "Active company is required for this operation."),
    );
  }

  return companyId;
};

const hasRole = (request: DispatchOperationInput, allowedRoles: readonly string[]): boolean => {
  const role = request.context?.role;
  return Boolean(role && allowedRoles.includes(role));
};

const resolveRaterEmployeeId = async (
  request: DispatchOperationInput,
  companyId: string,
  operation: string,
): Promise<string | undefined | OperationResult<never>> => {
  const role = request.context?.role;
  if (role !== "manager" && role !== "employee") {
    return undefined;
  }

  const userId = request.context?.userId;
  if (!userId) {
    return errorResult(
      createOperationError(
        "unauthenticated",
        "User context is required for questionnaire access.",
        {
          operation,
        },
      ),
    );
  }

  const employeeId = await getEmployeeIdByUserInCompany({
    companyId,
    userId,
  });

  if (!employeeId) {
    return errorResult(
      createOperationError("forbidden", "No employee profile linked to current user.", {
        operation,
        companyId,
        userId,
      }),
    );
  }

  return employeeId;
};

const runCompanyUpdateProfile = (
  request: DispatchOperationInput,
): OperationResult<CompanyUpdateProfileOutput> => {
  if (request.context?.role !== "hr_admin") {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can update company profile.", {
        operation: "company.updateProfile",
      }),
    );
  }

  let parsedInput: CompanyUpdateProfileInput;
  try {
    parsedInput = parseCompanyUpdateProfileInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid company.updateProfile input."),
    );
  }

  try {
    return okResult(
      parseCompanyUpdateProfileOutput({
        companyId: parsedInput.companyId,
        name: parsedInput.name,
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid company.updateProfile output payload."),
    );
  }
};

const runModelVersionCreate = async (
  request: DispatchOperationInput,
): Promise<OperationResult<ModelVersionCreateOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can create competency model versions.", {
        operation: "model.version.create",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: ModelVersionCreateInput;
  try {
    parsedInput = parseModelVersionCreateInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid model.version.create input."),
    );
  }

  try {
    const output = await createModelVersion({
      companyId: companyIdOrError,
      ...parsedInput,
    });
    return okResult(parseModelVersionCreateOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to create model version."));
  }
};

const runModelVersionList = async (
  request: DispatchOperationInput,
): Promise<OperationResult<ModelVersionListOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot list model versions.", {
        operation: "model.version.list",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: ModelVersionListInput;
  try {
    parsedInput = parseModelVersionListInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid model.version.list input."),
    );
  }

  try {
    const output = await listModelVersions({
      companyId: companyIdOrError,
      ...parsedInput,
    });
    return okResult(parseModelVersionListOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to list model versions."));
  }
};

const runCampaignList = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignListOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot list campaigns.", {
        operation: "campaign.list",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignListInput;
  try {
    parsedInput = parseCampaignListInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid campaign.list input."));
  }

  try {
    const output = await listCampaigns({
      companyId: companyIdOrError,
      status: parsedInput.status,
    });
    return okResult(parseCampaignListOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to list campaigns."));
  }
};

const runCampaignGet = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignGetOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot read campaign details.", {
        operation: "campaign.get",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignGetInput;
  try {
    parsedInput = parseCampaignGetInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid campaign.get input."));
  }

  try {
    const output = await getCampaign({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
    });
    return okResult(parseCampaignGetOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to load campaign."));
  }
};

const runCampaignCreate = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignCreateOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can create campaigns.", {
        operation: "campaign.create",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignCreateInput;
  try {
    parsedInput = parseCampaignCreateInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid campaign.create input."));
  }

  try {
    const output = await createCampaign({
      companyId: companyIdOrError,
      ...parsedInput,
    });
    return okResult(parseCampaignCreateOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to create campaign."));
  }
};

const runCampaignUpdateDraft = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignUpdateDraftOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can update campaign drafts.", {
        operation: "campaign.updateDraft",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignUpdateDraftInput;
  try {
    parsedInput = parseCampaignUpdateDraftInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid campaign.updateDraft input."),
    );
  }

  try {
    const output = await updateCampaignDraft({
      companyId: companyIdOrError,
      ...parsedInput,
    });
    return okResult(parseCampaignUpdateDraftOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to update campaign draft."),
    );
  }
};

const runCampaignStart = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignTransitionOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can start campaigns.", {
        operation: "campaign.start",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignTransitionInput;
  try {
    parsedInput = parseCampaignTransitionInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid campaign.start input."));
  }

  try {
    const output = await startCampaign({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
    });
    return okResult(parseCampaignTransitionOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to start campaign."));
  }
};

const runCampaignStop = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignTransitionOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can stop campaigns.", {
        operation: "campaign.stop",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignTransitionInput;
  try {
    parsedInput = parseCampaignTransitionInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid campaign.stop input."));
  }

  try {
    const output = await stopCampaign({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
    });
    return okResult(parseCampaignTransitionOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to stop campaign."));
  }
};

const runCampaignEnd = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignTransitionOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can end campaigns.", {
        operation: "campaign.end",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignTransitionInput;
  try {
    parsedInput = parseCampaignTransitionInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid campaign.end input."));
  }

  try {
    const output = await endCampaign({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
    });
    return okResult(parseCampaignTransitionOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to end campaign."));
  }
};

const runCampaignSetModelVersion = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignSetModelVersionOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can change campaign model version.", {
        operation: "campaign.setModelVersion",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignSetModelVersionInput;
  try {
    parsedInput = parseCampaignSetModelVersionInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid campaign.setModelVersion input."),
    );
  }

  try {
    const output = await setCampaignModelVersion({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      modelVersionId: parsedInput.modelVersionId,
    });
    return okResult(parseCampaignSetModelVersionOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to set campaign model version."),
    );
  }
};

const runCampaignWeightsSet = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignWeightsSetOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can set campaign weights.", {
        operation: "campaign.weights.set",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignWeightsSetInput;
  try {
    parsedInput = parseCampaignWeightsSetInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid campaign.weights.set input."),
    );
  }

  try {
    const output = await setCampaignWeights({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      manager: parsedInput.manager,
      peers: parsedInput.peers,
      subordinates: parsedInput.subordinates,
    });
    return okResult(parseCampaignWeightsSetOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to set campaign weights."));
  }
};

const runCampaignParticipantsAdd = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignParticipantsMutationOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can add campaign participants.", {
        operation: "campaign.participants.add",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignParticipantsMutationInput;
  try {
    parsedInput = parseCampaignParticipantsMutationInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid campaign.participants.add input."),
    );
  }

  try {
    const output = await addCampaignParticipants({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      employeeIds: parsedInput.employeeIds,
    });
    return okResult(parseCampaignParticipantsMutationOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to add campaign participants."),
    );
  }
};

const runCampaignParticipantsRemove = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignParticipantsMutationOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can remove campaign participants.", {
        operation: "campaign.participants.remove",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignParticipantsMutationInput;
  try {
    parsedInput = parseCampaignParticipantsMutationInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid campaign.participants.remove input."),
    );
  }

  try {
    const output = await removeCampaignParticipants({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      employeeIds: parsedInput.employeeIds,
    });
    return okResult(parseCampaignParticipantsMutationOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to remove campaign participants."),
    );
  }
};

const runEmployeeUpsert = async (
  request: DispatchOperationInput,
): Promise<OperationResult<EmployeeUpsertOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can upsert employees.", {
        operation: "employee.upsert",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: EmployeeUpsertInput;
  try {
    parsedInput = parseEmployeeUpsertInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid employee.upsert input."));
  }

  try {
    const output = await upsertEmployee({
      companyId: companyIdOrError,
      employeeId: parsedInput.employeeId,
      email: parsedInput.email,
      firstName: parsedInput.firstName,
      lastName: parsedInput.lastName,
      phone: parsedInput.phone,
      isActive: parsedInput.isActive,
    });
    return okResult(parseEmployeeUpsertOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to upsert employee."));
  }
};

const runEmployeeListActive = async (
  request: DispatchOperationInput,
): Promise<OperationResult<EmployeeListActiveOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot list active employees.", {
        operation: "employee.listActive",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: EmployeeListActiveInput;
  try {
    parsedInput = parseEmployeeListActiveInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid employee.listActive input."),
    );
  }

  try {
    const output = await listActiveEmployees({
      companyId: parsedInput.companyId ?? companyIdOrError,
    });
    return okResult(parseEmployeeListActiveOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to list active employees."),
    );
  }
};

const runMembershipList = async (
  request: DispatchOperationInput,
): Promise<OperationResult<MembershipListOutput>> => {
  const userId = request.context?.userId;
  if (!userId) {
    return errorResult(
      createOperationError("unauthenticated", "User context is required for membership list.", {
        operation: "membership.list",
      }),
    );
  }

  let parsedInput: MembershipListInput;
  try {
    parsedInput = parseMembershipListInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid membership.list input."));
  }

  try {
    const output = await listMemberships({
      userId,
      ...parsedInput,
    });
    return okResult(parseMembershipListOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to list memberships."));
  }
};

const runOrgDepartmentMove = async (
  request: DispatchOperationInput,
): Promise<OperationResult<OrgDepartmentMoveOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can move employees between departments.", {
        operation: "org.department.move",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: OrgDepartmentMoveInput;
  try {
    parsedInput = parseOrgDepartmentMoveInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid org.department.move input."),
    );
  }

  try {
    const output = await moveEmployeeDepartment({
      companyId: companyIdOrError,
      employeeId: parsedInput.employeeId,
      toDepartmentId: parsedInput.toDepartmentId,
    });
    return okResult(parseOrgDepartmentMoveOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to move employee department."),
    );
  }
};

const runOrgManagerSet = async (
  request: DispatchOperationInput,
): Promise<OperationResult<OrgManagerSetOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can set employee manager.", {
        operation: "org.manager.set",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: OrgManagerSetInput;
  try {
    parsedInput = parseOrgManagerSetInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid org.manager.set input."));
  }

  try {
    const output = await setEmployeeManager({
      companyId: companyIdOrError,
      employeeId: parsedInput.employeeId,
      managerEmployeeId: parsedInput.managerEmployeeId,
    });
    return okResult(parseOrgManagerSetOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to set employee manager."));
  }
};

const runCampaignSnapshotList = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignSnapshotListOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot list campaign snapshots.", {
        operation: "campaign.snapshot.list",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignSnapshotListInput;
  try {
    parsedInput = parseCampaignSnapshotListInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid campaign.snapshot.list input."),
    );
  }

  try {
    const output = await listCampaignEmployeeSnapshots({
      campaignId: parsedInput.campaignId,
      companyId: companyIdOrError,
    });
    return okResult(parseCampaignSnapshotListOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to list campaign snapshots."),
    );
  }
};

const runCampaignProgressGet = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignProgressGetOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot view campaign progress.", {
        operation: "campaign.progress.get",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignProgressGetInput;
  try {
    parsedInput = parseCampaignProgressGetInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid campaign.progress.get input."),
    );
  }

  try {
    const output = await getCampaignProgress({
      campaignId: parsedInput.campaignId,
      companyId: companyIdOrError,
    });
    return okResult(parseCampaignProgressGetOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to load campaign progress."),
    );
  }
};

const runNotificationsGenerateReminders = async (
  request: DispatchOperationInput,
): Promise<OperationResult<NotificationsGenerateRemindersOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can generate reminders.", {
        operation: "notifications.generateReminders",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: NotificationsGenerateRemindersInput;
  try {
    parsedInput = parseNotificationsGenerateRemindersInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid notifications.generateReminders input."),
    );
  }

  try {
    const output = await generateReminderOutbox({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      ...(parsedInput.now ? { now: new Date(parsedInput.now) } : {}),
    });
    return okResult(parseNotificationsGenerateRemindersOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to generate reminder outbox."),
    );
  }
};

const runNotificationsDispatchOutbox = async (
  request: DispatchOperationInput,
): Promise<OperationResult<NotificationsDispatchOutboxOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can dispatch notifications.", {
        operation: "notifications.dispatchOutbox",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: NotificationsDispatchOutboxInput;
  try {
    parsedInput = parseNotificationsDispatchOutboxInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid notifications.dispatchOutbox input."),
    );
  }

  try {
    const output = await dispatchNotificationOutbox({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      limit: parsedInput.limit,
      provider: parsedInput.provider,
    });
    return okResult(parseNotificationsDispatchOutboxOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to dispatch notification outbox."),
    );
  }
};

const runResultsGetHrView = async (
  request: DispatchOperationInput,
): Promise<OperationResult<ResultsGetHrViewOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot view HR results.", {
        operation: "results.getHrView",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: ResultsGetHrViewInput;
  try {
    parsedInput = parseResultsGetHrViewInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid results.getHrView input."),
    );
  }

  try {
    const output = await getResultsHrView({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      subjectEmployeeId: parsedInput.subjectEmployeeId,
      smallGroupPolicy: parsedInput.smallGroupPolicy,
      anonymityThreshold: parsedInput.anonymityThreshold,
    });
    const role = request.context?.role;
    const hrViewOutput =
      role === "hr_reader"
        ? {
            ...output,
            openText: output.openText?.map((item): ResultsOpenTextItem => {
              return {
                competencyId: item.competencyId,
                group: item.group,
                count: item.count,
                ...(typeof item.processedText === "string"
                  ? { processedText: item.processedText }
                  : {}),
                ...(typeof item.summaryText === "string" ? { summaryText: item.summaryText } : {}),
              };
            }),
          }
        : output;
    return okResult(parseResultsGetHrViewOutput(hrViewOutput));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to get HR results."));
  }
};

const buildDashboardFromHrResult = (
  hrResult: ResultsGetHrViewOutput,
): ResultsGetMyDashboardOutput => {
  const openText = (hrResult.openText ?? []).filter((item) => {
    if (item.group === "manager") {
      return true;
    }
    if (item.group === "peers") {
      return hrResult.groupVisibility.peers === "shown";
    }
    if (item.group === "subordinates") {
      return hrResult.groupVisibility.subordinates === "shown";
    }
    if (item.group === "self") {
      return true;
    }
    if (item.group === "other") {
      return hrResult.groupVisibility.other === "shown";
    }
    return false;
  });

  return {
    campaignId: hrResult.campaignId,
    companyId: hrResult.companyId,
    subjectEmployeeId: hrResult.subjectEmployeeId,
    modelVersionId: hrResult.modelVersionId,
    modelKind: hrResult.modelKind,
    anonymityThreshold: hrResult.anonymityThreshold,
    smallGroupPolicy: hrResult.smallGroupPolicy,
    groupVisibility: hrResult.groupVisibility,
    competencyScores: hrResult.competencyScores,
    groupOverall: hrResult.groupOverall,
    effectiveGroupWeights: hrResult.effectiveGroupWeights,
    ...(typeof hrResult.overallScore === "number" ? { overallScore: hrResult.overallScore } : {}),
    openText: openText.map((item) => ({
      competencyId: item.competencyId,
      group: item.group,
      count: item.count,
      ...(item.processedText ? { processedText: item.processedText } : {}),
      ...(item.summaryText ? { summaryText: item.summaryText } : {}),
    })),
  };
};

const runResultsGetMyDashboard = async (
  request: DispatchOperationInput,
): Promise<OperationResult<ResultsGetMyDashboardOutput>> => {
  if (!hasRole(request, ["employee", "manager", "hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot view own dashboard.", {
        operation: "results.getMyDashboard",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  const userId = request.context?.userId;
  if (!userId) {
    return errorResult(
      createOperationError("unauthenticated", "User context is required for own dashboard.", {
        operation: "results.getMyDashboard",
      }),
    );
  }

  let parsedInput: ResultsGetMyDashboardInput;
  try {
    parsedInput = parseResultsGetMyDashboardInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid results.getMyDashboard input."),
    );
  }

  try {
    const employeeId = await getEmployeeIdByUserInCompany({
      companyId: companyIdOrError,
      userId,
    });
    if (!employeeId) {
      return errorResult(
        createOperationError("forbidden", "No employee profile linked to current user.", {
          operation: "results.getMyDashboard",
          companyId: companyIdOrError,
          userId,
        }),
      );
    }

    const hrOutput = await getResultsHrView({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      subjectEmployeeId: employeeId,
      smallGroupPolicy: parsedInput.smallGroupPolicy,
      anonymityThreshold: parsedInput.anonymityThreshold,
    });
    return okResult(parseResultsGetMyDashboardOutput(buildDashboardFromHrResult(hrOutput)));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to get own dashboard."));
  }
};

const runResultsGetTeamDashboard = async (
  request: DispatchOperationInput,
): Promise<OperationResult<ResultsGetTeamDashboardOutput>> => {
  if (!hasRole(request, ["manager"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot view team dashboard.", {
        operation: "results.getTeamDashboard",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  const userId = request.context?.userId;
  if (!userId) {
    return errorResult(
      createOperationError("unauthenticated", "User context is required for team dashboard.", {
        operation: "results.getTeamDashboard",
      }),
    );
  }

  let parsedInput: ResultsGetTeamDashboardInput;
  try {
    parsedInput = parseResultsGetTeamDashboardInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid results.getTeamDashboard input."),
    );
  }

  try {
    const managerEmployeeId = await getEmployeeIdByUserInCompany({
      companyId: companyIdOrError,
      userId,
    });
    if (!managerEmployeeId) {
      return errorResult(
        createOperationError("forbidden", "No employee profile linked to current user.", {
          operation: "results.getTeamDashboard",
          companyId: companyIdOrError,
          userId,
        }),
      );
    }

    const canViewSubject = await isCampaignSubjectManagedByEmployee({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      subjectEmployeeId: parsedInput.subjectEmployeeId,
      managerEmployeeId,
    });

    if (!canViewSubject) {
      return errorResult(
        createOperationError("forbidden", "Current manager cannot view this subject.", {
          operation: "results.getTeamDashboard",
          subjectEmployeeId: parsedInput.subjectEmployeeId,
        }),
      );
    }

    const hrOutput = await getResultsHrView({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      subjectEmployeeId: parsedInput.subjectEmployeeId,
      smallGroupPolicy: parsedInput.smallGroupPolicy,
      anonymityThreshold: parsedInput.anonymityThreshold,
    });
    return okResult(parseResultsGetTeamDashboardOutput(buildDashboardFromHrResult(hrOutput)));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to get team dashboard."));
  }
};

const runCampaignParticipantsAddFromDepartments = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignParticipantsAddFromDepartmentsOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can add campaign participants.", {
        operation: "campaign.participants.addFromDepartments",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignParticipantsAddFromDepartmentsInput;
  try {
    parsedInput = parseCampaignParticipantsAddFromDepartmentsInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(
        error,
        "invalid_input",
        "Invalid campaign.participants.addFromDepartments input.",
      ),
    );
  }

  try {
    const output = await addCampaignParticipantsFromDepartments({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      departmentIds: parsedInput.departmentIds,
      includeSelf: parsedInput.includeSelf,
    });
    return okResult(parseCampaignParticipantsAddFromDepartmentsOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to add participants from departments."),
    );
  }
};

const runMatrixGenerateSuggested = async (
  request: DispatchOperationInput,
): Promise<OperationResult<MatrixGenerateSuggestedOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can generate matrix suggestions.", {
        operation: "matrix.generateSuggested",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: MatrixGenerateSuggestedInput;
  try {
    parsedInput = parseMatrixGenerateSuggestedInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid matrix.generateSuggested input."),
    );
  }

  try {
    const output = await generateSuggestedMatrix({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      departmentIds: parsedInput.departmentIds,
    });
    return okResult(parseMatrixGenerateSuggestedOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to generate matrix suggestions."),
    );
  }
};

const runMatrixSet = async (
  request: DispatchOperationInput,
): Promise<OperationResult<MatrixSetOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can set matrix assignments.", {
        operation: "matrix.set",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: MatrixSetInput;
  try {
    parsedInput = parseMatrixSetInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid matrix.set input."));
  }

  try {
    const output = await setMatrixAssignments({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      assignments: parsedInput.assignments,
    });
    return okResult(parseMatrixSetOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to set matrix."));
  }
};

const runQuestionnaireListAssigned = async (
  request: DispatchOperationInput,
): Promise<OperationResult<QuestionnaireListAssignedOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader", "manager", "employee"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot list questionnaires.", {
        operation: "questionnaire.listAssigned",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: QuestionnaireListAssignedInput;
  try {
    parsedInput = parseQuestionnaireListAssignedInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid questionnaire.listAssigned input."),
    );
  }

  try {
    const raterEmployeeIdOrError = await resolveRaterEmployeeId(
      request,
      companyIdOrError,
      "questionnaire.listAssigned",
    );
    if (typeof raterEmployeeIdOrError !== "string" && raterEmployeeIdOrError !== undefined) {
      return raterEmployeeIdOrError;
    }

    const output = await listAssignedQuestionnaires({
      campaignId: parsedInput.campaignId,
      status: parsedInput.status,
      companyId: companyIdOrError,
      ...(raterEmployeeIdOrError ? { raterEmployeeId: raterEmployeeIdOrError } : {}),
    });
    return okResult(parseQuestionnaireListAssignedOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to list assigned questionnaires."),
    );
  }
};

const runQuestionnaireGetDraft = async (
  request: DispatchOperationInput,
): Promise<OperationResult<QuestionnaireGetDraftOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader", "manager", "employee"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot read questionnaire draft.", {
        operation: "questionnaire.getDraft",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: QuestionnaireGetDraftInput;
  try {
    parsedInput = parseQuestionnaireGetDraftInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid questionnaire.getDraft input."),
    );
  }

  try {
    const raterEmployeeIdOrError = await resolveRaterEmployeeId(
      request,
      companyIdOrError,
      "questionnaire.getDraft",
    );
    if (typeof raterEmployeeIdOrError !== "string" && raterEmployeeIdOrError !== undefined) {
      return raterEmployeeIdOrError;
    }

    const output = await getQuestionnaireDraft({
      questionnaireId: parsedInput.questionnaireId,
      companyId: companyIdOrError,
      ...(raterEmployeeIdOrError ? { raterEmployeeId: raterEmployeeIdOrError } : {}),
    });
    return okResult(parseQuestionnaireGetDraftOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to get questionnaire draft."),
    );
  }
};

const runQuestionnaireSaveDraft = async (
  request: DispatchOperationInput,
): Promise<OperationResult<QuestionnaireSaveDraftOutput>> => {
  if (!hasRole(request, ["hr_admin", "manager", "employee"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot save questionnaire draft.", {
        operation: "questionnaire.saveDraft",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: QuestionnaireSaveDraftInput;
  try {
    parsedInput = parseQuestionnaireSaveDraftInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid questionnaire.saveDraft input."),
    );
  }

  try {
    const raterEmployeeIdOrError = await resolveRaterEmployeeId(
      request,
      companyIdOrError,
      "questionnaire.saveDraft",
    );
    if (typeof raterEmployeeIdOrError !== "string" && raterEmployeeIdOrError !== undefined) {
      return raterEmployeeIdOrError;
    }

    const output = await saveQuestionnaireDraft({
      questionnaireId: parsedInput.questionnaireId,
      draft: parsedInput.draft,
      companyId: companyIdOrError,
      ...(raterEmployeeIdOrError ? { raterEmployeeId: raterEmployeeIdOrError } : {}),
    });
    return okResult(parseQuestionnaireSaveDraftOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to save questionnaire draft."),
    );
  }
};

const runQuestionnaireSubmit = async (
  request: DispatchOperationInput,
): Promise<OperationResult<QuestionnaireSubmitOutput>> => {
  if (!hasRole(request, ["hr_admin", "manager", "employee"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot submit questionnaire.", {
        operation: "questionnaire.submit",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: QuestionnaireSubmitInput;
  try {
    parsedInput = parseQuestionnaireSubmitInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid questionnaire.submit input."),
    );
  }

  try {
    const raterEmployeeIdOrError = await resolveRaterEmployeeId(
      request,
      companyIdOrError,
      "questionnaire.submit",
    );
    if (typeof raterEmployeeIdOrError !== "string" && raterEmployeeIdOrError !== undefined) {
      return raterEmployeeIdOrError;
    }

    const output = await submitQuestionnaire({
      questionnaireId: parsedInput.questionnaireId,
      companyId: companyIdOrError,
      ...(raterEmployeeIdOrError ? { raterEmployeeId: raterEmployeeIdOrError } : {}),
    });
    return okResult(parseQuestionnaireSubmitOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to submit questionnaire."));
  }
};

const runAiRunForCampaign = async (
  request: DispatchOperationInput,
): Promise<OperationResult<AiRunForCampaignOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can run AI processing.", {
        operation: "ai.runForCampaign",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: AiRunForCampaignInput;
  try {
    parsedInput = parseAiRunForCampaignInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid ai.runForCampaign input."),
    );
  }

  try {
    const output = await runAiForCampaign({
      campaignId: parsedInput.campaignId,
      companyId: companyIdOrError,
    });
    return okResult(parseAiRunForCampaignOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to run AI processing."));
  }
};

export const dispatchOperation = (
  request: DispatchOperationInput,
): Promise<
  OperationResult<
    | SystemPingOutput
    | CompanyUpdateProfileOutput
    | EmployeeUpsertOutput
    | EmployeeListActiveOutput
    | MembershipListOutput
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
    | QuestionnaireSubmitOutput
  >
> => {
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

  switch (parsedRequest.operation) {
    case "system.ping":
      return Promise.resolve(runSystemPing(parsedRequest.input));
    case "company.updateProfile":
      return Promise.resolve(runCompanyUpdateProfile(parsedRequest));
    case "model.version.create":
      return runModelVersionCreate(parsedRequest);
    case "model.version.list":
      return runModelVersionList(parsedRequest);
    case "campaign.list":
      return runCampaignList(parsedRequest);
    case "campaign.get":
      return runCampaignGet(parsedRequest);
    case "campaign.create":
      return runCampaignCreate(parsedRequest);
    case "campaign.updateDraft":
      return runCampaignUpdateDraft(parsedRequest);
    case "campaign.start":
      return runCampaignStart(parsedRequest);
    case "campaign.stop":
      return runCampaignStop(parsedRequest);
    case "campaign.end":
      return runCampaignEnd(parsedRequest);
    case "campaign.setModelVersion":
      return runCampaignSetModelVersion(parsedRequest);
    case "campaign.weights.set":
      return runCampaignWeightsSet(parsedRequest);
    case "campaign.participants.add":
      return runCampaignParticipantsAdd(parsedRequest);
    case "campaign.participants.remove":
      return runCampaignParticipantsRemove(parsedRequest);
    case "employee.upsert":
      return runEmployeeUpsert(parsedRequest);
    case "employee.listActive":
      return runEmployeeListActive(parsedRequest);
    case "membership.list":
      return runMembershipList(parsedRequest);
    case "org.department.move":
      return runOrgDepartmentMove(parsedRequest);
    case "org.manager.set":
      return runOrgManagerSet(parsedRequest);
    case "campaign.snapshot.list":
      return runCampaignSnapshotList(parsedRequest);
    case "campaign.progress.get":
      return runCampaignProgressGet(parsedRequest);
    case "notifications.generateReminders":
      return runNotificationsGenerateReminders(parsedRequest);
    case "notifications.dispatchOutbox":
      return runNotificationsDispatchOutbox(parsedRequest);
    case "results.getMyDashboard":
      return runResultsGetMyDashboard(parsedRequest);
    case "results.getTeamDashboard":
      return runResultsGetTeamDashboard(parsedRequest);
    case "results.getHrView":
      return runResultsGetHrView(parsedRequest);
    case "campaign.participants.addFromDepartments":
      return runCampaignParticipantsAddFromDepartments(parsedRequest);
    case "matrix.generateSuggested":
      return runMatrixGenerateSuggested(parsedRequest);
    case "matrix.set":
      return runMatrixSet(parsedRequest);
    case "ai.runForCampaign":
      return runAiRunForCampaign(parsedRequest);
    case "questionnaire.listAssigned":
      return runQuestionnaireListAssigned(parsedRequest);
    case "questionnaire.getDraft":
      return runQuestionnaireGetDraft(parsedRequest);
    case "questionnaire.saveDraft":
      return runQuestionnaireSaveDraft(parsedRequest);
    case "questionnaire.submit":
      return runQuestionnaireSubmit(parsedRequest);
    case "client.setActiveCompany":
      return Promise.resolve(
        errorResult(
          createOperationError(
            "not_found",
            "Operation client.setActiveCompany is client-local and unavailable in core dispatcher.",
          ),
        ),
      );
    case "seed.run":
      return Promise.resolve(
        errorResult(
          createOperationError(
            "not_found",
            "Operation seed.run is not available in core dispatcher.",
          ),
        ),
      );
    default:
      return Promise.resolve(
        errorResult(
          createOperationError("not_found", `Unknown operation: ${parsedRequest.operation}`),
        ),
      );
  }
};

export const coreReady = true;

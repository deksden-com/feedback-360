import {
  type AiRunForCampaignInput,
  type AiRunForCampaignOutput,
  type CampaignCreateInput,
  type CampaignCreateOutput,
  type CampaignParticipantsAddFromDepartmentsInput,
  type CampaignParticipantsAddFromDepartmentsOutput,
  type CampaignParticipantsMutationInput,
  type CampaignParticipantsMutationOutput,
  type CampaignSetModelVersionInput,
  type CampaignSetModelVersionOutput,
  type CampaignSnapshotListInput,
  type CampaignSnapshotListOutput,
  type CampaignTransitionInput,
  type CampaignTransitionOutput,
  type CompanyUpdateProfileInput,
  type CompanyUpdateProfileOutput,
  type DispatchOperationInput,
  type EmployeeListActiveInput,
  type EmployeeListActiveOutput,
  type EmployeeUpsertInput,
  type EmployeeUpsertOutput,
  type MatrixGenerateSuggestedInput,
  type MatrixGenerateSuggestedOutput,
  type ModelVersionCreateInput,
  type ModelVersionCreateOutput,
  type OperationResult,
  type OrgDepartmentMoveInput,
  type OrgDepartmentMoveOutput,
  type OrgManagerSetInput,
  type OrgManagerSetOutput,
  type QuestionnaireListAssignedInput,
  type QuestionnaireListAssignedOutput,
  type QuestionnaireSaveDraftInput,
  type QuestionnaireSaveDraftOutput,
  type QuestionnaireSubmitInput,
  type QuestionnaireSubmitOutput,
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
  parseCampaignParticipantsAddFromDepartmentsInput,
  parseCampaignParticipantsAddFromDepartmentsOutput,
  parseCampaignParticipantsMutationInput,
  parseCampaignParticipantsMutationOutput,
  parseCampaignSetModelVersionInput,
  parseCampaignSetModelVersionOutput,
  parseCampaignSnapshotListInput,
  parseCampaignSnapshotListOutput,
  parseCampaignTransitionInput,
  parseCampaignTransitionOutput,
  parseCompanyUpdateProfileInput,
  parseCompanyUpdateProfileOutput,
  parseDispatchOperationInput,
  parseEmployeeListActiveInput,
  parseEmployeeListActiveOutput,
  parseEmployeeUpsertInput,
  parseEmployeeUpsertOutput,
  parseMatrixGenerateSuggestedInput,
  parseMatrixGenerateSuggestedOutput,
  parseModelVersionCreateInput,
  parseModelVersionCreateOutput,
  parseOrgDepartmentMoveInput,
  parseOrgDepartmentMoveOutput,
  parseOrgManagerSetInput,
  parseOrgManagerSetOutput,
  parseQuestionnaireListAssignedInput,
  parseQuestionnaireListAssignedOutput,
  parseQuestionnaireSaveDraftInput,
  parseQuestionnaireSaveDraftOutput,
  parseQuestionnaireSubmitInput,
  parseQuestionnaireSubmitOutput,
  parseSystemPingInput,
  parseSystemPingOutput,
} from "@feedback-360/api-contract";
import {
  addCampaignParticipants,
  addCampaignParticipantsFromDepartments,
  createCampaign,
  createModelVersion,
  endCampaign,
  generateSuggestedMatrix,
  listActiveEmployees,
  listAssignedQuestionnaires,
  listCampaignEmployeeSnapshots,
  moveEmployeeDepartment,
  removeCampaignParticipants,
  runAiForCampaign,
  saveQuestionnaireDraft,
  setCampaignModelVersion,
  setEmployeeManager,
  startCampaign,
  stopCampaign,
  submitQuestionnaire,
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
    const output = await listAssignedQuestionnaires({
      campaignId: parsedInput.campaignId,
      status: parsedInput.status,
      companyId: companyIdOrError,
    });
    return okResult(parseQuestionnaireListAssignedOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to list assigned questionnaires."),
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
    const output = await saveQuestionnaireDraft({
      questionnaireId: parsedInput.questionnaireId,
      draft: parsedInput.draft,
      companyId: companyIdOrError,
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
    const output = await submitQuestionnaire({
      questionnaireId: parsedInput.questionnaireId,
      companyId: companyIdOrError,
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
    | CampaignSetModelVersionOutput
    | CampaignParticipantsMutationOutput
    | CampaignTransitionOutput
    | OrgDepartmentMoveOutput
    | OrgManagerSetOutput
    | CampaignSnapshotListOutput
    | CampaignParticipantsAddFromDepartmentsOutput
    | MatrixGenerateSuggestedOutput
    | AiRunForCampaignOutput
    | ModelVersionCreateOutput
    | CampaignCreateOutput
    | QuestionnaireListAssignedOutput
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
    case "campaign.create":
      return runCampaignCreate(parsedRequest);
    case "campaign.start":
      return runCampaignStart(parsedRequest);
    case "campaign.stop":
      return runCampaignStop(parsedRequest);
    case "campaign.end":
      return runCampaignEnd(parsedRequest);
    case "campaign.setModelVersion":
      return runCampaignSetModelVersion(parsedRequest);
    case "campaign.participants.add":
      return runCampaignParticipantsAdd(parsedRequest);
    case "campaign.participants.remove":
      return runCampaignParticipantsRemove(parsedRequest);
    case "employee.upsert":
      return runEmployeeUpsert(parsedRequest);
    case "employee.listActive":
      return runEmployeeListActive(parsedRequest);
    case "org.department.move":
      return runOrgDepartmentMove(parsedRequest);
    case "org.manager.set":
      return runOrgManagerSet(parsedRequest);
    case "campaign.snapshot.list":
      return runCampaignSnapshotList(parsedRequest);
    case "campaign.participants.addFromDepartments":
      return runCampaignParticipantsAddFromDepartments(parsedRequest);
    case "matrix.generateSuggested":
      return runMatrixGenerateSuggested(parsedRequest);
    case "ai.runForCampaign":
      return runAiRunForCampaign(parsedRequest);
    case "questionnaire.listAssigned":
      return runQuestionnaireListAssigned(parsedRequest);
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

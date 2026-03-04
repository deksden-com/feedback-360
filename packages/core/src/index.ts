import {
  type CompanyUpdateProfileInput,
  type CompanyUpdateProfileOutput,
  type DispatchOperationInput,
  type EmployeeListActiveInput,
  type EmployeeListActiveOutput,
  type EmployeeUpsertInput,
  type EmployeeUpsertOutput,
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
  parseCompanyUpdateProfileInput,
  parseCompanyUpdateProfileOutput,
  parseDispatchOperationInput,
  parseEmployeeListActiveInput,
  parseEmployeeListActiveOutput,
  parseEmployeeUpsertInput,
  parseEmployeeUpsertOutput,
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
  listActiveEmployees,
  listAssignedQuestionnaires,
  moveEmployeeDepartment,
  saveQuestionnaireDraft,
  setEmployeeManager,
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

export const dispatchOperation = (
  request: DispatchOperationInput,
): Promise<
  OperationResult<
    | SystemPingOutput
    | CompanyUpdateProfileOutput
    | EmployeeUpsertOutput
    | EmployeeListActiveOutput
    | OrgDepartmentMoveOutput
    | OrgManagerSetOutput
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
    case "employee.upsert":
      return runEmployeeUpsert(parsedRequest);
    case "employee.listActive":
      return runEmployeeListActive(parsedRequest);
    case "org.department.move":
      return runOrgDepartmentMove(parsedRequest);
    case "org.manager.set":
      return runOrgManagerSet(parsedRequest);
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

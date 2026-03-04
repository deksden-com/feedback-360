import {
  type ClientSetActiveCompanyOutput,
  type DispatchOperationInput,
  type EmployeeListActiveInput,
  type EmployeeListActiveOutput,
  type EmployeeUpsertInput,
  type EmployeeUpsertOutput,
  type OperationContext,
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
  type SeedRunInput,
  type SeedRunOutput,
  type SystemPingOutput,
  createOperationError,
  errorFromUnknown,
  errorResult,
  okResult,
  parseClientSetActiveCompanyInput,
  parseClientSetActiveCompanyOutput,
  parseDispatchOperationInput,
  parseEmployeeListActiveInput,
  parseEmployeeListActiveOutput,
  parseEmployeeUpsertInput,
  parseEmployeeUpsertOutput,
  parseOperationResult,
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
  parseSeedRunInput,
  parseSeedRunOutput,
  parseSystemPingOutput,
} from "@feedback-360/api-contract";
import { dispatchOperation } from "@feedback-360/core";
import { runSeedScenario } from "@feedback-360/db";

export type OperationTransport = {
  invoke(request: DispatchOperationInput): Promise<unknown>;
};

type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<{ json(): Promise<unknown> }>;

export type CreateHttpTransportOptions = {
  baseUrl: string;
  endpointPath?: string;
  fetchFn?: FetchLike;
};

type InvokeOperationParams<Output> = {
  operation: string;
  input: unknown;
  context?: OperationContext;
  parseOutput: (value: unknown) => Output;
};

export type Feedback360Client = {
  seedRun(input: SeedRunInput): Promise<SeedRunOutput>;
  systemPing(context?: OperationContext): Promise<OperationResult<SystemPingOutput>>;
  employeeUpsert(
    input: EmployeeUpsertInput,
    context?: OperationContext,
  ): Promise<OperationResult<EmployeeUpsertOutput>>;
  employeeListActive(
    input?: EmployeeListActiveInput,
    context?: OperationContext,
  ): Promise<OperationResult<EmployeeListActiveOutput>>;
  orgDepartmentMove(
    input: OrgDepartmentMoveInput,
    context?: OperationContext,
  ): Promise<OperationResult<OrgDepartmentMoveOutput>>;
  orgManagerSet(
    input: OrgManagerSetInput,
    context?: OperationContext,
  ): Promise<OperationResult<OrgManagerSetOutput>>;
  questionnaireListAssigned(
    input: QuestionnaireListAssignedInput,
    context?: OperationContext,
  ): Promise<OperationResult<QuestionnaireListAssignedOutput>>;
  questionnaireSaveDraft(
    input: QuestionnaireSaveDraftInput,
    context?: OperationContext,
  ): Promise<OperationResult<QuestionnaireSaveDraftOutput>>;
  questionnaireSubmit(
    input: QuestionnaireSubmitInput,
    context?: OperationContext,
  ): Promise<OperationResult<QuestionnaireSubmitOutput>>;
  setActiveCompany(companyId: string): OperationResult<ClientSetActiveCompanyOutput>;
  getActiveCompany(): string | undefined;
  invokeOperation<Output>(params: InvokeOperationParams<Output>): Promise<OperationResult<Output>>;
};

export const createInprocTransport = (): OperationTransport => {
  return {
    invoke: async (request) => dispatchOperation(request),
  };
};

export const createHttpTransport = (options: CreateHttpTransportOptions): OperationTransport => {
  const endpointPath = options.endpointPath ?? "/api/v1/operations";
  const normalizedBaseUrl = options.baseUrl.endsWith("/")
    ? options.baseUrl.slice(0, -1)
    : options.baseUrl;
  const endpointUrl = `${normalizedBaseUrl}${endpointPath}`;
  const fetchImpl: FetchLike = options.fetchFn ?? ((input, init) => fetch(input, init));

  return {
    invoke: async (request) => {
      const response = await fetchImpl(endpointUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(request),
      });

      return response.json();
    },
  };
};

export const createClient = (transport: OperationTransport): Feedback360Client => {
  let activeCompanyId: string | undefined;

  const withActiveCompany = (context?: OperationContext): OperationContext => {
    if (!activeCompanyId) {
      return context ?? {};
    }

    if (context?.companyId) {
      return context;
    }

    return {
      ...(context ?? {}),
      companyId: activeCompanyId,
    };
  };

  const invokeOperation = async <Output>({
    operation,
    input,
    context,
    parseOutput,
  }: InvokeOperationParams<Output>): Promise<OperationResult<Output>> => {
    let request: DispatchOperationInput;
    try {
      request = parseDispatchOperationInput({
        operation,
        input,
        context: withActiveCompany(context),
      });
    } catch (error) {
      return errorResult(errorFromUnknown(error, "invalid_input", "Invalid operation request."));
    }

    let rawResult: unknown;
    try {
      rawResult = await transport.invoke(request);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Operation transport invocation failed."),
      );
    }

    try {
      return parseOperationResult(rawResult, parseOutput);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid operation result payload."),
      );
    }
  };

  return {
    seedRun: async (input) => {
      const parsedInput = parseSeedRunInput(input);
      const output = await runSeedScenario(parsedInput);
      return parseSeedRunOutput(output);
    },

    systemPing: async (context) => {
      return invokeOperation({
        operation: "system.ping",
        input: {},
        context,
        parseOutput: parseSystemPingOutput,
      });
    },

    employeeUpsert: async (input, context) => {
      let parsedInput: EmployeeUpsertInput;
      try {
        parsedInput = parseEmployeeUpsertInput(input);
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid employeeUpsert input."),
        );
      }

      return invokeOperation({
        operation: "employee.upsert",
        input: parsedInput,
        context,
        parseOutput: parseEmployeeUpsertOutput,
      });
    },

    employeeListActive: async (input, context) => {
      let parsedInput: EmployeeListActiveInput;
      try {
        parsedInput = parseEmployeeListActiveInput(input ?? {});
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid employeeListActive input."),
        );
      }

      return invokeOperation({
        operation: "employee.listActive",
        input: parsedInput,
        context,
        parseOutput: parseEmployeeListActiveOutput,
      });
    },

    orgDepartmentMove: async (input, context) => {
      let parsedInput: OrgDepartmentMoveInput;
      try {
        parsedInput = parseOrgDepartmentMoveInput(input);
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid orgDepartmentMove input."),
        );
      }

      return invokeOperation({
        operation: "org.department.move",
        input: parsedInput,
        context,
        parseOutput: parseOrgDepartmentMoveOutput,
      });
    },

    orgManagerSet: async (input, context) => {
      let parsedInput: OrgManagerSetInput;
      try {
        parsedInput = parseOrgManagerSetInput(input);
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid orgManagerSet input."),
        );
      }

      return invokeOperation({
        operation: "org.manager.set",
        input: parsedInput,
        context,
        parseOutput: parseOrgManagerSetOutput,
      });
    },

    questionnaireListAssigned: async (input, context) => {
      let parsedInput: QuestionnaireListAssignedInput;
      try {
        parsedInput = parseQuestionnaireListAssignedInput(input);
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid questionnaireListAssigned input."),
        );
      }

      return invokeOperation({
        operation: "questionnaire.listAssigned",
        input: parsedInput,
        context,
        parseOutput: parseQuestionnaireListAssignedOutput,
      });
    },

    questionnaireSaveDraft: async (input, context) => {
      let parsedInput: QuestionnaireSaveDraftInput;
      try {
        parsedInput = parseQuestionnaireSaveDraftInput(input);
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid questionnaireSaveDraft input."),
        );
      }

      return invokeOperation({
        operation: "questionnaire.saveDraft",
        input: parsedInput,
        context,
        parseOutput: parseQuestionnaireSaveDraftOutput,
      });
    },

    questionnaireSubmit: async (input, context) => {
      let parsedInput: QuestionnaireSubmitInput;
      try {
        parsedInput = parseQuestionnaireSubmitInput(input);
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid questionnaireSubmit input."),
        );
      }

      return invokeOperation({
        operation: "questionnaire.submit",
        input: parsedInput,
        context,
        parseOutput: parseQuestionnaireSubmitOutput,
      });
    },

    setActiveCompany: (companyId) => {
      try {
        const parsedInput = parseClientSetActiveCompanyInput({ companyId });
        activeCompanyId = parsedInput.companyId;
        return okResult(parseClientSetActiveCompanyOutput(parsedInput));
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid active company payload."),
        );
      }
    },

    getActiveCompany: () => {
      return activeCompanyId;
    },

    invokeOperation,
  };
};

export const createInprocClient = (): Feedback360Client => {
  return createClient(createInprocTransport());
};

export const clientReady = true;

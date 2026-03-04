import {
  type AiRunForCampaignInput,
  type AiRunForCampaignOutput,
  type CampaignCreateInput,
  type CampaignCreateOutput,
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
  type CampaignWeightsSetInput,
  type CampaignWeightsSetOutput,
  type ClientSetActiveCompanyOutput,
  type DispatchOperationInput,
  type EmployeeListActiveInput,
  type EmployeeListActiveOutput,
  type EmployeeUpsertInput,
  type EmployeeUpsertOutput,
  type MatrixGenerateSuggestedInput,
  type MatrixGenerateSuggestedOutput,
  type MatrixSetInput,
  type MatrixSetOutput,
  type ModelVersionCreateInput,
  type ModelVersionCreateOutput,
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
  type ResultsGetHrViewInput,
  type ResultsGetHrViewOutput,
  type SeedRunInput,
  type SeedRunOutput,
  type SystemPingOutput,
  createOperationError,
  errorFromUnknown,
  errorResult,
  okResult,
  parseAiRunForCampaignInput,
  parseAiRunForCampaignOutput,
  parseCampaignCreateInput,
  parseCampaignCreateOutput,
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
  parseCampaignWeightsSetInput,
  parseCampaignWeightsSetOutput,
  parseClientSetActiveCompanyInput,
  parseClientSetActiveCompanyOutput,
  parseDispatchOperationInput,
  parseEmployeeListActiveInput,
  parseEmployeeListActiveOutput,
  parseEmployeeUpsertInput,
  parseEmployeeUpsertOutput,
  parseMatrixGenerateSuggestedInput,
  parseMatrixGenerateSuggestedOutput,
  parseMatrixSetInput,
  parseMatrixSetOutput,
  parseModelVersionCreateInput,
  parseModelVersionCreateOutput,
  parseOperationContext,
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
  parseResultsGetHrViewInput,
  parseResultsGetHrViewOutput,
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
  modelVersionCreate(
    input: ModelVersionCreateInput,
    context?: OperationContext,
  ): Promise<OperationResult<ModelVersionCreateOutput>>;
  campaignCreate(
    input: CampaignCreateInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignCreateOutput>>;
  campaignSetModelVersion(
    input: CampaignSetModelVersionInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignSetModelVersionOutput>>;
  campaignWeightsSet(
    input: CampaignWeightsSetInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignWeightsSetOutput>>;
  campaignParticipantsAdd(
    input: CampaignParticipantsMutationInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignParticipantsMutationOutput>>;
  campaignParticipantsRemove(
    input: CampaignParticipantsMutationInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignParticipantsMutationOutput>>;
  campaignStart(
    input: CampaignTransitionInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignTransitionOutput>>;
  campaignStop(
    input: CampaignTransitionInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignTransitionOutput>>;
  campaignEnd(
    input: CampaignTransitionInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignTransitionOutput>>;
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
  campaignSnapshotList(
    input: CampaignSnapshotListInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignSnapshotListOutput>>;
  campaignProgressGet(
    input: CampaignProgressGetInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignProgressGetOutput>>;
  campaignParticipantsAddFromDepartments(
    input: CampaignParticipantsAddFromDepartmentsInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignParticipantsAddFromDepartmentsOutput>>;
  matrixGenerateSuggested(
    input: MatrixGenerateSuggestedInput,
    context?: OperationContext,
  ): Promise<OperationResult<MatrixGenerateSuggestedOutput>>;
  matrixSet(
    input: MatrixSetInput,
    context?: OperationContext,
  ): Promise<OperationResult<MatrixSetOutput>>;
  aiRunForCampaign(
    input: AiRunForCampaignInput,
    context?: OperationContext,
  ): Promise<OperationResult<AiRunForCampaignOutput>>;
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
  resultsGetHrView(
    input: ResultsGetHrViewInput,
    context?: OperationContext,
  ): Promise<OperationResult<ResultsGetHrViewOutput>>;
  setActiveContext(context: OperationContext): OperationResult<OperationContext>;
  getActiveContext(): OperationContext;
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
  let activeContext: OperationContext = {};

  const withActiveContext = (context?: OperationContext): OperationContext => {
    if (!context) {
      return { ...activeContext };
    }

    return {
      ...activeContext,
      ...context,
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
        context: withActiveContext(context),
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

    modelVersionCreate: async (input, context) => {
      let parsedInput: ModelVersionCreateInput;
      try {
        parsedInput = parseModelVersionCreateInput(input);
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid modelVersionCreate input."),
        );
      }

      return invokeOperation({
        operation: "model.version.create",
        input: parsedInput,
        context,
        parseOutput: parseModelVersionCreateOutput,
      });
    },

    campaignCreate: async (input, context) => {
      let parsedInput: CampaignCreateInput;
      try {
        parsedInput = parseCampaignCreateInput(input);
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid campaignCreate input."),
        );
      }

      return invokeOperation({
        operation: "campaign.create",
        input: parsedInput,
        context,
        parseOutput: parseCampaignCreateOutput,
      });
    },

    campaignSetModelVersion: async (input, context) => {
      let parsedInput: CampaignSetModelVersionInput;
      try {
        parsedInput = parseCampaignSetModelVersionInput(input);
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid campaignSetModelVersion input."),
        );
      }

      return invokeOperation({
        operation: "campaign.setModelVersion",
        input: parsedInput,
        context,
        parseOutput: parseCampaignSetModelVersionOutput,
      });
    },

    campaignParticipantsAdd: async (input, context) => {
      let parsedInput: CampaignParticipantsMutationInput;
      try {
        parsedInput = parseCampaignParticipantsMutationInput(input);
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid campaignParticipantsAdd input."),
        );
      }

      return invokeOperation({
        operation: "campaign.participants.add",
        input: parsedInput,
        context,
        parseOutput: parseCampaignParticipantsMutationOutput,
      });
    },

    campaignWeightsSet: async (input, context) => {
      let parsedInput: CampaignWeightsSetInput;
      try {
        parsedInput = parseCampaignWeightsSetInput(input);
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid campaignWeightsSet input."),
        );
      }

      return invokeOperation({
        operation: "campaign.weights.set",
        input: parsedInput,
        context,
        parseOutput: parseCampaignWeightsSetOutput,
      });
    },

    campaignParticipantsRemove: async (input, context) => {
      let parsedInput: CampaignParticipantsMutationInput;
      try {
        parsedInput = parseCampaignParticipantsMutationInput(input);
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid campaignParticipantsRemove input."),
        );
      }

      return invokeOperation({
        operation: "campaign.participants.remove",
        input: parsedInput,
        context,
        parseOutput: parseCampaignParticipantsMutationOutput,
      });
    },

    campaignStart: async (input, context) => {
      let parsedInput: CampaignTransitionInput;
      try {
        parsedInput = parseCampaignTransitionInput(input);
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid campaignStart input."),
        );
      }

      return invokeOperation({
        operation: "campaign.start",
        input: parsedInput,
        context,
        parseOutput: parseCampaignTransitionOutput,
      });
    },

    campaignStop: async (input, context) => {
      let parsedInput: CampaignTransitionInput;
      try {
        parsedInput = parseCampaignTransitionInput(input);
      } catch (error) {
        return errorResult(errorFromUnknown(error, "invalid_input", "Invalid campaignStop input."));
      }

      return invokeOperation({
        operation: "campaign.stop",
        input: parsedInput,
        context,
        parseOutput: parseCampaignTransitionOutput,
      });
    },

    campaignEnd: async (input, context) => {
      let parsedInput: CampaignTransitionInput;
      try {
        parsedInput = parseCampaignTransitionInput(input);
      } catch (error) {
        return errorResult(errorFromUnknown(error, "invalid_input", "Invalid campaignEnd input."));
      }

      return invokeOperation({
        operation: "campaign.end",
        input: parsedInput,
        context,
        parseOutput: parseCampaignTransitionOutput,
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

    campaignSnapshotList: async (input, context) => {
      let parsedInput: CampaignSnapshotListInput;
      try {
        parsedInput = parseCampaignSnapshotListInput(input);
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid campaignSnapshotList input."),
        );
      }

      return invokeOperation({
        operation: "campaign.snapshot.list",
        input: parsedInput,
        context,
        parseOutput: parseCampaignSnapshotListOutput,
      });
    },

    campaignProgressGet: async (input, context) => {
      let parsedInput: CampaignProgressGetInput;
      try {
        parsedInput = parseCampaignProgressGetInput(input);
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid campaignProgressGet input."),
        );
      }

      return invokeOperation({
        operation: "campaign.progress.get",
        input: parsedInput,
        context,
        parseOutput: parseCampaignProgressGetOutput,
      });
    },

    campaignParticipantsAddFromDepartments: async (input, context) => {
      let parsedInput: CampaignParticipantsAddFromDepartmentsInput;
      try {
        parsedInput = parseCampaignParticipantsAddFromDepartmentsInput(input);
      } catch (error) {
        return errorResult(
          errorFromUnknown(
            error,
            "invalid_input",
            "Invalid campaignParticipantsAddFromDepartments input.",
          ),
        );
      }

      return invokeOperation({
        operation: "campaign.participants.addFromDepartments",
        input: parsedInput,
        context,
        parseOutput: parseCampaignParticipantsAddFromDepartmentsOutput,
      });
    },

    matrixGenerateSuggested: async (input, context) => {
      let parsedInput: MatrixGenerateSuggestedInput;
      try {
        parsedInput = parseMatrixGenerateSuggestedInput(input);
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid matrixGenerateSuggested input."),
        );
      }

      return invokeOperation({
        operation: "matrix.generateSuggested",
        input: parsedInput,
        context,
        parseOutput: parseMatrixGenerateSuggestedOutput,
      });
    },

    matrixSet: async (input, context) => {
      let parsedInput: MatrixSetInput;
      try {
        parsedInput = parseMatrixSetInput(input);
      } catch (error) {
        return errorResult(errorFromUnknown(error, "invalid_input", "Invalid matrixSet input."));
      }

      return invokeOperation({
        operation: "matrix.set",
        input: parsedInput,
        context,
        parseOutput: parseMatrixSetOutput,
      });
    },

    aiRunForCampaign: async (input, context) => {
      let parsedInput: AiRunForCampaignInput;
      try {
        parsedInput = parseAiRunForCampaignInput(input);
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid aiRunForCampaign input."),
        );
      }

      return invokeOperation({
        operation: "ai.runForCampaign",
        input: parsedInput,
        context,
        parseOutput: parseAiRunForCampaignOutput,
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

    resultsGetHrView: async (input, context) => {
      let parsedInput: ResultsGetHrViewInput;
      try {
        parsedInput = parseResultsGetHrViewInput(input);
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid resultsGetHrView input."),
        );
      }

      return invokeOperation({
        operation: "results.getHrView",
        input: parsedInput,
        context,
        parseOutput: parseResultsGetHrViewOutput,
      });
    },

    setActiveContext: (context) => {
      try {
        const parsedContext = parseOperationContext(context);
        activeContext = {
          ...activeContext,
          ...parsedContext,
        };
        return okResult({ ...activeContext });
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid active context payload."),
        );
      }
    },

    getActiveContext: () => {
      return { ...activeContext };
    },

    setActiveCompany: (companyId) => {
      try {
        const parsedInput = parseClientSetActiveCompanyInput({ companyId });
        activeContext = {
          ...activeContext,
          companyId: parsedInput.companyId,
        };
        return okResult(parseClientSetActiveCompanyOutput(parsedInput));
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid active company payload."),
        );
      }
    },

    getActiveCompany: () => {
      return activeContext.companyId;
    },

    invokeOperation,
  };
};

export const createInprocClient = (): Feedback360Client => {
  return createClient(createInprocTransport());
};

export const clientReady = true;

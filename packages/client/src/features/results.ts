import {
  type OperationContext,
  type OperationResult,
  type ResultsGetHrViewInput,
  type ResultsGetHrViewOutput,
  type ResultsGetMyDashboardInput,
  type ResultsGetMyDashboardOutput,
  type ResultsGetTeamDashboardInput,
  type ResultsGetTeamDashboardOutput,
  errorFromUnknown,
  errorResult,
  parseResultsGetHrViewInput,
  parseResultsGetHrViewOutput,
  parseResultsGetMyDashboardInput,
  parseResultsGetMyDashboardOutput,
  parseResultsGetTeamDashboardInput,
  parseResultsGetTeamDashboardOutput,
} from "@feedback-360/api-contract";

import type { ClientRuntime } from "../shared/runtime";

export type ResultsClientMethods = {
  resultsGetHrView(
    input: ResultsGetHrViewInput,
    context?: OperationContext,
  ): Promise<OperationResult<ResultsGetHrViewOutput>>;
  resultsGetMyDashboard(
    input: ResultsGetMyDashboardInput,
    context?: OperationContext,
  ): Promise<OperationResult<ResultsGetMyDashboardOutput>>;
  resultsGetTeamDashboard(
    input: ResultsGetTeamDashboardInput,
    context?: OperationContext,
  ): Promise<OperationResult<ResultsGetTeamDashboardOutput>>;
};

export const createResultsClientMethods = (runtime: ClientRuntime): ResultsClientMethods => ({
  resultsGetHrView: async (input, context) => {
    let parsedInput: ResultsGetHrViewInput;
    try {
      parsedInput = parseResultsGetHrViewInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid resultsGetHrView input."),
      );
    }

    return runtime.invokeOperation({
      operation: "results.getHrView",
      input: parsedInput,
      context,
      parseOutput: parseResultsGetHrViewOutput,
    });
  },

  resultsGetMyDashboard: async (input, context) => {
    let parsedInput: ResultsGetMyDashboardInput;
    try {
      parsedInput = parseResultsGetMyDashboardInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid resultsGetMyDashboard input."),
      );
    }

    return runtime.invokeOperation({
      operation: "results.getMyDashboard",
      input: parsedInput,
      context,
      parseOutput: parseResultsGetMyDashboardOutput,
    });
  },

  resultsGetTeamDashboard: async (input, context) => {
    let parsedInput: ResultsGetTeamDashboardInput;
    try {
      parsedInput = parseResultsGetTeamDashboardInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid resultsGetTeamDashboard input."),
      );
    }

    return runtime.invokeOperation({
      operation: "results.getTeamDashboard",
      input: parsedInput,
      context,
      parseOutput: parseResultsGetTeamDashboardOutput,
    });
  },
});

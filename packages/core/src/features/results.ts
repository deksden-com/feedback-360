/**
 * Results feature-area entrypoint.
 * @docs .memory-bank/spec/domain/results-visibility.md
 * @see .memory-bank/spec/domain/calculations.md
 * @see .memory-bank/spec/domain/anonymity-policy.md
 */
import {
  type DispatchOperationInput,
  type OperationResult,
  type ResultsGetHrViewInput,
  type ResultsGetHrViewOutput,
  type ResultsGetMyDashboardInput,
  type ResultsGetMyDashboardOutput,
  type ResultsGetTeamDashboardInput,
  type ResultsGetTeamDashboardOutput,
  type ResultsOpenTextItem,
  createOperationError,
  errorFromUnknown,
  errorResult,
  okResult,
  parseResultsGetHrViewInput,
  parseResultsGetHrViewOutput,
  parseResultsGetMyDashboardInput,
  parseResultsGetMyDashboardOutput,
  parseResultsGetTeamDashboardInput,
  parseResultsGetTeamDashboardOutput,
} from "@feedback-360/api-contract";
import {
  getEmployeeIdByUserInCompany,
  getResultsHrView,
  isCampaignSubjectManagedByEmployee,
} from "@feedback-360/db";

import { ensureContextCompany, hasRole } from "../shared/context";

export const buildDashboardFromHrResult = (
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

export const runResultsGetHrView = async (
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
            openText: output.openText?.map(
              (item): ResultsOpenTextItem => ({
                competencyId: item.competencyId,
                group: item.group,
                count: item.count,
                ...(typeof item.processedText === "string"
                  ? { processedText: item.processedText }
                  : {}),
                ...(typeof item.summaryText === "string" ? { summaryText: item.summaryText } : {}),
              }),
            ),
          }
        : output;
    return okResult(parseResultsGetHrViewOutput(hrViewOutput));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to get HR results."));
  }
};

export const runResultsGetMyDashboard = async (
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

  const contextEmployeeId = request.context?.employeeId;
  const userId = request.context?.userId;
  if (!contextEmployeeId && !userId) {
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
    const employeeId =
      contextEmployeeId ??
      (await getEmployeeIdByUserInCompany({
        companyId: companyIdOrError,
        userId: userId as string,
      }));
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

export const runResultsGetTeamDashboard = async (
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

  const contextEmployeeId = request.context?.employeeId;
  const userId = request.context?.userId;
  if (!contextEmployeeId && !userId) {
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
    const managerEmployeeId =
      contextEmployeeId ??
      (await getEmployeeIdByUserInCompany({
        companyId: companyIdOrError,
        userId: userId as string,
      }));
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

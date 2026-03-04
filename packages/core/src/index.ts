import {
  type CompanyUpdateProfileInput,
  type CompanyUpdateProfileOutput,
  type DispatchOperationInput,
  type OperationResult,
  type SystemPingOutput,
  createOperationError,
  errorFromUnknown,
  errorResult,
  isKnownOperation,
  okResult,
  parseCompanyUpdateProfileInput,
  parseCompanyUpdateProfileOutput,
  parseDispatchOperationInput,
  parseSystemPingInput,
  parseSystemPingOutput,
} from "@feedback-360/api-contract";

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

export const dispatchOperation = (
  request: DispatchOperationInput,
): OperationResult<SystemPingOutput | CompanyUpdateProfileOutput> => {
  let parsedRequest: DispatchOperationInput;
  try {
    parsedRequest = parseDispatchOperationInput(request);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid dispatch input."));
  }

  if (!isKnownOperation(parsedRequest.operation)) {
    return errorResult(
      createOperationError("not_found", `Unknown operation: ${parsedRequest.operation}`, {
        operation: parsedRequest.operation,
      }),
    );
  }

  switch (parsedRequest.operation) {
    case "system.ping":
      return runSystemPing(parsedRequest.input);
    case "company.updateProfile":
      return runCompanyUpdateProfile(parsedRequest);
    case "client.setActiveCompany":
      return errorResult(
        createOperationError(
          "not_found",
          "Operation client.setActiveCompany is client-local and unavailable in core dispatcher.",
        ),
      );
    case "seed.run":
      return errorResult(
        createOperationError(
          "not_found",
          "Operation seed.run is not available in core dispatcher.",
        ),
      );
    default:
      return errorResult(
        createOperationError("not_found", `Unknown operation: ${parsedRequest.operation}`),
      );
  }
};

export const coreReady = true;
